import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34286 - AC-002: Poblado de vistas con datos del demo (Happy Path)
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
'Recorrer las secciones y registrar los datos ficticios que muestra cada una'
boolean dashboardHasData = WebUI.waitForElementVisible(obj('lbl_RecentTransactions'), TIMEOUT)
String transactionsUrl = openSection('nav_Transactions')
boolean transactionsHasData = WebUI.waitForElementVisible(obj('lbl_TransactionMonthlySalary'), TIMEOUT)
String budgetsUrl = openSection('nav_Budgets')
openSection('nav_Friends')
boolean friendsLoaded = WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), TIMEOUT)
openSection('nav_Scheduled')
boolean scheduledLoaded = WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), TIMEOUT)

// ===== Verificación =====
'Dashboard: muestra las transacciones recientes del demo'
WebUI.verifyEqual(dashboardHasData, true)

'Transactions: la sección carga registros ficticios'
WebUI.verifyMatch(transactionsUrl, '.*/transactions.*', true)
WebUI.verifyEqual(transactionsHasData, true)

'Budgets, Friends y Scheduled: las secciones cargan en modo demo'
WebUI.verifyMatch(budgetsUrl, '.*/budgets.*', true)
WebUI.verifyEqual(friendsLoaded, true)
WebUI.verifyEqual(scheduledLoaded, true)
