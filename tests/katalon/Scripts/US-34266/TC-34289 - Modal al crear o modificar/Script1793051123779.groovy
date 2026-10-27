import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34289 - AC-004: Modal de login/registro al intentar crear o modificar (Happy Path)
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

// ===== Acción =====
'Crear un gasto e intentar guardarlo'
WebUI.waitForElementClickable(obj('btn_Add'), TIMEOUT)
WebUI.click(obj('btn_Add'))
WebUI.waitForElementClickable(obj('btn_AddExpense'), TIMEOUT)
WebUI.click(obj('btn_AddExpense'))
WebUI.waitForElementVisible(obj('txt_TransactionDescription'), TIMEOUT)
WebUI.waitForElementClickable(obj('btn_Numpad5'), TIMEOUT)
WebUI.click(obj('btn_Numpad5'))
WebUI.setText(obj('txt_TransactionDescription'), 'Demo test expense')
WebUI.waitForElementClickable(obj('btn_SaveTransaction'), TIMEOUT)
WebUI.click(obj('btn_SaveTransaction'))

// ===== Verificación =====
'El modo demo muestra el modal con las opciones de iniciar sesión y registrarse'
WebUI.waitForElementVisible(obj('dlg_AuthRequired'), TIMEOUT)
WebUI.verifyElementVisible(obj('btn_ModalSignIn'))
WebUI.verifyElementVisible(obj('btn_ModalSignUp'))

'La operación no se completó: el usuario sigue en el modo demo'
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
