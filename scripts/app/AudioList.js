define(["app/common/MaterialRepositoryHelper", "app/common/MaterialServiceHelper", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/FormHelper", "app/common/AceFileHelper", "app/common/CacheHelper", "ace", "bootbox", "app/Header", "app/Menu"], function(mrh, msh, ajaxHelper, uiHelper, formHelper, aceFileHelper, cacheHelper) {
	require(["bootstrap"]);
	bootbox.setDefaults({
		"locale" : "zh_CN"
	});
	//Global variable to store all audio data.
	bindEventHandler()
	var id;
	var maxWords = 40;
	var mTemplateFile = "templates/MaterialTemplate-AudioListItem-Editable.html";
	var gAudioList;
	function init() {
		aceFileHelper.initUploadHandler($(":file"), {
			"urlHolderSelector" : "#url",
			"fileType" : "audio",
			"sizeLimit" : 5242880, // ~5M
			"isChangeUpload" : false,
			"style" : "well"
		});
        msh.getMaterialList(msh.MaterialType.AUDIO, showMaterialList);

		// loadData();
		AudioFormCheck();
		$("#AudioForm [name='url']").change(fileUploadHanlder);
		initUIEventHandler();
	}

	function showMaterialList(resp) {
		uiHelper.hideInfoAlert();
		mrh.showTwoColsList("#audioListContainer", mTemplateFile, resp.data.entity);
        gAudioList =  resp.data.entity;
		bindEventHandler();
	}


	$("#btnSubmit").click(ButtonEventClick);

	function ButtonEventClick() {
		if (id) {
			checkFromData(SaveEditAudioData);
		} else {
			checkFromData(SaveAddAudioData);
		}

	}

	function checkFromData(save) {
		var filename = $("#fileMultiple").next().find(".file-name").attr("data-title");
		$("input[name=fileName]").val(filename);
		if ($('#AudioForm').valid()) {
			uiHelper.isBtnClickable("#btnSubmit",false);
			if ($("#fileMultiple").val() != "") {
				aceFileHelper.uploadFile($(":file"), "#url", save);
			} else {
				save();
			}
		} else {
			return false;
		}
	}

	function SaveEditAudioData() {
		var data = $('form').serialize();
		updataAudio(data);
	}

	function SaveAddAudioData() {
		var data = $('form').serialize();
		addAudio(data);
	}

	function fileUploadHanlder(eventData) {
		var sourceName = $(eventData.target).attr("name");
		if (sourceName == "url") {
			var validator = $(eventData.target).closest("form").validate();
			validator.element("[name='fileUploader']");
		}
	}

	function AudioFormCheck() {
		$.validator.addMethod("fileUploadComplete", function(value, element, params) {
			return $("#url").val() != "" || $("#fileMultiple").val() != "";
		});
		formHelper.initFormValidator("#AudioForm", {
			fileUploader : "fileUploadComplete",
			memo : {
				maxlength : 50
			}
		}, {
			fileUploader : "请上传音频文件",
			memo : {
				maxlength : "不能超过50个字"
			}
		});
	}


	$("input[name!=file]").click(function() {
		$(".alert").addClass("hidden");
	});

	function addAudio(data) {
		var url = "php/ajax.php?method=post&url=/material/audio";
		$.post(url, data, function(data) {
			ajaxHelper.ajaxResponseErrorHandler(data);
			if (data.success == true) {
				gAudioList.unshift(data.data["entity"]);
                mrh.showTwoColsList("#audioListContainer", mTemplateFile, gAudioList);
				clearForm();
				bindEventHandler();
			}
		});
		uiHelper.isBtnClickable("#btnSubmit",true);
	}

	function bindEventHandler() {
		$("[name='aPlayAudio']").click(playAudio);
		$("[name='aEditAudio']").click(editAudio);
		$("[name='aDeleteAudio']").click(deleteAudio);
	}

	function updataAudio(data) {
		var url = "php/ajax.php?method=PUT&url=/material/audio/" + id
		$.post(url, data, function(data) {
			ajaxHelper.ajaxResponseErrorHandler(data);
			if (data.success == true) {
				clearForm();
				gAudioList = cacheHelper.updataCacheData(gAudioList, id, "fileName", data.data["entity"]["fileName"]);
				gAudioList = cacheHelper.updataCacheData(gAudioList, id, "url", data.data["entity"]["url"]);
				gAudioList = cacheHelper.updataCacheData(gAudioList, id, "memo", data.data["entity"]["memo"]);
                mrh.showTwoColsList("#audioListContainer", mTemplateFile, gAudioList);
				bindEventHandler();
				id = "";
				// setIconsSize();
			}
		});
      uiHelper.isBtnClickable("#btnSubmit",true);
	}

	function clearForm() {
		$("#fileMultiple").data("ace_file_input").reset_input();
		$("input[name=url]").val("");
		$("input[name=fileName]").val("");
		$("textarea[name=memo]").val("");
		formHelper.clearValidateMessages("#AudioForm");
	}

	function deleteAudio(ev) {
		ev.preventDefault();
		var id = $(this).closest("li").attr("id");
		var obj = $(this);
		var imgSrc = $(this).attr("url");
		bootbox.confirm("确定删除吗?", function(result) {
			if (result) {
				var url = "php/ajax.php?method=DELETE&url=/material/audio/" + id
				$.get(url, function(data) {
					ajaxHelper.ajaxResponseErrorHandler(data);
					if (data.success == true) {
						aceFileHelper.deleteBcsObject(imgSrc);
						$(obj).parents("li").remove();
						gAudioList = cacheHelper.deleteCacheData(gAudioList, id);
						obj = "";
					}
				});
			}
		});
	}

	function editAudio(ev) {
		ev.preventDefault();
		id = $(this).closest("li").attr("id");
		var url = "php/ajax.php?method=get&url=/material/audio/" + id;
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success == true) {
				var entity = resp.data.entity;
				id = entity.id;
				$("input[name=url]").val(entity.url);
				$("input[name=fileName]").val(entity.fileName);
				$("textarea[name=memo]").val(entity.memo);
				setUploadFileFormShow(entity.url, entity.fileName)
				$(".help-inline").html("");
				$(".help-block").parent().removeClass("has-error");
				showDialog();
			}
		});
	}

	function setUploadFileFormShow(url, fileName) {
		$(".file-label").addClass("hide-placeholder selected");
		$(".file-label").attr('data-title', url);
		$(".file-name").attr('data-title', fileName);
		$(".file-name").html('<i class="icon-music"></i>');
	}

	function playAudio() {
		var obj = this;
		var pause = $(this).children("i").hasClass("icon-play");
		if (pause) {

			$("audio").each(function() {
				$(this).remove();
			})

			$(".aPlayAudio").each(function() {
				$(this).children("i").removeClass("icon-pause icon-2x");
				$(this).children("i").addClass("icon-play icon-2x");
			})
			var id = $(this).closest("li").attr("id");
			var Sound = $(this).attr("url");

			var html = "<audio  class=\"audio\" id=\"audio\" style=\"display:none\" controls=\"controls\" autoplay=\"autoplay\"> HTML5 audio not supported</audio>";
			$("#" + id).append(html);
			$("#" + id).children(".audio").attr("src", Sound);
			$(this).children("i").removeClass("icon-play icon-2x");
			$(this).children("i").addClass("icon-pause icon-2x");
			//add ended Event
			var c = document.getElementById("audio");
			c.addEventListener('ended', function(e) {
				$("#audio").remove();
				$(obj).children("i").removeClass("icon-pause icon-2x");
				$(obj).children("i").addClass("icon-play icon-2x");
				$("audio").each(function() {
					$(this).remove();
				})
			}, false);

		} else {
			$("audio").each(function() {
				$(this).remove();
			})
			$(this).children("i").removeClass("icon-pause icon-2x");
			$(this).children("i").addClass("icon-play icon-2x");
		}
	}

	/**
	 *
	 * search function
	 */

	$("#search").click(searchInfo);

	$("#searchValue").focus(function() {
		/*回车搜索*/
		document.onkeydown = function(event) {
			e = event ? event : (window.event ? window.event : null);
			if (e.keyCode == 13) {
				searchInfo();
			}
		};
	});

	function searchInfo() {
		var searchValue = $("#searchValue").val();
		var url = "php/ajax.php?method=get&url=/search/material/audio?q=" + encodeURI(searchValue);
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success == true) {
				gAudioList = [];
                mrh.showTwoColsList("#audioListContainer", mTemplateFile, resp.data.entity);
				bindEventHandler();
			} else {
				uiHelper.showErrorAlert(errMsg);
			}
		});
	}

	// function setIconsSize() {
	// $(".aPlayAudio").each(function() {
	// $(this).attr("style", "font-size: 20px;");
	// });
	// }

	function deleteObjectArray(object, Subscript) {
		for (value in object) {
			if (object[value]['id'] == Subscript) {
				object.splice(value, 1);
			}
		}
		return object;
	}

	function updataObjectArray(object, Subscript, attr, cont) {
		for (value in object) {
			if (object[value]['id'] == Subscript) {
				object[value][attr] = cont;
			}
		}
		return object;
	}

	function closeDialog() {
		$("#modalAdd").modal('hide');
	}

	function showDialog() {
		$("#modalAdd").modal({
			backdrop : "static"
		});
		$("#modalAdd").modal('show');
	}

	function initUIEventHandler() {
		$('#modalAdd').on('hidden.bs.modal', onDialogHidden);
	}

	function onDialogHidden(e) {
		clearForm();
		$("#btnSubmit").removeAttr("disabled");
	}

	return {
		"init" : init
	};
});
