---
id: ADR-001
status: Accepted
last_update: 2026-10-02
deciders: [Equipo de QA]
tags: [git, conventional-commits, commitlint, husky]
supersedes: null
superseded_by: null
emits: []
---

# ADR-001: Conventional Commits con commitlint y Husky

## Contexto

El repositorio es un framework de QA basado en Katalon Studio. Varias personas aportan cambios y hace falta una convención común para los mensajes de commit, de modo que el historial sea legible, filtrable y compatible con herramientas que asumen Conventional Commits.

Husky ya forma parte del stack del proyecto (`package.json`), lo que permite enganchar validaciones en el ciclo de commit sin cambiar el modelo de colaboración.

## Decisión

Se adopta **Conventional Commits** como estrategia de mensajes de commit en este repositorio, con el formato `type(scope): description`.

Tipos permitidos de forma explícita:

- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `build`
- `ci`
- `chore`
- `revert`

El enforcement de esa convención se realiza validando los mensajes con **commitlint** en el hook **`commit-msg`** de **Husky**.

## Consecuencias

### Positivas

- Historial de commits homogéneo y fácil de revisar.
- Tipos acotados reducen ambigüedad al clasificar cambios.
- La validación en `commit-msg` rechaza mensajes fuera de la convención antes de que entren al historial.

### Negativas / trade-offs

- Los commits que no cumplan el formato no se aceptan hasta corregir el mensaje.
- El equipo debe conocer los tipos permitidos y el formato `type(scope): description`.
- Depende de que el hook de Husky y la validación con commitlint estén operativos en el entorno local.

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
