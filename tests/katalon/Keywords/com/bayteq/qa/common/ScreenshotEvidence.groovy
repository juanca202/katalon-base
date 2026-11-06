package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.configuration.RunConfiguration
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

import org.openqa.selenium.OutputType
import org.openqa.selenium.TakesScreenshot
import org.openqa.selenium.WebElement

/**
 * Capturas nombradas en la carpeta del reporte de la ejecución, para evidencia Style/Content (Figma).
 * Cada método hace una sola acción y no contiene aserciones (ADR-008).
 */
class ScreenshotEvidence {

    /**
     * Guarda una captura del viewport actual con el nombre indicado en la carpeta del reporte.
     *
     * @param fileName nombre del archivo PNG (p. ej. {@code TC-34654-auth-pantalla.png})
     * @return el {@code fileName} si la captura se escribió; {@code null} si falló
     */
    @Keyword
    String captureViewport(String fileName) {
        writePng(fileName, ((TakesScreenshot) DriverFactory.getWebDriver()).getScreenshotAs(OutputType.FILE))
    }

    /**
     * Guarda una captura del elemento con el nombre indicado en la carpeta del reporte.
     *
     * @param testObject elemento a capturar
     * @param fileName nombre del archivo PNG
     * @return el {@code fileName} si la captura se escribió; {@code null} si falló
     */
    @Keyword
    String captureElement(TestObject testObject, String fileName) {
        WebElement element = WebUI.findWebElement(testObject)
        writePng(fileName, element.getScreenshotAs(OutputType.FILE))
    }

    /**
     * Copia una imagen de referencia versionada (p. ej. export de Figma) a la carpeta del reporte.
     *
     * @param includeRelativePath ruta bajo {@code Include/} (con o sin ese prefijo). No puede salir de esa carpeta
     * @param fileName nombre del archivo PNG en la carpeta del reporte. No puede salir de esa carpeta
     * @return el {@code fileName} si se copió; {@code null} si el origen no existe o la ruta se sale
     */
    @Keyword
    String copyReference(String includeRelativePath, String fileName) {
        if (!includeRelativePath?.trim()) {
            KeywordUtil.markWarning('Referencia Figma fuera de Include/: ruta vacía')
            return null
        }
        String relative = includeRelativePath.startsWith('Include/')
                ? includeRelativePath.substring('Include/'.length())
                : includeRelativePath
        File includeRoot = new File(RunConfiguration.getProjectDir(), 'Include')
        File source = fileInside(includeRoot, relative)
        if (source == null) {
            KeywordUtil.markWarning("Referencia Figma fuera de Include/: ${includeRelativePath}")
            return null
        }
        if (!source.isFile()) {
            KeywordUtil.markWarning("Referencia Figma ausente: ${includeRelativePath}")
            return null
        }
        writePng(fileName, source)
    }

    private static String writePng(String fileName, File source) {
        if (!source?.isFile()) {
            KeywordUtil.markWarning("No se pudo capturar: ${fileName}")
            return null
        }
        File dest = fileInside(new File(RunConfiguration.getReportFolder()), fileName)
        if (dest == null) {
            KeywordUtil.markWarning("Nombre de captura fuera de la carpeta del reporte: ${fileName}")
            return null
        }
        dest.parentFile?.mkdirs()
        dest.bytes = source.bytes
        KeywordUtil.logInfo("Evidencia de capturas (Style/Content): ${dest.absolutePath}")
        fileName
    }

    /**
     * Resuelve {@code relativePath} y lo acepta solo si el archivo queda dentro de {@code root}.
     * Rechaza rutas absolutas y cualquier {@code ..} que salga de esa carpeta.
     */
    private static File fileInside(File root, String relativePath) {
        if (!root || !relativePath?.trim() || new File(relativePath).absolute) {
            return null
        }
        try {
            File rootCanon = root.canonicalFile
            File candidate = new File(rootCanon, relativePath).canonicalFile
            String prefix = rootCanon.path + File.separator
            (candidate.path == rootCanon.path || candidate.path.startsWith(prefix)) ? candidate : null
        } catch (IOException ex) {
            KeywordUtil.markWarning("No se pudo resolver la ruta: ${relativePath} (${ex.message})")
            null
        }
    }

}
