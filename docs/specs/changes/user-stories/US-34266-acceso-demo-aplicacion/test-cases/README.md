# Casos de prueba — US-34266: Acceso demo de la aplicación

Artefacto padre: [US-34266](../README.md) · Test Plan ADO: **Bayteq IA** (#34282) · Test Suite ADO: **US-34266: Acceso demo de la aplicación** (#34284).

Entorno de referencia: **Producción** (sistema bajo prueba Tripot, `tripot-web`). Datos de prueba en [`tests/data/`](../../../../../../tests/data/). Verificación de **flujos** (no UI).

| TC                                                                 | Perspectiva | Tipo de prueba | Estado | Prioridad | Criterio de aceptación |
| ------------------------------------------------------------------ | ----------- | -------------- | ------ | --------- | ---------------------- |
| [TC-34285](./TC-34285-acceso-demo-desde-auth-happy.md)             | Happy Path  | E2E            | Ready  | Alta      | AC-001                 |
| [TC-34286](./TC-34286-poblar-vistas-datos-demo-happy.md)           | Happy Path  | E2E            | Ready  | Alta      | AC-002                 |
| [TC-34287](./TC-34287-carga-datos-demo-no-disponible-error.md)     | Error       | E2E            | Ready  | Media     | AC-002                 |
| [TC-34288](./TC-34288-no-persiste-crear-modificar-happy.md)        | Happy Path  | E2E            | Ready  | Alta      | AC-003                 |
| [TC-34289](./TC-34289-modal-crear-modificar-happy.md)              | Happy Path  | E2E            | Ready  | Alta      | AC-004                 |
| [TC-34290](./TC-34290-eliminacion-bloqueada-notificacion-happy.md) | Happy Path  | E2E            | Ready  | Alta      | AC-005                 |
| [TC-34291](./TC-34291-navegar-todas-las-secciones-happy.md)        | Happy Path  | E2E            | Ready  | Media     | AC-006                 |
| [TC-34292](./TC-34292-sin-mutacion-backend-happy.md)               | Happy Path  | E2E            | Ready  | Alta      | AC-007                 |
| [TC-34293](./TC-34293-indicador-modo-demo-happy.md)                | Happy Path  | E2E            | Ready  | Media     | AC-008                 |
| [TC-34294](./TC-34294-modal-volver-a-demo-happy.md)                | Happy Path  | E2E            | Ready  | Media     | AC-009                 |
| [TC-34295](./TC-34295-convencion-nombre-slug-demo-happy.md)        | Happy Path  | E2E            | Ready  | Media     | AC-010                 |
| [TC-34296](./TC-34296-sesion-en-memoria-reingreso-error.md)        | Error       | E2E            | Ready  | Alta      | AC-011                 |
