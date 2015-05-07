/**
 * Helper functions to handle Ajax request and response.
 */
define(["app/common/UIHelper"], function (uiHelper) {
    var ErrorCode = {
        'NO_PRIVILIEGE': {'name': 'NO_PRIVILIEGE', 'msg': '没有权限'},
        'INVALID_DATA': {'name': 'INVALID_DATA', 'msg': '错误数据'},
        'NOT_FOUND': {'name': 'NOT_FOUND', 'msg': '找不到数据'},
        'DUPLICATE_DATA': {'name': 'DUPLICATE_DATA', 'msg': '重复的数据'},
        'SERVICE_ERROR': {'name': 'SERVICE_ERROR', 'msg': '服务错误'},
        'UNKNOWN_ERROR': {'name': 'UNKNOWN_ERROR', 'msg': '未知错误'},
        'AUTH_ERROR': {'name': 'AUTH_ERROR', 'msg': '登录失败'},
        'INVALID_CRED': {'name': 'INVALID_CRED', 'msg': '登录信息错误，请重新<a href="Login.html">登录</a>。'},
        'CRED_EXPIRED': {'name': 'CRED_EXPIRED', 'msg': '登录信息过期，请重新<a href="Login.html">登录</a>。'},
        'PHP_SESSION_EXPIRED': {'name': 'PHP_SESSION_EXPIRED', 'msg': '登录信息过期，请重新<a href="Login.html">登录</a>。'}
    };
    return {
        /**
         * Handle common known errors for ajax response, with this the callback function only need handle success cases.
         */
        ajaxResponseErrorHandler: function (respData, /* function */callback) {
            // debug && console.log(respData);
            if (!respData || respData.success != true) {
                var errMsg = respData.errMsg;
                if (respData.errCode && ErrorCode[respData.errCode]) {
                    errMsg = ErrorCode[respData.errCode].msg;
                }
                if (errMsg == "php_session_expired") {
                    location.href = "./Login.html";
                } else {
                    uiHelper.showErrorAlert(errMsg);
                }
                // Call throw in order to block script execution in caller.
                throw "service return error: " + errMsg;
            }
        }
    };
});
