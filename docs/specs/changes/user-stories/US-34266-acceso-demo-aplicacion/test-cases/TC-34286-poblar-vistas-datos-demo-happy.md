# TC-34286 — Dado un usuario en modo demo, Cuando navega por las vistas de la aplicación, Entonces se muestran los datos ficticios del archivo JSON de demo para las 8 entidades

<!-- tc:status=Ready · testType=E2E · criterion=AC-002 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Alta
**Criterio de aceptación:** AC-002 (Procesamiento de datos) — Poblado de vistas con los archivos JSON de demo
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34286](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34286)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo (ver [TC-34285](./TC-34285-acceso-demo-desde-auth-happy.md)).
- El archivo JSON de demo contiene registros para las 8 entidades.

## Datos de prueba

| Campo               | Valor                                                                                                       | Notas                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archivo de demo     | `tests/data/demo-user-us.json`                                                                              | Contiene spaces (4), transactions (123), budgets (3), contacts (3), contactTransactions (10), contactBalances (3), scheduledTransactions (6), terms (18) |
| Entidades esperadas | spaces, transactions, budgets, contacts, contactTransactions, contactBalances, scheduledTransactions, terms | Las 8 entidades del criterio                                                                                                                             |

## Pasos de ejecución

| #   | Actor   | Acción                                                                                                                  | Resultado esperado del paso                                              |
| --- | ------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | usuario | Ingresa al modo demo desde `/auth`                                                                                      | El sistema carga el archivo JSON de demo correspondiente                 |
| 2   | usuario | Abre la vista de espacios (spaces)                                                                                      | Se muestran los registros de spaces del archivo demo                     |
| 3   | usuario | Abre las vistas de transactions, budgets, contacts, contactTransactions, contactBalances, scheduledTransactions y terms | Cada vista muestra los registros ficticios de su entidad                 |
| 4   | usuario | Verifica que ninguna entidad quede vacía por falta de datos                                                             | Las 8 entidades presentan datos ficticios cargados desde el archivo demo |

## Resultado esperado final

Todas las vistas del modo demo se pueblan con los registros del archivo JSON de demo, con las 8 entidades representadas con datos ficticios.

## Observaciones

- Verificación de **flujo**, no visual.
- Datos de prueba `[propuesto]` a partir de los archivos existentes en `tests/data/`.
