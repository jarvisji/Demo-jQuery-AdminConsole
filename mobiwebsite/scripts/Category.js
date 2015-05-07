define(["app/HttpHelper", "app/TemplateLoader", "app/DateUtil"], function(httpHelper, tplLoader, dateUtil) {

	loadCategoryTemplate();
	var mAjaxSuffix;
	function loadCategoryTemplate() {
		var params = httpHelper.parseUrlParams();

		if (params.preview) {
			// local preview.
			var templateFile = "wl-mws-level2-template-" + params.preview + ".html";
			loadTemplateFile(templateFile);
			loadExampleJson();
		} else {
			if (!params.site || !params.list) {
				throw "Missed site id or list id.";
			}
			httpHelper.setTitleAccordingEntryConfig(params.site);

			var wxAccountId = params.site;
			var arrParamList = decodeURIComponent(params.list).split("!");
			var refType = arrParamList[0];
			var arrParamItems = arrParamList[1].split(":");
			var itemType = arrParamItems[0];

			var itemId = arrParamItems[1];
			mAjaxSuffix = "?a=" + wxAccountId + "&checkSession=false";
			getTemplateName(function() {
				loadListData(wxAccountId, refType, itemType, itemId);
			});
		}
	}

	function loadListData(wxAccountId, refType, itemType, itemId) {
		debug && console.log("loadListData(). wxAccountId, refType, itemType, itemId:", wxAccountId, refType, itemType, itemId);
		// currently we only support sit.
		if (refType == "sit") {
			if (itemType == "tag") {
				// get sit list by tag.
				getMaterialListByTag(itemId, refType, function(resp) {
					if (checkRespDataValid(resp)) {
						var data = {
							"articles" : resp.data.entity
						};
						if (resp.data.count == 1) {
							data.articles = [resp.data.entity];
						}
						renderTemplate(data);
					}
				});
			} else if (itemType == "item") {
				// get sit by id.
				getMaterial(refType, itemId, function(resp) {
					if (checkRespDataValid(resp)) {
						if (resp.data.count == 1) {
							// display content directly.
							var contentPageUrl = "Content.html?site=" + wxAccountId + "&id=" + resp.data.entity.id;
							window.location.replace(contentPageUrl);
						} else {
							renderTemplate({
								"articles" : resp.data.entity
							});
						}
					}
				});
			}
		} else {
			throw "Not supported ref type:", refType;
		}
	}

	function checkRespDataValid(resp) {
		var ret = true;
		if (resp && resp.success == true) {
			if (resp.data.count == 0) {
				$("body").html("指定的内容不存在。");
				ret = false;
			}
		} else {
			$("body").html("加载页面失败：" + resp.errMsg);
			ret = false;
		}
		return ret;
	}

	function getMaterial(type, id, callback) {
		var url = PHPPATH + "ajax.php?method=get&url=/material/" + type + "/" + id + mAjaxSuffix;
		$.get(url, function(resp) {
			if (resp.success === true) {
				if (resp.data.count > 0 && type == "text") {
					var entity = resp.data.entity;
					entity.content = emoteHelper.textToHtml(stringUtil.escapeHTML(entity.content));
				}
				if (callback) {
					callback(resp);
				}
			}
		});
	}

	function getMaterialListByTag(tagId, materialType, callback) {
		var url = PHPPATH + "ajax.php?method=get&url=/tag/" + tagId + "/material/" + materialType + mAjaxSuffix;
		$.get(url, function(resp) {
			if (callback)
				callback(resp);
		})
	}

	function getTemplateName(callback) {
		var url = PHPPATH + "ajax.php?method=get&url=/mws/siteconfig/categoryTemplateName" + mAjaxSuffix;
		$.get(url, function(resp) {
			if (resp && resp.success === true) {
				if (resp.data.count > 0) {
					var templateFile = resp.data.entity.propValue + ".html";
				} else {
					var templateFile = "wl-mws-level2-template-02.html";
				}
				loadTemplateFile(templateFile);
				if (callback)
					callback();
			}
		})
	}

	function loadTemplateFile(templateFile) {
		var templateFile = "templates/level2/" + templateFile;
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

	function formatDateString(data) {
		for (var i = 0; i < data.articles.length; i++) {
			var article = data.articles[i];
			article.appLastModifyTime = dateUtil.ts2LocalDate(article.appLastModifyTime);
		}
	}

	function renderTemplate(data) {
		formatDateString(data);
		var template = Handlebars.compile($("#templatePlaceholder").html());
		var result = template(data);
		$("body").html(result);
		tplLoader.resizeTemplateItem();
		calculateFontSize();
	}

	function loadExampleJson() {
		var jsonFile = "templates/level2/example.json";
		$.getJSON(jsonFile, function(data) {
			renderTemplate(data);
		});
	}

	function calculateFontSize() {
		var baseWidth = 640;
		var screenWidth = $("body").width();
		var ratio = screenWidth / baseWidth * 100 + "%";
		$(".wltpl_font_ratio").css("font-size", ratio);
	}

});
