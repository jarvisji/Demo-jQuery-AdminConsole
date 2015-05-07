/**
 * Helper function to use ACE file upload component.
 */
define(["jquery", "app/common/UIHelper", "ace"], function($, uiHelper) {

	function spinner_update(id, opts) {
		uiHelper.showSpinner(id, opts);
	}

	function setButtonUploadStyle(file_input, opt, btnClass) {
		$(file_input).next().next().remove();
		$(file_input).next().children().remove();
		$(file_input).next().removeClass("file-label");
		$(file_input).next().addClass(btnClass);
		$(file_input).next().html("上传文件");
	}

	return {
		/**
		 * Set uploaded image to ACE image uploader preview.
		 */
		setAceFileUploaderPreview : function(formSelector, imageUrl) {
			// $(formSelector).find(".ace-file-input").addClass("img_material_preview");
			$(formSelector).find(".file-label").addClass("hide-placeholder selected");
			$(formSelector).find(".file-name").addClass("large img_material_preview").attr("data-title", "");
			$(formSelector).find(".file-name").prepend("<img class='middle' src='" + imageUrl + "' />");
		},

		clearAceFielUploaderPreview : function(formSelector) {
			$(formSelector).find(".file-name img").detach();
		},
		/**
		 * Mostly used opts:
		 * opt.urlHolderSelector, opt.fileType
		 *
		 * not often use:
		 * opt.formSelector, opt.sizeLimit,
		 * opt.isChangeUpload is true or false
		 * opt.style is upload style
		 * opt.btnClass set button class
		 */
		initUploadHandler : function(file_input, opt) {
			// not sure why ace.click_event is undefined(refer to ace-elements.js, line 56), that cause remove icon doesn't work.
			// window['ace'].click_event = $.fn.tap ? "tap" : "click";
			var typeDef = {
				"image" : {
					"contentTypeExp" : new RegExp("^image\/(jpe?g|png|gif)$", "i"),
					"fileTypeExp" : new RegExp("\.(jpe?g|png|gif)$", "i"),
					"sizeLimit" : 2097152, // ~2M
					"errMsg" : "图片格式不正确"
				},
				"audio" : {
					"contentTypeExp" : new RegExp("^audio\/(mp3|mpeg|x-wav|x-ms-wma|amr)$", "i"),
					"fileTypeExp" : new RegExp("\.(mp3|wav|wma|amr)$", "i"),
					"sizeLimit" : 2097152, // ~2M
					"errMsg" : "音频格式不正确"
				},
				"video" : {
					"contentTypeExp" : new RegExp("^video\/(mpeg4|mp4|mpg|avi|x-ms-wmv)$", "i"),
					"fileTypeExp" : new RegExp("\.(mp4|mpe?g|avi|wmv)$", "i"),
					"sizeLimit" : 20971520, // ~20M
					"errMsg" : "视频格式不正确"
				}
			};
			opt = opt || {};
			isChangeUpload = opt.isChangeUpload || false;
            errFlag = false;
            var uploadMethod = this.uploadFile;
            $form = opt.formSelector ? $(opt.formSelector) : file_input.parents("form");
            uploadActionUrl = opt.uploadActionUrl ? opt.uploadActionUrl : $form.attr('action');
            var style = opt.style || "";
            var btnClass = opt.btnClass || "btn";
            uploadedUrlHolder = opt.urlHolderSelector || $(file_input).attr("urlHolderSelector");
            var thisUploadedUrlHolder = uploadedUrlHolder;
            var fileType = opt.fileType || "image";
            var sizeLimit = opt.sizeLimit || typeDef[fileType].sizeLimit; //~2M
			upload_in_progress = false;
			file_input.ace_file_input({
				style : style,
				btn_choose : '请选择文件',
				btn_change : null,
				no_icon : "icon-picture",
				droppable : true,
				thumbnail : 'fit',
				before_remove : function() {
					// if we are in the middle of uploading a file, don't allow resetting file input

					var oldFileUrl = (isChangeUpload == true) ? $(thisUploadedUrlHolder).val() : $(uploadedUrlHolder).val();
					var html = "<input type=\"hidden\" name=\"remove\" value='" + oldFileUrl + "' />";
					if ($("input[name=remove]").length > 0) {
						$("input[name=remove]").replaceWith(html);
					} else {
						(isChangeUpload == true) ? $(thisUploadedUrlHolder).after(html) : $(uploadedUrlHolder).after(html);
					}

					if (upload_in_progress)
						return false;
					// clear uploaded file url in form, and trigger its onChange event.
					(isChangeUpload == true) ? $(thisUploadedUrlHolder).val(null) : $(uploadedUrlHolder).after(null);
					$(uploadedUrlHolder).change();
					return true;
				},
				before_change : function(files, dropped) {
					//stop dropped
					if (dropped == true) {
						return false;
					}

					var file = files[0];
					if ( typeof file == "string") {// files is just a file name here
						// (in browsers that don't support FileReader API)
						if (!(typeDef[fileType].fileTypeExp).test(file)) {
							alert(typeDef[fileType].errMsg);
							errFlag = true;
							return false;
						}
					} else {
						var type = $.trim(file.type);
						console.log(type);
						if ((type.length > 0 && !(typeDef[fileType].contentTypeExp).test(type)) || (type.length == 0 && !(typeDef[fileType].fileTypeExp).test(file.name))) {
							// for android's default browser!
							alert(typeDef[fileType].errMsg);
							errFlag = true;
							return false;
						}

						if (file.size > sizeLimit) {
							alert('文件大小不能超过' +parseInt(sizeLimit/1024)/1024 + "M！");
							errFlag = true;
							return false;
						}
					}
					return true;
				}
			}).on('change', function() {
				if (style == "button") {
					var info = $(file_input).next().html();
					$(document).ajaxStart(function() {
						$(file_input).next().attr("disabled", "disabled");
						$(file_input).next().html("上传中。。。。");
					});

					$(document).ajaxStop(function() {
						$(file_input).next().html(info);
						$(file_input).next().attr("disabled", false);
					});
				} else {
					$(document).ajaxStart(function() {
						var opts = {};
						var content = "<div id=\"upload_wait\" ></div>";
						$(file_input).after(content);
						var style = "position: absolute;z-index:2;background-color: #000; width:100%;height:100%; filter:alpha(opacity=60);  -moz-opacity: 0.6; opacity: 0.6;display:none;";
						$("#upload_wait").attr("style", style);
						$("#upload_wait").show();
						spinner_update($("#upload_wait"), opts);
					});

					$(document).ajaxStop(function() {
						$("#upload_wait").remove();
					});

				}
				if (isChangeUpload == true) {
					uploadMethod(file_input, (isChangeUpload == true) ? thisUploadedUrlHolder : uploadedUrlHolder);
				}
			});
			if (style == "button") {
				setButtonUploadStyle(file_input, opt, btnClass);
			}
		},

		deleteBcsObject : function(imgSrc) {
			var url = "php/fileUpload.php?action=delete&url=" + imgSrc;
			$.get(url, function(data) {
				if (data.status != "OK") {
					alert(data.message);
				}
			}, "json");

		},

		copyFileToUserPath : function(fileUrl) {
			var url = "php/fileUpload.php?action=CopyFileToUser";
			$.post(url, {
				"fileUrl" : fileUrl
			}, function(data) {
				if (data.status !== "OK") {
					alert(data.message);
				}
			}, "json");
		},

		uploadFile : function(file_input, thisUploadedUrlHolder, callback) {
			if(isChangeUpload==false){
				errFlag=false;
			}
			if (errFlag) {
				return false;
			}
			if (!file_input.data('ace_input_files'))
				return false;
			// no files selected

			var deferred;

			if ("FormData" in window) {
				// for modern browsers that support FormData and uploading files via ajax
				var fd = new FormData($form.get(0));
				// if file has been drag&dropped , append it to FormData
				if (file_input.data('ace_input_method') == 'drop') {
					var files = file_input.data('ace_input_files');
					if (files && files.length > 0) {
						fd.append(file_input.attr('name'), files[0]);
						// to upload multiple files, the 'name' attribute should be something like this: myfile[]
					}
				}

				var upload_in_progress = true;
				deferred = $.ajax({
					url : uploadActionUrl,
					type : 'POST', // $form.attr('method'),
					processData : false,
					contentType : false,
					dataType : 'json',
					data : fd,
					xhr : function() {
						var req = $.ajaxSettings.xhr();
						if (req && req.upload) {
							req.upload.addEventListener('progress', function(e) {
								if (e.lengthComputable) {
									var done = e.loaded || e.position, total = e.total || e.totalSize;
									var percent = parseInt((done / total) * 100) + '%';
									// percentage of uploaded file
								}
							}, false);
						}
						return req;
					},
					beforeSend : function() {
					},
					success : function() {
					}
				});

			} else {
				// for older browsers that don't support FormData and uploading files via ajax
				// we use an iframe to upload the form(file) without leaving the page
				upload_in_progress = true;
				deferred = new $.Deferred;

				var iframe_id = 'temporary-iframe-' + (new Date()).getTime() + '-' + (parseInt(Math.random() * 1000));
				$form.after('<iframe id="' + iframe_id + '" name="' + iframe_id + '" frameborder="0" width="0" height="0" src="about:blank" style="position:absolute;z-index:-1;"></iframe>');
				$form.append('<input type="hidden" name="temporary-iframe-id" value="' + iframe_id + '" />');
				$form.next().data('deferrer', deferred);
				// save the deferred object to the iframe
				$form.attr({
					'method' : 'POST',
					'enctype' : 'multipart/form-data',
					'target' : iframe_id,
					'action' : uploadActionUrl
				});

				$form.get(0).submit();

				// if we don't receive the response after 60 seconds, declare it as failed!
				setTimeout(function() {
					var iframe = document.getElementById(iframe_id);
					if (iframe != null) {
						iframe.src = "about:blank";
						$(iframe).remove();
						deferred.reject({
							'status' : 'fail',
							'message' : 'Timeout!'
						});
					}
				}, 60000);
			}

			// //////////////////////////
			deferred.done(function(result) {
				upload_in_progress = false;

				if (result.status == 'OK') {
					// fill uploaded file url in form, and trigger its onChange event.
					$("input[name=remove]").remove();
					$(thisUploadedUrlHolder).val(result.url);
					$(uploadedUrlHolder).change();
					if ( typeof callback == "function") {
						callback();
					}

					$(document).unbind("ajaxStart");

				} else {
					alert("文件上传失败");
				}
			}).fail(function(result) {
				upload_in_progress = false;
				alert("发生错误：" + result.responseText);
				// console.log(result.responseText);
			});

			deferred.promise();
			return false;
		}
	}
});
