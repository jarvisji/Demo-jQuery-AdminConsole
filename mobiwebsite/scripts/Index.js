/*http://127.0.0.1/freecoder/mobiwebsite/Index.html?site=fEh3uCQk*/
define(["app/TemplateLoader", "app/HttpHelper", "jqueryui", "touch"], function(tplLoader, httpHelper) {

	var mUserData = {};
	var mTemplatePath = "templates/";
	var mThemeData;
	var mTemplateHtml;

	require(["domReady!"], function(doc) {

		var params = httpHelper.parseUrlParams();
		if (params && params.site) {
			httpHelper.setTitleAccordingEntryConfig(params.site);
			loadSiteConfig(params.site);
		} else {
			$("body").html("出错啦，无法打开页面（invalid site）。");
		}
	});

	function loadSiteConfig(/*wxAccountId*/siteId) {
		debug && console.log("loadSiteConfig().");
		var url = PHPPATH + "ajax.php?method=get&url=/mws/siteconfig?a=" + siteId + "&checkSession=false";
		$.get(url, function(resp) {
			if (resp && resp.success === true) {
				var dbData = resp.data.entity;
				debug && console.log(">> get site config data from service:", dbData);
				convertDBData2UserData(dbData);

				loadTemplateTheme(mUserData.templateName);
			} else {
				$("body").html(resp);
			}
		});
	}

	function loadTemplateTheme(templateName) {
		// insert the template css file reference, before load template html structure.
		var templateCss = mTemplatePath + templateName + "/index.css";
		$("<link>").attr({
			rel : "stylesheet",
			href : templateCss
		}).appendTo("head");

		var templateThemeFile = mTemplatePath + templateName + "/theme.json";
		debug && console.log("loadTemplateTheme(). loading template theme from " + templateThemeFile);
		$.getJSON(templateThemeFile, function(data) {
			mThemeData = data;
			debug && console.log("loadTemplateTheme() success, theme data:", mThemeData);

			// load template file to preview window. Not fill user data right now.
			loadTemplateFile(templateName, previewTemplate);
		}).fail(function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			error && console.error("loadTemplateTheme() fail, request theme.json failed: " + err);
		});
	}

	function loadTemplateFile(templateName, callback) {
		var templateContentSelector = "div#wltplContainer";
		var templateFile = mTemplatePath + templateName + "/index.html " + templateContentSelector;
		debug && console.log("loadTemplateFile(). loading template from " + templateFile);
		$("#templateContainer").load(templateFile, callback);
	}

	function previewTemplate() {
		debug && console.log("previewTemplate().");

		var templateData = tplLoader.mergeThemeData2UserData(mThemeData, mUserData);
		tplLoader.preview(mThemeData, templateData);
		initCarouselSwipe();
	}

	/**
	 * Convert key-value DB values to json object, each step data is Array.
	 */
	function convertDBData2UserData(dbData) {
		debug && console.log("convertDBData2UserData().");
		for (var i = 0; i < dbData.length; i++) {
			if (dbData[i]["id"].propName == "templateName") {
				mUserData.templateName = dbData[i].propValue;
				continue;
			}
			var arr = dbData[i]["id"].propName.split("-");
			var step = arr[0];
			var field = arr[1];
			var index = arr[2];
			if (mUserData[step] == undefined) {
				mUserData[step] = [];
			}
			if (isNaN(index)) {
				index = 0;
			}
			if (mUserData[step][index] == undefined) {
				mUserData[step][index] = {};
			}
			mUserData[step][index][field] = dbData[i].propValue;
		}
		debug && console.log(">> converted dbData to userData:", mUserData);
	}

	function initCarouselSwipe() {
		var $carousel = $(".carousel");
		$carousel.draggable({
			axis : "x",
			helper : function() {
				// create mock helper to prevent UI element display the drag process.
				return $("<div></div>");
			},
			stop : function(event, ui) {
				if (ui.position.left > 0) {
					$carousel.carousel("prev");
				} else if (ui.position.left < 0) {
					$carousel.carousel("next");
				}
			}
		});
	}

});

