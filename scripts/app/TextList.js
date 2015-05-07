define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/UIHelper", "app/common/AjaxHelper", "app/common/EmoteHelper", "app/common/StringUtil", "app/common/CacheHelper", "ace", "bootbox", "app/common/UMEditorDeps"], function (mrh, msh, uiHelper, ajaxHelper, emoteHelper, stringUtil, cacheHelper) {
    require(["app/Header", "app/Menu", "bootstrap"]);

    var mDataCache = [];
    var action = "add";
    var textLimit = 600;
    var id, mEditor;

    function init() {
        bootbox.setDefaults({
            "locale": "zh_CN"
        });
        loadData();
        initUIEventHandler();
        initEditor();
    }

    function loadData() {
        mrh.showMaterialList("#listContainer", msh.MaterialType.TEXT, undefined, listCallback);
    }

    function listCallback(resp) {
        debug && console.log("listCallback parameters:", resp);
        bindEventHandler();
        if (resp && resp.data && resp.data.entity) {
            mDataCache = resp.data.entity;
        }
    }

    function initEditor() {
        mEditor = UM.getEditor('editorSingle', {
            "UMEDITOR_HOME_URL": "./umeditor/",
            toolbar: ['emotion'],
            pasteplain: true
        });
        mEditor.addListener('keyup', function () {
            CheckStringLength();
        });
        mEditor.addListener('click', function () {
            CheckStringLength();
        });

        UM.registerWidget.weixin = true;
    }

    function submitData() {
        var inputContent = theHtmlConversionToText();
        if (!inputContent || inputContent == "") {
            $("#tipserror").html("请输入文本");
        } else if (inputContent.length > textLimit) {
            $("#tipserror").html("不能超过600个字");
            $("#tipserror").attr("style", "color:red");
        } else {
            if (action == "update") {
                updateText(inputContent, id);
            } else {
                addNewText(inputContent);
            }
        }
    }

    function theHtmlConversionToText() {
        var content = mEditor.getContent();
        var cont = emoteHelper.htmlToText(content);
        $("input[name=content]").val($(cont).html());
        var inputContent = $("input[name=content]").val();
        return inputContent;
    }

    function addNewText(data) {
        var url = "php/ajax.php?method=post&url=/material/text";
        $.post(url, {
            "content": data
        }, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                var entity = resp.data["entity"];
                entity["content"] = emoteHelper.textToHtml(stringUtil.escapeHTML(entity["content"]));
                mDataCache.unshift(entity);
                mrh.showMaterialList("#listContainer", msh.MaterialType.TEXT, mDataCache, listCallback);
                hideDialog();
            }
        });
    }

    function updateText(data, id) {
        var url = "php/ajax.php?method=PUT&url=/material/text/" + id;
        $.post(url, {
            "content": data
        }, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                var entity = resp.data["entity"];
                entity["content"] = emoteHelper.textToHtml(stringUtil.escapeHTML(entity["content"]));
                for (var i = 0; i < mDataCache.length; i++) {
                    if (mDataCache[i].id == entity.id) {
                        mDataCache[i] = entity;
                        break;
                    }
                }
                mrh.showMaterialList("#listContainer", msh.MaterialType.TEXT, mDataCache, listCallback);
                hideDialog();
            }
        });
    }

    function bindEventHandler() {
        $("[name='aEditText']").click(editText);
        $("[name='aDeleteText']").click(deleteText);
    }

    function CheckStringLength() {
        var content = mEditor.getContent();
        content = emoteHelper.htmlToText(content);
        var html = $(content).html();
        if (typeof html != "undefined") {
            if (html.length <= textLimit) {
                $("#tipserror").removeAttr("style");
                $("#tipserror").html('还可以输入<em id=\"word_number\">' + parseInt(textLimit - html.length) + '</em>个字');
            } else {
                $("#tipserror").html("不能超过600个字");
                $("#tipserror").attr("style", "color:red");
            }
        }
    }

    function deleteText() {
        id = $(this).closest("li").attr("id");
        var textHtml = $(this);
        bootbox.confirm("确定删除吗?", function (result) {
            if (result) {
                var url = "php/ajax.php?method=DELETE&url=/material/text/" + id;
                $.get(url, function (resp) {
                    ajaxHelper.ajaxResponseErrorHandler(resp);
                    if (resp.success == true) {
                        $(textHtml).closest("li").remove();
                        for (var i = 0; i < mDataCache.length; i++) {
                            if (mDataCache[i].id == id) {
                                mDataCache.splice(i, 1);
                            }
                        }
                    }
                });
            }
        });
    }

    function editText() {
        id = $(this).closest("li").attr("id");
        action = "update";
        var content = $(this).parent().parent().find("p").html();
        mEditor.setContent(content);
        showDialog();
    }

    function searchInfo() {
        var searchValue = $("#searchValue").val();
        var url = "php/ajax.php?method=get&url=/search/material/text?q=" + encodeURI(searchValue);
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                mDataCache = [];
                for (var i = 0; i < resp.data.count; i++) {
                    resp.data.entity[i].content = emoteHelper.textToHtml(stringUtil.escapeHTML(resp.data.entity[i].content));
                    mDataCache[i] = resp.data.entity[i];
                }
                mrh.showMaterialList("#listContainer", msh.MaterialType.TEXT, mDataCache, listCallback);
            }
        });
    }

    function closeDialog() {
        $("#modalAdd").modal('hide');
    }

    function showDialog() {
        $("#modalAdd").modal({
            backdrop: "static"
        });
        $("#modalAdd").modal('show');
    }

    function hideDialog() {
        $("#modalAdd").modal('hide');
    }

    function initUIEventHandler() {
        $('#addText').click(function () {
            action = "add";
            showDialog();
        });
        $('#modalAdd').on('hidden.bs.modal', onDialogHidden);
        $("#btnSubmit").click(submitData);
        /**
         * search function
         */
        $("#search").click(searchInfo);
        $("#searchValue").focus(function () {
            /*回车搜索*/
            document.onkeydown = function (event) {
                var e = event ? event : (window.event ? window.event : null);
                if (e.keyCode == 13) {
                    searchInfo();
                }
            };
        });
    }

    function onDialogHidden(e) {
        mEditor.execCommand('cleardoc');
        $("#word_number").html(textLimit);
        $("#tipserror").html("");
    }

    return {
        "init": init
    };
});
