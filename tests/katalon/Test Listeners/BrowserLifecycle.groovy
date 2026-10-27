import com.kms.katalon.core.annotation.AfterTestCase
import com.kms.katalon.core.context.TestCaseContext
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Cierra el navegador al terminar cada caso de prueba, haya pasado o fallado,
 * para que un caso fallido no deje sesiones abiertas que afecten al siguiente.
 */
class BrowserLifecycle {

    @AfterTestCase
    def closeBrowser(TestCaseContext testCaseContext) {
        KeywordUtil.logInfo("Cerrando el navegador tras ${testCaseContext.testCaseId} (${testCaseContext.testCaseStatus})")
        WebUI.closeBrowser(FailureHandling.OPTIONAL)
    }

}
