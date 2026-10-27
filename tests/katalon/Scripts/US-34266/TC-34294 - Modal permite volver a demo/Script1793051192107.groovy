import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
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
CustomKeywords.'tripot.common.Waits.waitForElementSteady'(obj('btn_AddExpense'), TIMEOUT)
WebUI.click(obj('btn_AddExpense'))
WebUI.waitForElementVisible(obj('txt_TransactionDescription'), TIMEOUT)
CustomKeywords.'tripot.web.TransactionFormScreen.typeAmount'('5')
WebUI.setText(obj('txt_TransactionDescription'), 'Demo back to demo')
WebUI.waitForElementClickable(obj('btn_Category'), TIMEOUT)
WebUI.click(obj('btn_Category'))
WebUI.waitForElementClickable(obj('btn_CategoryGrocery'), TIMEOUT)
CustomKeywords.'tripot.common.Waits.waitForElementSteady'(obj('btn_CategoryGrocery'), TIMEOUT)
WebUI.click(obj('btn_CategoryGrocery'))
WebUI.waitForElementClickable(obj('btn_SaveTransaction'), TIMEOUT)
WebUI.click(obj('btn_SaveTransaction'))
WebUI.waitForElementVisible(obj('dlg_AuthRequired'), TIMEOUT)

// ===== Acción =====
'Volver a la demo desde el modal, sin registrarse ni iniciar sesión'
WebUI.waitForElementClickable(obj('btn_ModalBackToDemo'), TIMEOUT)
CustomKeywords.'tripot.common.Waits.waitForElementSteady'(obj('btn_ModalBackToDemo'), TIMEOUT)
WebUI.click(obj('btn_ModalBackToDemo'))

// ===== Verificación =====
'El modal se cerró y el usuario sigue en el modo demo'
WebUI.waitForElementNotPresent(obj('dlg_AuthRequired'), TIMEOUT)
WebUI.verifyElementNotPresent(obj('dlg_AuthRequired'), TIMEOUT)
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
WebUI.verifyNotMatch(WebUI.getUrl(), '.*/signin.*', true)
