import { APIResponse, TestInfo } from '@playwright/test';

export interface ApiAssertion {
  name: string;
  passed: boolean;
}

/** Datos del request que `APIResponse` no expone; por defecto es un GET. */
export interface ApiRequestInfo {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/** Headers que se registran: el resto puede traer tokens o datos sensibles. */
const RELEVANT_HEADERS = ['content-type', 'accept'];

/** Tamaño máximo del body registrado; el resto se trunca. */
const MAX_BODY_CHARS = 10_000;

function pick(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    RELEVANT_HEADERS.filter(name => headers[name] !== undefined).map(name => [
      name,
      headers[name],
    ])
  );
}

function parseBody(raw: string | null): unknown {
  if (raw === null || raw === '') return undefined;
  const text =
    raw.length > MAX_BODY_CHARS ? `${raw.slice(0, MAX_BODY_CHARS)}…` : raw;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Adjunta la evidencia estructurada de una prueba API (request, response y
 * assertions) al resultado de la prueba, según ADR-007.
 *
 * `APIResponse` no expone el request que la originó: si no es un GET, pasar
 * `request` con el método, los headers y el body enviados. Solo se registran
 * los headers relevantes (`content-type`, `accept`). El resultado y la duración
 * los aporta el reporte de la propia ejecución.
 */
export async function attachApiEvidence(
  testInfo: TestInfo,
  response: APIResponse,
  assertions: ApiAssertion[],
  request: ApiRequestInfo = {}
): Promise<void> {
  const responseBody = parseBody(await response.text().catch(() => null));

  await testInfo.attach('api-evidence.json', {
    contentType: 'application/json',
    body: JSON.stringify(
      {
        request: {
          method: request.method ?? 'GET',
          url: response.url(),
          headers: pick(request.headers ?? {}),
          body: request.body,
        },
        response: {
          status: response.status(),
          headers: pick(response.headers()),
          body: responseBody,
        },
        assertions,
      },
      null,
      2
    ),
  });
}
