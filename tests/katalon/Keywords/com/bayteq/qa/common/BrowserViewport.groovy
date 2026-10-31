package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory

/**
 * Emulación de un dispositivo móvil en el navegador de escritorio mediante el protocolo de Chrome (CDP).
 * `WebUI.setViewPortSize` no baja de unos 500 px de ancho, así que no sirve para un viewport móvil real.
 * Cada método hace una sola acción y no contiene aserciones (ADR-008).
 */
class BrowserViewport {

    private static final int DEVICE_SCALE_FACTOR = 1

    /**
     * Fija un viewport móvil exacto, con modo móvil y eventos táctiles. Hay que llamarlo antes de cargar
     * la aplicación.
     *
     * @param width ancho en píxeles CSS
     * @param height alto en píxeles CSS
     */
    @Keyword
    void emulateMobile(int width, int height) {
        def driver = DriverFactory.getWebDriver()
        Map<String, Object> metrics = [
            'width'            : width,
            'height'           : height,
            'deviceScaleFactor': DEVICE_SCALE_FACTOR,
            'mobile'           : true,
        ]
        driver.executeCdpCommand('Emulation.setDeviceMetricsOverride', metrics)
        driver.executeCdpCommand('Emulation.setTouchEmulationEnabled', ['enabled': true, 'maxTouchPoints': 1])
        KeywordUtil.logInfo("Viewport móvil emulado: ${width}x${height}")
    }
}
