---
id: ADR-018
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, test-data, katalon, execution-profiles, data-files, secrets]
supersedes: ADR-006
superseded_by: null
emits: [testing/CR-004, testing/CR-005, testing/CR-006]
---

# ADR-018: Datos de prueba con Katalon

## Contexto

[ADR-006](ADR-006-test-data-strategy.md) separó los datos de prueba por su naturaleza: estáticos en el repositorio, dinámicos con factories, y dependientes del ambiente o sensibles desde configuración externa y secretos (`.env`). Con Katalon como runner único ([ADR-013](ADR-013-katalon-test-runner.md)) esos datos se resuelven con los mecanismos propios de Katalon: Execution Profiles con variables globales, Data Files y Custom Keywords. Katalon no lee un `.env`, y la sobrescritura de variables en la ejecución (`-g_<variable>=`) solo existe en Katalon Runtime Engine, que no se usa ([ADR-013](ADR-013-katalon-test-runner.md)).

## Decisión

Se mantienen los principios de ADR-006 y cambia el mecanismo de cada tipo de dato, usando solo funciones de la edición gratuita de Katalon Studio:

| Tipo de dato                                    | Mecanismo en Katalon                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Dependiente del ambiente, no sensible           | Un Execution Profile por ambiente (`Profiles/`), leído con `GlobalVariable`                                         |
| Credenciales y secretos                         | Variables de entorno del equipo que ejecuta, leídas con un Custom Keyword que falla si la variable no está definida |
| Datasets declarativos (estáticos, no sensibles) | Data Files de Katalon sobre CSV del repositorio, recorridos desde el script con `findTestData()`                    |
| Dinámicos y aislados                            | Custom Keywords que actúan como factories o builders                                                                |

- Ningún Execution Profile versionado contiene credenciales.
- Cada caso de prueba crea los datos que necesita, preferentemente por API, y no depende de los que dejó otro caso.
- Los recursos creados se eliminan al finalizar cuando es técnicamente posible.

Esta decisión supersede a [ADR-006](ADR-006-test-data-strategy.md).

## Consecuencias

### Positivas

- Cambiar de ambiente es elegir otro Execution Profile, sin tocar los casos.
- Las credenciales siguen fuera del historial del repositorio.
- No requiere funciones de la edición Enterprise.

### Negativas / trade-offs

- Sin data binding en Test Suites (función Enterprise), la iteración sobre un dataset se programa en el script del caso.
- Cada persona que ejecuta debe definir las variables de entorno de credenciales en su equipo antes de abrir Katalon Studio.

## Referencias

- [ADR-006: Estrategia de datos de prueba](ADR-006-test-data-strategy.md) (superseded)
- [ADR-013: Katalon como runner único de pruebas](ADR-013-katalon-test-runner.md)
- [Testing Standards](../standards/testing.md): requisito `test-data`
- [Katalon: variables globales y Execution Profiles](https://docs.katalon.com/katalon-studio/data-driven-testing/global-variables-and-execution-profile)
- [Katalon: data-driven testing](https://docs.katalon.com/katalon-studio/data-driven-testing/data-driven-testing-with-katalon-studio)
