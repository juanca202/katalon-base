# Code Review — evidencia Style/Content

**Veredicto:** ✅ Aprobado — el cambio resuelve la evidencia de Style/Content y no hay hallazgos bloqueantes.
**Fecha:** 2026-11-06 17:32
**Rama:** main
**Commit:** 4a9d580
**Modo:** default
**Diff:** main @4a9d580 — cambios sin commitear, 13 archivos de código

## Resumen

Se revisó el trabajo sin commitear sobre `main`: helpers de evidencia Figma, el ajuste del estándar de testing y las pruebas de los scripts Node. El diseño encaja con [ADR-003](../adr/ADR-003-katalon-execution-evidence.md) y [ADR-004](../adr/ADR-004-katalon-allure-reporting.md), y el contrato anterior de capturas por nombre de archivo sigue funcionando. Quedan dos mejoras menores, ninguna bloquea.

El informe [quality-check.md](quality-check.md) es salida de otra puerta y no forma parte de este juicio.

## Intención detectada

No hay historia, work item ni pull request. La intención se toma del requisito `web-test-kinds` que este mismo diff añade a [Testing Standards](../standards/testing.md) y del ajuste en [AGENTS.md](../../AGENTS.md): Style y Content comparan valores medidos contra Figma y pueden llevar capturas de apoyo; eso no los convierte en regresión visual. [ScreenshotEvidence](../../tests/katalon/Keywords/com/bayteq/qa/common/ScreenshotEvidence.groovy), [BrowserSession](../../tests/katalon/Keywords/com/bayteq/qa/common/BrowserSession.groovy) y el reporte de [ComparisonReport](../../tests/katalon/Keywords/com/bayteq/qa/common/ComparisonReport.groovy) cubren esa preparación y esa evidencia. La base es más débil que una historia con criterios, y alcanza para evaluar el diff.

## Hallazgos

Leyenda: `🔴` Crítico · `🟠` Importante · `🟡` Menor · `💡` Sugerencia · `✅` Limpio.

### Análisis semántico (intención)

- 🟡 `[ISO-25010: Adecuación funcional]` El lockfile sube Allure sin que el cambio lo pida — **Qué:** [package-lock.json](../../package-lock.json) mueve el árbol de `allure` de 3.20.0 a 3.33.0. [package.json](../../package.json) solo añade el script `test` y deja `"allure": "^3.20.0"`. **Por qué:** `npm ci` instalaría otro CLI de reporte que este diff no necesita para Style/Content. **Impacto:** la generación de Allure de todo el equipo, no solo los casos Figma. **Sugerencia:** revertir [package-lock.json](../../package-lock.json) si la subida no era deliberada. Si lo era, dejarlo en un commit aparte y decir qué se espera del CLI nuevo.

### Arquitectura y diseño

- 🟡 `[ISO-25010: Mantenibilidad]` `prepareMobileLight` hace dos acciones — **Qué:** [BrowserSession.prepareMobileLight](../../tests/katalon/Keywords/com/bayteq/qa/common/BrowserSession.groovy) llama a `emulateMobile` y a `forceColorScheme` en el mismo keyword. **Por qué:** [ADR-008](../adr/ADR-008-groovy-code-style-codenarc.md) y [ADR-010](../adr/ADR-010-katalon-reusable-flows.md) piden una acción por keyword; un método con dos motivos de cambio se reutiliza peor cuando un caso solo quiere viewport o solo tema. **Impacto:** local, en la preparación de los casos móviles Style/Content. [BrowserViewport](../../tests/katalon/Keywords/com/bayteq/qa/common/BrowserViewport.groovy) y [BrowserTheme](../../tests/katalon/Keywords/com/bayteq/qa/common/BrowserTheme.groovy) siguen disponibles. **Sugerencia:** dejar que el caso llame a los dos keywords, o documentar en el estándar que esta preparación es la excepción explícita a «una acción». `prepareLight` sí cumple: una sola llamada.

### Dimensiones no evaluadas

Ninguna.

### Feedback adicional

Lo que está bien y conviene conservar:

- [ComparisonReport.write](../../tests/katalon/Keywords/com/bayteq/qa/common/ComparisonReport.groovy) sigue aceptando un nombre de PNG por pantalla y, además, el mapa `reference` / `measured`. Los casos que ya pasaban un `String` no tienen que cambiar.
- La sección «Evidencia visual» del HTML queda explicada en el estándar: agrupa capturas y no reclasifica el caso como regresión visual. El nombre del archivo (`comparacion-estilos-figma` / `comparacion-contenido-figma`) sigue siendo lo que Allure usa para el tipo.
- [report.test.mjs](../../scripts/katalon/lib/report.test.mjs) y [colors.test.mjs](../../scripts/arch/lib/colors.test.mjs) afirman comportamiento observable: mensaje de HTTP, URL sin base, `TC-<id>`, estados `passed` / `failed` / `skipped` / `broken`, y que el color no altera el texto del protocolo. No dependen de un orden frágil ni de la red.
- En [ApiRequest.truncate](../../tests/katalon/Keywords/com/bayteq/qa/common/ApiRequest.groovy) el `return` de salida anticipada se mantiene. Quitar solo el `return` final deja el mismo resultado y satisface CodeNarc.

- 💡 `[ISO-25010: Seguridad]` [ScreenshotEvidence.writePng](../../tests/katalon/Keywords/com/bayteq/qa/common/ScreenshotEvidence.groovy) y `copyReference` arman la ruta con el nombre que recibe el caso. Un `fileName` o `includeRelativePath` con `..` puede escribir o leer fuera de la carpeta del reporte o de `Include/`. Conviene resolver la ruta y comprobar que el archivo final sigue dentro de esas dos carpetas.

## Próximas acciones

1. Decidir si la subida de Allure 3.33.0 se queda o se revierte el lockfile.
2. Separar viewport y tema en el caso, o dejar escrita la excepción de `prepareMobileLight`.
3. Acotar las rutas de [ScreenshotEvidence](../../tests/katalon/Keywords/com/bayteq/qa/common/ScreenshotEvidence.groovy) a la carpeta del reporte y a `Include/`.

## Justificaciones aceptadas

Ninguna.

<!-- code-review:verdict=APPROVED · mode=default · fingerprint=bbe9bc8f54b673842a73afeb04dd1f601efde489 · base=4a9d580 · generated=2026-11-06 -->
