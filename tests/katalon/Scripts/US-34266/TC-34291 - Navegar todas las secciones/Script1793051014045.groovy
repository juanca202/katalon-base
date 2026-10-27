import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34291 - AC-006: Navegación de solo lectura por todas las secciones (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15
final int TIMEOUT = 10

// Abre una sección desde la navegación y espera un dato del demo propio de esa sección.
// El banner de modo demo solo se muestra en el Dashboard, por eso no sirve como señal de carga.
def openSection = { String navObject, String markerObject ->
    WebUI.waitForElementClickable(obj(navObject), TIMEOUT)
    WebUI.click(obj(navObject))
    WebUI.waitForElementVisible(obj(markerObject), LOAD_TIMEOUT)
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
boolean dashboardLoaded = openSection('nav_Dashboard', 'lbl_RecentTransactions')
String dashboardUrl = WebUI.getUrl()
boolean transactionsLoaded = openSection('nav_Transactions', 'lbl_TransactionMonthlySalary')
String transactionsUrl = WebUI.getUrl()
boolean budgetsLoaded = openSection('nav_Budgets', 'lbl_BudgetGrocery')
String budgetsUrl = WebUI.getUrl()
boolean friendsLoaded = openSection('nav_Friends', 'lbl_FriendAlexRivera')
String friendsUrl = WebUI.getUrl()
boolean scheduledLoaded = openSection('nav_Scheduled', 'lbl_ScheduledHealthInsurance')
String scheduledUrl = WebUI.getUrl()
'Volver al Dashboard tras recorrer las secciones'
openSection('nav_Dashboard', 'lbl_RecentTransactions')

// ===== Verificación =====
'Cada sección se abrió en su ruta y mostró sus registros ficticios'
WebUI.verifyMatch(dashboardUrl, '.*/dashboard.*', true)
WebUI.verifyEqual(dashboardLoaded, true)
WebUI.verifyMatch(transactionsUrl, '.*/transactions.*', true)
WebUI.verifyEqual(transactionsLoaded, true)
WebUI.verifyMatch(budgetsUrl, '.*/budgets.*', true)
WebUI.verifyEqual(budgetsLoaded, true)
WebUI.verifyMatch(friendsUrl, '.*/friends.*', true)
WebUI.verifyEqual(friendsLoaded, true)
WebUI.verifyMatch(scheduledUrl, '.*/scheduled-transactions.*', true)
WebUI.verifyEqual(scheduledLoaded, true)

'Tras recorrer las secciones el usuario sigue en el modo demo'
WebUI.verifyElementVisible(obj('lbl_DemoModeBanner'))
