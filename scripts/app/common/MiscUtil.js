define(function() {
	return {
        getLocationPage: function() {
            var urlPath = window.location.pathname;
            var pageNameStartIndex = urlPath.lastIndexOf("/") == -1 ? 0 : urlPath.lastIndexOf("/") + 1;
            var pageNameEndIndex = urlPath.lastIndexOf(".") == -1 ? urlPath.length : urlPath.lastIndexOf(".");
            var pageName = urlPath.substring(pageNameStartIndex, pageNameEndIndex);
            return pageName;
        }
    };
})
