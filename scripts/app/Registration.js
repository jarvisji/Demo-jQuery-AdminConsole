define(["app/common/FormHelper", "app/common/UIHelper", "app/common/AjaxHelper", "ace"], function (formHelper, uiHelper, ajaxHelper) {
    require(["jquery.encoding.digests.sha1"]);

    function init() {
        loadProvinces();
        FormValidator();
        initEventHandler();
    }

    function loadProvinces() {
        var url = "php/ajax.php?method=get&url=/citycode/provinces&checkSession=false";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                var options = composeOptionsStr(resp.data.entity);
                $("#province").append(options);
            }
        });
    }

    function loadCities() {
        var code = $("#province").val();
        if (code) {
            var url = "php/ajax.php?method=get&url=/citycode/province/" + code + "/cities&checkSession=false";
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (resp.success === true) {
                    var options = composeOptionsStr(resp.data.entity);
                    $("#city").html(options);
                    loadAreas(resp.data.entity[0]);
                }
            });
        }
    }

    function loadAreas(codeEntity) {
        var code;
        if (codeEntity && codeEntity.cityCode) {
            code = codeEntity.cityCode;
        } else {
            code = $("#city").val();
        }
        if (code) {
            var url = "php/ajax.php?method=get&url=/citycode/city/" + code + "/areas&checkSession=false";
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (resp.success === true) {
                    var options = composeOptionsStr(resp.data.entity);
                    $("#area").html(options);
                }
            });
        }
    }

    function composeOptionsStr(/*array*/cityCodes) {
        var options = "";
        for (var i = 0; i < cityCodes.length; i++) {
            options += '<option value="' + cityCodes[i].cityCode + '">' + cityCodes[i].cityName + '</option>';
        }
        return options;
    }

     function FormValidator() {
     	
        $.validator.addMethod("mobilePhone", function (value, element) {
            var MOBILE_PHONE_REGEXP = /^1[3-8]\d{9}$/;
            return MOBILE_PHONE_REGEXP.test(value);
        });
        //equalTo
        formHelper.initFormValidator("#registration", {
            // email.
            email: {
                required: true,
                email: true
            },
            password: {
                required: true
            },
            passwordAgain: {
                required: true,
                equalTo: "#password"
            },
            userName: {
                required: true
            },
            mobilePhone: {
                required: true,
                mobilePhone: true
            },
            qq: {
                required: true
            },
            area: {
                required: true
            },
            industry: {
                required: true
            },
            checkbox: {
                required: true
            }
        }, {
            email: {
                required: "请输入Email地址",
                email: "请输入正确的email地址"
            },
            password: {
                required: "请输入密码"
            },
            passwordAgain: {
                required: "请再次输入密码",
                equalTo: "两次密码不一致"
            }, userName: {
                required: "请输入用户名"
            },
            mobilePhone: {
                required: "请输入手机号",
                mobilePhone: "请输入正确的手机号"
            },
            qq: {
                required: "请输入QQ号"
            },
            area: {
                required: "请选择城市"
            },
            industry: {
                required: "请输入行业信息"
            },
            checkbox: {
            	required: "请同意服务条款"
            }
            
          });
    }

    function initEventHandler() {
        $("#btnSave").click(btnEventReg);
        $("#province").change(loadCities);
        $("#city").change(loadAreas);
        $(":input").change(function () {
            uiHelper.hideErrorAlert();
        });
    }

    function btnEventReg() {
        if (!$('#registration').valid()) {
            return false;
        }
        var email = $("#email").val();
        var password = $("#password").val();
        password = $.encoding.digests.hexSha1Str(password);
        $.post("php/Login.php?register", {
            "email": email,
            "password": password,
            "fullName": $("#fullName").val(),
            "mobilePhone": $("#mobilePhone").val(),
            "qq": $("#qq").val(),
            "area": $("#area").val(),
            "industry": $("#industry").val()
        }, function (resp) {
            if (resp.errMsg == 'DUPLICATE_DATA') {
                uiHelper.showErrorAlert("电子邮件已注册。");
            } else {
                ajaxHelper.ajaxResponseErrorHandler(resp);
            }
            if (resp.success === true) {
                window.location.href = "RegisterSuccess.html";
                // Currently, we don't open register, need CSR confirm.
                //sendActivateEmail(email);
            }
        });
    }

    function sendActivateEmail(email) {
        var url = "php/ajax.php?method=get&url=/email/registerconfirm/" + email + "/&checkSession=false";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                uiHelper.showInfoAlert(" 感谢注册，确认邮件已发送，请根据邮件提示激活账户。");
                $("#btnSave").attr("disabled", "disabled");
            }
        });
    }

    return {
        "init": init
    };

});
