define(["app/common/AjaxHelper", "app/Header", "app/Menu", "jquery.loadTemplate"], function(ajaxHelper) {

	function init() {
		loadStatsData("day");
		loadStatsData("week");
		loadStatsData("month");
	}

	function loadStatsData(timeRange) {
		var url = "php/ajax.php?method=get&url=/wxstats/account/" + timeRange;
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success == true) {
				$("#" + timeRange + "-tab").loadTemplate($("#wxAccountStatsTemplate"), resp.data);
			}
		});
	}

	return {
		"init" : init
	};
});
