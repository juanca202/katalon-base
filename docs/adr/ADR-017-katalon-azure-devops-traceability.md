---
id: ADR-017
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, azure-devops, traceability, test-case, katalon]
supersedes: ADR-008
superseded_by: null
emits: [testing/CR-009, testing/CR-010, testing/CR-012, testing/CR-013]
---

# ADR-017: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon

## Contexto

[ADR-008](ADR-008-azure-devops-test-case-traceability.md) vinculó cada prueba con su Test Case de Azure DevOps declarando `TC-<id>` en el título de la prueba de Playwright y asociando el resultado desde el pipeline con las APIs de Azure DevOps. Con Katalon Studio como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) ya no hay pruebas de Playwright, y las pruebas se ejecutan en local, no en el pipeline.

Katalon tiene una integración nativa con Azure Test Plans, pero es de la edición Enterprise, que este proyecto no usa. Se mantienen los principios de ADR-008: el vínculo es explícito, vive en el repositorio y no depende de una asociación manual en Test Plans.

## Decisión

- **Vínculo en el nombre:** cada caso de prueba de Katalon que represente un Test Case de Azure DevOps comienza su nombre con `TC-<id>: `, con el ID real del Test Case. Un caso declara un único Test Case; un Test Case puede respaldarse con varios casos.
- **Publicación de resultados:** tras ejecutar una Test Suite en Katalon Studio, quien prueba ejecuta un script Node del repositorio que lee el `JUnit_Report.xml` de `Reports/`, extrae el `TC-<id>` de cada caso y, con la API REST de Azure DevOps, crea un test run en el Test Plan del proyecto, registra el resultado de cada test point y adjunta las evidencias ([ADR-014](ADR-014-katalon-execution-evidence.md)) y el reporte de Allure ([ADR-015](ADR-015-katalon-allure-reporting.md)).
- **Credenciales:** el script usa un Personal Access Token de Azure DevOps leído de una variable de entorno local, que no se versiona.

Esta decisión supersede a [ADR-008](ADR-008-azure-devops-test-case-traceability.md).

## Alternativas consideradas

- **Integración nativa de Katalon con Azure Test Plans:** asocia los resultados sin scripts propios, pero requiere Katalon Studio Enterprise.
- **Publicar solo el JUnit con `PublishTestResults` en el pipeline:** el pipeline no ejecuta las pruebas, así que no tiene resultados que publicar; además, no asocia cada resultado con su Test Case.

## Consecuencias

### Positivas

- La trazabilidad con Azure DevOps funciona sin licencias de pago.
- El vínculo vive en el nombre del caso y se revisa en el pull request.
- Varios casos pueden respaldar un mismo Test Case.

### Negativas / trade-offs

- Un script de publicación propio que mantener frente a cambios de la API de Azure DevOps y del formato de reportes de Katalon.
- La publicación es un paso manual tras cada ejecución: si se omite, Azure DevOps no refleja el resultado.
- Cada persona que publica necesita un Personal Access Token con permisos sobre Test Plans.
- Un `TC-<id>` mal copiado asocia el resultado al Test Case equivocado; el formato se puede validar, pero no que el ID sea el correcto.

## Referencias

- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md) (superseded)
- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [ADR-014: Evidencias de ejecución con Katalon](ADR-014-katalon-execution-evidence.md)
- [ADR-015: Reportería con Allure a partir de los resultados de Katalon](ADR-015-katalon-allure-reporting.md)
- [Testing Standards](../standards/testing.md): requisito `azure-devops-traceability`
- [Azure DevOps REST API: Test Runs](https://learn.microsoft.com/rest/api/azure/devops/test/runs)
