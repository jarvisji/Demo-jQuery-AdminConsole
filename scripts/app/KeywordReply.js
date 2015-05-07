define(["ace", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/FormHelper", "app/common/MaterialRepositoryHelper", "app/common/DateUtil", "bootbox", "app/Header", "app/Menu"], function (ace, ajaxHelper, uiHelper, formHelper, mrh, dateUtil) {

    /**
     *keywords = {
	 *	 group : {
	 *		"keywords" : [],
	 *		"entity" : {},
	 * 		"id": string,
	 * 		"type": string
	 *	 }
	 *}
     */
    var mKeywords = {};
    var mTempKeyword = {};

    var mEditingKeywordGroup;
    var mMaxKeywords = 10;
    var mPreviewHtmlBeforeEdit;

    function init() {
        bootbox.setDefaults({
            "locale": "zh_CN"
        });
        initTemplateFormatter();
        loadReplyData();
        $("#btnNewReply").click(addNewReply);
    }

    function initButtonHandler() {
        $("#btnSelectMaterial").click(function () {
            mrh.showMaterialDialog([
                {
                    "type": "text",
                    "name": "文本"
                },
                {
                    "type": "sit",
                    "name": "图文"
                },
                {
                    "type": "mit",
                    "name": "多图文"
                }
            ], previewReplyItem);
        });
        $("#btnSave").click(saveKeywordReply);
        $("#btnCancel").click(cancelHandler);
    }

    // Add formatters for jQuery template.
    function initTemplateFormatter() {
        $.addTemplateFormatter({
            dateTimeFormatter: function (value) {
                return dateUtil.ts2LocalDate(value);
            }
        });
    }

    function cancelHandler() {
        closeEditForm();
    }

    function addNewReply() {
        if (mEditingKeywordGroup != undefined) {
            bootbox.alert("请先保存正在编辑的内容。");
            return;
        }
        var formHtml = $("#keywordEditTemplate").html();
        $("#keywordGroupListContainer").prepend($(formHtml));
        initKeywordInput();
        initButtonHandler();
    }

    /**
     * Use tag input component to handle keywords input.
     */
    function initKeywordInput(kwGroupName) {
        if (!kwGroupName) {
            kwGroupName = new Date().getTime();
            mEditingKeywordGroup = kwGroupName;
        }

        // create new temp data, or copy value from mKeywords.
        if (!mKeywords[kwGroupName]) {
            mTempKeyword[kwGroupName] = {
                "keywords": [],
                "entity": {}
            };
        } else {
            mTempKeyword[kwGroupName] = $.extend(true, {}, mKeywords[kwGroupName]);
        }

        if (!mTempKeyword[kwGroupName].keywords) {
            mTempKeyword[kwGroupName].keywords = [];
        }

        uiHelper.showTagsInput(/*parent*/null, mTempKeyword[kwGroupName].keywords, /*allTags*/[], function (keyword, tagClass) {
            addKeyword(kwGroupName, keyword, tagClass);
        }, function (keyword) {
            removeKeyword(kwGroupName, keyword);
        });
        $(".tags :text").attr("maxlength", 30);
        if (mTempKeyword[kwGroupName].keywords.length == mMaxKeywords) {
            $(".tags :text").addClass("hidden");
        }
    }

    // Only add to mTempKeyword, if user click "save", the changes will be copy to mKeywords.
    function addKeyword(kwGroupName, keyword, tagClass) {
        if (isKeywordExist(keyword)) {
            debug && console.log("keyword already exist.");
            tagClass.remove(mTempKeyword[kwGroupName].keywords.length);
            uiHelper.showGritterError("不能重复设置关键词：" + keyword);
        } else {
            var keywords = mTempKeyword[kwGroupName].keywords;
            keywords.push(keyword);
            // 10 keywords at most.
            if (keywords.length == mMaxKeywords) {
                $(".tags :text").addClass("hidden");
            }
        }
    }

    // Only remove from mTempKeyword, if user click "save", the changes will be copy to mKeywords.
    function removeKeyword(kwGroupName, keyword) {
        var keywords = mTempKeyword[kwGroupName].keywords;
        for (var i = 0; i < keywords.length; i++) {
            if (keywords[i] == keyword) {
                keywords.splice(i, 1);
                break;
            }
        }
        var $hiddenInput = $(".tags :input.hidden");
        if ($hiddenInput.length > 0) {
            $hiddenInput.removeClass("hidden");
        }
    }

    function isKeywordExist(newKeyword) {
        for (var key in mKeywords) {
            var keywords = mKeywords[key].keywords;
            for (var j = 0; j < keywords.length; j++) {
                if (keywords[j] == newKeyword) {
                    return true;
                }
            }
        }
        return false;
    }

    function loadReplyData() {
        var url = "php/ajax.php?method=get&url=/reply/keyword/list";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                if (resp.data.count > 0) {
                    convertResp2CacheData(resp);

                    // aggregate data to show list.
                    var widgetListData = [];
                    for (var groupName in mKeywords) {
                        widgetListData.push({
                            "keyword": mKeywords[groupName].keywords.join(", "),
                            "keywordGroup": groupName
                        });
                    }
                    $("#keywordGroupListContainer").loadTemplate($("#keywordListTemplate"), widgetListData);
                } else if (resp.data.count == 0) {
                    uiHelper.showInfoAlert("没有关键词回复，点击右上角按钮创建.");
                }
                ace.widget_boxes($);
                initWidgetBoxActionHandler();

            }
        });
    }

    /**
     *Temporary solution to disable mobilewebsite edit.
     */
    function disableEditForModuleGroup() {
        $("#module_mws").find(".action-buttons").detach();
        $("#module_shop").find(".action-buttons").detach();
        $("#module_album").find(".action-buttons").detach();
    }

    function initWidgetBoxActionHandler(groupName) {
        if (groupName) {
            $("#" + groupName + " [data-action]").on("click", widgetActionHandler);
        } else {
            $(".widget-box [data-action]").on("click", widgetActionHandler);
        }
        disableEditForModuleGroup();
    }

    function widgetActionHandler(e) {
        e.preventDefault();
        var action = $(this).data("action");
        var groupName = $(this).closest(".widget-box").attr("id");
        var type = mKeywords[groupName].refType.split("_")[1];
        var id = mKeywords[groupName].refId;
        debug && console.log(action, groupName, type, id);
        if (action == "collapse") {
            var containerSelector = "#" + groupName + " [name='previewContainer']";
            if ($(containerSelector).html() == "") {
                if (groupName == "module_mws") {
                    $(containerSelector).html("官网入口暂不支持预览。请到“移动官网”-“入口消息设置”查看或修改。");
                } else if (groupName == "module_shop") {
                    $(containerSelector).html("商城入口暂不支持预览。请到“在线商城”-“入口消息设置”查看或修改。");
                } else if (groupName == "module_album") {
                    $(containerSelector).html("相册入口暂不支持预览。请到“相册”-“入口消息设置”查看或修改。");
                } else {
                    mrh.showMaterialPreview(containerSelector, type, id);
                }
            }
        } else if (action == "edit") {
            if (mEditingKeywordGroup != undefined) {
                bootbox.alert("请先保存正在编辑的内容。");
                return;
            }
            mEditingKeywordGroup = groupName;
            var containerSelector = "#" + groupName + " [name='previewContainer']";
            mPreviewHtmlBeforeEdit = $(containerSelector).html();
            $("#" + groupName).replaceWith($("#keywordEditTemplate").html());
            $("#materialPreview").html(mPreviewHtmlBeforeEdit);
            initKeywordInput(groupName);
            initButtonHandler();
        } else if (action == "delete") {
            bootbox.confirm("确定删除关键词 <b>" + mKeywords[groupName].keywords.join(", ") + "</b> ?", function (confirm) {
                if (confirm) {
                    var url = "php/ajax.php?method=delete&url=/reply/keyword/group/" + groupName;
                    $.get(url, function (resp) {
                        ajaxHelper.ajaxResponseErrorHandler(resp);
                        if (resp.success === true) {
                            $("#" + groupName).detach();
                            uiHelper.showGritter("删除成功");

                            var body = $("#keywordGroupListContainer").html();
                            if (body == "") {
                                uiHelper.showInfoAlert("没有关键词回复，点击右上角按钮创建.");
                            }
                        }
                    });
                }
            });
        }
    }

    function convertResp2CacheData(resp) {
        for (var i = 0; i < resp.data.entity.length; i++) {
            var entity = resp.data.entity[i];
            var kwGroup = entity.keywordGroup;
            if (!mKeywords[kwGroup]) {
                mKeywords[kwGroup] = {
                    "keywords": [],
                    "entity": {}
                };
            }
            mKeywords[kwGroup].keywords.push(entity.keyword);
            mKeywords[kwGroup].entity = entity;
            mKeywords[kwGroup].refId = entity.refId;
            mKeywords[kwGroup].refType = entity.refType;
        }
        debug && console.log("Cache keywords: ", mKeywords);
    }

    function previewReplyItem(itemType, itemId, $itemDom) {
        debug && console.log("previewReplyItem(), ", itemType, itemId, $itemDom);
        $itemDom.find(".text").detach();
        $(".well #materialPreview").html("")
        $(".well #materialPreview").append($itemDom);
        formHelper.clearValidateMessages("#materialPreview");
        // cache selection temporary before user save it.
        mTempKeyword[mEditingKeywordGroup].refId = itemId;
        mTempKeyword[mEditingKeywordGroup].refType = "material_" + itemType;
    }

    function validateInput() {
        var ret = true;
        if (mTempKeyword[mEditingKeywordGroup].keywords.length == 0) {
            formHelper.displayValidateMessage("#keywords", "请输入关键词");
            ret = false;
        } else {
            formHelper.clearValidateMessages("#keywords");
        }
        if ($("#materialPreview").html() == "") {
            formHelper.displayValidateMessage("#materialPreview", "请选择素材");
            ret = false;
        } else {
            formHelper.clearValidateMessages("#materialPreview");
        }
        return ret;
    }

    function saveKeywordReply(ev) {
        ev.preventDefault();
        debug && console.log("saveKeywordReply()");
        debug && console.log(">> all keywords:", mKeywords);
        debug && console.log(">> temporary keyword:", mTempKeyword);
        debug && console.log(">> saving: ", mEditingKeywordGroup, mTempKeyword);
        if (!validateInput()) {
            debug && console.log(">> validate failed.");
            return;
        }

        if (!mTempKeyword[mEditingKeywordGroup].refId || !mTempKeyword[mEditingKeywordGroup].refType) {
            throw "Invalid id or type: " + mTempKeyword[mEditingKeywordGroup].refId + "," + mTempKeyword[mEditingKeywordGroup].refType;
        }

        var data = [];
        for (var i = 0; i < mTempKeyword[mEditingKeywordGroup].keywords.length; i++) {
            data[i] = {
                refId: mTempKeyword[mEditingKeywordGroup].refId,
                refType: mTempKeyword[mEditingKeywordGroup].refType,
                keyword: mTempKeyword[mEditingKeywordGroup].keywords[i],
                keywordGroup: mEditingKeywordGroup
            };
        }
        debug && console.debug(">> updating keyword reply data: ", data);

        var url = "php/ajax.php?method=post&url=/reply/keywords";
        $.post(url, {
            jsondata: data
        }, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                mKeywords[mEditingKeywordGroup] = $.extend(true, {}, mTempKeyword[mEditingKeywordGroup]);
                debug && console.log(">> save successfully. merged data to mKeywords:", mKeywords);
                closeEditForm(/*isSave*/true);
                uiHelper.showGritter("设置成功");
                uiHelper.hideInfoAlert();
            }
        });
    }

    function closeEditForm(/*boolean*/isSave) {
        if (mKeywords[mEditingKeywordGroup] == undefined) {
            // no data to show in list, its case of cancel create new reply.
            $("form").detach();
        } else {
            // cache data already updated when preview, needn't update here.
            var widgetListData = {
                "keyword": mKeywords[mEditingKeywordGroup].keywords.join(", "),
                "keywordGroup": mEditingKeywordGroup
            };
            $("form").wrap("<div id='wrap'></div>");
            $("#wrap").loadTemplate($("#keywordListTemplate"), widgetListData);
            $("#" + mEditingKeywordGroup).unwrap();
            initWidgetBoxActionHandler(mEditingKeywordGroup);

            if (isSave === true) {
                var containerSelector = $("#" + mEditingKeywordGroup + " [name='previewContainer']");
                var id = mTempKeyword[mEditingKeywordGroup].refId;
                var type = mTempKeyword[mEditingKeywordGroup].refType.split("_")[1];
                mrh.showMaterialPreview(containerSelector, type, id);
            } else {
                $("#" + mEditingKeywordGroup + " [name='previewContainer']").html(mPreviewHtmlBeforeEdit);
            }
        }

        mEditingKeywordGroup = undefined;
        mTempKeyword = {};
    }

    return {
        "init": init
    };
});
