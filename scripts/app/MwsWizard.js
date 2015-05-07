/**
 * Memo:
 * 脚本对模板属性的一些假设：
 * 1. ".form-group"： 表单项可能由多个html元素组成，每一组表单项都应该放在同一个".form-group"中，脚本以此为顶层容器查找表单项元素。
 * 2. ":button[data-action]"：很多表单项都包含一个button元素，而其对应的操作是不同的。脚本扫描data-action属性的值，以判断合适的操作。
 *        当前用到的data-action的值：
 *        browserImage 浏览图片库
 *        browserIcon  浏览图标库
 * 3. ".form-actions"：表单按钮应当放在有.form-actions的容器中，脚本尝试自动绑定按钮事件处理器。
 * 4. "[name='fieldSet']"和"data-fieldSetId"属性：fieldset是表单域的单元，可以重复添加。脚本扫描form container内的[name='fieldSet']元素的数量，
 *        结合"maxRepeats"判断是否能够添加filedset副本。data-fieldSetId属性则用户标识用户数据，由toFieldSetId, fromFreldSetId方法处理。
 * 5. "[name='fieldSet']
 * [name='fieldsContainer']"。一个fieldset如果包含有fields，那么模板中应该有[name='fieldsContainer']容器。所有的fields将被insert到容器中。
 *
 *
 * 由于模板配置文件、样式文件和用户数据都是异步加载的，它们的顺序是：loadTemplateDef() -> loadTemplateTheme() -> loadUserData()。
 *
 * 如果field设置中，有name属性，脚本会尝试在mUserData中获取属性值为name的值，在模板中用data-content="value"可以调用这个值。
 */

