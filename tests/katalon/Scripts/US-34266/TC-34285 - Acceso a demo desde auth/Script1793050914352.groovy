import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34285 - AC-001: Acceso al modo demo desde /auth (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15

// ===== Preparación =====
'Abrir /auth'
WebUI.openBrowser('')
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')

// ===== Acción =====
'El usuario selecciona explorar la demo'
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Verificación =====
'Ingresa al modo demo sin autenticarse: banner visible y URL del dashboard'
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard.*', true)
