define(["app/common/AceFileHelper", "app/common/UIHelper", "app/common/AjaxHelper", "app/common/FormHelper", "app/common/CacheHelper", "ace", "bootbox", "app/Header", "app/Menu"], function(aceFileHelper, uiHelper, ajaxHelper, formHelper, cacheHelper) {
	require(["bootstrap"]);
	// call init after dom loaded, otherwise, may cause exception because dom structure is not complete.
	var vioeoId = "";
	var maxWords = 40;

	function init() {
		bootbox.setDefaults({
			"locale" : "zh_CN"
		});
		aceFileHelper.initUploadHandler($(":file"), {
			"urlHolderSelector" : "#url",
			"fileType" : "video",
			"isChangeUpload" : false,
			"style" : "well"
		});
		formCheck();
		$("#btnSubmit").click(buttonEventClick);
		$("#VideoForm [name='url']").change(fileUploadHanlder);
		initUIEventHandler();
	}

	var formDataCollection = [];
	$(document).ready(function() {
		var url = "php/ajax.php?method=get&url=/material/video/list";
		getListData(url, "#videoList", "#videoListTemplate", formDataCollection);
	});

	function fileUploadHanlder(eventData) {
		var sourceName = $(eventData.target).attr("name");
		if (sourceName == "url") {
			var validator = $(eventData.target).closest("form").validate();
			validator.element("[name='fileUploader']");
		}
	}

	function buttonEventClick() {
		if (vioeoId == "") {
			SaveStat(addVideoData);
		} else {
			SaveStat(updataVideoData);
		}
	}

	function SaveStat(save) {
		if ($('#VideoForm').valid()) {
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

	function updataVideoData() {
		var data = $('form').serialize();
		var url = "php/ajax.php?method=PUT&url=/material/video/" + vioeoId;
		$.post(url, data, function(data) {
			ajaxHelper.ajaxResponseErrorHandler(data);
			if (data.success == true) {
				formDataCollection = cacheHelper.updataCacheData(formDataCollection, vioeoId, "fileName", data.data["entity"]["fileName"]);
				formDataCollection = cacheHelper.updataCacheData(formDataCollection, vioeoId, "url", data.data["entity"]["url"]);
				formDataCollection = cacheHelper.updataCacheData(formDataCollection, vioeoId, "description", data.data["entity"]["description"]);
				formDataCollection = cacheHelper.updataCacheData(formDataCollection, vioeoId, "extenalUrl", data.data["entity"]["extenalUrl"]);
				$(".ace-thumbnails").each(function() {
					$(this).html("");
				});
				$("#videoList").loadTemplate($("#videoListTemplate"), formDataCollection);
				$("[name='aDeleteVideo']").click(deleteVideo);
				$("[name='aEditVideo']").click(editVideo);
				clearForm();
				vioeoId = "";
			} else {
				uiHelper.showErrorAlert(data.errMsg);
			}
		});
		uiHelper.isBtnClickable("#btnSubmit",true);
	}

	function addVideoData() {
		var data = $('form').serialize();
		var url = "php/ajax.php?method=post&url=/material/video";
		$.post(url, data, function(data) {
			ajaxHelper.ajaxResponseErrorHandler(data);
			if (data.success == true) {
				formDataCollection.unshift(data.data["entity"]);
				$(".ace-thumbnails").each(function() {
					$(this).html("");
				});
				$("#videoList").loadTemplate($("#videoListTemplate"), formDataCollection);
				$("[name='aDeleteVideo']").click(deleteVideo);
				$("[name='aEditVideo']").click(editVideo);
				clearForm();
			} else {
				uiHelper.showErrorAlert(data.errMsg);
			}
		});
		uiHelper.isBtnClickable("#btnSubmit",true);
	}

	function clearForm() {
		$("#fileMultiple").data("ace_file_input").reset_input();
		$("#extenalUrl").val("");
		$("#fileName").val("");
		$("#description").val("");
		$("#url").val("");
		formHelper.clearValidateMessages("#VideoForm");
	}

	function formCheck() {
		$.validator.addMethod("fileUploadComplete", function(value, element, params) {
			if ($("#extenalUrl").val() == "") {
				return $("#url").val() != "" || $("#fileMultiple").val() != "";
			} else {
				return true;
			}
		});
		formHelper.initFormValidator("#VideoForm", {

			fileName : {
				required : true,
				maxlength : 50
			},

			fileUploader : "fileUploadComplete",
			extenalUrl : {
				required : false,
				url : true
			},
			description : {
				maxlength : 120
			}
		}, {
			fileUploader : "请上传视频文件",
			fileName : {
				required : "请输入标题",
				maxlength : "不能超过50个字"
			},
			extenalUrl : {
				url : "链接地址以http://开头"
			},
			description : {
				maxlength : "不能超过120个字"
			}
		});
	}

	function deleteVideo(ev) {
		ev.preventDefault();
		var id = $(this).closest("li").attr("id");
		var obj = $(this);
		var imgSrc = $(this).prev().prev().attr("href");
		bootbox.confirm("确定删除吗?", function(result) {
			if (result) {
				var url = "php/ajax.php?method=DELETE&url=/material/video/" + id
				$.get(url, function(data) {
					ajaxHelper.ajaxResponseErrorHandler(data);
					if (data.success == true) {
						aceFileHelper.deleteBcsObject(imgSrc);
						$(obj).closest("li").remove();
						formDataCollection = cacheHelper.deleteCacheData(formDataCollection, id);
					}
				});
			}
		});
	}

	function getListData(url, id, loadTemplate, arr) {
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				var $leftContainer = $("#listContainerLeft");
				var $rightContainer = $("#listContainerRight");
				// $leftContainer.html("");
				// $rightContainer.html("");

				for (var i = 0; i < resp.data["count"]; i++) {
					arr.unshift(resp.data["entity"][i]);
					if ($leftContainer.height() <= $rightContainer.height()) {
						$leftContainer.find("#videoList").loadTemplate($(loadTemplate), resp.data["entity"][i], {
							"async" : false,
							"append" : true
						});
					} else {
						$rightContainer.find("#videoList").loadTemplate($(loadTemplate), resp.data["entity"][i], {
							"async" : false,
							"append" : true
						});
					}
				}

				// $(id).loadTemplate($(loadTemplate), arr);
				$("[name='aDeleteVideo']").click(deleteVideo);
				$("[name='aEditVideo']").click(editVideo);
			}
		});
	}

	function editVideo() {
		clearForm();
		var obj = this;
		vioeoId = $(obj).closest("li").attr("id");
		var url = "php/ajax.php?method=GET&url=/material/video/" + vioeoId;
		$.get(url, function(result) {
			if (result.success) {
				$("input[name=url]").val(result.data.entity.url);
				$("#fileName").val(result.data.entity.fileName);
				$("#extenalUrl").val(result.data.entity.extenalUrl);
				$("#description").val(result.data.entity.description);
				if (result.data.entity.url) {
					$(".file-label").addClass("hide-placeholder selected");
					$(".file-label").attr('data-title', result.data.entity.url);
					$(".file-name").attr('data-title', result.data.entity.fileName);
					$(".file-name").html('<i class="icon-film"></i>');
					cleanError();
				}
				showDialog();
				checkFormWords();
			} else {
				alert(result.errMsg);
			}
		}, "json");
	}

	/**
	 *
	 * search function
	 */

	$("#search").click(searchInfo);
	
		$("#searchValue").focus(function(){
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
		var url = "php/ajax.php?method=get&url=/search/material/video?q=" + encodeURI(searchValue);
		formDataCollection = [];
		$(".ace-thumbnails").each(function() {
			$(this).html("");
		});
		getListData(url, "#videoList", "#videoListTemplate", formDataCollection);
	}

	function cleanError() {
		$(".help-inline").each(function() {
			$(this).html("");
		});
		$(".help-block").each(function() {
			$(this).parent().removeClass("has-error");
		});
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
	}

	return {
		"init" : init
	};
});
