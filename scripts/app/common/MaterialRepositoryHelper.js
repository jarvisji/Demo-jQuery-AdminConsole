define(["app/common/MaterialServiceHelper", "app/common/UIHelper"], function (msh, uiHelper) {
    require(["bootbox", "jquery.loadTemplate"]);
    require(['domReady'], function (domReady) {
    });

    var templatePath = "templates/";

    function _showFullWidthList(containerSelector, template, materialType, /*Array*/data) {
        if ($(containerSelector).find("#listContainerFullWidth").length == 0) {
            var html2clos = '';
            html2clos += '<div class="row">';
            html2clos += '	<div class="col-md-12">';
            html2clos += '    <ul class="ace-thumbnails clearfix" id="listContainerFullWidth"></ul>';
            html2clos += '	</div>';
            html2clos += '</div>';
            $(containerSelector).html(html2clos);
        }
        var $container = $(containerSelector).find("#listContainerFullWidth");
        $container.html("");
        $container.loadTemplate(template, data, {
            "async": false,
            "isFile": true,
            "append": true
        });
        if (materialType == msh.MaterialType.MIT) {
            _orderMitItems(data);
            _placeMitDom(containerSelector, data);
        }
    }

    function _showTwoColsList(containerSelector, template, materialType, /*Array*/data) {
        if ($(containerSelector).find("#listContainerLeft").length == 0) {
            var html2clos = '';
            html2clos += '<div class="row">';
            html2clos += '	<div class="col-md-5">';
            html2clos += '		<ul class="ace-thumbnails wl-thumbnail-center" id="listContainerLeft"></ul>';
            html2clos += '	</div>';
            html2clos += '	<div class="col-md-5">';
            html2clos += '		<ul class="ace-thumbnails wl-thumbnail-center" id="listContainerRight"></ul>';
            html2clos += '	</div>';
            html2clos += '</div>';
            $(containerSelector).html(html2clos);
        }

        var $leftContainer = $(containerSelector).find("#listContainerLeft");
        var $rightContainer = $(containerSelector).find("#listContainerRight");
        $leftContainer.html("");
        $rightContainer.html("");
        var opt = {
            "async": false,
            "append": true
        };
        for (var i = 0; i < data.length; i++) {
            if ($leftContainer.height() <= $rightContainer.height()) {
                $leftContainer.loadTemplate(template, data[i], opt)
            } else {
                $rightContainer.loadTemplate(template, data[i], opt)
            }
            if (materialType == msh.MaterialType.MIT) {
                _orderMitItems(data[i]);
                _placeMitDom(containerSelector, data[i]);
            }
        }
    }

    function _showThreeColsList(containerSelector, template, materialType, /*Array*/data) {
        if ($(containerSelector).find("#listContainerLeft").length == 0) {
            var html3clos = '';
            html3clos += '<div class="row">';
            // offset-2 for tag list
            html3clos += '	<div class="col-md-3 col-md-offset-2">';
            html3clos += '		<ul class="ace-thumbnails wl-thumbnail-center" id="listContainerLeft"></ul>';
            html3clos += '	</div>';
            html3clos += '	<div class="col-md-3">';
            html3clos += '		<ul class="ace-thumbnails wl-thumbnail-center" id="listContainerMiddle"></ul>';
            html3clos += '	</div>';
            html3clos += '	<div class="col-md-3">';
            html3clos += '		<ul class="ace-thumbnails wl-thumbnail-center" id="listContainerRight"></ul>';
            html3clos += '	</div>';
            html3clos += '</div>';
            $(containerSelector).html(html3clos);
        }

        var $leftContainer = $(containerSelector).find("#listContainerLeft");
        var $midContainer = $(containerSelector).find("#listContainerMiddle");
        var $rightContainer = $(containerSelector).find("#listContainerRight");
        $leftContainer.html("");
        $midContainer.html("");
        $rightContainer.html("");

        var bindOption = {
            "async": false,
            "append": true
        };
        for (var i = 0; i < data.length; i++) {
            if ($leftContainer.height() <= $midContainer.height()) {
                if ($leftContainer.height() <= $rightContainer.height()) {
                    $leftContainer.loadTemplate(template, data[i], bindOption);
                } else {
                    $rightContainer.loadTemplate(template, data[i], bindOption);
                }
            } else {
                if ($midContainer.height() <= $rightContainer.height()) {
                    $midContainer.loadTemplate(template, data[i], bindOption);
                } else {
                    $rightContainer.loadTemplate(template, data[i], bindOption);
                }
            }
            if (materialType == msh.MaterialType.MIT) {
                _orderMitItems(data[i]);
                _placeMitDom(containerSelector, data[i]);
            }
        }
    }

    function showDialog(title, htmlStr, dialogConfirmCallback) {
        bootbox.dialog({
            "title": title,
            "message": htmlStr,
            "animate": false,
            "buttons": {
                "success": {
                    "label": "<i class='icon-ok'></i> 确定",
                    "className": "btn-sm btn-success",
                    "callback": function () {
                        var itemType = $(".display").closest(".tab-pane").attr("id");
                        if (itemType == undefined) {
                            itemType = $(".label-success").closest(".tab-pane").attr("id");
                        }
                        // if enable multiselect, the selected item maybe more than one.
                        if (itemType == msh.MaterialType.MIT) {
                            var $itemDoms = $(".display").closest("ul");
                        } else {
                            var $itemDoms = $(".display").closest("li");
                        }
                        var itemIds = [];
                        for (var i = 0; i < $itemDoms.length; i++) {
                            itemIds[i] = $itemDoms[i].id;
                        }
                        var itemId = itemIds.join(",");
                        var tagId = $(".label-success").closest("a").attr("id");
                        dialogConfirmCallback(itemType, itemId, $itemDoms, tagId);
                    }
                }
            }
        });
        $(".modal-body").addClass("dialog-scroll");
        $(".modal-dialog").addClass("dialog-100");
    }

    function bindSelectOperation(type, /*boolean*/multiselect) {
        // $("#" + type + " .ace-thumbnails li>:first-child").append($("#materialRepositotyTemplatePlaceHolder").html());
        var $selectable = $("#" + type + " .ace-thumbnails a[name='aSelect']");
        $selectable.click(function (e) {
            e.preventDefault();
            if (!multiselect) {
                $(".display>.inner").addClass("hidden");
                $(".display").removeClass("display");
            }
            if ($(this).find(".text").hasClass("display")) {
                $(this).find(".text").removeClass("display");
                $(this).find(".text").find(".inner").addClass("hidden");
            } else {
                $(this).find(".text").addClass("display");
                $(this).find(".text").find(".hidden").removeClass("hidden");
            }
        });
    }

    /**
     * Param: types. must be Array. Although use plain object is simpler, but the benifit of Array is, we can control the
     * order
     * of tabs.
     */
    function buildTypeTabs(/*array*/types) {
        var tabHeaderTpl = "";
        tabHeaderTpl += '<li name="{type}" class="{active}">';
        tabHeaderTpl += '	<a data-toggle="tab" href="#{type}"> <i class="green icon-home bigger-110"></i>{name}</a>';
        tabHeaderTpl += '</li>';

        var tabContentTpl = '<div id="{type}" class="tab-pane {active}"></div>';

        var tabsTpl = "";
        tabsTpl += '<div class="row">';
        tabsTpl += '	<div class="col-md-12">';
        tabsTpl += '		<div class="tabbable">';
        tabsTpl += '			<ul class="nav nav-tabs">';
        tabsTpl += '				{tabHeader}';
        tabsTpl += '			</ul>';
        tabsTpl += '			<div class="tab-content">';
        tabsTpl += '				{tabContent}';
        tabsTpl += '			</div>';
        tabsTpl += '		</div>';
        tabsTpl += '	</div>';
        tabsTpl += '</div>';

        var tabHeader = "";
        var tabContent = "";
        if ($.isArray(types)) {
            for (var i = 0; i < types.length; i++) {
                // tab header
                var tempStr = tabHeaderTpl;
                tempStr = tempStr.replace(/{type}/g, types[i].type);
                tempStr = tempStr.replace(/{name}/g, types[i].name);
                if (i == 0) {
                    // the first tab is active.
                    tempStr = tempStr.replace(/{active}/, "active");
                } else {
                    tempStr = tempStr.replace(/{active}/, "");
                }
                tabHeader += tempStr;

                // tab content
                tempStr = tabContentTpl;
                tempStr = tempStr.replace(/{type}/g, types[i].type);
                if (i == 0) {
                    tempStr = tempStr.replace(/{active}/, "active");
                } else {
                    tempStr = tempStr.replace(/{active}/, "");
                }
                tabContent += tempStr;
            }
        } else {
            error && console.error("Types must be array: ", types);
        }

        var tabStr = tabsTpl;
        tabStr = tabStr.replace(/{tabHeader}/, tabHeader);
        tabStr = tabStr.replace(/{tabContent}/, tabContent);
        return tabStr;
    }

    /**
     * 点击素材标签，加载相应的素材。如果已加载则跳过。
     */
    function bindTabClickHandler(wxAccountId) {
        $('.nav-tabs a').click(function (e) {
            e.preventDefault();
            var type = $(this).attr("href").split("#")[1];
            var isLoaded = $(".tab-content #" + type).html() != "";
            if (!isLoaded) {
                _showMaterialListOnDialog(type, wxAccountId);
            }
        });
    }

    function _showMaterialListOnDialog(type, wxAccountId) {
        var callback = function (resp) {
            // Get options for type
            var types = $(".modal-dialog").data("types");
            for (var i = 0; i < types.length; i++) {
                if (types[i].type == type) {
                    var showTag = types[i].showtag;
                    var multiSelect = types[i].multiselect;
                }
            }

            // Render template
            var template = _getTemplateSelectable(type);
            if (type == msh.MaterialType.IMAGE) {
                _showFullWidthList(".tab-content > #" + type, template, type, resp.data.entity);
            } else {
                _showThreeColsList(".tab-content > #" + type, template, type, resp.data.entity);
            }
            bindSelectOperation(type, multiSelect);

            if (showTag === true) {
                showTagList(type);
            }
        };

        if (type == 'album') {
            msh.getAlbumList(wxAccountId, callback);
        } else {
            msh.getMaterialList(type, callback);
        }
    }

    function _getTemplate(type) {
        var templateFile;
        if (type == msh.MaterialType.TEXT) {
            templateFile = "MaterialTemplate-TextListItem.html";
        } else if (type == msh.MaterialType.AUDIO) {
            templateFile = "MaterialTemplate-AudioListItem.html";
        } else if (type == msh.MaterialType.SIT) {
            templateFile = "MaterialTemplate-SitListItem.html";
        } else if (type == msh.MaterialType.MIT) {
            templateFile = "MaterialTemplate-MitListContainer.html";
        }
        return templatePath + templateFile;
    }

    function _getTemplateEditable(type) {
        var templateFile;
        if (type == msh.MaterialType.TEXT) {
            templateFile = "MaterialTemplate-TextListItem-Editable.html";
        } else if (type == msh.MaterialType.AUDIO) {
            templateFile = "MaterialTemplate-AudioListItem-Editable.html";
        } else if (type == msh.MaterialType.SIT) {
            templateFile = "MaterialTemplate-SitListItem-Editable.html";
        } else if (type == msh.MaterialType.MIT) {
            templateFile = "MaterialTemplate-MitListContainer-Editable.html";
        }
        return templatePath + templateFile;
    }

    function _getTemplateSelectable(type) {
        var templateFile;
        if (type == msh.MaterialType.TEXT) {
            templateFile = "MaterialTemplate-TextListItem-Selectable.html";
        } else if (type == msh.MaterialType.IMAGE) {
            templateFile = "MaterialTemplate-ImageListItem-Selectable.html";
        } else if (type == msh.MaterialType.AUDIO) {
            templateFile = "MaterialTemplate-AudioListItem-Selectable.html";
        } else if (type == msh.MaterialType.SIT) {
            templateFile = "MaterialTemplate-SitListItem-Selectable.html";
        } else if (type == msh.MaterialType.MIT) {
            templateFile = "MaterialTemplate-MitListContainer-Selectable.html";
        } else if (type == msh.MODULES.ALBUM) {
            templateFile = "ModuleTemplate-AlbumList-Selectable.html";
        }
        return templatePath + templateFile;
    }

    /**
     *Show tag list at left side of material.
     */
    function showTagList(type) {
        debug && console.log("showTagList().");
        var tagListContainer = "";
        tagListContainer += '	<div class="col-md-2">';
        tagListContainer += '		<div id="tagListContainer" style="overflow-x: hidden"></div>';
        tagListContainer += '	</div>';

        var $contentRow = $("div#" + type + " .row");
        if ($contentRow.find("#tagListContainer").length == 0) {
            // tag list has 2 cols width, so need remove original offset.
            $contentRow.find(".col-md-offset-2").removeClass("col-md-offset-2");
            $contentRow.prepend(tagListContainer);
        }

        msh.getTagListByMaterialType(type, function (resp) {
            var tagButtons = '<h3 class="header smaller lighter blue">标签</h3><p><a href="#" id="#"><span class="label label-info label-lg arrowed label-success">所有</span></a></p>';
            for (var i = 0; i < resp.data.entity.length; i++) {
                var entity = resp.data.entity[i];
                tagButtons += '<p><a href="#" id="' + entity[0] + '"><span class="label label-info label-lg arrowed">' + entity[1] + '</span></a></p>';
            }
            $("#tagListContainer").html(tagButtons);
            // tag click evnent handler.
            $("#tagListContainer a").click(function (e) {
                var tagId = $(this).attr("id");
                $("span.label-success").removeClass("label-success");
                $(this).find("span").addClass("label-success");
                showMaterialInTag(e, tagId, type);
            });
        });
    }

    /**
     *Get material list by tag, and refresh tab content.
     */
    function showMaterialInTag(e, tagId, type) {
        e.preventDefault();
        console.log("showMaterialInTag(). tag id: ", tagId);
        if (tagId == "#") {
            _showMaterialListOnDialog(type);
        } else {
            msh.getMaterialListByTag(tagId, type, function (resp, type) {
                var template = _getTemplateSelectable(type);
                _showThreeColsList("#" + type, template, type, resp.data.entity);
            });
        }
    }

    /*********************************************************
     * for mit
     */
    function _placeMitDom(containerSelector, mit, /*optional boolean*/prepend) {
        var $mitContainer = $(containerSelector).find("#" + mit.id).closest(".row");
        var $mitItemContainer = $(containerSelector).find("#" + mit.id);
        for (var j = 0; j < mit.wlsMaterialImagetexts.length; j++) {
            var itemTemplate = j == 0 ? "MaterialTemplate-MitFirstItem.html" : "MaterialTemplate-MitSecondItem.html";
            var mitItem = mit.wlsMaterialImagetexts[j];
            $mitItemContainer.loadTemplate(templatePath + itemTemplate, mitItem, {
                "append": true,
                "async": false,
                "isFile": true
            });
        }
        if (mit.wlsMaterialImagetexts.length > 0) {
            $("#" + mit.wlsMaterialImagetexts[mit.wlsMaterialImagetexts.length - 1].id).removeClass("no-bottomline");
        }

        /**
         * There are three kinds of templates for mit: container, first item, second item and after.
         * Container template is first loaded, so it has different versions for operations.
         * However operation overlay should work on the first item element. So here we need update dom to move operation overlay from container to the first item.
         * Selectable template has "[name='aSelect']" and ".text".
         * Editable template only has ".text".
         * Preview template doesn't has any extra overlay.
         */
        var $mitFirstItem = $mitContainer.find(".img_material_preview");
        // for select operation, the click area wraps full item.
        var $selectTag = $mitContainer.find("[name='aSelect']");
        if ($selectTag.length > 0) {
            $mitFirstItem.wrap($selectTag);
            $selectTag.remove();
            var $operationOverlay = $mitContainer.find(".text");
            $operationOverlay.insertAfter($mitFirstItem);
        } else {
            // The operation overlay is defined in *MitListContainer* template, now move it to the first item.
            var $operationOverlay = $mitContainer.find(".text");
            if ($operationOverlay.length > 0) {
                $operationOverlay.appendTo($mitFirstItem);
            }
        }
        // $mitContainer.append("<div class='clearfix'></div>"); // to make 'ul' as height as 'li's
    }

    //Items in mit object is stored in java <Set>, the order is not fixed, so we need record display order.
    function _orderMitItems(mit) {
        mit.wlsMaterialImagetexts.sort(function (o1, o2) {
            return o1.positionInMulti - o2.positionInMulti;
        });
        debug && console.log("_orderMitItems(), after order:", mit);
    }

    /*
     * Tag methods.
     */
    var mDisplayMaterialCallback;
    // Array of WlsTag objects:[{"tag":"tag1", "id":"xxx"},{"tag":"tag2", "id":"xxx"}]
    var mArrUserTags;
    // Array of tag names: ["tag1", "tag2"]
    var mArrUserTagNames;

    function initUserTags(materialType, displayMaterialCallback) {
        debug && console.log("initUserTags().");
        // _addTag() will refresh tag list but it hasn't display callback method, so we need save callback name at the first
        // time.
        if (displayMaterialCallback != undefined) {
            mDisplayMaterialCallback = displayMaterialCallback;
        }
        msh.getTagList(function (resp) {
            debug && console.log(">> user tags: ", resp.data.entity);
            _cacheUserTags(resp.data.entity);
            uiHelper.initTagsButton(resp.data.entity, function (tag, tagId) {
                _getMaterialByTag(tagId, materialType);
            });
        });
    }

    function _cacheUserTags(tags) {
        mArrUserTags = tags;
        mArrUserTagNames = [];
        for (var i = 0; i < tags.length; i++) {
            mArrUserTagNames[i] = tags[i].tag;
        }
    }

    function _getMaterialByTag(tagId, materialType) {
        debug && console.log("getMaterialByTag(). For materialType, tagId: ", materialType, tagId);
        if (tagId != undefined && tagId != "#") {
            msh.getMaterialListByTag(tagId, materialType, mDisplayMaterialCallback);
        } else {
            msh.getMaterialList(materialType, mDisplayMaterialCallback);
        }
    }

    function initTagInput(materialType, materialId, /*optional*/fetchData) {
        debug && console.log("initTagInput(). materialType, materialId: ", materialType, materialId);
        var materialTagNames = [];
        var $tagContainer = $("#" + materialId);
        // for new added material, it hasn't tags, may set 'fetchData' to false to avoid a http call.
        if (fetchData != false) {
            msh.getTagListByMaterialId(materialType, materialId, function (resp) {
                for (var i = 0; i < resp.data.entity.length; i++) {
                    materialTagNames[i] = resp.data.entity[i].tag;
                }
                uiHelper.showTagsInput($tagContainer, materialTagNames, mArrUserTagNames, function (tag) {
                    _addTag(materialType, materialId, tag);
                }, function (tag) {
                    _removeTag(materialType, materialId, tag);
                });
            });
        } else {
            uiHelper.showTagsInput($tagContainer, materialTagNames, mArrUserTagNames, function (tag) {
                _addTag(materialType, materialId, tag);
            }, function (tag) {
                _removeTag(materialType, materialId, tag);
            });
        }
    }

    function _addTag(materialType, materialId, tag) {
        debug && console.log("_addTag(). ", tag);
        var postData = {
            "tag": tag
        };
        for (var i = 0; i < mArrUserTags.length; i++) {
            if (mArrUserTags[i].tag == tag) {
                postData["id"] = mArrUserTags[i].id;
                break;
            }
        }

        msh.addTag(materialType, materialId, postData, function (resp) {
            if (!postData.id) {
                // if user created new tag, refresh user tag list.
                initUserTags(materialType);
            }
        });
    }

    function _removeTag(materialType, materialId, tag) {
        debug && console.log("_removeTag(). ", tag);
        var deleteTagId;
        for (var i = 0; i < mArrUserTags.length; i++) {
            if (mArrUserTags[i].tag == tag) {
                deleteTagId = mArrUserTags[i].id;
                break;
            }
        }
        if (deleteTagId) {
            msh.deleteTag(deleteTagId, materialType, materialId);
        }
    }

    /*
     * -- tag methods.
     */

    /**************************************************************************************************
     * public functions.
     **************************************************************************************************/
    return {
        "initUserTags": initUserTags,
        "initTagInput": initTagInput,
        /**
         * List each type of materials, with edit/delete operation buttons.
         * @param containerSelector
         * @param materialType
         * @param data Optional. Entity array.
         * @param callback Optional.
         */
        showMaterialList: function (containerSelector, materialType, data, callback) {
            msh.checkType(materialType);
            var template = _getTemplateEditable(materialType);
            if (data) {
                if (materialType == msh.MaterialType.IMAGE) {
                    _showFullWidthList(containerSelector, template, materialType, data);
                } else {
                    _showTwoColsList(containerSelector, template, materialType, data);
                }
                if (callback) {
                    callback();
                }
            } else {
                msh.getMaterialList(materialType, function (resp) {
                    var data = resp.data.entity;
                    if (materialType == msh.MaterialType.IMAGE) {
                        _showFullWidthList(containerSelector, template, materialType, data);
                    } else {
                        _showTwoColsList(containerSelector, template, materialType, data);
                    }
                    if (callback) {
                        callback(resp);
                    }
                })
            }
        },

        /**
         * Open dialog to show material list of special types, and they are selectable.
         * @param types Array of types, define the tabs on dialog.
         * @param dialogConfirmCallback
         * @param wxAccountId
         */
        showMaterialDialog: function (types, dialogConfirmCallback, wxAccountId) {
            debug && console.log("showMaterialDialog().");
            if (!$.isArray(types)) {
                error && console.error("types must be array: ", types);
                return;
            }
            if (types.length == 0) {
                debug && console.log("types length is 0, no data to show.");
                return;
            }

            var tabStr = buildTypeTabs(types);
            showDialog("选择素材", tabStr, dialogConfirmCallback);
            bindTabClickHandler(wxAccountId);

            // store types to dom, for later use.
            $(".modal-dialog").data("types", types);

            var type = types[0].type;
            _showMaterialListOnDialog(type, wxAccountId);
        },

        /**
         * Just display one material in preview mode, not editable, not selectable.
         * @param containerSelector
         * @param materialType
         * @param entity
         */
        showMaterialPreview: function (containerSelector, materialType, /*id|entity*/entity, callback) {
            if (typeof entity === "string") {
                var id = entity;
                var mrh = this;
                msh.getMaterial(materialType, id, function (resp) {
                    if (resp.data.count > 0) {
                        mrh.showMaterialPreview(containerSelector, materialType, resp.data.entity);
                    } else {
                        $(containerSelector).html("无法加载素材，可能已被删除，请重新选择。");
                    }
                });
            } else {
//                $(containerSelector).loadTemplate(_getTemplateEditable(type), entity);
                var template = _getTemplate(materialType);
                _showFullWidthList(containerSelector, template, materialType, entity);
                if (callback)
                    callback();
            }
        }
    };
});
