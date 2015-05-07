define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/AceFileHelper", "app/common/FormHelper", "app/common/StringUtil", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/UMEditorDeps", "bootbox", "app/Header", "app/Menu"], function (mrh, msh, aceFileHelper, formHelper, stringUtil, ajaxHelper, uiHelper) {
    require(["jquery.gritter", "bootstrap"]);

    // === form ===
    var _mEditor;
    // global variable to store one record of multi-imagetext.
    var mCurrentEditingMit;
    // global var for id of editing multi-imagetext, each creation/update for item, should take this id.
    var _currentMitId;
    var mCacheData;

    // load single material list form db.
    function init() {
        bootbox.setDefaults({
            "locale": "zh_CN"
        });
        initTemplateFormatter();
        initFormMultiple();
        initFormValidationMultiple();
        loadData();
        initUIEventHandler();
    }

    function loadData() {
        mrh.showMaterialList("#listContainer", msh.MaterialType.MIT, undefined, listCallback);
    }

    function listCallback(resp) {
        debug && console.log("listCallback parameter:", resp);
        if (resp && resp.data && resp.data.entity) {
            mCacheData = resp.data.entity;
        }
        // bind click handler for operation link.
        $("[name='aEditMultipleMaterial']").click(editMultipleMaterial);
        $("[name='aDeleteMultipleMaterial']").click(deleteMultipleMaterial);
    }

    // Add formatters for jQuery template.
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
                return value;
            }
        });
    }

    function initFormMultiple() {
        // for content editor.
        _mEditor = UM.getEditor('editorMultiple', {
            "UMEDITOR_HOME_URL": "./umeditor/",
            "imageUrl": "php/fileUpload.php",
            "imageFieldName": "fileUploader",
            "initialFrameWidth": "100%",
            "initialFrameHeight": 200
        });
        // for file uploader.
        aceFileHelper.initUploadHandler($("#fileMultiple"), {
            "urlHolderSelector": "#coverUrlMultiple",
            "formSelector": "#formMultiple",
            "fileType": "image",
            "sizeLimit": 2097152, // ~2M
            "isChangeUpload": true,
            "style": "well"
        });

        // regiest event handler for user typing or data changed.
        $("#formMultiple [name='title']").keyup(formTypingHandler);
        $("#formMultiple [name='coverUrl']").change(formTypingHandler);
        $("#btnMitSave").click(saveCurrentEditingMit);
    }

    function initFormValidationMultiple() {
        debug && console.debug("initFormValidationMultiple...");
        $.validator.addMethod("fileUploadCompleteMultiple", function (value, element, params) {
            return $("#coverUrlMultiple").val() != "" || $("#fileMultiple").val() != "";
        });
        formHelper.initFormValidator("#formMultiple", {
            // match to 'name' attribute.
            title: {
                required: true,
                maxlength: 64
            },
            author: {
                maxlength: 10
            },
            fileUploader: "fileUploadCompleteMultiple",
            externalUrl: {
                url: true
            }
        }, {
            title: {
                required: "请输入标题",
                maxlength: "不能超过64个字"
            },
            author: {
                maxlength: "不能超过10个字"
            },
            fileUploader: "请上传一张图片",
            externalUrl: {
                url: "链接地址以http://开头"
            }
        });
    }

    // form element should be disable if not editing any item.
    function disableFormMultiple() {
        $("#formMultiple input").prop("disabled", true);
        $("#formMultiple button").prop("disabled", true);
        _mEditor.setDisabled();
    }

    // enable form elements when start editing any item.
    function enableFormMultiple() {
        if ($("#formMultiple input:first").prop("disabled")) {
            $("#formMultiple input").prop("disabled", false);
            $("#formMultiple button").prop("disabled", false);
            _mEditor.setEnabled();
        }
    }

    // === Mit preview ===
    var _defaultItemIdPrefix = "mitItem";
    // init action handler of MultiImageText review.
    function initMitEditorPreview() {
        var bottomTemplate = $("#mitEditorPreviewBottomTemplate").html();
        $("#mitEditorPreviewItemList").html(bottomTemplate);

        var firstItemTemplate = $($("#mitEditorPreviewFirstItemTemplate").html());
        $("#mitEditorPreviewSecondaryItemInsertPlaceHolder").before(firstItemTemplate);

        var secondItemTemplate = $($("#mitEditorPreviewSecondaryItemTemplate").html());
        $("#mitEditorPreviewSecondaryItemInsertPlaceHolder").before(secondItemTemplate);

        bindMitEditorPreviewClickHandler();
    }

    function bindMitEditorPreviewClickHandler() {
        // bind click handler for operation link.
        // $("[name='aEditMitItem']").off("click");
        $("[name='aEditMitItem']").click(editMitPreviewItem);
        // $("[name='aDeleteMitItem']").off("click");
        $("[name='aDeleteMitItem']").click(deleteMitPreviewItem);
        // $("#aAddSecondItem").off("click");
        $("#aAddSecondItem").click(addMitEditorPreviewNewItem);
    }

    // insert new second level item for MultiImageText editor preview window.
    function addMitEditorPreviewNewItem(ev) {
        ev.preventDefault();
        var newItemIndex = $("#mitEditorPreviewItemList").find("li").length - 1;
        if (newItemIndex > 9) {
            bootbox.alert("最多只能添加10条图文。");
        } else {
            // insert new item
            var $itemTemplate = $($("#mitEditorPreviewSecondaryItemTemplate").html());
            $("#mitEditorPreviewSecondaryItemInsertPlaceHolder").before($itemTemplate);
            // bind event handler.
            $itemTemplate.find("[name='aDeleteMitItem']").click(deleteMitPreviewItem);
            $itemTemplate.find("[name='aEditMitItem']").click(editMitPreviewItem);
            // set new item id to timestamp, so we can maintian data by it. The timestamp will not send to backend service.
            var tempId = new Date().getTime() + "";
            $itemTemplate.attr("id", tempId);
            // create new item data in current editing mit.
            mCurrentEditingMit.wlsMaterialImagetexts.push({
                "id": tempId
            });
            editMitPreviewItem(tempId);
            // bindMitEditorPreviewClickHandler();
        }
    }

    // when user click edit button on any item of multiple imagetext preview, should set editing style to let user clear
    // which item is in editing.
    function setPreviewItemEditingStyle(itemId) {
        var selector = "#mitEditorPreviewItemList>li#" + itemId;
        $(selector).addClass("editing");
        // enableFormMultiple();
        $("#formMultiple [name='title']").focus();
    }

    function editMitPreviewItem(/*id or event*/ev) {
        updateCurrentEditingMit();
        clearFormMultiple();
        clearEditing();

        console.log("editMitPreview", ev, typeof ev);
        var $itemToEdit = $(this).closest("li");
        if (typeof ev == "string") {
            _currentMitId = ev;
        } else {
            ev.preventDefault();
            _currentMitId = $itemToEdit.attr("id");
        }
        // clear current editing status.
        fillMitEditorForm(_currentMitId);

        // if is editing an invalid item, need show error message to user.
        if ($itemToEdit.hasClass("invalid")) {
            $('#formMultiple').valid();
            validUmEditor();
            $itemToEdit.removeClass("invalid");
        }
        setPreviewItemEditingStyle(_currentMitId);
    }

    function deleteMitPreviewItem(ev) {
        ev.preventDefault();
        var itemToDelete = $(this).closest("li");
        var itemId = itemToDelete.attr("id");

        if (mCurrentEditingMit.wlsMaterialImagetexts.length < 3) {
            bootbox.alert("至少要有两条图文。");
        } else {
            for (var i = 0; i < mCurrentEditingMit.wlsMaterialImagetexts.length; i++) {
                if (itemId == mCurrentEditingMit.wlsMaterialImagetexts[i].id) {
                    mCurrentEditingMit.wlsMaterialImagetexts.splice(i, 1);
                }
            }
            itemToDelete.detach();
            if (_currentMitId == itemId) {
                _currentMitId = undefined;
                clearFormMultiple();
                clearEditing();
            }
        }
        debug && console.log("deleteMitPreviewItem(), mCurrentEditingMit:", mCurrentEditingMit);
    }

    /**
     * Event handler for user typing, will update preview and data in real time.
     */
    function formTypingHandler(eventData) {
        var sourceName = $(eventData.target).attr("name");
        var sourceValue = $(eventData.target).val();
        var $editingItem = $(".editing");
        if ($editingItem) {
            if (sourceName == "title") {
                $editingItem.find("span").text(sourceValue);
            } else if (sourceName == "coverUrl") {
                $editingItem.find("img").attr("src", sourceValue);
                if (sourceValue) {
                    $editingItem.find("img").removeClass("hidden");
                    $editingItem.find(".mit_item_thumb").addClass("hidden");
                } else {
                    $editingItem.find("img").addClass("hidden");
                    $editingItem.find(".mit_item_thumb").removeClass("hidden");
                }
                // also need update validate status.
                fileUploadHanlder(eventData);
            }
        }
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

    function clearFormMultiple() {
        $("#formMultiple")[0].reset();
        _mEditor.setContent("");
        $("#fileMultiple").ace_file_input('reset_input');
        formHelper.clearValidateMessages("#formMultiple");
        aceFileHelper.clearAceFielUploaderPreview("#formMultiple");
    }

    function clearEditing() {
        _currentMitId = undefined;
        $(".editing").removeClass("editing");
    }

    /**222
     * When user change item to edit, we'll try to load item data from memory to fill form.
     */
    function fillMitEditorForm(editingItemId) {
        debug && console.log("fillMitEditorForm(), id:", editingItemId);
        // var editingItemId = $(".editing").attr("id");
        for (var i = 0; i < mCurrentEditingMit.wlsMaterialImagetexts.length; i++) {
            if (mCurrentEditingMit.wlsMaterialImagetexts[i].id == editingItemId) {
                var data = mCurrentEditingMit.wlsMaterialImagetexts[i];
                break;
            }
        }
        if (data != undefined) {
            debug && console.debug(">> data:", data);
            $("#formMultiple input").each(function (index, element) {
                var key = $(element).attr("name");
                $(element).val(data[key]);
            });
            if (data.content) {
                _mEditor.setContent(data.content);
            }
            if (data.coverUrl) {
                aceFileHelper.setAceFileUploaderPreview("#formMultiple", data.coverUrl);
            }
        } else {
            error && console.error(">> cannot load item data from mCurrentEditingMit:", mCurrentEditingMit);
        }
    }

    function updateCurrentEditingMit() {
        if (_currentMitId == undefined) {
            return;
        }
        for (var i = 0; i < mCurrentEditingMit.wlsMaterialImagetexts.length; i++) {
            if (mCurrentEditingMit.wlsMaterialImagetexts[i].id == _currentMitId) {
                var data = mCurrentEditingMit.wlsMaterialImagetexts[i];
                break;
            }
        }
        if (!data) {
            error && console.error("Item data in mCurrentEditingMit is not initialized.", _currentMitId, mCurrentEditingMit);
        }
        // var data = $('#formMultiple').serialize();
        $("#formMultiple :text").each(function (index, element) {
            var key = $(element).attr("name");
            if (key) {
                data[key] = $(element).val();
            }
        });
        data.content = _mEditor.getContent();
        _currentMitId = undefined;

        debug && console.log("updateCurrentEditingMit(), ", data);
    }

    function validUmEditor() {
        var ret = true;
        if (_mEditor.getContentTxt().length > 20000) {
            var message = "不能超过20000个字符";
            formHelper.displayValidateMessage("#editorMultiple", message);
            ret = false;
        } else {
            formHelper.clearValidateMessages("#editorMultiple");
        }
        return ret;
    }

    /**
     * Auto persistent data when user change item to edit, and click save button.
     */
    function saveCurrentEditingMit(ev) {
        ev.preventDefault();
        debug && console.log("saveCurrentEditingMit(), validate all items data and save.");
        $(".editing").removeClass("editing");
        updateCurrentEditingMit();
        var isValid = true;
        // desc order, the last item is first in list.
        var lastInvalidItemId;
        for (var i = mCurrentEditingMit.wlsMaterialImagetexts.length - 1; i >= 0; i--) {
            var itemId = mCurrentEditingMit.wlsMaterialImagetexts[i].id;
            fillMitEditorForm(itemId);
            var formValid = $('#formMultiple').valid();
            var editorValid = validUmEditor();
            if (!formValid || !editorValid) {
                isValid = false;
                setInvalidStyle(itemId);
                lastInvalidItemId = itemId;
            }
        }
        if (lastInvalidItemId) {
            // set last invalid item (the first on UI list) in editing style.
            _currentMitId = lastInvalidItemId;
            $("#" + lastInvalidItemId).removeClass("invalid");
            clearFormMultiple();
            fillMitEditorForm(lastInvalidItemId);
            setPreviewItemEditingStyle(lastInvalidItemId);
        }

        if (isValid) {
            // remove tempId of new items.
            for (var i = 0; i < mCurrentEditingMit.wlsMaterialImagetexts.length; i++) {
                var item = mCurrentEditingMit.wlsMaterialImagetexts[i];
                // freecoderservice generates id always 8 chars length.
                if (item.id && item.id.length != 8) {
                    item.id = undefined;
                }
                //Items in mit object is stored in java <Set>, the order is not fixed, so we need record display order.
                item.positionInMulti = i;
            }

            if (mCurrentEditingMit.id) {
                var url = "php/ajax.php?method=put&url=/material/mit/" + mCurrentEditingMit.id;
            } else {
                var url = "php/ajax.php?method=post&url=/material/mit/";
            }
            debug && console.log("Saving mit data:", mCurrentEditingMit);
            $.post(url, {
                "jsondata": mCurrentEditingMit
            }, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                var savedMit = resp.data.entity;
                if (mCurrentEditingMit.id) {
                    // update old
                    for (var i = 0; i < mCacheData.length; i++) {
                        if (mCacheData[i].id == savedMit.id) {
                            mCacheData[i] = savedMit;
                        }
                    }
                } else {
                    // insert new
                    mCacheData.unshift(savedMit);
                }
                mCurrentEditingMit = undefined;
                mrh.showMaterialList("#listContainer", msh.MaterialType.MIT, mCacheData, listCallback);
                showSaveSuccessMessge();
                closeDialog();
            });
        }
    }

    function setInvalidStyle(itemId) {
        var selector = "#mitEditorPreviewItemList>li#" + itemId;
        $(selector).addClass("invalid");
        // enableFormMultiple();
        // $("#formMultiple [name='title']").focus();
    }

    function showSaveSuccessMessge() {
        uiHelper.showGritter("保存成功");
    }

    //Items in mit object is stored in java <Set>, the order is not fixed, so we need record display order.
    function orderMitItems(mit) {
        mit.wlsMaterialImagetexts.sort(function (o1, o2) {
            return o1.positionInMulti - o2.positionInMulti;
        });
        debug && console.log("orderMitItems(), after order:", mit);
    }

    function deleteMultipleMaterial(ev) {
        ev.preventDefault();
        var mitId = $(this).closest("ul").attr("id");
        var srcArr = Array();
        var i = 0;
        $("#" + mitId).find("img").each(function () {
            srcArr[i] = $(this).attr("src");
            i++;
        });
        if (!mitId)
            throw "cannot get mitId.";
        bootbox.confirm("确认删除？", function (result) {
            if (result) {
                var url = "php/ajax.php?method=delete&url=/material/mit/" + mitId;
                $.post(url, function (resp) {
                    ajaxHelper.ajaxResponseErrorHandler(resp);
                    if (resp.success === true) {
                        for (var i = 0; i < mCacheData.length; i++) {
                            if (mCacheData[i].id == mitId) {
                                mCacheData.splice(i, 1);
                            }
                        }
                        mrh.showMaterialList("#listContainer", msh.MaterialType.MIT, mCacheData, listCallback);
                        // remove dom node, refresh list without retrieve DB.
                        // do not delete image files, because one image may be used by multiple imagetexts.
                        // for (var j = 0; j < srcArr.length; j++) {
                        // aceFileHelper.deleteBcsObject(srcArr[j]);
                        // }
                    }
                });
            }
        });
    }

    function editMultipleMaterial(ev) {
        debug && console.log("editMultipleMaterial().");
        ev.preventDefault();
        var mitId = $(this).closest("ul").attr("id");

        if (!mitId)
            throw "cannot get mitId.";
        var url = "php/ajax.php?method=get&url=/material/mit/" + mitId;
        $.post(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            // _currentMitId = mitId;
            if (resp.data.count > 0) {
                $("#mitEditorPreviewItemList").html("");
                mCurrentEditingMit = resp.data.entity;
                orderMitItems(mCurrentEditingMit);
                for (var j = 0; j < mCurrentEditingMit.wlsMaterialImagetexts.length; j++) {
                    var itemTemplate = j == 0 ? "#mitEditorPreviewFirstItemTemplate" : "#mitEditorPreviewSecondaryItemTemplate";
                    $("#mitEditorPreviewItemList").loadTemplate($(itemTemplate), mCurrentEditingMit.wlsMaterialImagetexts[j], {
                        "append": true
                    });
                }
                // Data fill completed, image tags in templates are hidden, show them all.
                $("#mitEditorPreviewItemList img").removeClass("hidden");
                $(".mit_item_thumb").addClass("hidden");

                if (mCurrentEditingMit.wlsMaterialImagetexts.length == 1) {
                    // if only one item data, always create 2nd item preview.
                    $("#mitEditorPreviewItemList").loadTemplate("#mitEditorPreviewSecondaryItemTemplate", {}, {
                        "append": true
                    });
                }
                // bottom, "add" button.
                $("#mitEditorPreviewItemList").loadTemplate("#mitEditorPreviewBottomTemplate", {}, {
                    "append": true
                });

                bindMitEditorPreviewClickHandler();

                // file first item data to form and set edit style.
                var firstItemId = mCurrentEditingMit.wlsMaterialImagetexts[0].id;
                _currentMitId = firstItemId;
                fillMitEditorForm(firstItemId);
                setPreviewItemEditingStyle(firstItemId);

                showDialog();

            } else {
                uiHelper.showErrorAlert("加载数据失败，请刷新页面重试。");

            }
        });
    }

    /**
     * Create preview window and editor, open dialog, write new mit data.
     */
    function createNewMit() {
        initMitEditorPreview();
        showDialog();
        mCurrentEditingMit = {};
        mCurrentEditingMit.wlsMaterialImagetexts = [];
        $("#mitEditorPreviewItemList").find("li").each(function (index, element) {
            if ($(element).data("type") == "mitItem") {
                // 1ms to avoid duplicate tempId.
                var tempId = new Date().getTime() + index + "";
                $(element).attr("id", tempId);
                // create new cached mit data.
                mCurrentEditingMit.wlsMaterialImagetexts.push({
                    "id": tempId
                });
            }
        });

        editMitPreviewItem(mCurrentEditingMit.wlsMaterialImagetexts[0].id);
    }

    /**
     *
     * search function
     */

    $("#search").click(searchInfo);

    $("#searchValue").focus(function () {
        /*回车搜索*/
        document.onkeydown = function (event) {
            e = event ? event : (window.event ? window.event : null);
            if (e.keyCode == 13) {
                searchInfo();
            }
        };
    });

    function searchInfo() {
        var searchValue = $("#searchValue").val();
        var url = "php/ajax.php?method=get&url=/search/material/mit?q=" + encodeURI(searchValue);
        $.get(url, function (resp) {
            ajaxHelper.ajaxResponseErrorHandler(resp);
            if (resp.success == true) {
                mrh.showMaterialList("#listContainer", msh.MaterialType.MIT, resp.data.entity, listCallback);
            } else {
                uiHelper.showErrorAlert(errMsg);
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
        $("#modalAdd").on('hidden.bs.modal', onDialogHidden);
        $("#btnAddMit").on('click', createNewMit);
    }

    function onDialogHidden(e) {
        // clear preview items.
        $("#mitEditorPreviewItemList").html("");
        clearFormMultiple();
        // restoreMitPreviewItem();
        // disableFormMultiple();
        clearEditing();
    }

    return {
        "init": init
    };
});
