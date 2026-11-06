package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.configuration.RunConfiguration
import com.kms.katalon.core.util.KeywordUtil

/**
 * Reporte HTML autocontenido de la comparación con Figma, como evidencia de la
 * ejecución (ADR-003). Escribe un archivo y no contiene aserciones.
 */
class ComparisonReport {

    static final String OK = 'OK'
    static final String DIFFERENCE = 'DIFERENCIA'
    static final String NOT_VERIFIED = 'NO VERIFICADO'

    private static final long MAX_EMBEDDED_BYTES = 600_000L
    private static final String COLOR_PATTERN = /#[0-9a-f]{6}([0-9a-f]{2})?/
    private static final Map<String, String> ICONS = [(OK): '✅', (DIFFERENCE): '❌', (NOT_VERIFIED): '⚠️']
    private static final String STYLE = '''
        body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
        h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 28px; }
        table { border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom: 8px; }
        th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; }
        tr.DIFERENCIA td { background: #ffe5e5; } tr.NOVERIFICADO td { background: #fff4d6; }
        .swatch { display: inline-block; width: 12px; height: 12px; border: 1px solid #888; margin-right: 6px; vertical-align: middle; }
        .meta td:first-child { font-weight: bold; width: 160px; background: #f0f0f0; }
        img { max-width: 360px; border: 1px solid #ccc; margin: 4px; }
        .evidence-grid { display: flex; flex-wrap: wrap; gap: 16px; margin: 12px 0 24px; }
        .evidence-grid figure { margin: 0; max-width: 360px; }
        .evidence-grid figcaption { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
    '''

    /**
     * Escribe el reporte de comparación de estilos en la carpeta del reporte de la ejecución.
     *
     * @param testCaseId ID del caso (p. ej. 'TC-1234')
     * @param meta cabecera del reporte
     * @param rows filas de comparación
     * @param screenshots por pantalla: {@code reference} (Figma) y {@code measured} (captura probada), nombres de PNG en la carpeta del reporte
     */
    @Keyword
    String write(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows, Map screenshots) {
        String folder = RunConfiguration.getReportFolder()
        File file = new File(folder, "${testCaseId}-comparacion-estilos-figma.html")
        file.setText(renderHtml(testCaseId, meta, rows, screenshots, folder, 'estilos'), 'UTF-8')
        KeywordUtil.logInfo("Reporte de comparación con Figma: ${file.absolutePath}")
        file.absolutePath
    }

    /**
     * Escribe el reporte de comparación de contenido (textos). El nombre del archivo usa
     * {@code comparacion-contenido-figma}, que junit-to-allure.mjs usa para clasificar Content.
     */
    @Keyword
    String writeContent(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows, Map screenshots) {
        String folder = RunConfiguration.getReportFolder()
        File file = new File(folder, "${testCaseId}-comparacion-contenido-figma.html")
        file.setText(renderHtml(testCaseId, meta, rows, screenshots, folder, 'contenido'), 'UTF-8')
        KeywordUtil.logInfo("Reporte de comparación de contenido con Figma: ${file.absolutePath}")
        file.absolutePath
    }

    private static String renderHtml(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows,
            Map screenshots, String folder, String subject) {
        StringBuilder out = new StringBuilder()
        out << "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"><title>${escapeHtml(testCaseId)} comparación de ${subject} con Figma</title>"
        out << "<style>${STYLE}</style></head><body><h1>${escapeHtml(testCaseId)} - Comparación de ${subject} con Figma</h1>"
        out << '<table class="meta">'
        for (Map.Entry<String, String> entry in meta.entrySet()) {
            out << "<tr><td>${escapeHtml(entry.key)}</td><td>${escapeHtml(entry.value)}</td></tr>"
        }
        out << '</table><h2>Resumen por pantalla</h2><table><tr><th>Pantalla</th><th>OK</th><th>Diferencias</th><th>No verificado</th></tr>'
        List<String> screens = rows*.screen.unique()
        for (String screen in screens) {
            out << "<tr><td>${escapeHtml(screen)}</td>"
            for (String status in [OK, DIFFERENCE, NOT_VERIFIED]) {
                out << "<td>${rows.count { it.screen == screen && it.status == status }}</td>"
            }
            out << '</tr>'
        }
        out << '</table>'
        for (String screen in screens) {
            out << "<h2>${escapeHtml(screen)}</h2><table><tr><th>Pantalla</th><th>Elemento</th><th>Nodo Figma</th><th>Propiedad</th>" +
                    '<th>Valor Figma</th><th>Valor medido</th><th>Tolerancia</th><th>Estado</th></tr>'
            for (Map<String, String> row in rows.findAll { it.screen == screen }) {
                out << "<tr class=\"${row.status.replace(' ', '')}\"><td>${escapeHtml(row.screen)}</td><td>${escapeHtml(row.element)}</td>" +
                        "<td>${escapeHtml(row.node)}</td><td>${escapeHtml(row.property)}</td><td>${formatValue(row.figma)}</td>" +
                        "<td>${formatValue(row.measured)}</td><td>${escapeHtml(row.tolerance)}</td>" +
                        "<td>${ICONS[row.status]} ${escapeHtml(row.status)}</td></tr>"
            }
            out << '</table>'
            Object screenEvidence = screenshots?.get(screen)
            out << evidenceSectionHtml(folder, screenEvidence)
        }
        out << '</body></html>'
        out.toString()
    }

    private static String evidenceSectionHtml(String folder, Object screenEvidence) {
        if (screenEvidence == null) {
            return ''
        }
        if (screenEvidence instanceof String) {
            return "<h3>Evidencia visual</h3>${embedPng(folder, screenEvidence as String)}"
        }
        if (!(screenEvidence instanceof Map)) {
            return ''
        }
        Map evidence = screenEvidence as Map
        StringBuilder block = new StringBuilder('<h3>Evidencia visual</h3><div class="evidence-grid">')
        appendFigure(block, folder, 'Referencia (Figma)', evidence.reference as String)
        String measured = (evidence.measured ?: evidence.element) as String
        appendFigure(block, folder, 'Elemento probado', measured)
        block << '</div>'
        block.toString()
    }

    private static void appendFigure(StringBuilder block, String folder, String caption, String fileName) {
        if (!fileName) {
            return
        }
        block << "<figure><figcaption>${escapeHtml(caption)}</figcaption>${embedPng(folder, fileName)}</figure>"
    }

    private static String formatValue(String text) {
        String safe = escapeHtml(text)
        (text ==~ COLOR_PATTERN) ? "<span class=\"swatch\" style=\"background:${safe}\"></span>${safe}" : safe
    }

    private static String embedPng(String folder, String name) {
        File png = new File(folder, name)
        if (!png.isFile()) {
            return "<p><em>${escapeHtml(name)} (no encontrado)</em></p>"
        }
        String source = png.length() <= MAX_EMBEDDED_BYTES ?
                'data:image/png;base64,' + png.bytes.encodeBase64() : escapeHtml(name)
        "<p><img src=\"${source}\" alt=\"${escapeHtml(name)}\"></p>"
    }

    private static String escapeHtml(String text) {
        (text ?: '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
    }

}
