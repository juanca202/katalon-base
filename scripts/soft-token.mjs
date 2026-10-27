#!/usr/bin/env node
/**
 * Soft-token (TOTP) tooling for the BIAN valid-soft-token endpoint.
 *
 * Two subcommands:
 *
 *   totp      Derives the 6-digit code from a stored TOTP secret.
 *   validate  Derives the code AND posts it to /valid-soft-token, printing
 *             the verdict.
 *
 * WHY THIS EXISTS
 *
 * `valid-soft-token` does not ask Auth0 whether a code is valid. It reads its
 * own copy of the user's TOTP secret from the `secrets_reference` table (via
 * cbf-cusrdm-security → SecretController.getSecret) and recomputes the code
 * itself. That copy is written ONLY by the mobile app, during device
 * enrolment — see `manageSecretOAuth` in BluPersonasApp's
 * `useEnrrollDevice.hook.ts`. The web portal never writes it.
 *
 * So the stored secret and the one on the phone drift apart: re-install the
 * app, swap phones, or let that save call fail silently, and every code read
 * off the phone is rejected while login keeps working — login validates
 * against Auth0 directly, not against this table.
 *
 * Feed this script the STORED secret and it produces the code that service
 * actually expects, which separates "the endpoint is broken" from "the stored
 * secret is stale". Those look identical from the UI.
 *
 * Zero dependencies — node:crypto only — so it runs from anywhere.
 *
 * ── The lookup key ─────────────────────────────────────────────────────────
 *
 * `secret/get` is keyed by `encryptedUsername`: SHA-256 of the LOWERCASED
 * username, hex-encoded. Confirmed against a real value from the audit log —
 * sha256("zevaguillo11") matches the `encryptedUsername` the backend used.
 * So the whole chain resolves from a username alone: no per-user config, works
 * for any user.
 *
 *   username → sha256(lowercase) → secret/get → base32 secret → TOTP
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *
 *   node soft-token.mjs secret   --user ZevaGuillo11    # stored base32 secret
 *   node soft-token.mjs totp     --user ZevaGuillo11    # the current 6-digit code
 *   node soft-token.mjs validate --user ZevaGuillo11    # derive + POST, print verdict
 *   node soft-token.mjs hash     --user ZevaGuillo11    # just the lookup key
 *
 *   # overrides, when you already hold a value
 *   node soft-token.mjs totp     --secret <BASE32> [--window 2]
 *   node soft-token.mjs secret   --hash <64-HEX>
 *   node soft-token.mjs validate --user ZevaGuillo11 --code 123456
 *
 * Config is read from ./.env (or --env <file>), overridden by real env vars:
 *   API_BASE_URL, X_API_KEY, APPLICATION_ID, CHANNEL, CLIENT_ID
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BIAN_PATH = '/api/cbf-cusmgt-security/v0/valid-soft-token';
const SECRET_PATH = '/api/cbf-cusrdm-security/v0/secret/get';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
/* ------------------------------------------------------------------ */
/*  Args + env                                                        */
/* ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const command = args[0];
/** Reads `--name value`, returning undefined when the flag is absent. */
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
/** Minimal .env parser — KEY=VALUE, ignoring blanks, comments and quotes. */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const envFile = argValue('--env') ?? path.join(HERE, '.env');
const env = { ...readEnvFile(envFile), ...process.env };
/* ------------------------------------------------------------------ */
/*  TOTP                                                              */
/* ------------------------------------------------------------------ */
/** Decodes RFC 4648 base32 (the encoding Auth0 hands out in the enrolment URI). */
function base32Decode(input) {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of input.replace(/=+$/, '').toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
/**
 * RFC 6238 TOTP over HMAC-SHA1 — the scheme Auth0 Guardian uses.
 *
 * @param secret - base32 secret, as stored in `secrets_reference`
 * @param epochSeconds - the instant to compute for
 */
function totp(secret, epochSeconds) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(
    BigInt(Math.floor(epochSeconds / TOTP_STEP_SECONDS))
  );
  const hmac = crypto
    .createHmac('sha1', base32Decode(secret))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(truncated % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}
/** Seconds left before the current code rolls over. */
function secondsRemaining(epochSeconds) {
  return TOTP_STEP_SECONDS - (Math.floor(epochSeconds) % TOTP_STEP_SECONDS);
}
/* ------------------------------------------------------------------ */
/*  Commands                                                          */
/* ------------------------------------------------------------------ */
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
/** Standard BIAN header set. `serviceName` tracks the path being called. */
function bianHeaders(username, bianPath) {
  const txId = `soft-token-${crypto.randomUUID()}`;
  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      userId: username ?? '',
      applicationId: env.APPLICATION_ID ?? '',
      sessionId: 'na',
      channelId: env.CHANNEL ?? 'MB',
      device: 'blu-web-portal',
      language: 'SP',
      portalId: 'PBN',
      transactionId: txId,
      ipAddress: 'na',
      transactionDate: new Date().toISOString(),
      tagsKeyValue: 'string',
      clientId: env.CLIENT_ID || 'api-clients',
      traceLevel: txId,
      serviceName: bianPath.replace(/^\/api\//, ''),
      'x-api-key': env.X_API_KEY ?? '',
    },
    txId,
  };
}
function resolveBaseUrl() {
  const baseUrl = env.API_KEY_API_URL ?? env.API_BASE_URL;
  if (!baseUrl) fail('Missing API_KEY_API_URL / API_BASE_URL');
  if (!env.X_API_KEY) fail('Missing X_API_KEY');
  return baseUrl;
}
/**
 * The `secret/get` lookup key.
 *
 * The backend derives it as SHA-256 of the lowercased username, hex-encoded,
 * so this reproduces it exactly — no per-user config. An explicit --hash still
 * wins, for the rare case a username does not round-trip through lowercase.
 */
