import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34293 - AC-008: Indicador visible de modo demo (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15
final int TIMEOUT = 10

// ===== Preparación =====
'Abrir /auth'
WebUI.openBrowser('')
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')

// ===== Acción =====
'Entrar al modo demo'
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Verificación =====
'Se muestran el banner y el distintivo Demo'
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
WebUI.verifyElementVisible(obj('btn_DemoBadge'))

'El indicador persiste al navegar a otra sección'
WebUI.waitForElementClickable(obj('nav_Transactions'), TIMEOUT)
WebUI.click(obj('nav_Transactions'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
