---
id: ADR-007
status: Accepted
last_update: 2026-10-02
deciders: [Equipo de QA]
tags: [testing, evidence, trace, allure]
supersedes: null
superseded_by: null
emits: [testing/CR-007, testing/CR-008]
---

# ADR-007: Evidencias y artefactos de ejecución

## Contexto

Las pruebas automatizadas E2E requieren evidencias de ejecución para demostrar el resultado de cada prueba y dar trazabilidad en los reportes de QA.

La evidencia no se limita a los casos con error. Tanto las pruebas exitosas como las fallidas cuentan con evidencia que permite verificar que la prueba se ejecutó y conocer el estado del sistema durante esa ejecución.

Playwright genera distintos tipos de evidencia, principalmente traces, screenshots y videos. Generar todos los tipos para cada prueba incrementa innecesariamente el almacenamiento y el tiempo de procesamiento. Hace falta una estrategia que obtenga evidencia de todas las ejecuciones y seleccione el tipo según la naturaleza de la prueba.

## Decisión

Se adopta una estrategia de evidencia basada en el tipo de prueba:

| Tipo de prueba                                 | Evidencia principal                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| E2E funcional                                  | Playwright Trace                                                        |
| Regresión visual                               | Screenshot                                                              |
| API                                            | Evidencia estructurada de la ejecución (request, response y assertions) |
| Escenarios que requieren evidencia audiovisual | Video                                                                   |
| App nativa o híbrida (Maestro)                 | Screenshots y comandos ejecutados del flujo                             |
| Pruebas que requieren diagnóstico adicional    | Evidencia combinada                                                     |

En las pruebas E2E funcionales, el Playwright Trace es la evidencia principal de la ejecución, tanto si la prueba termina correctamente como si termina con error.

La configuración base de Playwright es:

```ts
use: {
  trace: 'on',
  screenshot: 'off',
  video: 'off',
}
```

Las pruebas que requieren otro tipo de evidencia sobrescriben esa configuración a nivel de test, `test.describe` o proyecto.

En las pruebas de API la evidencia principal es una representación estructurada de la ejecución, que contiene:

- **Request:** método, URL, headers relevantes y body.
- **Response:** status, headers relevantes y body.
- **Assertions:** las assertions ejecutadas y su resultado.
- **Resultado y duración** de la prueba.

Las pruebas de API pueden usar las capacidades de tracing de Playwright cuando resulte útil para el diagnóstico, pero el Trace no es la evidencia principal del API testing. Esta evidencia estructurada se genera tanto si la prueba termina correctamente como si falla, porque su objetivo es demostrar la ejecución y alimentar los reportes automatizados.

En las pruebas de apps nativas o híbridas con Maestro ([ADR-011](ADR-011-maestro-mobile-app-runner.md)), el runner guarda las evidencias de cada flujo (screenshots de `takeScreenshot`, grabaciones de `startRecording`, `commands.json` y logs) en `test-results/maestro/` con `--debug-output`, y el script `scripts/maestro/junit-to-allure.mjs` las copia como adjuntos a `allure-results/`. Así las evidencias de todas las plataformas quedan en un solo lugar, igual que las de Playwright, y alimentan el reporte de Allure y la skill `generate-report`.

### Criterios de selección

- Toda ejecución automatizada produce evidencia.
- La evidencia permite identificar el resultado de la prueba.
- Se usa el tipo de evidencia que aporta mayor valor al objetivo de la prueba.
- No se generan varios tipos de evidencia cuando uno es suficiente para documentar la ejecución.
- La evidencia se asocia con el Test Case, la ejecución y el build correspondientes.
- La evidencia está disponible para la generación de reportes y para el análisis posterior de resultados.
- En las pruebas de API la evidencia estructurada se genera siempre, sin depender del resultado de la prueba.
- La evidencia se conserva según la política de retención definida para los artefactos del pipeline.

### Uso en los reportes

Las evidencias generadas durante la ejecución forman parte del reporte automatizado de pruebas. El reporte relaciona:

```text
Test Case
    │
    ├── Ejecución
    │     ├── Resultado
    │     ├── Duración
    │     └── Evidencia
    │
    ├── Build / Release
    └── Bug (cuando corresponda)
```

El resultado de cada ejecución se asocia con su Test Case de Azure DevOps según [ADR-008](ADR-008-azure-devops-test-case-traceability.md), y el reporte presenta la evidencia según el tipo de prueba:

| Tipo de prueba                           | Evidencia en el reporte         |
| ---------------------------------------- | ------------------------------- |
| E2E funcional                            | Playwright Trace                |
| Regresión visual                         | Screenshot                      |
| API                                      | Request + Response + Assertions |
| Escenario cuya estrategia requiere video | Video, únicamente en ese caso   |

En las pruebas E2E, el `trace.zip` se vincula desde el reporte como evidencia principal y se analiza con Playwright Trace Viewer.

### Ejemplos

Una prueba funcional genera su trace aunque pase:

```ts
test('crear usuario', async ({ page }) => {
  await page.goto('/users');
  await page.getByRole('button', { name: 'Nuevo' }).click();
  // ...
});
```

```text
test-results/
└── crear-usuario/
    └── trace.zip
```

En una prueba de regresión visual, la evidencia principal es el screenshot de la comparación:

```ts
test('pantalla de usuarios', async ({ page }) => {
  await page.goto('/users');

  await expect(page).toHaveScreenshot('users.png');
});
```

En una prueba de API, la evidencia principal es la representación estructurada de la ejecución, aunque la prueba pase:

```ts
test('TC-1234: crear usuario devuelve 201', async ({ request }) => {
  const response = await request.post('/users', { data: { name: 'Ana' } });

  expect(response.status()).toBe(201);
});
```

```json
{
  "request": {
    "method": "POST",
    "url": "/users",
    "headers": {},
    "body": { "name": "Ana" }
  },
  "response": {
    "status": 201,
    "headers": {},
    "body": { "id": 10, "name": "Ana" }
  },
  "assertions": [{ "name": "status es 201", "result": "passed" }],
  "result": "passed",
  "durationMs": 182
}
```

## Consecuencias

### Positivas

- Todas las ejecuciones cuentan con evidencia verificable.
- Los reportes de QA demuestran tanto ejecuciones exitosas como fallidas.
- Se mantiene la trazabilidad entre Test Case, ejecución, build y evidencia.
- Se reduce la generación de artefactos redundantes.
- El Trace aporta información detallada para analizar una ejecución E2E.
- La estrategia se adapta al tipo de prueba.
- La evidencia estructurada de las pruebas API (request, response y assertions) se puede leer directamente en el reporte, sin herramientas adicionales.

### Negativas / trade-offs

- Se requiere almacenamiento para conservar las evidencias de las ejecuciones exitosas.
- Los traces pueden generar un volumen considerable de datos en ejecuciones con muchos tests.
- Hay que definir una política de retención y limpieza de artefactos.
- Algunos usuarios necesitan Playwright Trace Viewer para analizar los traces.
- El request y el response de una prueba API pueden incluir datos sensibles del escenario; la evidencia estructurada se limita a los headers relevantes.
- Generar la evidencia estructurada de API en todas las ejecuciones exige un mecanismo común que la produzca y la adjunte al resultado de cada prueba.

## Referencias

- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [ADR-011: Maestro como runner de pruebas de apps Android e iOS](ADR-011-maestro-mobile-app-runner.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- [Estándar de Testing](../standards/testing.md) — requisito «Evidencias de ejecución»
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
