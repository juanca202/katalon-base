# TC-34296 — Dado un usuario en modo demo, Cuando cierra la aplicación o la pestaña y la vuelve a abrir, Entonces la sesión demo no se retoma automáticamente y debe reingresar desde /auth

<!-- tc:status=Ready · testType=E2E · criterion=AC-011 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Error
**Prioridad:** Alta
**Criterio de aceptación:** AC-011 (Fiabilidad) — Sesión demo solo en memoria; sin reanudación automática tras cierre
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34296](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34296)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está navegando la aplicación en modo demo (sesión activa en memoria).

## Datos de prueba

| Campo                 | Valor           | Notas                                          |
| --------------------- | --------------- | ---------------------------------------------- |
| Persistencia esperada | solo en memoria | No debe sobrevivir al cierre de la app/pestaña |

## Pasos de ejecución

| #   | Actor   | Acción                                                           | Resultado esperado del paso                                                            |
| --- | ------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | usuario | Está navegando la aplicación en modo demo                        | La sesión demo está activa en memoria                                                  |
| 2   | usuario | Cierra la pestaña o la aplicación y vuelve a abrir la aplicación | La aplicación carga sin una sesión demo activa                                         |
| 3   | usuario | Observa el estado inicial                                        | El sistema no retoma automáticamente el modo demo; se presenta `/auth` para reingresar |
| 4   | usuario | Selecciona nuevamente explorar la demo en `/auth`                | El sistema vuelve a ingresar al modo demo correctamente                                |

## Resultado esperado final

Tras cerrar la aplicación o la pestaña, la sesión demo no se reanuda automáticamente: el usuario debe reingresar desde `/auth`, y al hacerlo accede nuevamente al modo demo.

## Observaciones

- Verificación de **flujo**, no visual.
- Perspectiva de Error enfocada en la NO reanudación automática (la persistencia solo-en-memoria); el reingreso desde `/auth` confirma la recuperación.
