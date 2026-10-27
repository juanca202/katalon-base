import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34288 - AC-003: No se ejecutan crear/modificar en modo demo (Happy Path)
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
CustomKeywords.'tripot.common.Waits.waitForElementSteady'(obj('btn_AddExpense'), TIMEOUT)
WebUI.click(obj('btn_AddExpense'))
WebUI.waitForElementVisible(obj('txt_TransactionDescription'), TIMEOUT)
CustomKeywords.'tripot.web.TransactionFormScreen.typeAmount'('5')
WebUI.setText(obj('txt_TransactionDescription'), 'Demo no-persist expense')
WebUI.waitForElementClickable(obj('btn_Category'), TIMEOUT)
WebUI.click(obj('btn_Category'))
WebUI.waitForElementClickable(obj('btn_CategoryGrocery'), TIMEOUT)
CustomKeywords.'tripot.common.Waits.waitForElementSteady'(obj('btn_CategoryGrocery'), TIMEOUT)
WebUI.click(obj('btn_CategoryGrocery'))
WebUI.waitForElementClickable(obj('btn_SaveTransaction'), TIMEOUT)
WebUI.click(obj('btn_SaveTransaction'))

'Reingresar al modo demo y abrir las transacciones'
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)
WebUI.waitForElementClickable(obj('nav_Transactions'), TIMEOUT)
WebUI.click(obj('nav_Transactions'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Verificación =====
'El registro de prueba no se persistió'
WebUI.verifyElementVisible(obj('lbl_TransactionMonthlySalary'))
WebUI.verifyTextNotPresent('Demo no-persist expense', false)
