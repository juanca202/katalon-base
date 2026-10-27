---
id: ADR-005
status: Accepted
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, human-in-the-loop, katalon, otp, custom-keyword]
supersedes: null
superseded_by: null
emits: [testing/CR-009]
---

# ADR-005: Pruebas Human-in-the-Loop con Katalon

## Contexto

Algunos flujos del sistema bajo prueba incluyen pasos que no se pueden automatizar de forma fiable: un OTP enviado por correo o SMS, un CAPTCHA o una aprobación en otro dispositivo. Sin una convención, estos casos se resuelven de forma ad hoc, bloquean las ejecuciones desatendidas y los Test Cases no indican qué pasos requieren input manual.

## Decisión

Se reconocen dos tipos de prueba, Fully Automated (🤖) y Human-in-the-Loop (👤). Un Test Case Human-in-the-Loop indica en sus pasos qué input se ingresa manualmente. La implementación en Katalon Studio es:

- **Custom Keyword `askHuman()`:** solicita el dato con un diálogo de entrada (`JOptionPane`), que detiene la ejecución hasta recibir la respuesta. Si está definida la variable de entorno alternativa, la usa sin mostrar el diálogo.
- **Etiqueta `human`:** todo caso de prueba que llame a `askHuman()` lleva la etiqueta `human` en sus propiedades. Si la persona debe interactuar con la página (por ejemplo, un CAPTCHA), lleva además la etiqueta `visible`.
- **Test Suite propia:** los casos `human` viven en una Test Suite dedicada, separada de las Test Suites desatendidas, para poder ejecutar estas sin que nadie esté pendiente del equipo.

## Consecuencias

### Positivas

- La intervención humana sigue siendo explícita, declarada en el Test Case y reutilizable.
- Las Test Suites desatendidas no se detienen esperando a una persona.
- El diálogo no requiere funciones de pago de Katalon.

### Negativas / trade-offs

- Las pruebas `human` necesitan a una persona frente al equipo, salvo que se defina la variable de entorno alternativa.
- Hay que mantener alineadas la Test Suite `human` y las desatendidas para que ningún caso quede en ambas o en ninguna.
- Hay que recordar la etiqueta `visible` en los casos que la requieren.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-006: Trazabilidad con Test Cases de Azure DevOps desde los resultados de Katalon](ADR-006-katalon-azure-devops-traceability.md)
- [Testing Standards](../standards/testing.md): requisito `test-types`
