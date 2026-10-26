# TC-34295 — Dado el conjunto de archivos de demo, Cuando se verifica su nomenclatura, Entonces todos siguen la convención de nombre en formato slug con prefijo demo-

<!-- tc:status=Ready · testType=E2E · criterion=AC-010 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Fecha:** 2026-10-26
**Perspectiva:** Happy Path
**Prioridad:** Media
**Criterio de aceptación:** AC-010 (Procesamiento de datos) — Convención de nombre slug con prefijo demo-
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34295](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34295)

## Precondiciones

- Entorno de referencia: **Producción**.
- Se dispone del conjunto de archivos de datos de demo que alimenta el modo demo.

## Datos de prueba

| Campo            | Valor                                                                                                                        | Notas                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Archivos de demo | `demo-user-ar.json`, `demo-user-br.json`, `demo-user-co.json`, `demo-user-es.json`, `demo-user-mx.json`, `demo-user-us.json` | Presentes en `tests/data/` como referencia         |
| Patrón de nombre | `demo-<slug>.json`                                                                                                           | prefijo `demo-`, minúsculas, separadas por guiones |

## Pasos de ejecución

| #   | Actor   | Acción                                                             | Resultado esperado del paso                                                           |
| --- | ------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1   | sistema | Localiza los archivos de datos de demo utilizados por el modo demo | Se dispone del listado de archivos de demo                                            |
| 2   | sistema | Revisa el nombre de cada archivo contra la convención              | Cada nombre comienza con el prefijo `demo-` y usa formato slug, con extensión `.json` |
| 3   | sistema | Confirma que el modo demo carga a partir de esos archivos          | El archivo de demo seleccionado respeta la convención y es el que alimenta las vistas |

## Resultado esperado final

Todos los archivos de datos de demo siguen la convención de nombre en formato slug con prefijo `demo-`, y el archivo que alimenta el modo demo respeta esa convención.

## Observaciones

- Verificación de **flujo** sobre el artefacto de datos (nomenclatura), observable sin UI.
