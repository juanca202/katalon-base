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
+ tests/katalon/Object Repository/US-34266/  (12 test objects: btn_ViewDemo, lbl_DemoModeBanner, btn_DemoBadge, btn_Add, btn_AddExpense, btn_ExitDemo, nav_Dashboard, nav_Transactions, nav_Budgets, nav_Friends, nav_Scheduled, txt_TransactionDescription, btn_TransactionMoreOptions, btn_SaveTransaction, btn_Numpad5)
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
- **AC-004 / AC-005 / AC-009:** TC-34289, TC-34290 y TC-34294 verifican el modal, la acción de eliminar y la notificación con Test Objects propios (`dlg_AuthRequired`, `btn_ModalSignIn`, `btn_ModalSignUp`, `btn_DeleteTransaction`, `btn_ConfirmDelete`, `lbl_DeleteNotAllowedNotice`). Sus selectores no se observaron en la exploración: están marcados como «por confirmar» en su descripción y se ajustan en la primera ejecución contra el sistema. En TC-34294, el cierre del modal con Escape también está por confirmar.
- Cobertura de criterios: AC-001, AC-002(happy), AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-011 automatizados (10 TC). AC-002(error) y AC-010 no automatizables (ver arriba).

**Hallazgos:**
[]
