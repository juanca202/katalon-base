# TC-34292 — Dado un usuario en modo demo que intenta mutar datos, Cuando se inspecciona el tráfico de red, Entonces no se envía ninguna solicitud de mutación al backend ni se persisten cambios más allá de la sesión

<!-- tc:status=Ready · testType=E2E · criterion=AC-007 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-007 (Seguridad) — Sin solicitudes de mutación al backend ni persistencia fuera de la sesión
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34292](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34292)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo y la captura de tráfico de red del navegador está habilitada.

## Datos de prueba

| Campo              | Valor                      | Notas                             |
| ------------------ | -------------------------- | --------------------------------- |
| Métodos observados | POST, PUT, PATCH, DELETE   | Solicitudes de mutación a vigilar |
| Acciones probadas  | crear, modificar, eliminar | En varias secciones               |

## Pasos de ejecución

| #   | Actor   | Acción                                                            | Resultado esperado del paso                                                                                |
| --- | ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | usuario | Ingresa al modo demo y habilita la captura del tráfico de red     | La herramienta de captura registra las solicitudes salientes                                               |
| 2   | usuario | Intenta crear, modificar y eliminar registros en varias secciones | El sistema intercepta las mutaciones (modal / notificación) sin emitir solicitudes de escritura            |
| 3   | sistema | Se revisan las solicitudes capturadas hacia el backend            | No existe ninguna solicitud de mutación (POST/PUT/PATCH/DELETE) de datos del usuario demo hacia el backend |
| 4   | usuario | Verifica el estado tras la sesión                                 | No quedan cambios persistidos del usuario demo más allá de la sesión activa                                |

## Resultado esperado final

Durante toda la sesión demo no se emite ninguna solicitud de mutación al backend y no persiste ningún cambio del usuario demo fuera de la sesión activa.

## Observaciones

- Verificación de **flujo** observable desde fuera del sistema (tráfico de red); no es prueba de integración.
- El criterio AC-007 es verificable por su efecto observable (ausencia de requests de mutación), coherente con `implementation.scope: tests`.
