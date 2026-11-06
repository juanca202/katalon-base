package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword

/**
 * Tema del navegador alineado al diseño (Figma en modo light), antes de la primera navegación.
 * El viewport móvil es otra acción: {@link BrowserViewport#emulateMobile(int, int)}. Cada método
 * hace una sola acción y no contiene aserciones (ADR-008).
 */
class BrowserSession {

    /**
     * {@code prefers-color-scheme: light}. Llamar justo después de {@code openBrowser} y antes de
     * {@code navigateToUrl}. En móvil, el caso llama antes a {@code BrowserViewport.emulateMobile}.
     */
    @Keyword
    void prepareLight() {
        new BrowserTheme().forceColorScheme('light')
    }
}
