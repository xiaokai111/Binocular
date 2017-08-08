/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws,
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852,
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
 * @file snapshot_controller.js
 * snapshot module, controller object
 */

if (objectvideo.snapshot === undefined) {
    objectvideo.snapshot = {};
}

(function($) {
    /**
     * Returns a new snapshot controller instance.
     * @return {Object} A snapshot controller object.
     */
    objectvideo.snapshot.controller = function() {
        var _width=352;
        var _height=288;
        
        /**
         * objectvideo.snapshot.snapshotPlayer object.
         * @type {Object}
         */
        var _snapPlayer = null;

        /**
         * objectvideo.snapshot.markupCanvas object for drawing static shapes.
         * @type {Object}
         * @see _drawingCanvas
         */
        var _staticCanvas = null;

        /**
         * objectvideo.snapshot.markupCanvas object for drawing user-interactive shapes.
         * @type {Object}
         * @see _staticCanvas
         */
        var _drawingCanvas = null;

        /**
         * Size of the markup pane before it is expanded.
         * @type {Object}
         */
        var _savedMarkupSize = null;

        /**
         * Information about a drawing operation.
         * @type {Object}
         */
        var _drawInfo = {
            /**
             * True if we have processed a left button mouse down event
             * since the last left button mouse up event.
             * @type {Boolean}
             */
            isMouseLeftDown: false,

            /**
             * True if we have processed a right button mouse down event
             * since the last right button mouse up event.
             * @type {Boolean}
             */
            isMouseRightDown: false,

            /**
             * The value of event.which from the most recent mouseup event.
             * This value can be used to determine whether a click event
             * is for the left or right mouse button.
             * @type {Number}
             */
            lastMouseUpButton: undefined,

            /**
             * True if in drag mode, false otherwise.
             * @type {Boolean}
             */
            isDragging: false,

            /**
             * The index of the control point on the shape being dragged.
             * @type {Number}
             */
            controlIndex: -1,

            /**
             * The last point from a mouse move event.
             * @type {Object}
             */
            lastPt: null,

            /**
             * An arrays of point objects specifiying the event defintion
             * shape coordinates, in canvas coordinates, for the markup
             * being created/edited.
             */
            points: [],

            baseSetStart: function(pt, hitInfo) {
                if ((! pt) || (pt.x === undefined)) {
                    throw new Error('Invalid argument pt');
                }

                this.isMouseLeftDown = true;
                this.points = [ pt ];
                if (hitInfo) {
                    this.controlIndex = (hitInfo.isInControl ? hitInfo.controlIndex : -1);
                }
            },

            baseReset: function() {
                this.isMouseLeftDown = false;
                this.isMouseRightDown = false;
                this.isDragging = false;
                this.controlIndex = -1;
                this.points = [];
                this.lastPt = null;
            },

            startPoint: function() {
                return (this.points.length > 0) ? this.points[0] : null;
            },

            endPoint: function() {
                if (this.points.length > 0) {
                    return this.points[this.points.length - 1];
                }
                return null;
            },

            setEndPoint: function(pt) {
                this.points[1] = pt;
            },

            scalePoints: function(oldWidth, oldHeight, newWidth, newHeight) {
                var i, pt;

                for (i = 0; i < this.points.length; i++) {
                    pt = this.points[i];
                    pt.x = (pt.x / oldWidth) * newWidth;
                    pt.y = (pt.y / oldHeight) * newHeight;
                    this.points[i] = pt;
                }

                if (this.lastPt) {
                    this.lastPt.x = (this.lastPt.x / oldWidth) * newWidth;
                    this.lastPt.y = (this.lastPt.y / oldHeight) * newHeight;
                }
            }
        };


        // Return the actual controller object.
        return {
            /**
             * Initializes this object's staticCanvas and drawingCanvas fields.
             * @param {Object} snapshotPlayer A snapshotPlayer object.
             * @return {Object} This object
             */
            init: function(snapshotPlayer) {
                var canvasElt;

                // Initialize snapshot marker canvas.
                if (window.G_vmlCanvasManager) {
                    try {
                        // Re-create the canvas element via the excanvas library.
                        canvasElt = document.createElement('canvas');
                        canvasElt.setAttribute('id', 'snapshot_markup');
                        canvasElt.setAttribute('width', _width);
                        canvasElt.setAttribute('height', _height);
                        canvasElt = G_vmlCanvasManager.initElement(canvasElt);
                        $('#snapshot_markup').after($(canvasElt)).remove();
                    }
                    catch (ex) {
                        $.log('Error initializing Explorer Canvas: ' + ex.name + ' - ' + ex.message);
                        canvasElt = null;
                    }
                }
                else {
                    canvasElt = $('#snapshot_markup')[0];
                }
                _staticCanvas = objectvideo.snapshot.markupCanvas($(canvasElt));

                // Initialize the interactive drawing canvas.
                if (window.G_vmlCanvasManager) {
                    try {
                        // Re-create the canvas element via the excanvas library.
                        canvasElt = document.createElement('canvas');
                        canvasElt.setAttribute('id', 'snapshot_interactive_drawing');
                        canvasElt.setAttribute('width', _width);
                        canvasElt.setAttribute('height', _height);
                        canvasElt = G_vmlCanvasManager.initElement(canvasElt);
                        $('#snapshot_interactive_drawing').after($(canvasElt)).remove();
                    }
                    catch (ex) {
                        $.log('Error initializing Explorer Canvas: ' + ex.name + ' - ' + ex.message);
                        if (ex.stack) {
                            $.log(ex);
                        }
                        canvasElt = null;
                    }
                }
                else {
                    canvasElt = $('#snapshot_interactive_drawing')[0];
                }
                _drawingCanvas = objectvideo.snapshot.markupCanvas($(canvasElt));

                _snapPlayer = snapshotPlayer;
                _snapPlayer.update();
            },


            /**
             * Gets this object's snapshotPlayer object.
             * @return {Object} The snapshotPlayer object passed to the init method.
             * @see init#
             */
            snapPlayer: function() {
                return _snapPlayer;
            },


            /**
             * Gets the markupCanvas for drawing static shapes.
             * @type {Object} An instance of objectvideo.snapshot.markupCanvas
             * @see drawingCanvas#
             * @see init#
             */
            staticCanvas: function() {
                return _staticCanvas;
            },


            /**
             * Gets the markupCanvas for drawing user-interactive shapes.
             * @type {Object} An instance of objectvideo.snapshot.markupCanvas
             * @see staticCanvas#
             * @see init#
             */
            drawingCanvas: function() {
                return _drawingCanvas;
            },


            /**
             * Gets this object's drawInfo data.
             * @return {Object} A drawInfo object.
             */
            drawInfo: function() {
                return _drawInfo;
            },


            /**
             * Gets the saved markup size.
             * @return {Object} A size object.
             * @see setSavedMarkupSize#
             */
            getSavedMarkupSize: function() {
                return _savedMarkupSize;
            },


            /**
             * Sets the saved markup size.
             * @param {Number} w Width
             * @param {Number} h Height
             * @see getSavedMarkupSize#
             */
            setSavedMarkupSize: function(w, h) {
                _savedMarkupSize = {
                        width: w,
                        height: h
                    };
            },


            /**
             * Creates a new point object whose coordinates are constrained to
             * canvas coordinates.
             * @param {Number} x The unconstrained x-axis page coordinate of the point.
             * @param {Number} y The unconstrained y-axis page coordinate of the point.
             * @return {Object} A new point object whose coordinates are non-negative
             *                   integers no greater than the width or height of the
             *                   drawing canvas, relative to the top, left corner of
             *                   the canvas.
             */
            createCanvasPoint: function(x, y) {
                var offset, dCanvas;

                if (isNaN(x)) {
                    throw new Error('Invalid argument: x is not a number');
                }
                if (isNaN(y)) {
                    throw new Error('Invalid argument: y is not a number');
                }

                // Offset the point relative to the interactive drawing canvas.
                offset = $('#snapshot_interactive_drawing').offset();

                // Use Math.min to choose the smaller of x/y and canvas width/height,
                // then Math.max to choose the larger of x/y and zero, then
                // use Math.round to get a whole number.
                dCanvas = this.drawingCanvas();
                return objectvideo.geometry.createPoint(
                    Math.round(Math.max(0, Math.min(dCanvas.width(), x - offset.left))),
                    Math.round(Math.max(0, Math.min(dCanvas.height(), y - offset.top))));
            },


            /**
             * Calculates the size of an expanded markup area based on
             * the size of the browser window.
             * @return {Object} A size object containing numeric properties
             *          width and height.
             */
            getExpandedMarkupSize: function() {
                var borderWidth = 32;   // width of .rborder_vertical * 2
                var borderHeight = 32;  // height of .rborder_horizontal * 2
                var borderPadding = 10; // extra padding outside borders
                var extraBottomPadding = 20; // extra padding at bottom of window
                var markupPane = $('#markup_pane');
                var snapshotFrame = $('#snapshot_frame');
                var paddingW, paddingH;

                var size = {
                    width:  0,
                    height: 0
                };

                var oldSize = {
                        width:  snapshotFrame.width(),
                        height: snapshotFrame.height()
                    };

                paddingW = markupPane.width() - snapshotFrame.width();
                paddingH = markupPane.height() - snapshotFrame.height();

                // Calculate whether to leave extra space beneath border.
                if (($('#markup_error_message').is(':visible')) ||
                        ($('#markup_warning_message').is(':visible')) ||
                        ($('#markup_hint_message').is(':visible'))) {
                    extraBottomPadding = 0;
                }

                // Calculate full frame height, then scale width accordingly.
                size.height = Math.floor($(window).height() - markupPane.offset().top -
                    paddingH - borderHeight - borderPadding - extraBottomPadding);
                size.width = Math.floor(oldSize.width * (size.height / oldSize.height));
                if (size.width + markupPane.offset().left + paddingW + borderWidth > $(window).width()) {
                    // Scaled width is too wide, so instead calculate
                    // full frame width, then scale height accordingly.
                    size.width = Math.floor($(window).width() - markupPane.offset().left -
                        paddingW - borderWidth - borderPadding);
                    size.height  = Math.floor(oldSize.height * (size.width / oldSize.width));
                }

                return size;
            },


            /**
             * Enables or disables the expand markup icon based on
             * the size of the browser window. The expand_snapshot icon/button
             * will be disabled if the expanded markup size would be either shorter
             * or narrower than the size of the default markup content area.
             * @return {Object} This object.
             * @see getExpandedMarkupSize#
             */
            resetExpandButton: function() {
                var size = this.getExpandedMarkupSize();
                var snapshotFrame = $('#snapshot_frame');

                if ((size.height > (snapshotFrame.height() * 1.25)) ||
                        (size.width > (snapshotFrame.width() * 1.25))) {
                    $('#expand_snapshot').removeClass('disabled');
                }
                else {
                    $('#expand_snapshot').addClass('disabled');
                }
                return this;
            },


            /**
             * Toggles between normal page layout and expanded rule
             * snapshot/markup layout.
             * @param {Boolean} isExpanding True if the expanded markup should be
             *                   shown, false if the expanded markup should be hidden.
             */
            toggleExpandedMarkupMode: function(isExpanding) {
                var that = this;
                var borderWidth = 32;   // width of .rborder_vertical * 2
                var borderPadding = 10; // extra padding outside borders
                var markupPane = $('#markup_pane');
                var markupContent = $('#markup_content');
                var snapshotFrame = $('#snapshot_frame');
                var newSize, oldSize;
                var fxDuration = 'normal';
                var expandedWidth, expandedHeight;
                var imgBorderWidth = snapshotFrame.outerWidth() - snapshotFrame.width();

                oldSize = {
                        width:  snapshotFrame.width(),
                        height: snapshotFrame.height()
                    };

                // Calculate new position and sizes.
                if (isExpanding) {
                    // Save frame size for later, when we restore.
                    that.setSavedMarkupSize(oldSize.width, oldSize.height);

                    newSize = that.getExpandedMarkupSize();

                    // Exit immediately if the new size is somehow not
                    // larger than the existing size.
                    if ((newSize.height <= oldSize.height) || (newSize.width <= oldSize.width)) {
                        return;
                    }

                    // Set explicit width and height for #expanded_markup_frame,
                    // so that border elements will size correctly.
                    expandedWidth = $('#edit_snapshot_pane').width() +
                        $('#tool_palette').outerWidth(true) - snapshotFrame.width() +
                        newSize.width + borderWidth + borderPadding;
                    expandedHeight = $('#edit_snapshot_pane').height() -
                        snapshotFrame.height() + newSize.height + borderPadding;
                    $('#expanded_markup_frame').width(expandedWidth)
                        .height(expandedHeight);
                    $('#expand_snapshot').addClass('collapse_snapshot');
                }
                else {
                    newSize = that.getSavedMarkupSize();
                    $('#expand_snapshot').removeClass('collapse_snapshot');
                }

                // Show/hide the overlay.
                if (isExpanding) {
                    $('#expanded_markup_overlay').show();
                    objectvideo.fadeInOverlay($('#markup_overlay_screen'), fxDuration);
                }
                else {
                    $('#markup_overlay_screen').fadeOut(fxDuration, function() {
                            $('#expanded_markup_overlay').hide();
                        });
                }

                // Hide the markupContent via a custom animation.
                // Notes:
                //  - Setting queue: false will cause the animation to run in
                //    parallel with the call above to fade the overlay in/out.
                //  - Callback function 'complete' performs the actual DOM
                //    manipulation to expand/shrink markup.
                markupContent.animate({ opacity: 'hide' }, {
                        duration: fxDuration,
                        queue:    false,

                        complete: function() {
                            var offset;

                            // Transform coordinates of any existing points in drawInfo.
                            that.drawInfo().scalePoints(oldSize.width, oldSize.height,
                                                                   newSize.width, newSize.height);

                            if (isExpanding) {
                                // Move the element into the overlay,
                                // then position its new container.
                                offset = markupPane.offset();
                                $('#expanded_markup_pane').append($(this));
                                $('#filters_pane').fadeOut();
                                markupPane.hide();
                                $('#expanded_markup_frame').css({
                                            top:  Math.floor(offset.top) + 'px',
                                            left: Math.floor(offset.left) + 'px'
                                        });
                            }
                            else {
                                // Move the element into markupPane.
                                markupPane.prepend($(this));
                                markupPane.show();
                                $('#filters_pane').fadeIn();
                            }

                            // Resize the snapshot pane elements.
                            snapshotFrame.width(newSize.width).height(newSize.height);
                            _snapPlayer.setDimensions(newSize.width, newSize.height);

                            if (window.G_vmlCanvasManager) {
                                // Explicitly resize the excanvas-created div inside the canvas element.
                                $('#snapshot_markup > div').width(newSize.width).height(newSize.height);
                                $('#snapshot_interactive_drawing > div').width(newSize.width).height(newSize.height);
                            }

                            that.setDimensions(newSize.width, newSize.height).redraw();

                            $('#markup_and_filters_pane').css('max-width', Math.floor(newSize.width * 1.5));
                            $('#markup_error_message').width(newSize.width + imgBorderWidth);
                            $('#snapshot_actions_pane').width(newSize.width + imgBorderWidth);
                            $('#edit_snapshot_pane').width(newSize.width + imgBorderWidth);

                            // Show the element again.
                            $(this).fadeIn(fxDuration);
                        }
                    });
            },


            /**
             * Sets the dimensions for the static and drawing canvases.
             * @param {Number} width Width in pixels.
             * @param {Number} height Height in pixels.
             * @return {Object} This object.
             */
            setDimensions: function(width, height) {
                var snapshot = $('#snapshot');
                var snapshotFrame = $('#snapshot_frame');
                var frameWidth, frameOuterWidth, frameHeight;

                if (typeof width !== 'number' || isNaN(width)) {
                    throw new Error('setDimensions - invalid argument: width is not a number');
                }
                if (typeof height !== 'number' || isNaN(height)) {
                    throw new Error('setDimensions - invalid argument: height is not a number');
                }

                // Set frame size to snapshot size, plus borders (if any)
                frameWidth = width + (snapshot.outerWidth() - snapshot.width());
                frameHeight = height + (snapshot.outerHeight() - snapshot.height());
                snapshotFrame.width(frameWidth).height(frameHeight);

                // Set the snapshot element sizes to the frame's outer width and height.
                frameOuterWidth = snapshotFrame.outerWidth();
                $('#edit_snapshot_pane').width(frameOuterWidth);

                if (_staticCanvas) {
                    _staticCanvas.setDimensions(width, height);
                    if (window.G_vmlCanvasManager) {
                        $('#snapshot_markup > div').width(width).height(height);
                    }
                }

                if (_drawingCanvas) {
                    _drawingCanvas.setDimensions(width, height);
                    if (window.G_vmlCanvasManager) {
                        $('#snapshot_interactive_drawing > div').width(width).height(height);
                    }
                }

                // Explicitly set width of snapshot_actions_pane to center contained text.
                $('#snapshot_actions_pane').width(frameOuterWidth);

                if (_snapPlayer) {
                    _snapPlayer.update();
					_snapPlayer.setDimensions(width,height);
                }

                return this;
            },


            /**
             * Redraws both static and drawing canvases.
             * @return {Object} This object.
             */
            redraw: function() {
                if (_staticCanvas) {
                    _staticCanvas.redraw();
                }
                if (_drawingCanvas) {
                    _drawingCanvas.redraw();
                }
                return this;
            },


            /**
             * Redraws both static and drawing canvases.
             * @return {Object} This object.
             */
            show: function() {
                if (_staticCanvas) {
                    _staticCanvas.show();
                }
                if (_drawingCanvas) {
                    _drawingCanvas.show();
                }
                return this;
            },


            /**
             * 根据传入的值更改线的宽度.
             * @param {Number} thickness 线的粗细值.
             * @{Object} This markupCanvas object.
             * @exception {Error} 如果传入的值并非数字或值小于1
             */
            setLineThickness: function (thickness) {
                if (isNaN(thickness)||thickness<1) {
                    throw new Error('Invalid argument: thickness');
                }
				if (_staticCanvas) {
				    _staticCanvas.setLineThickness(thickness);
					_staticCanvas.show();
				}
				//if (_drawingCanvas) {
				//    _drawingCanvas.setLineThickness(thickness);
				//	_drawingCanvas.show();
				//}
				return this;
			}
        };
    };
})(jQuery);

