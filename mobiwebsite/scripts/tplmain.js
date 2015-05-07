require.config({
	baseUrl : '../../scripts/lib',
	paths : {
		'app' : '../',
		// the left side is the module ID, the right side is the path to the jQuery file, relative to baseUrl.
		// Also, the path should NOT include the '.js' file extension.
		// This example is using jQuery 2.0.3 located at scripts/lib/jquery-2.0.3.js, relative to the HTML page.
		'jquery' : 'jquery-2.0.3',
	},
	shim : {
		'bootstrap' : ['jquery'],
		'jquery.loadTemplate' : ['jquery']
	}
});

require(["app/TemplateLoader"], function(tplLoader) {
	require(["domReady!"], function(doc) {
		loadTemplateData();
	});
	function loadTemplateData() {
		var paramData = parseUrlParams();
		if (paramData.preview != undefined) {
			debug && console.log("preview mode");
			$.getJSON("theme.json", function(themeData, textStatus, jqXHR) {
				debug && console.log("loaded theme data:", themeData);
				$.getJSON("sample.json", function(sampleData) {
					debug && console.log("loaded sample data:", sampleData);
					var templateData = tplLoader.mergeThemeData2UserData(themeData, sampleData);
					tplLoader.preview(themeData, templateData);
				}).fail(function(jqxhr, textStatus, error) {
					var err = textStatus + ", " + error;
					error && console.error("Request sample.json failed: " + err);
				});
			}).fail(function(jqxhr, textStatus, error) {
				var err = textStatus + ", " + error;
				error && console.error("Request theme.json failed: " + err);
			});
		}
	}

	function parseUrlParams() {
		var queryString = window.location.search;
		var pData = {};
		if (queryString && queryString.substr(0, 1) == "?") {
			var params = queryString.substr(1, queryString.length).split("&");
			for (var i = 0; i < params.length; i++) {
				var arrParam = params[i].split("=");
				var key = arrParam[0];
				var value = "";
				if (arrParam.length > 1) {
					value = arrParam[1];
				}
				pData[key] = value;
			}
		}
		return pData;
	}

});

