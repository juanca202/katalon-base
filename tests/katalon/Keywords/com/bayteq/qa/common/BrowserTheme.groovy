package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory

/**
 * Fija el esquema de color (`prefers-color-scheme`) del navegador, para medir una aplicación que sigue el
 * tema del sistema en el mismo modo que su diseño de referencia. Cada método hace una sola acción y no
 * contiene aserciones (ADR-008).
 */
class BrowserTheme {

    /**
     * Fuerza el esquema de color del navegador mediante el protocolo de Chrome (CDP). Hay que llamarlo
     * antes de cargar la aplicación.
     *
     * @param scheme 'light' o 'dark'
     */
    @Keyword
    void forceColorScheme(String scheme) {
        if (!(scheme in ['light', 'dark'])) {
            throw new IllegalArgumentException("forceColorScheme: esquema inválido ${scheme}")
        }
        Map<String, Object> feature = ['name': 'prefers-color-scheme', 'value': scheme]
        DriverFactory.getWebDriver().executeCdpCommand('Emulation.setEmulatedMedia', ['features': [feature]])
        KeywordUtil.logInfo("Esquema de color del navegador: ${scheme}")
    }
}
