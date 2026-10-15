import dotenv from 'dotenv';

dotenv.config();

/**
 * Resuelve una ruta de la aplicación relativa a `BASE_URL`.
 *
 * `BASE_URL` puede incluir un prefijo de path (p. ej. `/tripot`); una ruta
 * absoluta como `/auth` descartaría ese prefijo con `new URL`, por eso la
 * unión se hace por concatenación.
 */
export function appUrl(path = ''): string {
  const base = (process.env.BASE_URL || 'http://localhost:3000').replace(
    /\/+$/,
    ''
  );
  const route = path.replace(/^\/+/, '');
  return route ? `${base}/${route}` : base;
}
