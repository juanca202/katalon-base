# TC-34290 — Dado un usuario en modo demo, Cuando confirma la eliminación de un registro, Entonces el sistema no lo elimina y muestra una notificación de que la eliminación no está permitida en modo demo

<!-- tc:status=Ready · testType=E2E · criterion=AC-005 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-005 (Interacción de usuario) — Eliminación bloqueada con notificación en modo demo
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34290](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34290)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo con al menos un registro existente en la entidad objetivo.

## Datos de prueba

| Campo            | Valor        | Notas                                  |
| ---------------- | ------------ | -------------------------------------- |
| Entidad objetivo | transactions | Un registro existente del archivo demo |

## Pasos de ejecución

| #   | Actor   | Acción                                                             | Resultado esperado del paso                                                                     |
| --- | ------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | usuario | Selecciona eliminar un registro existente (p. ej. una transacción) | El sistema muestra la confirmación de eliminación                                               |
| 2   | usuario | Confirma la eliminación                                            | El sistema muestra una notificación indicando que la eliminación no está permitida en modo demo |
| 3   | usuario | Revisa el listado de la entidad                                    | El registro permanece presente: no fue eliminado                                                |

## Resultado esperado final

Tras confirmar la eliminación, el registro no se elimina y el sistema muestra una notificación de que la eliminación no está permitida en modo demo.

## Observaciones

- Verificación de **flujo**, no visual.
- La ausencia de request de eliminación al backend se cubre transversalmente en [TC-34292](./TC-34292-sin-mutacion-backend-happy.md).
