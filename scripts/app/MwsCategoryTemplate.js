define(["app/common/UIHelper", "app/common/AjaxHelper"], function(uiHelper, ajaxHelper) {
	require(["app/Header", "app/Menu"]);

	var mCategoryTemplateName = "categoryTemplateName";

	function init() {
		bindClickEventHandler();
		loadTemplateSelection();
	}

	function bindClickEventHandler() {
		$(".tpllist-iphone a").click(saveTemplateSelection);
	}

	function loadTemplateSelection() {
		var url = "php/ajax.php?method=get&url=/mws/siteconfig/" + mCategoryTemplateName;
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.data.count > 0) {
			$(".tpllist-iphone img").each(function(idx, ele) {
				if ($(ele).attr("src").indexOf(resp.data.entity.propValue) != -1) {
					$(ele).closest("li").addClass("active");
				}
			});
			} else {
				uiHelper.showInfoAlert("你还没有设置列表模板，请从以下列表中选择。");
			}
		});
	}

	function saveTemplateSelection(e) {
		e.preventDefault();
		var imgSrc = $(this).find("img").attr("src");
		var arrUrl = imgSrc.split("/");
		var fileName = arrUrl[arrUrl.length - 1];
		var templateName = fileName.split(".")[0];
		var clickedTemplateDom = $(this).closest("li");

		var url = "php/ajax.php?method=post&url=/mws/siteconfig";
		$.post(url, {
			"jsondata" : [{
				"id" : {
					"propName" : mCategoryTemplateName
				},
				"propValue" : templateName
			}]
		}, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			uiHelper.showGritter("模板设置成功。");
			$(".active").removeClass("active");
			clickedTemplateDom.addClass("active");
		})
	}

	return {
		"init" : init
	};
});
