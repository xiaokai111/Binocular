/**
* "The Software contains copyright protected material, trade secrets and other proprietary information 
* and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws, 
* international copyright treaties and trade secret laws, as well as other intellectual property laws and
* treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852, 
* 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
*/

/**
* @file geometry.js
* geometry module
*/

objectvideo.geometry = {};

(function ($) {


    /**
    * Enumeration of rectangle edge and corner directions.
    */
    var rectDirection = {
        /** The upper, left corner */
        northWest: 0,
        /** The top edge */
        north: 1,
        /** The upper, right corner */
        northEast: 2,
        /** The right edge */
        east: 3,
        /** The bottom, right corner */
        southEast: 4,
        /** The bottom edge */
        south: 5,
        /** The bottom, left corner */
        southWest: 6,
        /** The left edge */
        west: 7
    };


    var createSize = function createSize(width, height) {
        var size = {
            /**
            * Width
            * @type {Number}
            */
            width: 0,

            /**
            * Height
            * @type {Number}
            */
            height: 0,

            /**
            * Returns a new size object that is a copy of this size.
            * @return {Object} A new size object that is a copy of this size.
            */
            clone: function () {
                return createSize(this.width, this.height);
            },

            /**
            * Returns whether the width and height of the given size are equal to
            * the width and height of this size.
            * @param {Object} otherSize The size object to compare to this point.
            * @return {Boolean} True if otherSize is equal to this size, false otherwise.
            */
            equals: function (otherSize) {
                return (this === otherSize) ||
                            (((otherSize !== undefined) && (otherSize !== null) &&
                            (this.width === otherSize.width) &&
                            (this.height === otherSize.height)));
            },

            /**
            * Returns a string representation of this size object.
            */
            toString: function () {
                return '[' + this.width + ', ' + this.height + ']';
            }
        };

        // Validate arguments, if any, and initialize object.
        if (width !== undefined) {
            if ((typeof width !== 'number') || isNaN(width)) {
                throw new Error('Invalid argument: width is not a number');
            }
            if ((typeof height !== 'number') || isNaN(height)) {
                throw new Error('Invalid argument: height is not a number');
            }

            size.width = width;
            size.height = height;
        }

        return size;
    };


    /**
    * Creates a new point object with the specified x and y coordinates.
    * If called without arguments, the new point is initialized to (0, 0).
    * @param {Number} x Optional. The x coordinate of the new point. 
    * @param {Number} y Optional. The y coordinate of the new point.
    * @return {Object} A new point object.
    * @exception {Error} If the x argument is specified but y is not, or if
    *                     either x or y is specified but is not a number.
    */
    var createPoint = function createPoint(x, y) {
        var pt = {
            /**
            * X coordinate
            * @type {Number}
            */
            x: 0,

            /**
            * Y coordinate
            * @type {Number}
            */
            y: 0,

            /**
            * Returns a new point object that is a copy of this point.
            * @return {Object} A new point object that is a copy of this point.
            */
            clone: function () {
                return createPoint(this.x, this.y);
            },

            /**
            * Returns the distance from this point to the specified point.
            * @param {Object} otherPt The point object to compare to this point.
            * @return {Number} The distance between otherPt and this point.
            */
            distanceFrom: function (otherPt) {
                var diff = this.difference(otherPt);
                return Math.sqrt((diff.width * diff.width) + (diff.height * diff.height));
            },

            /**
            * Returns whether the coordinates of the given point are equal to
            * the coordinates of this point.
            * @param {Object} otherPt The point object to compare to this point.
            * @return {Boolean} True if otherPt is equal to this point, false otherwise.
            */
            equals: function (otherPt) {
                return (this === otherPt) ||
                            (((otherPt !== undefined) && (otherPt !== null) &&
                            (this.x === otherPt.x) && (this.y === otherPt.y)));
            },

            /**
            * Returns whether the coordinates of the given point are near to
            * the coordinates of this point.
            * @param {Object} otherPt The point object to compare to this point.
            * @param {Number} threshold The maximum distance between this point
            *                            and otherPt that will be considered "near."
            * @return {Boolean} True if otherPt is no more than threshold units of
            *                    distance from this point, false otherwise.
            */
            isNear: function (otherPt, threshold) {
                if (!otherPt) {
                    return false;
                }
                else {
                    return Boolean(Math.abs(this.distanceFrom(otherPt)) < threshold);
                }
            },

            /**
            * Returns a new size object whose width and height properties
            * are the difference between the x and y values of this point
            * and the specified point.
            * @param {Object} otherPt The point from which this point will be subtracted.
            * @return {Object} A size object.
            */
            difference: function (otherPt) {
                if ((!otherPt) || (otherPt.x === undefined) || (otherPt.y === undefined)) {
                    throw new Error('Invalid argument: otherPt');
                }
                return createSize(otherPt.x - this.x, otherPt.y - this.y);
            },

            /**
            * Returns a string representation of this point object.
            */
            toString: function () {
                return '(' + this.x + ', ' + this.y + ')';
            }
        };

        // Validate arguments, if any, and initialize object.
        if (x !== undefined) {
            if ((typeof x !== 'number') || isNaN(x)) {
                throw new Error('Invalid argument: x is not a number');
            }
            if ((typeof y !== 'number') || isNaN(y)) {
                throw new Error('Invalid argument: y is not a number');
            }

            pt.x = x;
            pt.y = y;
        }

        return pt;
    };


    /**
    * Creates a new rectangle object with the specified coordinates and size.
    * If called without arguments, the rectangle will have width and height of
    * zero and its upper, left corner will be at point (0, 0).
    * @param {Number} x Optional. Coordinate of the left edge of the rectangle.
    * @param {Number} y Optional. Coordinate of the top edge of the rectangle.
    * @param {Number} width Optional. Width of the rectangle.
    * @param {Number} height Optional. Height of the rectangle.
    * @return {Object} A new rectangle object.
    * @exception {Error} If any parameter is specified, but is not a number.
    */
    var createRectangle = function (x, y, width, height) {
        /**
        * A size object specifying the smallest width and height allowed for this rectangle.
        * @type {Object}
        * @private
        */
        var _minSize = null;

        /**
        * A rectangle object giving the coordinates to which this rectangle's
        * movement will be constrained.
        * @type {Object}
        * @private
        */
        var _boundsRect = null;

        var _rectangle = {
            /**
            * X coordinate of the left edge of this rectangle
            * @type {Number}
            */
            x: 0,

            /**
            * Y coordinate of the top edge of this rectangle
            * @type {Number}
            */
            y: 0,

            /**
            * Width of this rectangle
            * @type {Number}
            */
            width: 0,

            /**
            * Height of this rectangle
            * @type {Number}
            */
            height: 0,


            /**
            * Returns a new rectangle object that is a copy of this rectangle.
            * @return {Object} A new rectangle object that is a copy of this rectangle.
            */
            clone: function () {
                return createRectangle(this.x, this.y, this.width, this.height);
            },

            /**
            * Returns whether the location and size of the given rectangle are
            * equal to the location and size of this rectangle.
            * @param {Object} otherRect The rectangle object to compare to this rectangle.
            * @return {Boolean} True if otherRect is equal to this rectangle, false otherwise.
            */
            equals: function (otherRect) {
                return (this === otherRect) ||
                            (((otherRect !== undefined) && (otherRect !== null) &&
                             (this.x === otherRect.x) &&
                             (this.y === otherRect.y) &&
                             (this.width === otherRect.width) &&
                             (this.height === otherRect.height)));
            },

            /**
            * Returns whether the given point falls within this rectangle.
            * @param {Object} pt The point to test for inclusion within this rectangle.
            * @return {Boolean} True if pt falls within this rectangle; false, otherwise.
            * @exception {Error} If pt is not a point object.
            */
            isPtInRect: function (pt) {
                return Boolean((this.x <= pt.x) && (pt.x <= (this.x + this.width)) &&
                        (this.y <= pt.y) && (pt.y <= (this.y + this.height)));
            },

            /**
            * Gets the top, left corner of this rectangle as a point object.
            * @return {Object} A point object with coordinates at the top,
            *                   left corner of this rectangle.
            */
            getTopLeft: function () {
                return createPoint(this.x, this.y);
            },

            /**
            * Returns a point at the center of this rectangle
            * @return {Object} A point object whose coordinates are at the center of this rectangle.
            */
            getCenter: function () {
                return createPoint(this.x + this.width / 2.0, this.y + this.height / 2.0);
            },

            /**
            * Set the coordinates of this rect based on center.
            * @param {Object} x
            * @param {Object} y
            */
            setCenter: function (centerX, centerY) {
                this.x = centerX - (this.width / 2);
                this.y = centerY - (this.height / 2);
            },

            /**
            * Gets the minimum size to which this rectangle can be resized.
            * @return {Object} A size object specifying this rectangle's minimum allowed size.
            */
            getMinSize: function () {
                return _minSize;
            },

            /**
            * Sets the minimum size to which this rectangle can be resized.
            * @param {Object} minSize  A size object specifying the minimum width
            *                  and height to which this rectangle will be restricted.
            */
            setMinSize: function (minSize) {
                _minSize = minSize.clone();
            },

            /**
            * Gets a rectangle object giving the coordinates to which this
            * rectangle's movement will be constrained.
            * @return {Object} A boundary rectangle or null if no boundary has been set.
            */
            getBoundsRect: function () {
                return _boundsRect;
            },

            /**
            * Sets a rectangle object giving the coordinates to which this
            * rectangle's movement will be constrained.
            * @param {Object} boundsRect A boundary rectangle or null.
            * @exception {Object} If boundsRect is not null and is not a rectangle object.
            */
            setBoundsRect: function (boundsRect) {
                if ((boundsRect !== null) && (typeof boundsRect.x !== 'number' ||
                                              typeof boundsRect.y !== 'number' ||
                                              typeof boundsRect.width !== 'number' ||
                                              typeof boundsRect.height !== 'number')) {
                    throw new Error('Invalid argument: boundsRect is not a rectangle');
                }
                _boundsRect = boundsRect;
            },

            /**
            * Move the rect by the given offset, but constrain the center point to 
            * be within the constraining rectangle.
            * @param {Number} xOffset the x offset to move to
            * @param {Number} yOffset the y offset to move to
            * @param {Object} constraintRect the rectangle that the rect center cannot move outside of
            * @param inset {Number} the number of pixels to be inset from
            * @return {Object} This rectangle object.
            */
            centerConstrainedMove: function (xOffset, yOffset, constraintRect, inset) {
                if (typeof xOffset !== 'number' || isNaN(xOffset)) {
                    throw new Error('Invalid argument: xOffset is not a number');
                }
                if (typeof yOffset !== 'number' || isNaN(yOffset)) {
                    throw new Error('Invalid argument: yOffset is not a number');
                }

                // Move the rectangle by the center
                var leftEdge = constraintRect.x + inset;
                var topEdge = constraintRect.y + inset;
                var rightEdge = constraintRect.x + constraintRect.width - inset;
                var bottomEdge = constraintRect.y + constraintRect.height - inset;

                var centerPt = this.getCenter();
                centerPt.x += xOffset;
                centerPt.y += yOffset;

                // coordinates of constraintRect.
                if (centerPt.x < leftEdge) {
                    // We are too far to the left, so move to the left
                    // edge of the boundary.
                    centerPt.x = leftEdge;
                }
                else if (centerPt.x > rightEdge) {
                    // We are too far to the right, so move to the right
                    // edge of the boundary.
                    centerPt.x = rightEdge;
                }

                if (centerPt.y < topEdge) {
                    // We are too far up, so move to the top edge of
                    // the boundary.
                    centerPt.y = topEdge;
                }
                else if (centerPt.y > bottomEdge) {
                    // We are too far down, so move to the bottom
                    // edge of the boundary.
                    centerPt.y = bottomEdge;
                }

                this.setCenter(centerPt.x, centerPt.y);

                return this;
            },

            /**
            * Moves this rectangle by the specified offsets.
            * @param {Number} xOffset The amount to add to this rectangle's
            *                          x-axis coordinates.
            * @param {Number} yOffset The amount to add to this rectangle's
            *                          y-axis coordinates.
            * @return {Object} This rectangle object.
            */
            move: function (xOffset, yOffset) {
                if (typeof xOffset !== 'number' || isNaN(xOffset)) {
                    throw new Error('Invalid argument: xOffset is not a number');
                }
                if (typeof yOffset !== 'number' || isNaN(yOffset)) {
                    throw new Error('Invalid argument: yOffset is not a number');
                }

                // Move the rectangle.
                this.x += xOffset;
                this.y += yOffset;

                if (_boundsRect) {
                    // coordinates of _boundsRect.
                    if (this.x < _boundsRect.x) {
                        // We are too far to the left, so move to the left
                        // edge of the boundary.
                        this.x = _boundsRect.x;
                    }
                    else if (this.x + this.width > _boundsRect.width) {
                        // We are too far to the right, so move to the right
                        // edge of the boundary.
                        this.x = _boundsRect.width - this.width;
                    }

                    if (this.y < _boundsRect.y) {
                        // We are too far up, so move to the top edge of
                        // the boundary.
                        this.y = _boundsRect.y;
                    }
                    else if (this.y + this.height > _boundsRect.height) {
                        // We are too far down, so move to the bottom
                        // edge of the boundary.
                        this.y = _boundsRect.height - this.height;
                    }
                }

                return this;
            },




            /**
            * Changes the size of this rectangle object. 
            * @param {Number} directionIdx The index of the edge or corner of
            *                  the rectangle being resized as enumerated by
            *                  rectDirection.
            * @param {Object} pt The coordinates to which the edge or
            *                  corner indicated by directionIdx is to be resized.
            * @param {Boolean} maintainAspect Optional. If true and if
            *                   directionIdx is one of the four corners,
            *                   preserve this rectangle's existing aspect ratio.
            * @return {Object} This rectangle object.
            */
            resize: function (directionIdx, pt, maintainAspect) {
                var right = this.x + this.width;
                var bottom = this.y + this.height;
                var aspect = this.height / this.width;
                var deltaLeft, deltaTop, deltaRight, deltaBottom;
                var minX, minY, offset, newVal = {};

                if (!pt) {
                    throw new Error('Invalid argument: pt');
                }

                if (_boundsRect) {
                    if (pt.x < _boundsRect.x) {
                        pt.x = _boundsRect.x;
                    }
                    else if (pt.x > _boundsRect.width) {
                        pt.x = _boundsRect.width;
                    }
                    if (pt.y < _boundsRect.y) {
                        pt.y = _boundsRect.y;
                    }
                    else if (pt.y > _boundsRect.height) {
                        pt.y = _boundsRect.height;
                    }
                }

                // Calculate the offsets between the new corner position
                // in pt and each of the four sides. 
                deltaLeft = pt.x - this.x;
                deltaTop = pt.y - this.y;
                deltaRight = pt.x - right;
                deltaBottom = pt.y - bottom;

                if (_minSize) {
                    // Pre-calculate x and y position for a minimum width and height rectangle.
                    minX = this.x + this.width - _minSize.width;
                    minY = this.y + this.height - _minSize.height;
                }

                switch (directionIdx) {
                    // Upper, left corner 
                    case rectDirection.northWest:
                        if (maintainAspect) {
                            // Decrease width the average of x and y delta.
                            // Set height to maintain aspect ratio.
                            // Set x and y relative to the new width and height.
                            newVal.width = this.width - ((deltaLeft + deltaTop) / 2);
                            newVal.height = newVal.width * aspect;
                            newVal.x = right - newVal.width;
                            newVal.y = bottom - newVal.height;
                            if (_boundsRect) {
                                if (newVal.x < _boundsRect.x) {
                                    newVal.x = _boundsRect.x;
                                }
                                if (newVal.y < _boundsRect.y) {
                                    newVal.y = _boundsRect.y;
                                }
                                if (((newVal.x + newVal.width) > (_boundsRect.x + _boundsRect.width)) ||
                                        ((newVal.y + newVal.height) > (_boundsRect.y + _boundsRect.height))) {
                                    break;
                                }
                            }

                            this.x = newVal.x;
                            this.y = newVal.y;
                            this.width = newVal.width;
                            this.height = newVal.height;
                        }
                        else {
                            // Set x and y to the new point. Decrease
                            // width and height by x and y delta.
                            this.x = pt.x;
                            this.y = pt.y;
                            this.width -= deltaLeft;
                            this.height -= deltaTop;
                        }

                        if (_minSize) {
                            // Ensure minimum width and height.
                            if (this.width < _minSize.width) {
                                this.x = minX;
                                this.width = _minSize.width;
                                if (maintainAspect) {
                                    this.height = this.width * aspect;
                                }
                            }
                            if (this.height < _minSize.height) {
                                this.height = _minSize.height;
                                this.y = minY;
                                if (maintainAspect) {
                                    this.width = this.height * aspect;
                                }
                            }
                        }
                        break;

                    // Top edge 
                    case rectDirection.north:
                        // Move top edge to new point, then set height based on y delta.
                        this.y = pt.y;
                        this.height -= deltaTop;

                        if (_minSize && (this.height < _minSize.height)) {
                            this.height = _minSize.height;
                            this.y = minY;
                        }
                        break;

                    // Upper, right corner 
                    case rectDirection.northEast:
                        if (maintainAspect) {
                            // Set width to left delta less the average of right and top deltas.
                            // Set height to maintain aspect ratio.
                            // Set y relative to the new height.
                            newVal.width = deltaLeft - ((deltaRight + deltaTop) / 2);
                            newVal.height = newVal.width * aspect;
                            newVal.y = bottom - newVal.height;
                            if (_boundsRect) {
                                if (newVal.y < _boundsRect.y) {
                                    newVal.y = _boundsRect.y;
                                }
                                if (((this.x + newVal.width) > (_boundsRect.x + _boundsRect.width)) ||
                                        ((newVal.y + newVal.height) > (_boundsRect.y + _boundsRect.height))) {
                                    break;
                                }
                            }

                            this.y = newVal.y;
                            this.width = newVal.width;
                            this.height = newVal.height;
                        }
                        else {
                            // Move top edge to new point, then set width and
                            // height based on x and y deltas.                            
                            this.y = pt.y;
                            this.width = deltaLeft;
                            this.height -= deltaTop;
                        }

                        if (_minSize) {
                            // Ensure minimum width and height.
                            if (this.width < _minSize.width) {
                                this.width = _minSize.width;
                                if (maintainAspect) {
                                    this.height = this.width * aspect;
                                }
                            }
                            if (this.height < _minSize.height) {
                                this.height = _minSize.height;
                                this.y = minY;
                                if (maintainAspect) {
                                    this.width = this.height * aspect;
                                }
                            }
                        }
                        break;

                    // Right edge 
                    case rectDirection.east:
                        // Set width to x delta.
                        this.width = deltaLeft;

                        if (_minSize && (this.width < _minSize.width)) {
                            this.width = _minSize.width;
                        }
                        break;

                    // Lower, right corner 
                    case rectDirection.southEast:
                        if (maintainAspect) {
                            // Change width by average of right and bottom deltas.
                            // Set height to maintain aspect ratio.
                            newVal.width = this.width + (deltaRight + deltaBottom) / 2;
                            if (_boundsRect && (this.x + newVal.width > _boundsRect.width)) {
                                newVal.width = _boundsRect.width - this.x;
                            }
                            newVal.height = newVal.width * aspect;
                            if (_boundsRect) {
                                if (((this.x + newVal.width) > (_boundsRect.x + _boundsRect.width)) ||
                                        ((this.y + newVal.height) > (_boundsRect.y + _boundsRect.height))) {
                                    break;
                                }
                            }
                            this.width = newVal.width;
                            this.height = newVal.height;
                        }
                        else {
                            // Set width and height to x and y deltas.
                            this.width = deltaLeft;
                            this.height = deltaTop;
                        }

                        if (_minSize) {
                            // Ensure minimum width and height.
                            if (this.width < _minSize.width) {
                                this.width = _minSize.width;
                                if (maintainAspect) {
                                    this.height = this.width * aspect;
                                }
                            }
                            if (this.height < _minSize.height) {
                                this.height = _minSize.height;
                                if (maintainAspect) {
                                    this.width = this.height * aspect;
                                }
                            }
                        }
                        break;

                    // Bottom edge 
                    case rectDirection.south:
                        // Set height to y delta.
                        this.height = deltaTop;

                        if (_minSize && (this.height < _minSize.height)) {
                            this.height = _minSize.height;
                        }
                        break;

                    // Lower, left corner 
                    case rectDirection.southWest:
                        if (maintainAspect) {
                            // Decrease width by the average of the left and bottom deltas.
                            // Set height to maintain aspect ratio.
                            // Set x based on the new width.
                            newVal.width = this.width - (deltaLeft - deltaBottom) / 2;
                            newVal.height = newVal.width * aspect;
                            newVal.x = right - newVal.width;
                            if (_boundsRect) {
                                if (newVal.x < _boundsRect.x) {
                                    newVal.x = _boundsRect.x;
                                }
                                if (((newVal.x + newVal.width) > (_boundsRect.x + _boundsRect.width)) ||
                                        ((this.y + newVal.height) > (_boundsRect.y + _boundsRect.height))) {
                                    break;
                                }
                            }
                            this.x = newVal.x;
                            this.width = newVal.width;
                            this.height = newVal.height;
                        }
                        else {
                            // Set x to new point, decrease width by the x delta,
                            // then set height to the y delta.
                            this.x = pt.x;
                            this.width -= deltaLeft;
                            this.height = deltaTop;
                        }

                        if (_minSize) {
                            // Ensure minimum width and height.
                            if (this.width < _minSize.width) {
                                this.x = minX;
                                this.width = _minSize.width;
                                if (maintainAspect) {
                                    this.height = this.width * aspect;
                                }
                            }
                            if (this.height < _minSize.height) {
                                this.height = _minSize.height;
                                if (maintainAspect) {
                                    this.width = this.height * aspect;
                                }
                            }
                        }
                        break;

                    // Left edge 
                    case rectDirection.west:
                        // Set x to the new point, then decrease
                        // width by the x delta.
                        this.x = pt.x;
                        this.width -= deltaLeft;

                        if (_minSize && (this.width < _minSize.width)) {
                            this.x = minX;
                            this.width = _minSize.width;
                        }
                        break;

                    default:
                        throw new Error('Invalid argument: directionIdx');
                }

                return this;
            },

            /**
            * Changes the size of this rectangle object to match the aspect
            * ratio of the specified target rectangle. Note that this
            * rectangle will not be resized beyond its boundary rect
            * coordinates. If the size of this rectangle is constrained by
            * the boundary values the master rectangle may be resized to
            * ensure that both rectangles have the same aspect ratio. 
            * @param {Object} master The rectangle object whose aspect ratio
            *                  will be copied in resizing this rectangle.
            * @param {Number} directionIdx The index of the edge or corner of
            *                  the rectangle being resized as enumerated by
            *                  rectDirection.
            * @return {Object} This rectangle object.
            */
            resizeToMatchAspect: function (master, directionIdx) {
                var newHeight, newWidth;
                var topY, bottomY;
                var leftX, rightX;

                if (!_boundsRect) {
                    throw new Error('BoundsRect must be set before calling resizeToMatchAspect');
                }

                switch (directionIdx) {
                    case rectDirection.north:
                    case rectDirection.south:
                        // Find what the new height of this rectangle should be.
                        // Formula: this.height = (master.height * this.width) / master.width.
                        newHeight = (master.height * this.width) / master.width;
                        if (directionIdx === rectDirection.south) {
                            bottomY = this.y + newHeight;
                            if (bottomY > _boundsRect.height) {
                                topY = this.y - (bottomY - _boundsRect.height);
                                if (topY < _boundsRect.y) {
                                    topY = _boundsRect.y;
                                    // Now reset the size of the master since the other
                                    // one can't grow any more.
                                    newHeight = (this.height * master.width) / this.width;
                                    master.height = newHeight;
                                }
                                this.y = topY;
                                this.height = _boundsRect.height - this.y;
                            }
                            else {
                                this.height = newHeight;
                            }
                        }
                        else {
                            topY = this.y + this.height - newHeight;
                            if (topY < _boundsRect.y) {
                                this.height -= topY;
                                if (this.height > _boundsRect.height) {
                                    this.height = _boundsRect.height;
                                    newHeight = (this.height * master.width) / this.width;
                                    master.height = newHeight;
                                    master.y += master.height - newHeight;
                                }
                                else {
                                    this.y = _boundsRect.y;
                                }
                            }
                            else {
                                this.resize(directionIdx, createPoint(this.x, topY));
                            }
                        }
                        break;
                    // Find what the new width of this rectangle should be. 
                    // Formula: this.width = (master.width * this.height) / master.height. 
                    case rectDirection.east:
                    case rectDirection.west:
                        newWidth = (master.width * this.height) / master.height;
                        if (directionIdx === rectDirection.east) {
                            rightX = this.x + newWidth;
                            if (rightX > _boundsRect.width) {
                                leftX = this.x - (rightX - _boundsRect.width);
                                if (leftX < _boundsRect.x) {
                                    leftX = _boundsRect.x;
                                    // Now reset the size of the master since the other
                                    // one can't grow any more.
                                    newWidth = (this.width * master.height) / this.height;
                                    master.width = newWidth;
                                }
                                this.x = leftX;
                                this.width = _boundsRect.width - this.x;
                            }
                            else {
                                this.width = newWidth;
                            }
                        }
                        else {
                            leftX = this.x + this.width - newWidth;
                            if (leftX < _boundsRect.x) {
                                this.width -= leftX;
                                if (this.width > _boundsRect.width) {
                                    this.width = _boundsRect.width;
                                    newWidth = (this.width * master.height) / this.height;
                                    master.width = newWidth;
                                    master.x += master.width - newWidth;
                                }
                                else {
                                    this.x = _boundsRect.x;
                                    this.width = newWidth;
                                }
                            }
                            else {
                                this.x += this.width - newWidth;
                                this.width = newWidth;
                            }
                        }
                        break;
                }

                return this;
            },

            /**
            * Returns a string representation of this rectangle object.
            * @return {String} A string representation of this rectangle object.
            */
            toString: function () {
                return '[(' + this.x + ', ' + this.y + '), width: ' + this.width +
                        ', height: ' + this.height + ']';
            }
        }; // End of rectangle object definition


        // Validate arguments, if any, and initialize object.
        if (x !== undefined) {
            if ((typeof x !== 'number') || isNaN(x)) {
                throw new Error('Invalid argument: x is not a number');
            }
            _rectangle.x = x;

            if ((typeof y !== 'number') || isNaN(y)) {
                throw new Error('Invalid argument: y is not a number');
            }
            _rectangle.y = y;

            if (width !== undefined) {
                if ((typeof width !== 'number') || isNaN(width)) {
                    throw new Error('Invalid argument: width is not a number');
                }
                _rectangle.width = width;

                if (height !== undefined) {
                    if ((typeof height !== 'number') || isNaN(height)) {
                        throw new Error('Invalid argument: height is not a number');
                    }
                    _rectangle.height = height;
                }
            }
        }

        return _rectangle;
    };

    /**
    * Creates a new circle centered at the specified x and y coordinates with 
    * the given radius.
    * If called without arguments, the new circle is initialized to (0, 0) with
    * a radius of 10.
    * @param {Number} x Optional. The center x coordinate of the new circle. 
    * @param {Number} y Optional. The center y coordinate of the new circle.
    * @param {Number} radius Optional. The radius of the new circle.
    * @return {Object} A new circle object.
    * @exception {Error} If the only some of the arguments are specified,
    *  or if any of them are not numbers.
    */
    var createCircle = function createCircle(x, y, radius) {
        var circle = {
            /**
            * X coordinate
            * @type {Number}
            */
            x: 0,

            /**
            * Y coordinate
            * @type {Number}
            */
            y: 0,

            /**
            * radius
            * @type {Number}
            */
            radius: 10,

            /**
            * Returns a new circle object that is a copy of this circle.
            * @return {Object} A new circle object that is a copy of this circle.
            */
            clone: function () {
                return createCircle(this.x, this.y, this.radius);
            },

            /**
            * Returns the distance from the center of this circle to the specified point.
            * @param {Object} otherPt The point object to compare to the circle center.
            * @return {Number} The distance between otherPt and the circle center.
            */
            distanceFrom: function (otherPt) {
                var diff = this.difference(otherPt);
                return Math.sqrt((diff.width * diff.width) + (diff.height * diff.height));
            },

            /**
            * Moves this circle by the specified offsets.
            * @param {Number} xOffset The amount to add to this circles's
            *                          x-axis coordinates.
            * @param {Number} yOffset The amount to add to this circles's
            *                          y-axis coordinates.
            * @return {Object} This cicle object.
            */
            move: function (xOffset, yOffset) {
                if (typeof xOffset !== 'number' || isNaN(xOffset)) {
                    throw new Error('Invalid argument: xOffset is not a number');
                }
                if (typeof yOffset !== 'number' || isNaN(yOffset)) {
                    throw new Error('Invalid argument: yOffset is not a number');
                }

                // Move the rectangle.
                this.x += xOffset;
                this.y += yOffset;

                return this;
            },


            /**
            * Returns whether the coordinates of the given point are equal to
            * the coordinates of this point.
            * @param {Object} otherPt The point object to compare to this point.
            * @return {Boolean} True if otherPt is equal to this point, false otherwise.
            */
            equals: function (otherCir) {
                return (this === otherCir) ||
                            (((otherCir !== undefined) && (otherCir !== null) &&
                            (this.x === otherCir.x) && (this.y === otherCir.y) &&
                            this.radius === otherCir.radius));
            },

            /**
            * Returns whether the coordinates of the given point are near to
            * the coordinates of this circle.
            * @param {Object} otherPt The point object to compare to this circle.
            * @param {Number} threshold The maximum distance between this point
            *                            and otherPt that will be considered "near."
            * @return {Boolean} True if otherPt is no more than threshold units of
            *                    distance from this circle, false otherwise.
            */
            isNear: function (otherPt, threshold) {
                if (!otherPt) {
                    return false;
                }
                else {
                    return Boolean(Math.abs(this.distanceFrom(otherPt)) < threshold);
                }
            },

            /**
            * Returns whether the given point falls within this circle.
            * @param {Object} pt The point to test for inclusion within this circle.
            * @return {Boolean} True if pt falls within this circle; false, otherwise.
            * @exception {Error} If pt is not a point object.
            */
            isPtInCircle: function (pt) {
                // basically a pt is inside a circle if the distance between circle
                // center and that point < radius.  We can use the Pythagorean theorem
                // as a basis, but we compare against radius squared since it is faster
                // than the sqrt function
                diffx = this.x - pt.x;
                diffy = this.y - pt.y;
                radius2 = this.radius * this.radius;
                return Boolean(((diffx * diffx) + (diffy * diffy)) < radius2);
            },

            /**
            * Move the circle by the given offset, but constrain the center point to 
            * be within the constraining rectangle.
            * @param {Number} xOffset the x offset to move to
            * @param {Number} yOffset the y offset to move to
            * @param {Object} constraintRect the rectangle that the circle center cannot move outside of
            * @param inset {Number} the number of pixels to be inset from
            * @return {Object} This circle object.
            */
            centerConstrainedMove: function (xOffset, yOffset, constraintRect, inset) {
                if (typeof xOffset !== 'number' || isNaN(xOffset)) {
                    throw new Error('Invalid argument: xOffset is not a number');
                }
                if (typeof yOffset !== 'number' || isNaN(yOffset)) {
                    throw new Error('Invalid argument: yOffset is not a number');
                }
                this.x += xOffset;
                this.y += yOffset;

                var rightEdge = constraintRect.x + constraintRect.width - inset;
                var bottomEdge = constraintRect.y + constraintRect.height - inset;
                // coordinates of constraintRect.
                if (this.x < (constraintRect.x + inset)) {
                    // We are too far to the left, so move to the left
                    // edge of the boundary.
                    this.x = constraintRect.x + inset;
                }
                else if (this.x > rightEdge) {
                    // We are too far to the right, so move to the right
                    // edge of the boundary.
                    this.x = rightEdge;
                }

                if (this.y < (constraintRect.y + inset)) {
                    // We are too far up, so move to the top edge of
                    // the boundary.
                    this.y = constraintRect.y + inset;
                }
                else if (this.y > bottomEdge) {
                    // We are too far down, so move to the bottom
                    // edge of the boundary.
                    this.y = bottomEdge;
                }

                return this;
            },

            /**
            * Returns a new size object whose width and height properties
            * are the difference between the x and y values of this circle
            * and the specified point.
            * @param {Object} otherPt The point from which this circle will be subtracted.
            * @return {Object} A size object.
            */
            difference: function (otherPt) {
                if ((!otherPt) || (otherPt.x === undefined) || (otherPt.y === undefined)) {
                    throw new Error('Invalid argument: otherPt');
                }
                return createSize(otherPt.x - this.x, otherPt.y - this.y);
            },

            /**
            * Returns a string representation of this circle object.
            */
            toString: function () {
                return '(' + this.x + ', ' + this.y + ', ' + this.radius + ')';
            }
        };

        // Validate arguments, if any, and initialize object.
        if (x !== undefined) {
            if ((typeof x !== 'number') || isNaN(x)) {
                throw new Error('Invalid argument: x is not a number');
            }
            if ((typeof y !== 'number') || isNaN(y)) {
                throw new Error('Invalid argument: y is not a number');
            }
            if ((typeof radius !== 'number') || isNaN(radius)) {
                throw new Error('Invalid argument: radius is not a number');
            }

            circle.x = x;
            circle.y = y;
            circle.radius = radius;
        }

        return circle;
    };


    objectvideo.geometry.rectDirection = rectDirection;
    objectvideo.geometry.createSize = createSize;
    objectvideo.geometry.createPoint = createPoint;
    objectvideo.geometry.createRectangle = createRectangle;
    objectvideo.geometry.createCircle = createCircle;
})(jQuery);
