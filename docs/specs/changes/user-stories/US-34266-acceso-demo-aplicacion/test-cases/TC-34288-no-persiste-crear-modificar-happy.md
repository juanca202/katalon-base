# TC-34288 — Dado un usuario en modo demo, Cuando intenta guardar la creación o modificación de un registro, Entonces el sistema NO ejecuta ninguna operación de escritura

<!-- tc:status=Ready · testType=E2E · criterion=AC-003 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Plataformas:** Web, Web móvil, App
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-003 (Reglas de negocio) — No se ejecutan operaciones de creación ni modificación en modo demo
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34288](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34288)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo con datos ficticios cargados.

## Datos de prueba

| Campo                  | Valor                                  | Notas                            |
| ---------------------- | -------------------------------------- | -------------------------------- |
| Entidad objetivo       | transactions                           | Cualquier entidad editable sirve |
| Registro de referencia | un registro existente del archivo demo | Para el caso de modificación     |

## Pasos de ejecución

| #   | Actor   | Acción                                                                           | Resultado esperado del paso                                                                                |
| --- | ------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | usuario | Abre un formulario de creación o edición de un registro (p. ej. una transacción) | El formulario se muestra en modo demo                                                                      |
| 2   | usuario | Completa los campos e intenta confirmar la operación de creación o modificación  | El sistema no persiste la operación                                                                        |
| 3   | usuario | Revisa el listado de la entidad afectada                                         | El conjunto de datos permanece igual: no aparece un nuevo registro ni se reflejan cambios en uno existente |

## Resultado esperado final

Ninguna operación de creación o modificación se persiste mientras el usuario está en modo demo; el conjunto de datos ficticios permanece inalterado.

## Observaciones

- Verificación de **flujo**, no visual.
- Complementa a [TC-34289](./TC-34289-modal-crear-modificar-happy.md) (modal) y [TC-34292](./TC-34292-sin-mutacion-backend-happy.md) (sin requests al backend).
