# TC-34289 — Dado un usuario en modo demo, Cuando intenta crear o modificar un registro, Entonces el sistema muestra un modal para iniciar sesión o registrarse sin completar la operación

<!-- tc:status=Ready · testType=E2E · criterion=AC-004 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-004 (Interacción de usuario) — Modal de login/registro al intentar crear o modificar
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34289](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34289)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo.

## Datos de prueba

| Campo  | Valor                         | Notas                   |
| ------ | ----------------------------- | ----------------------- |
| Acción | crear o modificar un registro | Dispara la intercepción |

## Pasos de ejecución

| #   | Actor   | Acción                                            | Resultado esperado del paso                                             |
| --- | ------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | usuario | Activa la acción de crear o modificar un registro | El sistema intercepta la intención de mutación                          |
| 2   | usuario | Observa la respuesta del sistema                  | Se muestra un modal con opciones para iniciar sesión y para registrarse |
| 3   | usuario | Revisa el estado de la operación solicitada       | La operación de creación o modificación no se completa                  |

## Resultado esperado final

Al intentar crear o modificar, el sistema presenta el modal de autenticación (login/registro) y la operación solicitada queda sin completarse.

## Observaciones

- Verificación de **flujo**, no visual.
- El "volver a la demo" desde este modal se valida en [TC-34294](./TC-34294-modal-volver-a-demo-happy.md).
