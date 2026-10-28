---
id: ADR-013
status: Accepted
last_update: 2026-10-27
deciders: [Equipo de QA]
tags: [testing, visual-regression, screenshots, katalon]
supersedes: null
superseded_by: null
emits: []
---

# ADR-013: Regresión visual con capturas y línea base versionada

## Contexto

[ADR-003](ADR-003-katalon-execution-evidence.md) contempla la regresión visual como tipo de prueba, pero no hay una decisión sobre cómo se compara una pantalla con su versión esperada. En Katalon, la comparación de imágenes la hace Katalon TestOps: Studio toma la captura con los keywords de checkpoint y TestOps la compara con una línea base. Eso exige subir los resultados a una plataforma externa, con un cupo de resultados según el plan, y no encaja con la ejecución local de la edición gratuita ([ADR-002](ADR-002-katalon-test-runner.md)).

## Decisión

- **Comparación local** con un Custom Keyword que toma la captura del elemento o de la pantalla y la compara píxel a píxel con una imagen de referencia, con una tolerancia de diferencia configurable y zonas a ignorar (fechas, saldos, contenido dinámico).
- **Línea base versionada** en `tests/katalon/Include/visual-baselines/<plataforma>/<resolución>/`, con una imagen por caso y punto de control. Se actualiza solo con revisión en un pull request.
- **Resolución y navegador fijos** para las pruebas visuales, porque una línea base solo es comparable con capturas tomadas en las mismas condiciones.
- **Evidencia:** ante una diferencia, el keyword adjunta la captura actual, la línea base y la imagen de diferencias al reporte ([ADR-004](ADR-004-katalon-allure-reporting.md)).
- La regresión visual se limita a pantallas estables y de alto valor; no se aplica a todas las pruebas E2E.

## Alternativas consideradas

- **Katalon TestOps Visual Testing:** compara con métodos por píxel, por estructura y por contenido, sin código propio, pero exige subir resultados a TestOps y depende del cupo del plan.
- **Applitools mediante su integración con Katalon:** comparación con IA, de pago.
- **Sin regresión visual:** las diferencias visuales se detectarían solo en revisión manual.

## Consecuencias

### Positivas

- La comparación corre en local, sin plataformas ni licencias adicionales.
- La línea base se revisa y versiona como el resto del proyecto.

### Negativas / trade-offs

- Un keyword de comparación propio que mantener.
- La comparación por píxel es sensible a fuentes, antialiasing y contenido dinámico; exige zonas ignoradas y tolerancia.
- Cada cambio intencional de la interfaz obliga a actualizar la línea base.

## Referencias

- [ADR-002: Katalon como runner único de pruebas](ADR-002-katalon-test-runner.md)
- [ADR-003: Evidencias de ejecución con Katalon](ADR-003-katalon-execution-evidence.md)
- [ADR-004: Reportería con Allure a partir de los resultados de Katalon](ADR-004-katalon-allure-reporting.md)
- [Katalon: pruebas visuales](https://katalon.com/resources-center/blog/how-to-do-visual-testing-in-katalon-studio)
