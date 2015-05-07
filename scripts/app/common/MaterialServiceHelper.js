define(["app/common/AjaxHelper", "app/common/EmoteHelper", "app/common/StringUtil"], function (ajaxHelper, emoteHelper, stringUtil) {

    var MaterialType = {
        "TEXT": "text",
        "IMAGE": "image",
        "AUDIO": "audio",
        "VIDEO": "video",
        "SIT": "sit",
        "MIT": "mit"
    };
    var MODULES = {
        "ALBUM": "album"
    };

    return {
        "MaterialType": MaterialType,
        "MODULES": MODULES,
        checkType: function (type) {
            if (MaterialType[type.toUpperCase()] == undefined) {
                throw "Invalid type: " + type;
            }
        },

        getMaterialList: function (type, callback) {
            debug && console.log("getMaterialList, type: ", type);
            this.checkType(type);
            var url = "php/ajax.php?method=get&url=/material/" + type + "/list";
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (resp.data.count > 0) {
                    if (type == "text") {
                        for (var i = 0; i < resp.data.count; i++) {
                            var entity = resp.data.entity[i];
                            entity.content = emoteHelper.textToHtml(stringUtil.escapeHTML(entity.content));
                        }
                    }
                }
                callback(resp, type);
            });
        },

        getAlbumList: function (wxAccountId, callback) {
            var url = "php/ajax.php?method=get&url=/album/" + wxAccountId + "/list";
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                callback(resp, MODULES.ALBUM);
            });
        },

        getMaterial: function (type, id, callback) {
            this.checkType(type);
            var url = "php/ajax.php?method=get&url=/material/" + type + "/" + id;
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (resp.data.count > 0) {
                    if (type == "text") {
                        var entity = resp.data.entity;
                        entity.content = emoteHelper.textToHtml(stringUtil.escapeHTML(entity.content));
                    }
                }
                if (callback) {
                    callback(resp, type);
                }
            });
        },

        getTagList: function (callback) {
            var url = "php/ajax.php?method=get&url=/tag/list";
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (callback)
                    callback(resp);
            })
        },

        getTagListByMaterialId: function (type, materialId, callback) {
            this.checkType(type);
            var url = "php/ajax.php?method=get&url=/tag/list/material/" + type + "/" + materialId;
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (callback)
                    callback(resp, type);
            })
        },

        getTagListByMaterialType: function (type, callback) {
            this.checkType(type);
            var url = "php/ajax.php?method=get&url=/tag/list/material/" + type;
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (callback)
                    callback(resp, type);
            })
        },

        getMaterialListByTag: function (tagId, type, callback) {
            this.checkType(type);
            var url = "php/ajax.php?method=get&url=/tag/" + tagId + "/material/" + type;
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (callback)
                    callback(resp, type);
            })
        },

        addTag: function (materialType, materialId, data, callback) {
            var url = "php/ajax.php?method=post&url=/tag/material/" + materialType + "/" + materialId;
            $.post(url, {
                "jsondata": data
            }, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (resp.success) {
                    if (callback) {
                        callback(resp);
                    }
                }
            });
        },

        deleteTag: function (deleteTagId, materialType, materialId, callback) {
            var url = "php/ajax.php?method=delete&url=/tag/" + deleteTagId + "/material/" + materialType + "/" + materialId;
            $.get(url, function (resp) {
                ajaxHelper.ajaxResponseErrorHandler(resp);
                if (callback) {
                    callback(resp);
                }
            });
        }
    };

//	/**
//	 * Get the multi-imagetext list, note the results only contain id, instead of content.
//	 */
//	function getMultipleMaterial(callback) {
//		var url = "php/ajax.php?method=get&url=/material/mit/list";
//		$.post(url, function(resp) {
//			ajaxHelper.ajaxResponseErrorHandler(resp);
//			for (var i = 0; i < resp.data.count; i++) {
//				var mit = resp.data.entity[i];
//				getMultipleMaterialItems(mit.id, callback);
//			}
//		});
//	}
//
//	/**
//	 * Get item list for special one multi-imagetext.
//	 */
//	function getMultipleMaterialItems(mitId, callback) {
//		var url = "php/ajax.php?method=get&url=/material/mit/list/" + mitId;
//		$.post(url, function(resp) {
//			ajaxHelper.ajaxResponseErrorHandler(resp);
//			if (resp.data.count > 0) {
//				var mitItemsData = resp.data.entity;
//				$("#miltipleListContainer").loadTemplate("#mitListPreviewContainerAndFirstItemTemplate", mitItemsData[0], {
//					prepend : true
//				});
//				for (var i = 1; i < resp.data.count; i++) {
//					$("#" + mitItemsData[i].wlsMaterialMultiImagetextId).find("#mitListPreviewSecondaryItemContainer").loadTemplate("#mitListPreviewSecondaryItemTemplate", mitItemsData[i], {
//						append : true
//					});
//				}
//				$("#" + mitItemsData[resp.data.count - 1].id).removeClass("no-bottomline");
//
//				$("#" + mitId + " [name='aSelectMultiple']").click({
//					"type" : "material_mit"
//				}, callback);
//			}
//		});
//	}

});
