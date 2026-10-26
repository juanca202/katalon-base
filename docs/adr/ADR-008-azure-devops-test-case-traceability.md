---
id: ADR-008
status: Superseded
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, azure-devops, traceability, test-case, pipeline]
supersedes: null
superseded_by: ADR-017
emits:
  [
    testing/CR-009,
    testing/CR-010,
    testing/CR-011,
    testing/CR-012,
    testing/CR-013,
  ]
---

# ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps

## Contexto

Los Test Cases viven en Azure DevOps y las pruebas automatizadas, en este repositorio. Para saber qué Test Case respalda cada resultado de ejecución hace falta un vínculo explícito y estable entre ambos. Asociarlos a mano desde la interfaz de Test Plans es propenso a errores, no deja rastro en el código y no se puede reproducir ni revisar en un pull request.

El texto descriptivo de una prueba cambia con el tiempo (se reescribe, se traduce, se precisa); el Test Case al que responde no debería cambiar con él. Además, un mismo Test Case puede necesitar varias pruebas automatizadas cuando existen distintos escenarios técnicos para validarlo.

## Decisión

Cada prueba automatizada que represente un Test Case de Azure DevOps declara su identificador en el título, con el formato `TC-<id>` al inicio, por ejemplo `TC-1234: User can login successfully`. El `<id>` es el ID real del Test Case existente en Azure DevOps y es independiente del texto descriptivo que lo sigue.

Una prueba declara un único Test Case; un Test Case puede tener varias pruebas.

El pipeline publica los resultados de Playwright y, a partir del identificador declarado en cada prueba, asocia el resultado con su Test Case mediante las APIs de Azure DevOps. La asociación no depende de una acción manual en Test Plans y puede reconstruirse a partir del código fuente y de los resultados del pipeline.

La trazabilidad resultante:

```
Azure DevOps Test Case
        │  TC-1234
        ▼
Playwright automated test
        │
        ▼
Pipeline execution
        ├── Passed
        └── Failed
```

Las reglas continuas que esta decisión pone en vigor viven en el requisito «Trazabilidad con Test Cases de Azure DevOps» del estándar de Testing.

## Consecuencias

### Positivas

- Cada resultado de ejecución se vincula con su Test Case sin intervención manual.
- El vínculo vive en el código, se revisa en el pull request y sobrevive a los cambios de redacción del título.
- Varios escenarios técnicos pueden respaldar un mismo Test Case.

### Negativas / trade-offs

- El pipeline necesita credenciales y permisos sobre las APIs de Azure DevOps.
- Una prueba que represente un Test Case y no declare su identificador queda sin asociar.
- Un `TC-<id>` mal copiado asocia el resultado al Test Case equivocado; el formato se puede validar, pero no que el ID sea el correcto.

## Referencias

- [ADR-001: Runners de pruebas: Playwright y Maestro](ADR-001-test-runners.md)
- [ADR-007: Evidencias y artefactos de ejecución](ADR-007-execution-evidence.md)
- [Estándar de Testing](../standards/testing.md) — requisito «Trazabilidad con Test Cases de Azure DevOps»
- Superseded por [ADR-017: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](ADR-017-katalon-azure-devops-traceability.md) el 2026-10-26.
