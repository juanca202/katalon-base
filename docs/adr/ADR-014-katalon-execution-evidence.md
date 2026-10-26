---
id: ADR-014
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, evidence, katalon, video, screenshots, allure]
supersedes: ADR-007
superseded_by: null
emits: [testing/CR-008, testing/CR-025]
---

# ADR-014: Evidencias de ejecución con Katalon

## Contexto

[ADR-007](ADR-007-execution-evidence.md) definió la estrategia de evidencias sobre Playwright (trace como evidencia principal E2E) y Maestro. Con Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) esa estrategia ya no aplica tal cual: Katalon no genera traces, pero sí registra el log de ejecución paso a paso, toma capturas y graba video desde la configuración de la Test Suite.

Se mantienen los principios de ADR-007: toda ejecución produce evidencia, pase o falle; la evidencia se elige según el tipo de prueba; y se asocia con el Test Case, la ejecución y el build.

## Decisión

La evidencia de cada tipo de prueba es:

| Tipo de prueba               | Evidencia                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| E2E web (escritorio y móvil) | Log de ejecución paso a paso, captura automática al fallar y video de la ejecución       |
| App nativa o híbrida         | Log de ejecución paso a paso, captura automática al fallar y capturas de los pasos clave |
| API (REST y GraphQL)         | Request, response y verificaciones registrados explícitamente en el log de la ejecución  |
| Regresión visual             | Captura de la comparación                                                                |

- **Video de todas las ejecuciones web**, exitosas y fallidas, con el **Screen Recorder** de Katalon Studio (Project > Settings > Execution, opción de grabar todos los casos), disponible en la edición gratuita. Como la ejecución es local y con navegador visible ([ADR-013](ADR-013-katalon-test-runner.md)), cubre el caso de uso. El Browser-based Recorder, que graba en headless y en paralelo, es de la edición Enterprise y no se usa.
- **Apps móviles sin video:** Katalon no graba video de pruebas móviles. La evidencia es el log, la captura automática al fallar y una captura (`Mobile.takeScreenshot()`) en cada paso clave del flujo.
- **Captura automática al fallar** activada en Project > Settings > Execution (_Take screenshot when execution failed_).
- **API:** el reporte de Katalon no garantiza mostrar el request y el response de cada `WS.sendRequest`. Un Custom Keyword común envía la petición y registra en el log, con `KeywordUtil`, el request (método, URL, headers relevantes y body), el response (status, headers relevantes y body) y el resultado de cada verificación, pase o falle la prueba.
- Las evidencias de la carpeta `Reports/` de Katalon se adjuntan al reporte de Allure ([ADR-015](ADR-015-katalon-allure-reporting.md)) y al test run de Azure DevOps ([ADR-017](ADR-017-katalon-azure-devops-traceability.md)).

Esta decisión supersede a [ADR-007](ADR-007-execution-evidence.md).

## Consecuencias

### Positivas

- Las ejecuciones web exitosas también tienen evidencia audiovisual, útil para demostrar la ejecución ante negocio.
- Una sola estrategia de evidencias para web, móvil y API, con la misma carpeta de reportes.
- Todo lo necesario está en la edición gratuita.

### Negativas / trade-offs

- El Screen Recorder graba la pantalla del equipo: solo funciona en ejecuciones locales de una única Test Suite, no en paralelo ni en headless, y quien prueba no debe usar el equipo mientras graba.
- Las pruebas de apps móviles no tienen video; su evidencia visual se limita a capturas.
- La evidencia de API depende de que las pruebas usen el Custom Keyword común en lugar de llamar a `WS.sendRequest` directamente.
- Grabar video en todas las ejecuciones aumenta el almacenamiento; exige una política de retención.
- Sin trace, el diagnóstico de un fallo E2E depende del log, las capturas y el video.
- El request y el response de API pueden contener datos sensibles; se limitan a los headers relevantes.

## Referencias

- [ADR-007: Evidencias y artefactos de ejecución](ADR-007-execution-evidence.md) (superseded)
- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [ADR-015: Reportería con Allure a partir de los resultados de Katalon](ADR-015-katalon-allure-reporting.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Testing Standards](../standards/testing.md): requisito `execution-evidence`
- [Katalon: videos con Browser-based Recorder](https://docs.katalon.com/katalon-studio/test-reports/generate-test-reports/generate-browser-based-videos-in-katalon-studio-reports)
- [Katalon: videos con Screen Recorder](https://docs.katalon.com/katalon-studio/test-reports/generate-test-reports/generate-screen-based-videos-in-katalon-studio-reports)
