---
id: ADR-009
status: Accepted
last_update: 2026-10-13
deciders: [Equipo de QA]
tags: [testing, reporting, allure, traceability, azure-pipelines]
supersedes: null
superseded_by: null
emits: [testing/CR-014]
---

# ADR-009: Allure como capa de reportería y jerarquía Historia → Criterio → Caso de prueba

## Contexto

El reporte HTML de Playwright muestra solo la última ejecución: no conserva historial, no detecta tests inestables entre corridas y agrupa los resultados por archivo y proyecto, no por negocio. [ADR-007](ADR-007-execution-evidence.md) define qué evidencia se genera y [ADR-008](ADR-008-azure-devops-test-case-traceability.md) enlaza cada prueba con su Test Case, pero ninguno decide con qué herramienta se presenta ese resultado a quienes no leen trazas, ni cómo se ve el contexto de negocio de cada prueba.

Un título como `AC-001 — Autenticación › TC-33801: …` identifica el criterio de aceptación y el Test Case, pero no la historia de usuario a la que pertenecen. Quien lee el reporte no ve la cadena completa Historia → Criterio de aceptación → Caso de prueba, y esa cadena es el eje de la trazabilidad de QA.

Además, los identificadores de historia y de criterio se escribían con formatos distintos al de `TC-<id>:` (`—` frente a `:`), lo que hacía inconsistente la lectura de los títulos.

## Decisión

### Allure 3 como capa de reportería

Se adopta Allure 3 como herramienta de reportería, complementaria al reporte HTML de Playwright y no su reemplazo (el trace viewer sigue siendo de Playwright).

- El reporter `allure-playwright` escribe los resultados en `allure-results/` y el CLI `allure` genera el reporte. `npm test`, `test:e2e` y `test:api` ejecutan Playwright envuelto con `allure run`, de modo que cada ejecución genera el reporte.
- La configuración vive en `allurerc.mjs`. El historial de ejecuciones se guarda en `.allure/history.jsonl`, lo que habilita tendencias y detección de tests inestables.
- El reporter se configura con `detail: true` e `includeAttachments: true` para mostrar el paso a paso (hooks, `expect`, llamadas de Playwright y `test.step`) y los adjuntos. Los Page Objects envuelven sus acciones en `test.step()` con nombres legibles.
- Las categorías de fallos (infraestructura, tests desactualizados, defectos de producto, ignorados) se definen en la configuración del reporter.
- En CI (Azure Pipelines) el historial se persiste entre ejecuciones con `Cache@2`, y el reporte se publica como artefacto junto con el JUnit y las evidencias.

### Jerarquía Historia → Criterio → Caso de prueba

Las pruebas se agrupan con el helper `acceptanceCriterion()` de `src/helpers/traceability.ts`. El helper anida dos `describe` (historia y criterio) y deja el `TC-<id>:` en el título de cada prueba. En Allure, la historia se registra como `feature` y el criterio como `story`, por lo que la vista Behaviors muestra la cadena completa.

Los tres niveles usan el mismo formato `<ID>: título`: `US-<id>: …`, `AC-<id>: …` y `TC-<id>: …`, alineado con el formato que ya fija ADR-008 para el Test Case.

```
US-001: Acceso al portal
 └── AC-001: Autenticación y acceso al portal
      └── TC-33801: credenciales inválidas muestran el mismo error
```

Además, el helper fija las etiquetas de Allure y `allurerc.mjs` (`groupBy`) agrupa el árbol del reporte con el tipo de prueba como elemento principal: Tipo → Plataforma (solo en E2E) → Historia → Criterio → Caso de prueba.

| Nivel | Etiqueta      | Origen                                                               |
| ----- | ------------- | -------------------------------------------------------------------- |
| 1     | `parentSuite` | `metadata.type` del proyecto de Playwright (`E2E` o `API`)           |
| 2     | `suite`       | `metadata.platform` del proyecto (solo E2E): Web desktop, Web mobile |
| 3     | `feature`     | Historia (`US-<id>: …`)                                              |
| 4     | `story`       | Criterio de aceptación (`AC-<id>: …`)                                |
| 5     | Caso          | Título de la prueba (`TC-<id>: …`)                                   |

```
E2E
 └── Web desktop
      └── US-001: Acceso al portal
           └── AC-001: Autenticación y acceso al portal
                └── TC-33801: credenciales inválidas muestran el mismo error
API
 └── US-002: Gestión de usuarios
      └── AC-004: Alta de usuario
           └── TC-1234: crear usuario devuelve 201
```

Las pruebas de API no tienen plataforma, por lo que omiten el nivel 2. El reporter se configura con `suiteTitle: false` para que no agregue un nivel por archivo. Las pruebas de Maestro (E2E en plataforma Mobile) llegan por JUnit y no pasan por el helper, por lo que su ubicación en el árbol depende de un script puente de resultados que escriba esas mismas etiquetas.

Esta decisión extiende ADR-007 y ADR-008 sin reemplazarlos.

## Alternativas consideradas

- **Solo el reporte HTML de Playwright:** no requiere nada adicional, pero no ofrece historial, tendencias ni agrupación por negocio.
- **Allure 2 (`allure-commandline`):** es compatible con los resultados de `allure-playwright`, pero depende de Java y es el CLI anterior; Allure 3 es el vigente y no requiere Java.
- **Etiquetas de Allure sin `describe` anidados:** muestran la jerarquía solo en Allure; los `describe` anidados la hacen visible también en el reporte de Playwright y en la consola.
- **Separador `—` para historia y criterio:** no aporta nada frente a `:` y rompe la consistencia con `TC-<id>:`.

## Consecuencias

### Positivas

- El historial y las tendencias permiten ver la estabilidad de la suite entre ejecuciones.
- La cadena Historia → Criterio → Caso de prueba es visible en el reporte de Allure, en el de Playwright y en la consola.
- Los reportes los entienden perfiles no técnicos sin abrir trazas.
- Un único formato `<ID>: título` para historia, criterio y caso de prueba.
- Allure 3 no requiere Java.

### Negativas / trade-offs

- Se añaden dependencias (`allure`, `allure-playwright`) y un archivo de configuración que mantener.
- La caché de Azure Pipelines expira por falta de uso (del orden de una semana), así que el historial a largo plazo exige un almacenamiento propio.
- Una historia con varios criterios repite el `describe` de la historia en cada llamada a `acceptanceCriterion()`.
- Los specs ya existentes y los que genere el generador de pruebas deben adaptarse al helper y al formato de títulos.
- El aviso `file deleted or contents keep changing` puede aparecer en la ejecución porque `allure-playwright` borra archivos temporales mientras el CLI los lee; no afecta al reporte.

## Referencias

- [ADR-007: Evidencias y artefactos de ejecución](ADR-007-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Estándar de Testing](../standards/testing.md) — requisitos «Reportería con Allure» y «Jerarquía Historia, Criterio y Caso de prueba»
- [Allure Report](https://allurereport.org/docs/)
