define(["app/Header", "ace", "bootbox"], function(formHelper) {

	function init() {
		bootbox.setDefaults({
			"locale" : "zh_CN"
		});
		var accounts;
		loadData();
	}

	function loadData() {
		// clear cache always. Also work for add/edit/delete account.
		$.get('php/ajax.php?method=get&url=/user/wxaccounts&cache=clear');
		// Get WxAccounts from backend service, then fill data to page by template.
		var url = "php/ajax.php?method=get&url=/user/wxaccounts";
		$.get(url, function(responseData) {
			if (responseData.success) {
				accounts = responseData.data.ArrayList;
				setTokenData(responseData.data.ArrayList, responseData.data.count);
				if (accounts) {
					$("#wxAccountList tbody").loadTemplate("templates/WXPublicListTemplate.html", accounts);
				} else {
					$("#wxAccountList tbody").html("no data.");
				}
			} else {
				alert(responseData.errMsg ? responseData.errMsg : "未知错误");
			}
		});
	}

	//判断公众号是否设置token
	function setTokenData(data, len) {
		for (var i = 0; i < len; i++) {
			getWXcurrentEntranceInformation(data[i]["id"], i);
		}
	}

	//获取当前的入口信息
	function getWXcurrentEntranceInformation(id, i) {
		var url = "php/ajax.php?method=get&url=/wxproxy/entry/" + id;
		$.ajax({
			type : "GET",
			url : url,
			async : false,
			success : function(responseData) {
				if (responseData.success) {
					if (responseData.data.count == null) {
						newWXcurrentEntranceInformation(id, i);
					} else {
						accounts[i]["token"] = responseData.data.token;
						accounts[i]["url"] = SERVICEURL + responseData.data.url;
					}
				}
			}
		})
	}

	//生成新的入口信息
	function newWXcurrentEntranceInformation(id, i) {
		var url = "php/ajax.php";
		$.ajax({
			type : "GET",
			url : url,
			data : "method=get&url=/wxproxy/entry/" + id + "/new",
			async : false,
			success : function(responseData) {
				if (responseData.success) {
					accounts[i]["token"] = responseData.data.token;
					accounts[i]["url"] = SERVICEURL + responseData.data.url;
				} else {
					alert(responseData.data.errMsg);
				}
			}
		})
	}


	$(document).on("click", ".edit", function() {
		var accountId = $(this).attr("alt");
		window.location.href = "WXPublic.html?id=" + accountId;
	});

	$(document).on("click", ".delet", function() {
		var obj = this;
		var accountId = $(obj).attr("alt");
		bootbox.confirm("确定删除吗?", function(result) {
			if (result) {
				var url = "php/ajax.php?method=DELETE&url=/user/wxaccount/" + accountId;
				$.get(url, function(responseData) {
					if (responseData.success) {
						$(obj).parents("tr").remove();
						$("#" + accountId).remove();
						//window.location.reload();
					} else {
						alert(responseData.errMsg);
					}
				});
			}
		});
	});

	$(document).on("click", ".update", function() {
		var accountId = $(this).attr("alt");
		$(this).html("正在更新...");
		var obj = $(this)
		var url = "php/ajax.php?method=get&url=/wxproxy/entry/" + accountId + "/new";
		$.get(url, function(responseData) {
			if (responseData.success) {
				obj.closest("tr").children("td:eq(2)").html(responseData.data.token);
			} else {
				alert(responseData.data.errMsg);
			}
		})
		$(this).html("重设TOKEN");
	});
	return {
		"init" : init
	};
});
