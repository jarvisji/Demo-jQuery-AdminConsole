define(["app/common/UIHelper", "app/common/AceFileHelper", "app/common/FormHelper", "app/common/CitySelectHelper", "app/Header", "ace", "jquery.purl"], function(uiHelper, aceFileHelper, formHelper, citySelectHelper) {
	var accountid;
	var action = false;

	function init() {
		accountid = $.url().param('id');
		aceFileHelper.initUploadHandler($(":file"), {
			"urlHolderSelector" : "#avatar",
			"isChangeUpload" : true,
			"style" : "well"
		});
		loadAreaSelect();
		loadData();
		FormValidator();
		ButtonEvevnt();
	}

	function loadData() {
		if ( typeof (accountid) != "undefined") {
			action = true;
			var url = "php/ajax.php?method=GET&url=/user/wxaccount/" + accountid;
			$.post(url, function(data) {
				if (data.success) {
					setFromValue([data.data.WlsWxAccount['wlsUserId'], data.data.WlsWxAccount['name'], data.data.WlsWxAccount['email'], data.data.WlsWxAccount['contactName'], data.data.WlsWxAccount['contactPhone'], data.data.WlsWxAccount['industry']]);
					$("select[name=province]").val(data.data.WlsWxAccount['province']);
					citySelectHelper.setSelectCity("#city", data.data.WlsWxAccount['province']);
					$("#city").val(data.data.WlsWxAccount['city']);
					if (data.data.WlsWxAccount['avatar'] != "") {
						$("input[name=avatar]").val(data.data.WlsWxAccount['avatar']);
						aceFileHelper.setAceFileUploaderPreview("#pubAccountForm", data.data.WlsWxAccount['avatar']);
					}
					if (data.data.WlsWxAccount['area'] != null) {
						citySelectHelper.setSelectArea("#area", data.data.WlsWxAccount['province'], data.data.WlsWxAccount['city']);
						$("select[name=area]").val(data.data.WlsWxAccount['area']);
					} else {
						$("select[name=area]").hide();
					}
				} else {
					uiHelper.showErrorAlert(data.errMsg);
				}
			});
		}
	}

	function setFromValue(dataArr) {
		var i = 0;
		var nextDom = traversalIterator(["input[name=wlsUserId]", "input[name=name]", "input[name=email]", "input[name=contactName]", "input[name=contactPhone]", "select[name=industry]"]);
		for (; i < dataArr.length; i++) {
			$(nextDom()).val(dataArr[i]);
		}
	}

   function  traversalIterator(traversalArray) {
			var i = 0;
			return function() {
				return traversalArray[i++];
			}
	}


	function FormValidator() {
		jQuery.validator.addMethod("isPhone", function(value, element) {
			var length = value.length;
			var mobile = /^(((13[0-9]{1})|(15[0-9]{1}))+\d{8})$/;
			var tel = /^\d{3,4}-?\d{7,9}$/;
			return this.optional(element) || (tel.test(value) || mobile.test(value));
		}, "请正确填写您的联系电话");

		formHelper.initFormValidator("#pubAccountForm", {
			name : {
				required : true
			}
//			province : {
//				required : true
//			},
//			city : {
//				required : true
//			},
//			email : {
//				required : true,
//				email : true
//			},
//			contactName : {
//				required : true
//			},
//			contactPhone : {
//				required : true,
//				isPhone : true
//			}

		}, {
			name : {
				required : "请输入公众号名称"
			}
//			province : {
//				required : "区域不能为空"
//			},
//			city : {
//				required : "城市不能为空"
//			},
//			email : {
//				required : "请输入Email地址",
//				email : "请输入正确的email地址"
//			},
//			contactName : {
//				required : "联系人不能为空",
//			},
//			contactPhone : {
//				required : "电话号码不能为空",
//				isPhone : "请输入一个有效的联系电话"
//			},
		});
	}

	function loadAreaSelect() {
		citySelectHelper.setSelectProvince("#province");
		$("#province").change(ProvinceClilck);
	}

	function ProvinceClilck() {
		$("#city").html("<option value=\"\">--请城市区域--</option>");
		$("#area").html("<option value=\"\">--请选择区域--</option>");
		var Province = citySelectHelper.getProvince("province");
		citySelectHelper.CountyHide("#area", Province);
		citySelectHelper.setSelectCity("#city", Province);
	}


	$(document).on('change', '#city', function() {
		var Province = citySelectHelper.getProvince("province");
		var city = citySelectHelper.getProvince("city");
		citySelectHelper.setSelectArea("#area", Province, city);
	});

	function ButtonEvevnt() {
		$("#btnSubmit").click(btnEventSave);
		$("#btnReturn").click(btnEventReturn);
	}

	function addWxaccount(data) {
		var url = "php/ajax.php?method=post&url=/user/wxaccount";
		//var data = $('form').serialize();
		$.post(url, data, function(data) {
			if (data.success === true) {
				//get userwxaccountId;
				var WxAccountId = data.data.WlsWxAccount.id;
				$("input[name=wlsUserId]").val(data.data.WlsWxAccount['wlsUserId']);
				//copy bcs avatar file in to userid/wxaccoundId/
				copyAvatar(WxAccountId);
			} else if (data.success === false) {
				uiHelper.showErrorAlert(data.errMsg);
			} else {
				uiHelper.showErrorAlert("未知错误");
			}
		});
	}

	function updataWxaccount() {
		var url = "php/ajax.php?method=PUT&url=/user/wxaccount/" + accountid;
		var imgSrc = $("input[name=remove]").val();
		if (imgSrc) {
			aceFileHelper.deleteBcsObject(imgSrc);
			$("input[name=remove]").remove();
		}
		var data = $('form').serialize();
		$.post(url, data, function(data) {
			if (data.success === true) {
				window.location.href = "WXPublicList.html";
			} else if (data.success === false) {
				uiHelper.showErrorAlert(data.errMsg);
			} else {
				uiHelper.showErrorAlert("未知错误");
			}
		});
	}

	function copyAvatar(WxAccountId) {
		//get bcs file avatar url
		var avatarUrl = $("#avatar").val();
		if (avatarUrl !== "") {
			var url = "php/fileUpload.php?action=CopyFileToUser&wxAccountId=" + WxAccountId;
			$.post(url, {
				"fileUrl" : avatarUrl
			}, function(data) {
				console.log(Date());
				if (data.status == "OK") {
					$("input[name=avatar]").val(data.url);
					accountid = WxAccountId;
					updataWxaccount();
				} else {
					uiHelper.isBtnClickable("#btnSubmit",true);
					alert(data.message);
				}
			}, "json");
		} else {
			uiHelper.isBtnClickable("#btnSubmit",true);
			window.location.href = "WXPublicList.html";
		}
	}

	function btnEventSave() {
		// clear cache always. Also work for add/edit/delete account.
		$.get('php/ajax.php?method=get&url=/user/wxaccounts&cache=clear');

		if (!$('#pubAccountForm').valid())
			return false;
			
		uiHelper.isBtnClickable("#btnSubmit",false);
		if (action == false) {
			var data = {
				"avatar" : "",
				"name" : $("input[name=name]").val(),
				"province" : $("#province").val(),
				"city" : $("#city").val(),
				"area" : $("#area").val(),
				"email" : $("input[name=email]").val(),
				"contactName" : $("input[name=contactName]").val(),
				"contactPhone" : $("input[name=contactPhone]").val(),
				"industry" : $("select[name=industry]").val()
			}
			addWxaccount(data);
		} else {
			if ($("#fileUploader").val() != "") {
				copyAvatar(accountid);
			} else {
				updataWxaccount();
			}
		}
		
	}

	function btnEventReturn() {
		window.history.go(-1);
	}

	return {
		"init" : init
	};
});
