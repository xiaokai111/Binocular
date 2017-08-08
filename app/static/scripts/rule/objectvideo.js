/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information 
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws, 
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852, 
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
 * @file objectvideo.js
 * objectvideo master file
 * This file must be loaded before any other objectvideo script.
 */

// Create our only global variable.
/**
 * The objectvideo namespace object.
 * @type {Object}
 * @namespace objectvideo.snapshot
 */
var objectvideo;
if (!objectvideo) { objectvideo = {}; }

var keyCode = {
    backspace: 8,
    space: 32,
    comma: 44,
    period: 46,
    zero: 48,
    nine: 57
};

String.prototype.getUtf8Length = function () {
    var i, high, low, code, nBytes = 0;

    for (i = 0; i < this.length; i++) {
        // String method charCodeAt will never return a value greater than
        // 0xFFFF, but the full Unicode character could have a code point
        // value as high as 0x10FFFF, so we might need to call charCodeAt
        // twice to get the full character code.
        high = this.charCodeAt(i);
        if (high < 0xD800 || high > 0xDBFF) {
            // This is the whole code point.
            code = high;
        }
        else {
            // Get the second octet of a four-octet code point,
            // then compose the full character code.
            // Note that this advances our loop counter.
            low = this.charCodeAt(++i);
            code = ((high - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
        }

        if (code < 0x80) {
            nBytes += 1;
        }
        else if (code < 0x800) {
            nBytes += 2;
        }
        else if (code < 0x10000) {
            nBytes += 3;
        }
        else {
            nBytes += 4;
        }
    }
    return nBytes;
};

var _strLookupFn;

var init = function () {
    if ($.i18n) {
        $.i18n.properties({
            name: 'strings',
            path: '/static/scripts/rule/data/',
            mode: 'map',
            callback: function () {
                _strLookupFn = $.i18n.prop;

                // Add custom validation method maxlengthBytes.
                $.validator.addMethod('maxlengthBytes',
                            function maxlengthBytes(value, element, params) {
                                return (value.getUtf8Length() <= params);
                            },
                            $.validator.format(getString('validationText.maxlengthBytes')));
            }
        });
    }

};

var _isTwelveHourTime = true;

var getString = function (key) {
    var val, i;
    var substitues = undefined;

    if (!_strLookupFn) {
        throw new Error('Invalid state: Global string dictionary lookup function has not been initialized');
    }

    if (arguments.length > 1) {
        // Construct an array of string arguments to pass as the
        // second argument to the lookup function. These arguments
        // will be used as substitution arguments in key.
        substitues = [];
        for (i = 1; i < arguments.length; i++) {
            substitues.push(arguments[i]);
        }
    }

    val = _strLookupFn(key, substitues);
    return (Boolean(val) ? val : undefined);
};

/**
* Displays an error dialog box.
* @param {String} errorMessage A message to display
* @param {String | Object} details Technical details of the error. May be
*                           a string, Error object, or XMLHttpRequest
*                           object.
*/
var errorDialog = function (errorMessage, details) {
    var mDash = ' &#8212; ';
    var paraPrefx = '<p style="font-weight:bold">';
    var detailsTxt;

    $('#error_string').text(errorMessage);

    if (details) {
        if (typeof details === 'object') {
            if (Boolean(details.name) && Boolean(details.message)) {
                // details is an Error object
                detailsTxt = paraPrefx + getString('error.exceptionMessage') + '</p>' +
                                 details.name + mDash + details.message;
                // TODO: Get really fancy and append details.stack, if it is defined.
            }
            else if (details.readyState !== undefined) {
                // details is an XMLHttpRequest object - get the HTTP response
                if (details.readyState === 0) {
                    statusStr = getString('error.ajaxUninitialized');
                }
                else if (details.readyState === 1) {
                    statusStr = getString('error.ajaxUnsent');
                }
                else {
                    statusStr = details.status + mDash + details.statusText;
                }
                detailsTxt = paraPrefx + getString('error.deviceResponse') + '</p>' + statusStr;
            }
            else {
                // We have an error in our error handling!
                $.log('ERROR: Invalid details object passed to objectvideo.main.errorDialog');
                throw new Error('Invalid argument: details');
            }
        }
        else {
            // details is a string, or can be treated as a string.
            detailsTxt = details.toString();
        }

        $('#tech_error').html(detailsTxt);
        $('#error_text').accordion({ collapsible: true, active: false });
    }
    $('#error_dlg').dialog('open');
};

var assignDialogButtonIds = function (dlgId) {
    // Get the dialog container element.
    var dlgContainer = $('div.ui-dialog:has(#' + dlgId + ')');
    if (dlgContainer.length > 0) {
        // For each button in the buttonpane...
        $('.ui-dialog-buttonpane > :button', dlgContainer).each(function () {
            // ...created an id composed of the dialog id, '_btn_', and
            // the button's text, with spaces replaced by underscores.
            var label = $.trim($(this).text().toLowerCase());
            var suffix = label.replace(/\W/g, '_');
            this.id = dlgId + '_btn_' + suffix;
        });
    }
};

var fadeInOverlay = function (overlay, speed) {
    // Unfortunately, if we simply call "overlay.fadeIn(speed),"
    // the overlay will fade to 100% opacity, then suddenly flash
    // back down to the opacity of the background screen element.
    // In order to make this look like a smooth transition, we must
    // zero the opacity of the background screen, then show the overlay,
    // then fade the screen's opacity back to its original value.
    var opacity = parseFloat(overlay.css('opacity'));
    if (isNaN(opacity) || (opacity < 0.1) || (opacity > 0.9)) {
        opacity = 0.75;
    }
    overlay.css('opacity', '0.0').show().fadeTo(speed, opacity);
};

init();
objectvideo.getString = getString;
objectvideo.errorDialog = errorDialog;
objectvideo.assignDialogButtonIds = assignDialogButtonIds;
objectvideo.fadeInOverlay = fadeInOverlay;
objectvideo.isTwelveHourTime = _isTwelveHourTime;
objectvideo.keyCode = keyCode;
