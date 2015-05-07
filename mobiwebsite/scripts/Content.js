define(["app/HttpHelper"], function(httpHelper) {

	loadContentTemplate();
	var mAjaxSuffix;

	function loadContentTemplate() {
		var params = httpHelper.parseUrlParams();

		if (!params.site || !params.id) {
			$("body").html("参数错误。");
			throw "Missed site id or content id.";
		}
		var wxAccountId = params.site;
		var itemType = "sit";
		var itemId = params.id;

		mAjaxSuffix = "?a=" + wxAccountId + "&checkSession=false";

		httpHelper.setTitleAccordingEntryConfig(wxAccountId);
		loadContentData(itemId);

	}

	function loadContentData(id) {
		var url = PHPPATH + "ajax.php?method=get&url=/material/sit/" + id + mAjaxSuffix;
		$.get(url, function(resp) {
			if (resp.success === true && resp.data.count == 1) {
				var exUrl = resp.data.entity.externalUrl;
				if (exUrl !== undefined && exUrl != "") {
					window.location.replace(exUrl);
				}
				loadTemplate(function() {
					renderTemplate(resp.data.entity);
				});
			} else {
				$("body").html("读取文章出错，请重试。" + resp.errMsg);
			}
		});
	}

	function renderTemplate(data) {
		if (data.appCreateTime) {
			data.appCreateTime = ts2LocalDate(data.appCreateTime);
		}
		if (data.appLastModifyTime) {
			data.appLastModifyTime = ts2LocalDate(data.appLastModifyTime);
		}
		var template = Handlebars.compile($("#templatePlaceholder").html());
		var result = template(data);
		$("body").html(result);
		// tplLoader.resizeTemplateItem();
		// calculateFontSize();
	}

	function loadTemplate(callback) {
		var url = PHPPATH + "ajax.php?method=get&url=/mws/siteconfig/contentTemplateName" + mAjaxSuffix;
		$.get(url, function(resp) {
			if (resp && resp.success === true) {
				if (resp.data.count > 0) {
					var templateFile = resp.entity.propName + ".html";
				} else {
					var templateFile = "wl-mws-content-template-01.html";
				}
				loadTempateFileSync(templateFile);
				if (callback)
					callback();
			}
		})
	}

	function loadTempateFileSync(templateFile) {
		var templateFile = "templates/content/" + templateFile;
		$.ajax(templateFile, {
			"async" : false
		}).done(function(respText, status, xhr) {
			if (status == "error") {
				var msg = "出错了: ";
				$("body").html(msg + xhr.status + " " + xhr.statusText);
			} else {
				$("#templatePlaceholder").html(respText);
			}
		});
	}

	function ts2LocalDate(timestamp) {
		var date = new Date(timestamp);
		return date.toLocaleDateString();
	}

});
