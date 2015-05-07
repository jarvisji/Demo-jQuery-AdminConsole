define(["app/common/AjaxHelper", "app/common/UIHelper", "ace", "jquery.loadTemplate"], function (ajaxHelper, uiHelper, ace) {
    var $menuContainer = $("#menuPlaceHolder");
    if (!$menuContainer) {
        console.error("Menu: missed container with name 'menuPlaceHolder'.");
    }
    $menuContainer.load("templates/MenuTemplate.html", function () {
        // TODO:J load menu data for wxaccount.

        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                var menuHtml = $menuContainer.html().replace(/{wxAccountId}/g, resp.wxAccountId).replace(/{v2ContextPath}/g, v2ContextPath);

                // Replace menu container with menu html, otherwise, main content will not follow menu collapse.
                $menuContainer.replaceWith(menuHtml);
                // Since template is load late than ace.js, so need init menu by manually.
                ace.handle_side_menu($);
                showMenus(resp.modules);
                highlightMenuItem();
            }
        });
    });

    /**
     * Highlight menu item according to current page.
     */
    function highlightMenuItem() {
        var urlPath = window.location.pathname;
        var pageNameStartIndex = urlPath.lastIndexOf("/") == -1 ? 0 : urlPath.lastIndexOf("/") + 1;
        var pageName = urlPath.substring(pageNameStartIndex, urlPath.length);
        debug && console.debug("Menu: current page is " + pageName);

        var currentMenuItem = $("a[href='" + pageName + "']");
        if (currentMenuItem.length > 0) {
            currentMenuItem.closest("li").addClass("active");
            var currentMenuFolder = currentMenuItem.closest("ul");
            if (currentMenuFolder.hasClass("submenu")) {
                currentMenuFolder.closest("li").addClass("active").addClass("open");
            }
        }
    }

    function showMenus(userModules) {
//        var moduleMenus = {
//            "M_BASE": ["textList", "singleImageText", "multipleImageText", "pictureList", "audioList", "videoList", "followReply", "autoReply", "keywordReply"],
//            "M_SITE": ["mwsEntry", "mwsIndex", "mwsCategoryTemplate", "mwsContentTemplate"],
//            "M_SHOP": ["shopEntry", "shopSetting", "shopCategory", "shopOrder"]
//        }
        for (var i = 0; i < userModules.length; i++) {
            $("[name='" + userModules[i] + "']").removeClass("hidden");
        }
    }

});
