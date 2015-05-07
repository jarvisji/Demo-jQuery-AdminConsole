define(["app/common/FormHelper", "app/common/CookieHelper", "app/common/UIHelper", "app/common/AjaxHelper", "jquery.encoding.digests.sha1", "ace"], function(formHelper, cookieHelper, uiHelper, ajaxHelper) {

	function init() {
		FormValidator();
		ButtonEvevnt();
	}

	function FormValidator() {
		formHelper.initFormValidator("#loginForm", {
			// email.
			email : {
				required : true,
				email : true
			},
			password : {
				required : true
			}
		}, {
			email : {
				required : "请输入Email地址",
				email : "请输入正确的email地址"
			},
			password : {
				required : "密码不能为空"
			}
		});
	}

	function ButtonEvevnt() {
		$("#btnLogin").click(btnEventlogin);
	}

	/*回车键提交*/
	document.onkeydown = function(event) {
		e = event ? event : (window.event ? window.event : null);
		if (e.keyCode == 13) {
			//执行的方法
			btnEventlogin();
		}
	};

	function btnEventlogin() {
		if (!$('#loginForm').valid())
			return false;
		// insert input verification here
		var email = $("#email").val();
		var password = $("#password").val();
		password = $.encoding.digests.hexSha1Str(password);
		$.post("./php/Login.php", {
			"email" : email,
			"password" : password
		}, function(resp) {
			if (resp.success === true) {
				if ($("#RememberUser").prop("checked") == true) {
					cookieHelper.setCookie("cred", resp.data['cred'], 9000);
					cookieHelper.setCookie("userId", resp.data['userId'], 9000);
				}
				window.location.href = "Index.html";
			} else if (resp.data['userStatus'] == USERSTATUS.PENDING_STATUS_INACTIVE) {
				uiHelper.hideInfoAlert();
				uiHelper.showErrorAlert("账号未激活，请查收邮件根据提示激活。<br><a class='text-primary' id='sendEmail' href='#'><b>　重新发送确认邮件</b></a>");
				$("#sendEmail").on("click", function(e) {
					e.preventDefault();
					sendEmail(email);
				});
            } else if (resp.errCode == "SERVICE_EXPIRED") {
                uiHelper.hideInfoAlert();
                uiHelper.showErrorAlert("您的服务已到期，请联系客服：400-805-1619。");
            } else {
                ajaxHelper.ajaxResponseErrorHandler(resp);
            }
		});
	}

	function sendEmail(email) {
		debug && console.log("send email to: ", email);

		var url = "php/ajax.php?method=get&url=/email/registerconfirm/" + email + "/&checkSession=false";

		$.get(url, function(resp) {
			if (resp.success === true) {
				uiHelper.hideErrorAlert();
				uiHelper.showInfoAlert("邮件已发送，请根据提示激活账号。");
			} else {
				uiHelper.showErrorAlert("<br>　 " + resp.errMsg, true);
			}
		});
	}

	return {
		"init" : init
	};

});
