---
id: ADR-011
status: Draft
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, environments, execution-profiles, production, katalon]
supersedes: null
superseded_by: null
emits: []
---

# ADR-011: Ambientes de ejecución y política de pruebas en producción

## Contexto

Las pruebas se ejecutan contra el sistema desplegado, cuyas URLs se definen en Execution Profiles ([ADR-007](ADR-007-katalon-test-data.md)). Probar en producción tiene riesgos que no existen en un ambiente de pruebas: crear o modificar datos reales, enviar notificaciones a usuarios reales, alterar métricas o bloquear cuentas por intentos fallidos. Hace falta una regla que diga qué pruebas pueden correr en cada ambiente.

## Decisión

- **Un Execution Profile por ambiente**, con nombre explícito: `production` y, si existe, `staging`. El perfil `default` no apunta a producción, para que nadie ejecute en producción sin elegirlo.
- **En producción solo corren pruebas sin efectos persistentes:** navegación, lectura, el modo demo (que no persiste datos) y verificaciones de API de solo lectura. Las pruebas que crean, modifican o eliminan datos reales corren solo en un ambiente que no sea producción.
- **Cuentas dedicadas de prueba** en cada ambiente, nunca cuentas de personas reales; sus credenciales se leen de variables de entorno ([ADR-007](ADR-007-katalon-test-data.md)).
- **Cada Test Case declara su ambiente de referencia**, y una Test Suite solo agrupa casos compatibles con el perfil con que se ejecuta.

Pendiente de confirmar:

- Si existe un ambiente de pruebas (`staging` u otro) y su URL.
- Si existen cuentas de prueba en producción y quién las administra.

## Consecuencias

### Positivas

- Ejecutar en producción pasa a ser una elección explícita.
- Las pruebas destructivas no tocan datos reales.
- El Test Case dice dónde puede ejecutarse.

### Negativas / trade-offs

- Sin un ambiente de pruebas, los casos que crean o modifican datos no se pueden automatizar contra datos reales.
- Mantener varios perfiles exige que sus variables estén sincronizadas.
- Las cuentas dedicadas requieren que el equipo del sistema bajo prueba las cree y las mantenga.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-007: Datos de prueba con Katalon](ADR-007-katalon-test-data.md)
- [Testing Standards](../standards/testing.md): requisito `test-data`
