# US-34266: Acceso demo de la aplicación

<!-- us:status=Ready -->

**Estado:** Ready
**Fecha de creación:** 2026-10-26
**Última actualización:** 2026-10-26
**Repositorios:** tripot-web
**INVEST:** 🟢 6 / 6
**DoR:** 🟢 5 / 5
**Work Item (ADO):** [#34266](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34266)

## Descripción

**COMO** usuario nuevo de la aplicación
**QUIERO** acceder a una demo que me permita navegar por toda la aplicación con datos ficticios
**PARA** conocer las funcionalidades del producto antes de registrarme o iniciar sesión

## Contexto

La aplicación requiere autenticación para acceder a sus funcionalidades completas. Muchos usuarios potenciales necesitan evaluar el valor del producto antes de comprometerse con el registro. Un modo demo de solo lectura, alimentado por datos ficticios, reduce la fricción de adopción y permite una exploración guiada de las capacidades del sistema sin riesgo de alterar datos reales ni depender del backend.

El modo demo opera de forma aislada: los datos se cargan desde archivos JSON ubicados en `public/data/demos`. Cada archivo sigue una convención de nombre en formato slug con prefijo `demo-` (p. ej. `demo-user-us.json`, `demo-user-es.json`). La lógica de selección del archivo concreto se define en la tarea técnica correspondiente (catálogo en AppManager).

Cada archivo JSON DEBE incluir registros ficticios para las entidades `spaces`, `transactions`, `budgets`, `contacts`, `contactTransactions`, `contactBalances`, `scheduledTransactions` y `terms`.

Los intentos de crear o modificar se interceptan y derivan al flujo de autenticación mediante un modal; la eliminación, tras confirmación, muestra una notificación indicando que no está permitida en modo demo.

La sesión demo persiste únicamente en memoria: si el usuario cierra la aplicación o la pestaña, debe volver a seleccionar la opción de demo en `/auth` para reingresar. El detalle visual de la interfaz (punto de entrada, indicador de demo y modal de conversión) se define en la tarea técnica; los criterios funcionales de usabilidad quedan cubiertos por los AC correspondientes.

**Gestión (ADO):** Area Path `Bayteq IA` · Iteration `Bayteq IA` · Prioridad 2 · Value Area Business.

## Reglas de negocio

- **BR-01:** El sistema DEBE ofrecer un modo demo accesible sin autenticación previa → verificado por AC-001
- **BR-02:** El modo demo DEBE cargar exclusivamente datos ficticios definidos en archivos JSON ubicados en `public/data/demos`, con nombres en formato slug (p. ej. `demo-user-us.json`, `demo-user-es.json`) → verificado por AC-002, AC-010
- **BR-03:** Cada archivo de demo DEBE contener registros para las entidades `spaces`, `transactions`, `budgets`, `contacts`, `contactTransactions`, `contactBalances`, `scheduledTransactions` y `terms` → verificado por AC-002
- **BR-04:** El modo demo NO DEBE permitir crear ni modificar datos persistentes → verificado por AC-003, AC-004
- **BR-05:** Cuando el usuario en modo demo manifieste intención de crear o modificar, el sistema DEBE mostrar un modal que permita iniciar sesión o registrarse → verificado por AC-004
- **BR-06:** Cuando el usuario en modo demo confirme una eliminación, el sistema NO DEBE eliminar el registro y DEBE mostrar una notificación indicando que la eliminación no está permitida en modo demo → verificado por AC-005
- **BR-07:** El usuario en modo demo DEBE poder navegar por todas las secciones funcionales de la aplicación en modo de solo lectura → verificado por AC-006
- **BR-08:** El modo demo NO DEBE sincronizar datos con el backend ni persistir cambios locales más allá de la sesión demo → verificado por AC-007
- **BR-09:** La sesión demo DEBE persistir únicamente en memoria; al cerrar la aplicación el usuario DEBE volver a seleccionar la opción de demo en `/auth` para reingresar → verificado por AC-011

## Criterios de aceptación

- **AC-001 (Casos de uso):** El sistema DEBE permitir a un usuario no autenticado acceder al modo demo desde la ruta `/auth` mediante una opción visible de explorar la demo.
  Casos de prueba: [TC-34285](./test-cases/TC-34285-acceso-demo-desde-auth-happy.md)
- **AC-002 (Procesamiento de datos):** El sistema DEBE poblar todas las vistas del modo demo utilizando los registros definidos en los archivos JSON de `public/data/demos`, que DEBEN incluir datos ficticios para `spaces`, `transactions`, `budgets`, `contacts`, `contactTransactions`, `contactBalances`, `scheduledTransactions` y `terms`.
  Casos de prueba: [TC-34286](./test-cases/TC-34286-poblar-vistas-datos-demo-happy.md) · [TC-34287](./test-cases/TC-34287-carga-datos-demo-no-disponible-error.md)
- **AC-003 (Reglas de negocio):** El sistema NO DEBE ejecutar operaciones de creación ni modificación de datos mientras el usuario esté en modo demo.
  Casos de prueba: [TC-34288](./test-cases/TC-34288-no-persiste-crear-modificar-happy.md)
- **AC-004 (Interacción de usuario):** Cuando el usuario en modo demo intente crear o modificar un registro, el sistema DEBE mostrar un modal con opciones para iniciar sesión o registrarse, sin completar la operación solicitada.
  Casos de prueba: [TC-34289](./test-cases/TC-34289-modal-crear-modificar-happy.md)
- **AC-005 (Interacción de usuario):** Cuando el usuario en modo demo confirme la eliminación de un registro, el sistema NO DEBE eliminar el registro y DEBE mostrar una notificación indicando que la eliminación no está permitida en modo demo.
  Casos de prueba: [TC-34290](./test-cases/TC-34290-eliminacion-bloqueada-notificacion-happy.md)
- **AC-006 (Casos de uso):** El usuario en modo demo DEBE poder navegar por todas las secciones funcionales de la aplicación y visualizar el detalle de los registros ficticios disponibles.
  Casos de prueba: [TC-34291](./test-cases/TC-34291-navegar-todas-las-secciones-happy.md)
- **AC-007 (Seguridad):** El sistema NO DEBE enviar solicitudes de mutación al backend ni almacenar cambios del usuario demo más allá de la sesión activa.
  Casos de prueba: [TC-34292](./test-cases/TC-34292-sin-mutacion-backend-happy.md)
- **AC-008 (Usabilidad):** Al ingresar al modo demo, el sistema DEBE mostrar un indicador de que el usuario se encuentra en modo demo.
  Casos de prueba: [TC-34293](./test-cases/TC-34293-indicador-modo-demo-happy.md)
- **AC-009 (Usabilidad):** El modal de autenticación derivado desde el modo demo DEBE permitir volver a la demo sin obligar al registro o inicio de sesión.
  Casos de prueba: [TC-34294](./test-cases/TC-34294-modal-volver-a-demo-happy.md)
- **AC-010 (Procesamiento de datos):** Los archivos de demo en `public/data/demos` DEBEN seguir una convención de nombre en formato slug con prefijo `demo-` (p. ej. `demo-user-us.json`, `demo-user-es.json`).
  Casos de prueba: [TC-34295](./test-cases/TC-34295-convencion-nombre-slug-demo-happy.md)
- **AC-011 (Fiabilidad):** El sistema DEBE mantener la sesión demo únicamente en memoria; al cerrar la aplicación o la pestaña, la sesión demo NO DEBE retomarse automáticamente y el usuario DEBE acceder nuevamente a la demo desde `/auth`.
  Casos de prueba: [TC-34296](./test-cases/TC-34296-sesion-en-memoria-reingreso-error.md)

## Referencias

- Ninguna por ahora. La verificación es de **flujo** (no de UI): los criterios de usabilidad/visuales (AC-008, AC-009) se validan por su efecto observable en el flujo, sin wireframes ni diseños de alta fidelidad asociados.

## Observaciones

- **Repositorio:** sistema bajo prueba Tripot, repo git `tripot-web` (confirmado).
- **Alcance de verificación:** se validan únicamente **flujos** (comportamiento funcional), no la interfaz visual. Las filas de UI del DoR se marcan `N/A`.
- **Criterios codificados en ADO:** los `AC-001…AC-011` provienen del campo _Acceptance Criteria_ del work item #34266 con su identificador y categoría ya asignados; se usan verbatim.
- **Detalle de implementación:** la selección del archivo de demo (catálogo en AppManager) y el detalle visual del punto de entrada / indicador / modal se definen en la tarea técnica del equipo de producto; no forman parte de esta especificación funcional.
- **Estado en ADO:** `New` al momento de la sincronización.

---

## Validación

### Complejidad sugerida

- **Story points:** 8
- **Justificación:** Valor heredado de ADO (coincide con la escala Fibonacci). Alcance amplio (navegación de solo lectura en todas las secciones, intercepción de mutaciones, datos ficticios multi-entidad, sesión en memoria) con incertidumbre moderada en la cobertura de todos los flujos.

### INVEST

| Letra | Criterio      | Resultado | Notas                                                                              |
| ----- | ------------- | --------- | ---------------------------------------------------------------------------------- |
| **I** | Independiente | Met       | El modo demo opera aislado del backend; no depende de otras historias de la tanda. |
| **N** | Negociable    | Met       | El alcance funcional admite ajuste; el detalle visual queda a la tarea técnica.    |
| **V** | Valiosa       | Met       | Reduce la fricción de adopción permitiendo evaluar el producto sin registro.       |
| **E** | Estimable     | Met       | Estimada en 8 SP con criterios acotados.                                           |
| **S** | Pequeña       | Met       | Cohesiva en torno a una sola capacidad (modo demo de solo lectura).                |
| **T** | Testeable     | Met       | Los 11 `AC-XXX` describen condiciones observables verificables por flujo.          |

### Definition of Ready (DoR)

| Criterio DoR                       | Estado | Notas                                                                                                      |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Dependencias listas                | Met    | No hay dependencias con otras US; el modo demo es autónomo.                                                |
| Inputs/outputs claros              | Met    | Entradas (archivos JSON de demo) y comportamientos (bloqueo de mutaciones, modal, notificación) definidos. |
| Repositorios definidos             | Met    | Sistema bajo prueba Tripot, repo git `tripot-web` (confirmado).                                            |
| Sin decisiones técnicas pendientes | Met    | El detalle de implementación queda explícitamente fuera de la US (tarea técnica).                          |
| Referencias de UI                  | N/A    | Se validan flujos, no UI; sin wireframes ni diseños asociados.                                             |
| Sin aclaraciones pendientes        | Met    | Las observaciones del work item están resueltas; sin pendientes abiertos.                                  |
