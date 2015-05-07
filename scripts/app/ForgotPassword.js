define(["app/common/FormHelper", "app/common/AjaxHelper", "app/common/UIHelper", "ace"], function(formHelper, ajaxHelper, uiHelper) {
	require(["jquery.encoding.digests.sha1"]);

	var emailCode;
	function init() {
		showForm();
		FormValidator();
		ButtonEvevnt();
	}

	function showForm() {
		var searchStr = window.location.search;
		if (searchStr) {
			$("#divResetPassword").removeClass("hidden");
			emailCode = searchStr.split("?")[1];
			var url = "php/ajax.php?method=get&url=/email/verify/" + emailCode + "/&checkSession=false";
			$.get(url, function(resp) {
				ajaxHelper.ajaxResponseErrorHandler(resp);
				if (resp.success != true) {
					$("#btnResetPassword").addClass("disabled");
				}
			});
		} else {
			$("#divRetrievePassword").removeClass("hidden");
		}
	}

	function FormValidator() {
		formHelper.initFormValidator("#Emailform", {
			email : {
				required : true,
				email : true
			}
		}, {
			email : {
				required : "请输入Email地址",
				email : "请输入正确的Email地址"
			}
		});
		formHelper.initFormValidator("#passwordForm", {
			password : {
				required : true
			},
			passwordAgain : {
				required : true,
				equalTo : "#password"
			}
		}, {
			password : {
				required : "请输入密码",
			},
			passwordAgain : {
				required : "请在此输入密码",
				equalTo : "两次密码不一致"
			}
		});
	}

	function ButtonEvevnt() {
		$("#btnSubmit").click(btnEventSendEmail)
		$("#btnResetPassword").click(resetPassword);
	}

	function btnEventSendEmail() {
		if (!$('#Emailform').valid()) {
			return false;
		}

		var email = $("#email").val();
		var url = "php/ajax.php?method=get&url=/email/retrievepassword/" + email + "/&checkSession=false";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				uiHelper.showInfoAlert(" 邮件已发送，请根据邮件提示修改密码。");
				$("#btnSubmit").attr("disabled", "disabled");
			}
		});
	}

	function resetPassword() {
		if (!$("#passwordForm").valid()) {
			return false;
		}

		var newPass = $.encoding.digests.hexSha1Str($("#password").val());
		var url = "php/ajax.php?method=put&url=/user/pwd/" + emailCode + "/&checkSession=false";
		$.post(url, {
			"newPass" : newPass
		}, function(resp) {
			if (resp.success === true) {
				uiHelper.showInfoAlert("密码修改成功，5秒钟后将自动跳转登录页面。<a href='Login.html'><b>点击立即登录。<b></a>");
				setTimeout(function() {
					window.location.href = "Login.html";
				}, 5000);
			} else {
				uiHelper.hideInfoAlert();
				uiHelper.showErrorAlert(resp.errMsg);
			}
		});
	}

	return {
		"init" : init
	};
});
