require.config({
	baseUrl : 'scripts/lib',
	paths : {
		'app' : '../app',
		// the left side is the module ID, the right side is the path to the jQuery file, relative to baseUrl.
		// Also, the path should NOT include the '.js' file extension.
		// This example is using jQuery 2.0.3 located at scripts/lib/jquery-2.0.3.js, relative to the HTML page.
		'jquery' : 'jquery-2.0.3',
		'jqueryui' : 'jquery-ui-1.10.4',
		// Relative path of UMEditor locate.
		'umeditor' : '../../umeditor',
		// scripts in mobilewebsite module.
		'mws' : '../../mobiwebsite/scripts'
	},
	shim : {
		'bootstrap' : ['jquery'],
		'ace-extra' : ['jquery'],
		'ace-elements' : ['jquery'],
		'ace' : {
			deps : ['bootstrap', 'ace-extra', 'ace-elements'],
			exports : 'ace'
		},
		'jquery.rondell' : {
			deps : ['jquery.mousewheel-3.0.6.min', 'modernizr-2.0.6.min']
		},
		'bootstrap-tag' : ['bootstrap-typeahead']
		// 'bootbox' : ['jquery'],
		// 'jquery.autosize' : ['jquery'],
		// 'jquery.encoding.digests.sha1' : ['jquery'],
		// 'jquery.gritter' : ['jquery'],
		// 'jquery.loadTemplate' : ['jquery'],
		// 'jquery.purl' : ['jquery'],
		// 'jquery.validate' : ['jquery']
	},
	urlArgs: "v=0.1"
});

require(["app/common/MiscUtil", "jquery", "app/Conf", "app/common/Constants"], function(miscUtil) {
	require(["domReady!"], function(doc) {
		loadPageScript();
		require(["app/common/UIHelper"], function(uiHelper) {
			uiHelper.initAlertBar("#alertPlaceHolder");
		});
	});

	function loadPageScript() {
		// Each HTML page should have a corresponding script file in "app" path.
        var pageName = miscUtil.getLocationPage();
		if (pageName == "") {
			pageName = "Index";
		}
		debug && console.log("main: require app/" + pageName);
		require(["app/" + pageName], function(page) {
			page.init();
		});
	}

});

