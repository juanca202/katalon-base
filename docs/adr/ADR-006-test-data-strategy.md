---
id: ADR-006
status: Superseded
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, test-data, fixtures, secrets]
supersedes: null
superseded_by: ADR-018
emits: [testing/CR-004, testing/CR-005, testing/CR-006]
---

# ADR-006: Estrategia de datos de prueba

## Contexto

Las pruebas del framework necesitan datos reproducibles, aislados y sin secretos. Un dataset estático, un dato generado en cada ejecución y una credencial de ambiente no tienen el mismo ciclo de vida ni la misma sensibilidad. Si se mezclan en el código, las pruebas quedan acopladas entre sí y las credenciales pueden entrar al repositorio.

## Decisión

Los datos de prueba se tratan según su naturaleza:

- Los datos estáticos, reproducibles y no sensibles se almacenan en el repositorio.
- Los datasets declarativos usan JSON, YAML o CSV.
- Los datos dinámicos y aislados se generan con factories o builders.
- Los datos que dependen del ambiente y las credenciales se proporcionan con configuración externa y secretos del entorno.
- Cada prueba crea los datos que necesita, de forma preferente mediante APIs o fixtures de preparación, sin depender de otra prueba.
- Los recursos creados durante una prueba se eliminan al finalizar cuando es técnicamente posible.

## Consecuencias

### Positivas

- Los datasets estáticos se pueden repetir igual en cualquier máquina.
- Cada prueba arranca con datos propios.
- Las credenciales quedan fuera del historial del repositorio.

### Negativas / trade-offs

- Conviven datasets declarativos y generación por factories.
- No todo recurso creado en una prueba se puede borrar; el aislamiento no puede depender de esa limpieza.

## Referencias

- [Estándar de Testing](../standards/testing.md) — requisito «Gestión de datos de prueba»
- Superseded por [ADR-018: Datos de prueba con Katalon](ADR-018-katalon-test-data.md) el 2026-10-26.
