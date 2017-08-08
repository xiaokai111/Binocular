/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws,
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852,
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
主要功能是包含了对图片的一个实时刷新功能，完全可以根据实际情况自己适当修改
*/


/**
 * @file snapshot.js
 * The snapshotPlayer object.
 */

/**
 * The snapshot module contains functions for displaying and drawing
 * markup on view snapshot images.
 * @namespace objectvideo.snapshot
 */
if (objectvideo.snapshot === undefined) {
    objectvideo.snapshot = {};
}

(function($) {

    /**
     * "Import" of objectvideo.common.getString.
     * @type {Function}
     */


    /**
     * Frame counter, used to generate a unique URI for each snapshot request.
     * @type {Number}
     * @private
     */

    /**
     * Implements the snapshotPlayer object, which manages the play/pause
     * state of the snapshot image pane.
     *
     * @param {String} channelId ID for the channel from which to
     *                  retrieve snapshots.
     * @param {Object} img The img element that will display
     *                      snapshots.
     * @param {Object} btn The Play/Pause button element.
     * @param {Object} options Optional. An object specifiying message
     *                  overlay elements. If provided, the object may
     *                  contain any of the following fields:
     *                  <ul>
     *                    <li>loading - an element to display while the initial snapshot image is loading</li>
     *                    <li>warning - an element to show/hide when showWarning()/hideWarning() is called.</li>
     *                    <li>warningFrame - the element that will be "decorated," e.g., given a special
     *                        border, to indicated a warning condition. Default value is the img element.</li>
     *                  </ul>
     * @return {Object} A new snapshot player object.
     * @exception {Error} If channelId or img is not specified or if any
     *                     optional parameter is specified, but is of the
     *                     wrong type.
     */
    var snapshotPlayer = function( img, btn, options) {
        /**
         * URI path prefix for "channel root"
         * @private
         */

        /**
         *
         * The snapshot img element.
         * img元素对象
         * @private
         */
        var _snapshotImg;

        /**
         * The Play/Pause button element.
         * 暂停/播放按钮对象
         * @private
         *
         */
        var _playBtn = null;
        /**
         * The Play button alt text.
         * 播放时的文本显示
         * @type {String}
         * @private
         */
        var _playBtnLabel = '';

        /**
         * The Pause button alt text.
         * 暂停时的文本显示
         * @type {String}
         * @private
         */
        var _pauseBtnLabel = '';

        /**
         * The Play button src.
         * 播放图标
         * @private
         */
        var _playBtnSrc = '/static/images/rule/play.png';

        /**
         * The Pause button src.
         * 暂定图标
         * @private
         */
        var _pauseBtnSrc = '/static/images/rule/play.png';

        /**
         * true if the the player is in play mode, false if it is paused.
         * 播放标志
         * @private
         */
        var _isPlaying = false;

        /**
         * The delay between refreshing the snapshot image (in milliseconds)
         * 多少秒刷一次
         * @private
         */
        var _refreshDelay = 200;

        /**
         * The value returned by Window.setInterval, if the snapshot view is
         * in play mode.
         * 控制图片刷新的定时器对象
         * @private
         */
        var _timoutId = undefined;

        /**
         * True if the previous image load attempt failed, false if it succeeded.
         * @private
         */
        var _lastLoadFailed = false;

        /**
         * True if options.loading element should be hidden when a
         * snapshot image is first loaded.
         * @private
         */
        var _hideLoadingOverlay = false;

        /**
         * Warning overlay div as wrapped jQuery element.
         * @private
         */
        var _warningOverlay = null;

        /**
         * The last time a warning display was requested.
         * @private
         */
        var _lastWarningTimestamp = null;

        /**
         * The previous warning type, so we can determine whether we need to change
         * the display
         */
        var _lastWarningType = null;

        /**
         * The current warning type (if any), so we can build the popup text
         * appropriately (via callback)
         *
         * @see buildWarningTooltip
         */
        var _currentWarningType = null;

        /**
         * The element that will receive a warning "decoration,"
         * e.g. a special border.
         */
        var _warningFrame;

        /**
         * A callback function invoked when the snapshot is played.
         * 图片正播放时的回调
         * @type {Function}
         */
        var _onPlayCallback = null;

        /**
         * A callback function invoked when the snapshot is paused.
         * 暂定时的回调
         * @type {Function}
         */
        var _onPauseCallback = null;

        /**
         * Timer action function to reset the snapshot image src attribute.
         * 刷新图片
         * @private
         */
        var onUpdateSnapshot = function() {

        };

        /**
         * Handler for the load event on the snapshot image. This function
         * resets the timer to request another snapshot update after a
         * brief delay.
         * @param {Object} event The event information.
         * @private
         */
        var handleSnapshotLoad = function(event) {
            _lastLoadFailed = false;

            if (_isPlaying) {
                // _timoutId = setTimeout(onUpdateSnapshot, _refreshDelay);
            }

            if (Boolean(options) && (options.loading !== undefined) &&
                _hideLoadingOverlay ) {
                $(options.loading).hide();
                _hideLoadingOverlay = false;
            }
        };

        /**
         * Handler for the error event on the snapshot image. This function
         * attempts to immediately reload the image, which may result in
         * another error.
         *当加载失败时，重新刷新图片
         * @param {Object} event The event information.
         * @private
         */
        var handleSnapshotError = function(event) {
            if (_isPlaying && (! _lastLoadFailed)) {
                onUpdateSnapshot();
            }

            _lastLoadFailed = true;

            // Delegate to load handler to set timer.
            handleSnapshotLoad(event);
        };

        /**
         * Starts requesting periodic snapshots and updates
         * appearance of the Play/Pause button accordingly.
         * @private
         */
        var startPlayback = function() {
            _isPlaying = true;
            if (_playBtn) {
                _playBtn.attr('alt', _pauseBtnLabel);
                _playBtn.attr('src', _pauseBtnSrc);
            }
            onUpdateSnapshot();
            if (_onPlayCallback) {
                _onPlayCallback();
            }
        };

        /**
         * Shuts down the timer that is requesting periodic snapshots
         * and updates appearance of the Play/Pause button accordingly.
         * @private
         */
        var stopPlayback = function() {
            clearTimeout(_timoutId);
            _isPlaying = false;
            _timoutId = undefined;

            if (_playBtn) {
                _playBtn.attr('alt', _playBtnLabel);
                _playBtn.attr('src', _playBtnSrc);
            }

            if (_onPauseCallback) {
                _onPauseCallback();
            }
        };

        /**
         * Immediately updates the image with the most recent
         * @private
         */
        var forceUpdate = function() {
            onUpdateSnapshot();
        };


        /**
         * Handler for click event on Play button.
         * @param {Object} event The event information.
         * @private
         */
        var handleBtnClick = function(event) {
            if (_isPlaying) {
                stopPlayback();
            }
            else {
                startPlayback();
            }
            return true;
        };

        /**
         * Binds event handlers to button elements.
         * @private
         */
        var initButton = function() {
            var keyPrefix;

            if (btn) {
                _playBtn = $(btn);
                _playBtn.click(handleBtnClick);

                keyPrefix = _playBtn.attr('alt');
                if (keyPrefix) {
                    _playBtnLabel  = getString(keyPrefix + '.play');
                    _pauseBtnLabel = getString(keyPrefix + '.pause');
                    _playBtn.attr('alt', _playBtnLabel);
                }

                _playBtn.attr('src', _playBtnSrc);
            }
        };


        /**
         * Returns the HTML for a warning tooltip.
         * @return {String} The warning tooltip body HTML.
         */
        var buildWarningTooltip = function() {
            // TODO: it may not always be "out of view" - this means two things:
            //            1. dynamically determine the actual state
            //            2. once we have the actual state, the text to display should be
            //                based on a lookup table in HTML or XML (for localization),
            //                not hardcoded in JavaScript


            // Set timestamp
            return '<div class="warning_tooltip_header">' + warningText + '</div><div class="warning_tooltip_timestamp">' + _lastWarningTimestamp + '</div>';
        };


        /**
         * Initializes snapshot message overlay elements.
         * @private
         */
        var initOverlays = function() {
            var warningHtml = '<div class="warning_frame"><div class="warning_content"><span class="bad_view_state_icon"></span><p class="warning_message"></p></div></div>';

            if (options) {
                if (options.loading) {
                    _hideLoadingOverlay = Boolean($(options.loading).length);
                }

                if (options.warning && $(options.warning).length !== 0) {
                    _warningOverlay = $(options.warning);
                    _warningOverlay.html(warningHtml).addClass('warning_overlay');

                    // Pop-up a tooltip on hover.
                    _warningOverlay.tooltip({
                        bodyHandler: buildWarningTooltip
                    });
                }

                if (options.warningFrame && $(options.warningFrame).length !== 0) {
                    _warningFrame = $(options.warningFrame);
                }
                else {
                    _warningFrame = $(img);
                }
            }
        };


        /**
         * Hide warnings.
         */
        var clearWarnings = function() {
            if (_warningFrame) {
                _warningFrame.removeClass('bad_view_status_snapshot');
                _warningFrame.removeClass('bad_signal_status_snapshot');
                _warningFrame.removeClass('searching_status_snapshot');
            }
            $('.bad_view_state_icon', _warningOverlay).removeClass('bad_signal_state_img')
                .removeClass('bad_view_state_img').removeClass('searching_state_img');
        };


        // Begin closure body
        // Initialize closure variables

        if (! img) {
            throw new Error('Invalid argument: img');
        }

        initButton();
        initOverlays();

        _snapshotImg = $(img);
        _snapshotImg.load(handleSnapshotLoad);
        _snapshotImg.error(handleSnapshotError);

        // Return the snapshotPlayer object
        return {
            /**
             * Returns true if the snapshot player is in play mode,
             * false if it is paused.
             * @return {Boolean} True if the player is in play mode.
             */
            isPlaying: function() {
                return _isPlaying;
            },

            /**
             * Starts playback on this object's viewer and updates the
             * appearance of the Play/Pause button accordingly.
             * @return {Object} this object
             */
            play: function() {
                startPlayback();
                return this;
            },

            /**
             * Stops playback on this object's viewer and updates the
             * appearance of the Play/Pause button accordingly.
             * @return {Object} this object
             */
            pause: function() {
                stopPlayback();
                return this;
            },

            /**
             * Sets a callback function to be invoked when the snapshot is played.
             * @param {Function} onPlay A function to be called when the snapshot is played.
             * @return {Function} The previously set callback function, if any, or null.
             */
            setPlayCallback: function(onPlay) {
                var oldCallback = _onPlayCallback;

                if ((! onPlay) || (typeof onPlay !== 'function')) {
                    throw new Error('Invalid argument: onPlay');
                }
                _onPlayCallback = onPlay;

                return oldCallback;
            },

            /**
             * Sets a callback function to be invoked when the snapshot is paused.
             * @param {Function} onPlay A function to be called when the snapshot is paused.
             * @return {Function} The previously set callback function, if any, or null.
             */
            setPauseCallback: function(onPause) {
                var oldCallback = _onPauseCallback;

                if ((! onPause) || (typeof onPause !== 'function')) {
                    throw new Error('Invalid argument: onPause');
                }
                _onPauseCallback = onPause;

                return oldCallback;
            },

            /**
             * Sets the delay (in milliseconds) between refreshes
             * @return {Object} this object
             * @exception {Error} If delay is not an number or is < 0.
             */
            setRefreshDelay: function(delay) {
                if ((delay === undefined) || (typeof delay !== 'number') ||
                    isNaN(delay) || (delay < 0)) {
                    throw new Error('Invalid argument: delay');
                }
                _refreshDelay = delay;
                return this;
            },

            /**
             * Immediately updates the image with the most recent
             * snapshot. This function does not affect the pause/play
             * mode.
             * @return {Object} this object
             */
            update: function() {
                forceUpdate();
                return this;
            },


            /**
             * Sets the width and height of the snapshot player.
             * @param {Number} Width in pixels.
             * @param {Number} Height in pixels.
             * @return {Object} this object.
             * @exception {Error} If either pxWidth or pxHeight is not an number.
             */
            setDimensions: function(pxWidth, pxHeight) {
                if ((pxWidth === undefined) || (typeof pxWidth !== 'number') || isNaN(pxWidth)) {
                    throw new Error('Invalid argument: pxWidth');
                }
                if ((pxHeight === undefined) || (typeof pxHeight !== 'number') || isNaN(pxHeight)) {
                    throw new Error('Invalid argument: pxHeight');
                }

                _snapshotImg.width(pxWidth).height(pxHeight);
            },


            /**
             * Displays the warning overlay element passed to this player,
             * if any.
             * @return {Object} this object
             */
            showWarning: function(warningType) {
                var iconSpan, warnFrameElt;

                _currentWarningType = warningType;

                if (_warningOverlay) {
                    if (! _warningOverlay.is(":visible")) {
                        _warningOverlay.fadeIn();
                    }
                }

                if (_snapshotImg) {
                    if (warningType !== _lastWarningType) {
                        // TODO: Deal with flicker effect if searching and out-of-view share
                        //       the same look, when switching from searching to out-of-view
                        clearWarnings();
                    }

                    iconSpan = $('.bad_view_state_icon', _warningOverlay);
                    warnFrameElt = (Boolean(_warningFrame) ? _warningFrame : _snapshotImg);
                    switch (warningType) {
                        case objectvideo.ovready.viewStates.BadSignal:
                            warnFrameElt.addClass('bad_signal_status_snapshot');
                            iconSpan.addClass('bad_signal_state_img');
                            break;
                        case objectvideo.ovready.viewStates.UnknownView:
                            warnFrameElt.addClass('bad_view_status_snapshot');
                            iconSpan.addClass('bad_view_state_img');
                            break;
                        case objectvideo.ovready.viewStates.SearchingForView:
                            warnFrameElt.addClass('searching_status_snapshot');
                            iconSpan.addClass('searching_state_img');
                            break;
                    }
                }

                _lastWarningType = warningType;
                return true;
            },

            /**
             * Hides the warning overlay element passed to this player,
             * if any.
             * @return {Object} this object
             */
            hideWarning: function() {
                _lastWarningTimestamp = null;
                _currentWarningType = null;

                if (_warningOverlay) {
                    _warningOverlay.fadeOut();
                }

                clearWarnings();

                return this;
            }
        };
    };


    // Add snapshotPlayer to the objectvideo.snapshot module object.

    /**
     * Returns a new snapshotPlayer object, which manages the play/pause
     * state of the snapshot image pane.
     *
     * @param {String} channelId ID for the channel from which to
     *                  retrieve snapshots.
     * @param {Object} img The img element that will display
     *                      snapshots.
     * @param {Object} btn The Play/Pause button element.
     * @param {Object} options Optional. An object specifiying message
     *                  overlay elements. If provided, the object may
     *                  contain any of the following fields:
     *                  <ul>
     *                    <li>loading - an element to display while the initial snapshot image is loading</li>
     *                    <li>warning - an element to show/hide when showWarning()/hideWarning() is called.</li>
     *                    <li>warningFrame - the element that will be "decorated," e.g., given a special
     *                        border, to indicated a warning condition. Default value is the img element.</li>
     *                  </ul>
     * @return {Object} A new snapshot player object.
     * @exception {Error} If channelId or img is not specified or if any
     *                     optional parameter is specified, but is of the
     *                     wrong type.
     */
    objectvideo.snapshot.snapshotPlayer = function createSnapshotPlayer(
        img,
        btn,
        options) {
        return snapshotPlayer( img, btn, options);
    };

})(jQuery);



//启动画规则图
// $('#btnruleImage').click(function () {
//     StartThread();
//     startRule();
// })

function startRule () {
    _timoutId= setTimeout(startRule,200);
    $.ajax({
        type: 'GET',
        url: '/ruleImage',
        async: true ,
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
            // alert('dfd')
            imagedata=data.imageData
            temp='data:image/jpg;base64,'+imagedata
            // _snapshotImg.attr('src',temp);
            $('#hs').attr('src',temp)
        },

        error: function (xhr, type, xxx) {

        }
    });
}


// 通知后端开启线程，用于当浏览器关闭或者离开规则图片页面时，停止画规则图
function StartThread() {
    $.ajax({
        type: 'GET',
        url: '/ListenRuleImageStatus',
        async: true ,
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {

        },
        error: function (xhr, type, xxx) {

        }
    });
}


//停止画规则
$('#stopRule').click(function () {
    clearTimeout(st);
    $.ajax({
        type: 'POST',
        url: '/StopRuleImage',
        async: true ,
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {

        },
        error: function (xhr, type, xxx) {

        }
    });
})

startRule();

StartThread();

