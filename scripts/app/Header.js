define(["app/common/AjaxHelper", "app/common/UIHelper", "jquery.loadTemplate"], function(ajaxHelper, uiHelper) {
	// Try to find header container on page, then load template to container, at last, fill user data.

	var headerContainer = $("#headerPlaceHolder");
	if (!headerContainer) {
		console.log("Header: missed container with name 'headerPlaceHolder'.");
	}

	headerContainer.load("templates/HeaderTemplate.html", function() {
		getUserNameInfo();
		getWxAccountList();
		getWxccountdSessionInfo();
	});

	function getWxAccountList() {
		var url = "php/ajax.php?method=get&url=/user/wxaccounts&cache=true";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				var accounts;
				accounts = resp.data.ArrayList;
				if (accounts) {
					for(var i=0;i<resp.data.count;i++){
						if(accounts[i].avatar=="" ){
							accounts[i].avatar="./images/avatar-wxsub.png";
						}
					}
					
					
					$.addTemplateFormatter({
						r_php_link_templateFormatter : function(value, paramName) {
							return "./php/R.php?" + paramName + "=" + escape(value);
						}
					});
					$("#wxAccountListContainer").loadTemplate("#navbar_account_template", accounts);
				} else {
					$("#wxAccountListContainer").html("<span class='label label-warning'>请至用户中心绑定公众号。</span>");
				}
			}
		});
		getUserNameInfo();
	}

	function getWxccountdSessionInfo() {
		var url = "php/ajax.php?method=get&url=sessioninfo";
		$.get(url, function(data) {
			if (data.success) {
				$("#wxAccountListContainer").find("#" + data.wxAccountId).addClass("selected");
			}
		})
	}

	function getUserNameInfo() {
		url = "php/ajax.php?method=get&url=/user";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success) {
				$("#userName").html(resp.data.WlsUser["username"]);
				if (resp.data.WlsUser["avatar"] != ""  &&  resp.data.WlsUser["avatar"] != null ) {
					$("#userImage").attr("src", resp.data.WlsUser["avatar"]);
				} else {
					$("#userImage").attr("src", "./images/avatar-default.jpg");
				}
			}
		});
	}

});
