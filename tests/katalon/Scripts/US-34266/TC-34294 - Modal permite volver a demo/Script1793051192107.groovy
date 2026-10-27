import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import org.openqa.selenium.Keys as Keys
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34294 - AC-009: El modal permite volver a la demo sin registro ni login (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15
final int TIMEOUT = 10

// ===== Preparación =====
'Abrir /auth y entrar al modo demo'
WebUI.openBrowser('')
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

'Abrir el modal de autenticación con un intento de crear'
WebUI.waitForElementClickable(obj('btn_Add'), TIMEOUT)
WebUI.click(obj('btn_Add'))
WebUI.waitForElementClickable(obj('btn_AddExpense'), TIMEOUT)
WebUI.click(obj('btn_AddExpense'))
WebUI.waitForElementVisible(obj('txt_TransactionDescription'), TIMEOUT)
WebUI.waitForElementClickable(obj('btn_Numpad5'), TIMEOUT)
WebUI.click(obj('btn_Numpad5'))
WebUI.setText(obj('txt_TransactionDescription'), 'Demo back to demo')
WebUI.waitForElementClickable(obj('btn_SaveTransaction'), TIMEOUT)
WebUI.click(obj('btn_SaveTransaction'))
WebUI.waitForElementVisible(obj('dlg_AuthRequired'), TIMEOUT)

// ===== Acción =====
'Cerrar el modal sin registrarse ni iniciar sesión (Escape; mecanismo por confirmar)'
WebUI.sendKeys(obj('dlg_AuthRequired'), Keys.chord(Keys.ESCAPE))

// ===== Verificación =====
'El modal se cerró y el usuario sigue en el modo demo'
WebUI.waitForElementNotPresent(obj('dlg_AuthRequired'), TIMEOUT)
WebUI.verifyElementNotPresent(obj('dlg_AuthRequired'), TIMEOUT)
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
WebUI.verifyNotMatch(WebUI.getUrl(), '.*/signin.*', true)
