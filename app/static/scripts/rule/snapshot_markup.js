/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information 
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws, 
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852, 
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 * 包含了对坐标点的标记
 */

/**
 * @file snapshot_markup.js
 * The markupCanvas object. 
 */

if (objectvideo.snapshot === undefined) {
    objectvideo.snapshot = {};
}

(function($) {

    /**
     * Pre-evaluate this to avoid calculations.
     */
    var TwoPI = Math.PI*2.0;
    
    /**
     * Number of pixels to inset the head or foot of the person calibration
     * shape by.
     */
    var SampleShapeHeadFootInset = 2;
    
    ////////////////////////////////////////////////////////////////
    // "Import" objectvideo objects
    ////////////////////////////////////////////////////////////////

    /**
     * "Import" of objectvideo.ovready.eventDefObjectTypes.
     */
    var eventDefObjectTypes = objectvideo.ovready.eventDefObjectTypes;

    /**
     * "Import" of objectvideo.ovready.tripwireDirections enumeration.
     * @type {Object}
     */
    var tripwireDirections = objectvideo.ovready.tripwireDirections;

    /**
     * "Import" of objectvideo.geometry.rectDirection.
     */
    var rectDirection = objectvideo.geometry.rectDirection;

    /**
     * "Import" of objectvideo.geometry.createSize.
     */
    var createSize = objectvideo.geometry.createSize;

    /**
     * "Import" of objectvideo.geometry.createPoint.
     */
    var createPoint = objectvideo.geometry.createPoint;

    /**
     * "Import" of objectvideo.geometry.createRectangle.
     */
    var createRectangle = objectvideo.geometry.createRectangle;

    /**
     * "Import" of objectvideo.geometry.createCircle.
     */
    var createCircle = objectvideo.geometry.createCircle;

    ////////////////////////////////////////////////////////////////
    // Drawing style settings 
    ////////////////////////////////////////////////////////////////

    /**
     * A collection of drawing styles for tripwires.
     * @property
     * @type {Object}
     * @private
     */
    var _tripwireSettings = {
            enabledStroke:   'rgb(255,   0,   0)',
            enabledFill:     'rgb(255,   0,   0)',
            disabledStroke: 'rgba(255, 185, 185, 0.4)',
            disabledFill:   'rgba( 85,  85,  85, 0.3)',
            thickness:      2.0,
            arrow:          {
                enabledStroke:   'rgb(255, 255, 255)',
                disabledStroke: 'rgba(255, 255, 255, 0.25)',
                enabledFill:     'rgb(255, 175,   0)', // orange
                disabledFill:   'rgba(255, 228, 181, 0.25)'
            }
        };

    /**
     * A collection of drawing styles for AOI polygons.
     * @property
     * @type {Object}
     * @private
     */
    var _aoiSettings = {
            disabledStroke:   'rgba(255, 255, 255, 0.7)',
            disabledFill:     'rgba( 90, 200, 200, 0.1)',
            enabledStroke:    'rgba(255,   0,   0, 0.8)',
            enabledFill:      'rgba(  0, 200, 200, 0.2)',
            thickness:        1.0,
            segmentThickness: 2.0
        };
        
    /**
     * A collection of drawing styles for full frame AOI.
     * @property
     * @type {Object}
     * @private
     */
    var _fullFrameSettings = {
            enabledStroke:    'rgba(255,   0,   0, 0.7)',
            enabledFill:      'rgba(  0, 200, 200, 0.1)',
            thickness:        4.0
        };
        
    /**
     * A collection of drawing styles for PersonSamples.
     * @property
     * @type {Object}
     * @private
     */
    var _personSampleSettings = {
            unselectedStroke:   'rgba(255, 0, 0, 0.7)',
            selectedStroke:    'rgba(255,   0,   0, 0.8)',
            unselectedThickness:        1.0,
            selectedThickness: 2.0,
            unselectedHeadStroke: 'rgba(255, 0, 0, 0.7)',
            selectedHeadStroke: 'rgba(255,   0,   0, 0.8)',
            unselectedFootStroke: 'rgba(0, 0, 255, 0.75)',
            selectedFootStroke: 'rgba(0,   0,   255, 0.85)',
            unselectedCrosshairStroke: 'rgba(225, 225, 225, 0.8)',
            selectedCrosshairStroke: 'rgba(225, 225, 225, 0.9)',
            crosshairThickness:        1.0,
            headRadius:    0.03,
            footLength:    0.03
        };

    /**
     * A collection of drawing styles for selection control points.
     * @property
     * @type {Object}
     * @private
     */
    var _controlPointSettings = {
            outerStroke: 'black',
            innerStroke: 'white',
            fill:        'yellow',
            size:        5.0
        };

    /**
     * A collection of drawing styles for filter rects.
     * @property
     * @type {Object}
     * @private
     */
    var _filterSettings = {
            nearStroke: 'rgba(255,   0,   0, 0.67)',
            nearFill:   'rgba(255,   0,   0, 0.25)',
            farStroke:  'rgba(  0,   0, 255, 0.67)',
            farFill:    'rgba(  0,   0, 255, 0.25)',
            midStroke:'rgba(255,255,0,0.67)',
            midFill:'rgba(255,255,0,0.25)',
            thickness:  3.0
        };


    ////////////////////////////////////////////////////////////////
    // Enums
    ////////////////////////////////////////////////////////////////
    var filterRectIndex = {
        near: 0,
        far:  1,
        mid:2
    };


    ////////////////////////////////////////////////////////////////
    // Helper functions
    // Not exported, but used by closures in this module
    ////////////////////////////////////////////////////////////////

    /**
     * Draws selection control handle rectangles at each rectangle specified
     * in the array.
     * @param {Object} The CanvasRenderingContext2D object on which to draw.
     * @param {Array} handles An array of rectangle objects in canvas coordinates.
     */
    var drawControlHandles = function(canvasCtx, handles) {
        if (handles.length >= 2) {
            canvasCtx.save();

            // Set drawing styles
            canvasCtx.fillStyle = _controlPointSettings.fill;
            canvasCtx.lineWidth = 1.0;

            $.each(handles, function() {
                    canvasCtx.fillRect(this.x, this.y, this.width, this.height);
    
                    canvasCtx.strokeStyle = _controlPointSettings.innerStroke;
                    canvasCtx.strokeRect(this.x, this.y, this.width, this.height);
    
                    canvasCtx.strokeStyle = _controlPointSettings.outerStroke;
                    canvasCtx.strokeRect(this.x - 1, this.y - 1,
                                         this.width + 2, this.height + 2);
                });

            canvasCtx.restore();
        }
    };


    /**
     * Draws selection control handle rectangles at each point specified
     * in the points array.
     * @param {Object} The CanvasRenderingContext2D object on which to draw.
     * @param {Array} points An array of point objects, having numeric
     *                 properties x and y, in canvas coordinates.
     */
    var drawControlPoints = function(canvasCtx, points) {
        var offset = Math.round(_controlPointSettings.size / 2);
        var handles = [];

        if (points.length >= 2) {
            $.each(points, function() {
                    handles.push(createRectangle(this.x - offset,
                                                 this.y - offset,
                                                 _controlPointSettings.size,
                                                 _controlPointSettings.size));
                });
            drawControlHandles(canvasCtx, handles);
        }
    };


    ////////////////////////////////////////////////////////////////
    // filterShape closure
    // Not exported, but used by markupCanvas
    ////////////////////////////////////////////////////////////////

    /**
     * Creates a new filterShape object for the specified rectangles.
     * @param {Object} nearRect A rectangle object.
     * @param {Object} farRect A rectangle object.
     * @param {Number} width Canvas width 
     * @param {Number} height Canvas height
     * @return {Object} A filterShape object or null.
     */
   var createFilterShape = function(nearRect, farRect, width, height,midRect) {
        var MIN_NEAR_SIZE = 0.0625;
        var MIN_MID_SIZE=0.05;
        var MIN_FAR_SIZE  = 0.046875;
        var _canvasWidth = width;
        var _canvasHeight = height;
        var _rects = [];

        /**
         * Creates a new filter rectangle object based on the specified rectangle.
         * @param {Object} normalizedRect A rectangle object whose coordinates,
         *                  width, and height are normalized in the range 0.0 to 1.0.
         * @param {Number} minWidth The smallest width permitted when resizing this rectangle.
         * @param {Number} minHeight The smallest height permitted when resizing this rectangle.
         * @param {Number} lineWidth Thickness of the line to draw as the rectangle's outline.
         * @param {String} fillStyle Fill style used when drawing the rectangle.
         * @param {String} strokeStyle Stroke style to use when drawing the rectangle.
         * @return {Object} A filter rectangle object.
         */
        var createFilterRect = function(normalizedRect, minWidth, minHeight,
                                         lineWidth, fillStyle, strokeStyle) {
            var _filterRect = {
                /**
                 * The filter rectangle outline.
                 */
                outerRect: createRectangle(),

                /**
                 * Canvas coordinates of rectangle's control handles.
                 */
                controlHandles: [],


                /**
                 * Creates a new rectangle object offset by the specified
                 * amounts from the top, left corner of outerRect and having
                 * width and height _controlPointSettings.size.
                 * @param {Number} xOffset
                 * @param {Number} yOffset
                 * @return {Object} A rectangle object
                 * @private
                 */
                createControlHndlRect : function(xOffset, yOffset) {
                    var centerOffset = Math.round(_controlPointSettings.size / 2);
                    var x = this.outerRect.x + xOffset - centerOffset;
                    var y = this.outerRect.y + yOffset - centerOffset;
                    if (isNaN(x)) {
                        $.log('x is NaN. this.outerRect.x: ' + this.outerRect.x + ', xOffset: ' + xOffset + ', centerOffset: ' + centerOffset);
                    }
                    if (isNaN(y)) {
                        $.log('y is NaN. this.outerRect.y: ' + this.outerRect.y + ', yOffset: ' + yOffset + ', centerOffset: ' + centerOffset);
                    }
                    return createRectangle(x, y, _controlPointSettings.size, _controlPointSettings.size);                    
                },

                /**
                 * Populates this filter rectangle's arry of control handle rectangles.
                 */
                createControlHandles: function() {
                    this.controlHandles = [
                            // 0: top, left
                            this.createControlHndlRect(0, 0),
                            // 1: top, middle
                            this.createControlHndlRect(Math.round(this.outerRect.width / 2), 0),
                            // 2: top, right
                            this.createControlHndlRect(this.outerRect.width, 0),
                            // 3: middle, right
                            this.createControlHndlRect(this.outerRect.width,
                                                        Math.round(this.outerRect.height / 2)),
                            // 4: bottom, right
                            this.createControlHndlRect(this.outerRect.width,
                                                       this.outerRect.height),
                            // 5: bottom, middle
                            this.createControlHndlRect(Math.round(this.outerRect.width / 2),
                                                       this.outerRect.height),
                            // 6: bottom, left
                            this.createControlHndlRect(0, this.outerRect.height),
                            // 7: left, middle
                            this.createControlHndlRect(0, Math.round(this.outerRect.height / 2))
                        ];
                },

                /**
                 * Scales this filter rectangle's canvas coordinates based on the given
                 * width and height.
                 * @param {Number} newWidth New canvas width
                 * @param {Number} newHeight New canvas height
                 * @private
                 */
                scale: function(newWidth, newHeight) {
                    this.outerRect.x  = Math.round(normalizedRect.x * newWidth);
                    this.outerRect.y  = Math.round(normalizedRect.y * newHeight);
                    this.outerRect.width  = Math.round(normalizedRect.width * newWidth);
                    this.outerRect.height = Math.round(normalizedRect.height * newHeight);

                    this.outerRect.setBoundsRect(createRectangle(5, 5, newWidth - 5, newHeight - 5));
                    this.createControlHandles();
                },


                /**
                 * Moves this filter rectangle by the specified offsets.
                 * @param {Number} xOffset The amount to add to this filter
                 *                          rectangle's x-axis coordinates.
                 * @param {Number} yOffset The amount to add to this filter
                 *                          rectangle's y-axis coordinates.
                 */
                move: function(xOffset, yOffset) {
                    // Save the old position of outerRect.
                    var offset;
                    var prevPos = this.outerRect.getTopLeft();

                    this.outerRect.move(xOffset, yOffset);

                    // The move of outerRect may have been constrained by
                    // its bounds rect, so calculate the actual offset and use
                    // that to move the control handles' rectangles.
                    offset = prevPos.difference(this.outerRect.getTopLeft());

                    $.each(this.controlHandles, function() {
                            this.move(offset.width, offset.height);
                        });
                },

                /**
                 * Draws this rectangle and its control handles
                 * onto the given canvas.
                 * @param {Object} canvasCtx The CanvasRenderingContext2D object
                 *                  on which to draw.
                 */
                draw: function(canvasCtx) {
                    canvasCtx.lineWidth = lineWidth;
                    canvasCtx.fillStyle = fillStyle;
                    canvasCtx.strokeStyle = strokeStyle;

                    canvasCtx.fillRect(this.outerRect.x, this.outerRect.y, this.outerRect.width, this.outerRect.height);
                    canvasCtx.strokeRect(this.outerRect.x, this.outerRect.y, this.outerRect.width, this.outerRect.height);
                    drawControlHandles(canvasCtx, this.controlHandles);
                },

                /**
                 * Returns true if the given point falls within this filter rectangle.
                 *
                 * If the function returns true and if the hitInfo object has
                 * been specified, upon return, the hitInfo object will have
                 * additional details as follows:
                 * <ul>
                 *   <li>isInControl - true if the point is in one of the
                 *       rectangle's control handles, false otherwise</li>
                 *   <li>controlIndex - if isInControl is true, a zero-based integer
                 *       index indicating which control handle was hit; undefined if
                 *       isInControl is false</li>
                 * </ul>
                 * @param {Object} pt An object having numeric properties x and y
                 *                  which describe the screen coordinates of the
                 *                  point to test.
                 * @param {Object} hitInfo Optional. If specified and if the
                 *                  function returns true, this object will contain
                 *                  additional details on where the point intersected
                 *                  the filter rectangle. 
                 * @return {Boolean} False if the point lies outside this filter
                 *                   rectangle, true if it intersects this rectangle.
                 */
                isPtInside: function(pt, hitInfo) {
                    var isInside = false;
                    if (hitInfo) {
                        hitInfo.isInControl = false;
                        hitInfo.controlIndex = undefined;
                    }

                    $.each(this.controlHandles, function(ctlIdx) {
                            if (this.isPtInRect(pt)) {
                                if (hitInfo) {
                                    hitInfo.isInControl = true;
                                    hitInfo.controlIndex = ctlIdx;
                                }
                                isInside = true;
                            }
                            return (! isInside);
                        });

                    if (! isInside) {
                        isInside = this.outerRect.isPtInRect(pt);
                    }

                    return isInside;
                }
            };

            _filterRect.scale(_canvasWidth, _canvasHeight);
            _filterRect.outerRect.setMinSize(createSize(minWidth, minHeight));
            _filterRect.outerRect.setBoundsRect(createRectangle(5, 5,
                                                                _canvasWidth - 5,
                                                                _canvasHeight - 5));

            return _filterRect;
        };


        /**
         * Scales this filterShape's canvas coordinates based on the given
         * width and height.
         * @param {Number} newWidth New canvas width
         * @param {Number} newHeight New canvas height
         * @private
         */
        var scale = function(newWidth, newHeight) {
            _canvasWidth  = newWidth;
            _canvasHeight = newHeight;

            $.each(_rects, function() {
                    this.scale(newWidth, newHeight);
                });
        };

        // Initialize based on initial width and height.
        _rects[filterRectIndex.near] = createFilterRect(nearRect,
                                                        MIN_NEAR_SIZE * _canvasWidth,
                                                        MIN_NEAR_SIZE * _canvasHeight,
                                                        _filterSettings.thickness,
                                                        _filterSettings.nearFill,
                                                        _filterSettings.nearStroke);

        _rects[filterRectIndex.far] = createFilterRect(farRect,
                                                        MIN_FAR_SIZE * _canvasWidth,
                                                        MIN_FAR_SIZE * _canvasHeight,
                                                        _filterSettings.thickness,
                                                        _filterSettings.farFill,
                                                        _filterSettings.farStroke);

if(midRect){
        _rects[filterRectIndex.mid] = createFilterRect(midRect,
                                                        MIN_MID_SIZE * _canvasWidth,
                                                        MIN_MID_SIZE * _canvasHeight,
                                                        _filterSettings.thickness,
                                                        _filterSettings.midFill,
                                                        _filterSettings.midStroke);
        
    }
        return {
            /**
             * Returns this filterShape's nearRect or farRect in canvas coordinates.
             * @param {Number} rectId 0 for nearRect or 1 for farRect.
             * @return {Object} The specified filterRect object.
             */
            getRect: function(rectId) {
                if (rectId !== filterRectIndex.near && rectId !== filterRectIndex.far&&rectId!=filterRectIndex.mid) {
                    throw new Error('Invalid argument: rectId must have value ' +
                                     filterRectIndex.near + ' or ' + filterRectIndex.far + '.');
                }
                return _rects[rectId];
            },

            /**
             * Scales this filterShape's canvas coordinates based on the given
             * width and height.
             * @param {Number} newWidth New canvas width
             * @param {Number} newHeight New canvas height
             * @return {Object} This filterShape object
             * @method
             */
            scaleRects: function(newWidth, newHeight) {
                scale(newWidth, newHeight);
                return this;
            },

            /**
             * Draws this filterShape's rectangles on the given canvas.
             * @param {Object} canvasCtx  The CanvasRenderingContext2D object
             *                  on which to draw.
             */
            drawRects: function(canvasCtx) {
                canvasCtx.save();
//                _rects[filterRectIndex.far].draw(canvasCtx);
//                _rects[filterRectIndex.near].draw(canvasCtx);
//                if(_rects[filterRectIndex.mid]){
//                    _rects[filterRectIndex.mid].draw(canvasCtx);
//                }
                    $.each(_rects,function(index){
                        _rects[index].draw(canvasCtx);
                    });
                canvasCtx.restore();
            }
        };
    };
    
    
    
    ////////////////////////////////////////////////////////////////
    // personSampleShape closure
    // Not exported, but used by markupCanvas
    ////////////////////////////////////////////////////////////////

    /**
     * Creates a new personCalibration SampleShape object for the specified personCalibrationSample.
     * 
     * To keep the terminology straight, personSamples are of type personCalibrationSample
     * and represent the pure model object. The personCalibrationSampleShape is the visual
     * representation of said model object.
     * @param {Object} personSample A normalized personSample object.
     * @param {Number} width Canvas width 
     * @param {Number} height Canvas height
     * @return {Object} A personSampleShape object or null.
     */
    var createPersonCalibrationSampleShape = function(personSample, width, height, isShapeSelected) {
        var MIN_SIZE = 0.0625;
        var _canvasWidth = width;
        var _canvasHeight = height;
        var _shape = null;

        /**
         * Creates a new person calibration shape based on the specified personSample.
         * @param {Object} normalizedPersonSample A personSample object whose coordinates,
         *                  width, and height are normalized in the range 0.0 to 1.0.
         * @param {Number} minWidth The smallest width permitted when resizing this rectangle.
         * @param {Number} minHeight The smallest height permitted when resizing this rectangle.
         * @param {Number} lineWidth Thickness of the line to draw as the rectangle's outline.
         * @param {String} fillStyle Fill style used when drawing the rectangle.
         * @param {String} strokeStyle Stroke style to use when drawing the rectangle.
         * @return {Object} A person calibration shape object.
         */
        var createPersonCalibrationShape = function(normalizedPersonSample, minWidth, minHeight, isSel) {
            var _personShape = {
                /**
                 * The rectangle outline.
                 */
                outerRect: createRectangle(),
                
                headCircle: createCircle(),
                
                footRect: createRectangle(),
                
                isSelected: false,

                /**
                 * Canvas coordinates of rectangle's control handles.
                 */
                controlHandles: [],


                /**
                 * Creates a new rectangle object offset by the specified
                 * amounts from the top, left corner of outerRect and having
                 * width and height _controlPointSettings.size.
                 * @param {Number} xOffset
                 * @param {Number} yOffset
                 * @return {Object} A rectangle object
                 * @private
                 */
                createControlHndlRect : function(xOffset, yOffset) {
                    var centerOffset = Math.round(_controlPointSettings.size / 2);
                    var x = this.outerRect.x + xOffset - centerOffset;
                    var y = this.outerRect.y + yOffset - centerOffset;
                    if (isNaN(x)) {
                        $.log('x is NaN. this.outerRect.x: ' + this.outerRect.x + ', xOffset: ' + xOffset + ', centerOffset: ' + centerOffset);
                    }
                    if (isNaN(y)) {
                        $.log('y is NaN. this.outerRect.y: ' + this.outerRect.y + ', yOffset: ' + yOffset + ', centerOffset: ' + centerOffset);
                    }
                    return createRectangle(x, y, _controlPointSettings.size, _controlPointSettings.size);                    
                },

                /**
                 * Populates this rectangle's arry of control handle rectangles.
                 */
                createControlHandles: function() {
                    this.controlHandles = [
                            // 0: top, left
                            this.createControlHndlRect(0, 0),
                            // 1: top, middle
                            this.createControlHndlRect(Math.round(this.outerRect.width / 2), 0),
                            // 2: top, right
                            this.createControlHndlRect(this.outerRect.width, 0),
                            // 3: middle, right
                            this.createControlHndlRect(this.outerRect.width,
                                                        Math.round(this.outerRect.height / 2)),
                            // 4: bottom, right
                            this.createControlHndlRect(this.outerRect.width,
                                                       this.outerRect.height),
                            // 5: bottom, middle
                            this.createControlHndlRect(Math.round(this.outerRect.width / 2),
                                                       this.outerRect.height),
                            // 6: bottom, left
                            this.createControlHndlRect(0, this.outerRect.height),
                            // 7: left, middle
                            this.createControlHndlRect(0, Math.round(this.outerRect.height / 2))
                        ];
                },
                
                /**
                 * Scales this shapes's canvas coordinates based on the given
                 * width and height.
                 * @param (Object) sample the sample to scale from.
                 * @param {Number} newWidth New canvas width
                 * @param {Number} newHeight New canvas height
                 * @private
                 */
                scale: function(sample,newWidth, newHeight) {
                    this.outerRect.x  = Math.round(sample.boundingBox.x * newWidth);
                    this.outerRect.y  = Math.round(sample.boundingBox.y * newHeight);
                    this.outerRect.width  = Math.round(sample.boundingBox.width * newWidth);
                    this.outerRect.height = Math.round(sample.boundingBox.height * newHeight);

                    this.outerRect.setBoundsRect(createRectangle(5, 5, newWidth - 5, newHeight - 5));
                    
                    this.headCircle.x = Math.round(sample.headPoint.x * newWidth);
                    this.headCircle.y = Math.round(sample.headPoint.y * newHeight);
                    // circle radius is based on height
                    this.headCircle.radius = Math.round(_personSampleSettings.headRadius * newHeight);
                    
                    // now footpoint which is the center point so create off sets 
                    // from that based on height
                    footLen = _personSampleSettings.footLength * newHeight;
                    this.footRect.x  = Math.round(sample.footPoint.x * newWidth - footLen);
                    this.footRect.y  = Math.round(sample.footPoint.y * newHeight - footLen);
                    this.footRect.width  = Math.round(2 * footLen);
                    this.footRect.height = Math.round(2 * footLen);

                    this.createControlHandles();
                    
                    _canvasWidth = newWidth;
                    _canvasHeight = newHeight;
                },
                
                drawLine: function(canvasCtx, fromX, fromY, toX, toY) {
                    canvasCtx.beginPath();
                    //canvasCtx.moveTo(Math.round(fromX), Math.round(fromY));
                    //canvasCtx.lineTo(Math.round(toX), Math.round(toY));
                    canvasCtx.moveTo(fromX, fromY);
                    canvasCtx.lineTo(toX, toY);
                    canvasCtx.closePath();
                    canvasCtx.stroke();
                },
             
                
                /**
                 * Verifies that the head and foot point are within the current rectangle. If not force them to be.
                 */
                checkHeadFootPoints: function() {
                    // just reuse the current move function with 0 offsets
                    this.headCircle.centerConstrainedMove(0,0,this.outerRect, SampleShapeHeadFootInset);
                    this.footRect.centerConstrainedMove(0,0,this.outerRect, SampleShapeHeadFootInset);
                },
           


                /**
                 * Draws this rectangle and its control handles
                 * onto the given canvas.
                 * @param {Object} canvasCtx The CanvasRenderingContext2D object
                 *                  on which to draw.
                 */
                draw: function(canvasCtx) {
                    var fromX, fromY, toX, toY;

                    if (this.isSelected) {
                        canvasCtx.lineWidth = _personSampleSettings.selectedThickness;
                        canvasCtx.strokeStyle = _personSampleSettings.selectedStroke;
                    }
                    else {
                        canvasCtx.lineWidth = _personSampleSettings.unselectedThickness;
                        canvasCtx.strokeStyle = _personSampleSettings.unselectedStroke;
                    }
                    
                    // first rectangle with control handles
                    canvasCtx.strokeRect(this.outerRect.x, this.outerRect.y, this.outerRect.width, this.outerRect.height);
                    // only draw control handles if selected
                    if (this.isSelected) {
                        drawControlHandles(canvasCtx, this.controlHandles);
                    }
                    
                    // now cross hairs
                    canvasCtx.lineWidth = _personSampleSettings.crosshairThickness;
                    if (this.isSelected) {
                         canvasCtx.strokeStyle = _personSampleSettings.selectedCrosshairStroke;
                    }
                    else {
                         canvasCtx.strokeStyle = _personSampleSettings.unselectedCrosshairStroke;
                    }
                    
                    // foot crosshair - horizontal
                    fromX = this.footRect.x;
                    fromY = this.footRect.y + (this.footRect.height/2);
                    toX = this.footRect.x + this.footRect.width;
                    toY = fromY;
                    this.drawLine(canvasCtx, fromX, fromY, toX, toY);
                    
                    // vertical
                    fromX = this.footRect.x + (this.footRect.width/2);
                    fromY = this.footRect.y;
                    toX = fromX;
                    toY = this.footRect.y + this.footRect.height;
                    this.drawLine(canvasCtx, fromX, fromY, toX, toY);
                    
                    // head crosshair - horizontal
                    fromX = this.headCircle.x - this.headCircle.radius;
                    fromY = this.headCircle.y;
                    toX = this.headCircle.x + this.headCircle.radius;
                    toY = fromY;
                    this.drawLine(canvasCtx, fromX, fromY, toX, toY);
                    
                    // vertical
                    fromX = this.headCircle.x;
                    fromY = this.headCircle.y - this.headCircle.radius;
                    toX = fromX;
                    toY = this.headCircle.y + this.headCircle.radius;
                    this.drawLine(canvasCtx, fromX, fromY, toX, toY);
                    
                    // now head circle and foot rect                 
                    if (this.isSelected) {
                        canvasCtx.lineWidth = _personSampleSettings.selectedThickness;
                        canvasCtx.strokeStyle = _personSampleSettings.selectedHeadStroke;
                    }
                    else {
                        canvasCtx.lineWidth = _personSampleSettings.unselectedThickness;
                        canvasCtx.strokeStyle = _personSampleSettings.unselectedHeadStroke;
                    }
                    canvasCtx.beginPath();
                    canvasCtx.arc(this.headCircle.x, this.headCircle.y, this.headCircle.radius, 0, TwoPI, true);
                    canvasCtx.closePath();
                    canvasCtx.stroke();
                    if (this.isSelected) {
                        canvasCtx.strokeStyle = _personSampleSettings.selectedFootStroke;
                    }
                    else {
                        canvasCtx.strokeStyle = _personSampleSettings.unselectedFootStroke;
                    }
                    canvasCtx.strokeRect(this.footRect.x, this.footRect.y, this.footRect.width, this.footRect.height);
                 },
                 
                 /**
                  * Moves the shape by the given offsets taking into account whether it is in head or foot.
                  */
                 move: function (xOffset, yOffset, isInHead, isInFoot) {
                     // Save the old position of outerRect.
                    var offset;
                    var prevPos;
                    
                    if (!isInHead && !isInFoot) {
                        prevPos = this.outerRect.getTopLeft();
                        
                        this.outerRect.move(xOffset, yOffset);
                        
                        // The move of outerRect may have been constrained by
                        // its bounds rect, so calculate the actual offset and use
                        // that to move the control handles' rectangles.
                        offset = prevPos.difference(this.outerRect.getTopLeft());
                        
                        $.each(this.controlHandles, function(){
                            this.move(offset.width, offset.height);
                        });
                        
                        // now move head circle and foot rect
                        this.footRect.move(offset.width, offset.height);
                        this.headCircle.move(offset.width, offset.height);
                    }
                    else if (isInHead) {
                        // move the head to the given offset, however don't let the center go outside bounds
                        this.headCircle.centerConstrainedMove(xOffset, yOffset, this.outerRect, SampleShapeHeadFootInset);
                    }
                    else { // isFoot 
                        // move the foot to the given offset, however don't let the center go outside the bounds
                        this.footRect.centerConstrainedMove(xOffset, yOffset, this.outerRect, SampleShapeHeadFootInset);
                    }
                    
                 },

                /**
                 * Returns true if the given point falls within this rectangle or
                 * the inner head or foot shapes.
                 *
                 * If the function returns true and if the hitInfo object has
                 * been specified, upon return, the hitInfo object will have
                 * additional details as follows:
                 * <ul>
                 *   <li>isInControl - true if the point is in one of the
                 *       rectangle's control handles, false otherwise</li>
                 *   <li>controlIndex - if isInControl is true, a zero-based integer
                 *       index indicating which control handle was hit; undefined if
                 *       isInControl is false</li>
                 *   <li>isInHead - true if the point is in the head circle, false
                 *       otherwise</li>
                 *   <li>isInFoot - true if the point is in the foot circle, false
                 *       otherwise</li>
                 * </ul>
                 * @param {Object} pt An object having numeric properties x and y
                 *                  which describe the screen coordinates of the
                 *                  point to test.
                 * @param {Object} hitInfo Optional. If specified and if the
                 *                  function returns true, this object will contain
                 *                  additional details on where the point intersected
                 *                  the person sample shape. 
                 * @return {Boolean} False if the point lies outside this shape, 
                 *                     true if it intersects this shape.
                 */
                isPtInside: function(pt, hitInfo) {
                    var isInside = false;
                    if (hitInfo) {
                        hitInfo.isInControl = false;
                        hitInfo.isInHead = false;
                        hitInfo.isInFoot = false;
                        hitInfo.controlIndex = undefined;
                    }

                    // first check the control handles
                    $.each(this.controlHandles, function(ctlIdx) {
                            if (this.isPtInRect(pt)) {
                                if (hitInfo) {
                                    hitInfo.isInControl = true;
                                    hitInfo.controlIndex = ctlIdx;
                                }
                                isInside = true;
                            }
                            return (! isInside);
                        });
                    // then the head
                    if (!isInside) {
                        isInside = this.headCircle.isPtInCircle(pt);
                        if (hitInfo) {
                            hitInfo.isInHead = isInside;
                        }
                    }
                
                    // then the foot
                    if (!isInside) {
                        isInside = this.footRect.isPtInRect(pt);
                        if (hitInfo) {
                            hitInfo.isInFoot = isInside;
                        }
                    }
                    
                    // now inside rect
                    if (! isInside) {
                        isInside = this.outerRect.isPtInRect(pt);
                    }

                    return isInside;
                }
            };

            _personShape.isSelected = isSel;
            _personShape.scale(normalizedPersonSample, _canvasWidth, _canvasHeight);
            _personShape.outerRect.setMinSize(createSize(minWidth, minHeight));
            _personShape.outerRect.setBoundsRect(createRectangle(5, 5,
                                                                _canvasWidth - 5,
                                                                _canvasHeight - 5));

            return _personShape;
        };


        // Initialize based on initial width and height.
        _shape = createPersonCalibrationShape(personSample,
                                         MIN_SIZE * _canvasWidth,
                                         MIN_SIZE * _canvasHeight,
                                         isShapeSelected);

        return {
            /**
             * Returns this shape in canvas coordinates.
             * @return {Object} The specified shape object.
             */
            getShape: function() {
                return _shape;
            },
            
            /**
             * Returns the sample that this shape represents in normalized coordinates.
              * @return {Object} The sample object.
             */
            getSample: function() {
                var sample = objectvideo.ovready.personCalibrationSample();
                // now normalize
                var rect = _shape.outerRect;
                sample.boundingBox = objectvideo.ovready.rect();
                sample.boundingBox.x = rect.x / _canvasWidth;
                sample.boundingBox.y = rect.y / _canvasHeight;
                sample.boundingBox.width = rect.width / _canvasWidth;
                sample.boundingBox.height = rect.height/_canvasHeight;
                // foot
                var center = _shape.footRect.getCenter();
                sample.footPoint = objectvideo.ovready.point();
                sample.footPoint.x = center.x/_canvasWidth;
                sample.footPoint.y = center.y/_canvasHeight;
                // head
                sample.headPoint = objectvideo.ovready.point();
                sample.headPoint.x = _shape.headCircle.x / _canvasWidth;
                sample.headPoint.y = _shape.headCircle.y/ _canvasHeight;
                return sample;
            },
            
            /**
             * Returns whether the shape is selected.
             * @return (Boolean) returns whether the shape is selected.
             */
            isSelected: function() {
                return _shape.isSelected;
            },
            
            /**
             * Sets whether this shape is selected or not.
             * @param (Boolean) isSel true if this shape is selected
             */
            setSelected: function(isSel) {
                _shape.isSelected = isSel;
            },
            
            /**
             * Moves the shape to new pt.
             * @param (Number) xoffset xoffset to move to
             * @param (Number) yoffset yoffset to move to
             * @param (Boolean) isInHead whether this is in head; this cannot be true with isInFoot
             * @param (Boolean) isInFoot whether this is in the foot; cannot be true with isInHead
             */
            move: function(xoffset, yoffset, isInHead, isInFoot) {
                _shape.move(xoffset, yoffset, isInHead, isInFoot);
            },
            
            /**
             * Scales this shape's canvas coordinates based on the given
             * width and height.
             * @param {Number} newWidth New canvas width
             * @param {Number} newHeight New canvas height
             * @return {Object} This shape object
             * @method
             */
            scaleShape: function(newWidth, newHeight) {
                // get the sample based on current size
                var sample = this.getSample();
                _shape.scale(sample, newWidth, newHeight);
                return this;
            },

            /**
             * Draws this shape's rectangles on the given canvas.
             * @param {Object} canvasCtx  The CanvasRenderingContext2D object
             *                  on which to draw.
             */
            drawShape: function(canvasCtx) {
                canvasCtx.save();
                _shape.draw(canvasCtx);
                canvasCtx.restore();
            },
            
            
            /**
             * Resize this shape based on the new pt.
             * @param {Number} controlIndex  The control index which is being moved.
             * @param (Object) pt The point to move to.
             */
            resizeShape: function(controlIndex, pt) {
                
                _shape.outerRect.resize(controlIndex, pt, false);
                _shape.checkHeadFootPoints();
                _shape.createControlHandles();
            }
        };
    };


    ////////////////////////////////////////////////////////////////
    // ruleShape closure
    // Not exported, but used by markupCanvas
    ////////////////////////////////////////////////////////////////

    /**
     * Creates a new ruleShape object for the specified event definition.
     * Note that if the event definition is of a type that has no visible
     * markup, for example full-frame or camera tamper, this function
     * returns null.
     * @param {Object} eventDef A rule eventDefinition object.
     * @param {Number} width Canvas width 
     * @param {Number} height Canvas height
     * @return {Object} A ruleShape object or null.
     */
    var createRuleShape = function(eventDef, width, height) {

        /**
         * Creates a new pointsCollection object containing a
         * copy of the specified array of normalized points and
         * parallel array of points converted to canvas coordinates.
         * @param {Array} points The array of points objects to copy.
         * @return {Object} A pointsCollection object. 
         */
        var copyPoints = function(points) {

            var pointsCollection = {
                /**
                 * An array of point objects, having numeric properties
                 * x and y, whose values are in the range 0.0 - 1.0.
                 * @property
                 * @type {Array}
                 */
                eventPoints: [],

                /**
                 * An array of point objects, having numeric properties
                 * x and y, whose values are in canvas coordinates.
                 * @property
                 * @type {Array}
                 */
                canvasPoints: [],

                /**
                 * Recalculates the canvasPoints coordinates from
                 * the eventPoints values based on the given canvas
                 * width and height.
                 * @param {Number} width Canvas width
                 * @param {Number} height Canvas height
                 * @method
                 */
                scale: function(newWidth, newHeight) {
                    var that = this;
                    this.canvasPoints = [];
                    $.each(this.eventPoints, function(i, pt) {
                            that.canvasPoints[i] = createPoint(
                                Math.round(pt.x * newWidth),
                                Math.round(pt.y * newHeight));
                        });
                }
            };

            // Initialize pointsCollection object
            $.each(points, function(i, pt) {
                    pointsCollection.eventPoints[i] = createPoint(pt.x, pt.y);
                });

            pointsCollection.scale(width, height);

            return pointsCollection;
        };


        /**
         * Creates a new enclosingPolygon object.
         * @param {Array} canvasPts An array of points in canvas coordiates.
         *                 The returned polygon will enclose these points.
         * @param {String} tripwireDirection Optional. If specified, the
         *                  direction of the tripwire associated with the
         *                  specified array of points. If not specified, the
         *                  array of points is assumed to comprise the polygon
         *                  of an AOI.
         * @return {Object} A new enclosingPolygon object.
         */
        var createEnclosingPolygon = function(canvasPts, tripwireDirection) {
            /**
             * An array of polygons (where a polygon is an array of points).
             * @private
             */
            var _polygons = [];

            /**
             * Translates the coordinates of the given points by the amounts
             * specified by dx and dy.
             * @param {Array} arrPoints One or more point objects to be
             *                 translated. 
             * @param {Object} dx The amount by which to translate the x-coordinates.
             * @param {Object} dy The amount by which to translate the y-coordinates.
             */
            var translate = function (arrPoints, dx, dy) {
                $.each(arrPoints, function() {
                        this.x -= dx;
                        this.y -= dy;
                    });
            };


            /**
             * Gets a given point around the specified angle.
             * @param {Object} pt The point to be rotated.
             * @param {Number} angle Angle in radians.
             * @return {Object} The point rotated by the specified angle.
             */
            var rotatePoint = function (pt, angle) {
                return createPoint((pt.x * Math.cos(angle)) + (pt.y * Math.sin(angle)),
                                    (pt.y * Math.cos(angle)) - (pt.x * Math.sin(angle)));
            };


            /**
             * Rotates the given points around the specified angle.
             * @param {Array} arrPoints One or more point objects to rotated.
             * @param {Number} angle Angle in radians.
             */
            var rotate = function(arrPoints, angle) {
                var i;
                for (i = 0; i < arrPoints.length; i++) {
                    arrPoints[i] = rotatePoint(arrPoints[i], angle);
                }
            };

            /**
             * Creates a polygon outline around the given line segment.
             * @param {Object} startPt Start of the line segment.
             * @param {Object} endPt End of the line segment.
             * @return {Array} Polygon as an array of point objects.
             */
            var createSegmentPoly = function(startPt, endPt) {
                var polygon = [];
                var mx = (startPt.x + endPt.x) / 2;
                var my = (startPt.y + endPt.y) / 2;
                var padding = 5;

                function outlineArrow(direction) {
                    polygon.push(createPoint(mx - 1 * direction,
                                             my - padding * direction));

                    polygon.push(createPoint(mx - 1 * direction,
                                             my - 10 * direction));
                    polygon.push(createPoint(mx - 5 * direction,
                                             my - 10 * direction));
                    polygon.push(createPoint(mx, my - 19 * direction));
                    polygon.push(createPoint(mx + 5 * direction,
                                             my - 10 * direction));
                    polygon.push(createPoint(mx + 1 * direction,
                                             my - 10 * direction));

                    polygon.push(createPoint(mx + 1 * direction,
                                             my - padding * direction));                    
                }

                // Upper left
                polygon.push(createPoint(startPt.x - padding, startPt.y - padding));

                // Outline around right-to-left arrow
                if ((tripwireDirection === tripwireDirections.AnyDirection) ||
                        (tripwireDirection === tripwireDirections.RightToLeft)) {
                    outlineArrow(1);
                }

                // Upper right
                polygon.push(createPoint(endPt.x + padding, endPt.y - padding));

                // Lower right
                polygon.push(createPoint(endPt.x + padding, endPt.y + padding));

                // Outline around left-to-right arrow
                if ((tripwireDirection === tripwireDirections.AnyDirection) ||
                        (tripwireDirection === tripwireDirections.LeftToRight)) {
                    outlineArrow(-1);
                }

                // Lower left
                polygon.push(createPoint(startPt.x - padding, startPt.y + padding));

                // Close the polygon
                polygon.push(polygon[0]);

                return polygon;
            };

            
            /**
             * Creates a polygon, as an array of points, that encloses
             * the tripwire segment beginning at startPt, ending at endPt
             * and having the direction arrow(s) as indicated by the
             * closure's tripwireDirection parameter.
             * @param {Object} startPt A point, as an object with numeric
             *                  properties x and y, at one end of a tripwire
             *                  segment.
             * @param {Object} endPt  A point, as an object with numeric
             *                  properties x and y, at the other end of a
             *                  tripwire segment.
             * @return {Array} An array of point objects that describe
             *                  a polygon that outlines the line segment and
             *                  its direction arrow(s).
             */
            var wrapSegmentInPolygon = function(startPt, endPt) {
                var line;
                var polygon;

                // Calculate the mid-point of the line segment.
                var mx = (startPt.x + endPt.x) / 2;
                var my = (startPt.y + endPt.y) / 2;

                // Calculate angle of line segment
                var angle = Math.atan2((endPt.y - startPt.y), (endPt.x - startPt.x));

                // Translate the line segment
                line = [];
                line[0] = startPt;
                line[1] = endPt;
                translate(line, mx, my);

                // Rotate the line segment
                rotate(line, angle);

                // Create a polygon based on the segment.
                polygon = createSegmentPoly(line[0], line[1]);

                // Counter-rotate the polygon
                rotate(polygon, -angle);

                // Reverse translate the polygon
                translate(polygon, -mx, -my);

                return polygon;
            };
            
            // Initialize createEnclosingPolygon closure.
            (function init() {
                var poly = [];
                var i;
                var ptA, ptB;

                if (tripwireDirection === undefined) {
                    // No tripwireDirection means the points make
                    // up the polygon of an AOI. Just copy the points,
                    // then close the polygon by making sure it starts
                    // and ends at the same point.
    
                    // Copy points into a polygon array.                      
                    $.each(canvasPts, function() {
                            poly.push(createPoint(this.x, this.y));
                        });
    
                    // Close the polygon with its own starting point.
                    if (poly.length > 0) {
                        if ((poly[0].x !== poly[poly.length - 1].x) ||
                        (poly[0].y !== poly[poly.length - 1].y)) {
                            poly.push(createPoint(poly[0].x, poly[0].y));
                        }
                    }

                    _polygons[0] = poly;                   
                }
                else {
                    if (canvasPts.length >= 2) {
                        for (i = 0; i < canvasPts.length - 1; i++) {
                            ptA = createPoint(canvasPts[i].x, canvasPts[i].y);
                            ptB = createPoint(canvasPts[i + 1].x, canvasPts[i + 1].y);
                            _polygons[i] = wrapSegmentInPolygon(ptA, ptB);
                        }
                    }
                }     
            })();

            // Return an enclosingPolygon object
            return {
                /**
                 * Indicates whether the given point lies with this
                 * enclosingPolygon's area. 
                 * @param {Object} target An object with numeric properties x
                 *                  and y, which describe the canvas coordinates
                 *                  of the point to be tested for inclusion in
                 *                  this polygon.
                 * @return {Boolean} True if the target lies inside this
                 *                    polygon, false if it lies outside.
                 */
                isPointInside: function(target) {
                    var isInside = false;

                    $.each(_polygons, function() {
                            var oldPt = createPoint(this[this.length - 1].x,
                                                    this[this.length - 1].y);
                            $.each(this, function() {
                                    var x1, y1, x2, y2;
                                    var newPt = this;

                                    if (newPt.x > oldPt.x) {
                                         x1 = oldPt.x;
                                         x2 = newPt.x;
                                         y1 = oldPt.y;
                                         y2 = newPt.y;
                                    }
                                    else {
                                         x1 = newPt.x;
                                         x2 = oldPt.x;
                                         y1 = newPt.y;
                                         y2 = oldPt.y;
                                    }
                                    if ((newPt.x < target.x) === (target.x <= oldPt.x) &&
                                            ((target.y - y1) * (x2 - x1)) < ((y2 - y1) * (target.x - x1))) {
                                         isInside = Boolean(! isInside);
                                    }
                                    oldPt.x = newPt.x;
                                    oldPt.y = newPt.y;
                                });
                            return (! isInside);
                        });
                    return isInside;
                }

// DEBUG
//                draw: function(ctx) {
//                    ctx.save();
//                    $.each(_polygons, function() {
//                        var i;
//                        if (this.length > 2) {
//                                ctx.beginPath();
//                                ctx.moveTo(this[0].x, this[0].y);
//                                for (i = 0; i < this.length; i++) {
//                                    ctx.lineTo(this[i].x, this[i].y);
//                                }
//                                ctx.closePath();
//                                ctx.fillStyle = 'rgba(0, 128, 128, 0.85)';
//                                ctx.fill();
//                            }                        
//                        });
//                    ctx.restore();
//                }
// DEBUG
            };
        };

        /**
         * Shape type, either 'tripwire', 'aoi' or 'fullframe'.
         * @type {String}
         * @private
         */
        var _shapeType;

        /**
         * An array of one or two objectvideo.ovready.tripwireDirections.
         * @type {Array}
         * @private
         */
        var _direction = [];

        /**
         * An array of one or two pointsCollection objects.
         * @type {Array}
         * @private
         */
        var _points = [];

        /**
         * An array of one or two arrays of zero or more control handle rectangle objects.
         * @type {Array}
         * @private
         */
        var _handles = [];

        /**
         * An array of one or two enclosingPolygon objects.
         * @type {Array}
         * @private
         */
        var _enclosure = [];


        /**
         * Canvas width, in pixels.
         * @type {Number}
         * @private
         */
        var _canvasWidth = width;

        /**
         * Canvas height, in pixels.
         * @type {Number}
         * @private
         */
        var _canvasHeight = height;

        /**
         * Initializes the _enclosure property from values in the
         * _points and _direction members.
         */
        var buildEnclosingPolygons = function() {
            var i;
            var direction;

            _enclosure = [];
            for (i = 0; i < _points.length; i++) {
                direction = (_direction.length > i) ? _direction[i] : undefined;
                _enclosure[i] = createEnclosingPolygon(_points[i].canvasPoints,
                                                       direction);
            }
        };


        /**
         * Initializes the _handles property from values in the _points member.
         */
        var buildControlHandles = function() {
            var offset = Math.round(_controlPointSettings.size / 2);
            for (i = 0; i < _points.length; i++) {
                _handles[i] = [];

                $.each(_points[i].canvasPoints, function() {
                        var r = createRectangle(this.x - offset,
                                                this.y - offset,
                                                _controlPointSettings.size,
                                                _controlPointSettings.size);                    
                        _handles[i].push(r);
                    });
            }
        };


        // Initialize createRuleShape closure variables from eventDef values
        switch (eventDef.typeOf) {
            case eventDefObjectTypes.areaOfInterestEventDefinition:
            case eventDefObjectTypes.countingAreaOfInterestEventDefinition:
            case eventDefObjectTypes.simpleAreaOfInterestEventDefinition:
                _shapeType = 'aoi';
                _points[0] = copyPoints(eventDef.points);
                break;

            case eventDefObjectTypes.fullFrameEventDefinition:
                _shapeType = 'fullframe';

                // A full frame event definition has no points, so we create
                // an array of points that covers the entire frame.
                _points[0] = copyPoints([ createPoint(0.0, 0.0),
                                          createPoint(1.0, 0.0),
                                          createPoint(1.0, 1.0),
                                          createPoint(0.0, 1.0)]);
                break;

            case eventDefObjectTypes.tripwireEventDefinition:
                _shapeType = 'tripwire';
                _points[0] = copyPoints(eventDef.points);
                _direction[0] = eventDef.tripwireDirection;            
                break;

            case eventDefObjectTypes.multiLineTripwireEventDefinition:
                _shapeType = 'tripwire';
                $.each(eventDef.tripwires, function(i, tripwire) {
                        _points[i] = copyPoints(tripwire.points);
                        _direction[i] = tripwire.tripwireDirection;           
                    });
                break;

            default:
                // All other event types, i.e., camera tamper,
                // have no visible markup, so there is no ruleShape to create.
                return null;
        }

        buildEnclosingPolygons();
        buildControlHandles();

        // Return the ruleShape object
        return {
            /**
             * Indicates whether this ruleShape represents any type of non-full frame AOI.
             * @return {Boolean} True if this object represents an AOI,
             *                    false if it represents a tripwire, full-frame
             *                    or tamper event.
             * @method
             */
            isAOI: function() {
                return (_shapeType === 'aoi');
            },

            /**
             * Indicates whether this ruleShape represents a full frame AOI.
             * @return {Boolean} True if this object represents an full frame,
             *                    false if it represents a tripwire, partial AOI,
             *                    or tamper event.
             * @method
             */
            isFullFrame: function() {
                return (_shapeType === 'fullframe');
            },

            /**
             * Returns the number of tripwires represented by this
             * ruleShape or zero, if this shape is an AOI.
             * @return {Number} The number of tripwire lines represented by
             *                   this object, from 0 to 2.
             * @method
             */
            getLines: function() {
                return _direction.length;
            },

            /**
             * Gets the array of points, in canvas coordinates, that
             * make up this rule shape. 
             * @param {Number} index Optional. For a multi-line tripwire
             *                  shape, either 0 or 1 indicates which line.
             * @return {Array} An array of points, where a point is an object
             *                  having numeric properties x and y.
             * @method
             */
            getCanvasPoints: function(index) {
                if (index) {
                    if (this.isAOI() || this.isFullFrame()) {
                        throw new Error('Invalid argument: index. Index may not be specified for an AOI ruleShape.');
                    }
                    if (_points.length <= index) {
                        throw new RangeError('Index out of range');
                    }
                }

                if (_points.length === 0) {
                    return [];
                }
                else {
                    return _points[index || 0].canvasPoints;
                }
            },


            /**
             * Gets the array of rectangles, in canvas coordinates, for this rule shape.
             * @param {Number} index Optional. For a multi-line tripwire
             *                  shape, either 0 or 1 indicates which line.
             * @return {Array} An array of control handle rectangles.
             * @method
             */
            getControlHandles: function(index) {
                if (index) {
                    if (this.isAOI() || this.isFullFrame()) {
                        throw new Error('Invalid argument: index. Index may not be specified for an AOI ruleShape.');
                    }
                    if (_points.length <= index) {
                        throw new RangeError('Index out of range');
                    }
                }

                if (_handles.length === 0) {
                    return [];
                }
                else {
                    return _handles[index || 0];
                }
            },


            /**
             * Gets the tripwireDirection value for this ruleShape, if the
             * shape is a type of tripwire.
             * @param {Number} index Optional. For a multi-line tripwire
             *                  shape, either 0 or 1 indicates which line.
             * @return {String} An objectvideo.ovready.tripwireDirections
             *                   value.
             * @exception {Error} If this ruleShape represents an AOI,
             *                     rather than a tripwire.
             * @method
             */
            getDirection: function(index) {
                if (this.isAOI() || this.isFullFrame()) {
                    throw new Error('An AOI ruleShape does not have direction.');
                }
                if ((index !== undefined) && (_points.length <= index)) {
                    throw new RangeError('Index out of range');
                }
                return _direction[(index || 0)];
            },


            /**
             * Gets the enclosingPolygon object that encompasses this rule
             * shape's set of canvas points. 
             * @param {Number} index Optional. For a multi-line tripwire
             *                  shape, either 0 or 1 indicates which line.
             * @return {Object} An enclosingPolygon object.
             * @method
             */
            getEnclosingPolygon: function(index) {
                if (index) {
                    if (this.isAOI() || this.isFullFrame()) {
                        throw new Error('Invalid argument: index. Index may not be specified for an AOI ruleShape.');
                    }
                    if (_points.length <= index) {
                        throw new RangeError('Index out of range');
                    }
                }

                return (_enclosure.length === 0) ? null : _enclosure[index || 0];
            },


            /**
             * Scales this ruleShape's canvas coordinates based on the given
             * width and height.
             * @param {Number} newWidth New canvas width
             * @param {Number} newHeight New canvas height
             * @return {Object} This ruleShape object
             * @method
             */
            scalePoints: function(newWidth, newHeight) {
                _canvasWidth  = newWidth;
                _canvasHeight = newHeight;
                $.each(_points, function() {
                        this.scale(newWidth, newHeight);   
                    });

                buildEnclosingPolygons();
                buildControlHandles();
                return this;
            },


            /**
             * Changes one element in this object's pointsCollection array,
             * replacing an existing point with the specified value.
             *
             * Note that movePoint will invalidate this object's enclosing polygon(s).
             * If necessary, rebuild the enclosing polygon(s) by calling scalePoints,
             * passing it the existing canvas width and height.
             *   
             * @param {Object} newCanvasPt The new point in canvas coordinates,
             *                  where a point is an object having numeric
             *                  properties x and y.
             * @param {Number} ptIndex Zero-based integer index indicating
             *                  which point to move.
             * @param {Number} index Optional. For a multi-line tripwire
             *                  shape, either 0 or 1 indicates which line. 
             * @return {Object} This ruleShape object
             * @method
             * @see getCanvasPoints#
             * @see getEnclosingPolygon#
             * @see scalePoints#
             */
            movePoint: function(newCanvasPt, ptIndex, index) {
                var canvasPtsRef;

                if (index) {
                    if (this.isAOI() || this.isFullFrame()) {
                        throw new Error('Invalid argument: index. Index may not be specified for an AOI ruleShape.');
                    }
                    if (_points.length <= index) {
                        throw new RangeError('Index out of range. index value ' + index + ' is invalid.');
                    }
                }

                canvasPtsRef = _points[index || 0].canvasPoints;
                if ((ptIndex < 0) || (ptIndex >= canvasPtsRef.length)) {
                    throw new RangeError('Index out of range. ptIndex value ' + ptIndex + ' is invalid.');
                }

                // Replace existing canvas point with new value.
                canvasPtsRef[ptIndex] = createPoint(newCanvasPt.x, newCanvasPt.y);

                // Update corresponding event point by scaling canvas point.
                _points[index || 0].eventPoints[ptIndex] =
                    createPoint(newCanvasPt.x / _canvasWidth, newCanvasPt.y / _canvasHeight);

                buildEnclosingPolygons();
                buildControlHandles();

                return this;
            }
        };
    };


    ////////////////////////////////////////////////////////////////
    // markupCanvas closure
    ////////////////////////////////////////////////////////////////

    var markupCanvas = function(canvas) {

    
        /**
         * Ninety degrees in radians.
         * @type {Number}
         * @private
         */
        var _rad90Deg = 90.0 * Math.PI / 180.0;
    
        /**
         * True if the the markup is drawn, false if it is hidden.
         * @property
         * @private
         */
        var _isShowing = false;

        /**
         * The rule ID string associated with the highlighted rule,
         * if any; otherwise, null.
         * @property
         * @type {String}
         * @private
         */
        var _highlightedEventId = null;

        /**
         * Markup shape selection indicator.
         * Possible values are:
         * <ul>
         *   <li>-1 Shape is not selected</li>
         *   <li>0 Shape is selected or first of multiple shapes
         *           is selected</li>
         *   <li>1 Second of multiple shapes is selected</li>
         * </ul>
         * Note that only the highlighted event is selected.
         */
        var _selectionIndex = -1;

        /**
         * A table of ruleShape objects keyed by rule ID.
         * @property
         * @type {Object}
         * @private
         */
        var _shapes = {};

        /**
         * A table of filterShape objects keyed by filter type name.
         * @property
         * @type {Object}
         * @private
         */
        var _filters = {};
        
        /**
         * An array of personSampleShapes.
         * @property
         * @type {Object}
         * @private
         */
        var _personCalibrationSampleShapes = [];

        /**
         * The canvas drawing context.
         * @property
         * @type {Object} CanvasRenderingContext2D
         * @private
         */
        var _canvasCtx = null;

        /**
         * Returns the angle of the line segment specified
         * by the two given points.
         * @param {Object} startPt An object having numeric properties x and y
         *                  representing one end of the line sement.
         * @param {Object} endPt An object having numeric properties x and y
         *                  representing the other end of the line sement.
         * @return {Number} The angle of the line segment in radians.
         */
        var getSegmentAngle = function(startPt, endPt) {
            return Math.atan2((endPt.y - startPt.y), (endPt.x - startPt.x));
        };


        /**
         * Erases the canvas.
         */
        var clearCanvas = function() {
            if (_canvasCtx) {
                _canvasCtx.clearRect(0, 0, canvas.width(), canvas.height());
            }
            $('.markup_canvas_label').remove();
        };


        /**
         * Draws a label at the specified location.
         * @param {String} label The label to draw.
         * @param {Object} startPt The starting point, in canvas coordinates, of a
         *                  line segment along which the label will be drawn.
         * @param {Object} endPt The ending point, in canvas coordinates, of a
         *                  line segment along which the label will be drawn.
         */
        var drawLabel = function(label, startPt, endPt) {
            var nLineHeight = 18;
            var txtPt;
            var labelElt;

            // Find segment midpoint.
            var mx = (startPt.x + endPt.x) / 2;
            var my = (startPt.y + endPt.y) / 2;

            // Determine the normalized angle of the segment.
            var angle = Math.abs(Math.atan2(
                ((endPt.y > startPt.y) ? (endPt.y - startPt.y) : (startPt.y - endPt.y)),
                ((endPt.x > startPt.x) ? (endPt.x - startPt.x) : (startPt.x - endPt.x))));

            // Begin with coordinates (0, 0), as if we had translated
            // our coordinate space to center on the point and to match
            // the rotation angle of the segment.
            // Then, move the point over and up.
            txtPt = createPoint(-nLineHeight, -(nLineHeight + 5));

            // Counter-rotate the point.
            txtPt = createPoint((txtPt.x * Math.cos(angle)) + (txtPt.y * Math.sin(angle)),
                                (txtPt.y * Math.cos(angle)) - (txtPt.x * Math.sin(angle)));

            // Translate to canvas coordinate space.
            txtPt.x += mx;
            txtPt.y += my;

            // Insert label span at the translated, rotated coordinates.
            labelElt = $('<span class="markup_canvas_label">' + label + '</span>')
                .css({
                    position: 'absolute',
                    left: Math.floor(txtPt.x).toString() + 'px',
                    top:  Math.floor(txtPt.y).toString() + 'px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontFamily: 'verdana, arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    lineHeight: nLineHeight.toString() + 'px'
                })
                .insertAfter(canvas);

            try {
                // Attempt to set transparency on new element's background-color.
                // This will fail in some browsers (e.g., IE7).
                labelElt.css('background-color', 'rgba(255, 255, 255, 0.6)');
            }
            catch (ex) {
            }
        };


        /**
         * Draws the directional arrow on a tripwire line segment.
         *
         * @param {Object} startPt Start of the line segment
         * @param {Object} endPt End of the line segment
         * @param {Object} direction An instance of tripwireDirections
         *                  specifying the tripwire direction.
         * @param {Boolean} isEnabled True if the arrow is to be drawn
         *                   in an enabled state.
         */
        var drawArrow = function(startPt, endPt, direction, isEnabled) {
            var mx, my;
            var angle;

            function drawArrowPolygon() {
                _canvasCtx.beginPath();
                _canvasCtx.moveTo( 0,  0);
                _canvasCtx.lineTo( 0, -1);
                _canvasCtx.lineTo(10, -1);
                _canvasCtx.lineTo(10, -5);
                _canvasCtx.lineTo(19,  0);
                _canvasCtx.lineTo(10,  5);
                _canvasCtx.lineTo(10,  1);
                _canvasCtx.lineTo( 0,  1);
                _canvasCtx.lineTo( 0,  0);
                _canvasCtx.closePath();
            }

            _canvasCtx.save();

            _canvasCtx.lineWidth = 1.0;
            _canvasCtx.strokeStyle = (isEnabled
                                      ? _tripwireSettings.arrow.enabledStroke
                                      : _tripwireSettings.arrow.disabledStroke);
            _canvasCtx.fillStyle   = (isEnabled
                                      ? _tripwireSettings.arrow.enabledFill
                                      : _tripwireSettings.arrow.disabledFill);

            // Determine angle of segment
            angle = getSegmentAngle(startPt, endPt);

            // Find segment midpoint. Translate coordinate system.
            mx = (startPt.x + endPt.x) / 2;
            my = (startPt.y + endPt.y) / 2;

            _canvasCtx.translate(mx, my);

            // Draw short segment(s) at perpendicular angle(s)
            if (direction !== tripwireDirections.RightToLeft) {
                // Draw segment for left-to-right and/or any direction.
                _canvasCtx.save();
                // Rotate perpendicular to segment
                _canvasCtx.rotate(angle + _rad90Deg);
                drawArrowPolygon();
                _canvasCtx.stroke();
                drawArrowPolygon();
                _canvasCtx.fill();

                _canvasCtx.restore();
            }

            if (direction !== tripwireDirections.LeftToRight) {
                // Draw segment for right-to-left and/or any direction.
                // Rotate perpendicular to segment
                _canvasCtx.rotate(angle - _rad90Deg);
                drawArrowPolygon();
                _canvasCtx.stroke();
                drawArrowPolygon();
                _canvasCtx.fill();
            }

            _canvasCtx.restore();
        };


        /**
         * Draws the markup for a tripwire event defintion.
         *
         * @param {Array} points Array of points that make up the
         *         tripwire line.
         * @param {Object} direction An instance of tripwireDirections
         *                  specifying the tripwire direction.
         * @param {Boolean} true if the markup should be drawn as enabled
         */
        var drawTripwireSegments = function(points, direction, isEnabled) {
            var i;

            function drawPath() {
                _canvasCtx.beginPath();
                _canvasCtx.moveTo(points[0].x, points[0].y);
                for (i = 1; i < points.length; i++) {
                    _canvasCtx.lineTo(points[i].x, points[i].y);                                
                }
                // Note: Do not call closePath here.
            }

            _canvasCtx.lineWidth = _tripwireSettings.thickness;
            _canvasCtx.strokeStyle = (isEnabled
                                      ? _tripwireSettings.enabledStroke
                                      : _tripwireSettings.disabledStroke);
            // Draw the line segments.
            drawPath();
            _canvasCtx.stroke();

            if (_tripwireSettings.thickness > 2.0) {
                // Draw inner line in fill color
                //_canvasCtx.lineWidth = _tripwireSettings.thickness - 2.0;
                _canvasCtx.strokeStyle = (isEnabled
                                          ? _tripwireSettings.enabledFill
                                          : _tripwireSettings.disabledFill);
                drawPath();
                _canvasCtx.stroke();
            }

            // Draw the direction arrow(s)
            for (i = 1; i < points.length; i++) {
                drawArrow(points[i - 1], points[i], direction, isEnabled);
             }
        };


        /**
         * Calls the Canvas2D API to create a path with the specified array of points.
         * @param {Array} points Array of points, in canvas coordinates.
         */
        var createPath = function(points) {
            var i;
            _canvasCtx.beginPath();
            _canvasCtx.moveTo(points[0].x, points[0].y);
            for (i = 1; i < points.length; i++) {
                _canvasCtx.lineTo(points[i].x, points[i].y);                                
            }
            _canvasCtx.lineTo(points[0].x, points[0].y);
            _canvasCtx.closePath();                
        };


        /**
         * Draws the markup for a full-view event definition.
         * @param {Array} points Array of points, in canvas coordinates,
         *                 that make up the  area.
         * @param {Boolean} isEnabled true if the markup should be drawn as enabled
         */
        var drawFullFrame = function(points, isEnabled) {
            var canvasWidth, canvasHeight;
            var offset;

            if (isEnabled) {
                canvasWidth  = canvas.width();
                canvasHeight = canvas.height();
                offset = _fullFrameSettings.thickness / 2.0;

                _canvasCtx.save();

                // Draw a full-frame path, then fill it.
                createPath(points);
                _canvasCtx.fillStyle = _fullFrameSettings.enabledFill;
                _canvasCtx.fill();

                // Draw the path, then stroke it.
                createPath(points);
                _canvasCtx.lineWidth = _fullFrameSettings.thickness;
                _canvasCtx.strokeStyle = _fullFrameSettings.enabledStroke;
                _canvasCtx.stroke();

                _canvasCtx.restore();
            }
        };


        /**
         * Draws the markup for a area-of-interest event defintion.
         *
         * @param {Array} points Array of points, in canvas coordinates,
         *                 that make up the  area.
         * @param {Boolean} isEnabled true if the markup should be drawn as enabled
         */
        var drawAOI = function(points, controlHandles, isEnabled) {
            if (points.length > 0) {
                _canvasCtx.save();
    
                // Draw the AOI path, then fill it.
                createPath(points);
                _canvasCtx.fillStyle = (isEnabled
                                        ? _aoiSettings.enabledFill
                                        : _aoiSettings.disabledFill);
                _canvasCtx.fill();
    
                // Draw the AOI path again, then stroke it.
                createPath(points);
                _canvasCtx.lineWidth = _aoiSettings.thickness;
                _canvasCtx.strokeStyle = (isEnabled
                                          ? _aoiSettings.enabledStroke
                                          : _aoiSettings.disabledStroke);
                _canvasCtx.stroke();
    
                // If enabled and selected, draw control points.
                if (isEnabled && (_selectionIndex >= 0)) {
                    drawControlHandles(_canvasCtx, controlHandles);
                }
    
                _canvasCtx.restore();
            }
        };


        /**
         * Draws the line segment markup for a area-of-interest event defintion,
         * but does not close the polygon and does not fill its interior.
         * The segments will drawn as enabled.
         *
         * @param {Array} points Array of points, in canvas coordinates,
         *                 that make up one or more connected line segments.
         */
        var drawAoiSegments = function(points) {
            var i;
            if (points.length > 0) {
                _canvasCtx.save();

                _canvasCtx.beginPath();
                _canvasCtx.moveTo(points[0].x, points[0].y);
                for (i = 1; i < points.length; i++) {
                    _canvasCtx.lineTo(points[i].x, points[i].y);                                
                }

                _canvasCtx.lineWidth = _aoiSettings.segmentThickness;
                _canvasCtx.strokeStyle = _aoiSettings.enabledStroke;
                _canvasCtx.stroke();

                _canvasCtx.restore();
            }
        };


        /**
         * Draws the markup for a single ruleShape.
         *
         * @param {Object} ruleShape The rule shape to draw.
         * @param {Boolean} isEnabled true if the markup should be drawn as enabled
         */
        var drawRuleShape = function(ruleShape, isEnabled) {
            var i, nLines;
            var startLabel = "A".charCodeAt(0);
            var points;

            if (_canvasCtx !== null) {
                if (ruleShape.isFullFrame()) {
                    drawFullFrame(ruleShape.getCanvasPoints(), isEnabled);
                }
                else if (ruleShape.isAOI()) {
                    drawAOI(ruleShape.getCanvasPoints(), ruleShape.getControlHandles(), isEnabled);
                }
                else {
                    nLines = ruleShape.getLines();
                    for (i = 0; i < nLines; i++) {
                        _canvasCtx.save();
                        drawTripwireSegments(ruleShape.getCanvasPoints(i),
                                             ruleShape.getDirection(i), isEnabled);
                        _canvasCtx.restore();

                        if (isEnabled && (_selectionIndex === i)) {
                            drawControlHandles(_canvasCtx, ruleShape.getControlHandles(i));
                        }
                    }

                    if (isEnabled && (nLines > 1)) {
                        // Label tripwires.
                        for (i = 0; i < nLines; i++) {
                            points = ruleShape.getCanvasPoints(i);
                            drawLabel(String.fromCharCode(startLabel + i),
                                      points[0], points[1]);
                        }
                    }
                }                
            }
        };


        // Initialize
        if (! Boolean(canvas) || ! canvas.length) {
            throw new Error('Invalid argument: canvas');
        }
        else if (undefined === canvas[0].getContext) {
            $.log('ERROR: Browser does not support canvas element. Rule markup will not be displayed.');
        }
        else {
            _canvasCtx = canvas[0].getContext("2d");
        }

        // Return the markupCanvas object
        return {

            /**
             * Gets the canvas element to which this markupCanvas
             * object is attached.
             * @return The jQuery-wrapped canvas element that was used
             *          to construct this object.
             */
            getCanvasElement: function() {
                return canvas;
            },

            /**
             * Sets the width and height of the marker canvas.
             * @param {Number} Width in pixels.
             * @param {Number} Height in pixels.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If either pxWidth or pxHeight is not an number.
             */
            setDimensions: function(pxWidth, pxHeight) {
                var i;

                if ((pxWidth === undefined) || (typeof pxWidth !== 'number') || isNaN(pxWidth)) {
                    throw new Error('Invalid argument: pxWidth');
                }
                if ((pxHeight === undefined) || (typeof pxHeight !== 'number') || isNaN(pxHeight)) {
                    throw new Error('Invalid argument: pxHeight');
                }

                // Note: We set the width and height attributes of the canvas
                // element, rather than width and height css properties,
                // because the cavas drawing functions will not scale correctly
                // without direct width and height attributes.
                canvas.prop('width',  pxWidth).prop('height', pxHeight);

                // Scale existing ruleShapes, if any.
                $.each(_shapes, function() {
                        this.scalePoints(pxWidth, pxHeight);
                    });

                // Scale existing filters, if any.
                $.each(_filters, function() {
                        this.scaleRects(pxWidth, pxHeight);
                    });
                    
                // Scale the samples.
                for (i = 0; i < _personCalibrationSampleShapes.length; i++) {
                    _personCalibrationSampleShapes[i].scaleShape(pxWidth, pxHeight);
                }
                
                return this;
            },

            /**
             * Gets the width of the marker canvas.
             * @return {Number} The width of the marker canvas in pixels.
             */
            width: function() {
                return canvas.width();
            },

            /**
             * Gets the height of the marker canvas.
             * @return {Number} The height of the marker canvas in pixels.
             */
            height: function() {
                return canvas.height();
            },

            /**
             * Indicates whether or not rule markup is shown.
             * @return {Boolean} true if rule markup is shown, false if it is hidden.
             */
            isMarkupShown: function() {
                return _isShowing;
            },

            /**
             * Shows rule markup on the snapshot and updates the
             * appearance of the Show/Hide button accordingly.
             * @return {Object} This markupCanvas object.
             */
            show: function() {
                var i;
                var propName;

                // Set show/hide state to showing.
                _isShowing = true;

                if (_canvasCtx) {
                    // Clear any previous drawing from the canvas.
                    clearCanvas();
    
                    // Draw each event definition.
                    for (propName in _shapes) {
                        if (typeof _shapes[propName] !== 'function') {
                            drawRuleShape(_shapes[propName],
                                          (_highlightedEventId === propName));
                        }
                    }
    
                    // Draw each filter.
                    for (propName in _filters) {
                        if (typeof _filters[propName] !== 'function') {
                            _filters[propName].drawRects(_canvasCtx);
                        }
                    }
                    
                    // Draw each person calibration shape
                    for (i = 0; i < _personCalibrationSampleShapes.length; i++) {
                        _personCalibrationSampleShapes[i].drawShape(_canvasCtx);
                    }
                }

                return this;
            },

            /**
             * Hides rule markup on the snapshot and updates the
             * appearance of the Show/Hide button accordingly.
             * @return {Object} This markupCanvas object.
             */
            hide: function() {
                _isShowing = false;
                clearCanvas();
                return this;
            },

            /**
             * Redraws the rule markup on the snapshot, if markup is not set
             * to the hidden state.
             * @return {Object} This markupCanvas object.
             */
            redraw: function() {
                if (_isShowing) {
                    this.show();
                }
                return this;
            },


            /**
             * Returns true if this object's collection of events includes an
             * event with the given id; returns false otherwise.
             * @param {String} id The rule ID associated with the event
             *         definition.
             * @return {Boolean} True if this object has an event with the
             *                    specified id; false, otherwise.
             * @exception {Error} If id is not a non-null, non-empty string.
             */
            hasEvent: function(id) {
                if (! Boolean(id) || (typeof id !== 'string')) {
                    throw new Error('Invalid argument: id');
                }
                return Boolean(_shapes[id]);
            },


            /**
             * Adds an event defintion to this object's collection of event
             * markup to be drawn on the snapshot.
             * @param {String} id The rule ID associated with the event
             *         definition.
             * @param {Object} eventDefinition The event defintion to
             *         be added to this object's collection.
             * @param {Boolean} isHighlighted Optional. If true, the markup
             *                   for the newly event will be highlighted;
             *                   if false or if not specified, the event's
             *                   markup will not be highlighted.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If id is not a non-null, non-empty string
             *                     or if eventDefinition is not a non-null object.
             */
            addEvent: function(id, eventDefinition, isHighlighted) {
                var ruleShape;

                if (! Boolean(id) || (typeof id !== 'string')) {
                    throw new Error('Invalid argument: id');
                }
                if (! Boolean(eventDefinition) ||
                        (typeof eventDefinition !== 'object') ||
                        (eventDefinition.typeOf === undefined)) {
                    throw new Error('Invalid argument: eventDefinition');
                }

                ruleShape = createRuleShape(eventDefinition, canvas.width(),
                                            canvas.height());
                if (ruleShape) {
                    _shapes[id] = ruleShape;
                    if (isHighlighted) {
                        _highlightedEventId = id;
                    }
                }

                return this;
            },


            /**
             * Removes the event definition associated with the given
             * rule ID from this object's collection of events.
             * @param {String} id The rule ID associated with the event
             *         definition to be removed.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If id is not a non-null, non-empty string.
             */
            removeEvent: function(id) {
                if (! Boolean(id) || (typeof id !== 'string')) {
                    throw new Error('Invalid argument: id');
                }

                delete _shapes[id];

                if (id === _highlightedEventId) {
                    _highlightedEventId = null;
                    _selectionIndex = -1;
                }

                return this;
            },


            /**
             * Removes all event definitions from this object's
             * collection of events.
             * @return {Object} This markupCanvas object.
             */
            removeEvents: function() {
                _shapes = {};
                _highlightedEventId = null;
                _selectionIndex = -1;
                return this;
            },


            /**
             * Returns true if this object's collection of filters includes
             * a filter with the given type name.
             * @param {String} typeName The unique filter name, e.g., 'minimumSizeFilter'
             *                  or 'maximumSizeFilter'
             * @return {Boolean} True if this object has a filter of the
             *                    type specified; false, otherwise.
             * @exception {Error} If typeName a null or empty string.
             */
            hasFilter: function(typeName) {
                if (! Boolean(typeName) || (typeof typeName !== 'string')) {
                    throw new Error('Invalid argument: typeName');
                }
                return Boolean(_filters[typeName]);
            },


            /**
             * Adds a filter defintion to this object's collection of filter
             * markup to be drawn on the snapshot.
             * @param {Object} filter An instance of objectvideo.ovready.maximumSizeFilter
             *                  or objectvideo.ovready.minimumSizeFilter.
             * @return {Object} This markupCanvas object.
             * @exception (Error} If filter argument is null or not of the expected type.
             */
            addFilter: function(filter) {
                if (! Boolean(filter) || (typeof filter !== 'object') ||
                        (filter.nearRect === undefined) ||
                        (filter.farRect === undefined)) {
                    throw new Error('Invalid argument: filter');
                }
                
                _filters[filter.typeOf] = createFilterShape(filter.nearRect,
                                                            filter.farRect,
                                                            canvas.width(),
                                                            canvas.height(),
                                                            filter.midRect);
                                                            
                if (_isShowing) {
                    this.show();
                }

                return this;
            },


            /**
             * Removes from this object's collection of filters the filter
             * definition having the given type name, if any. 
             * @param {String} typeName  The unique filter name, e.g., 'minimumSizeFilter'
             *                  or 'maximumSizeFilter'
             * @return {Object} This markupCanvas object.
             */
            removeFilter: function(typeName) {
                if (! Boolean(typeName) || (typeof typeName !== 'string')) {
                    throw new Error('Invalid argument: typeName');
                }
                delete _filters[typeName];

                if (_isShowing) {
                    this.show();
                }
            },


            /**
             * Removes all filters from this object's collection of filters.
             * @return {Object} This markupCanvas object.
             */
            removeFilters: function() {
                _filters = {};
                return this;
            },
            
            /**
             * Adds a default personCalibrationSample to the canvas, creating a shape
             * first.
             * @param (Boolean) isSelected true is this shape should be selected to start
             * @return {Object} This markupCanvas object.
             */
            addDefaultPersonCalibrationSample: function (isSelected) {
                var sample = objectvideo.ovready.personCalibrationSample();
                // center the new sample on the canvas, taller than wide
                // center the head and foot within that box horizontally,
                // but place the foot below the head
                // here would be a good place to have different default 
                // sizes/shapes based on camera placement settings
                var w = canvas.width();
                var h = canvas.height();
                // taller than wider
                var boxH = h * 0.20;
                var boxW = w * 0.10;
                // center it
                var boxX = (w/2) - (boxW /2);
                var boxY = (h/2) - (boxH /2);
                // now normalize
                sample.boundingBox = objectvideo.ovready.rect();
                sample.boundingBox.x = boxX / w;
                sample.boundingBox.y = boxY / h;
                sample.boundingBox.width = boxW/w;
                sample.boundingBox.height = boxH/h;
                // center point horizontally on the screen
                var ptX = w/2;
                // now for the foot, make the pt y high enough to enclose
                // the foot box within the outer rect
                var halfLen = _personSampleSettings.footLength * h;
                var ptY = boxY + boxH - (halfLen) - 4; // -4 for a little buffer
                sample.footPoint = objectvideo.ovready.point();
                // normalize!
                sample.footPoint.x = ptX / w;
                sample.footPoint.y = ptY/h;
                // the head should be moved down a little
                var radius = _personSampleSettings.headRadius * h;
                ptY = boxY + (radius) + 4; // +4 for a little buffer
                sample.headPoint = objectvideo.ovready.point();
                sample.headPoint.x = ptX / w;
                sample.headPoint.y = ptY/h;
                var shape = createPersonCalibrationSampleShape(sample,
                    canvas.width(), canvas.height(), isSelected);
                return this.addPersonCalibrationSampleShape(shape);
            },
            
            /**
             * Adds a personCalibrationSample to the canvas, creating a shape
             * first.
             * @param {Object} sample the personCalibrationSample to add.
             * @param (Boolean) isSelected true is this shape should be selected to start
             * @return {Object} This markupCanvas object.
             */
            addPersonCalibrationSample: function (sample, isSelected) {
                var shape = createPersonCalibrationSampleShape(sample,
                    canvas.width(), canvas.height(), isSelected);
                return this.addPersonCalibrationSampleShape(shape);
            },
            
            /**
             * Adds a personCalibrationSampleShape to the canvas. This is used when moving
             * a shape from one canvas to another.
             * @param {Object} shape the personCalibrationSampleShape to add.
             * @return {Object} This markupCanvas object.
             */
            addPersonCalibrationSampleShape: function (shape) {
                _personCalibrationSampleShapes.push(shape);
                this.redraw();
                return this;
            },
            
            /**
             * Returns the selected sample shape if any.
             * @return {Object} The selected personCalibrationSampleShape or undefined if
             *                  there is no selection.
             */
            getPersonCalibrationShapeSelection: function () {
                for (var i =0; i < _personCalibrationSampleShapes.length; i++) {
                    if (_personCalibrationSampleShapes[i].isSelected()) {
                        return _personCalibrationSampleShapes[i];
                    }
                }
                return undefined;  
            },
            
            /**
             * Returns the number of shapes or zero if none.
             * @return the number of shapes
             */
            getPersonCalibrationShapeCount: function() {
                return _personCalibrationSampleShapes.length;
            },
            
            /**
             * Returns the entire collection of shapes
             */
            getPersonCalibrationSamples: function() {
                // TODO: error handling
                var samples = [];
                for (var i = 0; i < _personCalibrationSampleShapes.length; i++) {
                    var sample = _personCalibrationSampleShapes[i].getSample();
                    samples.push(sample);
                }
                return samples;
            },


            /**
             * Removes all of the calibration shapes in the canvas.
             */
            clearPersonCalibrationShapes: function() {
                _personCalibrationSampleShapes = [];
                this.redraw();
            },


            /**
             * Removes the sample shape, provided it exists in the canvas. Returns the
             * removed shape or undefined if it could not be found.
             * @param {Object} shape the personCalibrationSampleShape to remove.
             * @return {Object} The removed personCalibrationSampleShape or undefined if
             *                  not found.
             */
            removePersonCalibrationShape: function (shape) {
                var i;
                var s = undefined;
                if (shape === undefined) {
                    return s;
                }

                for (i = 0; i < _personCalibrationSampleShapes.length; i++) {
                    if (_personCalibrationSampleShapes[i]===shape) {
                        s = _personCalibrationSampleShapes[i];
                        _personCalibrationSampleShapes.splice(i, 1);
                        this.redraw();
                        break;
                    }
                }
                return s;  
            },
            
            /**
             * Returns the sample shape at the given point, if any. The hitInfo will 
             * contain extra information on where in the shape the pt lies.
             * @param {Object} pt An object having numeric properties x and y
             *                  which describe the screen coordinates of the
             *                  point to test.
             * @param {Object} hitInfo Optional. If specified and if the
             *                  function returns true, this object will contain
             *                  additional details on where the point intersected
             *                  the filter rectangle. 
             * @return {Object} The selected personCalibrationSampleShape or undefined if
             *                  there is no selection.
             */
            getPersonCalibrationShapeAtPoint: function (pt, hitInfo) {
                var i;
                var shape = undefined;
                var isInside = false;

                if (! Boolean(pt) || (typeof pt !== 'object') ||
                        (pt.x === undefined) || (pt.y === undefined)) {
                    throw new Error('Invalid argument: pt');
                }
    
                if (hitInfo) {
                    if (typeof hitInfo !== 'object') {
                        throw new Error('Invalid argument: hitInfo');
                    }
                    hitInfo.isInControl = false;
                }
                
                for (i = 0; i < _personCalibrationSampleShapes.length; i++) {
                    if (_personCalibrationSampleShapes[i].getShape().isPtInside(pt, hitInfo)) {
                        hitInfo.index = i;
                        shape = _personCalibrationSampleShapes[i];
                        break;
                    }
                }
                return shape;  
            },
            
            /**
             * Resize the specified filter rectangle.
             * @param {Object} shape The shape to resoze.
             * @param {Number} controlIndex Index of the control handle used to
             *                               resize this shape.
             * @param {Object} pt The point in canvas coordinates to which the control
             *                     handle specified by controlIndex will be moved as
             *                     a result of resizing the shape rectangle.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If any argument is not valid.
             */
            resizePersonCalibrationShape: function(shape, controlIndex, pt) {
                if (! shape) {
                    throw new Error('Invalid argument: shape');
                }
                if ((controlIndex === undefined) || (typeof controlIndex != 'number') || isNaN(controlIndex)) {
                    throw new Error('Invalid argument: controlIndex');
                }
                shape.resizeShape(controlIndex, pt);

                return this;
            },
            
            

            /**
             * Sets visible highlighting of event markup associated
             * with the given rule ID. Redraws the rule markup on the
             * snapshot, if markup is not set to the hidden state.
             *
             * @param {String} id The rule ID associated with the event
             *         definition whose markup is to be highlighted.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If id is not a non-null, non-empty string.
             */
            setEventHighlight: function(id) {
                if (! Boolean(id) || (typeof id !== 'string')) {
                    throw new Error('Invalid argument: id');
                }

                _highlightedEventId = id;

                if (_isShowing) {
                    this.show();
                }

                return this;                    
            },


            /**
             * Removes visible highlighting of event markup, if any, set by
             * a previous call to setEventHighlight. Redraws the rule markup
             * on the snapshot, if markup is not set to the hidden state.
             *
             * @return {Object} This markupCanvas object.
             */
            clearEventHighlight: function() {
                _highlightedEventId = null;
                if (_isShowing) {
                    this.show();
                }
                return this;                    
            },


            /**
             * Sets or clears the visible selection state of the event markup.
             * Note that the selection only applies to the highlighted event,
             * so setHighlightEvent must be called for this function to have
             * any effect.
             * @param {Boolean} isSelected True if the event(s) is/are
             *                   selected, false if not selected.
             * @param {Number} shapeIndex Optional. 0 or 1, indicating
             *                  which part of a multi-part shape is selected.
             * @return {Object} This markupCanvas object.
             * @exception {RangeError} If shapeIndex is specified, but is not
             *                          0 or 1.
             */
            setSelection: function(isSelected, shapeIndex) {
                if (shapeIndex !== undefined) {
                    if ((typeof shapeIndex !== 'number') ||
                            (((shapeIndex < 0) || (shapeIndex > 1)))) {
                        throw new RangeError('Invalid argument: shapeIndex');
                    }
                }
                else {
                    shapeIndex = _selectionIndex;
                }

                _selectionIndex = isSelected ? shapeIndex : -1;
                return this;
            },


            /**
             * Gets the event markup selection index, if defined.
             * Note that the selection index applies to the highlighted event,
             * if any.
             * @return {Number} The zero-based index of the selected event
             *                   markup shape, or undefined if no shape
             *                   is selected.
             */
            getSelection: function() {
                return (_selectionIndex !== -1) ? _selectionIndex : undefined;
            },


            /**
             * Returns a numeric value indicating whether the given point
             * falls within the markup area of the currently highlighted
             * event.
             *
             * For multiline tripwire events, this function returns 0 if the
             * point does not intersect either of the tripwire lines, 1 if the
             * point intersects the first line, and 2 if it intersects the
             * second line. For other event types, the function returns either
             * 0, indicating that the point does not intersect the event markup,
             * or 1, indicating that is does intersect the markup.
             * If no event is currently highlighted, this function returns 0.
             *
             * If the function returns true and if the hitInfo object has
             * been specified, upon return, the hitInfo object will have
             * additional details as follows:
             * <ul>
             *   <li>index - 0 or 1, indicating which part of a mult-part
             *       markup shape was hit</li>
             *   <li>isInControl - true if the point is in one of the
             *       markup shape's control handles, false otherwise</li>
             *   <li>controlIndex - if isInControl is true, a zero-based integer
             *       index indicating which control handle was hit; undefined if
             *       isInControl is false</li>
             * </ul>
             * @param {Object} pt An object having numeric properties x and y
             *                  which describe the screen coordinates of the
             *                  point to test.
             * @param {Object} hitInfo Optional. If specified and if the
             *                  function returns true, this object will contain
             *                  additional details on where the point intersected
             *                  the event markup. 
             * @return {Boolean} False if the point lies outside the markup area
             *                   of the highlighted event, true if it
             *                   intersects the markup area.
             * @exception {Error} If pt is not a point object.
             */
            isPointInShape: function(pt, hitInfo) {
                var isInside = false;
                var ruleShape;
                var i, nPolys;

                if (! Boolean(pt) || (typeof pt !== 'object') ||
                        (pt.x === undefined) || (pt.y === undefined)) {
                    throw new Error('Invalid argument: pt');
                }

                if (hitInfo) {
                    if (typeof hitInfo !== 'object') {
                        throw new Error('Invalid argument: hitInfo');
                    }

                    hitInfo.index = 0;
                    hitInfo.isInControl = false;
                    hitInfo.controlIndex = undefined;
                }
    
                // Get the highlighted rule shape object.
                if ((_highlightedEventId === null) ||
                            _shapes[_highlightedEventId] === undefined) {
                    // No event markup is highlighted, so nothing to do
                    return false;
                }

                ruleShape = _shapes[_highlightedEventId];
                if (ruleShape.isFullFrame()) {
                    // A point is always inside a highlighted full-frame shape.
                    return true;
                }

                if (_selectionIndex !== -1) {
                    // Check for a hit in the shape's control points.
                    $.each(ruleShape.getControlHandles(_selectionIndex), function(ctlIdx) {
                            if (this.isPtInRect(pt)) {
                                if (hitInfo) {
                                    hitInfo.index = _selectionIndex;
                                    hitInfo.isInControl = true;
                                    hitInfo.controlIndex = ctlIdx;
                                }
                                isInside = true;                            
                            }
                            return (! isInside);
                        });
                }

                if (! isInside) {
                    if (ruleShape.isAOI()) {
                        nPolys = 1;                        
                    }
                    else {
                        nPolys = ruleShape.getLines();
                    }
                    for (i = 0; i < nPolys; i++) {
                        // Check for a hit in the shape's enclosing polygon(s).
                        if (ruleShape.getEnclosingPolygon(i).isPointInside(pt)) {
                            if (hitInfo) {
                                hitInfo.index = i;
                            }
                            isInside = true;
                            break;
                        }
                    }
                }

                return isInside;
            },


            /**
             * Returns true if the given point falls within a filter rectangle.
             *
             * If the function returns true and if the hitInfo object has
             * been specified, upon return, the hitInfo object will have
             * additional details as follows:
             * <ul>
             *   <li>index - 0 if the near rectangle was hit, 1 if the far
             *       rectangle was hit</li>
             *   <li>isInControl - true if the point is in one of the
             *       rectangle's control handles, false otherwise</li>
             *   <li>controlIndex - if isInControl is true, a zero-based integer
             *       index indicating which control handle was hit; undefined if
             *       isInControl is false</li>
             *   <li>typeName - the type of filter that was hit</li>
             * </ul>
             * @param {Object} pt An object having numeric properties x and y
             *                  which describe the screen coordinates of the
             *                  point to test.
             * @param {Object} hitInfo Optional. If specified and if the
             *                  function returns true, this object will contain
             *                  additional details on where the point intersected
             *                  the filter rectangle. 
             * @return {Boolean} False if the point lies outside either filter
             *                   rectangle, true if it intersects either rectangle.
             * @exception {Error} If pt is not a point object.
             */
            isPointInFilter: function(pt, hitInfo) {
                var isInside = false;

                if (! Boolean(pt) || (typeof pt !== 'object') ||
                        (pt.x === undefined) || (pt.y === undefined)) {
                    throw new Error('Invalid argument: pt');
                }
    
                if (hitInfo) {
                    if (typeof hitInfo !== 'object') {
                        throw new Error('Invalid argument: hitInfo');
                    }

                    hitInfo.isInControl = false;
                }
    
                for (propName in _filters) {
                    if (typeof _filters[propName] !== 'function') {
                        // First, check to see if the point falls inside the
                        // near rectangle, then check the far rectangle.
                        if (_filters[propName].getRect(filterRectIndex.near).isPtInside(pt, hitInfo)) {
                            hitInfo.index = filterRectIndex.near;
                            hitInfo.typeName = propName;
                            return true;                            
                        }
                        else if (_filters[propName].getRect(filterRectIndex.far).isPtInside(pt, hitInfo)) {
                            hitInfo.index = filterRectIndex.far;
                            hitInfo.typeName = propName;
                            return true;                            
                        }
                        else if (_filters[propName].getRect(filterRectIndex.mid).isPtInside(pt, hitInfo)) {
                            hitInfo.index = filterRectIndex.mid;
                            hitInfo.typeName = propName;
                            return true;                            
                        }
                    }
                }

                return false;
            },

            /**
             * Returns true if the given point falls within a person calibration shape
             *
             * If the function returns true and if the hitInfo object has
             * been specified, upon return, the hitInfo object will have
             * additional details as follows:
             * <ul>
             *   <li>index - of the shape that was selected</li>
             *   <li>isInControl - true if the point is in one of the
             *       rectangle's control handles, false otherwise</li>
             *   <li>controlIndex - if isInControl is true, a zero-based integer
             *       index indicating which control handle was hit; undefined if
             *       isInControl is false</li>
             *   <li>isInHead - if the pt is in the head circle</li>
             *   <li>isInFoot - if the pt is in the foot rect </li>
             * </ul>
             * @param {Object} pt An object having numeric properties x and y
             *                  which describe the screen coordinates of the
             *                  point to test.
             * @param {Object} hitInfo Optional. If specified and if the
             *                  function returns true, this object will contain
             *                  additional details on where the point intersected
             *                  the shape. 
             * @return {Boolean} False if the point lies outside any shape, true if within.
             * @exception {Error} If pt is not a point object.
             */
            isPointInPersonCalibrationShape: function(pt, hitInfo) {
                var i;
                var isInside = false;

                if (! Boolean(pt) || (typeof pt !== 'object') ||
                        (pt.x === undefined) || (pt.y === undefined)) {
                    throw new Error('Invalid argument: pt');
                }
    
                if (hitInfo) {
                    if (typeof hitInfo !== 'object') {
                        throw new Error('Invalid argument: hitInfo');
                    }

                    hitInfo.isInControl = false;
                }
                for (i = 0; i < _personCalibrationSampleShapes.length; i++) {
                    if (_personCalibrationSampleShapes[i].getShape().isPtInside(pt, hitInfo)) {
                        hitInfo.index = i;
                        return true;
                    }
                }
                return false;
            },


            /**
             * Draws a "rubber band" effect to illustate a new line being drawn.
             * @param {Object} anchorPt An object having numeric properties
             *                  x and y giving the canvas coordinates of the
             *                  start point of the line segment.
             * @param {Object} currentPt An object having numeric properties
             *                  x and y giving the canvas coordinates of the
             *                  line segment end point.
             * @param {String} direction. Optional. If specified, the
             *                   direction of the tripwire to be drawn.
             * @return {Object} This markupCanvas object.
             */
            drawLineFeedback: function(anchorPt, currentPt, direction) {
                var points = [anchorPt, currentPt];

                if (_canvasCtx) {
                    clearCanvas();

                    // Draw each event definition.
                    for (propName in _shapes) {
                        if (typeof _shapes[propName] !== 'function') {
                            drawRuleShape(_shapes[propName],
                                          (_highlightedEventId === propName));
                        }
                    }

                    if (currentPt) {
                        drawTripwireSegments(points, direction || tripwireDirections.AnyDirection,
                                             true);
                        drawControlPoints(_canvasCtx, points);
                    }
                }
                return this;
            },


            /**
             * Draws a "rubber band" effect to illustate a new polygon being drawn.
             * @param {Array} points An array of object having numeric properties
             *                  x and y giving the canvas coordinates of the
             *                  vertices of an open polygon.
             * @return {Object} This markupCanvas object.
             */
            drawPolylineFeedback: function(points) {
                if (_canvasCtx) {
                    clearCanvas();

                    // Draw each event definition.
                    for (propName in _shapes) {
                        if (typeof _shapes[propName] !== 'function') {
                            drawRuleShape(_shapes[propName],
                                          (_highlightedEventId === propName));
                        }
                    }

                    if (! points) {
                        _shapes = {};
                        _highlightedEventId = null;
                        _selectionIndex = -1;
                    }
                    else if (points.length > 0) {
                        drawAoiSegments(points);
                        drawControlPoints(_canvasCtx, points);
                    }
                }
                return this;
            },


            /**
             * Draws a "rubber band" effect to show that the specified control
             * point is being dragged.
             * @param {String} id The rule ID associated with the shape being dragged.
             * @param {Object} newPt An object having numeric properties
             *                  x and y giving the canvas coordinates of the
             *                  point to which the control has been dragged.
             * @param {Number} controlIndex Zero-based integer index indicating
             *                  which control point is being dragged.
             * @param {Number} shapeIndex Optional. If specified, 0 or 1,
             *                  indicating which part of a multi-part shape is selected.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If any argument is not valid.
             */
            drawDragFeedback: function(id, newPt, controlIndex, shapeIndex) {
                var propName;

                if (! Boolean(id) || (typeof id !== 'string')) {
                    throw new Error('Invalid argument: id');
                }
                if ((! newPt) || (typeof newPt != 'object')) {
                    throw new Error('Invalid argument: newPt');
                }
                if ((controlIndex === undefined) || (typeof controlIndex != 'number') || isNaN(controlIndex)) {
                    throw new Error('Invalid argument: controlIndex');
                }

                if (_canvasCtx) {
                    clearCanvas();

                    // Draw all shapes (if any), except the one for which we are providing feedback.
                    for (propName in _shapes) {
                        if ((typeof _shapes[propName] !== 'function') &&
                                (propName !== id)) {
                            drawRuleShape(_shapes[propName], false);
                        }
                    }

                    // Now, with the shape for which we are providing feedback,
                    // call its movePoint method, the draw it.
                    if (_shapes[id]) {
                        drawRuleShape(_shapes[id].movePoint(newPt, controlIndex, shapeIndex),
                                      true);
                    }
                }
                return this;
            },
            
            /**
             * Redraws the specified person calibration shape at new location.
             * @param {Object} shape The shape to move.
             * @param {Number} xOffset The amount to add to the rectangle's
             *                          x-axis coordinates.
             * @param {Number} yOffset The amount to add to the rectangle's
             *                          y-axis coordinates.
             * @param (Object) hitInfo extra information about what part to move
             * @return {Object} This markupCanvas object.
             * @exception {Error} If any argument is not valid.
             */
            movePersonCalibrationShape: function(shape, xOffset, yOffset, isInHead, isInFoot) {
                if (shape !== undefined) {
                    if (_canvasCtx) {

                        // Move the specified filter rectangle.
                        shape.move(xOffset, yOffset, isInHead, isInFoot);
                        this.redraw();
                    }
                }
                return this;
            },


            /**
             * Redraws the specified filter rectangle in a new location.
             * @param {String} typeName The unique name of the filter being dragged,
             *                           e.g., 'minimumSizeFilter' or 'maximumSizeFilter'.
             * @param {Number} index Index of the filter rectangle to move
             *                        where 0 is near and 1 is far.
             * @param {Number} xOffset The amount to add to the rectangle's
             *                          x-axis coordinates.
             * @param {Number} yOffset The amount to add to the rectangle's
             *                          y-axis coordinates.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If any argument is not valid.
             */
            moveFilter: function(typeName, index, xOffset, yOffset) {
                if (! typeName || ! _filters[typeName]) {
                    throw new Error('Invalid argument: typeName');
                }
                if (index !== 0 && index !== 1&&index!=2) {
                    throw new Error('Invalid argument: index must be 0 or 1');
                }
                if (typeof xOffset !== 'number' || isNaN(xOffset)) {
                    throw new Error('Invalid argument: xOffset');
                }
                if (typeof yOffset !== 'number' || isNaN(yOffset)) {
                    throw new Error('Invalid argument: yOffset');
                }

                if (_canvasCtx) {
                    // Erase the canvas.
                    clearCanvas();

                    // Move the specified filter rectangle.
                    _filters[typeName].getRect(index).move(xOffset, yOffset);

                    // Redraw the entire filter.
                    _filters[typeName].drawRects(_canvasCtx);
                }

                return this;
            },


            /**
             * Resize the specified filter rectangle.
             * @param {String} typeName The unique name of the filter being dragged,
             *                           e.g., 'minimumSizeFilter' or 'maximumSizeFilter'.
             * @param {Number} shapeIndex Index of the filter rectangle to move
             *                             where 0 is near and 1 is far.
             * @param {Number} controlIndex Index of the control handle used to
             *                               resize this filter.
             * @param {Object} pt The point in canvas coordinates to which the control
             *                     handle specified by controlIndex will be moved as
             *                     a result of resizing the filter rectangle.
             * @return {Object} This markupCanvas object.
             * @exception {Error} If any argument is not valid.
             */
            resizeFilter: function(typeName, shapeIndex, controlIndex, pt) {
                var masterRect, slaveRect;

                if (! typeName || ! _filters[typeName]) {
                    throw new Error('Invalid argument: typeName');
                }
//                if (shapeIndex !== 0 && shapeIndex !== 1) {
//                    throw new Error('Invalid argument: shapeIndex must be 0 or 1');
//                }
                if ((controlIndex === undefined) || (typeof controlIndex != 'number') || isNaN(controlIndex)) {
                    throw new Error('Invalid argument: controlIndex');
                }

                masterRect = _filters[typeName].getRect(shapeIndex);
                if (shapeIndex === filterRectIndex.near) {
                    slaveRect = _filters[typeName].getRect(filterRectIndex.far);
                }
                else if(shapeIndex === filterRectIndex.mid){
                    slaveRect = _filters[typeName].getRect(filterRectIndex.mid);
                }
                else {
                    slaveRect = _filters[typeName].getRect(filterRectIndex.near);
                }

                masterRect.outerRect.resize(controlIndex, pt, true);
//                slaveRect.outerRect.resizeToMatchAspect(masterRect.outerRect,
//                                                        controlIndex,
//                                                        canvas.width(), canvas.height());
                masterRect.createControlHandles();
                slaveRect.createControlHandles();

                return this;
            },


            /**
             * Gets the specified filter rectangle in normalized, OV Ready coordinates.
             * @param {String} typeName The unique name of the filter, e.g.,
             *                           'minimumSizeFilter' or 'maximumSizeFilter'.
             * @param {Number} index Index of the filter rectangle where 0 is
             *                        near and 1 is far.
             * @return {Object} A rectangle object whose coordinates, width,
             *                   and height are in the range 0.0 to 1.0.
             * @exception {Error} If typeName is not a known filter name or if
             *                     index is not 0 or 1.
             */
            getFilterRect: function(typeName, index) {
                var rect;

                if (! typeName || ! _filters[typeName]) {
                    throw new Error('Invalid argument: typeName');
                }
                if (index !== 0 && index !== 1&&index!==2) {
                    throw new Error('Invalid argument: index must be 0 or 1');
                }

                rect = _filters[typeName].getRect(index).outerRect;
                return createRectangle(rect.x / canvas.width(),
                                        rect.y / canvas.height(),
                                        rect.width / canvas.width(),
                                        rect.height / canvas.height());
            },


            /**
             * ���ݴ����ֵ�����ߵĿ��.
             * @param {Number} thickness �ߵĴ�ϸֵ.
             * @{Object} This markupCanvas object.
             * @exception {Error} ��������ֵ�������ֻ�ֵС��1
             */
            setLineThickness: function (thickness) {
				_tripwireSettings.thickness=thickness;
				return this;
			}
        };
    };


    // Add markupCanvas to the objectvideo.snapshot module object.

    /**
     * Returns a new markupCanvas object which draws rule markup on a canvas.
     * @param {Object} canvas A jQuery-wrapped canvas element.
     * @return {Object} A new markupCanvas object.
     * @exception {Error} If canvas is not a valid canvas element.
     */
    objectvideo.snapshot.markupCanvas = function createMarkupCanvas(canvas) {
        return markupCanvas(canvas);
    };

})(jQuery);

