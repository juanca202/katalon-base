# Automatización de pruebas

## US-34266: Acceso demo de la aplicación

**Estado:** Done
**Sistema bajo prueba:** Tripot (web, `https://factor.ec/tripot`, modo demo) — variables: `G_BaseUrl` (Profile `default` de Katalon). Nunca valores en los specs.
**Fecha de creación:** 2026-10-26 12:50
**Ultima actualizacion:** 2026-10-26 13:20

## Unidades

### US-34266: Acceso demo de la aplicación

**Estado:** Done
**Iniciado:** 2026-10-26 12:50
**Finalizado:** 2026-10-26 13:20
**Automatizador:** juanca202 / Kiro

**Pruebas:**

```
+ tests/katalon/Profiles/default.glbl   (G_BaseUrl)
+ tests/katalon/Object Repository/US-34266/  (28 test objects)
+ tests/katalon/Keywords/tripot/web/TransactionFormScreen.groovy   (typeAmount: monto por teclado)
+ tests/katalon/Keywords/tripot/common/Waits.groovy   (waitForElementSteady: fin de animación de los bottom sheets)
+ tests/katalon/Test Cases/US-34266/TC-34285 - Acceso a demo desde auth
+ tests/katalon/Test Cases/US-34266/TC-34286 - Poblado de vistas con datos demo
+ tests/katalon/Test Cases/US-34266/TC-34288 - No persiste crear o modificar
+ tests/katalon/Test Cases/US-34266/TC-34289 - Modal al crear o modificar
+ tests/katalon/Test Cases/US-34266/TC-34290 - Eliminacion bloqueada con notificacion
+ tests/katalon/Test Cases/US-34266/TC-34291 - Navegar todas las secciones
+ tests/katalon/Test Cases/US-34266/TC-34292 - Sin persistencia de mutaciones demo
+ tests/katalon/Test Cases/US-34266/TC-34293 - Indicador de modo demo
+ tests/katalon/Test Cases/US-34266/TC-34294 - Modal permite volver a demo
+ tests/katalon/Test Cases/US-34266/TC-34296 - Sesion demo solo en memoria
+ tests/katalon/Test Suites/US-34266/TS - US-34266 Acceso demo
```

**Cobertura de test cases:**

- **Stack:** se implementó en el **proyecto Katalon** (`tests/katalon/`). Selectores y textos verificados contra el sistema desplegado mediante exploración con el MCP de navegador de Katalon (Web Recorder).
- **TC-34287 (AC-002, Error — archivo de demo no disponible/ilegible):** **no automatizado.** Motivo: el archivo JSON de demo lo sirve la aplicación (`public/data/demos`); no se puede forzar su ausencia/corrupción desde fuera del sistema bajo prueba sin control del hosting. Queda como verificación manual o para el repositorio de la aplicación.
- **TC-34295 (AC-010, convención de nombres `demo-<slug>.json`):** **no automatizado.** Motivo: los archivos de datos del demo residen en `public/data/demos` de la aplicación, no son observables desde la UI ni viven en este repositorio de pruebas; la convención se verifica por inspección del repo de la app, no vía E2E.
- **TC-34292 (AC-007):** automatizado como **efecto observable** (no persiste el cambio tras reingresar). El runner Web UI de Katalon no intercepta el tráfico de red de forma nativa, por lo que la aserción a nivel de request de mutación no se hace; se cubre su efecto externo.
- **AC-004 / AC-005 / AC-009:** TC-34289, TC-34290 y TC-34294 verifican el modal, la acción de eliminar y la notificación con Test Objects propios (`dlg_AuthRequired`, `btn_ModalContinueWithGoogle`, `btn_ModalContinueWithEmail`, `btn_ModalBackToDemo`, `btn_DeleteTransaction`, `btn_ConfirmDelete`, `lbl_DeleteNotAllowedNotice`). El modal ofrece «Continue with Google», «Continue with Email» y «Back to demo»; TC-34294 vuelve a la demo con «Back to demo».
- **Ajustes tras la primera ejecución (2026-10-27):**
  - En escritorio el formulario de transacción no tiene campo de monto ni teclado numérico visible: el monto se escribe con el teclado (`TransactionFormScreen.typeAmount`) y guardar exige una categoría (`btn_Category`, `btn_CategoryGrocery`).
  - El menú _Add_, el selector de categoría y el modal de autenticación son bottom sheets que entran deslizándose; antes de hacer clic se espera a que terminen de moverse (`Waits.waitForElementSteady`).
  - La opción de eliminar de cada transacción se llama «Remove» y se confirma con «Accept»; `btn_TransactionMoreOptions` apunta al ⋮ de la fila «Monthly salary», no al de la cabecera.
  - El banner «You're using demo mode» solo aparece en el Dashboard. TC-34286 y TC-34291 comprueban la carga de cada sección con un dato del demo propio de la sección (`lbl_BudgetGrocery`, `lbl_FriendAlexRivera`, `lbl_ScheduledHealthInsurance`).
  - TC-34293 sigue fallando a propósito: su paso 3 exige que el indicador persista al navegar, y fuera del Dashboard no hay indicador. Reportado como Bug #34305 (2026-10-27); queda por confirmar con el PO si el indicador debe persistir o si el caso debe ajustarse a AC-008.
- Cobertura de criterios: AC-001, AC-002(happy), AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-011 automatizados (10 TC). AC-002(error) y AC-010 no automatizables (ver arriba).

**Hallazgos:**
[]
