---
name: Coding Style Standards
domain: coding-style
status: Active
last_update: 2026-10-26
source_adrs: [ADR-008]
tags: [coding-style, groovy, codenarc, katalon, eslint, prettier]
---

# Coding Style Standards

Este estándar cubre el estilo y las herramientas de calidad del código del framework de QA: el código Groovy del proyecto Katalon (scripts de los casos de prueba en `Scripts/` y Custom Keywords en `Keywords/`) y el código Node auxiliar de `scripts/`.

## Análisis estático de Groovy

**ID:** codenarc
**Estado:** Active

El código Groovy de `Scripts/` y `Keywords/` **DEBE** analizarse con CodeNarc, ejecutado como tarea de Gradle desde el `build.gradle` del proyecto Katalon y con un `codenarc.ruleset` versionado, antes de abrir un pull request.

### Excepciones

Ninguna.

## Custom Keywords

**ID:** custom-keywords
**Estado:** Active

Cada Custom Keyword **DEBE** realizar una sola acción y **NO DEBE** contener aserciones: las verificaciones van en el caso de prueba. Los errores técnicos **DEBEN** capturarse y reportarse con `KeywordUtil` (`markFailed`, `markPassed`, `logInfo`) para que aparezcan en el log. Un keyword que devuelve datos **DEBE** declarar su tipo de retorno en lugar de `def`. Todo método expuesto como keyword **DEBE** llevar la anotación `@Keyword`.

### Excepciones

Ninguna.

## Linting de scripts Node

**ID:** eslint
**Estado:** Active

El código Node auxiliar de `scripts/` **DEBE** lintarse con ESLint en flat config (`eslint.config.js`). Estas reglas **DEBEN** estar en severidad `error`: `no-unused-vars`, `prefer-const` y `no-var`.

### Excepciones

Ninguna.

## Formato

**ID:** formatting
**Estado:** Active

El código Node de `scripts/` y los archivos `*.json` y `*.md` **DEBEN** formatearse con Prettier (`.prettierrc`) con `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 80` y `tabWidth: 2`. El código Groovy **DEBERÍA** formatearse con el formateador de Katalon Studio.

### Excepciones

Ninguna.

## Hooks de Git

**ID:** git-hooks
**Estado:** Active

El pre-commit **DEBE** ejecutarse con Husky y lint-staged: ESLint y Prettier sobre `scripts/**/*.{js,mjs}`, y Prettier sobre `*.{json,md}`.

### Excepciones

Ninguna.

## Nombres

**ID:** naming
**Estado:** Active

En Groovy, los paquetes de Custom Keywords **DEBEN** ir en minúsculas con dominio invertido, las clases **DEBEN** usar PascalCase, los métodos y variables **DEBEN** usar camelCase y las constantes **DEBEN** usar `UPPER_SNAKE_CASE`. Los nombres de los casos de prueba siguen el formato `TC-<id> - título` del requisito `azure-devops-traceability` del estándar de [Testing](testing.md).

### Excepciones

Ninguna.

## Secretos

**ID:** secrets
**Estado:** Active

Las credenciales y los tokens **NO DEBEN** quedar hardcodeados en scripts, keywords, Test Objects ni Execution Profiles versionados. **DEBEN** leerse de variables de entorno del equipo que ejecuta ([ADR-007](../adr/ADR-007-katalon-test-data.md)), y la ausencia de una variable requerida **DEBE** fallar de forma explícita.

### Excepciones

Ninguna.

## Test Objects

**ID:** locators
**Estado:** Active

Los elementos de la interfaz **DEBEN** definirse como Test Objects en el Object Repository y referenciarse con `findTestObject()`. **NO DEBEN** escribirse selectores dentro de los scripts de los casos de prueba. Un Test Object que varía por índice o texto **DEBERÍA** parametrizarse con variables en lugar de duplicarse.

### Excepciones

Ninguna.

## Validación de entradas

**ID:** input-validation
**Estado:** Active

Una entrada de un Custom Keyword **DEBE** validarse antes de usarse.

### Excepciones

Ninguna.

## Documentación de código

**ID:** code-docs
**Estado:** Active

Los Custom Keywords **DEBEN** documentarse con Groovydoc (propósito, parámetros y retorno). La lógica compleja **DEBE** llevar un comentario inline.

El README del proyecto **DEBE** incluir instrucciones de setup, ejemplos de uso, problemas frecuentes y una vista de la arquitectura.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID  | Requisito | Descripción | Automatizable | Enfoque | Verificación |
| --- | --------- | ----------- | ------------- | ------- | ------------ |

## Referencias

- [ADR-008: Estilo de código Groovy con CodeNarc](../adr/ADR-008-groovy-code-style-codenarc.md)
- [ADR-002: Katalon como runner único de pruebas](../adr/ADR-002-katalon-test-runner.md)
- [Katalon: buenas prácticas de Custom Keywords](https://docs.katalon.com/katalon-studio/keywords/custom-keywords/custom-keywords-best-practices)
- [CodeNarc](https://codenarc.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
