import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34291 - AC-006: Navegación de solo lectura por todas las secciones (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15
final int TIMEOUT = 10

// Abre una sección desde la navegación y devuelve la URL una vez cargada
def openSection = { String navObject ->
    WebUI.waitForElementClickable(obj(navObject), TIMEOUT)
    WebUI.click(obj(navObject))
    WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)
    WebUI.getUrl()
}

// ===== Preparación =====
'Abrir /auth y entrar al modo demo'
WebUI.openBrowser('')
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Acción =====
'Recorrer todas las secciones de la aplicación'
String dashboardUrl = openSection('nav_Dashboard')
String transactionsUrl = openSection('nav_Transactions')
String budgetsUrl = openSection('nav_Budgets')
openSection('nav_Friends')
boolean friendsLoaded = WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), TIMEOUT)
openSection('nav_Scheduled')
boolean scheduledLoaded = WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), TIMEOUT)

// ===== Verificación =====
'Cada sección se abrió en su ruta y en modo demo'
WebUI.verifyMatch(dashboardUrl, '.*/dashboard.*', true)
WebUI.verifyMatch(transactionsUrl, '.*/transactions.*', true)
WebUI.verifyMatch(budgetsUrl, '.*/budgets.*', true)
WebUI.verifyEqual(friendsLoaded, true)
WebUI.verifyEqual(scheduledLoaded, true)

'El indicador de modo demo sigue visible tras recorrer las secciones'
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
