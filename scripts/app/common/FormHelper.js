/**
 * Helper functions for HTML FORM.
 */
define(["jquery", "jquery.validate"], function ($) {
    return {
        /**
         * Update form validate status, only work with ACE style lib and jquery.validate plugin.
         */
        initFormValidator: function (formSelector, /* object */rules, /* object */messages) {
            $(formSelector).validate({
                errorElement: 'div',
                errorClass: 'help-block',
                focusInvalid: false,
                rules: rules,
                messages: messages,
                highlight: function (e) {
                    $(e).closest('.form-group').removeClass('has-info').addClass('has-error');
                },
                success: function (e) {
                    $(e).closest('.form-group').removeClass('has-error').addClass('has-info');
                    $(e).remove();
                },
                errorPlacement: function (error, element) {
                    element.closest('.form-group').find('.help-inline').html(error);
                },
                submitHandler: function (form) {
                    // usually we don't use form.submit(), it we do, may add handle logic here.
                },
                invalidHandler: function (event, validator) {//display error alert on form submit
                    // callback for valid() method.
                }
            });
        },

        displayValidateMessage: function (selector, message, /*optional, out(default)|in*/direction) {
            if (direction != undefined && direction == "in") {
                var $formGroup = $(selector).find(".form-group");
            } else {
                var $formGroup = $(selector).closest(".form-group");
            }
            $formGroup.find('.help-inline').html(message);
            $formGroup.removeClass('has-info').addClass('has-error');

        },

        clearValidateMessages: function (selector, /*optional, out(default)|in*/direction) {
            if (direction != undefined && direction == "in") {
                var $formGroup = $(selector).find(".form-group");
            } else {
                var $formGroup = $(selector).closest(".form-group");
            }
            $formGroup.find('.help-inline').html("");
            $formGroup.removeClass("has-error").addClass("has-info");
        },

        /**
         * Init 216 web safe colors in dropdown menu, and bind click event to set value of input text to the selected color
         * value.
         *
         * Depends:
         * 1. Must have a ul element with class '.dropdown-menu'.
         * We leverage bootstrap 'dropdown' and ace 'dropdown-colorpicker'. The css hierarchy is:
         * .dropdown-colorpicker>.dropdown-menu>li>.colorpick-btn
         *
         * 2. Must have a input text in the same '.form-group'.
         */
        initColorPicker: function (selector, callback) {
            if ($(selector) && $(selector).length > 0) {
                var ddmenu = $(selector).find("ul.dropdown-menu");
                if (ddmenu.length == 0) {
                    throw ("To enable colorpicker, must have one 'ul.dropdown-menu' in element");
                }
                var itemTpl = '<li><a class="colorpick-btn" href="#" style="background-color:${color}" data-color="${color}"></a></li>';
                var colorSeg = ['00', '33', '66', '99', 'CC', 'FF'];
                for (var l1 = 0; l1 < colorSeg.length; l1++) {
                    for (var l2 = 0; l2 < colorSeg.length; l2++) {
                        for (var l3 = 0; l3 < colorSeg.length; l3++) {
                            var color = "#" + colorSeg[l1] + colorSeg[l2] + colorSeg[l3];
                            ddmenu.prepend($(itemTpl.replace(/\${color}/g, color)));
                        }
                    }
                }
                // bind color select event handler.
                $(".colorpick-btn").click(callback);
            } else {
                error && console.error("initColorPicker(). error: " + selector + " doesn't exist.");
            }
        },

        /**
         * Serialize form data to JSON object.
         * @param $form
         * @returns {{}}
         */
        serializeJson: function ($form) {
            var serializeObj = {};
            var array = $form.serializeArray();
            $(array).each(function () {
                if (serializeObj[this.name]) {
                    if ($.isArray(serializeObj[this.name])) {
                        serializeObj[this.name].push(this.value);
                    } else {
                        serializeObj[this.name] = [serializeObj[this.name], this.value];
                    }
                } else {
                    serializeObj[this.name] = this.value;
                }
            });
            return serializeObj;
        }
    };
});
