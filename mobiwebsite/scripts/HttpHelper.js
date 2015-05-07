define(function() {
	return {
		parseUrlParams : function() {
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
			debug && console.log("request parameters: ", pData);
			return pData;
		},

		setTitleAccordingEntryConfig: function (siteId) {
			debug && console.log("setTitleAccordingEntryConfig()");
			var url = PHPPATH + "ajax.php?method=get&url=/mws/entry?a=" + siteId + "&checkSession=false";
			$.get(url, function (resp) {
				if (resp && resp.success === true) {
					var dbData = resp.data.entity;
					debug && console.log(">> get site entry data from service:", dbData);
					if (dbData.title != undefined && dbData.title != "") {
						$("title").text(dbData.title);
					} else {
						$("title").text("demo移动官网");
					}
				}
			})
		}
	}
});
