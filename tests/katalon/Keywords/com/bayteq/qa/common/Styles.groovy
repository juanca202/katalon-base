package com.bayteq.qa.common

import java.util.regex.Matcher

import org.openqa.selenium.JavascriptExecutor
import org.openqa.selenium.WebElement

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Lectura de estilos CSS calculados para la comparación con Figma (ADR-013). Cada método hace una
 * sola lectura y no contiene aserciones: la comparación con el valor de Figma la hace el caso.
 */
class Styles {

    private static final int TIMEOUT = 10
    private static final String BACKGROUND = 'background-color'
    // Fondo que se ve tras el elemento: el primero no transparente subiendo por sus ancestros
    private static final String EFFECTIVE_BACKGROUND_JS = '''
        let el = arguments[0];
        while (el) {
            const color = getComputedStyle(el).backgroundColor;
            if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') { return color; }
            el = el.parentElement;
        }
        return 'rgba(0, 0, 0, 0)';
    '''
    private static final int MAX_CHANNEL = 255
    private static final double OPAQUE = 1.0d
    private static final String COLOR_PATTERN = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/
    // Chrome devuelve color(srgb r g b / a) con componentes entre 0 y 1 para algunos colores con alfa
    private static final String SRGB_PATTERN = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/

    /**
     * Lee una propiedad CSS calculada y la normaliza para compararla: los colores rgb()/rgba() pasan
     * a hex en minúsculas (#rrggbb, o #rrggbbaa si tienen alfa menor que 1), font-family a su primera
     * familia sin comillas y el resto de valores quedan tal como los calcula el navegador. En
     * background-color se lee el fondo que se ve tras el elemento (el del primer ancestro que pinta),
     * porque los botones de Material son transparentes y el color lo pone el contenedor.
     *
     * @param testObject elemento a medir
     * @param property nombre CSS de la propiedad (p. ej. 'font-size', 'padding-left', 'color')
     * @return el valor normalizado, o null si el elemento no está presente
     */
    @Keyword
    String readCss(TestObject testObject, String property) {
        if (testObject == null || !property?.trim()) {
            throw new IllegalArgumentException("readCss: parámetros inválidos ${testObject}, ${property}")
        }
        if (!WebUI.waitForElementPresent(testObject, TIMEOUT, FailureHandling.OPTIONAL)) {
            KeywordUtil.logInfo("Elemento ausente: ${testObject.objectId}")
            return null
        }
        WebElement element = WebUI.findWebElement(testObject, TIMEOUT)
        String raw = property == BACKGROUND ?
                ((JavascriptExecutor) DriverFactory.getWebDriver()).executeScript(EFFECTIVE_BACKGROUND_JS, element) as String :
                element.getCssValue(property)
        normalize(property, raw)
    }

    /**
     * Lee los textos de todos los elementos que coinciden con el objeto.
     *
     * @param testObject elementos a leer
     * @return los textos en el orden del documento
     */
    @Keyword
    List<String> readTexts(TestObject testObject) {
        WebUI.waitForElementPresent(testObject, TIMEOUT, FailureHandling.OPTIONAL)
        WebUI.findWebElements(testObject, TIMEOUT).collect { it.text.trim() }
    }

    static String normalize(String property, String raw) {
        if (raw == null) {
            return null
        }
        if (property == 'font-family') {
            return raw.split(',').first().trim().replaceAll(/^["']|["']$/, '')
        }
        Matcher color = raw =~ COLOR_PATTERN
        if (color.matches()) {
            return toHex(color.group(1) as int, color.group(2) as int, color.group(3) as int,
                    color.group(4) == null ? OPAQUE : color.group(4) as double)
        }
        Matcher srgb = raw =~ SRGB_PATTERN
        if (srgb.matches()) {
            return toHex(Math.round((srgb.group(1) as double) * MAX_CHANNEL) as int,
                    Math.round((srgb.group(2) as double) * MAX_CHANNEL) as int,
                    Math.round((srgb.group(3) as double) * MAX_CHANNEL) as int,
                    srgb.group(4) == null ? OPAQUE : srgb.group(4) as double)
        }
        raw
    }

    private static String toHex(int red, int green, int blue, double alpha) {
        String hex = String.format('#%02x%02x%02x', red, green, blue)
        alpha < OPAQUE ? hex + String.format('%02x', Math.round(alpha * MAX_CHANNEL) as int) : hex
    }

}
