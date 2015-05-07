define(["app/common/MiscUtil", "app/common/AceFileHelper", "app/common/FormHelper", "app/common/UIHelper", "app/common/AjaxHelper", "app/Header", "app/Menu", "ace"], function (miscUtil, aceFileHelper, formHelper, uiHelper, ajaxHelper) {
    require(["app/Header", "app/Menu", "jquery.gritter", "bootstrap", "bootbox"]);

    var sendDataUrl = "php/ajax.php?method=post&url=/mws/entry";
    var keyWordId, wxAccountId;
    var keyWordChange = false;
    var gAllExistKeywords = []; // cache all keywords, include set up in keyword reply page, use to check reduplication.


    function init() {
        getWxAccountId();
        aceFileHelper.initUploadHandler($(":file"), {
            "urlHolderSelector": "#entry_imageUrl",
            "sizeLimit": 2097152, // ~2M
            "isChangeUpload": true,
            "style": "well"
        });
        FormValidator();
        getEntity();
        getKeywordList();
        $("#btnSubmit").click(saveEventMwsEntry);
        $("#keyword").change(function () {
            keyWordChange = true;
        });

        // Add timestamp to file name, avoid cache issue.
        $("[name='targetFileName']").val($("[name='targetFileName']").val() + "." + new Date().getTime());
    }

    function saveEventMwsEntry() {
        if (!$("#MwxEntryForm").valid()) {
            return false;
        }
        saveData();
    }

    function generateMwsEntryUrl() {
        var pageName = miscUtil.getLocationPage() + ".html";
        var location = window.location;
        var mwsUrl = location.href.replace(pageName, mwsIndexUrl).replace(/{wxAccountId}/, wxAccountId);
        $("#mwsSiteUrl").text(mwsUrl);
    }

    //get title some data
    function getEntity() {
        var url = "php/ajax.php?method=get&url=/mws/entry";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.data.entity == null) {
                return false;
            } else {
                aceFileHelper.setAceFileUploaderPreview("#MwxEntryForm", resp.data.entity["coverUrl"]);
                $("#entry_enabled").prop("checked", resp.data.entity["enable"]);
                setFromValue([resp.data.entity["title"], resp.data.entity["keyword"], resp.data.entity["coverUrl"], resp.data.entity["summary"]]);
                sendDataUrl = "php/ajax.php?method=put&url=/mws/entry";
            }
        });
    }

    function getKeywordList() {
        var url = 'php/ajax.php?method=get&url=/reply/keyword/list';
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            //  judgment   keywordGroup  ==module_mws
            for (var i = 0; i < resp.data.count; i++) {
                var kwEntity = resp.data.entity[i];
                if (kwEntity.keywordGroup == "module_mws") {
                    keyWordId = kwEntity.id;
                } else {
                    gAllExistKeywords.push(kwEntity.keyword);
                }
            }
            debug && console.log("All keywords existed:", gAllExistKeywords);
        });
    }

    // save keyword
    function savekeyword(wxAccountId) {
        var url;
        var keyword = $("#keyword").val();
        var data = {
            "keyword": keyword,
            "keywordGroup": "module_mws", /* 暂不支持多关键词，固定值 */
            "refId": wxAccountId, /* 没有特定对象引用，暂用wxAccountId代替 */
            "refType": "module_mws", /*固定值 */
            "wlsWxAccountId": wxAccountId
        };
        // is  keyword isset
        if (keyWordId) {
            if (keyWordChange == true) {
                url = "php/ajax.php?method=PUT&url=/reply/keyword/" + keyWordId;
            } else {
                uiHelper.showGritter("官网入口设置保存成功。");
                return false;
            }
        } else {
            url = "php/ajax.php?method=post&url=/reply/keyword";
        }
        $.post(url, data, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                keyWordId = resp.data.entity.id;
                keyWordChange = false;
                uiHelper.showGritter("官网入口设置保存成功。");
            } else {
                uiHelper.showGritterError("官网入口设置保存失败。");
            }
        });
    }


    function setFromValue(dataArr) {
        var i = 0;
        var nextDom = traversalIterator([ "#entry_title", "#keyword", "#entry_imageUrl", "#entry_desc"]);
        for (; i < dataArr.length; i++) {
            $(nextDom()).val(dataArr[i]);
        }
    }

    function traversalIterator(traversalArray) {
        var i = 0;
        return function () {
            return traversalArray[i++];
        }
    }

    function deleteKeyword() {
        //DELETE keyword
        if (keyWordId) {
            var url = "php/ajax.php?method=delete&url=/reply/keyword/" + keyWordId;
            $.post(url, function (resp) {
                if (resp.success === true) {
                    keyWordId = "";
                    uiHelper.showGritter("官网入口设置保存成功。");
                } else {
                    uiHelper.showGritterError("官网入口设置保存失败。");
                }
            });
        } else {
            uiHelper.showGritter("官网入口设置保存成功。");
        }
    }


    function getWxAccountId() {
        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            debug && console.log(">> session:", resp);
            // convert user changed data to db data format.
            wxAccountId = resp.wxAccountId;
            generateMwsEntryUrl();
        });
    }

    function saveData() {
        var data = {
            "wlsWxAccountId": wxAccountId,
            "keyword": $("#keyword").val(),
            "enable": $("#entry_enabled").prop("checked"),
            "title": $("#entry_title").val(),
            "coverUrl": $("#entry_imageUrl").val(),
            "summary": $("#entry_desc").val()
        };
        // check keyword existence
        for (var i = 0; i < gAllExistKeywords.length; i++) {
            if (gAllExistKeywords[i] == data.keyword) {
                uiHelper.showGritterError('关键词重复，请使用其它关键词。（请打开“关键词回复”页面查看所有已使用的关键词）');
                return;
            }
        }
        // save to service.
        $.post(sendDataUrl, data, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                if ($("#entry_enabled").prop("checked") == true) {
                    savekeyword(wxAccountId);
                } else {
                    deleteKeyword();
                }
                //提交成功之后在修改表单值应该就是更新了
                sendDataUrl = "php/ajax.php?method=put&url=/mws/entry";
            } else {
                uiHelper.showGritterError("官网入口设置保存失败。");
            }
        })
    }

    function FormValidator() {
        $.validator.addMethod("fileUploadComplete", function (value, element, params) {
            return $("#entry_imageUrl").val() != "" || $("#fileUploader").val() != "";
        });

        formHelper.initFormValidator("#MwxEntryForm", {
            fileUploader: "fileUploadComplete",
            keyword: {
                required: true
            },
            entry_title: {
                required: true
            },
            entry_desc: {
                required: true,
                maxlength: 64
            }

        }, {
            fileUploader: "请上传一张图片",
            keyword: {
                required: "请输入关键字"
            },
            entry_title: {
                required: "请输入标题"
            },
            entry_desc: {
                required: "请输入摘要",
                maxlength: "不能超过64个字"
            }
        });
    }

    return {
        "init": init
    }

});
