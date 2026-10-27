import static com.kms.katalon.core.testobject.ObjectRepository.findTestObject
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI
import internal.GlobalVariable as GlobalVariable

// US-34266 - TC-34290 - AC-005: Eliminación bloqueada con notificación en modo demo (Happy Path)
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
WebUI.waitForElementClickable(obj('nav_Transactions'), TIMEOUT)
WebUI.click(obj('nav_Transactions'))
WebUI.waitForElementVisible(obj('lbl_TransactionMonthlySalary'), LOAD_TIMEOUT)

// ===== Acción =====
'Abrir las opciones de una transacción, elegir Delete y confirmar'
WebUI.waitForElementClickable(obj('btn_TransactionMoreOptions'), TIMEOUT)
WebUI.click(obj('btn_TransactionMoreOptions'))
WebUI.waitForElementClickable(obj('btn_DeleteTransaction'), TIMEOUT)
WebUI.click(obj('btn_DeleteTransaction'))
WebUI.waitForElementClickable(obj('btn_ConfirmDelete'), TIMEOUT)
WebUI.click(obj('btn_ConfirmDelete'))

// ===== Verificación =====
'Se notifica que la eliminación no está permitida en modo demo'
WebUI.waitForElementVisible(obj('lbl_DeleteNotAllowedNotice'), TIMEOUT)
WebUI.verifyElementVisible(obj('lbl_DeleteNotAllowedNotice'))

'El registro no se eliminó'
WebUI.verifyElementVisible(obj('lbl_TransactionMonthlySalary'))
