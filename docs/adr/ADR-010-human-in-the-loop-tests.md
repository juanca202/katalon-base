---
id: ADR-010
status: Superseded
last_update: 2026-10-26
deciders: [Equipo de QA]
tags: [testing, human-in-the-loop, playwright, otp]
supersedes: null
superseded_by: ADR-016
emits: [testing/CR-015, testing/CR-016, testing/CR-017, testing/CR-018]
---

# ADR-010: Tipos de prueba Fully Automated y Human-in-the-Loop

## Contexto

El framework prueba aplicaciones externas sin acceso al código fuente. Algunos flujos incluyen pasos que no se pueden automatizar de forma fiable: un OTP enviado por correo o SMS, un CAPTCHA o una aprobación en otro dispositivo. Sin una convención, estos casos se resuelven de forma ad hoc, con dos problemas:

- Los workers de Playwright no reciben `process.stdin`, así que un `readline` directo en la prueba se queda colgado.
- Al ejecutar toda la suite en paralelo y en varios proyectos de browser, el prompt se pierde entre la salida de otras pruebas y se repite por proyecto, y en CI bloquea la ejecución.

El navegador visible tampoco es siempre necesario: en un OTP por email o SMS la persona obtiene el dato fuera de la página, mientras que en un CAPTCHA sí debe ver e interactuar con ella.

Además, los Test Cases no indicaban qué pasos requieren input manual, por lo que quien automatiza la prueba no sabía que debía considerar ese flujo.

## Decisión

Se reconocen dos tipos de prueba, tanto para los Test Cases como para las pruebas que los automatizan:

| Tipo | Nombre            | Descripción                                                                      |
| ---- | ----------------- | -------------------------------------------------------------------------------- |
| 🤖   | Fully Automated   | El caso se ejecuta completamente sin intervención humana.                        |
| 👤   | Human-in-the-Loop | El flujo es automatizado, pero requiere intervención humana en uno o más puntos. |

En un Test Case Human-in-the-Loop se especifica en sus pasos qué input se ingresa manualmente, para que al generar la prueba se considere ese flujo.

La intervención humana se implementa con un helper común, `askHuman()` (`src/helpers/human-intervention.ts`), que lee de la terminal (`/dev/tty`) en lugar de `stdin`, admite una variable de ambiente alternativa y falla en CI si no hay valor. Las pruebas Human-in-the-Loop se marcan con la etiqueta `@human`, se excluyen de la suite por defecto y se ejecutan con una configuración dedicada (`playwright.human.config.ts`, `npm run test:human`) con Chromium y un worker. El browser es visible solo en las pruebas que además llevan la etiqueta `@visible` (por ejemplo, un CAPTCHA que la persona resuelve en la página); cuando el dato llega por otro canal, como un OTP por email o SMS, corre headless.

## Alternativas consideradas

- Leer `stdin` con `readline` directamente en la prueba: no funciona en los workers de Playwright.
- `page.pause()` con el Inspector de Playwright: obliga a la persona a reanudar manualmente y no devuelve el dato a la prueba.
- Que la persona escriba el dato directamente en el browser y la prueba solo espere el resultado: es válido para algunos flujos y puede combinarse, pero no sirve cuando la prueba necesita el valor para continuar.
- Browser visible en todas las pruebas `@human`: innecesario cuando el dato llega por otro canal, y estorba al ejecutar varias pruebas seguidas.
- Ejecutar las pruebas `@human` dentro de `npm test`: bloquea CI y mezcla los prompts con la salida de la suite paralela.

## Consecuencias

### Positivas

- La intervención humana es explícita, visible en el Test Case y reutilizable en cualquier prueba.
- `npm test` y CI no se bloquean por esperar a una persona.
- El browser solo es visible cuando la prueba lo necesita, y la necesidad queda declarada en la propia prueba con `@visible`.
- Se puede reportar por separado qué parte de la cobertura depende de una persona.

### Negativas / trade-offs

- Las pruebas `@human` requieren una terminal interactiva y no corren de forma desatendida salvo que se defina la variable de ambiente alternativa.
- Hay que recordar añadir `@visible` en las pruebas que lo requieren; sin ella, una prueba de CAPTCHA correría headless y fallaría.
- Dos comandos de ejecución (`npm test` y `npm run test:human`) que hay que mantener alineados.
- Lectura de `/dev/tty` o `CON`, dependiente de la plataforma.

## Referencias

- [Testing Standards](../standards/testing.md): requisito `test-types`
- [ADR-007: Evidencias y artefactos de ejecución](ADR-007-execution-evidence.md)
- [ADR-008: Trazabilidad entre pruebas automatizadas y Test Cases de Azure DevOps](ADR-008-azure-devops-test-case-traceability.md)
- Superseded por [ADR-016: Pruebas Human-in-the-Loop con Katalon](ADR-016-katalon-human-in-the-loop.md) el 2026-10-26.
