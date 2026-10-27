# TC-34293 — Dado un usuario que ingresa al modo demo, Cuando la aplicación carga, Entonces se muestra un indicador visible de que el usuario se encuentra en modo demo

<!-- tc:status=Ready · testType=E2E · criterion=AC-008 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Media
**Criterio de aceptación:** AC-008 (Usabilidad) — Indicador visible de modo demo
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34293](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34293)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario ingresa al modo demo desde `/auth`.

## Datos de prueba

| Campo                  | Valor    | Notas                                       |
| ---------------------- | -------- | ------------------------------------------- |
| Indicador de modo demo | presente | Elemento observable que señala el modo demo |

## Pasos de ejecución

| #   | Actor   | Acción                                    | Resultado esperado del paso                                             |
| --- | ------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| 1   | usuario | Selecciona explorar la demo desde `/auth` | El sistema ingresa al modo demo                                         |
| 2   | usuario | Observa la interfaz de la aplicación      | Se muestra un indicador visible de modo demo                            |
| 3   | usuario | Navega a otra sección de la aplicación    | El indicador de modo demo permanece visible durante toda la sesión demo |

## Resultado esperado final

Al ingresar al modo demo, la aplicación muestra un indicador visible de modo demo que persiste durante la sesión.

## Observaciones

- Verificación del **flujo** (presencia del indicador y su persistencia), no del detalle visual del indicador.
