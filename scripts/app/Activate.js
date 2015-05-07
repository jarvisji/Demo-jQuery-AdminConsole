define(["app/common/UIHelper", "app/common/AjaxHelper"], function(uiHelper, ajaxHelper) {

	function verifyEmail() {
		var searchStrArr = window.location.search.split("?");

		if (searchStrArr.length != 2) {
			uiHelper.showErrorAlert("对不起，链接无效。");
		} else {
			var url = "php/ajax.php?method=get&url=/email/verify/" + searchStrArr[1] + "/&checkSession=false";
			$.get(url, function(resp) {
				if (resp.success === true) {
					uiHelper.hideErrorAlert();
					uiHelper.showInfoAlert("用户激活成功，5秒钟后将自动跳转登录页面。<a href='Login.html'><b>点击立即登录。<b></a>");
					setTimeout(function() {
						window.location.href = "Login.html";
					}, 5000);
				} else {
					uiHelper.hideInfoAlert();
					uiHelper.showErrorAlert(resp.errMsg);
				}
			});
		}
	}

	return {
		"init" : verifyEmail
	};
});
