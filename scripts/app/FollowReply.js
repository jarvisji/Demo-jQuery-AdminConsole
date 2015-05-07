define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/DateUtil", "bootbox", "app/Header", "app/Menu"], function(mrh, msh, ajaxHelper, uiHelper, dateUtil) {
	var FollowReplyId;
	function init() {
		bootbox.setDefaults({
			"locale" : "zh_CN"
		});
		initTemplateFormatter();
		loadFollowReply();
		initButtonHandler();
	}

	function initButtonHandler() {
		$("#btnSelectMaterial").click(function() {
			mrh.showMaterialDialog([{
				"type" : "text",
				"name" : "文本"
			}, {
				"type" : "sit",
				"name" : "图文"
			}, {
				"type" : "mit",
				"name" : "多图文"
			}], saveFollowReply);
		});

		$("#btnDeleteFollowReply").click(isSuredeleteFollowReply);
	}

	function isSuredeleteFollowReply() {
		bootbox.confirm("确定删除回复?", function(result) {
			if (result) {
				deleteFollowReply();
			}
		});

	}

	function deleteFollowReply() {
		var url = "php/ajax.php?method=DELETE&url=/reply/subscribe/" + FollowReplyId;
		$.post(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				$("#replyContainer").html("");
				uiHelper.showGritter("删除成功。");
			} else {
				uiHelper.showGritter("删除失败。");
			}
		})
	}

	// Add formatters for jQuery template.
	function initTemplateFormatter() {
		$.addTemplateFormatter({
			dateTimeFormatter : function(value) {
				return dateUtil.ts2LocalDate(value);
			}
		});
	}

	function loadFollowReply() {
		var url = "php/ajax.php?method=get&url=/reply/subscribe/list";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true && resp.data.count > 0) {
				var id = resp.data.entity[0].materialId;
				var type = resp.data.entity[0].materialType.split("_")[1];
				FollowReplyId = resp.data.entity[0].id;
                mrh.showMaterialPreview("#replyContainer", type, id);
			}
		});
	}

	function saveFollowReply(itemType, itemId) {
		debug && console.log("saveFollowReply().", arguments);
		if (itemId == undefined || itemType == undefined) {
			debug && console.log("Invalid itemId or type, skip save.", itemId, itemType);
			return;
		}
		var url = "php/ajax.php?method=post&url=/reply/subscribe";
		var data = {
			materialId : itemId,
			materialType : "material_" + itemType
		}
		$.post(url, data, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				uiHelper.showGritter("设置成功。");
				//TODO:J refresh in client, avoid server request.
				loadFollowReply();
			}
		});
	}

	return {
		"init" : init
	}
});
