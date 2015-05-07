define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/DateUtil", "app/common/AceFileHelper", "app/common/FormHelper", "app/common/StringUtil", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/UMEditorDeps", "bootbox", "app/Header", "app/Menu"], function (mrh, msh, dateUtil, aceFileHelper, formHelper, stringUtil, ajaxHelper, uiHelper) {
    require(["jquery.gritter", "bootstrap"]);

    var mWxAccountId;
    var mCacheData;

    function init() {
        bootbox.setDefaults({
            "locale": "zh_CN"
        });
        initTemplateFormatter();
        initFormSingle();
        initFormValidationSingle();

        mrh.showMaterialList("#listContainer", msh.MaterialType.SIT, undefined, listCallback);
        mrh.initUserTags(msh.MaterialType.SIT, function (resp) {
            if (resp && resp.data && resp.data.entity) {
                mCacheData = resp.data.entity;
            }
            // This callback will be invoked when user select tag from the tag list nearby search box.
            mrh.showMaterialList("#listContainer", msh.MaterialType.SIT, resp.data.entity, listCallback);
        });
        initUIEventHandler();
        loadWxAccountId();
    }

    // Add formatter for jQuery template.
    function initTemplateFormatter() {
        $.addTemplateFormatter({
            // return "function('param');" for onclick handler.
            clickHandlerFormatter: function (value, paramName) {
                return paramName + "('" + value + "');";
            },
            htmlEncodeFormatter: function (value) {
                return stringUtil.escapeHTML(value);
            },
            dateTimeFormatter: function (value) {
                return dateUtil.ts2LocalDate(value);
            }
        });
    }

    // === form ===
    var _sEditor;
    // editing in form, flag to check unsaved data.
    var _isEditingSingle;

    function initFormSingle() {
        // for content editor.
        _sEditor = UM.getEditor('editorSingle', {
            "UMEDITOR_HOME_URL": "./umeditor/",
            "imageUrl": "php/fileUpload.php",
            "imageFieldName": "fileUploader",
            "initialFrameWidth": "100%",
            "initialFrameHeight": 200
        });
        // for file uploader.
        aceFileHelper.initUploadHandler($("#fileSingle"), {
            "urlHolderSelector": "#coverUrlSingle",
            "formSelector": "#formSingle",
            "fileType": "image",
            "sizeLimit": 2097152, // ~2M
            "isChangeUpload": false,
            "style": "well"

        });
        $("#btnSingleSubmit").click(saveSingleMaterial);
        $("#formSingle [name='coverUrl']").change(fileUploadHanlder);
    }

    function initFormValidationSingle() {
        $.validator.addMethod("fileUploadCompleteSingle", function (value, element, params) {
            return $("#coverUrlSingle").val() != "" || $("#fileSingle").val() != "";
        });

        $.validator.addMethod("check", function () {
            return false;
        });

        formHelper.initFormValidator("#formSingle", {
            // match to 'name' attribute.
            title: {
                required: true,
                maxlength: 64
            },
            author: {
                maxlength: 10
            },
            fileUploader: "fileUploadCompleteSingle",
            summary: {
                required: true,
                maxlength: 120
            },
            externalUrl: {
                required: false,
                url: true
            },
            content: "check"
        }, {
            title: {
                required: "请输入标题",
                maxlength: "不能超过64个字"
            },
            author: {
                maxlength: "不能超过10个字"
            },
            fileUploader: "请上传一张图片",
            summary: {
                required: "请输入摘要",
                maxlength: "不能超过120个字"
            },
            externalUrl: {
                url: "链接地址以http://开头"
            },
            content: "is error"
        });
    }

    /**
     * For file upload validation, when the hidden input value changed, we need validate programmly.
     */
    function fileUploadHanlder(eventData) {
        var sourceName = $(eventData.target).attr("name");
        if (sourceName == "coverUrl") {
            var validator = $(eventData.target).closest("form").validate();
            validator.element("[name='fileUploader']");
        }
    }

    function clearFormSingle() {
        $("#formSingle")[0].reset();
        _sEditor.setContent("");
        $("#fileSingle").data("ace_file_input").reset_input();
        formHelper.clearValidateMessages("#formSingle");
    }

    function validUmEditor() {
        var ret = true;
        if (_sEditor.getContentTxt().length > 20000) {
            var message = "不能超过20000个字符";
            formHelper.displayValidateMessage("#editorSingle", message);
            ret = false;
        } else {
            formHelper.clearValidateMessages("#editorSingle");
        }
        return ret;
    }

    function saveSingleMaterial() {
        debug && console.log("saveSingleMaterial().");

        var formValid = $('#formSingle').valid();

        var editorValid = validUmEditor();
        if (!formValid || !editorValid)
            return false;

        uiHelper.isBtnClickable("#btnSingleSubmit", false);
        if ($("#fileSingle").val() != "") {
            aceFileHelper.uploadFile($(":file"), "#coverUrlSingle", saveSingleImageData);
        } else {
            saveSingleImageData();
        }

    }

    function saveSingleImageData() {
        var data = $('#formSingle').serialize();
        var existId = $("#formSingle").find("[name='id']").val();
        if (existId) {
            var url = "php/ajax.php?method=put&url=/material/sit/" + existId;
        } else {
            var url = "php/ajax.php?method=post&url=/material/sit";
        }

        $.post(url, data, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                // update local cache, refresh list.
                if (existId) {
                    for (var i = 0; i < mCacheData.length; i++) {
                        if (mCacheData[i].id == existId) {
                            mCacheData[i] = resp.data.entity;
                        }
                    }
                } else {
                    mCacheData.unshift(resp.data.entity);
                }
                mrh.showMaterialList("#listContainer", msh.MaterialType.SIT, mCacheData, listCallback);

                clearFormSingle();
                _isEditingSingle = false;
                closeDialog();
                uiHelper.hideInfoAlert();
            }
        });
        uiHelper.isBtnClickable("#btnSingleSubmit", true);
    }

    function listCallback(resp) {
        debug && console.log("listCallback parameter:", resp);
        uiHelper.hideInfoAlert();
        if (resp && resp.data && resp.data.entity) {
            mCacheData = resp.data.entity;
            if (resp.data.count == 0) {
                uiHelper.showInfoAlert('没有素材。');
            }
        }
        for (var i = 0; i < mCacheData.length; i++) {
            mrh.initTagInput(msh.MaterialType.SIT, mCacheData[i].id);
        }
        // bind click event handler for all items in list.
        $("[name='aEditSingle']").click(editSingleMaterial);
        $("[name='aDeleteSingle']").click(deleteSingleMaterial);
        $("[name='aViewSingle']").click(viewSingleMaterial);
    }

    function viewSingleMaterial(ev) {
        ev.preventDefault();
        var id = $(this).closest("li").attr("id");
        var contentPage = "mobiwebsite/Content.html?site=" + mWxAccountId + "&id=" + id;
        $("#showArticle").attr("src", contentPage);
        $("#article").modal("show");
        //window.open(contentPage, "_blank");
    }

    function loadWxAccountId() {
        // get wxAccountId from session.
        var url = "php/ajax.php?method=get&url=sessioninfo";
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            debug && console.log(">> session:", resp);
            mWxAccountId = resp.wxAccountId;
        });
    }

    function deleteSingleMaterial(ev) {
        ev.preventDefault();
        var id = $(this).closest("li").attr("id");
        var imgSrc = $("#" + id).find("img").attr("src");
        bootbox.confirm("确定删除？", function (result) {
            if (result) {
                var url = "php/ajax.php?method=delete&url=/material/sit/" + id;
                $.get(url, function (respData) {
                    ajaxHelper.ajaxResponseErrorHandler(respData);
                    if (respData.success) {
                        aceFileHelper.deleteBcsObject(imgSrc);
                        for (var i = 0; i < mCacheData.length; i++) {
                            if (mCacheData[i].id == id) {
                                mCacheData.splice(i, 1);
                            }
                        }
                        mrh.showMaterialList("#listContainer", msh.MaterialType.SIT, mCacheData, listCallback);
                    }
                });
            }
        });
    }

    function editSingleMaterial(ev) {
        ev.preventDefault();
        var id = $(this).closest("li").attr("id");
        if (_isEditingSingle) {
            bootbox.confirm("放弃未保存的数据？", function (result) {
                if (result) {
                    clearFormSingle();
                    editSingleMaterialInAction(id);
                }
            });
        } else {
            editSingleMaterialInAction(id);
            _isEditingSingle = true;
        }
    }

    function editSingleMaterialInAction(id) {
        var url = "php/ajax.php?method=get&url=/material/sit/" + id;
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success === true) {
                // var form = $("#formSingle");
                var entity = resp.data.entity;
                $("#formSingle input").each(function (index, element) {
                    var $element = $(element);
                    var key = $element.attr("name");
                    $element.val(entity[key]);
                });
                $("#formSingle [name='summary']").val(entity.summary);
                if (entity.content)
                    _sEditor.setContent(entity.content);

                // show image on ace file uploader
                aceFileHelper.setAceFileUploaderPreview("#formSingle", entity.coverUrl);

                showDialog();
            }
        });
    }

    function searchInfo() {
        var searchValue = $("#searchValue").val();
        var url = "php/ajax.php?method=get&url=/search/material/sit?q=" + encodeURI(searchValue);
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                mCacheData = resp.data.entity;
                mrh.showMaterialList("#listContainer", msh.MaterialType.SIT, resp.data.entity, listCallback);
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

    function initUIEventHandler() {
        $('#modalAdd').on('hidden.bs.modal', onDialogHidden);
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
        _isEditingSingle = false;
        clearFormSingle();
    }

    return {
        "init": init
    };
});
