define(["app/common/AceFileHelper", "app/common/AjaxHelper", "app/common/UIHelper", "app/common/CacheHelper", "bootbox", "app/Header", "app/Menu", "ace", "jquery.loadTemplate"], function(aceFileHelper, ajaxHelper, uiHelper, cacheHelper) {
	var mImageDataCache = [];

	function init() {
		 bootbox.setDefaults({
			"locale" : "zh_CN"
	     });
		aceFileHelper.initUploadHandler($(":file"), {
			"urlHolderSelector" : "#photUrl",
			"sizeLimit" : 2097152, // ~2M
			"isChangeUpload" : false,
			"style" : "well"
		});

		$(document).on("change", "#fileMultiple", function() {
			aceFileHelper.uploadFile($("#fileMultiple"), "#photUrl", uploadImage);
			$("#photUrl").val("");
		});
		$("#photUrl").val("");
		getListData();
	}

	function uploadImage() {
		var url = "php/ajax.php?method=post&url=/material/image";
		var data = $("#photUrl").val();
		if (data != "") {
			var fileName = $(".file-name").attr("data-title");
			$.post(url, {
				"imageUrl" : data,
				"fileName" : fileName
			}, function(resp) {
				ajaxHelper.ajaxResponseErrorHandler(resp);
				if (resp.success === true) {
					$("#fileMultiple").data("ace_file_input").reset_input();
					mImageDataCache.unshift(resp.data["entity"]);
					$("#imageList").loadTemplate("#imageListTemplate", mImageDataCache);
					$("[name='aDeleteImage']").click(deleteImage);
					uiHelper.showSlide('.ace-thumbnails [data-rel="colorbox"]');
					// $("#" + resp.data.entity.id + " [name='aDeleteImage']").click(deleteImage);
				}
			});
		}
	}

	function deleteImage(ev) {
		ev.preventDefault();
		var id = $(this).closest("li").attr("id");
		var imgSrc = $(this).closest("li").find("img").attr("src");
		var obj = $(this).closest("li");
		bootbox.confirm("确定删除吗?", function(result) {
			if (result) {
				var url = "php/ajax.php?method=DELETE&url=/material/image/" + id;
				$.get(url, function(data) {
					ajaxHelper.ajaxResponseErrorHandler(data);
					if (data.success == true) {
						aceFileHelper.deleteBcsObject(imgSrc);
						mImageDataCache = cacheHelper.deleteCacheData(mImageDataCache, id);
						obj.remove();
						uiHelper.showSlide('.ace-thumbnails [data-rel="colorbox"]');
					}
				});
			}
		});
	}

	function getListData() {
		debug && console.log("getListData().");
		var url = "php/ajax.php?method=get&url=/material/image/list";
		$.get(url, function(resp) {
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if (resp.success === true) {
				mImageDataCache = resp.data["entity"];
				$("#imageList").loadTemplate("#imageListTemplate", mImageDataCache);
				$("[name='aDeleteImage']").click(deleteImage);
				uiHelper.showSlide('.ace-thumbnails [data-rel="colorbox"]');
			}
		});
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
	
	function searchInfo(){
		var searchValue=$("#searchValue").val();
		var url="php/ajax.php?method=get&url=/search/material/image?q="+encodeURI(searchValue);
		$.get(url,function(resp){
			mImageDataCache=[];
			ajaxHelper.ajaxResponseErrorHandler(resp);
			if(resp.success==true){
				mImageDataCache = resp.data["entity"];
				$("#imageList").loadTemplate("#imageListTemplate", mImageDataCache);
				$("[name='aDeleteImage']").click(deleteImage);
				uiHelper.showSlide('.ace-thumbnails [data-rel="colorbox"]');
			}else{
			    uiHelper.showErrorAlert(errMsg);  	
			}
		});	
	}


	return {
		"init" : init
	};

});
