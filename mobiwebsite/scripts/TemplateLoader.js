/**
 * 模板编制要求：
 * 1、最外层应该有#wltplContainer容器，大小和body一样。脚本查找这个id加载模板的内容，这容器之外的内容都不能被加载。
 * 2、.wltpl_container 承载全局的设置，如页面背景色。
 *
 */
define(["jquery", "bootstrap", "app/Conf", "jquery.loadTemplate"], function () {

    var mContainerSelector = "#wltplContainer";
    var mFooterSelector = "[name='footer']";

    function loadTemplateData(themeData, templateData) {
        initTemplateFormatter();
        renderTemplate(themeData, templateData);
        initWidget();
        resizeTemplateItem();
        //clearTemplatesScript();
        onTemplateLoadComplete();
    }

    function clearTemplatesScript() {
        // Remove script node of template from page.
        $("script[id$='Template']").remove();
    }

    function renderTemplate(themeData, templateData) {
        debug && console.log("renderTemplate().");
        // TODO:J Split global setting out to a individual step.
        $(mContainerSelector).loadTemplate($(".wltpl_container"), templateData.footer, {
            "append": true,
            "complete": loadTemplateComplete("#wltplContainer")
        });

        if (templateData.header && $("[name='header']").length > 0) {
            debug && console.log(">> load header template, data:", templateData.header);
            $("[name='header']").loadTemplate($("#headerTemplate"), templateData.header, {
                "append": true,
                "complete": loadTemplateComplete("header")
            });
        }
        if (templateData.slide && templateData.slide.length > 0 && $("[name='slide']").length > 0) {
            debug && console.log(">> load slide template, data:", templateData.slide);
            $("[name='slide']").loadTemplate($("#carouselTemplate"), {}, {
                "append": true
            });
            $(".carousel-indicators").loadTemplate($("#carouselIndicatorTemplate"), templateData.slide, {
                "append": true,
                "complete": loadTemplateComplete("slide")
            });
            $(".carousel-inner").loadTemplate($("#carouselItemTemplate"), templateData.slide, {
                "append": true,
                "complete": loadTemplateComplete("slide")
            });
            $(".carousel-indicators li:first").addClass("active");
            $(".carousel-inner .item:first").addClass("active");
        }
        if (templateData.category) {
            var defaultTemplate, oddTemplate, evenTemplate;
            var defaultTemplateStyle, oddTemplateStyle, evenTemplateStyle;
            // parsing template definitions in theme.json.
            var templates = [];
            if (themeData.category.template && themeData.category.template.length > 0) {
                for (var i = 0; i < themeData.category.template.length; i++) {
                    var tpl = themeData.category.template[i];
                    var applyTo = tpl.applyTo;
                    if (applyTo == "*") {
                        defaultTemplate = tpl.id;
                        defaultTemplateStyle = themeData.category.style[tpl.styleIndex];
                    } else if (applyTo == "odd") {
                        oddTemplate = tpl.id;
                        oddTemplateStyle = themeData.category.style[tpl.styleIndex];
                    } else if (applyTo == "even") {
                        evenTemplate = tpl.id;
                        evenTemplateStyle = themeData.category.style[tpl.styleIndex];
                    } else {
                        var arr = str2arr(applyTo);
                        for (var k = 0; k < arr.length; k++) {
                            templates[arr[k]] = tpl.id;
                        }
                    }
                }
            }
            debug && console.log(">> category template defined in theme.json: ", templates, templates.length);
            debug && console.log(">> default template, style index defined in theme.json: ", defaultTemplate, defaultTemplateStyle);

            // apply different template for each category item.
            if (templateData.category && templateData.category.length > 0) {
                for (var i = 0; i < templateData.category.length; i++) {
                    debug && console.log(">> load category template: index, templateId, data:", i, templates[i], templateData.category[i]);
                    // first, set default value;
                    var templateSelector = "#" + defaultTemplate;
                    var addOnTemplateStyle = defaultTemplateStyle;
                    // second, if odd or even value was defined, overwrite default value.
                    if (i % 2 == 0) {
                        if (evenTemplate)
                            templateSelector = "#" + evenTemplate;
                        if (evenTemplateStyle)
                            addOnTemplateStyle = evenTemplateStyle;
                    } else {
                        if (oddTemplate)
                            templateSelector = "#" + oddTemplate;
                        if (oddTemplateStyle)
                            addOnTemplateStyle = oddTemplateStyle;
                    }
                    // last, if individual value was defined, overwrite previous value.
                    if (templates[i]) {
                        templateSelector = "#" + templates[i];
                    } else {
                        console.log(">> No template defined for current data index, try to use default template selector.", i);
                    }

                    // themeData already merged in templateData, but it doesn't define corresponding style for current category, merge addon
                    // style in.
                    if (i >= themeData.category.style.length) {
                        templateData.category[i] = $.extend({}, addOnTemplateStyle, templateData.category[i]);
                    }

                    $("[name='category']").loadTemplate($(templateSelector), templateData.category[i], {
                        "append": true,
                        "complete": loadTemplateComplete("category")
                    });
                }
            }
        }
        if (templateData.footer) {
            debug && console.log(">> load footer template, data:", templateData.footer);
            // try to rander dail template.
            if ($.isArray(themeData.footer.template)) {
                for (var i = 0; i < themeData.footer.template.length; i++) {
                    var template = themeData.footer.template[i];
                    if (template.name == "dail") {
                        var $parentContainer = $(template.parentContainer);
                        if ($parentContainer.length == 0) {
                            error && console.error("Cannot rander dail template, parentContainer is not found.", template.parentContainer);
                        } else {
                            $parentContainer.loadTemplate($("#" + template.id), templateData.footer, {
                                "prepend": true
                            });
                        }
                    }
                }

            }
            $(mFooterSelector).loadTemplate($("#footerTemplate"), templateData.footer, {
                "append": true,
                "complete": loadTemplateComplete("footer")
            });
        }

        calculateFontSize();
    }

    /**
     * Font size in template are defined base on 640px width, we'll scale font size in ratio.
     */
    function calculateFontSize() {
        var baseWidth = 640;
        var screenWidth = $("#wltplContainer").width();
        var ratio = screenWidth / baseWidth * 100 + "%";
        $(".wltpl_font_ratio").css("font-size", ratio);
    }

    function loadTemplateComplete() {
        for (var i = 0; i < arguments.length; i++) {
            console.log(">> load complete:", arguments[i]);
        }
    }

    /**
     * Convert string of index range to array.
     * For example:
     * "1,2,3" => ["1","2","3"]
     * "1-3" => ["1","2","3"]
     * "1, 3" => ["1", "3"]
     *
     * The format "begin-end", if more then one "-" in the string expression, the extra will be ignore.
     * @param {Object} str
     */
    function str2arr(str) {
        var ret = new Array();
        if (typeof str == "string") {
            var arrRange = str.split(",");
            for (var i = 0; i < arrRange.length; i++) {
                var arrIndex = arrRange[i].split("-");
                if (arrIndex.length > 1) {
                    var beginIdx = Number(arrIndex[0]);
                    var endIdx = Number(arrIndex[1]);
                    if (isNaN(beginIdx) || isNaN(endIdx)) {
                        console.log("Parsing '" + str + "' error: invalid range, must be number:", arrRange[i]);
                    } else {
                        // save the index in range
                        for (var j = beginIdx; j <= endIdx; j++) {
                            ret.push(j);
                        }
                    }
                    if (arrIndex.length > 2) {
                        console.log("Parsing '" + str + "' error: not support multiple range expression '" + arrRange[i] + "', range after '-" + arrIndex[2] + "' are ignored.")
                    }
                } else {
                    var idx = Number(arrIndex[0]);
                    if (isNaN(idx)) {
                        console.log("Parsing '" + str + "' error: invalid index, must be number:", arrIndex[0]);
                    } else {
                        // save the index single.
                        ret.push(idx);
                    }
                }
            }
        }
        return ret;
    }

    /* private test*/
    function testStr2Arr() {
        var str = "1,2-4-5,4-6,a";
        var arr = str2arr(str);
        console.log(arr);
    }

    function initWidget() {
        if ($('.carousel').length > 0)
            $('.carousel').carousel({
                interval: 3000
            });
    }

    function initTemplateFormatter() {
        $.addTemplateFormatter({
            appendClassFormatter: function (value) {
                return this.attr("class") + " " + value;
            },
            appendStyleFormatter: function (value, option) {
                var propName = option["cssProp"];
                var style = propName.split(":")[0] + ":" + value;

                var existsStyle = this.attr("style");
                if (existsStyle) {
                    style = existsStyle + ";" + style;
                }
                return style;
            },
            backgroundUrlFormatter: function (value) {
                var style = "background-image: url(" + value + ")";
                var existsStyle = this.attr("style");
                if (existsStyle) {
                    style = existsStyle + ";" + style;
                }
                return style;
            },
            dailLinkFormatter: function (value) {
                return "tel:" + value;
            }
        });
    }

    function resizeTemplateItem() {
        debug && console.log("resizeTemplateItem().");
        var firstItemTopInRow;
        var firstItemHeightInRow;
        $("[wltpl_data]").each(function (index, element) {
            var tplData = $.parseJSON($(element).attr("wltpl_data"));
            var elementTop = $(element).offset().top;
            if (!firstItemTopInRow || Math.abs(firstItemTopInRow - elementTop) > 5) {
                // this is first element in current row, use ratio to calculate height.
                firstItemTopInRow = elementTop;
                firstItemHeightInRow = setHeightByRatio(element, tplData.ratio);
            } else {
                // following element in the same row, should set the same height to first element.
                if (tplData.autoHeight == 'false') {
                    setHeightByRatio(element, tplData.ratio);
                } else {
                    $(element).height(firstItemHeightInRow);
                }
                debug && console.log(">> Resizing item height as same as the first element: element, setting height:", element, firstItemHeightInRow);
            }
        });
    }

    function setHeightByRatio(element, attrRatio) {
        var ratio = parseFloat(attrRatio);
        if (!isNaN(ratio)) {
            var width = $(element).width();
            var newHeight = width / ratio;
            $(element).height(newHeight);
            debug && console.log(">> Resizing first item height: element, current width, setting height:", element, width, newHeight);
            return newHeight;
        } else {
            console.log(">> ratio is not a number: ", ratio);
        }
    }

    /**
     * Styles in theme data will be trade as default value of user data, but there are some other data like template
     * definition are not for user, we should only merge what we need.
     *
     * 对于每一步的themeData，首先尝试查找style节点的数据，如果没有就使用根节点数据。
     *
     * 将themeData合并到userData时，有几种情况：
     * themeData    userData
     * Object       Object       直接合并，合并后userData是Object
     * Array        Object       直接合并
     * Array        Array        直接合并，合并后userData还是Array
     * Object       Array        将themeData合并到每一个userData的item中，合并后userData还是Array
     *
     */
    function mergeThemeData2UserData(themeData, userData) {
        debug && console.log("mergeThemeData2UserData().");
        var templateData = {};
        for (var stepName in userData) {
            var themeData4User = {};
            if (themeData[stepName]) {
                themeData4User = themeData[stepName].style ? themeData[stepName].style : themeData[stepName];
            }

            if ($.isArray(userData[stepName])) {
                templateData[stepName] = [];
                for (var i = 0; i < userData[stepName].length; i++) {
                    if ($.isPlainObject(themeData4User)) {
                        templateData[stepName][i] = $.extend(true, {}, themeData4User, userData[stepName][i]);
                    } else if ($.isArray(themeData4User)) {
                        templateData[stepName][i] = $.extend(true, {}, themeData4User[i], userData[stepName][i]);
                    }
                }
            } else {
                templateData[stepName] = $.extend(true, {}, themeData4User, userData[stepName]);
            }
        }
        console.log(">> merged theme and user data to templateData:", templateData);
        return templateData;
    }

    function onTemplateLoadComplete() {
        debug && console.log("onTemplateLoadComplete().");
        adjustContainerHeight();
        alignFooter();
    }

    /**
     * Defaultly, height of template container are decided by the content height. If content height is less than parent
     * container height, we should adjust to fit parent container's height.
     *
     * In current implementation, parent container may be one of "body" and "#divIphonePreviewContent".
     */
    function adjustContainerHeight() {
        debug && console.log("adjustContainerHeight().");
        var containerHeight = $(mContainerSelector).height();
        var $parent = $(mContainerSelector).parent();
        var parentHeight = $parent.is("body") ? $(window).height() : $parent.height();
        debug && console.log(">> containerHeight, parentHeight, parent:", containerHeight, parentHeight, $parent.selector);
        if (containerHeight < parentHeight) {
            if ($parent.is("body")) {
                $("html").css("height", "100%");
                $parent.css("height", "100%");
            }
            $(mContainerSelector).css("height", "100%");

            var footerBottom = $(mFooterSelector).height();
            //$(mFooterSelector).css("margin-top", ($(mContainerSelector).height() - footerBottom));
            console.log(">>>>>>>>>>>>>>>>>>", footerBottom, parentHeight - containerHeight);
        } else {
            if ($parent.is("body")) {
                $("html").css("height", "auto");
                $parent.css("height", "auto");
            }
            $(mContainerSelector).css("height", "auto");
        }
    }

    function alignFooter() {
        debug && console.log("alignFooter().");
        var footerHeight = $(mFooterSelector).outerHeight(/*includeMargin*/true);
        var footerTop = $(mFooterSelector).position().top;
        var containerHeight = $(mContainerSelector).height();
        var threshold = 10;
        debug && console.log(">> :containerHeight - :footerTop - :footerHeight = :value. threshold is 10px:", containerHeight, footerTop, footerHeight, containerHeight - footerTop - footerHeight);
        if (containerHeight - footerTop - footerHeight > threshold) {
            $(mFooterSelector).css("position", "absolute").css("bottom", 0);
        }
    }

    return {
        mergeThemeData2UserData: mergeThemeData2UserData,
        preview: function (themeData, templateData) {
            debug && console.log("Preview(). Preview template with themeData, templateData:", themeData, templateData);
            // var userDataWithDefaultValues = mergeThemeData2UserData(themeData, templateData);

            loadTemplateData(themeData, templateData);
        },
        resizeTemplateItem: resizeTemplateItem
    }
});
