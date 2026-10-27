package tripot.common

import org.openqa.selenium.JavascriptExecutor
import org.openqa.selenium.WebDriverException
import org.openqa.selenium.WebElement

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Esperas técnicas que los keywords de espera de Katalon no cubren.
 */
class Waits {

    private static final long POLL_INTERVAL_MS = 150L
    private static final String NO_STATE = ''

    // Devuelve 'top|left|dentroDelViewport|animando' del elemento: animando es true si el
    // elemento o alguno de sus ancestros tiene una animación CSS en curso.
    private static final String ELEMENT_STATE_JS = '''
        const el = arguments[0];
        const r = el.getBoundingClientRect();
        const inViewport = r.top >= 0 && r.left >= 0
            && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
        let animating = false;
        for (let e = el; e && !animating; e = e.parentElement) {
            animating = e.getAnimations().some(a => a.playState === 'running');
        }
        return [Math.round(r.top), Math.round(r.left), inViewport, animating].join('|');
    '''

    /**
     * Espera a que un elemento deje de moverse: dentro del viewport, en la misma posición en dos
     * muestras seguidas y sin animaciones CSS en curso.
     *
     * Los paneles inferiores (bottom sheets) de Tripot entran deslizándose desde abajo; un clic
     * durante la animación cae fuera del botón y Selenium lo rechaza como interceptado.
     * waitForElementClickable no lo detecta porque el botón ya es visible y está habilitado.
     *
     * @param testObject elemento que se va a usar a continuación
     * @param timeout tiempo máximo de espera, en segundos
     * @return true si el elemento quedó quieto antes del timeout; false en caso contrario
     */
    @Keyword
    boolean waitForElementSteady(TestObject testObject, int timeout) {
        if (testObject == null || timeout <= 0) {
            KeywordUtil.markFailedAndStop("Parámetros inválidos para waitForElementSteady: ${testObject}, ${timeout}")
            return false
        }
        JavascriptExecutor js = (JavascriptExecutor) DriverFactory.getWebDriver()
        long deadline = System.currentTimeMillis() + timeout * 1000L
        String previous = NO_STATE
        while (System.currentTimeMillis() < deadline) {
            String current = readState(js, testObject)
            // Quieto: misma posición que la muestra anterior, visible entera y sin animación
            if (current != NO_STATE && current == previous && current.endsWith('|true|false')) {
                KeywordUtil.logInfo("Elemento '${testObject.objectId}' estable")
                return true
            }
            previous = current
            sleep(POLL_INTERVAL_MS)
        }
        KeywordUtil.markWarning("Elemento '${testObject.objectId}' sin estabilizarse tras ${timeout} s")
        false
    }

    private static String readState(JavascriptExecutor js, TestObject testObject) {
        List<WebElement> elements = WebUI.findWebElements(testObject, 1)
        if (elements.isEmpty()) {
            return NO_STATE
        }
        try {
            return js.executeScript(ELEMENT_STATE_JS, elements.first()) as String
        } catch (WebDriverException e) {
            // El panel puede re-renderizarse durante la animación: se reintenta en la siguiente muestra
            return NO_STATE
        }
    }

}
