define(["app/common/AceFileHelper", "app/common/FormHelper", "app/common/UIHelper", "app/common/AjaxHelper", "app/Header", "app/Menu", "ace", "jquery.encoding.digests.sha1"], function (aceFileHelper, formHelper, uiHelper, ajaxHelper) {

    var dbUser;
    var SERVICE_STATUS = {
        "TRIAL": {name: "试用", value: "TRIAL"},
        "REGULAR": {name: "正式", value: "REGULAR"}
    };

    function init() {
        aceFileHelper.initUploadHandler($(":file"), {
            "urlHolderSelector": "#avatar",
            "isChangeUpload": false,
            "style": "well"
        });
        loadData();
        FormValidator();
        ButtonEvevnt();
    }

    function FormValidator() {
        formHelper.initFormValidator("#pubAccountForm", {
            username: {
                required: true
            },
            // email.
            email: {
                required: true,
                email: true
            },
            password: {
                required: true
            },
            mobilePhone: {
                required: true,
                isPhone: true
            }

        }, {
            username: {
                required: "用户名不能为空"
            },
            email: {
                required: "请输入Email地址",
                email: "请输入正确的email地址"
            },
            password: {
                required: "密码不能为空"
            },
            mobilePhone: {
                required: "电话号码不能为空",
                isPhone: "请输入一个有效的联系电话"
            }
        });
    }

    function loadData() {
        jQuery.validator.addMethod("isPhone", function (value, element) {
            var length = value.length;
            var mobile = /^(((13[0-9]{1})|(15[0-9]{1}))+\d{8})$/;
            var tel = /^\d{3,4}-?\d{7,9}$/;
            return this.optional(element) || (tel.test(value) || mobile.test(value));
        }, "请正确填写您的联系电话");
        var url = "php/ajax.php?method=GET&url=/user";
        $.post(url, function (data) {
            if (data.success) {
                dbUser = data.data.WlsUser;
                setFromValue([data.data.WlsUser["mobilePhone"], data.data.WlsUser["username"], data.data.WlsUser["email"], data.data.WlsUser["id"], data.data.WlsUser["status"], data.data.WlsUser["weixin"], data.data.WlsUser["qq"]]);
                if (data.data.WlsUser["avatar"] != "") {
                    $("input[name=avatar]").val(data.data.WlsUser["avatar"]);
                    if (data.data.WlsUser["avatar"] == null) {
                        aceFileHelper.setAceFileUploaderPreview("#pubAccountForm", "./images/avatar-default.jpg");
                    } else {
                        aceFileHelper.setAceFileUploaderPreview("#pubAccountForm", data.data.WlsUser["avatar"]);
                        //$("#imgshow").after("<img id='userselfimg' src='" + data.data.WlsUser["avatar"] + "'/>");
                    }

                } else {
                    aceFileHelper.setAceFileUploaderPreview("#pubAccountForm", "./images/avatar-default.jpg");
                }
            } else {
                uiHelper.showErrorAlert(data.errMsg);
            }
        });
        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                $("#serviceEndDate").text(new Date(resp.serviceInfo.endDate).toLocaleDateString());
                $("#serviceStatus").text(SERVICE_STATUS[resp.serviceInfo.status].name);
            }
        });
    }

    function setFromValue(dataArr) {
        var i = 0;
        var nextDom = traversalIterator(["input[name=mobilePhone]", "input[name=username]", "input[name=email]", "input[name=id]", "input[name=status]", "input[name=weixin]", "input[name=qq]"]);
        for (; i < dataArr.length; i++) {
            $(nextDom()).val(dataArr[i]);
        }
    }

    function traversalIterator(traversalArray) {
        var i = 0;
        return function () {
            return traversalArray[i++];
        }
    }

    function ButtonEvevnt() {
        $("#btnSubmit").click(btnEventSendEmail);
        $("#btnShowChangePasswordForm").click(btnEventShowChangePasswordForm);
        $("#btnChangePassword").click(btnEventChangePassword);
        $("#btnCancelPassword").click(btnEventCancelPassword);
    }

    function btnEventShowChangePasswordForm() {
        $("#btnShowChangePasswordForm").addClass("hide");
        $("#divChangePassword").removeClass("hide");
    }

    function btnEventChangePassword() {
        var oldPass = $("#oldPass").val();
        var newPass = $("#newPass").val();
        if (!oldPass || !newPass) {
            uiHelper.showErrorAlert("请输入密码");
        } else if (oldPass == newPass) {
            uiHelper.showErrorAlert("新密码不能与原密码相同。");
        } else {
            oldPass = $.encoding.digests.hexSha1Str(oldPass);
            newPass = $.encoding.digests.hexSha1Str(newPass);
            var url = "php/ajax.php?method=put&url=/user/pwd";
            $.post(url, {
                'newPass': newPass,
                'oldPass': oldPass
            }, function (data) {
                if (data.success) {
                    uiHelper.showGritter("密码修改成功");
                    uiHelper.hideErrorAlert();
                    btnEventCancelPassword();
                } else {
                    uiHelper.showErrorAlert(data.errMsg);
                }
            });
        }
    }

    function btnEventCancelPassword() {
        $("#btnShowChangePasswordForm").removeClass("hide");
        $("#divChangePassword").addClass("hide");
    }

    function btnEventSendEmail() {
        var imgSrc = $("input[name=remove]").val();
        if (imgSrc) {
            $("input[name=avatar]").val("");
            aceFileHelper.deleteBcsObject(imgSrc);
            $("input[name=remove]").remove();
        }

        if ($("#fileUploader").val() == "") {
            SaveUserBasicInformaction();
        } else {
            aceFileHelper.uploadFile($(":file"), "#avatar", SaveUserBasicInformaction);
        }
    }

    function SaveUserBasicInformaction() {
        if ($('#pubAccountForm').valid()) {
            $("input[name=remove]").remove();
            var formData = formHelper.serializeJson($('form'));
            $.extend(dbUser, formData);
            var url = "php/ajax.php?method=PUT&url=/user";
            $.post(url, dbUser, function (data) {
                if (data.success) {
                    window.location.href = "UserBasicInformation.html";
                } else {
                    uiHelper.showErrorAlert(data.errMsg);
                }
            });
        } else {
            return false;
        }
    }

    return {
        "init": init
    };
});
