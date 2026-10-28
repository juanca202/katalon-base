---
id: ADR-012
status: Accepted
last_update: 2026-10-27
deciders: [Equipo de QA]
tags: [testing, api, rest, graphql, katalon, json-schema]
supersedes: null
superseded_by: null
emits: []
---

# ADR-012: Pruebas de API REST y GraphQL con Katalon

## Contexto

Katalon Studio prueba APIs REST y GraphQL ([ADR-002](ADR-002-katalon-test-runner.md)), y la edición gratuita incluye la importación de OpenAPI, las peticiones GraphQL y la validación de esquemas. La evidencia de cada llamada ya está definida: un Custom Keyword común envía la petición y registra el request, el response y las verificaciones ([ADR-003](ADR-003-katalon-execution-evidence.md)). Falta decidir cómo se definen las peticiones y cómo se verifican las respuestas.

## Decisión

- **Peticiones como Web Service Requests** en `Object Repository/API/<servicio>/`, una por operación, con la URL base tomada de una variable global del perfil (`GlobalVariable.G_ApiBaseUrl`) y los datos de cada llamada como variables. Si el servicio publica una especificación OpenAPI, las peticiones se importan desde ella.
- **GraphQL** con el tipo de cuerpo GraphQL de Katalon, una petición por operación (query o mutation).
- **Envío** siempre mediante el Custom Keyword de evidencia de [ADR-003](ADR-003-katalon-execution-evidence.md), nunca con `WS.sendRequest` directo en el caso.
- **Verificación** en el caso de prueba, con keywords específicos: código de estado (`WS.verifyResponseStatusCode`), valores del cuerpo (`WS.verifyElementPropertyValue`) y estructura del cuerpo contra un JSON Schema versionado en `tests/katalon/Include/schemas/` (`WS.validateJsonAgainstSchema`, Katalon 8.4.0 o posterior).
- **Autenticación:** los tokens se obtienen al inicio del caso con un keyword común y se pasan como variable; no se guardan en las peticiones ni en los perfiles.

Pendiente de confirmar: qué APIs del sistema bajo prueba están en alcance y si publican una especificación OpenAPI.

## Consecuencias

### Positivas

- Cada operación de la API se define una vez y la reutilizan todos los casos.
- La validación de esquema detecta cambios de contrato aunque los valores sigan siendo correctos.
- Toda llamada deja evidencia por el mismo keyword.

### Negativas / trade-offs

- Los JSON Schema hay que escribirlos y mantenerlos si la API no publica su especificación.
- `WS.validateJsonAgainstSchema` exige Katalon 8.4.0 o posterior.
- Probar la API en producción está sujeto a la política de ambientes de [ADR-011](ADR-011-test-environments.md).

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-011: Ambientes de ejecución y política de pruebas en producción](ADR-011-test-environments.md)
- [Katalon: validar JSON contra un esquema](https://docs.katalon.com/katalon-studio/keywords/keyword-description-in-katalon-studio/web-service-keywords/ws-validate-json-string-against-a-schema)
- [Katalon: pruebas de cumplimiento de esquema](https://docs.katalon.com/katalon-studio/test-objects/api-test-objects/schema-compliance-testing-in-katalon-studio)
