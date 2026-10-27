import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34296 - AC-011: Sesión demo solo en memoria; sin reanudación automática (Error)
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
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard.*', true)

// ===== Acción =====
'Simular cierre y reapertura: navegación directa a una ruta profunda del demo'
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/transactions')
WebUI.waitForElementNotPresent(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Verificación =====
'La sesión demo no se retoma: redirige a signin'
WebUI.verifyMatch(WebUI.getUrl(), '.*/signin.*', true)
WebUI.verifyElementNotPresent(obj('lbl_DemoModeBanner'), TIMEOUT)

'El usuario puede reingresar desde /auth'
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)
WebUI.verifyMatch(WebUI.getUrl(), '.*/dashboard.*', true)