function resolveHash(username) {
  const explicit = argValue('--hash');
  if (explicit) return explicit;
  if (username) {
    return crypto
      .createHash('sha256')
      .update(username.toLowerCase())
      .digest('hex');
  }
  return undefined;
}
/** Reads the stored secret straight out of `secrets_reference`. */
async function fetchStoredSecret(username, hash) {
  const baseUrl = resolveBaseUrl();
  const { headers } = bianHeaders(username, SECRET_PATH);
  const response = await fetch(`${baseUrl}${SECRET_PATH}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ encryptedUsername: hash }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.secret) {
    fail(`secret/get returned ${response.status}: ${JSON.stringify(body)}`);
  }
  return body.secret;
}
/**
 * The secret to compute codes with, in order of preference:
 * explicit --secret, then SOFT_TOKEN_SECRET, then a live secret/get lookup.
 */
async function resolveSecret(username) {
  const explicit = argValue('--secret') ?? env.SOFT_TOKEN_SECRET;
  if (explicit) return explicit;
  const hash = resolveHash(username);
  if (hash) {
    const secret = await fetchStoredSecret(username, hash);
    process.stderr.write(`[secret/get] ${secret}\n`);
    return secret;
  }
  fail('No secret available. Pass --user <username>, or --secret <BASE32>.');
}
function commandHash() {
  const username = argValue('--user') ?? env.SOFT_TOKEN_USER;
  const hash = resolveHash(username);
  if (!hash) fail('Missing --user <username> (or --hash)');
  process.stdout.write(`${hash}\n`);
}
async function commandSecret() {
  const username = argValue('--user') ?? env.SOFT_TOKEN_USER;
  const hash = resolveHash(username);
  if (!hash) fail('Missing --user <username> (or --hash <64-HEX>)');
  process.stdout.write(`${await fetchStoredSecret(username, hash)}\n`);
}
async function commandTotp() {
  const username = argValue('--user') ?? env.SOFT_TOKEN_USER;
  const secret = await resolveSecret(username);
  const now = Date.now() / 1000;
  const spread = Number(argValue('--window') ?? 0);
  if (!spread) {
    process.stdout.write(`${totp(secret, now)}\n`);
    process.stderr.write(`(valid for ${secondsRemaining(now)}s)\n`);
    return;
  }
  // Neighbouring windows, for checking a code that was typed a moment ago.
  for (let step = -spread; step <= spread; step++) {
    const offset = step * TOTP_STEP_SECONDS;
    const label = step === 0 ? 'now' : `${step > 0 ? '+' : ''}${offset}s`;
    process.stdout.write(
      `${String(label).padStart(6)}  ${totp(secret, now + offset)}\n`
    );
  }
}
async function commandValidate() {
  const username = argValue('--user') ?? env.SOFT_TOKEN_USER;
  if (!username) fail('Missing --user <username>');
  // An explicit --code lets you test what the PHONE shows; without it the
  // code is derived from the stored secret. Comparing the two is the whole
  // point — if they differ, the copies have drifted.
  const code =
    argValue('--code') ??
    totp(await resolveSecret(username), Date.now() / 1000);
  const baseUrl = resolveBaseUrl();
  const { headers, txId } = bianHeaders(username, BIAN_PATH);
  process.stderr.write(`POST ${baseUrl}${BIAN_PATH}\n`);
  process.stderr.write(`user: ${username}  code: ${code}  txId: ${txId}\n\n`);
  const response = await fetch(`${baseUrl}${BIAN_PATH}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, softToken: code }),
  });
  const body = await response.json().catch(() => null);
  process.stdout.write(`HTTP ${response.status}  ${JSON.stringify(body)}\n`);
  if (body?.isValid === false && !argValue('--code')) {
    process.stderr.write(
      '\nRejected a code derived from the secret you supplied, so that secret\n' +
        'is not the one the service reads for this user. Check it against\n' +
        'SecretController.getSecret.\n'
    );
  }
  process.exit(body?.isValid === true ? 0 : 1);
}
/* ------------------------------------------------------------------ */
/*  Entry                                                             */
/* ------------------------------------------------------------------ */
if (command === 'hash') {
  commandHash();
} else if (command === 'secret') {
  await commandSecret();
} else if (command === 'totp') {
  await commandTotp();
} else if (command === 'validate') {
  await commandValidate();
} else {
  fail(
    'Usage:\n' +
      '  node soft-token.mjs hash     --user <username>\n' +
      '  node soft-token.mjs secret   --user <username> | --hash <64-HEX>\n' +
      '  node soft-token.mjs totp     --user <username> | --secret <BASE32>  [--window N]\n' +
      '  node soft-token.mjs validate --user <username> [--secret <BASE32> | --code <NNNNNN>]\n\n' +
      '--user alone resolves everything: sha256(lowercase) → secret/get → TOTP.\n'
  );
}
