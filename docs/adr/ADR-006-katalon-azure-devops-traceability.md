---
id: ADR-006
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, azure-devops, traceability, test-case, katalon]
supersedes: null
superseded_by: null
emits: [testing/CR-005, testing/CR-006, testing/CR-007, testing/CR-008]
---

# ADR-006: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon

## Contexto

Los Test Cases viven en Azure DevOps y las pruebas automatizadas, en el proyecto Katalon de este repositorio. Para saber qué Test Case respalda cada resultado hace falta un vínculo explícito y estable entre ambos, que viva en el repositorio y no dependa de una asociación manual en Test Plans.

Katalon tiene una integración nativa con Azure Test Plans, pero es de la edición Enterprise, que este proyecto no usa ([ADR-002](ADR-002-katalon-test-runner.md)), y las pruebas se ejecutan en local, no en el pipeline.

## Decisión

- **Vínculo en el nombre:** cada caso de prueba de Katalon que represente un Test Case de Azure DevOps comienza su nombre con `TC-<id> - `, con el ID real del Test Case. Un caso declara un único Test Case; un Test Case puede respaldarse con varios casos.
- **Publicación de resultados:** tras ejecutar una Test Suite en Katalon Studio, quien prueba ejecuta un script Node del repositorio que lee el `JUnit_Report.xml` de `Reports/`, extrae el `TC-<id>` de cada caso y, con la API REST de Azure DevOps, crea un test run en el Test Plan del proyecto, registra el resultado de cada test point y adjunta las evidencias ([ADR-003](ADR-003-katalon-execution-evidence.md)) y el reporte de Allure ([ADR-004](ADR-004-katalon-allure-reporting.md)).
- **Credenciales:** el script usa un Personal Access Token de Azure DevOps leído de una variable de entorno local, que no se versiona.

## Alternativas consideradas

- **Integración nativa de Katalon con Azure Test Plans:** asocia los resultados sin scripts propios, pero requiere Katalon Studio Enterprise.
- **Publicar solo el JUnit en un pipeline de CI:** las pruebas no corren en CI, así que no habría resultados que publicar; además, no asocia cada resultado con su Test Case.

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

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-004: Reportería con Allure a partir de los resultados de Katalon](ADR-004-katalon-allure-reporting.md)
- [Testing Standards](../standards/testing.md): requisito `azure-devops-traceability`
- [Azure DevOps REST API: Test Runs](https://learn.microsoft.com/rest/api/azure/devops/test/runs)
