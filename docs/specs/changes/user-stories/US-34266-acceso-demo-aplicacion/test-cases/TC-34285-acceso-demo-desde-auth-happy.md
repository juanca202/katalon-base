# TC-34285 — Dado un usuario no autenticado en /auth, Cuando selecciona la opción de explorar la demo, Entonces ingresa al modo demo sin autenticarse

<!-- tc:status=Ready · testType=E2E · criterion=AC-001 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-001 (Casos de uso) — Acceso al modo demo desde /auth
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34285](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34285)

## Precondiciones

- Entorno de referencia: **Producción** (sistema bajo prueba Tripot, `tripot-web`).
- El usuario NO está autenticado y no tiene sesión demo activa.
- La aplicación está disponible y la ruta `/auth` es accesible.

## Datos de prueba

| Campo           | Valor                          | Notas                                  |
| --------------- | ------------------------------ | -------------------------------------- |
| Ruta de entrada | `/auth`                        | Punto de entrada del modo demo         |
| Usuario         | — (no autenticado)             | No se usan credenciales                |
| Archivo de demo | `tests/data/demo-user-us.json` | Juego de datos ficticios de referencia |

## Pasos de ejecución

| #   | Actor   | Acción                                   | Resultado esperado del paso                                                   |
| --- | ------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | usuario | Abre la ruta `/auth` en producción       | La pantalla de autenticación muestra una opción visible para explorar la demo |
| 2   | usuario | Selecciona la opción de explorar la demo | El sistema ingresa al modo demo sin solicitar credenciales ni registro        |
| 3   | usuario | Observa la aplicación                    | Se muestra la aplicación en modo demo con datos ficticios cargados            |

## Resultado esperado final

El usuario no autenticado queda dentro del modo demo tras seleccionar la opción en `/auth`, sin haber iniciado sesión ni registrado, y con la aplicación poblada por datos ficticios.

## Observaciones

- Verificación de **flujo**, no visual.
- Datos de prueba `[propuesto]` a partir de los archivos existentes en `tests/data/`.
