import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34292 - AC-007: Sin persistencia de mutaciones del usuario demo (Happy Path)
// Tipo: Fully Automated. El navegador se cierra en Test Listeners/BrowserLifecycle.

def obj = { String name -> findTestObject('Object Repository/US-34266/' + name) }
final int LOAD_TIMEOUT = 15
final int TIMEOUT = 10

// Katalon no intercepta la red de forma nativa: se verifica el efecto observable,
// que ningún cambio del usuario demo sobrevive a reingresar.

// ===== Preparación =====
'Abrir /auth y entrar al modo demo'
WebUI.openBrowser('')
WebUI.navigateToUrl(GlobalVariable.G_BaseUrl + '/auth')
WebUI.waitForElementClickable(obj('btn_ViewDemo'), LOAD_TIMEOUT)
WebUI.click(obj('btn_ViewDemo'))
WebUI.waitForElementVisible(obj('lbl_DemoModeBanner'), LOAD_TIMEOUT)

// ===== Acción =====
'Intentar una mutación (crear un gasto)'
WebUI.waitForElementClickable(obj('btn_Add'), TIMEOUT)
WebUI.click(obj('btn_Add'))
WebUI.waitForElementClickable(obj('btn_AddExpense'), TIMEOUT)
WebUI.click(obj('btn_AddExpense'))
WebUI.waitForElementVisible(obj('txt_TransactionDescription'), TIMEOUT)
WebUI.waitForElementClickable(obj('btn_Numpad5'), TIMEOUT)
WebUI.click(obj('btn_Numpad5'))
WebUI.setText(obj('txt_TransactionDescription'), 'Demo no backend persist')
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
'El cambio no persistió más allá de la sesión'
WebUI.verifyElementVisible(obj('lbl_TransactionMonthlySalary'))
WebUI.verifyTextNotPresent('Demo no backend persist', false)
