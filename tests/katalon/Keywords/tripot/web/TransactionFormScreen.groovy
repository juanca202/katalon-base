package tripot.web

import org.openqa.selenium.WebDriver
import org.openqa.selenium.WebDriverException
import org.openqa.selenium.interactions.Actions

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.driver.DriverFactory

/**
 * Acciones sobre el formulario de transacción de Tripot (crear gasto o ingreso).
 */
class TransactionFormScreen {

    private static final String AMOUNT_PATTERN = /\d+([.,]\d{1,2})?/

    /**
     * Escribe el monto de la transacción con el teclado.
     *
     * En escritorio el formulario no tiene campo de monto ni teclado numérico visible:
     * la aplicación escucha las teclas a nivel de documento mientras el monto tiene el foco,
     * que es el estado inicial del formulario. Por eso se envían las teclas con Actions y no
     * con sendKeys sobre un elemento. Llamarlo antes de escribir en otro campo.
     *
     * @param amount monto a escribir, solo dígitos con hasta dos decimales (p. ej. "5" o "12.50")
     */
    @Keyword
    void typeAmount(String amount) {
        if (!(amount ==~ AMOUNT_PATTERN)) {
            KeywordUtil.markFailedAndStop("Monto inválido para el formulario de transacción: '${amount}'")
            return
        }
        try {
            WebDriver driver = DriverFactory.getWebDriver()
            new Actions(driver).sendKeys(amount).perform()
            KeywordUtil.logInfo("Monto '${amount}' escrito en el formulario de transacción")
        } catch (WebDriverException e) {
            KeywordUtil.markFailedAndStop("No se pudo escribir el monto '${amount}': ${e.message}")
        }
    }

}
