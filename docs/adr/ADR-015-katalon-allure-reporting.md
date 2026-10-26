---
id: ADR-015
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, reporting, allure, katalon, traceability]
supersedes: ADR-009
superseded_by: null
emits: []
---

# ADR-015: Reportería con Allure a partir de los resultados de Katalon

## Contexto

[ADR-009](ADR-009-allure-reporting-and-traceability-hierarchy.md) adoptó Allure 3 como capa de reportería, con historial entre ejecuciones y la jerarquía Historia → Criterio → Caso de prueba, alimentado por `allure-playwright` y el helper `acceptanceCriterion()`. Con Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) ese reporter y ese helper dejan de existir.

Katalon produce su propio reporte HTML y un `JUnit_Report.xml` por ejecución, pero no conserva historial entre corridas ni agrupa por historia y criterio. El repositorio ya convierte JUnit a resultados de Allure para Maestro (`scripts/maestro/junit-to-allure.mjs`), y el equipo quiere conservar el historial, las tendencias y la vista por negocio.

## Decisión

### Allure 3 alimentado por el JUnit de Katalon

Allure 3 sigue siendo la capa de reportería. Tras cada ejecución local en Katalon Studio, un script Node del repositorio lee el `JUnit_Report.xml` de la carpeta `Reports/` y escribe los resultados en `allure-results/`, adjuntando las evidencias de [ADR-014](ADR-014-katalon-execution-evidence.md) (log, capturas y video). El CLI `allure` genera el reporte con la configuración de `allurerc.mjs`, que conserva el historial en `.allure/history.jsonl` en el equipo que ejecuta.

### Jerarquía por carpetas de Katalon

La cadena Historia → Criterio → Caso de prueba se expresa con la estructura de carpetas de `Test Cases/` del proyecto Katalon, con el mismo formato `<ID>: título` de ADR-009:

```
Test Cases/
└── US-001: Acceso al portal/
    └── AC-001: Autenticación y acceso al portal/
        └── TC-33801: credenciales inválidas muestran el mismo error
```

El script de conversión toma la ruta de cada caso: la carpeta `US-<id>` se registra como `feature` y la carpeta `AC-<id>` como `story`. El tipo de prueba (`E2E`, `API`, `Mobile`) y la plataforma se toman de la Test Suite ejecutada, de modo que el árbol de Allure conserva el agrupado Tipo → Plataforma → Historia → Criterio → Caso de prueba.

Esta decisión supersede a [ADR-009](ADR-009-allure-reporting-and-traceability-hierarchy.md).

## Alternativas consideradas

- **Reportes nativos de Katalon:** no requieren conversión, pero no conservan historial ni agrupan por historia y criterio.
- **Katalon TestOps:** ofrece historial y analítica, pero añade una plataforma y una licencia de pago.

## Consecuencias

### Positivas

- Se conservan el historial, las tendencias y la vista Historia → Criterio → Caso de prueba.
- La jerarquía es visible también en el Test Explorer de Katalon, por la estructura de carpetas.
- Mismo mecanismo de conversión que ya se usaba con Maestro, sin licencias adicionales.

### Negativas / trade-offs

- Un script de conversión propio que mantener frente a cambios del formato de reportes de Katalon.
- Al ejecutarse en local, el historial de Allure vive en el equipo de quien prueba; compartirlo exige publicar el reporte (por ejemplo, adjuntarlo al test run de Azure DevOps).
- El paso a paso que Allure muestra depende de lo que el JUnit y el log de Katalon exponen; es menos detallado que con `allure-playwright`.
- Mover un caso de carpeta cambia su historia o criterio en el reporte.

## Referencias

- [ADR-009: Allure como capa de reportería y jerarquía Historia → Criterio → Caso de prueba](ADR-009-allure-reporting-and-traceability-hierarchy.md) (superseded)
- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [ADR-014: Evidencias de ejecución con Katalon](ADR-014-katalon-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Testing Standards](../standards/testing.md): requisitos `allure-reporting` y `story-criterion-test-hierarchy`
- [Allure Report](https://allurereport.org/docs/)
