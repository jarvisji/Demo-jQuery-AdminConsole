define(["app/common/AjaxHelper", "app/common/StringUtil", "app/common/DateUtil", "app/Header", "ace"], function (ajaxHelper, stringUtil, dateUtil) {

    function init() {
        initTemplateFormatter();
        loadWxAccounts();
        loadUserServiceData();
    }

    function loadWxAccounts() {
        var url = "php/ajax.php?method=get&url=/user/wxaccounts";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                if (resp && resp.data && resp.data.ArrayList && resp.data.ArrayList.length > 0) {
                    var accounts = resp.data.ArrayList;
                    for (var i = 0; i < resp.data.count; i++) {
                        if (accounts[i].avatar == "") {
                            accounts[i].avatar = "./images/avatar-wxsub.png";
                        }
                    }
                    for (var i = 0; i < accounts.length; i++) {
                        loadAccountEntry(accounts[i]);
                    }
                } else {
                    $("#divBindAccount").removeClass("hidden");
                }
            }
        });
    }

    function loadAccountEntry(account) {
        var url = "php/ajax.php?method=get&url=/wxproxy/entry/" + account.id;
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                account.serviceUrl = SERVICEURL + resp.data.url;
                account.token = resp.data.token;
                $("#wxAccountInfoContainer").loadTemplate("templates/IndexWxAccountInfoTemplate.html", account, {
                    "append": true,
                    "afterInsert": initButtonHandlers
                });
            }
        });
    }

    function loadUserServiceData() {
        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                var currentTime = new Date().getTime();
                var tsOfDays2deadline = 7 * 24 * 3600 * 1000;
                if (resp.serviceInfo.endDate - currentTime < tsOfDays2deadline) {
                    $("#serviceAlert").removeClass("hidden");
                    $("#serviceEndDate").text(new Date(resp.serviceInfo.endDate).toLocaleDateString());
//                    $("#serviceStatus").text(SERVICE_STATUS[resp.serviceInfo.status].name);
                }
            }
        });
    }

    function initButtonHandlers($elem) {
        $elem.find("#btnEdit").click(function (e) {
            var wxAccountId = $(this).data("id");
            window.location.href = "WXPublic.html?id=" + wxAccountId;
        });
        $elem.find("#btnManage").click(function (e) {
            var wxAccountId = $(this).data("id");
            window.location.href = "php/R.php?wxAccountId=" + wxAccountId;
        });
    }

    // Add formatters for jQuery template.
    function initTemplateFormatter() {
        $.addTemplateFormatter({
            htmlEncodeFormatter: function (value) {
                var val = stringUtil.escapeHTML(value);
                return val ? val : "&nbsp;";
            },
            dateTimeFormatter: function (value) {
                return dateUtil.ts2LocalDate(value);
            }
        });
    }

    return {
        "init": init
    };

});
