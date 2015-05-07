require.config({
	baseUrl : 'scripts/lib',
	paths : {
		'app' : '../',
		// the left side is the module ID, the right side is the path to the jQuery file, relative to baseUrl.
		// Also, the path should NOT include the '.js' file extension.
		// This example is using jQuery 2.0.3 located at scripts/lib/jquery-2.0.3.js, relative to the HTML page.
		'jquery' : 'jquery-2.0.3',
		'jqueryui' : 'jquery-ui-1.10.4',
		'handlebars' : 'handlebars-v1.3.0',
		'touch' : 'jquery.ui.touch-punch'
	}
});

require(["jquery", "app/Conf", "handlebars"], function() {
	require(["domReady!"], function(doc) {
		loadPageScript();
	});

	function loadPageScript() {
		// Each HTML page should have a corresponding script file in "app" path.
		var urlPath = window.location.pathname;
		var pageNameStartIndex = urlPath.lastIndexOf("/") == -1 ? 0 : urlPath.lastIndexOf("/") + 1;
		var pageNameEndIndex = urlPath.lastIndexOf(".") == -1 ? urlPath.length : urlPath.lastIndexOf(".");
		var pageName = urlPath.substring(pageNameStartIndex, pageNameEndIndex);
		if (pageName == "") {
			pageName = "Index";
		}
		debug && console.log("main: require app/" + pageName);
		require(["app/" + pageName], function(page) {
			// page.init();
		});
	}

});

