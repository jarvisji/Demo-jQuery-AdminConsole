define(["jquery", "spin", "jquery.gritter", "bootstrap-tag"], function($, Spinner) {

	/**
	 * show message in alert bar.
	 * Default behavior is override exist message. If "isAppend" is true, will append new message under exists.
	 */
	function showAlertBar(alertSelector, message, /* boolean */isAppend) {
		var $alertBox = $(alertSelector);
		// the alert bar maybe not exist since user click close button of alert bar will remove it from dom tree, we will try to
		// init them again.
		if ($alertBox.length == 0) {
			initAlertBar();
			$alertBox = $(alertSelector);
		}

		if ($alertBox.length == 0) {
			alert(message);
		} else {
			// remove exist message dom.
			if (!isAppend === true) {
				$alertBox.find("span").html(" " + message);
			} else {
				$alertBox.find("span").append("<br> " + message);
			}
			$alertBox.removeClass("hidden");
		}
	}

	return {
		/**
		 * Initilize two alert bar in given container, one is for help/success info, the other is for error info.
		 */
		initAlertBar : function(containerSelector) {
			if (containerSelector == undefined) {
				containerSelector = "#alertPlaceHolder";
			}
			if ($(containerSelector).length > 0) {
				var htmlstr = '';
				htmlstr += '<div class="alert alert-danger hidden">';
//				htmlstr += '  <button type="button" class="close" data-dismiss="alert">';
//				htmlstr += '    <i class="icon-remove"></i>';
//				htmlstr += '  </button>';
				htmlstr += '  <i class="icon-exclamation-sign red"></i><span></span>';
				htmlstr += '</div>';
				htmlstr += '<div class="alert alert-info hidden">';
//				htmlstr += '  <button type="button" class="close" data-dismiss="alert">';
//				htmlstr += '    <i class="icon-remove"></i>';
//				htmlstr += '  </button>';
				htmlstr += '  <i class="icon-info-sign blue"></i><span></span>';
				htmlstr += '</div>';
				$(containerSelector).html(htmlstr);
			} else {
				debug && console.log("initAlertBar(), failed, cannot find container:", containerSelector);
			}
		},

		hideErrorAlert : function() {
			var $alert = $(".alert-danger");
			if (!$alert.hasClass("hidden")) {
				$alert.addClass("hidden");
			}
		},

		hideInfoAlert : function() {
			var $alert = $(".alert-info");
			if (!$alert.hasClass("hidden")) {
				$alert.addClass("hidden");
			}
		},

		/**
		 * Display message in predefind error alert bar.
		 */
		showErrorAlert : function(message, /* boolean */isAppend) {
			alertSelector = ".alert-danger";
			showAlertBar(alertSelector, message, isAppend);
		},
		/**
		 * Display message in predefind info alert bar.
		 */
		showInfoAlert : function(message, /* boolean */isAppend) {
			alertSelector = ".alert-info";
			showAlertBar(alertSelector, message, isAppend);
		},

		showGritter : function(text, time) {
			$.gritter.add({
				"text" : text,
				"class_name" : "gritter-success gritter-center",
				"time" : time ? time : 1000
			});
		},

		showGritterError : function(text) {
			$.gritter.add({
				"text" : text,
				"class_name" : "gritter-error",
				"time" : 5000
			});
		},

		showSpinner : function(id, opts) {
			id.each(function() {
				var $this = $(this), data = $this.data();
				if (data.spinner) {
					data.spinner.stop();
					delete data.spinner;
				}
				if (opts !== false) {
					data.spinner = new Spinner($.extend({
						color : $this.css('color')
					}, opts)).spin(this);
				}
			});
			return this;
		},

		showSlide : function(Selector) {
			require(["jquery.colorbox"], function() {
				var colorbox_params = {
					reposition : true,
					scalePhotos : true,
					scrolling : false,
					previous : '<i class="icon-arrow-left"></i>',
					next : '<i class="icon-arrow-right"></i>',
					close : '&times;',
					current : '{current} of {total}',
					maxWidth : '100%',
					maxHeight : '100%',
					onOpen : function() {
						document.body.style.overflow = 'hidden';
					},
					onClosed : function() {
						document.body.style.overflow = 'auto';
					},
					onComplete : function() {
						$.colorbox.resize();
					}
				};
				$(Selector).colorbox(colorbox_params);
				$("#cboxLoadingGraphic").html("");
				//let's add a custom loading icon
				$("#cboxLoadingGraphic").append("<i class='icon-spinner orange'></i>");
			});
		},

		/**
		 * Show a button with drop down list for all tags.
		 * @param {Object} selectTagHandler
		 */
		initTagsButton : function(tags, selectTagHandler) {
			var selector = "[data-type='wl-tags-button']"
			var $placeholder = $(selector);
			if ($placeholder.length == 0) {
				error && console.error("Init button of tag list failed, cannot find placeholer: ", selector);
				return;
			}

			htmlstr = '<div class="btn-group btn-group-sm">';
			htmlstr += '  <button data-toggle="dropdown" class="btn btn-primary dropdown-toggle">标签<i class="icon-angle-down icon-on-right"></i></button>';
			htmlstr += '  <ul class="dropdown-menu pull-right">';
			htmlstr += '    <li><a href="#">全部</a></li>';
			htmlstr += '    <li class="divider"></li>';
			if ($.isArray(tags)) {
				for (var i = 0; i < tags.length; i++) {
					htmlstr += '<li><a href="' + tags[i].id + '"><i class="icon-tag"></i> ' + tags[i].tag + '</a></li>';
				}
			}
			htmlstr += '  </ul>';
			htmlstr += '</div><!-- /btn-group -->';

			var $tagList = $(htmlstr);
			$placeholder.html("");
			$placeholder.append($tagList);

			if ($.isFunction(selectTagHandler)) {
				$tagList.find("a").click(function(ev) {
					ev.preventDefault();
					var tag = $(this).text();
					var tagId = $(this).attr("href");
					selectTagHandler(tag, tagId);
				});
			}
		},

		/**
		 * Show a input box to add new tags. Also prepend exists tags.
		 * @param {Object} $tagContainer The dom container which tag input will be displayed in it.
		 * @param {Aray} arrExistTags
		 * @param {Array} arrUserTags
		 * @param {Object} addTagHandler
		 * @param {Object} removeTagHandler
		 */
		showTagsInput : function($tagContainer, arrExistTags, arrUserTags, addTagHandler, removeTagHandler) {
			debug && console.log("showTagsInput(). arrExistTags, arrUserTags: ", arrExistTags, arrUserTags);
			if (arguments.length != 5) {
				error && console.error(">> Invalid arguments.");
			}
			var selector = "[data-type='wl-tags-input']";
			var $tags_input = $tagContainer ? $tagContainer.find(selector) : $(selector);

			if ($tags_input.length == 0) {
				error && console.error("Init input of tag list failed, cannot find placeholer: ", selector);
				return;
			}

			$tags_input.val(arrExistTags.join(","));
			$tags_input.tag({
				placeholder : $tags_input.attr('placeholder'),
				//enable type ahead by specifying the source array
				source : arrUserTags
			}).on("added", function(e, value) {
                var tagClassOfInput = $tags_input.data('tag');
				addTagHandler(value, tagClassOfInput);
			}).on("removed", function(e, value) {
				// value of "removed" event is array instead of string, don't know the reason, but convert it to string. Same as "added"
				// event returns.
				if ($.isArray(value)) {
					value = value[0];
				}
				removeTagHandler(value);
			});
		},
		
		isBtnClickable:function(id,off){
			if(off==true){
				$(id).removeAttr("disabled");
			}else if(off==false){
				$(id).attr("disabled","disabled");
			}
		}
		
	};
});
