# TC-34287 — Dado un modo demo cuyo archivo JSON de datos no está disponible o es ilegible, Cuando el usuario ingresa a la demo, Entonces el sistema maneja el error sin romper la navegación

<!-- tc:status=Ready · testType=E2E · criterion=AC-002 · parent=US-34266 -->

**Estado:** Ready
**Tipo de prueba:** E2E
**Fecha:** 2026-10-26
**Perspectiva:** Error
**Prioridad:** Media
**Criterio de aceptación:** AC-002 (Procesamiento de datos) — Poblado de vistas con los archivos JSON de demo
**Artefacto padre:** US-34266
**Creado por:** juanca202
**Work Item (ADO):** [#34287](https://dev.azure.com/BayteqDev/Bayteq%20IA/_workitems/edit/34287)

## Precondiciones

- Entorno de referencia: **Producción**.
- El archivo JSON de demo esperado no existe, no se puede descargar o está corrupto.

## Datos de prueba

| Campo           | Valor              | Notas                                |
| --------------- | ------------------ | ------------------------------------ |
| Archivo de demo | ausente / corrupto | Escenario negativo de carga de datos |

## Pasos de ejecución

| #   | Actor   | Acción                                                                                     | Resultado esperado del paso                                                                                                         |
| --- | ------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | sistema | Se configura el escenario donde el archivo JSON de demo esperado no existe o está corrupto | El sistema no dispone de datos ficticios válidos para cargar                                                                        |
| 2   | usuario | Selecciona explorar la demo desde `/auth`                                                  | El sistema intenta cargar el archivo de demo                                                                                        |
| 3   | usuario | Observa el resultado                                                                       | El sistema maneja el fallo de carga de forma controlada (mensaje o estado vacío) sin pantalla en blanco ni bloqueo de la aplicación |

## Resultado esperado final

Ante un archivo de demo no disponible o ilegible, el sistema degrada de forma controlada: no muestra una pantalla en blanco ni bloquea la aplicación, y el usuario puede salir o reintentar.

## Observaciones

- Verificación de **flujo**, no visual.
- El comportamiento exacto de degradación (mensaje de error vs. estado vacío) no lo detalla el criterio; se valida que la navegación no se rompa. `[supuesto]`