define(["mws/TemplateLoader", "app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/AceFileHelper", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/FormHelper", "app/common/DateUtil", "jqueryui", "jquery.rondell", "app/Header", "app/Menu"], function (tplLoader, mrh, msh, aceFileHelper, ajaxHelper, uiHelper, formHelper, dateUtil) {
    require(["bootbox", "ace", "fuelux.wizard"]);

    /* ======== template variables ======== */
    var mTemplatePath = "mobiwebsite/templates/";
    // while template file load complete, we will cache the content, avoid reload from http call again.
    var mTemplateHtml;
    var $mTemplatePreviewContainer = $("#divIphonePreviewContent");
    var mTemplateContentSelector = "div#wltplContainer";

    /* ======== user data variables ======== */
    // Global variable for all user data. For each step, the data structure should be a Array. convertDBData() function will
    // make sure for it.
    var mUserData = {};
    // Some user data are not configurable in these steps, for example: categoryTemplateName. We need reserve them and write back to DB since site config update will delete all existing  items first.
    var mDbDataReserved = [];
    // Only save data those changed, will decrease network traffic and DB overload.
    // !!!! mUserDataChange cannot cover delete operations, so currently, its not in user. We use mUserData to overwrite all
    // of
    // configurations when saving.
    var mUserDataChange = {};
    // Only save the user changed data before submit form. After form submitted, it will be merged to mUserDataChange and
    // mUserData, then it will be cleared.
    var mUserDataChangeTemp = {};

    /* ======== configuration data variables ======== */
    var mThemeData = {};
    var mStepDefDataArray = [];
    // Save variables for each step, because "+" button is deferred event handler, and it must know every elemnt in different
    // step.
    var $mFieldSetDefList_view = {};
    var $mFieldSetDefList_edit = {};
    var $mFieldDefList_view = {};
    var $mFieldDefList_edit = {};
    var mFieldValidationList = {};
    var mFieldValidationMsgList = {};
    var $mFormContainerList = {};

    var mWxAccountId, mUserId, mModulePrivileges;
    // save user selected template name to cache, will be persistent when user click "complete" button of wizard.
    var mSelectedTemplateName;

    function init() {
        var templateName = "";
        if (window.location.search != undefined) {
            var tmpArr = window.location.search.split("?");
            if (tmpArr.length == 2) {
                templateName = tmpArr[1];
            }
        }
        initRondellThumb(templateName);
    }

    /**
     * Convert key-value DB values to json object, each step data is Array.
     */
    function convertDBData2UserData(dbData) {
        debug && console.log("convertDBData2UserData().");
        for (var i = 0; i < dbData.length; i++) {
            var arr = dbData[i]["id"].propName.split("-");
            if (arr.length != 3) {
                // for templateName, categoryTemplateName, such properties are not belong to any step. Reserve them and will write back to DB when saving data.
                mDbDataReserved.push(dbData[i]);
                continue;
            }

            var step = arr[0];
            var field = arr[1];
            var index = arr[2];
            if (mUserData[step] == undefined) {
                // if (isNaN(index)) {
                // mUserData[step] = {};
                // } else {
                mUserData[step] = [];
                // }
            }
            if (isNaN(index)) {
                // mUserData[step][field] = dbData[i].propValue;
                index = 0;
            }
            // else {
            if (mUserData[step][index] == undefined) {
                mUserData[step][index] = {};
            }
            mUserData[step][index][field] = dbData[i].propValue;
            // }
        }
        debug && console.log(">> converted dbData to userData:", mUserData);
        debug && console.log(">> reserved dbData:", mDbDataReserved);
    }

    function saveUserChangedData() {
        debug && console.log("saveUserChangedData().");

        var dbData = new Array();
        for (var stepName in mUserData) {
            for (var i = 0; i < mUserData[stepName].length; i++) {
                for (var prop in mUserData[stepName][i]) {
                    dbData.push({
                        "id": {
                            "propName": stepName + "-" + prop + "-" + i,
                            "wlsWxAccountId": mWxAccountId
                        },
                        "propValue": mUserData[stepName][i][prop]
                    });
                }
            }
        }
        // Write back reserved DB data. If this is not first time to select template, the templateName should already exists in reversed data, we do update. Otherwise, create new data record for templateName.
        var templateNameUpdated = false;
        for (var i = 0; i < mDbDataReserved.length; i++) {
            if (mDbDataReserved[i].id.propName == 'templateName') {
                mDbDataReserved[i].propValue = mSelectedTemplateName;
                templateNameUpdated = true;
                break;
            }
        }
        if (!templateNameUpdated) {
            dbData.push({
                "id": {
                    "propName": "templateName",
                    "wlsWxAccountId": mWxAccountId
                },
                "propValue": mSelectedTemplateName
            });
        }
        var finalData = dbData.concat(mDbDataReserved);
//        console.log(dbData, mDbDataReserved);
//        debug && console.log(">> converted mUserData to dbData:", dbData);
        debug && console.log(">> saving site config data:", finalData);

        // save to service.
        url = "php/ajax.php?method=put&url=/mws/siteconfig";
        $.post(url, {
            "jsondata": finalData
        }, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                uiHelper.showGritter("模板设置保存成功。");
                window.location.href = "MwsIndex.html";
            } else {
                uiHelper.showGritterError("模板设置保存失败。");
            }
        });
    }

    function loadUserData() {
        debug && console.log("loadUserData().");
        var url = "php/ajax.php?method=get&url=/mws/siteconfig";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                var dbData = resp.data.entity;
                console.log(">> get data from service:", dbData);

                convertDBData2UserData(dbData);

                listUserTemplateData();

                previewTemplate();
            }
        });
    }

    function loadTemplateTheme(templateConfig) {
        var templateThemeFile = mTemplatePath + mSelectedTemplateName + "/" + templateConfig.themeFile;
        debug && console.log("loadTemplateTheme(). loading template theme from " + templateThemeFile);
        $.getJSON(templateThemeFile, function (data) {
            mThemeData = data;
            debug && console.log("loadTemplateTheme() success, theme data:", mThemeData);

            // load template file to preivew window. Not fill user data right now.
            loadTemplateFile(templateConfig, loadUserData);
        }).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            error && console.error("loadTemplateTheme() fail, request theme.json failed: " + err);
        });
    }

    function loadTemplateFile(templateConfig, callback) {
        var templateContentSelector = "div#wltplContainer";
        var templateFile = mTemplatePath + mSelectedTemplateName + "/" + templateConfig.templateFile + " " + mTemplateContentSelector;
        debug && console.log("loadTemplateFile(). loading template from " + templateFile);
        var callbacks = $.Callbacks();
        callbacks.add(callback);

        // insert the template css file reference, before load template html structure.
        var templateCss = mTemplatePath + mSelectedTemplateName + "/" + templateConfig.templateCss;
        $("<link>").attr({
            rel: "stylesheet",
            href: templateCss
        }).appendTo("head");

        $mTemplatePreviewContainer.load(templateFile, function () {
            // cache template clean html content, beacuse loadTemplate plugin will replace template container, so we cannot reload
            // preview with the changed html structure.
            mTemplateHtml = $mTemplatePreviewContainer.html();

            callbacks.fire();
        });
    }

    function initFieldButtonEventHandler() {
        $(":button[data-action]").click(function () {
            var action = $(this).attr("data-action");
            debug && console.log("form field button clicked, data-action: ", action);
            if (action == "browseImage") {
                var type = [
                    {
                        "type": msh.MaterialType.IMAGE,
                        "name": "图片",
                        "showtag": false,
                        "multiselect": false
                    }
                ];
                var $that = $(this);
                mrh.showMaterialDialog(type, function (itemType, itemId, $itemDoms, tagId) {
                    var imgUrl = $itemDoms.find('img').attr('src');
                    updateInputValue($that.closest(".input-group").find("[type='text']"), imgUrl);
                });
            } else if (action == "browseIcon") {
                var iconClasses = ["icon-compass", "icon-file-text", "icon-windows", "icon-gittip", "icon-archive", "icon-thumbs-up", "icon-sun", "icon-file", "icon-bitbucket", "icon-adjust", "icon-beer", "icon-book", "icon-calendar", "icon-certificate", "icon-check-sign", "icon-cloud-download", "icon-coffee", "icon-comments", "icon-ellipsis-vertical", "icon-eye-open", "icon-film", "icon-flag", "icon-folder-close-alt", "icon-gift", "icon-home", "icon-key", "icon-lightbulb", "icon-mobile-phone", "icon-music", "icon-picture", "icon-ok-sign", "icon-plus-sign-alt", "icon-rss-sign", "icon-sitemap", "icon-star", "icon-tasks", "icon-umbrella", "icon-volume-off", "icon-zoom-in", "icon-bar-chart", "icon-bell", "icon-bookmark", "icon-check", "icon-cloud-upload", "icon-cog", "icon-comments-alt", "icon-dashboard", "icon-edit", "icon-envelope", "icon-facetime-video", "icon-flag-alt", "icon-folder-open", "icon-headphones", "icon-plane", "icon-pencil", "icon-inbox", "icon-location-arrow", "icon-map-marker", "icon-off", "icon-qrcode", "icon-signal", "icon-smile", "icon-star-empty", "icon-trash", "icon-volume-up", "icon-zoom-out", "icon-bell-alt", "icon-bookmark-empty", "icon-bullhorn", " icon-camera", "icon-cogs", "icon-comment", "icon-edit-sign", "icon-envelope-alt", "icon-folder-open-alt", "icon-globe", "icon-heart", "icon-lock", "icon-phone", "icon-question", "icon-rocket", "icon-search", "icon-shield", "icon-suitcase", "icon-tag", "icon-trophy", "icon-user", "icon-briefcase", "icon-camera-retro", "icon-cloud", "icon-comment-alt", "icon-credit-card", "icon-food", "icon-cogs", "icon-group", "icon-heart-empty", "icon-info-sign", "icon-microphone", "icon-phone-sign", "icon-reorder", "icon-refresh", "icon-shopping-cart", "icon-share", "icon-spinner", "icon-tags", "icon-time", "icon-truck", "icon-volume-down", "icon-wrench", "icon-file-text-alt", "icon-paste", "icon-save", "icon-columns", "icon-th", "icon-copy", "icon-paper-clip", "icon-list-alt", "icon-cut", "icon-th-list", "icon-hand-right", "icon-ambulance", "icon-h-sign", "icon-hospital", "icon-medkit", " icon-plus-sign-alt", "icon-stethoscope", "icon-user-md"];
                var htmlStr = '<div class="clearfix" id="iconContainer">';
                for (var i = 0; i < iconClasses.length; i++) {
                    htmlStr += '<div class="col-xs-1"><a name="aSelectIcon" href="' + iconClasses[i] + '"><i class="' + iconClasses[i] + ' icon-4x"></i></a></div>';
                }
                htmlStr += '</div>'
                showDialog("选择图标", htmlStr, this);
                $("#iconContainer i").hover(function () {
                    $(this).addClass("blue");
                }, function () {
                    $(this).removeClass("blue");
                });
                $("#iconContainer i").click(function () {
                    // when user click and select an icon, we highlight it with red color.
                    $("#iconContainer").find(".red").removeClass("red");
                    $(this).addClass("red");
                });
            } else {
                // material dialog
                var defineTypes = {
                    "M_BASE": {
                        "type": "sit",
                        "name": "图文",
                        "showtag": true,
                        "multiselect": true
                    }, "M_ALBUM": {
                        "type": "album",
                        "name": "相册",
                        "showtag": false,
                        "multiselect": true
                    }
                };

                // check module privileges of current login user.
                var showTypes = [];
                for (var module in defineTypes) {
                    for (var i = 0; i < mModulePrivileges.length; i++) {
                        if (module == mModulePrivileges[i]) {
                            showTypes.push(defineTypes[module]);
                            break;
                        }
                    }
                }
//                var types = action.split(","); // currently, we don't get action define from config file.
//                for (var i = 0; i < types.length; i++) {
//                    if (supportTypes[types[i]] == undefined) {
//                        error && console.error("Unsupported type for category target: ", types[i]);
//                    } else {
//                        showTypes.push(supportTypes[types[i]]);
//                    }
//                }
                debug && console.log(">> showing dialog for: ", showTypes);
                var $that = $(this);
                mrh.showMaterialDialog(showTypes, function (itemType, itemId, $itemDoms, tagId) {
                    if (itemType == msh.MaterialType.SIT) {
                        var arr = window.location.href.split("/");
                        // hard code the category page url.
                        var categoryPageUrl = "mobiwebsite/Category.html?site=" + mWxAccountId;
                        var selectItems = itemId ? itemType + "!item:" + itemId : itemType + "!tag:" + tagId;
                        arr[arr.length - 1] = categoryPageUrl + "&list=" + encodeURIComponent(selectItems);
                        var categoryTarget = arr.join("/");
                        updateInputValue($that.closest(".input-group").find("[type='text']"), categoryTarget);
                    } else if (itemType == msh.MODULES.ALBUM) {
                        var categoryPageUrl = window.location.origin + v2ContextPath + "/album/client.html";
                        categoryPageUrl += "#/" + mUserId + "/" + mWxAccountId + "/albums";
                        categoryPageUrl += "?list=" + encodeURIComponent(itemId);
                        updateInputValue($that.closest(".input-group").find("[type='text']"), categoryPageUrl);
                    } else {
                        error && console.log("Unsupported type:", itemType);
                    }
                }, mWxAccountId);
            }
        });
    }

    function showDialog(title, htmlStr, callerElement) {
        bootbox.dialog({
            "title": title,
            "message": htmlStr,
            "buttons": {
                "success": {
                    "label": "<i class='icon-ok'></i> 确定",
                    "className": "btn-sm btn-success"
                    // "callback" : function() {
                    // debug && console.log("dialog.ok, caller: ", callerElement);
                    // // console.log($(this));
                    // // var imgUrl = $(this).find(".modal-dialog .text.display img").attr("src");
                    // // console.log($(this).find(".modal-dialog"));
                    // // console.log($(this).find(".modal-dialog .text.display img"));
                    // // $(callerElement).closest(".form-group").find(":text").val(imgUrl);
                    // // console.log($(callerElement).closest(".form-group").find(":text"));
                    // }
                }
            }
        });
        //bind click event handler for image list. when user click on image, add selected style to the image.
        $(".modal-dialog a[name='aSelectImage']").click(function (ev) {
            ev.preventDefault();
            $(this).closest(".modal-body").find(".display").removeClass("display");
            var selectedItem = $(this).find(".text");
            selectedItem.addClass("display");
            var imgUrl = selectedItem.closest("li").find("img").attr("src");
            updateInputValue($(callerElement).closest(".form-group").find(":text"), imgUrl);
        });
        $(".modal-dialog a[name='aSelectIcon']").click(function (ev) {
            ev.preventDefault();
            var iconClass = $(this).attr("href");
            updateInputValue($(callerElement).closest(".form-group").find(":text"), iconClass);
        });
    }

    /**
     * Update input value and fire "change" event.
     */
    function updateInputValue(input, value) {
        input.val(value);
        input.change();
    }

    function loadImageCallback(caller) {
        debug && console.log("loadImageCallback(). caller:", caller);
        showDialog("选择图片素材", $("#imageContainer").html(), caller);
    }

    function loadTemplateDef(templateConfig) {
        var templateConfFile = mTemplatePath + mSelectedTemplateName + "/" + templateConfig.configFile;
        debug && console.log("loadTemplateDef(). loading template configuration from " + templateConfFile);
        var time = new Date().getTime();
        var time1, time2;

        $.get(templateConfFile, function (templateXmlData) {
            time1 = new Date().getTime();

            loadTemplateTheme(templateConfig);

            initTemplateFormatter();

            initWizardSteps(templateXmlData);

            parseStepDefData();

            initWidgetSortable();

            initAceWizard();

            initStepToolbarEventHandler();

            togglePreview();

            time2 = new Date().getTime();
            console.log("load tempalte spend:", time1 - time);
            console.log("parse template spend:", time2 - time1);
        }).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            error && console.error("Request template configuration file failed: " + err);
            uiHelper.showGritterError("加载模板配置失败，请联系客服人员。");
        });
    }

    function initWizardSteps(templateXmlData) {
        var $templateXmlData = $(templateXmlData);
        var stepDefs = $templateXmlData.find("steps>step");
        for (var i = 0; i < stepDefs.length; i++) {
            var $stepConf = $(stepDefs[i]);
            var stepName = $stepConf.attr("name");
            mStepDefDataArray[i] = {
                "stepName": stepName,
                "stepNumber": i + 1,
                "stepTitle": $stepConf.attr("title"),
                "stepDesc": $stepConf.find("description:first").text(),
                "stepConf": $stepConf
            };
        }
        debug && console.log("initWizardSteps(), steps data is ", mStepDefDataArray);
        $("#stepLableContainer").loadTemplate("#wizardStepLableTemplate", mStepDefDataArray, {
            "append": true
        });
        $("#stepContentContainer").loadTemplate("#wizardStepContentTemplate", mStepDefDataArray, {
            "append": true
        });
    }

    function parseStepDefData() {
        for (var i = 0; i < mStepDefDataArray.length; i++) {
            // Build form fields for each step.
            var stepName = mStepDefDataArray[i].stepName;

            var $stepConf = mStepDefDataArray[i].stepConf;
            var $fieldSetConf_view = $stepConf.find("view>fieldSet");
            if ($fieldSetConf_view.length > 0) {
                $mFieldSetDefList_view[stepName] = $fieldSetConf_view;
                var $fieldDefs_view = $fieldSetConf_view.find("field");
                if ($fieldDefs_view.length > 0) {
                    $mFieldDefList_view[stepName] = $fieldDefs_view;
                } else {
                    $mFieldDefList_view[stepName] = undefined;
                }
            } else {
                $mFieldSetDefList_view[stepName] = undefined;
            }

            var $fieldSetConf_edit = $stepConf.find("edit>fieldSet");
            if ($fieldSetConf_edit.length > 0) {
                $mFieldSetDefList_edit[stepName] = $fieldSetConf_edit;
                var $fieldDefs_edit = $fieldSetConf_edit.find("field");
                if ($fieldDefs_edit.length > 0) {
                    $mFieldDefList_edit[stepName] = $fieldDefs_edit;
                    // parse validator definitions for edit form.
                    mFieldValidationList[stepName] = {};
                    mFieldValidationMsgList[stepName] = {};
                    for (var j = 0; j < $fieldDefs_edit.length; j++) {
                        var $fieldDef = $($fieldDefs_edit[j]);
                        var validationStr = $fieldDef.attr("validation");
                        if (validationStr) {
                            if (validationStr.charAt(0) == "{") {
                                mFieldValidationList[stepName][$fieldDef.attr("name")] = $.parseJSON(validationStr);
                            } else {
                                mFieldValidationList[stepName][$fieldDef.attr("name")] = validationStr;
                            }
                            var validationMsg = $fieldDef.attr("validationMsg");
                            if (!validationMsg) {
                                validationMsg = "验证失败";
                            }
                            if (validationMsg.charAt(0) == "{") {
                                mFieldValidationMsgList[stepName][$fieldDef.attr("name")] = $.parseJSON(validationMsg);
                            } else {
                                mFieldValidationMsgList[stepName][$fieldDef.attr("name")] = validationMsg;
                            }
                        }
                    }
                } else {
                    $mFieldDefList_edit[stepName] = undefined;
                }
            } else {
                $mFieldSetDefList_edit[stepName] = undefined;
            }

            var $formContainer = $(".step-pane[id$='" + stepName + "'] #formContainer");
            if ($formContainer.length > 0) {
                $mFormContainerList[stepName] = $formContainer;
            } else {
                $mFormContainerList[stepName] = undefined;
            }

        }
        debug && console.log("parseStepDefData(), $mFieldSetDefList_view:", $mFieldSetDefList_view);
        debug && console.log("parseStepDefData(), $mFieldSetDefList_edit:", $mFieldSetDefList_edit);
        debug && console.log("parseStepDefData(), $mFieldDefList_view:", $mFieldDefList_view);
        debug && console.log("parseStepDefData(), $mFieldDefList_edit:", $mFieldDefList_edit);
        debug && console.log("parseStepDefData(), mFieldValidationList:", mFieldValidationList);
        debug && console.log("parseStepDefData(), mFieldValidationMsgList:", mFieldValidationMsgList);
        debug && console.log("parseStepDefData(), $mFormContainerList:", $mFormContainerList);
    }

    /**
     * Init event handler for add fieldset and toggle iphone preview button in every step panes.
     */
    function initStepToolbarEventHandler() {
        initAddFieldSetEventHandler();
        initPreviewToggle();
    }

    function initAddFieldSetEventHandler() {
        for (var stepName in $mFormContainerList) {
            if ($mFieldSetDefList_view[stepName]) {
                var maxRepeats = Number($mFieldSetDefList_view[stepName].attr("maxRepeats"));
                debug && console.log("initAddFieldSetEventHandler(), stepName, maxRepeats: ", stepName, maxRepeats);
                if (!isNaN(maxRepeats)) {
                    // bind "click" event to "+" button.
                    $(".step-pane[id$='" + stepName + "'] [name='btnAddFieldSet']").click(onAddFieldSet);
                } else {
                    disableAddFieldsetButton(stepName);
                }
            }
        }
    }

    /**
     * Event handler for click on addFieldSet button.
     */
    function onAddFieldSet(ev) {
        ev && ev.preventDefault();
        var stepName = $(this).attr("stepName");
        debug && console.log("onAddFieldSet(). step name:", stepName);
        var newIndex = $mFormContainerList[stepName].find("[name='fieldSet']").length;
        var maxRepeats = Number($mFieldSetDefList_view[stepName].attr("maxRepeats"));
        if (isNaN(maxRepeats)) {
            maxRepeats = 1;
        }
        debug && console.log("onAddFieldSet(), newIndex, maxRepeats:", newIndex, maxRepeats);
        if (maxRepeats == 0 || newIndex < maxRepeats) {
            var fieldSetId = toFieldSetId(stepName, newIndex);
            showEditForm(fieldSetId);
        } else {
            // disableAddFieldsetButton(stepName);
            uiHelper.showGritterError("此步骤最多只能添加" + maxRepeats + "个项目。");
        }
    }

    /**
     * Check fieldSets for step exceed max-repeat limit or not. The situation often happened when changing template, original fieldSets limitation is large than current.
     * Refer to: WXSERVICE-197.
     * @param stepName
     * @returns {boolean}
     */
    function validateRepeatCount(stepName) {
        debug && console.log("validateRepeatCount(). step name:", stepName);
        var existsItems = $mFormContainerList[stepName].find("[name='fieldSet']").length;
        var maxRepeats = Number($mFieldSetDefList_view[stepName].attr("maxRepeats"));
        if (isNaN(maxRepeats)) {
            maxRepeats = 1;
        }
        debug && console.log("validateRepeatCount(), existsItems, maxRepeats:", existsItems, maxRepeats);
        var ret = true;
        if (maxRepeats != 0 && existsItems > maxRepeats) {
            ret = false;
            uiHelper.showGritterError("此步骤最多只能添加" + maxRepeats + "个项目。");
        }
        return ret;
    }

    /**
     * List user template data in "view" mode for all steps.
     */
    function listUserTemplateData() {
        for (var i = 0; i < mStepDefDataArray.length; i++) {
            var stepName = mStepDefDataArray[i].stepName;
            listStepData(stepName);
        }
    }

    /**
     * Fill user data to fieldSet list for special step.
     */
    function listStepData(stepName) {
        debug && console.log("listStepData(), stepName:", stepName);
        enableAddFieldsetButton(stepName);
        clearFormContent($mFormContainerList[stepName]);

        var $formContainer = $mFormContainerList[stepName];
        var $fieldSetDef_view = $mFieldSetDefList_view[stepName];
        var $fieldDefs_view = $mFieldDefList_view[stepName];

        if ($formContainer && $formContainer.length > 0 && $fieldSetDef_view && $fieldSetDef_view.length > 0) {
            var fieldSetTemplateId = $fieldSetDef_view.attr("templateId");
            if (!fieldSetTemplateId) {
                throw "FieldSet definition must has templateId";
            }

            var stepUserData = mUserData[stepName];
            debug && console.log(">> step user data:", stepUserData);
            if (!stepUserData || stepUserData.length == 0) {
                debug && console.log(">> No user data to show for this step.");
                return;
            }

            var templateData = [];
            for (var i = 0; i < stepUserData.length; i++) {
                var fieldSetId = toFieldSetId(stepName, i);
                templateData[i] = $.extend({}, stepUserData[i], {
                    "fieldSetId": fieldSetId
                });
            }

            $formContainer.loadTemplate("#" + $fieldSetDef_view.attr("templateId"), templateData, {
                "append": true
            });

            /* add fields in fieldset */
            for (var i = 0; i < templateData.length; i++) {
                var $fieldSet = $formContainer.find("[data-fieldsetid='" + templateData[i].fieldSetId + "']");

                if ($fieldDefs_view) {
                    var $fieldsContainer = $fieldSet.find("[name='fieldsContainer']");
                    for (var j = 0; j < $fieldDefs_view.length; j++) {
                        // Build each field according to tempalte.
                        $fieldDef = $($fieldDefs_view[j]);
                        var fieldTemplateId = $fieldDef.attr("templateId");
                        if (!fieldTemplateId)
                            throw "Field definition must has templateId";

                        // Iterate xml attributes in field definition.
                        var data = {};
                        var fieldDefAttrs = $fieldDefs_view[j].attributes;
                        for (var k = 0; k < fieldDefAttrs.length; k++) {
                            data[fieldDefAttrs[k].name] = fieldDefAttrs[k].value;
                        }

                        $.extend(data, templateData[i], {
                            "value": templateData[i][data.name]
                        });
                        debug && console.log(">> fill field data:", data);
                        $fieldsContainer.loadTemplate("#" + fieldTemplateId, data, {
                            "append": true
                        });
                    }
                }
                initFieldSetActionHandler($fieldSet);
            }
            updateFieldSetSortable($formContainer, $fieldSetDef_view);
        } else {
            error && console.error(">> Cannot init view, $formContainer or $fieldSetDef_view is invalid. Step is: ", stepName);
        }
    }

    function initFormActionHandlers($formContainer) {
        debug && console.log("initFormActionHandlers(). form: " + $formContainer.selector);
        var fieldSetId = $formContainer.find("[name='fieldSet']").attr("data-fieldsetid");
        var stepName = fromFieldSetId(fieldSetId).stepName;
        var $btnSave = $formContainer.find(".form-actions :button[name='save']");
        var $btnCancel = $formContainer.find(".form-actions :button[name='cancel']");
        $btnSave.click(stepName, onFormSubmit);
        $btnCancel.click(stepName, onFormCancel);
    }

    function onFormSubmit(ev) {
        debug && console.log("onFormSubmit(). step name:", ev.data);
        var stepName = ev.data;
        if (!$(this).closest("form").valid())
            return false;

        applyTemporaryUserData();
        debug && console.log(">> submited data: mUserData, mUserDataChange", mUserData, mUserDataChange);
        listStepData(stepName);
    }


    $(window).on("unload", function (ev) {
        ev.preventDefault();
        bootbox.confirm("leave?", function (ret) {
            console.log(ret);
        });
    });

    function onFormCancel(ev) {
        debug && console.log("onFormCancel(). step name:", ev.data);
        var stepName = ev.data;
        listStepData(stepName);
        if (!$.isEmptyObject(mUserDataChangeTemp)) {
            previewTemplate();
        }
        clearTemporaryUserData();
    }

    function enableAddFieldsetButton(stepName) {
        $(".step-pane[id$='" + stepName + "']").find("[name='btnAddFieldSet']").removeClass("disabled");
    }

    function disableAddFieldsetButton(stepName) {
        $(".step-pane[id$='" + stepName + "']").find("[name='btnAddFieldSet']").addClass("disabled");
    }

    /**
     * Init validators for edit form, according to field definitions.
     */
    function initValidator(stepName) {
        debug && console.log("initValidator(). for step name:", stepName);
        var fieldValidators = mFieldValidationList[stepName];
        var fieldValidatorMsg = mFieldValidationMsgList[stepName];
        debug && console.log(">> validataor def:", fieldValidators, fieldValidatorMsg);
        $.validator.addMethod("fileUploadCompleteValidator", function (value, element, params) {
            var $urlHolder = $($(element).attr("urlHolderSelector"));
            debug && console.log("fileUploadCompleteValidator(). value of $urlHolder:", $urlHolder.val());
            return $urlHolder.val() != "";
        });
        formHelper.initFormValidator($mFormContainerList[stepName].closest("form"), fieldValidators, fieldValidatorMsg);
    }

    // Add formatter for jQuery template.
    function initTemplateFormatter() {
        $.addTemplateFormatter({
            valueFormatter: function (value, options) {
                var ret = value;
                if (options) {
                    if (options.prefix) {
                        ret = options.prefix + value;
                    }
                }
                return ret;
            },
            dateTimeFormatter: function (value) {
                return dateUtil.ts2LocalDate(value);
            }
        });
    }

    function initPreviewToggle() {
        $("[name='btnTogglePreview']").click(function () {
            togglePreview();
        });
    }

    function togglePreview() {
        var $preview = $("#iphonePreviewContainer");
        var $content = $("#stepContentContainer");
        if ($preview.hasClass("hidden")) {
            $preview.removeClass("hidden");
            $content.removeClass("col-xs-12");
            $content.addClass("col-xs-8");
        } else {
            $preview.addClass("hidden");
            $content.removeClass("col-xs-8");
            $content.addClass("col-xs-12");
        }
        // $("#iphonePreviewContainer").toggle("slide", {}, 200);
        // $("#stepContentContainer").toggleClass("col-xs-8");
    }

    function initFieldSetActionHandler(/* optional */$parent) {
        if ($parent) {
            debug && console.log("initFieldSetActionHandler(), init action handler in:", $parent.selector);
            $parent.find("[name='aEditFieldSet']").click(onEditFieldSet);
            $parent.find("[name='aDeleteFieldSet']").click(onDeleteFieldSet);
        } else {
            debug && console.log("initFieldSetActionHandler(), init action handlers for all fieldsets.");
            $("[name='aEditFieldSet']").click(onEditFieldSet);
            $("[name='aDeleteFieldSet']").click(onDeleteFieldSet);
        }
    }

    /**
     * When user click on template item which has target URL configured, we should show target page in preview window,
     * instead of browser window.
     */
    function initTemplateLinkClickHandler($templateContainer) {
        $templateContainer.find("a").click(function (ev) {
            ev.preventDefault();
            debug && console.log("initTemplateLinkClickHandler(). link clicked:", $(this).attr("href"));
            //uiHelper.showGritter("跳转链接：" + $(this).attr("href"));
            // $mTemplatePreviewContainer.load($(this).attr("href"));
        });
    }

    function onDeleteFieldSet(ev) {
        ev.preventDefault();
        var fieldSetId = domnavGetFieldSetId($(this));
        debug && console.log("onDeleteFieldSet(): current fieldset:", fieldSetId);
        var stepName = fromFieldSetId(fieldSetId).stepName;
        var index = fromFieldSetId(fieldSetId).index;
        var deletedUserData = mUserData[stepName].splice(index, 1);
        if (mUserDataChange[stepName] && mUserDataChange[stepName][index]) {
            var deletedUserDataChange = mUserDataChange[stepName].splice(index, 1);
        }
        debug && console.log(">> deleted data from mUserData, mUserDataChange:", deletedUserData, deletedUserDataChange);
        listStepData(stepName);
        previewTemplate();
    }

    function onEditFieldSet(ev) {
        ev.preventDefault();
        var fieldSetId = domnavGetFieldSetId($(this));
        debug && console.log("onEditFieldSet(): current fieldset:", fieldSetId);
        showEditForm(fieldSetId);
    }

    function showEditForm(fieldSetId) {
        debug && console.log("showEditForm(): current fieldset:", fieldSetId);
        var stepName = fromFieldSetId(fieldSetId).stepName;
        var index = fromFieldSetId(fieldSetId).index;
        var $formContainer = $mFormContainerList[stepName];
        var $fieldSetDef_edit = $mFieldSetDefList_edit[stepName];
        var $fieldDefs_edit = $mFieldDefList_edit[stepName];

        if ($formContainer && $formContainer.length > 0 && $fieldSetDef_edit && $fieldSetDef_edit.length > 0) {
            var fieldSetTemplateId = $fieldSetDef_edit.attr("templateId");
            if (!fieldSetTemplateId) {
                throw "FieldSet definition must has templateId";
            }

            clearFormContent($formContainer);

            var templateData = {};
            if (mUserData[stepName] && mUserData[stepName][index]) {
                $.extend(templateData, mUserData[stepName][index]);
            } else if (mThemeData[stepName] && mThemeData[stepName].style && mThemeData[stepName].style[index]) {
                // create new item
                $.extend(templateData, mThemeData[stepName].style[index]);
            }

            $.extend(templateData, {
                "fieldSetId": fieldSetId
            });

            $formContainer.loadTemplate("#" + $fieldSetDef_edit.attr("templateId"), templateData, {
                "append": true
            });

            /* add fields in fieldset */
            var $fieldSet = $formContainer.find("[data-fieldsetid='" + fieldSetId + "']");

            if ($fieldDefs_edit) {
                var $fieldsContainer = $fieldSet.find("[name='fieldsContainer']");
                for (var j = 0; j < $fieldDefs_edit.length; j++) {
                    // Build each field according to template.
                    $fieldDef = $($fieldDefs_edit[j]);
                    var fieldTemplateId = $fieldDef.attr("templateId");
                    if (!fieldTemplateId)
                        throw "Field definition must has templateId";

                    // Iterate xml attributes in field definition.
                    var data = {};
                    var fieldDefAttrs = $fieldDefs_edit[j].attributes;
                    for (var k = 0; k < fieldDefAttrs.length; k++) {
                        data[fieldDefAttrs[k].name] = fieldDefAttrs[k].value;
                    }

                    $.extend(data, {
                        "value": templateData[data.name]
                    });
                    debug && console.log(">> fill field data:", data);
                    $fieldsContainer.loadTemplate("#" + fieldTemplateId, data, {
                        "append": true
                    });
                }
            }
            initFileUploader($fieldSet);
            initFieldButtonEventHandler();
            initColorPicker($formContainer);
            initValidator(stepName);
            initFormActionHandlers($formContainer);
            initFormInputHandlers($formContainer);
            disableAddFieldsetButton(stepName);
            updateFieldSetSortable($formContainer, $fieldSetDef_edit);
            clearTemporaryUserData();
        } else {
            error && console.error(">> Cannot init edit view, $formContainer or $fieldSetDef_edit is invalid. Step is: ", stepName);
        }
    }

    function clearFormContent($formContainer) {
        $formContainer.html("");
    }

    function initFormInputHandlers($formContainer) {
        $formContainer.find(":input").change(onFormInputChange);
    }

    function onFormInputChange(ev) {
        debug && console.log("onFormInputChange().");
        var propName = $(this).attr("name");
        var propValue = $(this).val();
        var fieldSetId = domnavGetFieldSetId($(this));
        var stepName = fromFieldSetId(fieldSetId).stepName;
        var index = fromFieldSetId(fieldSetId).index;
        // mUserData[stepName][index][propName] = propValue;
        saveTemporaryUserData(stepName, index, propName, propValue);

        // preview at once when user change input, but not merge change to mUserData.
        var previewData = $.extend(true, {}, mUserData, mUserDataChangeTemp);
        previewTemplate(previewData);
    }

    function saveTemporaryUserData(stepName, index, prop, value) {
        console.log("saveTemporaryUserData().");
        if (typeof stepName != "string") {
            error && console.error(">> invalid step name:", stepName);
        } else {
            if (isNaN(index)) {
                error && console.error(">> invalid index:", index);
            } else {
                var data = {};
                data[stepName] = [];
                if (typeof prop == "string") {
                    data[stepName][index] = {};
                    data[stepName][index][prop] = value;
                } else {
                    data[stepName][index] = prop;
                }
                $.extend(true, mUserDataChangeTemp, data);
                debug && console.log(">> mUserDataChangeTemp:", mUserDataChangeTemp);
            }
        }

    }

    /**
     * When user submit form, merge mUserDataChangeTemp into mUserData and mUserDataChange.
     */
    function applyTemporaryUserData() {
        $.extend(true, mUserData, mUserDataChangeTemp);
        $.extend(true, mUserDataChange, mUserDataChangeTemp);
        clearTemporaryUserData();
    }

    function clearTemporaryUserData() {
        mUserDataChangeTemp = {};
    }

    /**
     * Navigate dom nodes to find "fieldSet" which around the giving dom node, then return value of "data-fieldsetid"
     * attribute.
     */
    function domnavGetFieldSetId($dom) {
        return $dom.closest("[name='fieldSet']").data("fieldsetid");
    }

    function initFileUploader(/* optional */$parent) {
        if ($parent) {
            debug && console.log("initFileUploader(), init file inputs in:", $parent.selector);
            aceFileHelper.initUploadHandler($parent.find(":file"), {
                "isChangeUpload": true,
                "uploadActionUrl": "./php/fileUpload.php"
            });
        } else {
            debug && console.log("initFileUploader(), init all file inputs.");
            aceFileHelper.initUploadHandler($(":file"), {
                "isChangeUpload": true,
                "uploadActionUrl": "./php/fileUpload.php"
            });
        }
    }

    function initWidgetSortable() {
        for (var stepName in $mFormContainerList) {
            var $fieldSetDef_view = $mFieldSetDefList_view[stepName];
            // if ($fieldSetDef_view && $fieldSetDef_view.attr("sortable") == "true") {
            var $formContainer = $mFormContainerList[stepName];
            debug && console.log("initWidgetSortable(), formContainer", $formContainer.selector);
            $formContainer.addClass("ui-sortable");
            $formContainer.sortable({
                // connectWith : '.widget-container-span',
                items: "> [name='fieldSet']",
                opacity: 0.8,
                revert: 100,
                forceHelperSize: true,
                placeholder: 'widget-placeholder',
                forcePlaceholderSize: true,
                tolerance: 'pointer',
                update: onSortableUpdate
            });
            // }
        }
    }

    /**
     * Event handler for sorting updated of sortable items, and update mUserData according to the new order.
     */
    function onSortableUpdate(event, ui) {
        debug && console.log("onSortableUpdate().");
        // var newSort = $(this).sortable("toArray", {
        // attribute : "data-fieldsetid"
        // });

        var items = $(this).find($(this).sortable("option", "items"));
        var tmpArr = [];
        var stepName;
        for (var i = 0; i < items.length; i++) {
            var $item = $(items[i]);
            var currentFieldSetId = $item.attr("data-fieldsetid");
            stepName = fromFieldSetId(currentFieldSetId).stepName;
            var index = fromFieldSetId(currentFieldSetId).index;
            var newFieldSetId = toFieldSetId(stepName, i);
            // save data for new sort.
            tmpArr[i] = mUserData[stepName][index];
            // update fieldSetId of dom node according to new sorted index. Make sure index in fieldSetId are same to the position
            // index of dom nodes.
            $item.attr("data-fieldsetid", newFieldSetId);
        }
        mUserData[stepName] = tmpArr.concat();
        mUserDataChange[stepName] = tmpArr;
        previewTemplate();
    }

    function updateFieldSetSortable($formContainer, $fieldSetDef) {
        var sortable = $fieldSetDef.attr("sortable");
        debug && console.log("updateFieldSetSortable(), formContainer:", $formContainer.selector, sortable);
        if (sortable == "true") {
            $formContainer.sortable("enable");
        } else {
            $formContainer.sortable("disable");
        }
    }

    function initColorPicker($formContainer) {
        if ($formContainer.find(".dropdown-colorpicker").length > 0) {
            formHelper.initColorPicker(".dropdown-colorpicker", onColorPickerChanged);
        }
    }

    function onColorPickerChanged(ev) {
        ev.preventDefault();
        debug && console.log("onColorPickerChanged().");
        updateInputValue($(this).closest(".form-group").find(":text"), $(this).attr("data-color"));
    }

    function initAceWizard() {
        $('#templateWizard').ace_wizard().on('change', function (e, info) {
            onWizardChange(e, info);
        }).on('finished', onWizardFinish).on('stepclick', onWizardStepClick);
        $("#btnSelectTemplate").click(onSelectTemplateClick);
        $("#templateListContainer").addClass("hidden");
        $("#wizardContainer").removeClass("hidden");
        $(".step-pane:first").addClass("active");
        $("#stepLableContainer>li:first").addClass("active");
    }

    function onWizardChange(e, info) {
        debug && console.log("onWizardChange:", e, info);
        // show/hide button of select template.
        if (info.step == 1 && info.direction == 'next') {
            $("#btnSelectTemplate").addClass("hidden");
        } else if (info.step == 2 && info.direction == 'previous') {
            $("#btnSelectTemplate").removeClass("hidden");
        }
        if (info.direction == "next") {
            // Validate fieldSets repeat count.
            var stepName = mStepDefDataArray[info.step - 1].stepName;
            if (!validateRepeatCount(stepName)) {
                e.preventDefault();
            }
        }
    }

    function onWizardFinish(e) {
        debug && console.log("onWizardFinish(). ");
        saveUserChangedData();
    }

    function onWizardStepClick(e) {
        debug && console.log("onWizardStepClick(). ", e);
    }

    function onSelectTemplateClick() {
        window.location.href = "MwsWizard.html";
    }

    // save selected template name in step 1, use it to constract next steps.
    function initRondellThumb(templateName) {
        $.getJSON(mTemplatePath + "TemplateList.json", function (data) {
            // start build wizard event
            $("#btnBuildWizard").click(function () {
                loadTemplateDef(config);
                loadWxAccountId();
            });

            var config = data.config;
            // if passed in user selected template name, we don't show rondell thumb for user, just fire build wizard event, to edit
            // template content.
            if (templateName != undefined && templateName != "") {
                mSelectedTemplateName = templateName;
                require(["fuelux.wizard"], function () {
                    $("#btnBuildWizard").click();
                });
            } else {
                var templateDescs = {};
                var rondellContent = "";
                for (var i = 0; i < data.templates.length; i++) {
                    var template = data.templates[i];
                    var imageUrl = mTemplatePath + template.name + "/" + config.thumbFile;
                    templateDescs[template.name] = template.desc;
                    rondellContent += '<a href="#" data-tplname="' + template.name + '"><img src="' + imageUrl + '" /></a>';
                }
                $("#rondellThumbnails").html(rondellContent).rondell({
                    preset: "thumbGallery"
                });

                // default selection is the first item, fill "desc" on page, and save local variable.
                mSelectedTemplateName = data.templates[0].name;
                $("#spanSelectedTemplateDesc").html(templateDescs[mSelectedTemplateName]);

                // change template event
                $("#rondellThumbnails a").click(function () {
                    mSelectedTemplateName = $(this).data("tplname");
                    $("#spanSelectedTemplateDesc").html(templateDescs[mSelectedTemplateName]);
                });
            }

        });
    }

    function loadWxAccountId() {
        // get wxAccountId from session.
        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            debug && console.log(">> session:", resp);
            mWxAccountId = resp.wxAccountId;
            mUserId = resp.userId;
            mModulePrivileges = resp.modules;
        });
    }

    function previewTemplate(previewData) {
        debug && console.log("previewTemplate(). preview data:", previewData);

        if (mTemplateHtml) {
            $mTemplatePreviewContainer.html(mTemplateHtml);
        } else {
            error && console.error(">> Invalid value of mTemplateHtml:", mTemplateHtml);
        }

        // style in theme data is the part of default value of user data.
        if (previewData) {
            var templateData = tplLoader.mergeThemeData2UserData(mThemeData, previewData);
        } else {
            var templateData = tplLoader.mergeThemeData2UserData(mThemeData, mUserData);
        }
        tplLoader.preview(mThemeData, templateData);

        initPreviewContentDraggable();
        initTemplateLinkClickHandler($mTemplatePreviewContainer);
    }

    function initPreviewContentDraggable() {
        var containerHeight = $mTemplatePreviewContainer.height();
        var contentHeight = $(mTemplateContentSelector).height();
        var containerExceedContentHeight = containerHeight - contentHeight;
        var speed = {
            "duration": 300
        };
        $(mTemplateContentSelector).draggable({
            axis: "y",
            stop: function (event, ui) {
                if (ui.position.top > 0) {
                    // drag downside, content should alignment to top.
                    $(mTemplateContentSelector).animate({
                        "top": 0
                    }, speed);
                } else {
                    // drag upside...
                    if (containerExceedContentHeight > 0) {
                        // container height is great than content, content should alignment to top.
                        $(mTemplateContentSelector).animate({
                            "top": 0
                        }, speed);
                    } else {
                        // container height less than content...
                        if (ui.position.top > containerExceedContentHeight) {
                            // drag up, content bottom still exceed container bottom, nothing to do.
                        } else {
                            // drag up, content bottom is higher than container bottom, should alignment to bottom.
                            $(mTemplateContentSelector).animate({
                                "top": containerExceedContentHeight
                            }, speed);
                        }
                    }
                }
            }
        });

    }

    /**
     *toFieldSetId() and fromFieldSetId are pair of functions to compose and parse fieldSetId.
     */
    function toFieldSetId(stepName, index) {
        return "fieldSet_" + stepName + "_" + index;
        // return "fieldSet_" + stepName + "_" + type + "_" + index;
    }

    function fromFieldSetId(fieldSetId) {
        var tmpArr = fieldSetId.split("_");
        if (tmpArr.length != 3) {
            throw "Invalid fieldSetId: " + fieldSetId;
        }
        if (isNaN(tmpArr[2])) {
            throw "Invalid fieldSetId, index is not number: " + fieldSetId;
        }
        return {
            "stepName": tmpArr[1],
            // "type" : tmpArr[2],
            "index": Number(tmpArr[2])
        };
    }

    return {
        "init": init
    };

});
