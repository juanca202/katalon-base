---
id: ADR-007
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, test-data, katalon, execution-profiles, data-files, secrets]
supersedes: null
superseded_by: null
emits: [testing/CR-001, testing/CR-002, testing/CR-003]
---

# ADR-007: Datos de prueba con Katalon

## Contexto

Las pruebas necesitan datos reproducibles, aislados y sin secretos. Un dataset estático, un dato generado en cada ejecución y una credencial de ambiente no tienen el mismo ciclo de vida ni la misma sensibilidad; si se mezclan en el código, las pruebas quedan acopladas entre sí y las credenciales pueden entrar al repositorio.

Con Katalon Studio como runner único ([ADR-002](ADR-002-katalon-test-runner.md)), estos datos se resuelven con sus mecanismos propios: Execution Profiles con variables globales, Data Files y Custom Keywords. Katalon no lee un `.env`, y la sobrescritura de variables en la ejecución (`-g_<variable>=`) solo existe en Katalon Runtime Engine, que no se usa.

## Decisión

Cada tipo de dato se resuelve con un mecanismo de la edición gratuita de Katalon Studio:

| Tipo de dato                                    | Mecanismo en Katalon                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Dependiente del ambiente, no sensible           | Un Execution Profile por ambiente (`Profiles/`), leído con `GlobalVariable`                                         |
| Credenciales y secretos                         | Variables de entorno del equipo que ejecuta, leídas con un Custom Keyword que falla si la variable no está definida |
| Datasets declarativos (estáticos, no sensibles) | Data Files de Katalon sobre CSV del repositorio, recorridos desde el script con `findTestData()`                    |
| Dinámicos y aislados                            | Custom Keywords que actúan como factories o builders                                                                |

- Ningún Execution Profile versionado contiene credenciales.
- Cada caso de prueba crea los datos que necesita, preferentemente por API, y no depende de los que dejó otro caso.
- Los recursos creados se eliminan al finalizar cuando es técnicamente posible.

## Consecuencias

### Positivas

- Cambiar de ambiente es elegir otro Execution Profile, sin tocar los casos.
- Las credenciales siguen fuera del historial del repositorio.
- No requiere funciones de la edición Enterprise.

### Negativas / trade-offs

- Sin data binding en Test Suites (función Enterprise), la iteración sobre un dataset se programa en el script del caso.
- Cada persona que ejecuta debe definir las variables de entorno de credenciales en su equipo antes de abrir Katalon Studio.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [Testing Standards](../standards/testing.md): requisito `test-data`
- [Katalon: variables globales y Execution Profiles](https://docs.katalon.com/katalon-studio/data-driven-testing/global-variables-and-execution-profile)
- [Katalon: data-driven testing](https://docs.katalon.com/katalon-studio/data-driven-testing/data-driven-testing-with-katalon-studio)
