package com.bayteq.qa.common

import com.kms.katalon.core.annotation.Keyword
import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.RequestObject
import com.kms.katalon.core.testobject.ResponseObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webservice.keyword.WSBuiltInKeywords as WS

/**
 * Envía peticiones API y deja el request y el response en el log de la
 * ejecución (ADR-003). Cada registro lleva un prefijo fijo que el script
 * junit-to-allure.mjs usa para adjuntarlos al caso en Allure.
 */
class ApiRequest {

    static final String REQUEST_TAG = '[API-REQUEST]'
    static final String RESPONSE_TAG = '[API-RESPONSE]'
    static final int MAX_BODY = 20000

    /**
     * Envía la petición y registra el request y el response completos.
     *
     * @param request Web Service Request del Object Repository
     * @return la respuesta recibida
     */
    @Keyword
    ResponseObject send(RequestObject request) {
        KeywordUtil.logInfo("${REQUEST_TAG} ${describeRequest(request)}")
        ResponseObject response = WS.sendRequest(request, FailureHandling.CONTINUE_ON_FAILURE)
        KeywordUtil.logInfo("${RESPONSE_TAG} ${describeResponse(response)}")
        return response
    }

    private static String describeRequest(RequestObject request) {
        String headers = request.httpHeaderProperties.collect { "${it.name}: ${maskSecret(it.name, it.value)}" }.join('\n')
        return "${request.restRequestMethod} ${request.restUrl}\n${headers}\n\n${truncate(request.httpBody)}"
    }

    private static String describeResponse(ResponseObject response) {
        String headers = response.headerFields.collect { name, values -> "${name}: ${values.join(', ')}" }.join('\n')
        return "${response.statusCode} (${response.elapsedTime} ms)\n${headers}\n\n${truncate(response.responseText)}"
    }

    private static String maskSecret(String name, String value) {
        return name?.toLowerCase() in ['authorization', 'cookie', 'x-api-key'] ? '***' : value
    }

    private static String truncate(String body) {
        if (!body || body.length() <= MAX_BODY) {
            return body ?: ''
        }
        return body.substring(0, MAX_BODY) + '... (truncado)'
    }
}
