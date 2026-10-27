# TC-34291 — Dado un usuario en modo demo, Cuando recorre todas las secciones funcionales de la aplicación, Entonces puede navegarlas en solo lectura y ver el detalle de los registros ficticios

<!-- tc:status=Ready · testType=E2E · criterion=AC-006 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Tipo de ejecución:** 🤖 Fully Automated
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Media
**Criterio de aceptación:** AC-006 (Casos de uso) — Navegación de solo lectura por todas las secciones
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34291](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34291)

## Precondiciones

- Entorno de referencia: **Producción**.
- El usuario está en modo demo con datos ficticios cargados.

## Datos de prueba

| Campo     | Valor                                                                                         | Notas                           |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| Secciones | espacios, transacciones, presupuestos, contactos, transacciones programadas, términos y demás | Todas las secciones funcionales |

## Pasos de ejecución

| #   | Actor   | Acción                                                       | Resultado esperado del paso                                                      |
| --- | ------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | usuario | Abre el menú principal de navegación                         | Se muestran todas las secciones funcionales accesibles                           |
| 2   | usuario | Entra a cada sección funcional                               | Cada sección se abre y muestra sus registros ficticios sin errores de navegación |
| 3   | usuario | Abre el detalle de al menos un registro ficticio por sección | El sistema muestra el detalle del registro en modo de solo lectura               |

## Resultado esperado final

El usuario navega por todas las secciones funcionales de la aplicación en modo de solo lectura y visualiza el detalle de los registros ficticios disponibles.

## Observaciones

- Verificación de **flujo**, no visual.
