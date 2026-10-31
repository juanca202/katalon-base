package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.configuration.RunConfiguration
import com.kms.katalon.core.util.KeywordUtil

/**
 * Reporte HTML autocontenido de la comparación de estilos con Figma, como evidencia de la
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
    '''

    /**
     * Escribe el reporte de comparación en la carpeta del reporte de la ejecución.
     *
     * @param testCaseId ID del caso (p. ej. 'TC-1234'); forma parte del nombre del archivo
     * @param meta datos de cabecera: título (Map de etiqueta a valor, en orden)
     * @param rows resultados, cada uno con screen, element, node, property, figma, measured, tolerance y status
     * @param screenshots capturas por pantalla: nombre de pantalla a nombre de archivo PNG en la carpeta del reporte
     * @return la ruta absoluta del HTML generado
     */
    @Keyword
    String write(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows, Map<String, String> screenshots) {
        String folder = RunConfiguration.getReportFolder()
        File file = new File(folder, "${testCaseId}-comparacion-estilos-figma.html")
        file.setText(html(testCaseId, meta, rows, screenshots, folder, 'estilos'), 'UTF-8')
        KeywordUtil.logInfo("Reporte de comparación con Figma: ${file.absolutePath}")
        file.absolutePath
    }

    /**
     * Escribe el reporte de comparación de contenido (textos) con Figma, como evidencia de la ejecución.
     * Mismo formato que {@link #write}; el nombre del archivo lleva `comparacion-contenido-figma`, que es
     * lo que usa junit-to-allure.mjs para clasificar el caso como Content.
     *
     * @param testCaseId ID del caso (p. ej. 'TC-1234'); forma parte del nombre del archivo
     * @param meta datos de cabecera: título (Map de etiqueta a valor, en orden)
     * @param rows resultados, cada uno con screen, element, node, property, figma, measured, tolerance y status
     * @param screenshots capturas por pantalla: nombre de pantalla a nombre de archivo PNG en la carpeta del reporte
     * @return la ruta absoluta del HTML generado
     */
    @Keyword
    String writeContent(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows, Map<String, String> screenshots) {
        String folder = RunConfiguration.getReportFolder()
        File file = new File(folder, "${testCaseId}-comparacion-contenido-figma.html")
        file.setText(html(testCaseId, meta, rows, screenshots, folder, 'contenido'), 'UTF-8')
        KeywordUtil.logInfo("Reporte de comparación de contenido con Figma: ${file.absolutePath}")
        file.absolutePath
    }

    private static String html(String testCaseId, Map<String, String> meta, List<Map<String, String>> rows,
            Map<String, String> screenshots, String folder, String subject) {
        StringBuilder out = new StringBuilder()
        out << "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"><title>${esc(testCaseId)} comparación de ${subject} con Figma</title>"
        out << "<style>${STYLE}</style></head><body><h1>${esc(testCaseId)} - Comparación de ${subject} con Figma</h1>"
        out << '<table class="meta">'
        meta.each { String key, String value -> out << "<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>" }
        out << '</table><h2>Resumen por pantalla</h2><table><tr><th>Pantalla</th><th>OK</th><th>Diferencias</th><th>No verificado</th></tr>'
        List<String> screens = rows*.screen.unique()
        screens.each { String screen ->
            out << "<tr><td>${esc(screen)}</td>"
            [OK, DIFFERENCE, NOT_VERIFIED].each { String status ->
                out << "<td>${rows.count { it.screen == screen && it.status == status }}</td>"
            }
            out << '</tr>'
        }
        out << '</table>'
        screens.each { String screen ->
            out << "<h2>${esc(screen)}</h2><table><tr><th>Pantalla</th><th>Elemento</th><th>Nodo Figma</th><th>Propiedad</th>" +
                    '<th>Valor Figma</th><th>Valor medido</th><th>Tolerancia</th><th>Estado</th></tr>'
            rows.findAll { it.screen == screen }.each { Map<String, String> row ->
                out << "<tr class=\"${row.status.replace(' ', '')}\"><td>${esc(row.screen)}</td><td>${esc(row.element)}</td>" +
                        "<td>${esc(row.node)}</td><td>${esc(row.property)}</td><td>${value(row.figma)}</td><td>${value(row.measured)}</td>" +
                        "<td>${esc(row.tolerance)}</td><td>${ICONS[row.status]} ${esc(row.status)}</td></tr>"
            }
            out << '</table>'
            if (screenshots[screen]) {
                out << image(folder, screenshots[screen])
            }
        }
        out << '</body></html>'
        out.toString()
    }

    private static String value(String text) {
        String safe = esc(text)
        (text ==~ COLOR_PATTERN) ? "<span class=\"swatch\" style=\"background:${safe}\"></span>${safe}" : safe
    }

    private static String image(String folder, String name) {
        File png = new File(folder, name)
        if (!png.isFile()) {
            return ''
        }
        String source = png.length() <= MAX_EMBEDDED_BYTES ?
                'data:image/png;base64,' + png.bytes.encodeBase64() : esc(name)
        "<p><img src=\"${source}\" alt=\"${esc(name)}\"></p>"
    }

    private static String esc(String text) {
        (text ?: '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
    }

}
