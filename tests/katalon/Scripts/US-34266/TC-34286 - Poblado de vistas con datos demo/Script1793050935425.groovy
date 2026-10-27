import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34286 - AC-002: Poblado de vistas con datos del demo (Happy Path)
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
'Recorrer las secciones y registrar los datos ficticios que muestra cada una'
boolean dashboardHasData = WebUI.waitForElementVisible(obj('lbl_RecentTransactions'), TIMEOUT)
boolean transactionsHasData = openSection('nav_Transactions', 'lbl_TransactionMonthlySalary')
String transactionsUrl = WebUI.getUrl()
boolean budgetsHasData = openSection('nav_Budgets', 'lbl_BudgetGrocery')
String budgetsUrl = WebUI.getUrl()
boolean friendsHasData = openSection('nav_Friends', 'lbl_FriendAlexRivera')
boolean scheduledHasData = openSection('nav_Scheduled', 'lbl_ScheduledHealthInsurance')

// ===== Verificación =====
'Dashboard: muestra las transacciones recientes del demo'
WebUI.verifyEqual(dashboardHasData, true)

'Transactions: la sección carga registros ficticios'
WebUI.verifyMatch(transactionsUrl, '.*/transactions.*', true)
WebUI.verifyEqual(transactionsHasData, true)

'Budgets: la sección carga los presupuestos del demo'
WebUI.verifyMatch(budgetsUrl, '.*/budgets.*', true)
WebUI.verifyEqual(budgetsHasData, true)

'Friends y Scheduled: las secciones cargan los contactos y las transacciones programadas del demo'
WebUI.verifyEqual(friendsHasData, true)
WebUI.verifyEqual(scheduledHasData, true)
