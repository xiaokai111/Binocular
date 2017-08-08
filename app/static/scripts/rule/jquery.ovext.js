/**
* "The Software contains copyright protected material, trade secrets and other proprietary information 
* and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws, 
* international copyright treaties and trade secret laws, as well as other intellectual property laws and
* treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852, 
* 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
*/

/**
* @jquery.ovext.js
* ObjectVideo extensions to jQuery.
*
* @copyright Copyright 2008 ObjectVideo, Inc., all rights reserved.
* Software and information contained herein is confidential and
* proprietary to ObjectVideo, and any unauthorized copying,
* dissemination, or use is strictly prohibited. Restricted rights
* to use, duplicate, or disclose this code are granted through contract.
*/

(function ($) {

    /**
    * True if simplified logging is enabled, false otherwise.
    * @type {Boolean}
    * @private
    */
    var _loggingIsEnabled = false;

    /**
    * Name of the file used as an img src attribute by addBlockOverlay.
    * @type {String}
    * @private
    */
    var _blockedUIImage = '/img/rule/ajax-loader.gif';


    /**
    * The string dictionary lookup function used by replaceStrings.
    * @type {Object} A string dictionary lookup function, taking a single
    *                 argument of type string and returning a value of type
    *                 string. 
    */
    var _lookupFn = null;


    //
    // Initialize _lookupFn from jQuery.i18n plugin.
    //
    if (Boolean($.i18n) && (typeof $.i18n.prop === 'function')) {
        _lookupFn = $.i18n.prop;
    }


    /**
    * Returns the padding, in pixels, for the specified element.
    *
    * @param {Object} elt The element whose padding is to be determined.
    * @param {String} axis Either 'vertical', if the top and bottom padding
    *         is to be returned, or 'horizontal', if the left and right
    *         padding is to be returned.
    * @exception {Error} If axis is not 'vertical' or 'horizontal'.
    * @private
    */
    var getPadding = function (elt, axis) {
        var attr1, attr2;
        var total = 0;
        var padding;

        if (axis === 'vertical') {
            attr1 = 'padding-top';
            attr2 = 'padding-bottom';
        }
        else if (axis === 'horizontal') {
            attr1 = 'padding-left';
            attr2 = 'padding-right';
        }
        else {
            throw new Error('Invalid argument for parameter axis.');
        }

        padding = parseInt(elt.css(attr1), 10);
        if (!isNaN(padding)) {
            total += padding;
        }
        padding = parseInt(elt.css(attr2), 10);
        if (!isNaN(padding)) {
            total += padding;
        }
        return total;
    };


    /**
    * Adds a "UI blocked" overlay over the first matched element.
    *
    * @return The wrapped set.
    */
    $.fn.addBlockOverlay = function () {
        var overlayHtml = '<div class="ui_blocked_overlay"><img src="' +
                           _blockedUIImage + '" alt="" /></div>';
        var overlay, image;
        var pos;
        var width, height;
        var checkedRadios = null;

        if (this.size() > 0) {
            try {
                // Create the overlay div, then set its css properties.
                overlay = $(overlayHtml).css({
                    'display': 'none',
                    'position': 'absolute',
                    'background-color': 'white',
                    'opacity': '0.75',
                    'z-index': '10',
                    'left': '0',
                    'top': '0',
                    'width': '100%',
                    'height': '100%'
                });

                // Set css properties for the loader image inside the div.
                image = $('img', overlay);
                image.css({
                    'display': 'block',
                    'position': 'relative',
                    'top': '50%',
                    'margin-left': 'auto',
                    'margin-right': 'auto'
                });

                // Insert the overlay into the DOM.
                if (this.is('tr')) {
                    // Special case: Blocked element is a table row.
                    // Insert the overlay into the first cell of that row.
                    $('td:first', this).prepend(overlay);

                    // Get dimensions of element to be blocked.
                    pos = this.position();
                    width = this.width();
                    height = this.height();

                    // If the blocked element has padding, expand width
                    // and/or height values to cover the padding.
                    width += getPadding(this, 'horizontal');
                    height += getPadding(this, 'vertical');

                    // Position the overlay over the blocked element.
                    overlay.css('left', pos.left).css('top', pos.top)
                        .width(width).height(height);
                }
                else {
                    // store off radio button values for IE7 - IE7 loses track of
                    // what radio buttons are checked if they're moved around in
                    // the DOM, which we're about to do
                    if ($.support.msie && parseInt($.support.version, 10) === 7) {
                        checkedRadios = $('input:radio:checked', this);
                    }

                    // Normal case:
                    // Wrap the blocked element, then insert
                    // the overlay before the blocked element.
                    this.wrapAll('<div class="ui_blocked_wrapper" style="position: relative"></div>')
                        .eq(0).before(overlay);

                    // re-check radio buttons, if we stored them earlier
                    if (checkedRadios) {
                        $.each(checkedRadios, function (i, rb) {
                            $(rb).attr('checked', 'checked');
                        });
                    }
                }

                // Show the overlay.
                overlay.show();

                // Tweak image position by ensuring that its top margin
                // is the negative of half the image height.
                image.css('margin-top', (image.height() / -2) + 'px');
            }
            catch (ex) {
                if ($.log) {
                    $.log('ERROR: Could not display UI blocking overlay: ' + ex.message);
                }
            }
        }
        return this;
    };

    /**
    * Removes the "UI blocked" overlay from the first matched element.
    *
    * @return The wrapped set.
    */
    $.fn.removeBlockOverlay = function () {
        var blockedSelector, overlay;
        var checkedRadios = null;

        if (this.is('tr')) {
            $('.ui_blocked_overlay', this).remove();
        }
        else {
            // store off radio button values for IE7 - IE7 loses track of
            // what radio buttons are checked if they're moved around in
            // the DOM, which we're about to do
            if ($.support.boxModel && $.support.leadingWhitespace) {
                checkedRadios = $('input:radio:checked', this);
            }

            blockedSelector = this.selector;
            this.parents().filter('div.ui_blocked_wrapper').each(function () {
                var overlay = $(this);
                // Find only the overlay that covers the current wrapped set. 
                if (overlay.children(blockedSelector).length > 0) {
                    // Move the overlay's children, except for div.ui_blocked_overlay,
                    // out of the overlay, then remove the overlay element.
                    overlay.after(overlay.children().not('div.ui_blocked_overlay')).remove();
                    return false;
                }
            });

            // re-check radio buttons, if we stored them earlier
            if (checkedRadios) {
                $.each(checkedRadios, function (i, rb) {
                    $(rb).attr('checked', 'checked');
                });
            }
        }

        return this;
    };


    /**
    * Returns the id of the first tr element, if any, that is the ancestor of
    * this element.
    * @return {String} The id of the first tr element, if any, that is the
    *                   ancestor of this element or '' if no such element
    *                   is found.
    */
    $.fn.ancestorRowId = function () {
        var row = $(this).closest('tr');
        return ((row.length > 0) ? row[0].id : '');
    };


    /**
    * Substitutes text, alt, summary, and title attributes on the wrapped
    * element and all of its children with values looked up from a lookup
    * function. The function attempts to substitute text on elements that have
    * the class ov_replace_text.
    * In each case, the element's text, alt, and/or title is used as a lookup
    * key into a string dictionary lookup function. If a string value is
    * found, it is then used to replace the element's text, alt, and/or title
    * attribute. 
    *
    * @return {Object} The wrapped set.
    */
    $.fn.replaceStrings = function replaceStrings() {
        var TEXT_NODE = 3;
        var key, val;

        /**
        * Convert numeric character entity references to the actual
        * character codes they represent.
        * @param {String} text The text to parse for numeric character entities.
        * @return {String} A copy of text, with any character entity references
        *          replaced with corresponding single character codes.
        */
        function convertEntities(text) {
            return text.replace(/\&\#(\d+);/g, function (ent, captureGroup) {
                var num = parseInt(captureGroup, 10);
                return String.fromCharCode(num);
            });
        }

        /**
        * Helper function to replace the value of the specified node
        * if it is a text node and if its value successfully looks up
        * a substitute string.
        * @param {Object} node a DOM Level 1 Node
        */
        function replaceTextNode(node) {
            if (node.nodeType === TEXT_NODE) {
                key = $.trim(node.nodeValue);
                if (key) {
                    val = _lookupFn(key);
                    if (val) {
                        node.nodeValue = convertEntities(val);
                    }
                }
            }
        }

        /**
        * Helper function to replace the value of the specified attribute on
        * the specified element if the existing attribute value successfully
        * looks up a substitute string. 
        * @param {Object} elt A jQuery wrapped element.
        * @param {Object} attribute The name of the attribute on which to
        *                  perform text substitution.
        */
        function replaceAttribute(elt, attribute) {
            key = elt.attr(attribute);
            if (key) {
                val = _lookupFn(key);
                if (val) {
                    elt.attr(attribute, val);
                }
            }
        }

        // Assert that we have initialized the lookup function.
        if (!_lookupFn) {
            throw new Error('Invalid state: i18n lookup function has not been initialized');
        }

        // For each contained element having the marker class...
        $('.ov_replace_text', this).each(function () {
            var wrappedElt;

            // If this element or any of its immediate children are
            // text nodes, attempt text substitution.
            replaceTextNode(this);
            $.each(this.childNodes, function () {
                replaceTextNode(this);
            });

            // Attempt text substitution val, if it exists.
            wrappedElt = $(this);
            key = wrappedElt.val();
            if (key) {
                val = _lookupFn(key);
                if (val) {
                    wrappedElt.val(val);
                }
            }

            // Attempt text substitution on alt, summary,
            // and title attributes, if they exist.
            replaceAttribute(wrappedElt, 'alt');
            replaceAttribute(wrappedElt, 'summary');
            replaceAttribute(wrappedElt, 'title');
        });

        return this;
    };


    /**
    * Restricts the number of characters that can be typed into the wrapped
    * element, assuming that the characters will be UTF-8 encoded.
    * This function depends on String extension getUtf8Length.
    * @param maxBytes {Number} The number of bytes of UTF-8 encoded input to
    *         which the wrapped element will be limited.
    * @param counterElt Optional. If specified, an element that will updated
    *         to display the number of allowed bytes remaining.
    * @return {Object} The wrapped set.
    * @see String.getUtf8Length#
    */
    $.fn.limitUtf8Input = function limitUtf8Input(maxBytes, counterElt) {
        var that = this[0];

        function updateCounter() {
            var remaining;
            if (counterElt) {
                remaining = maxBytes - that.value.getUtf8Length();
                $(counterElt).text(remaining.toString());
            }
        }

        this.keypress(function (event) {
            if ((!event.ctrlKey) && (!event.metaKey) &&
                        (event.which >= 0x20) &&
                        this.value.getUtf8Length() >= maxBytes) {
                event.preventDefault();
            }
        })
            .keyup(function (event) {
                var val = this.value;
                if (val.getUtf8Length() > maxBytes) {
                    while (val.getUtf8Length() > maxBytes) {
                        val = val.slice(0, -1);
                    }
                    this.value = val;
                }
                updateCounter();
            })
            .change(function () {
                updateCounter();
            });

        updateCounter();

        return this;
    };


    /**
    * Scrolls the window so that the specified document coordinates are
    * visible in the window (i.e., viewport).
    *
    * If the specified coordinates describe a rectangle wider than the width
    * of the window or taller than the height of the window, the left and/or
    * top edge will be scrolled into view.
    *
    * @param {Number} left Left position as a number of pixels relative to the document.
    * @param {Number} top Top position as a number of pixels relative to the document.
    * @param {Number} right Right position as a number of pixels relative to the document.
    * @param {Number} bottom Bottom position as a number of pixels relative to the document.
    */
    $.scrollIntoView = function (left, top, right, bottom) {
        var wnd = $(window);
        var hScrollPos = wnd.scrollLeft();
        var vScrollPos = wnd.scrollTop();

        if (left < hScrollPos) {
            // Scroll to the left to ensure that the left edge is in view.
            wnd.scrollLeft(left);
        }
        else if (right > hScrollPos + wnd.width()) {
            // Scroll to the right to ensure that the right edge is at
            // the right side of the window, plus a few extra pixels.
            wnd.scrollLeft(right - wnd.width() + 5);
        }

        if (top < vScrollPos) {
            // Scroll so that top edge is at top of window.
            wnd.scrollTop(top);
        }
        else if (bottom > vScrollPos + wnd.height()) {
            // Scroll down until bottom edge is at the bottom
            // of window, plus a few extra pixels for padding.
            wnd.scrollTop(bottom - wnd.height() + 5);
        }
    };


    // Define function $.debug, if it doesn't already exist.
    if ($.debug === undefined) {
        /**
        * Enables or disables simplified logging.
        * @param {Boolean} isEnabled True if simplified logging is to be
        *                   turned on, false if it is to be turned off.
        */
        $.debug = function (isEnabled) {
            var wasEnabled = _loggingIsEnabled;
            _loggingIsEnabled = Boolean(isEnabled);
            return wasEnabled;
        };
    }


    // Define function $.log, if it doesn't already exist.
    if ($.log === undefined) {
        /**
        * Writes a message to the browser's error console, if it exists.
        * @param {String | Object} message The message to write to the console.
        */
        $.log = function (message) {
            if (_loggingIsEnabled && (window.console)) {
                if (window.console.debug) {
                    window.console.debug(message);
                }
                else if (window.console.log) {
                    window.console.log(message);
                }
            }
        };
    }

})(jQuery);

