---
id: ADR-004
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, reporting, allure, katalon, traceability]
supersedes: null
superseded_by: null
emits: []
---

# ADR-004: Reportería con Allure a partir de los resultados de Katalon

## Contexto

Katalon Studio ([ADR-002](ADR-002-katalon-test-runner.md)) produce su propio reporte HTML y un `JUnit_Report.xml` por ejecución, pero no conserva historial entre corridas ni agrupa los resultados por historia de usuario y criterio de aceptación. El equipo necesita un reporte que conserve el historial y las tendencias, que muestre la cadena Historia → Criterio → Caso de prueba y que lo entiendan perfiles no técnicos.

## Decisión

### Allure 3 alimentado por el JUnit de Katalon

Allure 3 sigue siendo la capa de reportería. Tras cada ejecución local en Katalon Studio, un script Node del repositorio lee el `JUnit_Report.xml` de la carpeta `Reports/` y escribe los resultados en `allure-results/`, adjuntando las evidencias de [ADR-003](ADR-003-katalon-execution-evidence.md) (log, capturas y video). El CLI `allure` genera el reporte con la configuración de `allurerc.mjs`, que conserva el historial en `.allure/history.jsonl` en el equipo que ejecuta.

### Jerarquía Historia → Criterio → Caso de prueba

Los casos se organizan en `Test Cases/` con una carpeta por historia y el nombre `TC-<id> - título`. No se usa `:`, porque Katalon guarda cada caso como archivo y `:` no es válido en nombres de archivo:

```
Test Cases/
└── US-1001/
    └── TC-2001 - Acceso con credenciales válidas
```

El criterio de aceptación no se expresa con carpetas: el script de conversión lo toma de la especificación del caso (`TC-<id>-*.md` en `docs/specs/`), que declara su criterio y su historia padre. En Allure, la historia se registra como `feature` (`US-<id>: título`) y el criterio como `story` (`AC-<id>: título`). El tipo de prueba sale de la misma especificación y la plataforma, del argumento del script, de modo que el árbol conserva el agrupado Tipo → Plataforma → Historia → Criterio → Caso de prueba.

El script es [scripts/katalon/junit-to-allure.mjs](../../scripts/katalon/junit-to-allure.mjs) y se ejecuta con `npm run allure:katalon`.

## Alternativas consideradas

- **Reportes nativos de Katalon:** no requieren conversión, pero no conservan historial ni agrupan por historia y criterio.
- **Katalon TestOps:** ofrece historial y analítica, pero añade una plataforma y una licencia de pago.

## Consecuencias

### Positivas

- Se conservan el historial, las tendencias y la vista Historia → Criterio → Caso de prueba.
- La historia es visible también en el Test Explorer de Katalon, por la carpeta del caso, y el criterio sale de la especificación, sin duplicarlo en Katalon.
- No requiere licencias adicionales.

### Negativas / trade-offs

- Un script de conversión propio que mantener frente a cambios del formato de reportes de Katalon.
- Al ejecutarse en local, el historial de Allure vive en el equipo de quien prueba; compartirlo exige publicar el reporte (por ejemplo, adjuntarlo al test run de Azure DevOps).
- El paso a paso que Allure muestra depende de lo que el JUnit y el log de Katalon exponen.
- Un caso sin especificación en `docs/specs/` aparece en el reporte sin historia ni criterio.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-006: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](ADR-006-katalon-azure-devops-traceability.md)
- [Testing Standards](../standards/testing.md): requisitos `allure-reporting` y `story-criterion-test-hierarchy`
- [Allure Report](https://allurereport.org/docs/)
