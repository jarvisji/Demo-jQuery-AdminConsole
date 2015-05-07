define(["app/common/AjaxHelper", "app/common/UIHelper"], function(ajaxHelper, uiHelper) {
	require(["app/Header", "app/Menu"]);
	function init() {
		checkTemplateSetting();

	}

	/**
	 * Check if user set index template or not.
	 */
	function checkTemplateSetting() {
		var url = "php/ajax.php?method=get&url=/mws/siteconfig/templateName";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.data.count == 0) {
				$("#divTemplateWasSet").addClass("hidden");
				if ($("#divTemplateWasntSet").hasClass("hidden")) {
					$("#divTemplateWasntSet").removeClass("hidden");
				}
				$("#btnSelectTemplate").click(function() {
					window.location.href = "MwsWizard.html";
				});
			} else {
				$("#divTemplateWasntSet").addClass("hidden");
				if ($("#divTemplateWasSet").hasClass("hidden")) {
					$("#divTemplateWasSet").removeClass("hidden");
				}
				getMwsIndexUrl();
				$("#btnChangeSettings").click(function() {
					window.location.href = "MwsWizard.html?" + resp.data.entity.propValue;
				});
				$("#btnChangeTemplate").click(function() {
					window.location.href = "MwsWizard.html";
				});
				initClickHandler();
			}
		});
	}

	/**
	 * Try to handle iframe history here.
	 */
	function initClickHandler() {
		$("area").click(function(e) {
			e.preventDefault();
            try {
                var history = $("iframe")[0].contentWindow.history;
                history.back();
            } catch (ex) {
                debug && console.log(ex);
                if (ex.name == "SecurityError") {
                    uiHelper.showGritterError("您似乎设置了demo外部的页面，预览时无法返回。<br/>请放心，在微信中不会有这个问题。");
                }
            }
		});

		var iframeDoc = $('#divIphonePreviewContent').contents().get(0);
		$(iframeDoc).on('click', function(e) {
			console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", e);
		});

		// href="javascript:document.getElementById('divIphonePreviewContent').contentWindow.history.back();"
	}

	function getMwsIndexUrl() {
		var url = "php/ajax.php?method=get&url=sessioninfo";
		$.get(url, function(resp) {
			if (resp.success) {
				var pageUrl = "/mobiwebsite/Index.html?site=" + resp.wxAccountId;
				var href = window.location.href;
				var fullPageUrl = href.substring(0, href.lastIndexOf("/")) + pageUrl;
				console.log("MwsIndexUrl:", fullPageUrl);
				$("#divIphonePreviewContent").attr("src", fullPageUrl);
			}
		})
	}

	return {
		"init" : init
	};
});
