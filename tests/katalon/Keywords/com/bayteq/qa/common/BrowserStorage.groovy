package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Escritura en el almacenamiento local del navegador. El navegador debe estar en el origen de la
 * aplicación, y el valor lo lee la aplicación al cargar, así que hay que recargar después. Cada método
 * hace una sola acción y no contiene aserciones (ADR-008).
 */
class BrowserStorage {

    /**
     * Establece una clave del `localStorage` de la página actual.
     *
     * @param key nombre de la clave
     * @param value valor a guardar
     */
    @Keyword
    void setLocalStorage(String key, String value) {
        WebUI.executeJavaScript('window.localStorage.setItem(arguments[0], arguments[1]);', [key, value])
        KeywordUtil.logInfo("localStorage.${key} = ${value}")
    }
}
