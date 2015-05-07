define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/DateUtil", "bootbox", "app/Header", "app/Menu"], function(mrh, msh, ajaxHelper, uiHelper, dateUtil) {
	var replyId;
	function init() {
		bootbox.setDefaults({
			"locale" : "zh_CN"
	    });
		initTemplateFormatter();
		loadAutoReply();
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
			}], saveAutoReply);
		});
		$("#btnDeleteAutoReply").click(promptDeleteConfirm);
	}

	function promptDeleteConfirm() {
		bootbox.confirm("确定删除回复?", function(result) {
			if (result) {
				deleteAutoReply();
			}
		})
	}

	function deleteAutoReply() {
		//DELETE /reply/auto/<id>
		var url = "php/ajax.php?method=DELETE&url=/reply/auto/" + replyId;
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

	function loadAutoReply() {
		var url = "php/ajax.php?method=get&url=/reply/auto/list";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true && resp.data.count > 0) {
				var id = resp.data.entity[0].materialId;
				var type = resp.data.entity[0].materialType.split("_")[1];
				replyId = resp.data.entity[0].id;
                mrh.showMaterialPreview("#replyContainer", type, id);
			}
		});
	}

	function saveAutoReply(itemType, itemId) {
		debug && console.log("saveAutoReply().", arguments);
		if (itemId == undefined || itemType == undefined) {
			debug && console.log("Invalid itemId or type, skip save.", itemId, itemType);
			return;
		}
		var url = "php/ajax.php?method=post&url=/reply/auto";
		var data = {
			materialId : itemId,
			materialType : "material_" + itemType
		};
		$.post(url, data, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				uiHelper.showGritter("设置成功。");
				//TODO:J refresh in client, avoid server request.
				loadAutoReply();
			}
		});
	}

	return {
		"init" : init
	}
});
