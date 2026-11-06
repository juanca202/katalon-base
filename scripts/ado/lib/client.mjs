// Cliente HTTP de la API REST de Azure DevOps compartido por los scripts.
import { basicAuth, fail } from './config.mjs';

// `permission` describe el permiso del PAT que necesita el script y se usa en
// el mensaje cuando Azure DevOps rechaza el token.
export function createClient({ baseUrl, workspace, permission }) {
  if (!process.env.ADO_PAT) {
    fail('Falta ADO_PAT (Personal Access Token de Azure DevOps).');
  }
  const auth = basicAuth(process.env.ADO_PAT);

  // Un error de la API termina el script con su mensaje, sin traza.
  process.on('uncaughtException', error => {
    console.error(error.message);
    process.exit(1);
  });

  const rejected = where =>
    fail(
      `Azure DevOps rechazó ADO_PAT (${where}): revisa que el token sea de la organización ${workspace}, no haya expirado y tenga el permiso ${permission}.`
    );

  // Solicitud autenticada; `path` es relativo a baseUrl o una URL absoluta.
  async function send(
    method,
    path,
    { body, contentType = 'application/json', accept = 'application/json' } = {}
  ) {
    const response = await fetch(
      path.startsWith('http') ? path : `${baseUrl}${path}`,
      {
        method,
        headers: {
          Authorization: auth,
          'Content-Type': contentType,
          Accept: accept,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'follow',
      }
    );
    // Con un PAT inválido o sin permisos Azure DevOps responde 203 con la
    // página de inicio de sesión en lugar de JSON.
    if (response.status === 203) rejected(`${method} ${path} → 203`);
    if (!response.ok) {
      throw new Error(
        `${method} ${path} → ${response.status} ${await response.text()}`
      );
    }
    return response;
  }

  // Solicitud con respuesta JSON (null si la API responde 204).
  async function json(method, path, body, contentType) {
    const response = await send(method, path, { body, contentType });
    if (response.status === 204) return null;
    if (!response.headers.get('content-type')?.includes('application/json')) {
      rejected(`${method} ${path} → ${response.status}`);
    }
    return response.json();
  }

  return { send, json };
}
