var channelId = undefined;
/**
 * "Import" of objectvideo.ovready.eventDefinitionTypes enumeration.
 * @type {Object}
 */
var eventDefinitionTypes = objectvideo.ovready.eventDefinitionTypes;

/**
 * "Import" of objectvideo.ovready.eventDefObjectTypes enumeration.
 * @type {Object}
 */
var eventDefObjectTypes = objectvideo.ovready.eventDefObjectTypes;

/**
 * "Import" of objectvideo.ovready.tripwireDirections enumeration.
 * @type {Object}
 */
var tripwireDirections = objectvideo.ovready.tripwireDirections;

/**
 * "Import" of objectvideo.ovready.filterTypes enumeration.
 * @type {Object}
 */
var filterTypes = objectvideo.ovready.filterTypes;

/**
 * "Import" of objectvideo.geometry.createPoint.
 */
var createPoint = objectvideo.geometry.createPoint;

/**
 * "Import" of objectvideo.schedulesPane object.
 * @type {Object}
 */
var _schedulesPane = null;

/**
 * Enumeration of select key values.
 * @type {Object}
 */
var keyCode = {
    backspace: 8,
    space: 32,
    comma: 44,
    period: 46,
    zero: 48,
    nine: 57
};

/**
 * Enumeration of drawing tool modes.
 * @type {Object}
 */
var toolModeEnum = {
    select: 'tool_select',
    line: 'tool_line',
    polygon: 'tool_polygon',
    //fullFrame: 'tool_fullframe',
    filterPolygon: 'tool_Polygon',
    filter: 'tool_filter'
};

/**
 * Hash table mapping element ids to action names.
 * @type {Object}
 */
var ID_TO_ACTION_HASH = {
    'enter_area_action': 'EnterAreaAction',
    'exit_area_action': 'ExitAreaAction',
    'inside_area_action': 'InsideAreaAction',
    'appear_area_action': 'AppearAreaAction',
    'disappear_area_action': 'DisappearAreaAction',
    'take_away_area_action': 'TakeAwayAreaAction',
    'leave_behind_area_action': 'LeaveBehindAreaAction',
    'loiter_area_action': 'LoiterAreaAction',
    'density_area_action': 'DensityAreaAction',
    'occupancy_data_area_action': 'OccupancyDataAreaAction',
    'occupancy_threshold_area_action': 'OccupancyThresholdAreaAction',
    'dwell_data_area_action': 'DwellDataAreaAction',
    'dwell_threshold_area_action': 'DwellThresholdAreaAction',
    'crosses_tripwire': 'CrossesTripwire',
    'crosses_multiline_tripwire': 'CrossesMultiLineTripwire'
};

/**
 * Hash table mapping action names to element ids.
 * @type {Object}
 */
var ACTION_TO_ID_HASH = {};

/**
 * Hash table mapping element ids to classification names.
 * @type {Object}
 */
var CLASSIFICATION_FROM_ID_HASH = {
    'anything': objectvideo.ovready.classifications.Anything,
    'human': objectvideo.ovready.classifications.Human,
    'vehicle': objectvideo.ovready.classifications.Vehicle
};

/**
 * Hash table mapping classification names to element ids.
 * @type {Object}
 */
var CLASSIFICATION_TO_ID_HASH = {};

/**
 * The minimum number of pixels the mouse must move to be
 * considered the beginning of a drag operation.
 * @type {Number}
 */
var SIGNIFICANT_MOVEMENT_PIXELS = 5;

/**
 * True, if the ruleEdit module has been initialized and is ready to
 * handle ajax callbacks; false, if the module has either not yet been
 * initialized or has been cleaned-up by onUnload#.
 * @type {Boolean}
 */
var _isInitialized = false;

/**
 * True if changes have been made to the page that could be saved
 * to the rule being edited/created. False if the page has not
 * been edited in a significant way.
 * @type {Boolean}
 * @see setDirty#
 */
var _isDirty = false;

/**
 * True if changes have been made to the schedules pane that have not been validated
 * False if the schedule pane has not been edited or was edited and validated.
 * @type {Boolean}
 */
var _isScheduleDirty = false;

/**
 * Template type for new rule.
 * @type {String}
 */
var _template = '';

/**
 * Link to an existing rule to be edited.
 * @type {String}
 */
var _ruleLink = '';

/**
 * The instance of objectvideo.ovready.rule loaded from _ruleLink.
 * @type {Object}
 */
var _rule = null;

/**
 * If true, _rule is a new rule based on _ruleLink and edit actions on this
 * page will not affect the original rule. If false, edit actions modify
 * the original rule.
 */
var _isCopy = false;

/**
 * If defined, the ID of the view to which a new rule would be added.
 * @type {String}
 */
var _viewId = undefined;

/**
 * viewState object from last call to onViewStatusNotification
 * @type {Object}
 */
var _viewState = null;

/**
 * Hash table indexed by rule ID strings of eventDefinitions for rules on
 * this channel other than the rule being created or edited.
 * @type {Object}
 */
var _otherChannelEvents = {};

/**
 * Snapshot pane controller.
 * @type {Object}
 */
var _snapController = null;

/**
 * objectvideo.ovready.channelAnalyticsCapabilities object, representing
 * the available functionality on this channel
 * @type {Object}
 */
var _analyticsCapabilities = null;

/**
 * The maximum number of bytes allowed for short text values like rule name.
 * @type {Number}
 */
var _textLimit = 127;

/**
 * The maximum number of bytes allowed for the alert text value.
 * @type {Number}
 */
var _alertTextLimit = 511;

/**
 * The maximum number of points allowed for a tripwire or AOI.
 * Lazy-initialized in getMaxPoints#
 * @type {Number}
 */
var _nMaxPoints = undefined;

/**
 * Input validator for rule details.
 * @type {Object}
 */
var _detailsValidator = null;

/**
 * Input validator for size change filter.
 * @type {Object}
 */
var _filterValidator = null;

/**
 * Width of element filters_drawing_key. Dynamically determined
 * when the element is shown.
 */
var _filtersKeyWidth = 180;

/**
 * Callback object passed to beforeUnload.
 * @type {Object}
 */
var _reinvoker = null;

/**
 * numer of custom response fields limited by device capabilities
 */
var _customRespRowCount = 0;


/**
 * areaOfIntertestEventDefinition properties temporarily preserved when
 * an AOI is converted to full-frame.
 * @type {Object}
 */
var _savedAoiProperties = {
    points: [],
    planeType: null
};

/**
 * ID of the selected drawing tool, specifying the current drawing mode.
 * @type {String}
 */
var _toolMode = toolModeEnum.select;

/**
 * Current state of the change direction tool palette button.
 * @type {String}
 */
var _curDirection = tripwireDirections.AnyDirection;

/**
 * An object whose numeric properties x and y give the pageX and pageY
 * coordinates of the last call to the onMarkupMouseMove event handler.
 * @type {Object}
 */
var _lastMouseMovePosition = createPoint();

/**
 * Event detection label. Actual value is loaded from HTML element
 * event_type_selection_label, if available.
 * @type {String}
 */
var _eventActionLabel = 'Detect when:';

/**
 * Data collection label. Actual value is loaded from HTML element
 * event_type_selection_label, if available.
 * @type {String}
 */
var _dataActionLabel = 'Collect:';

/**
 * In most cases the rule management page will load data about all
 * rules for this channel prior to coming to this page. This data
 * is then used when the user checks the "Rule Overlay" checkbox.
 * However, if the user jumps directly to the rule edit page without
 * going through the rule management page, this data may not have
 * been loaded, in which case we need to know to load it if/when
 * the user checks the "Rule Overlay" checkbox.
 */
var _otherRuleDataLoaded = false;

/**
 * If we have attempted to load data about all the other rules, but
 * were unable to load some of the data, set this value to true. We
 * will not attempt to re-load the data later, but we will want to
 * indicate this to the user if/when they attempt to display markup
 * for the other rules.
 */
var _otherRuleDataPartiallyLoaded = false;

/**
 * Information about the filter object currently being edited, if any;
 * null, if not in filter edit mode.
 * @type {Object}
 */
var _filterEditInfo = null;

var getString = objectvideo.getString;

var errorDialog = objectvideo.errorDialog;

var assignDialogButtonIds = objectvideo.assignDialogButtonIds;

var initAnalyticsCapabilities = function () {
    $.ajax({
        url: '/static/scripts/rule/data/analyticscapabilities.xml',
        success: function (xml, status) {
            _analyticsCapabilities = objectvideo.ovready.channelAnalyticsCapabilitiesFactory(xml);
        }
    });
}

var fadeInOverlay = function (overlay, speed) {
    var opacity = parseFloat(overlay.css('opacity'));
    if (isNaN(opacity) || (opacity < 0.1) || (opacity > 0.9)) {
        opacity = 0.75;
    }
    overlay.css('opacity', '0.0').show().fadeTo(speed, opacity);
};

var calculateSnapshotSize = function (width, height) {
    var stdWidth = 352;
    var maxWidth = 352;
    var frame = {
        width: 0,
        height: 0
    };

    if ((width === undefined) || (typeof width !== 'number')) {
        throw new TypeError('Invalid argument: width');
    }
    if ((height === undefined) || (typeof height !== 'number')) {
        throw new TypeError('Invalid argument: height');
    }

    if ((width < stdWidth) || (width > maxWidth)) {
        // Set frameWidth to stdWidth.
        frame.width = stdWidth;
        // Adjust height proportionally.
        frame.height = Math.floor(height * (stdWidth / width));
    }
    else {
        frame.width = width;
        frame.height = height;
    }

    return frame;
};

var copyEventDetails = function (src, dest) {
    if ((!src) || (!src.type)) {
        throw new Error('Invalid argument: src');
    }
    if ((!dest) || (!dest.type)) {
        throw new Error('Invalid argument: dest');
    }

    dest.altKey = src.altKey;
    dest.metaKey = src.metaKey;
    dest.pageX = src.pageX;
    dest.pageY = src.pageY;
    dest.screenX = src.screenX;
    dest.screenY = src.screenY;
    dest.shiftKey = src.shiftKey;
    dest.which = src.which;

    return dest;
};

// Initialize "static" lookup tables.
(function initLookup() {
    var name, id;

    for (id in ID_TO_ACTION_HASH) {
        name = ID_TO_ACTION_HASH[id];
        if (typeof name !== 'function') {
            ACTION_TO_ID_HASH[name] = id;
        }
    }

    for (id in CLASSIFICATION_FROM_ID_HASH) {
        name = CLASSIFICATION_FROM_ID_HASH[id];
        if (typeof name !== 'function') {
            CLASSIFICATION_TO_ID_HASH[name] = id;
        }
    }
})();

/**
 * Creates a new objectvideo.ovready.point object set to the specified
 * coordinates with the coordinates normalized to the range 0.0 to 1.0.
 * @param {Number} canvasWidth Width of the canvas in pixels.
 * @param {Number} canvasHeight Height of the canvas in pixels.
 * @param {Object} pt A point as an object having numeric properties
 *                  x and y, in canvas coordinates.
 * @return {Object} A new objectvideo.ovready.point object with
 *                   coordinates of pt translated to the range 0.0 to 1.0.
 */
var makeOVReadyPoint = function (canvasWidth, canvasHeight, pt) {
    if ((canvasWidth === undefined) || (typeof canvasWidth !== 'number')) {
        throw new Error('Invalid argument canvasWidth');
    }
    if ((canvasHeight === undefined) || (typeof canvasHeight !== 'number')) {
        throw new Error('Invalid argument canvasHeight');
    }
    if ((!pt) || (typeof pt.x !== 'number') || (typeof pt.y !== 'number')) {
        throw new Error('Invalid argument pt');
    }

    return objectvideo.ovready.point(pt.x / canvasWidth,
        pt.y / canvasHeight);
};


/**
 * Gets the maximum number of points allowed in a tripwire or area for the
 * event type of the current rule, based on channel AnalyticsCapabilities data.
 * @return {Number} The maximum number of points that can make up a
 *                   tripwire or area.
 */
var getMaxPoints = function () {
    return 32;
};


/**
 * Gets the maximum number of tripwires allowed on a multi-line tripwire
 * event definition based on channel AnalyticsCapabilities data.
 */
var getMaxTripwires = function () {
    var maxLines = 0;
    var supportedEvt;
    maxLines = 1;

    return maxLines;
};


/**
 * Returns one of 'tripwire', 'aoi', 'fullframe', or 'tamper'
 * based on the given rule.
 * @param {Object} rule An instance of objectvideo.ovready.rule.
 * @return {String} A string categorizing the rule as tripwire, aoi,
 *                   full frame or tamper.
 * @exception {Error} If the rule type cannot be determined from rule.
 */
var getRuleType = function (rule) {
    if (!Boolean(rule) || ('rule' !== rule.typeOf) || (!Boolean(rule.eventDefinition))) {
        throw new Error('Invalid argument: rule');
    }

    if (rule.eventDefinition.typeOf.search(/tripwire/i) >= 0) {
        return 'tripwire';
    }
    else if (rule.eventDefinition.typeOf.search(/areaofinterest/i) >= 0) {
        return 'aoi';
    }
    else if (rule.eventDefinition.typeOf.search(/fullframe/i) >= 0) {
        return 'fullframe';
    }
    else if (rule.eventDefinition.typeOf.search(/tamper/i) >= 0) {
        return 'tamper';
    }
    else {
        throw new Error('Cannot determine basic rule type for "' + rule.typeOf + '"');
    }
};

/**
 * Returns the event definition xsi type for the rule being edited/created.
 * @return {String} Event definition type
 */
var getEventDefinitionType = function () {
    if (_rule && _rule.eventDefinition) {
        return _rule.eventDefinition.eventType;
    }
    else {
        return undefined;
    }
};


/**
 * Returns the width of the borders around the snapshot frame.
 * @return {Number} Width of the borders around the snapshot frame.
 */
var getSnapshotBorderWidth = function () {
    return $('#snapshot_frame').outerWidth() - $('#snapshot_frame').width();
};


/**
 * Adjusts the explicit width setting of elements within the snapshot pane.
 * @param {Number} delta The number of pixels by which to change the width
 *                  of the snapshot-related elements.
 */
var adjustSnapshotWidth = function (delta) {
    $('#edit_snapshot_pane').width($('#edit_snapshot_pane').width() + delta);
    $('#snapshot_actions_pane').width($('#snapshot_actions_pane').width() + delta);
    $('#markup_error_message').width($('#markup_error_message').width() + delta);
    $('#markup_pane').width($('#markup_pane').width() + delta);

    // Set the width of filters_pane to match markup_pane just because it looks nice.
    $('#filters_pane').width($('#markup_pane').outerWidth());
};


/**
 * Sets the dimensions of snapshot and rule list elements based on the
 * analytics frame size information in the given channel object. This
 * function is passed as a callback argument to channelManager.getChannelInfo.
 * @param {Object} channel An ovready.channel object.
 * @see objectvideo.channelManager.getChannelInfo#
 */
var setDimensions = function () {
    var markupPaneWidth = 410;
    var snapWidth = 352;
    var snapHeight = 288;
    var widthDelta = 0;
    var snapshotFrame = $('#snapshot_frame');
    var dims, frameWidth;

    if (!_isInitialized) {
        return;
    }

    // Set the snapshot pane sizes.
    if (_snapController) {
        _snapController.setDimensions(snapWidth, snapHeight, widthDelta);
    }

    // Explicitly set the width of div#markup_pane, so
    // that it will not expand too far to the right.
    frameWidth = snapshotFrame.outerWidth();
    markupPaneWidth += widthDelta + (frameWidth - snapshotFrame.width());
    $('#markup_pane').width(markupPaneWidth);

    // Set the width of the warning text box.
    $('#markup_error_message').width(frameWidth);

    // Set the width of filters_pane to match markup_pane just because it looks nice.
    $('#filters_pane').width($('#markup_pane').outerWidth());

    // Make sure the overall pane is not so wide that filters
    // end up side-by-side with markup.
    $('#markup_and_filters_pane').css('max-width', Math.floor(frameWidth * 1.5));
};


/**
 * Sets the rule to be retrieved for editing when this function's
 * onReady event is invoked.
 *
 * Note that the rule must be set before onReady is invoked
 * and if this function is called, a call to setTemplateType will
 * have no effect.
 *
 * @param {String} ruleLink A link to the rule to be edited.
 * @param {String} viewId Optional. If specified, the ViewInfo/ID
 *                  to which the new rule will be added.
 * @param {Boolean} isCopy Optional. If true, changes to the rule
 *                   specified by ruleLink will be made to a copy,
 *                   not to the original rule.
 * @return {Object} The ruleEdit module.
 * @exception {Error} If ruleLink does not specifiy a non-empty string.
 * @see onReady
 * @see setTemplateType
 * @see addOtherEvent
 */
var setRule = function (ruleLink, viewId, isCopy) {
    if (!Boolean(ruleLink) || (typeof ruleLink !== 'string')) {
        throw new Error('Invalid parameter: ruleLink');
    }
    _ruleLink = ruleLink;
    _viewId = viewId;
    _isCopy = (isCopy === true);
    return objectvideo.ruleEdit;
};


/**
 * Sets the template type to be used to create a new rule when
 * this function's onReady event is invoked.
 *
 * Note that the template must be set before onReady is invoked
 * and that the template type will ignored if setRule has also
 * been called.
 *
 * @param {String} templateType The template type to be used
 *                  to set up a new rule.
 * @param {String} viewId Optional. If specified, the ViewInfo/ID
 *                  to which the new rule will be added.
 * @return {Object} The ruleEdit module.
 * @exception {Error} If templateType does not specifiy a non-null string.
 * @see onReady
 * @see setRule
 * @see addOtherEvent
 */
var setTemplateType = function (templateType, viewId) {
    if ((templateType === undefined) || (templateType === null) ||
        (typeof templateType !== 'string')) {
        throw new Error('Invalid parameter: templateType');
    }
    _template = templateType;
    _ruleLink = '';
    _viewId = viewId;
    _isCopy = false;
    return objectvideo.ruleEdit;
};


/**
 * Sets the eventDefinition from a rule on the same channel as the rule
 * being created or edited. Markup from his event definition may be
 * displayed in the snapshot marker overlay.
 * @param {String} ruleId The rule ID associated with the eventDefinition.
 * @param {Object} eventDef An instance of objectvideo.ovready.eventDefinition.
 * @return {Object} The ruleEdit module.
 * @see setRule
 * @see setTemplateType
 */
var addOtherEvent = function (ruleId, eventDef) {
    if ((!ruleId) || (typeof ruleId !== 'string')) {
        throw new Error('Invalid argument: ruleId');
    }
    if ((!eventDef) || (typeof eventDef !== 'object')) {
        throw new Error('Invalid argument: eventDef');
    }

    _otherChannelEvents[ruleId] = eventDef;
    _otherRuleDataLoaded = true;
    return objectvideo.ruleEdit;
};


/**
 * Sets or clears a flag that indicates whether the page data state is
 * "dirty", meaning that changes to the data have not been saved to the
 * server/device.
 * @param {Boolean} isDirty True if the data should be flagged as dirty;
 *                   false, if the data contains no unsaved changes.
 * @return {Boolean} The value of the isDirty parameter.
 */
var setDirty = function (isDirty) {
    _isDirty = isDirty;
    if (_isDirty) {
        $('#save_btn').removeAttr('disabled');
    }
    else {
        $('#save_btn').prop('disabled', true);
    }
    return _isDirty;
};


/**
 * Sets or clears a flag that indicates whether the schedule pane is
 * "dirty", meaning that changes to the schedule not been validated
 *
 * @param {Boolean} scheduleIsDirty True if the schedule data should be flagged as dirty;
 *                   false, if the schedule data contains no unvalidated changes.
 * @return {Boolean} The value of the scheduleIsDirty parameter.
 */
var setScheduleDirty = function (scheduleIsDirty) {
    _isScheduleDirty = scheduleIsDirty;
    return _isScheduleDirty;
};


/**
 * Copies the filter(s) from the rule indicated by ruleLink.
 * @param {Object} rule The rule from which the filter(s) should be copied.
 */
var copyFiltersFromRule = function (rule) {
    if (rule && rule.eventDefinition.filters &&
        (rule.eventDefinition.filters.length > 0)) {

        // Remove the existing filters, if any.
        _rule.eventDefinition.filters = [];
        $('#filter_list tr').hide();
        // re-enable adding for all filters (now that we've deleted
        // all existing filters)
        //$('#create_filter_btn option').removeAttr('disabled');

        $.each(rule.eventDefinition.filters, function () {
            // Copy the filter, then add it to the rule.
            var filter = this.clone();
            addFilterToRule(filter);
            showFilterRow(filter);
        });

        $('#filter_list tr').removeClass('accent_bkgnd');
        $('#filter_list_pane').show();
        $('#filter_list tr:visible:even').addClass('accent_bkgnd');
    }
};


/**
 * Copies the schedule from the rule indicated by ruleLink.
 * @param {Object} rule The rule from which the schedule should be copied.
 */
var copyScheduleFromRule = function (rule) {
    if (rule) {
        _rule.schedule = rule.schedule;
        // Note that the call to setSchedule may cause
        // schedulesPane to make a synchronous AJAX call.
        _schedulesPane.setSchedule(_rule.schedule);
        setDirty(true);
    }
};


/**
 * Show the copy filter dialog to the user.
 */
var showCopyFilterDialog = function () {
    var title = getString('pick_rsrc_dlg.title', getString('filters.title'));
    var prompt = getString('select_filters_message');
    objectvideo.ruleEdit.ruleSelectDialog.show(
        title, prompt, false,
        function (rule) {
            return Boolean(rule && rule.eventDefinition.filters) &&
                (rule.eventDefinition.filters.length > 0) &&
                (rule.id !== _rule.id);
        },
        copyFiltersFromRule,
        $('#rule_edit_pane'));
};


/**
 * Show the copy schedule dialog to the user.
 */
var showCopyScheduleDialog = function () {
    var title = getString('pick_rsrc_dlg.title', getString('schedule.title'));
    var prompt = getString('select_schedule_message');
    objectvideo.ruleEdit.ruleSelectDialog.show(
        title, prompt, true,
        function (rule) {
            return Boolean(rule && rule.schedule) && (rule.id !== _rule.id);
        },
        copyScheduleFromRule,
        $('#rule_edit_pane'));
};


/**
 * Assigns the value in input field filter_max_size_ratio to the current
 * rule's sizeChangeFilter, if one exists. Note that this function will not
 * add a sizeChangeFilter to _rule, it will only modify an existing filter.
 * @param {Object} element The filter_max_size_ratio input element.
 */
var assignSizeChangeFilter = function (element) {
    var filter, val = $(element).val();

    if (val && (val.length > 0)) {
        filter = getFilterForRowId('size_change_filter');
        if (filter) {
            // Convert edit field value to a number.
            filter.maxSizeChangeRatio = parseFloat(val);
        }
    }
};


/**
 * Displays an error message and sets class invalid on the classification
 * list if no classification checkbox has been checked.
 */
var validateClassificationInput = function () {
    // Unless the classification checkboxes have been hidden...
    if ($('#classification_list_container').is(':visible')) {
        if ($('input.classification_checkbox:checked').length > 0) {
            // Valid because one or more classification checkboxes are checked.
            $('#classification_list_container').removeClass('invalid');
            $('#classification_error_message').hide();
        }
        else {
            // Invalid because no classification checkboxes are checked.
            // Show an error message indicating that a classifcation selection is required.
            $('#classification_list_container').addClass('invalid');
            $('#classification_error_message').show();

            // Set this function as an event handler to verify valid state if
            // a checkbox control is changed.
            $('input.classification_checkbox').one('click', validateClassificationInput).one('keyup', validateClassificationInput);

            // Move focus to the first enabled checkbox. We use a timer
            // callback for this because an immediate call to focus() doesn't
            // work if the click event the Save button is still being handled.
            setTimeout(function () {
                try {
                    $('input.classification_checkbox:enabled:first')[0].focus();
                }
                catch (ex) {
                    // Ignore
                }
            }, 1);
        }
    }
};


/**
 * Displays an error message and sets class invalid on the event type list
 * if no event type checkbox has been checked.
 */
var validateEventTypeInput = function () {
    var actionGroupsValid = true;
    var actionGroupElement = null;
    var actionGroupsChecked = $('input.action_group_checkbox:checked');

    // if an action group checkbox is checked, are any sub-options selected?
    if (actionGroupsChecked.length > 0) {
        $('input.action_group_checkbox:checked').each(function (i) {
            actionGroupElement = $(this).closest('.action_group_container');
            if ($('input:radio.action_group_radio_button:checked', actionGroupElement).length > 0) {
                // this action group is ok - at least one sub-action is selected
            }
            else {
                // this action group is invalid - no sub-actions are selected
                actionGroupsValid = false;
                // don't bother continuing to loop, we've failed validation
                return false;
            }
        });
        if (actionGroupsValid) {
            $('#event_type_list').removeClass('invalid');
            $('#event_type_list_error_message').hide();
            return;
        }
        else {
            $('#event_type_list').addClass('invalid');
            $('#event_type_list_error_message').show();
            return;
        }
    }

    // if no action groups were checked, validate that something else was
    if ($('input.event_type_checkbox:enabled:visible').length === 0) {
        // Valid because no event type checkboxes are visible and enabled.
        $('#event_type_list').removeClass('invalid');
        $('#event_type_list_error_message').hide();
        return;
    }

    if ($('input.event_type_checkbox:checked').length > 0) {
        // Valid because one or more event type checkboxes are checked.
        $('#event_type_list').removeClass('invalid');
        $('#event_type_list_error_message').hide();
    }
    else {
        // Invalid because no event type checkboxes are checked.
        // Show an error message indicating that an event type selection is required.
        $('#event_type_list').addClass('invalid');
        $('#event_type_list_error_message').show();

        // Set this function as an event handler to verify valid state if
        // a checkbox control is changed.
        $('input.event_type_checkbox').one('click', validateEventTypeInput).one('keyup', validateEventTypeInput);

        // Move focus to the first enabled checkbox. We use a timer
        // callback for this because an immediate call to focus() doesn't
        // work if the click event the Save button is still being handled.
        setTimeout(function () {
            try {
                $('input.event_type_checkbox:enabled:first')[0].focus();
            }
            catch (ex) {
                // Ignore
            }
        }, 1);
    }
};


/**
 * Indicates whether classification checkbox controls are set to a valid
 * state.
 * @return True if at least one classification checkbox is checked; false,
 *          if none of the controls are checked.
 */
var isClassificationInputValid = function () {
    // Delegate actual validation to validateClassificationInput. This
    // will either set or clear class 'invalid' on
    // classification_list_container. Test for presence of that class to
    // determine classifcation control validity.
    validateClassificationInput();
    return (!$('#classification_list_container').hasClass('invalid'));
};


/**
 * Indicates whether event type checkbox controls are set to a valid
 * state.
 * @return True if at least one event type checkbox is checked; false,
 *          if none of the controls are checked.
 */
var isEventTypeInputValid = function () {
    // Delegate actual validation to validateEventTypeInput. This
    // will either set or clear class 'invalid' on event_type_list.
    // Test for presence of that class to determine classifcation control
    // validity.
    validateEventTypeInput();
    return (!$('#event_type_list').hasClass('invalid'));
};


/**
 * Asynchronously sends data from the closure variable _rule to the device.
 * @param {Function} onSuccess Optional. If specified, a callback function
 *                    to be run after the rule is successfully saved to the
 *                    device.
 */
var saveRule = function (onSuccess) {
    var overlay, id, markupMsg, alertText, url, ajaxType;
    var nPoints = 0;
    var isAjaxBegun = false;
    var completeActionElementList;
    var passValidation = true;
    if (onSuccess && (typeof onSuccess !== 'function')) {
        throw new Error('Invalid argument: onSuccess, if specified, must be a function');
    }
    overlay = $('#rule_edit_block');
    overlay.addBlockOverlay();
    try {
        // Get rule text fields.
        _rule.name = encodeURI($('#rule_name').val());
        alertText = encodeURI($('#alert_text').val());
        // If response definition doesn't exist, but there is alert text create an instance of
        // the response defintion and add the alert text, otherwise make the response definition null.
        if (!_rule.responseDefinition) {
            if (alertText) {
                _rule.responseDefinition = objectvideo.ovready.simpleMessageResponse();
                _rule.responseDefinition.message = alertText;
            }
            else {
                _rule.responseDefinition = null;
            }
        }
        // If response defintion does exist add the new alert text, otherwise set the
        // alert text to an empty string.
        else {
            if (alertText) {
                _rule.responseDefinition.message = alertText;
            }
            else {
                _rule.responseDefinition.message = '';
            }
        }

        // Get classification(s).
        _rule.eventDefinition.classificationList = [];
        for (id in CLASSIFICATION_FROM_ID_HASH) {
            if (CLASSIFICATION_FROM_ID_HASH.hasOwnProperty(id)) {
                if ($('#' + id).find(':checkbox:checked').length > 0) {
                    _rule.eventDefinition.classificationList.push(CLASSIFICATION_FROM_ID_HASH[id]);
                }
            }
        }

        // Get action(s), if this rule type supports them.
        // the full list of actions could include event_type_checkbox
        // checkboxes as well as action_group_radio_button radio buttons
        // Note: For some reason IE7 doesn't like
        // $('.event_type :checked'), so we must include the
        // input tag in the selector.
        completeActionElementList = $('input.event_type_checkbox:visible:checked, input:radio.action_group_radio_button:visible:checked');

        if (_rule.eventDefinition.hasOwnProperty('actions')) {
            _rule.eventDefinition.actions = [];
            completeActionElementList.each(function () {
                var actionContainer = $(this).closest('.event_type');
                var action = objectvideo.ovready.createAreaAction(this.value);
                _rule.eventDefinition.actions.push(action);
                if (action.duration !== undefined) {
                    action.duration = getAreaActionDuration(actionContainer);
                }
            });
        }

        // or, if we're dealing with a counting or density type that supports only a single action...
        if (_rule.eventDefinition.hasOwnProperty('action')) {
            // Theoretically there should be only one checked...
            completeActionElementList.each(function () {
                var actionContainer = $(this).closest('.event_type');
                var action = objectvideo.ovready.createAreaAction(this.value);
                _rule.eventDefinition.action = action;
                // If this is an occupancy threshold rule, and the time
                // dropdown is set to "at any time," ignore the duration.
                if (this.value === objectvideo.ovready.aoiCountingActions.OccupancyThresholdAreaAction && $('#occupancy_threshold_time').val() === 'anytime') {
                    action.duration = null;
                }
                else {
                    if (action.duration !== undefined) {
                        action.duration = getAreaActionDuration(actionContainer);
                    }
                }

                // Get action-specific fields.
                if (action.comparator !== undefined) {
                    action.comparator = getAreaActionComparator(actionContainer);
                }

                if (action.level !== undefined) {
                    action.level = getAreaActionComparator(actionContainer);
                }

                if (action.count !== undefined) {
                    action.count = $('input.count', actionContainer).val();
                }
            });
        }

        // Get event-specific fields.
        if (_rule.eventDefinition.typeOf === eventDefObjectTypes.multiLineTripwireEventDefinition) {
            _rule.eventDefinition.duration = getMultiLineTripwireDuration();
            _rule.eventDefinition.lineCrossingOrder = getMultiLineCrossingOrder();
        }

        // Validate filters, if any.
        if ($('#filter_max_size_ratio_form').is(':visible') &&
            Boolean(_filterValidator) && (!_filterValidator.form())) {
            return false;
        }

        // Get the size change filter ratio, and store in _rule, if applicable
        assignSizeChangeFilter($('#filter_max_size_ratio'));

        if (_rule.eventDefinition.points) {
            nPoints = _rule.eventDefinition.points.length;
        }
        else if (_rule.eventDefinition.tripwires) {
            nPoints = Math.min(_rule.eventDefinition.tripwires[0].points.length,
                _rule.eventDefinition.tripwires[1].points.length);
        }

        if ((nPoints < 2) && (getRuleType(_rule) !== 'fullframe')) {
            // Show an error message indicating that markup is required.
            markupMsg = $('#markup_error_message');
            if (!markupMsg.is(':visible')) {
                markupMsg.text(getString('validationText.markupMissing'))
                    .show('highlight', {}, 2000);
                adjustExpandedBorderHeight(markupMsg, true);
            }
            return;
        }


        //提交坐标数据
        var direction = null;
        if (_rule.eventDefinition.eventType === 'TripwireEventDefinition') {
            direction = _rule.eventDefinition.tripwireDirection;
        }
        if (_rule.eventDefinition.eventType === 'AreaOfInterestEventDefinition') {
            direction = _rule.eventDefinition.planeType;
        }
        var ruleId = $('#ruleid').text();
        var points;
        if (_rule.eventDefinition.typeOf === eventDefObjectTypes.fullFrameEventDefinition) {
            points = '(0, 0),(0,1),(1,1),(1,0)';
        } else {
            points = _rule.eventDefinition.points.toString();
        }
        var MinFilterNearX = null;
        var MinFilterNearY = null;
        var MinFilterNearWidth = null;
        var MinFilterNearHeight = null;
        var MinFilterFarX = null;
        var MinFilterFarY = null;
        var MinFilterFarWidth = null;
        var MinFilterFarHeight = null;
        var MaxFilterNearX = null;
        var MaxFilterNearY = null;
        var MaxFilterNearWidth = null;
        var MaxFilterNearHeight = null;
        var MaxFilterFarX = null;
        var MaxFilterFarY = null;
        var MaxFilterFarWidth = null;
        var MaxFilterFarHeight = null;
        var filters = _rule.eventDefinition.filters
        if (filters) {
            for (var i = 0; i < filters.length; i++) {
                if (filters[i].filterType === "MinimumSizeFilter") {
                    var MinimumSizeFilter = filters[i];
                    var minNearRect = MinimumSizeFilter.nearRect;
                    if (minNearRect) {
                        MinFilterNearX = minNearRect.x;
                        MinFilterNearY = minNearRect.y;
                        MinFilterNearWidth = minNearRect.width;
                        MinFilterNearHeight = minNearRect.height;
                    }
                    var minFarRect = MinimumSizeFilter.farRect;
                    if (minFarRect) {
                        MinFilterFarX = minFarRect.x;
                        MinFilterFarY = minFarRect.y;
                        MinFilterFarWidth = minFarRect.width;
                        MinFilterFarHeight = minFarRect.height;
                    }
                }
                if (filters[i].filterType === "MaximumSizeFilter") {
                    var MaximumSizeFilter = filters[i];
                    var maxNearRect = MaximumSizeFilter.nearRect;
                    if (maxNearRect) {
                        MaxFilterNearX = maxNearRect.x;
                        MaxFilterNearY = maxNearRect.y;
                        MaxFilterNearWidth = maxNearRect.width;
                        MaxFilterNearHeight = maxNearRect.height;
                    }
                    var maxFarRect = MaximumSizeFilter.farRect;
                    if (maxFarRect) {
                        MaxFilterFarX = maxFarRect.x;
                        MaxFilterFarY = maxFarRect.y;
                        MaxFilterFarWidth = maxFarRect.width;
                        MaxFilterFarHeight = maxFarRect.height;
                    }
                }
            }
        }

        // $.ajax({
        //     url: '/api/ruleModify',
        //     type: 'GET',
        //     async: false,
        //     data: { 'RuleId': ruleId, 'Direction': direction, 'Points': points, 'MinFilterNearX': MinFilterNearX, 'MinFilterNearY': MinFilterNearY, 'MinFilterNearWidth': MinFilterNearWidth, 'MinFilterNearHeight': MinFilterNearHeight, 'MinFilterFarX': MinFilterFarX, 'MinFilterFarY': MinFilterFarY, 'MinFilterFarWidth': MinFilterFarWidth, 'MinFilterFarHeight': MinFilterFarHeight, 'MaxFilterNearX': MaxFilterNearX, 'MaxFilterNearY': MaxFilterNearY, 'MaxFilterNearWidth': MaxFilterNearWidth, 'MaxFilterNearHeight': MaxFilterNearHeight, 'MaxFilterFarX': MaxFilterFarX, 'MaxFilterFarY': MaxFilterFarY, 'MaxFilterFarWidth': MaxFilterFarWidth, 'MaxFilterFarHeight': MaxFilterFarHeight, 'ShadowDetect': shadowDetect,  'MultiEnterDirect': multiEnterDirect, 'Plan': Plan, 'ruleControllers': ruleControllers, 'RuleLevel': ruleLevel },
        //     dataType: 'json',
        //     success: function (data) {
        //         onSuccess(data, isAjaxBegun);
        //     },
        //     error: function (XMLHttpRequest, textStatus, errorThrown) {
        //         alert(errorThrown);
        //     }
        // });

        // 预制方案
        var Rule_Plan_value=$('#Rule_Plan').val();
        // 报警等级
        var level_value=$('#level').val();
        var tablename="RuleParameter"+ruleId.substring(0,4);
        var data={
            "ruleid":ruleId,
            "Rule":{
                "Plan":Rule_Plan_value,
                "RuleLevel":level_value
            }
        };


        data[tablename]={
            'Direction': direction,
            'Points': points,
            'MinFilterNearX': MinFilterNearX,
            'MinFilterNearY': MinFilterNearY,
            'MinFilterNearWidth': MinFilterNearWidth,
            'MinFilterNearHeight': MinFilterNearHeight,
            'MinFilterFarX': MinFilterFarX,
            'MinFilterFarY': MinFilterFarY,
            'MinFilterFarWidth': MinFilterFarWidth,
            'MinFilterFarHeight': MinFilterFarHeight,
            'MaxFilterNearX': MaxFilterNearX,
            'MaxFilterNearY': MaxFilterNearY,
            'MaxFilterNearWidth': MaxFilterNearWidth,
            'MaxFilterNearHeight': MaxFilterNearHeight,
            'MaxFilterFarX': MaxFilterFarX,
            'MaxFilterFarY': MaxFilterFarY,
            'MaxFilterFarWidth': MaxFilterFarWidth,
            'MaxFilterFarHeight': MaxFilterFarHeight
        };
        data=JSON.stringify(data);
        UpdateRuleEditData1(data);

        //isAjaxBegun = true;
    }
    catch (ex) {
        $.log('Error saving rule: ' + ex.name + ':' + ex.message);
        $.log(ex);
        errorDialog(getString('error.createRule'), ex);
    } finally {
        if (!isAjaxBegun) {
            overlay.removeBlockOverlay();
            if (_snapController) {
                _snapController.staticCanvas().redraw();
            }
        }
    }
};

/**
 * Changes the direction of the specified tripwire in the rule's
 * event defintion.
 * @param {Number} index The index of the tripwire, if the rule's
 *                  event defintion is a multi-line tripwire.
 */
var changeRuleTripwireDirection = function (index) {
    var id = (_rule.id || '_'); // Use '_' as event key for new rule.
    var tripwireObj = null;

    if (_rule.eventDefinition.tripwireDirection) {
        tripwireObj = _rule.eventDefinition;
    }
    else if (_rule.eventDefinition.tripwires) {
        tripwireObj = _rule.eventDefinition.tripwires[index];
    }

    if (tripwireObj) {
        tripwireObj.tripwireDirection = _curDirection;

        setDirty(true);

        _snapController.staticCanvas().addEvent(id, _rule.eventDefinition, true).redraw();
    }
};


/**
 * Utility function to initialize either a tripwireEventDefinition or
 * tripwire object. The points, which are specified in canvas coordinates,
 * will be translated to normalized coordinates in the range 0.0 to 1.0
 * when the are copied to the tripwire object's points member.
 * @param {Object} tripwire An instance of either
 *                  objectvideo.ovread.tripwireEventDefinition or
 *                  objectvideo.ovready.tripwire to which the points
 *                  will be added.
 * @param {Array} points An array of two or more points, in canvas coordinates.
 * @param {Number} canvasWidth Width of the canvas in pixels.
 * @param {Number} canvasHeight Height of the canvas in pixels.
 * @param {String} direction The tripwire direction, one of the members of
 *                 objectvideo.ovready.tripwireDirections.
 * @exception {Error} If any argument is invalid.
 */
var initializeTripwire = function (tripwire, points, canvasWidth, canvasHeight, direction) {
    if ((!tripwire) || (!tripwire.points)) {
        throw new Error('Invalid argument: tripwire');
    }
    if ((!points) || (typeof points.length !== 'number')) {
        throw new Error('Invalid argument: points is not an array');
    }
    if (points.length < 2) {
        throw new Error('Invalid argument: points must contain at least two point objects');
    }
    if ((!canvasWidth) || (typeof canvasWidth !== 'number')) {
        throw new Error('Invalid argument: canvasWidth');
    }
    if ((!canvasHeight) || (typeof canvasHeight !== 'number')) {
        throw new Error('Invalid argument: canvasHeight');
    }
    if (!direction) {
        throw new Error('Invalid argument: direction');
    }

    $.each(points, function (i, pt) {
        if ((typeof pt !== 'object') || (pt.x === undefined) || (pt.y === undefined)) {
            throw new Error('Invalid argument: points[' + i + '] is not a point object.');
        }
        tripwire.points[i] = makeOVReadyPoint(canvasWidth, canvasHeight, pt);
    });

    tripwire.tripwireDirection = direction;
};


/**
 * Adds a new tripwire to the specified markupCanvas and, optionally,
 * to the specified eventDefinition object.
 * @param {String} direction The new tripwire direction, as enumerated
 *                  by objectvideo.ovready.tripwireDirections.
 * @param {Array} points An array of two or more point objects.
 * @param {Object} canvas The markupCanvas object on which the tripwire
 *                  will be displayed.
 * @param {Object} eventDef Optional. If specified, the event definition
 *                  object to which the tripwire will be added.
 *                  If not specified, a new tripwire event definition
 *                  will be created.
 * @param {String} ruleId Optional. If specified, the rule ID associated
 *                  with parameter eventDef.
 * @return {Object} The event definition object to which the tripwire
 *                   has been added. This may be the object passed in as
 *                   eventDef or may be a new object.
 * @exception {Error} If points is not an array of two or more point objects.
 */
var addTripwireToCanvas = function (direction, points, canvas, eventDef, ruleId) {
    var newEventDef;
    var id = (ruleId || '_'); // Use '_' as event key for new rule.
    var canvasWidth = canvas.getCanvasElement().width();
    var canvasHeight = canvas.getCanvasElement().height();
    var nTripwires, selectIndex = 0;

    if (!eventDef) {
        eventDef = objectvideo.ovready.tripwireEventDefinition();
    }

    if (eventDef.typeOf === eventDefObjectTypes.tripwireEventDefinition) {
        if (eventDef.points.length === 0) {
            // Add tripwire.
            initializeTripwire(eventDef, points, canvasWidth, canvasHeight, direction);
        }
        else {
            // Adding a second tripwire.
            // Change eventDef to multiLineTripwireEventDefinition.
            newEventDef = objectvideo.ovready.multiLineTripwireEventDefinition();
            newEventDef.classificationList = eventDef.classificationList;
            newEventDef.filters = eventDef.filters;
            newEventDef.tripwires[0] = objectvideo.ovready.tripwire();
            newEventDef.tripwires[0].points = eventDef.points;
            newEventDef.tripwires[0].tripwireDirection = eventDef.tripwireDirection;
            eventDef = newEventDef;

            // Add second tripwire.
            eventDef.tripwires[1] = objectvideo.ovready.tripwire();
            initializeTripwire(eventDef.tripwires[1], points,
                canvasWidth, canvasHeight, direction);

            // Prepare to set selection to the new (i.e., second) tripwire.
            selectIndex = 1;
        }
    }
    else if (eventDef.typeOf === eventDefObjectTypes.multiLineTripwireEventDefinition) {
        // Add additional tripwire.
        nTripwires = eventDef.tripwires.length;
        if (nTripwires >= getMaxTripwires()) {
            throw new Error('ERROR: Cannot add a tripwire to an event definition that already has ' +
                nTripwires + ' tripwires.');
        }

        eventDef.tripwires[nTripwires] = objectvideo.ovready.tripwire();

        initializeTripwire(eventDef.tripwires[nTripwires], points,
            canvasWidth, canvasHeight, direction);

        // Prepare to set selection to the new tripwire.
        selectIndex = nTripwires;
    }
    else {
        throw new Error('Unexpected state: Cannot add a tripwire to a rule event definition of type "' +
            eventDef.typeOf + '"');
    }

    // Add event definition to snapshot canvas.
    canvas.addEvent(id, eventDef, true);
    canvas.setSelection(true, selectIndex);
    canvas.redraw();

    // Return the new/modified event definition.
    return eventDef;
};


/**
 * Adds a tripwire to the rule being created/edited by this page.
 * @param {Object} points An array of two or more point objects.
 * @return {Object} The ruleEdit module.
 * @exception {Error} If points is not an array of two or more point objects.
 */
var addTripwire = function (points) {
    var oldEvtType;
    var eventTypeName;
    var markupMsg;

    if ((!points) || (typeof points.length !== 'number') || (points.length < 2)) {
        throw new Error('Invalid argument: points must contain at least two point objects.');
    }

    oldEvtType = _rule.eventDefinition.typeOf;

    // Add the tripwire to the _snapController.staticCanvas canvas. Attach the returned
    // tripwire event definition to the rule being created/edited.
    _rule.eventDefinition = addTripwireToCanvas(_curDirection, points,
        _snapController.staticCanvas(),
        _rule.eventDefinition,
        _rule.id);

    // Clear the interactive drawing canvas.
    _snapController.drawingCanvas().removeEvents().redraw();

    // Reset the select tool to select and enable/disable
    // other tool palette buttons as appropriate.
    setDrawingToolMode(toolModeEnum.select);

    // Update event controls if the event type changed.
    if (_rule.eventDefinition.typeOf !== oldEvtType) {
        displayClassificationOptions(eventDefinitionTypes.MultiLineTripwireEventDefinition, true);
        displayTripwireActions(true);
    }

    markupMsg = $('#markup_error_message');
    if (markupMsg.is(':visible')) {
        markupMsg.slideUp('fast');
        adjustExpandedBorderHeight(markupMsg, false);
    }
    markupMsg = $('#markup_hint_message');
    if (markupMsg.is(':visible')) {
        markupMsg.slideUp('fast');
        adjustExpandedBorderHeight(markupMsg, false);
    }
    setDirty(true);

    return objectvideo.ruleEdit;
};


/**
 * Adds a new polygon to the specified markupCanvas and, optionally,
 * to the specified eventDefinition object.
 * @param {Array} points An array of three or more point objects.
 * @param {Object} canvas The markupCanvas object on which the tripwire
 *                  will be displayed.
 * @param {Object} eventDef Optional. If specified, the event definition
 *                  object to which the polygon will be added.
 *                  If not specified, a new AOI event definition
 *                  will be created.
 * @param {String} ruleId Optional. If specified, the rule ID associated
 *                  with parameter eventDef.
 * @return {Object} The event definition object to which the AOI polygon
 *                   has been added. This may be the object passed in as
 *                   eventDef or may be a new object.
 * @exception {Error} If points is not an array of two or more point objects.
 */
var addPolygonToCanvas = function (points, canvas, eventDef, ruleId) {
    var id = (ruleId || '_'); // Use '_' as event key for new rule.
    var canvasWidth = canvas.getCanvasElement().width();
    var canvasHeight = canvas.getCanvasElement().height();

    if (!eventDef) {
        eventDef = objectvideo.ovready.areaOfInterestEventDefinition();
    }
    else if (eventDef.typeOf === eventDefObjectTypes.areaOfInterestEventDefinition ||
        eventDef.typeOf === eventDefObjectTypes.countingAreaOfInterestEventDefinition ||
        eventDef.typeOf === eventDefObjectTypes.simpleAreaOfInterestEventDefinition) {
        eventDef.points = [];
    }
    else {
        throw new Error('Unexpected state: Cannot add a polygon to a rule event definition of type "' +
            eventDef.typeOf + '"');
    }

    // Copy canvas points to eventDef, converting to normalized OV Ready coordinates.
    $.each(points, function (i, pt) {
        if ((typeof pt !== 'object') || (pt.x === undefined) || (pt.y === undefined)) {
            throw new Error('Invalid argument: points[' + i + '] is not a point object.');
        }
        eventDef.points[i] = makeOVReadyPoint(canvasWidth, canvasHeight, pt);
    });

    // Add event definition to snapshot canvas.
    canvas.addEvent(id, eventDef, true);
    canvas.setSelection(true, 0);
    canvas.redraw();

    // Return the new/modified event definition.
    return eventDef;
};


/**
 * Adds an AOI polygon to the rule being created/edited by this page.
 * @param {Object} points An array of three or more point objects.
 * @return {Object} The ruleEdit module.
 * @exception {Error} If points is not an array of three or more point objects.
 */
var addPolygon = function (points) {
    var markupMsg;

    if ((!points) || (typeof points.length !== 'number') || (points.length < 3)) {
        throw new Error('Invalid argument: points must contain at least three point objects.');
    }

    // Add the polygon to the _snapController.staticCanvas canvas. Attach the returned
    // aoi event definition to the rule being created/edited.
    _rule.eventDefinition = addPolygonToCanvas(points, _snapController.staticCanvas(),
        _rule.eventDefinition,
        _rule.id);

    // Clear the interactive drawing canvas.
    _snapController.drawingCanvas().removeEvents().redraw();

    // Reset the select tool to select and enable/disable
    // other tool palette buttons as appropriate.
    setDrawingToolMode(toolModeEnum.select);

    markupMsg = $('#markup_error_message');
    if (markupMsg.is(':visible')) {
        markupMsg.slideUp('fast');
        adjustExpandedBorderHeight(markupMsg, false);
    }
    markupMsg = $('#markup_hint_message');
    if (markupMsg.is(':visible')) {
        markupMsg.slideUp('fast');
        adjustExpandedBorderHeight(markupMsg, false);
    }
    setDirty(true);

    return objectvideo.ruleEdit;
};


/**
 * Changes one of the points of the markup shape associated with _rule.
 * @param {Object} newPt Value of the new point.
 * @param {Number} ptIndex Zero-based index of the point to edit.
 * @param {Number} shapeIndex Optional. 0 or 1, indicating which part of a
 *                  multi-part shape is being edited.
 * @return {Object} The modified eventDefinition, after the markup shape's
 *                   point has been changed.
 */
var editRuleShape = function (newPt, ptIndex, shapeIndex) {
    var canvasElt, pointsRef;

    if ((!newPt) || (typeof newPt !== 'object')) {
        throw new Error('Invalid argument: newPt');
    }
    if ((ptIndex === undefined) || (typeof ptIndex !== 'number' || isNaN(ptIndex))) {
        throw new Error('Invalid argument: ptIndex');
    }
    if (shapeIndex !== undefined) {
        if ((typeof shapeIndex !== 'number' || isNaN(shapeIndex))) {
            throw new Error('Invalid argument: shapeIndex');
        }
        if ((shapeIndex < 0) || (shapeIndex > 1)) {
            throw RangeError('Index out of range. shapeIndex value ' + shapeIndex + ' is not valid.');
        }
    }

    // Locate point to change.
    if (_rule.eventDefinition.points) {
        // Either AOI or single-line tripwire.
        pointsRef = _rule.eventDefinition.points;
    }
    else if (_rule.eventDefinition.tripwires) {
        // Multi-line tripwire.
        pointsRef = _rule.eventDefinition.tripwires[shapeIndex].points;
    }

    if ((ptIndex < 0) || (ptIndex >= pointsRef.length)) {
        throw new RangeError('Index out of range. ptIndex value of ' + ptIndex + ' is not valid.');
    }

    // Overwrite with new point in normalized OV coordinates.
    canvasElt = _snapController.staticCanvas().getCanvasElement();
    pointsRef[ptIndex] = makeOVReadyPoint(canvasElt.width(), canvasElt.height(), newPt);
};


/**
 * Moves the markup shape associated with _rule from
 * one markupCanvas object to another.
 * @param {Object} fromCanvas The markupCanvas object from which the markup
 *                  shape object will be moved.
 * @param {Object} toCanvas The markupCanvas object to which the markup
 *                  shape object will be moved.
 * @param {Number} selectIndex Optional. 0 or 1, indicating which part of a
 *                  multi-part shape is selected.
 */
var transferRuleShape = function (fromCanvas, toCanvas, selectIndex) {
    var ruleId = _rule.id || '_';
    try {
        fromCanvas.removeEvent(ruleId);
        toCanvas.addEvent(ruleId, _rule.eventDefinition, true);
        toCanvas.setSelection(true, selectIndex);

        fromCanvas.redraw();
        toCanvas.redraw();
    }
    catch (ex) {
        $.log('Error transferring rule shape: ' + ex.name + ' - ' + ex.message);
    }
};


/**
 * Removes a tripwire or area shape from the _snapController.staticCanvas canvas and from
 * the specified eventDefinition.
 * @param {String} id The rule ID associated with the event markup.
 * @param {Object} eventDef The event definition from which the markup
 *                  shape will be removed.
 * @param {Object} index The selection index of the shape to be removed.
 * @return {Object} The modified eventDefinition, after the markup has been
 *                   removed. This may be the object passed in as eventDef
 *                   or may be a new object.
 */
var removeMarkup = function (id, eventDef, index) {
    var newEventDef, staticCanvas;

    staticCanvas = _snapController.staticCanvas();

    if (eventDef.tripwires) {
        // Special case handling for multiLineTripwire:
        // Remove the selected tripwire.
        eventDef.tripwires.splice(index, 1);

        // If there is now only one tripwire, convert the entire event from
        // multiLineTripwireEventDefinition to a tripwireEventDefintion.
        if (eventDef.tripwires.length === 1) {
            newEventDef = objectvideo.ovready.tripwireEventDefinition();
            newEventDef.classificationList = eventDef.classificationList;
            newEventDef.filters = eventDef.filters;
            newEventDef.points = eventDef.tripwires[0].points;
            newEventDef.tripwireDirection = eventDef.tripwires[0].tripwireDirection;
            eventDef = newEventDef;

            displayClassificationOptions(eventDefinitionTypes.TripwireEventDefinition, true);
            displayTripwireActions(false);
        }

        // Replace the old event in the markup pane.
        staticCanvas.addEvent(id, eventDef, true);

        // Select the remaining tripwire.
        staticCanvas.setSelection(true, (index > 1) ? (index - 1) : 0);
    }
    else {
        // General case:
        // Delete the array of points.
        if (eventDef.points) {
            eventDef.points = [];
        }

        // Remove shape from markup pane.
        staticCanvas.removeEvent(id);
    }

    staticCanvas.redraw();

    setDirty(true);

    return eventDef;
};


/**
 * Sets the drawing tool and tool palette to the specified mode.
 * @param {String} mode A value from toolModeEnum.
 * @param {Object} toolBtn Optional. If specified, the tool
 *                  button element to be selected.
 * @return {Boolean} True if the drawing tool mode has changed, false
 *                    if the mode was already set to the specified value.
 */
var setDrawingToolMode = function (mode, toolBtn) {
    var elt = $(toolBtn || ('#' + mode));
    if (!elt.hasClass('selected')) {
        $('.toolbtn').removeClass('selected');
        elt.addClass('selected');

        _toolMode = mode;
        updateToolPalette();

        $('#snapshot_frame').toggleClass('draw_mode', (_toolMode !== toolModeEnum.select));

        if (_snapController) {
            _snapController.staticCanvas().setSelection(_toolMode === toolModeEnum.select).redraw();
        }

        return true;
    }

    return false;
};


/**
 * Increases of decreases the height of the expanded_markup_frame div by
 * the height of the specified element, if the element is a child of
 * expanded_markup_frame.
 * @param {Object} element An element.
 * @param {Object} isShowing True if element is being made visible,
 *                  false if it is about to hidden.
 */
var adjustExpandedBorderHeight = function (element, isShowing) {
    var elementHeight;
    var expandedFrame = $(element).parents('#expanded_markup_frame');
    if (expandedFrame.length) {
        elementHeight = $(element).outerHeight(true);
        if (!isShowing) {
            elementHeight *= -1;
        }
        expandedFrame.height(expandedFrame.height() + elementHeight).hide().show();
    }
};


/**
 * Handles a mouse click by the line drawing tool.
 * @param {Object} clickPt The point at which the mouse was clicked,
 *                  in canvas coordinates.
 */
var handleLineToolClick = function (clickPt) {
    var markupHint, expandedFrame;
    var drawInfo = _snapController.drawInfo();
    if (drawInfo.isLineSegmentMode) {
        // Record the current line segment if it is of non-zero length.
        if (!drawInfo.endPoint().isNear(clickPt, SIGNIFICANT_MOVEMENT_PIXELS)) {
            drawInfo.points.push(clickPt);
            addTripwireToCanvas(_curDirection, drawInfo.points, _snapController.drawingCanvas());
        }
    }

    // Continue drawing as long as we are allowed to add points.
    if (drawInfo.points.length < getMaxPoints()) {
        // Begin the next line segment.
        drawInfo.isLineSegmentMode = true;
    }
    else {
        // We have reached the maximum number of points allowed
        // on a line. Do not begin the next line segment.
        // Complete the tripwire.
        drawInfo.isLineSegmentMode = false;
        _snapController.drawingCanvas().drawLineFeedback(clickPt, null);
        addTripwire(drawInfo.points);
    }

    // Display a hint telling the user how to finish the tripwire.
    markupHint = $('#markup_hint_message');
    if (!markupHint.is(':visible')) {
        markupHint.text(getString('tripwire.closeHint')).show();
        adjustExpandedBorderHeight(markupHint, true);
    }
};


/**
 * Handles a mouse click by the polygon drawing tool.
 * @param {Object} clickPt The point at which the mouse was clicked,
 *                  in canvas coordinates.
 */
var handlePolygonToolClick = function (clickPt) {
    var isCompleted = false;
    var drawInfo = _snapController.drawInfo();
    var markupHint;

    if (drawInfo.isLineSegmentMode) {
        // Record the current line segment if it if of non-zero length.
        if (!drawInfo.endPoint().isNear(clickPt, SIGNIFICANT_MOVEMENT_PIXELS)) {
            if (drawInfo.startPoint().isNear(clickPt, SIGNIFICANT_MOVEMENT_PIXELS)) {
                // User has clicked on (or very near to) the initial point.
                // Close the polygon.
                isCompleted = true;
            }
            else {
                drawInfo.points.push(clickPt);
                _snapController.drawingCanvas().drawPolylineFeedback(drawInfo.points);
            }
        }
    }

    // Continue drawing as long as we are allowed to add points or until
    // the user clicks on (or very near to) the initial point.
    if (isCompleted || (drawInfo.points.length >= getMaxPoints())) {
        // The user has closed the polygon by clicking on the
        // start point OR we have reached the maximum number of
        // points allowed on an AOI. Do not begin the next line
        // segment. Complete the AOI polygon.
        drawInfo.isLineSegmentMode = false;
        _snapController.drawingCanvas().drawPolylineFeedback(drawInfo.points);
        addPolygon(drawInfo.points);
    }
    else {
        // Begin the next line segment.
        drawInfo.isLineSegmentMode = true;
    }

    // Display a hint telling the user how to finish the aoi.
    markupHint = $('#markup_hint_message');
    if (!markupHint.is(':visible')) {
        markupHint.text(getString('aoi.closeHint')).show();
        adjustExpandedBorderHeight(markupHint, true);
    }
};


/**
 * Performs any necessary set up at the beginning of a mouse drag operation.
 */
var beginDragOperation = function () {
    var drawInfo = _snapController.drawInfo();

    if (_toolMode === toolModeEnum.line || _toolMode === toolModeEnum.filter ||
        _toolMode === toolModeEnum.polygon) {
        drawInfo.isDragging = true;
    }
    else if ((_toolMode === toolModeEnum.select) && (drawInfo.shapeIndex >= 0)) {
        transferRuleShape(_snapController.staticCanvas(),
            _snapController.drawingCanvas(), drawInfo.shapeIndex);
        drawInfo.isDragging = true;
    }
};


/**
 * Provides visual feedback while the user drags a filter rectangle.
 */
var dragFilter = function () {
    var drawInfo = _snapController.drawInfo();
    var drawingCanvas = _snapController.drawingCanvas();
    var diff;

    if (drawInfo.shapeIndex !== -1) {
        if (drawInfo.controlIndex < 0) {
            // Drag the entire filter rectangle.
            diff = drawInfo.endPoint().difference(drawInfo.lastPt);
            drawingCanvas.moveFilter(_filterEditInfo.typeOf,
                drawInfo.shapeIndex,
                diff.width, diff.height);
        }
        else {
            // Resize the indicated rectangle from the given control handle.
            drawingCanvas.resizeFilter(_filterEditInfo.typeOf,
                drawInfo.shapeIndex, drawInfo.controlIndex,
                drawInfo.lastPt);
        }

        // Set endPoint() to the point we just handled, lastPt.
        drawInfo.setEndPoint(drawInfo.lastPt);

        // Redraw the filter.
        drawingCanvas.redraw();
    }
};


/**
 * Provides visual feedback while the user drags a
 * tripwire or polygon line segment.
 */
var dragRuleShape = function () {
    var drawInfo = _snapController.drawInfo();

    if (_toolMode === toolModeEnum.line || _toolMode === toolModeEnum.polygon) {
        // Drag out a new line segment.
        drawInfo.isLineSegmentMode = true;

        // Provide visual feedback for line drawing operation.
        drawRubberBand();
    }
    else if ((_toolMode === toolModeEnum.select) && (drawInfo.shapeIndex >= 0)) {
        // Provide visual feedback for dragging a control point.
        _snapController.drawingCanvas().drawDragFeedback((_rule.id || '_'),
            drawInfo.lastPt,
            drawInfo.controlIndex,
            drawInfo.shapeIndex);
    }
};


/**
 * Draw a "rubber band" effect from the last mouse click point
 * to the current mouse location.
 */
var drawRubberBand = function () {
    var ptsCopy;
    var drawInfo = _snapController.drawInfo();
    var drawingCanvas = _snapController.drawingCanvas();

    if (_toolMode === toolModeEnum.line) {
        drawingCanvas.drawLineFeedback(drawInfo.endPoint(), drawInfo.lastPt, _curDirection);
    }
    else {
        ptsCopy = [];
        $.each(drawInfo.points, function () {
            ptsCopy.push(this);
        });
        ptsCopy.push(drawInfo.lastPt);
        drawingCanvas.drawPolylineFeedback(ptsCopy);
    }
};


/**
 * Erases and redraws any filter or rule shape being drawn or dragged.
 */
var drawMouseMoveFeedback = function () {
    try {
        if (_snapController.drawInfo().isMouseLeftDown) {
            if (_toolMode === toolModeEnum.filter) {
                dragFilter();
            }
            else {
                dragRuleShape();
            }
        }
        else if (_snapController.drawInfo().isLineSegmentMode) {
            // Mouse button not down, but we are in drawing mode (presumably
            // after line or polygon drawing was started with a single-click).
            // Provide visual feedback for line drawing operation.
            drawRubberBand();
        }
    }
    catch (ex) {
        $.log('Error in drawMouseMoveFeedback: ' + ex.name + ' - ' + ex.message);
        $.log(ex);
    }
};


/**
 * Provides visual feedback for a mouse drag operation, then
 * updates the shape that was being dragged/drawn.
 * @param {Object} pt The point in canvas coordintes at which
 *                  the mouse button was released, ending an
 *                  ongoing drag operation.
 */
var concludeDragOperation = function (pt) {
    var targetRect, slaveRect, canvasFilterRect, markupMsg;
    var drawInfo = _snapController.drawInfo();
    var drawingCanvas = _snapController.drawingCanvas();

    // Mouse up while dragging out a polygon or line segment means
    // that we have completed this segment and will begin a new one.
    if (_toolMode === toolModeEnum.line) {
        handleLineToolClick(pt);
        drawInfo.isDragging = false;
        return;
    }

    if (_toolMode === toolModeEnum.polygon) {
        handlePolygonToolClick(pt);
        drawInfo.isDragging = false;
        return;
    }

    if (_toolMode === toolModeEnum.filter) {
        if (drawInfo.shapeIndex !== -1) {
            if (drawInfo.shapeIndex === 0) {
                targetRect = _filterEditInfo.nearRect;
            }
            else {
                targetRect = _filterEditInfo.farRect;
            }

            // Get normalized, OV Ready coordinates from the drawing canvas.
            canvasFilterRect = drawingCanvas.getFilterRect(_filterEditInfo.typeOf,
                drawInfo.shapeIndex);
            if (drawInfo.controlIndex < 0) {
                // Move the target filter rectangle.
                targetRect.x = canvasFilterRect.x;
                targetRect.y = canvasFilterRect.y;
            }
            else {
                // Resize the target filter rectangle.
                targetRect.x = canvasFilterRect.x;
                targetRect.y = canvasFilterRect.y;
                targetRect.width = canvasFilterRect.width;
                targetRect.height = canvasFilterRect.height;

                // Resize the filter's other rectangle
                // to match the aspect ratio of the target.
                if (targetRect === _filterEditInfo.nearRect) {
                    slaveRect = _filterEditInfo.farRect;
                }
                else {
                    slaveRect = _filterEditInfo.nearRect;
                }
                canvasFilterRect = drawingCanvas.getFilterRect(_filterEditInfo.typeOf,
                    (drawInfo.shapeIndex === 0) ? 1 : 0);
                slaveRect.x = canvasFilterRect.x;
                slaveRect.y = canvasFilterRect.y;
                slaveRect.width = canvasFilterRect.width;
                slaveRect.height = canvasFilterRect.height;
            }

            // Redraw the filter.
            drawingCanvas.removeFilters().addFilter(_filterEditInfo);

            // Hide the markup error message, if applicable.
            markupMsg = $('#markup_error_message');
            if (markupMsg.is(':visible')) {
                markupMsg.slideUp('fast');
                adjustExpandedBorderHeight(markupMsg, false);
            }
        }
    }
    else if (_toolMode === toolModeEnum.select) {
        // Mouse up while in select mode means we have
        // completed a drag operation. Update _rule's
        // eventDefintion with the new point location,
        // then move dragged shape back into the _snapController.staticCanvas layer.
        editRuleShape(pt, drawInfo.controlIndex, drawInfo.shapeIndex);
        transferRuleShape(drawingCanvas, _snapController.staticCanvas(), drawInfo.shapeIndex);

        setDirty(true);
    }

    drawInfo.isDragging = false;
    drawInfo.shapeIndex = -1;
    drawInfo.controlIndex = -1;
    drawInfo.points = [];
};


/**
 * Handles a mouse click on a tool palette button.
 * @param {Object} event The mouse click event.
 */
var onToolPaletteClick = function (event) {
    if ($(this).hasClass('disabled')) {
        return true;
    }

    try {
        return (!setDrawingToolMode(this.id, this));
    }
    catch (ex) {
        $.log('Error changing drawing tool mode: ' + ex.name + ':' + ex.message);
        $.log(ex);
    }
};


/**
 * Handles a mouse click on the full view tool palette button.
 * @param {Object} event The mouse click event.
 */
var onFullViewClick = function (event) {
    if ($(this).hasClass('disabled')) {
        return true;
    }

    onFullFrameChange((!$(this).hasClass('active')), false);
    setDirty(true);

    return false;
};


/**
 * Handles a mouse click on the delete tool palette button.
 * @param {Object} event The mouse click event.
 */
var onDeleteMarkupClick = function (event) {
    var id = (_rule.id || '_'); // Use '_' as event key for new rule.
    var selectIndex = _snapController.staticCanvas().getSelection();

    if ($(this).hasClass('disabled') ||
        (_toolMode !== toolModeEnum.select) ||
        (selectIndex === undefined)) {
        return true;
    }

    try {
        _rule.eventDefinition = removeMarkup(id, _rule.eventDefinition, selectIndex);
        setDirty(true);

        _snapController.drawingCanvas().removeEvents().redraw();

        updateToolPalette();
    }
    catch (ex) {
        $.log('Error removing tripwire or area: ' + ex.name + ':' + ex.message);
        $.log(ex);
    }

    return false;
};


/**
 * Handles a mouse click on the change direction tool palette button.
 * The change direction button is a three-state control. It rotates
 * to the next state on each click.
 * @param {Object} event The mouse click event.
 */
var onTripwireChangeDirectionClick = function (event) {
    var selectIndex;

    if ($(this).hasClass('disabled')) {
        return true;
    }

    try {
        // "Rotate" _curDirection to next value in enumeration.
        switch (_curDirection) {
            case tripwireDirections.LeftToRight:
                _curDirection = tripwireDirections.RightToLeft;
                break;

            case tripwireDirections.RightToLeft:
                _curDirection = tripwireDirections.AnyDirection;
                break;

            case tripwireDirections.AnyDirection:
                _curDirection = tripwireDirections.LeftToRight;
                break;

            default:
                $.log('Unexpected state: _curDirection has unexpected value "' + _curDirection + '"');
                break;
        }

        // Update look of button by setting/clearing appropriate class.
        $(this).toggleClass('left_to_right', (_curDirection === tripwireDirections.LeftToRight))
            .toggleClass('right_to_left', (_curDirection === tripwireDirections.RightToLeft));

        // Change direction of selected tripwire, if any.
        selectIndex = _snapController.staticCanvas().getSelection();
        if (selectIndex !== undefined) {
            changeRuleTripwireDirection(selectIndex);
        }
    }
    catch (ex) {
        $.log('Error changing tripwire direction: ' + ex.name + ':' + ex.message);
        $.log(ex);
    }

    return false;
};


/**
 * Triggers a click event, followed by a dblclick event on the
 * specified target and based on the specified event.
 * This function is used to work around a bug in IE 7 in which
 * double-clicking in an excanvas-generated element ends in the sequence
 * mousedown, mouseup, mouseup, where the second back-to-back mouseup event
 * is triggered instead of a click, followed by a dblclick.
 * @param {Object} target The element that is to be the target of the
 *                  click and dblclick events.
 * @param {Object} event The mouseup event that was fired by the browser
 *                  in place of the click and dblclick events.
 */
var simulateClickDblClick = function (target, event) {
    var simEvent = copyEventDetails(event, $.Event('click'));
    $(target).trigger(simEvent);

    simEvent = copyEventDetails(event, $.Event('dblclick'));
    $(target).trigger(simEvent);
};


/**
 * Handles a mousedown event in the snapshot markup frame.
 * @param {Object} event The mousedown event.
 */
var onMarkupMouseDown = function (event) {
    var pt;
    var hitInfo = {
        index: 0,
        isInControl: false
    };
    var isHandled = false;
    var drawInfo = _snapController.drawInfo();

    try {
        if (event.which === 1) {
            // Left button down
            drawInfo.isMouseLeftDown = true;
            pt = _snapController.createCanvasPoint(event.pageX, event.pageY);

            if (_toolMode === toolModeEnum.filter) {
                if (_snapController.drawingCanvas().isPointInFilter(pt, hitInfo)) {
                    // Begin dragging a filter.
                    drawInfo.setStart(pt, hitInfo);
                    isHandled = true;
                }
            }
            else if (_toolMode === toolModeEnum.select) {
                if (_snapController.staticCanvas().isPointInShape(pt, hitInfo) && hitInfo.isInControl) {
                    // Begin dragging a shape.
                    drawInfo.setStart(pt, hitInfo);
                    isHandled = true;
                }
            }
            else {
                if (drawInfo.isLineSegmentMode) {
                    // Add a point to the existing shape, then continue,
                    // dragging out the next segment.
                    if (_toolMode === toolModeEnum.line) {
                        handleLineToolClick(pt);
                    }
                    else {
                        handlePolygonToolClick(pt);
                    }
                }
                else {
                    // Begin dragging out a new line.
                    drawInfo.setStart(pt, null);
                }
                isHandled = true;
            }

            if (isHandled && this.setCapture) {
                // Take advantage of IE's setCapture and releaseCapture methods.
                this.setCapture();
            }
        }
        else if (event.which === 3) {
            // Right button down
            drawInfo.isMouseRightDown = true;
            $(this)[0].oncontextmenu = function () {
                return false;
            };
            isHandled = true;
        }
    }
    catch (ex) {
        $.log('Error handling snapshot mousedown event.');
        $.log(ex);
    }

    return (!isHandled);
};


/**
 * Handles a mouseup event in the snapshot markup frame.
 * @param {Object} event The mouseup event.
 */
var onMarkupMouseUp = function (event) {
    var isHandled = false;
    var isRedundantMouseUp = false;
    var drawInfo = _snapController.drawInfo();

    try {
        if (this.releaseCapture) {
            this.releaseCapture();
        }

        drawInfo.lastMouseUpButton = event.which;
        drawInfo.lastPt = _snapController.createCanvasPoint(event.pageX, event.pageY);

        if (event.which === 1) {
            isRedundantMouseUp = (!drawInfo.isMouseLeftDown);

            // Left button up
            drawInfo.isMouseLeftDown = false;

            if (drawInfo.isDragging) {
                concludeDragOperation(drawInfo.lastPt);
                isHandled = true;
            }

            if (isRedundantMouseUp && $.support.msie &&
                parseInt($.support.version, 10) === 7) {
                // In IE 7, two mouseup events in a row, without an
                // intervening mousedown event, in an excanvas-generated
                // element, means the user has actually double-clicked.
                simulateClickDblClick(this, event);
                isHandled = true;
            }
        }
        else if (event.which === 3) {
            // Right button up
            if (drawInfo.isMouseRightDown) {
                // Fire a right-button click event,
                // which will be handled in onMarkupMouseClick.
                //
                // Note: We do this to work around the fact that browsers
                // do not fire a click event for the right mouse button.
                $(this).trigger(copyEventDetails(event, $.Event('click')));
            }
            drawInfo.isMouseRightDown = false;

            // Suppress the default behavior of showing a context menu.
            $(this)[0].oncontextmenu = function () {
                return false;
            };

            isHandled = true;
        }
    }
    catch (ex) {
        $.log('Error handling snapshot mouseup event: ' + ex.name + ' - ' + ex.message);
        $.log(ex);
    }

    return (!isHandled);
};


/**
 * Handles a mouseup event occurring outside the snapshot markup frame.
 * Not that we do not bind this function in IE and instead use IE's
 * setCapture and releaseCapture methods.
 * @param {Object} event The mouseup event.
 */
var onWindowMouseUp = function (event) {
    var drawInfo;
    if (_snapController && _snapController.drawInfo) {
        drawInfo = _snapController.drawInfo();

        drawInfo.lastMouseUpButton = event.which;

        if (event.which === 1) {
            // Left button up
            drawInfo.isMouseLeftDown = false;

            if (drawInfo.isDragging) {
                concludeDragOperation(drawInfo.lastPt);
            }
        }
        else if (event.which === 3) {
            // Right button up
            drawInfo.isMouseRightDown = false;
        }
    }
};


/**
 * Handles a mouse click in the snapshot markup frame.
 * @param {Object} event The mouse click event.
 */
var onMarkupClick = function (event) {
    var clickPt, markupMsg;
    var hitInfo = {
        index: 0,
        isInControl: false
    };
    var isHandled = false;
    var drawInfo = _snapController.drawInfo();
    var staticCanvas = _snapController.staticCanvas();

    if (drawInfo.isDragging) {
        drawInfo.isDragging = false;
        return false;
    }

    try {
        clickPt = _snapController.createCanvasPoint(event.pageX, event.pageY);

        if (drawInfo.lastMouseUpButton === 1) {
            //
            // Left click
            //
            switch (_toolMode) {
                case toolModeEnum.select:
                    // If we have single-clicked on a markup shape, select
                    // the shape, then update the palette for the selection.
                    if (staticCanvas.isPointInShape(clickPt, hitInfo)) {
                        staticCanvas.setSelection(true, hitInfo.index).redraw();
                    }
                    // DEBUG: Remove comments on the else clause below to enable
                    // de-selecting all shapes when the click falls outside any shape.
                    // else {
                    //     staticCanvas.setSelection(false).redraw();
                    // }

                    updateToolPalette();
                    isHandled = true;
                    break;

                case toolModeEnum.line:
                    // A single click in line drawing mode means to begin
                    // drawing a line or to start a new segment if we are
                    // already drawing a line.
                    handleLineToolClick(clickPt);
                    isHandled = true;
                    break;

                case toolModeEnum.polygon:
                    // A single click in polygon drawing mode means to begin
                    // drawing a polygon or to start a new segment if we are
                    // already drawing a polygon.
                    handlePolygonToolClick(clickPt);
                    isHandled = true;
                    break;
            }
        }
        else if (drawInfo.lastMouseUpButton === 3) {
            //
            // Right click
            //
            if (drawInfo.isLineSegmentMode) {
                // Right click adds a final point to the tripwire or
                // polygon, then ends drawing mode.
                if (_toolMode === toolModeEnum.line) {
                    handleLineToolClick(clickPt);
                    if (drawInfo.points.length >= 2) {
                        addTripwire(drawInfo.points);
                        isHandled = true;
                    }
                }
                else if (_toolMode === toolModeEnum.polygon) {
                    handlePolygonToolClick(clickPt);
                    if (drawInfo.points.length >= 3) {
                        addPolygon(drawInfo.points);
                        isHandled = true;
                    }
                }

                if (!isHandled) {
                    _snapController.drawingCanvas().removeEvents().redraw();
                    markupMsg = $('#markup_hint_message');
                    if (markupMsg.is(':visible')) {
                        markupMsg.slideUp('fast');
                        adjustExpandedBorderHeight(markupMsg, false);
                    }
                    isHandled = true;
                }

                drawInfo.isLineSegmentMode = false;
            }
        }
    }
    catch (ex) {
        $.log('Error handling snapshot click event: ' + ex.name + ' - ' + ex.message);
        $.log(ex);
    }

    return (!isHandled);
};


/**
 * Handles a mouse dblclick in the snapshot markup frame.
 * @param {Object} event The mouse dblclick event.
 */
var onMarkupDblClick = function (event) {
    var markupMsg;
    var drawInfo = _snapController.drawInfo();

    try {
        if (drawInfo.lastMouseUpButton === 1) {
            if (drawInfo.isLineSegmentMode) {
                // Double-click ends line segment drawing mode.
                drawInfo.isLineSegmentMode = false;
                if ((_toolMode === toolModeEnum.line) &&
                    (drawInfo.points.length >= 2)) {
                    addTripwire(drawInfo.points);
                }
                else if ((_toolMode === toolModeEnum.polygon) &&
                    (drawInfo.points.length >= 3)) {
                    addPolygon(drawInfo.points);
                }
                else {
                    _snapController.drawingCanvas().removeEvents().redraw();
                    markupMsg = $('#markup_hint_message');
                    if (markupMsg.is(':visible')) {
                        markupMsg.slideUp('fast');
                        adjustExpandedBorderHeight(markupMsg, false);
                    }
                }

                return false;
            }
        }
    }
    catch (ex) {
        $.log('Error handling snapshot dblclick event: ' + ex.name + ' - ' + ex.message);
        $.log(ex);
    }
    return true;
};


/**
 * Handles a mousemove event in the snapshot markup frame.
 * @param {Object} event The mousemove event.
 */
var onMarkupMouseMove = function (event) {
    var startPt;
    var mousePosition = createPoint(event.pageX, event.pageY);
    var drawInfo = _snapController.drawInfo();

    // Prevent browser default behavior of dragging the snapshot image.
    event.preventDefault();

    try {
        // See if mouse position has changed since last mouse
        // move event. IE will fire this event continuously whether
        // or not the mouse has actually moved.
        if ((!mousePosition.equals(_lastMouseMovePosition)) &&
            (drawInfo.isMouseLeftDown || drawInfo.isLineSegmentMode)) {
            drawInfo.lastPt = _snapController.createCanvasPoint(mousePosition.x, mousePosition.y);

            // If the left mouse button is down and if we have not yet begun
            // a drag operation and if the mouse has moved a significant
            // amount, then begin a drag operation.
            if (drawInfo.isMouseLeftDown && (!drawInfo.isDragging)) {
                startPt = drawInfo.startPoint();
                if (!startPt) {
                    startPt = _lastMouseMovePosition;
                }
                if (!startPt.isNear(mousePosition, SIGNIFICANT_MOVEMENT_PIXELS)) {
                    beginDragOperation();
                }
            }

            drawMouseMoveFeedback();
        }
    }
    catch (ex) {
        $.log('Error handling snapshot mouseup event: ' + ex.name + ' - ' + ex.message);
        if (ex.stack) {
            $.log(ex);
        }
    }
    finally {
        _lastMouseMovePosition = mousePosition;
    }
};


/**
 * Handles keypress events.
 * @param {Object} event The keypress event.
 */
var onKeyPress = function (event) {
    var drawInfo;
    if (_snapController) {
        drawInfo = _snapController.drawInfo();

        // Detect Esc key, ASCII code 27.
        if (event.keyCode === 27) {
            if (drawInfo.isLineSegmentMode) {
                // Escape ends line segment drawing mode.
                drawInfo.isLineSegmentMode = false;
                _snapController.drawingCanvas().drawLineFeedback(drawInfo.endPoint(),
                    null, _curDirection);

                // were we drawing a tripwire?
                if (_rule.eventDefinition.typeOf === eventDefObjectTypes.tripwireEventDefinition ||
                    _rule.eventDefinition.typeOf === eventDefObjectTypes.multiLineTripwireEventDefinition) {
                    // Add the existing segments, if any, but excluding the
                    // most recent segment, as a tripwire.
                    if (drawInfo.points.length >= 2) {
                        addTripwire(drawInfo.points);
                    }
                }

                $('#markup_hint_message:visible').slideUp('fast');

                event.stopPropagation();
            }
        }
    }
};


/**
 * Enables or disables tool palette buttons based on the current
 * drawing selection.
 * @param {Boolean} isFullFrame True if only the full frame button is
 *                   to be enabled, false if all of the drawing buttons
 *                   are to be enabled.
 */
var togglePaletteButtons = function (isFullFrame) {
    var disableConfig;
    var allButtons = $('#tool_palette .toolbtn').not('#options_buttons > *');
    allButtons.removeClass('selected');

    if (isFullFrame) {
        $('#action_full_view').removeClass('disabled').addClass('selected');
        allButtons.not('#action_full_view').addClass('disabled');
        _toolMode = toolModeEnum.fullFrame;
    }
    else {
        allButtons.removeClass('disabled');
        $('#tool_select').addClass('selected');
        _toolMode = toolModeEnum.select;

        // Enable/disable the delete button based on
        // whether a markup shape is selected.
        if (_snapController) {
            $('#action_delete').toggleClass('disabled', (_snapController.staticCanvas().getSelection() === undefined));
        }
    }

    if (isFullFrame) {
        disableConfig = true;
    }
    else {
        disableConfig = getEventDefinitionType() === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition;
    }
    $('#config_options').toggleClass('disabled', disableConfig);
};


/**
 * Shows/hides tool palette options as appropriate to the rule type.
 * @param {String} ruleType One of 'tripwire', 'aoi', 'fullframe',
 * or 'tamper'.
 * @exception {Error} If ruleType is not one of the expected
 *                     string values.
 */
var configureToolPalette = function (ruleType) {
    var palette = $('#tool_palette');

    if ((ruleType !== 'tripwire') && (ruleType !== 'aoi') &&
        (ruleType !== 'fullframe') && (ruleType !== 'tamper')) {
        throw new Error('Invalid parameter: ruleType');
    }

    palette.removeClass('aoi').removeClass('tripwire').removeClass('tamper');
    palette.addClass(ruleType);

    if (ruleType === 'fullframe') {
        togglePaletteButtons(true);
        $('#action_full_view').addClass('active');
    }
    else {
        togglePaletteButtons(false);
    }

    if (ruleType === 'tripwire') {
        $('#tool_palette').addClass('reduced_padding');
    }
    else {
        $('#tool_palette').removeClass('reduced_padding');
    }

    // Sets the help link for the help icon on the drawing toolbar.
    $('#help_options').unbind('click');
    if (ruleType === 'tripwire') {
        // If drawing a tripwire, open the tripwire drawing page.
        $('#help_options').click(function () {
            if ($(this).hasClass('disabled')) {
                return true;
            }
            else {
                window.open(buildHelpPath("help/Content/Draw a Video TripWire.htm"));
                return false;
            }
        });
    }
    else {
        // If drawing an area of interest, show the drawing an area page.
        $('#help_options').click(function () {
            if ($(this).hasClass('disabled')) {
                return true;
            }
            else {
                window.open(buildHelpPath("help/Content/Draw an Area.htm"));
                return false;
            }
        });
    }

    $('#help_options').removeClass('disabled');
};


/**
 * Enables/disables tool palette options as appropriate to the type of
 * rule being created/edited and the state of the markup selection.
 */
var updateToolPalette = function () {
    var isFullFrame = false, isSimple = false, isShapeSelected = false;
    if (_rule) {
        isFullFrame = getRuleType(_rule) === 'fullframe';
        isSimple = getEventDefinitionType() === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition;
        isShapeSelected = (!isFullFrame) && Boolean(_snapController) && (_snapController.staticCanvas().getSelection() !== undefined);
    }

    // Enable/disable the delete button based on
    // whether a markup shape is selected.
    $('#action_delete').toggleClass('disabled',
        (!isShapeSelected) || (_toolMode !== toolModeEnum.select));

    // Disable the AOI tool if _rule.eventDefinition is an AOI
    // and we already have an AOI shape.
    $('#tool_polygon:visible').toggleClass('disabled', isShapeSelected);

    // Disable line tool if _rule.eventDefinition is multi-line
    // and has reached the max number of tripwires per event.
    $('#tool_line:visible').each(function () {
        var doDisable;
        var nTripwires = 0;
        if (_rule && _rule.eventDefinition) {
            if (_rule.eventDefinition.tripwires) {
                nTripwires = _rule.eventDefinition.tripwires.length;
            }
            else if (_rule.eventDefinition.tripwireDirection) {
                nTripwires = (_rule.eventDefinition.points.length > 1) ? 1 : 0;
            }
        }
        doDisable = (nTripwires >= getMaxTripwires());
        $(this).toggleClass('disabled', doDisable);

        // Disable tripwire change direction button if the line
        // tool is disabled AND no markup shape is selected.
        $('#action_direction').toggleClass('disabled', doDisable && (!isShapeSelected));
    });

    // Enable/disable the tripwire change direction button.
    $('#action_direction:visible').each(function () {
        var direction = '';
        var index;

        if (_toolMode === toolModeEnum.line) {
            direction = tripwireDirections.AnyDirection;
        }
        else if (isShapeSelected && _rule && _rule.eventDefinition) {
            // Set the state of the change direction button based on the direction
            // of the currently selected tripwire, if any.
            if (_rule.eventDefinition.tripwireDirection) {
                direction = _rule.eventDefinition.tripwireDirection;
            }
            else if (_rule.eventDefinition.tripwires && _snapController) {
                index = _snapController.staticCanvas().getSelection();
                if (_rule.eventDefinition.tripwires[index]) {
                    direction = _rule.eventDefinition.tripwires[index].tripwireDirection;
                }
            }
        }

        if (direction) {
            $(this).toggleClass('left_to_right', (direction === tripwireDirections.LeftToRight))
                .toggleClass('right_to_left', (direction === tripwireDirections.RightToLeft));
            _curDirection = direction;
        }
    });

    // Activate/deactivate the full frame button and disable
    // the select and polygon buttons if full frame is active.
    $('#action_full_view:visible').toggleClass('active', isFullFrame).toggleClass('selected', isFullFrame);
    $('#config_options').toggleClass('disabled', isFullFrame || isSimple);
    if (isFullFrame) {
        $('#tool_select').addClass('disabled').removeClass('selected');
        $('#tool_polygon:visible').addClass('disabled');
    }

    $('#help_options').removeClass('disabled');
};


/**
 * Indicates whether the named event type is supported according
 * to _analyticsCapabilities.
 * @param {String} eventTypeName Name of an event type.
 * @return {Boolean} True if the named event type is supported by the
 *                    device; false, if it is not supported.
 */
var isEventSupported = function (eventTypeName) {
    return true;
};


/**
 * Extracts the supported actions list (string array) from _analyticsCapabilities
 * for a given event type.
 * @param {String} eventTypeName Name of an event type.
 * @return {Array} An array of strings representing the supported actions,
 *                  or an empty array if no such event type is supported
 *                  by this channel.
 */
var getSupportedActionsForEvent = function (eventTypeName) {
    var supportedEvent;

    supportedEvent = _analyticsCapabilities.supportedEvents[eventTypeName];
    if (Boolean(supportedEvent) && Boolean(supportedEvent.options)) {
        return supportedEvent.options.supportedActions;
    }

    return [];
};


/**
 * Returns an array of classification types for the given event type.
 * @param {String} eventTypeName Name of an event type.
 * @return {Array} Supported classification types for the given event type
 *                  or an empty array if the event type is not supported.
 */
var getSupportedClassificationsForEvent = function (eventTypeName) {
    var supportedEvent;
    supportedEvent = _analyticsCapabilities.supportedEvents[eventTypeName];
    if (supportedEvent) {
        if (supportedEvent.options) {
            return supportedEvent.options.supportedClassifications;
        }
    }
    return [];
};


/**
 * Binds, or re-binds, click events to input controls with class
 * with_collapsing_details or action_group_checkbox.
 */
var bindActionCheckboxClick = function () {
    var detailChk, groupChk;
    // Set up hide/show actions on event type selection checkboxes.
    // Note that we bind with the event namespace actionCheckbox, so
    // that we can selectively unbind if called a second time.
    detailChk = $('input.with_collapsing_details');
    detailChk.unbind('click.actionCheckbox');
    detailChk.not('.ov_locked').bind('click.actionCheckbox', function () {
        onActionWithDetailsClick(this);
    });

    // Expand/collapse action groups when the top-level item is
    // checked/unchecked
    groupChk = $('input.action_group_checkbox');
    groupChk.unbind('click.actionCheckbox');
    groupChk.not('.ov_locked').bind('click.actionCheckbox', function () {
        onActionGroupClick(this);
    });

    // Prevent default behavior if marked with ov_locked class.
    detailChk.add(groupChk).filter('.ov_locked').bind('click.actionCheckbox', function (event) {
        event.preventDefault();
    });
};


/**
 * All actions start as hidden, then this function displays a subset based
 * only on what the AnalyticsCapabilities allow, combined with what the
 * selected template allows. (Subsequent changes may be made by the user that
 * will enable/disable various options - only actions disallowed by the
 * template or capabilities are hidden, however.)
 */
var displayPermittedActions = function (ruleType) {
    // What does AnalyticsCapabilities allow for this type?
    // TODO: Ideally make this more flexible (better tie between supplied ruleType string vs. getSupportedActionsForEvent() parameter values).
    var actionList, ffActions, checkbox;

    switch (ruleType) {
        case 'tripwire':
            actionList = ['CrossesTripwire', 'CrossesMultiLineTripwire'];
            break;

        case 'fullframe':
        case 'aoi':
            ffActions = [];
            ffActions.push('AppearAreaAction');
            ffActions.push('DisappearAreaAction');
            ffActions.push('TakeAwayAreaAction');
            ffActions.push('LeaveBehindAreaAction');

            actionList = [];
            actionList.push('AppearAreaAction');
            actionList.push('DisappearAreaAction');
            actionList.push('TakeAwayAreaAction');
            actionList.push('LeaveBehindAreaAction');
            break;

        default:
            throw new Error('Invalid argument: ruleType: ' + ruleType);
    }

    // Display the specified set.
    $.each(actionList, function () {
        var actionElement = $('#' + ACTION_TO_ID_HASH[this]);
        actionElement.show();

        // Is the item we're showing within an action group? If so,
        // display the group as well (any unavailable peers will remain
        // individually hidden).
        if (actionElement.hasClass('action_group_option_container')) {
            actionElement.closest('.action_group_container').show();
        }
    });

    // If we've ended up with exactly one allowed action:
    if (actionList.length === 1) {
        // 1) Check it for the user.
        checkbox = $('#' + ACTION_TO_ID_HASH[actionList[0]]).children('input:checkbox');
        checkbox.attr('checked', 'checked');

        // 2) Expand any associated sub-controls.
        if (checkbox.hasClass('with_collapsing_details')) {
            onActionWithDetailsClick(checkbox[0]);
        }
        if (checkbox.hasClass('action_group_checkbox')) {
            onActionGroupClick(checkbox[0]);
        }

        // 3) Don't allow it to be un-checked.
        checkbox.addClass('ov_locked');
        $('label[for="' + checkbox[0].id + '"]').addClass('ov_locked');
        bindActionCheckboxClick();
    }
};


/**
 * Alters what options are enabled (in the event type list), depending on
 * whether the user has selected a "regular" AOI vs. a full-frame rule.
 *
 * If force is false, this function will first check if it is about to hide
 * an option that was already selected. If it is and if force is false, this
 * function will return false and not actually change anything. If force is
 * true, then this function will make the changes to what is visible regardless
 * of what is or isn't selected.
 * @param {Boolean} isFullFrame True if the rule being displayed is full frame,
 *                   false if it is a partial-view area.
 * @param {Boolean} force True if the changes should be forced even if they
 *                   modify existing user selections, false if user selections
 *                   take priority.
 * @return {Boolean} True if changes were actually made, false if changes
 *                   would hide a selected item and "force" was set to false.
 *
 * @see displayPermittedActions
 */
var displayAOIActions = function (force, triggerCheckboxElement) {
    var newActionList = null;
    var newFFActionList = null;
    var newAOIActionList = null;
    var newCountingActionList = null;
    var newSimpleActionList = null;
    var enableActionList = null, disableActionList = [];
    var retVal = true;
    var oldActionList = [];

    // Is full-frame active?
    var isFullFrame = $('#action_full_view').hasClass('active');

    // What type of action is already selected?
    var isCounting = $('input.counting_aoi').is(':checked');
    var isSimple = $('input.simple_aoi').is(':checked');
    var isAoi = $('input.aoi_action_checkbox').is(':checked');
    var nTypesSelected = (isCounting ? 1 : 0) + (isSimple ? 1 : 0) + (isAoi ? 1 : 0);

    // Regardless of what's selected now, what triggered this?
    var triggerType = eventDefinitionTypes.AreaOfInterestEventDefinition;
    if (triggerCheckboxElement) {
        if (triggerCheckboxElement.hasClass('counting_aoi')) {
            triggerType = eventDefinitionTypes.CountingAreaOfInterestEventDefinition;
        }
        else if (triggerCheckboxElement.hasClass('simple_aoi')) {
            triggerType = eventDefinitionTypes.SimpleAreaOfInterestEventDefinition;
        }
    }

    // What's currently enabled?
    $('div.event_type').each(function (count) {
        if (!$(this).hasClass('disabled')) {
            oldActionList.push(ID_TO_ACTION_HASH[this.id]);
        }
    });

    // For the purpose of which rules we enable when full frame is selected,
    // counting actions are considered AOI actions, even though they're not
    // categorized as such by the spec.
    if (isFullFrame) {
        newFFActionList = getSupportedActionsForEvent(eventDefinitionTypes.FullFrameEventDefinition);
        newActionList = newFFActionList;
    }
    else {
        newAOIActionList = [];
        newCountingActionList = [];
        newSimpleActionList = [];

        if (nTypesSelected === 0) {
            // No aoi actions have yet been selected, so enable all AOI actions.
            newActionList = newAOIActionList.concat(newCountingActionList, newSimpleActionList);
        }
        else if (nTypesSelected === 1) {
            // Exactly one type has been selected, so enable actions
            // of that type and disable all others.
            if (isSimple) {
                newActionList = newSimpleActionList;
            }
            else if (isCounting) {
                newActionList = newCountingActionList;
            }
            else {
                newActionList = newAOIActionList;
            }
        }
        else {
            // More than one action type is now checked. The type of
            // checkbox that triggered this call "wins." Uncheck and
            // disable all of the others.
            if (triggerType === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition) {
                newActionList = newSimpleActionList;
            }
            else if (triggerType === eventDefinitionTypes.CountingAreaOfInterestEventDefinition) {
                newActionList = newCountingActionList;
            }
            else {
                newActionList = newAOIActionList;
            }
        }
    }

    // Figure out overlap so we don't disable-then-re-enable some items.
    // In other words, normally we'd disable everything in the "old" list, but
    // we need to except any that are also in the "new" list.
    enableActionList = newActionList;
    $.each(oldActionList, function (i, oldActionName) {
        if ($.inArray(oldActionName, newActionList) === -1) {
            disableActionList.push(oldActionName);
        }
    });

    // If the Person classification is selected, that adds some items to the "disable" list.
    if ($('#classification_person_checkbox').is(':checked')) {
        // Get the list of actions that are not compatible with Person classification.
        // For each such element, get the mapped action name and add it to the disableActionList.
        $('div.not_people').each(function () {
            disableActionList.push(ID_TO_ACTION_HASH[this.id]);
        });
    }

    // Show or hide the classification options.
    showClassificationOptions(!isSimple, true);

    // Enable/disable the options dialog button and show/hide the filters.
    $('#config_options').toggleClass('disabled', isFullFrame || isSimple);
    if (isSimple) {
        $('#filters_pane').fadeOut();
    }
    else {
        $('#filters_pane').fadeIn();
    }

    if (triggerType === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition) {
        if (isSimple) {
            // If a simple action has just been activated,
            // disable all counting and aoi actions.
            $('input.aoi_action_checkbox').each(function () {
                disableActionList.push($(this).val());
            });
            $('input.counting_aoi').each(function () {
                var container = $(this).closest('.action_group_container');
                if (container.length > 0) {
                    disableActionList.push(container[0].id);
                }
            });
        }
    }
    else if (isCounting) {
        // If a counting action is selected, disable all the other
        // counting actions (only one can be selected for a given rule).
        $('input.counting_aoi').each(function () {
            var currentActionCheckboxElement = $(this);
            if (!currentActionCheckboxElement.is(':checked')) {
                // is this a group or an individual action?
                if (currentActionCheckboxElement.hasClass('action_group_checkbox')) {
                    // It is a group, so add its sub-elements to the disableActionList.
                    currentActionCheckboxElement.closest('.action_group_container')
                        .find('.action_group_option_container')
                        .each(function () {
                            disableActionList.push(ID_TO_ACTION_HASH[this.id]);
                        });
                }
                else {
                    // It is an individual action, so just add it
                    // directly to the disableActionList.
                    disableActionList.push(currentActionCheckboxElement.val());
                }
            }
        });
    }

    // Check if any of the items to be disabled are already selected.
    // Iterate over checked checkboxes, see if any have values that are
    // in disableActionList.
    $('input.event_type_checkbox:checked').each(function () {
        if ($.inArray(this.value, disableActionList) > -1) {
            // If the user has checked something that was going to be disabled,
            // and displayAOIActions() had force set to false, then return
            // false to tell the caller to warn the user.
            if (!force) {
                retVal = false;
                return false;
            }
            else {
                // Force is set to true, so we will proceed - but first
                // uncheck the "offending" checkbox.
                this.checked = false;
            }
        }
    });

    if (retVal) {
        // Finally, enable all the items we've added to the enableActionList.
        $.each(enableActionList, function () {
            var actionBlockElement = $('#' + ACTION_TO_ID_HASH[this]);
            actionBlockElement.removeClass('disabled');

            // Enable the actual checkbox.
            actionBlockElement.find('input.event_type_checkbox').removeAttr('disabled');

            // Are we dealing with a sub-element within an action group?
            // If so, enable the group (peer sub-elements will be unaffected)
            // TODO: more elegant way to handle this, such as checking before
            //       this loop and just adding the top-level element to the
            //       enableActionList?
            if (actionBlockElement.hasClass('action_group_option_container')) {
                actionBlockElement.closest('.action_group_container')
                    .removeClass('disabled')
                    // and the checkbox
                    .find('input.action_group_checkbox').removeAttr('disabled');
            }

            // TODO: handle the case where one sub-element has been enabled,
            //       and another sub-element has been disabled - enabling the
            //       group should win in that case!
        });

        // Disable all the items we've added to the disableActionList.
        // Depending on context nothing may already be visible, in which
        // case this does nothing.
        $.each(disableActionList, function () {
            var actionBlockElement = $('#' + ACTION_TO_ID_HASH[this]);
            actionBlockElement.addClass('disabled');

            // Disable the actual checkbox.
            $('input.event_type_checkbox', actionBlockElement).prop('disabled', true);

            // are we dealing with a sub-element within an action group?
            // if so, disable the group (peer sub-elements will be unaffected)
            // TODO: more elegant way to handle this, such as checking before
            //       this loop and just adding the top-level element to the
            //       disableActionList?
            if (actionBlockElement.hasClass('action_group_option_container')) {
                actionBlockElement.closest('.action_group_container')
                    .addClass('disabled')
                    // and the checkbox
                    .find('input.action_group_checkbox').prop('disabled', true);
            }

            // TODO: handle the case where one sub-element has been enabled,
            //       and another sub-element has been disabled - enabling the
            //       group should win in that case!
        });
    }

    return retVal;
};


/**
 * Classification options can be disabled based on which action has been
 * selected, or based on which other classification option(s) may have
 * been selected.
 * (Note that classification options can be hidden based on license type,
 * but that is handled by displayClassifcationOptions().)
 * @param {Object} checkboxElement If selecting a classification option
 *                                 was what triggered this function call,
 *                                 checkboxElement represents that classification
 *                                 checkbox. If not, this value is null.
 * @see displayClassificationOptions
 */
var disableClassificationOptions = function (checkboxElement) {
    var allowAnything = true;
    var disableContainerIDs = [];
    var enableContainerIDs = [];
    var isPersonChecked = $('#classification_person_checkbox').attr('checked');
    var isVehicleChecked = $('#classification_vehicle_checkbox').attr('checked');
    var isAnythingChecked = $('#classification_anything_checkbox').attr('checked');
    var visibleClassificationContainerElements;

    // If person or vehicle is checked, disable anything; if
    // anything is checked, disable person and vehicle; if an
    // invalid combination is currently checked, look at which
    // one triggered this call - that one wins. If nothing is
    // checked, then all three options remain enabled.

    // if something is in fact already checked, then either
    // anything or people/vehicle needs to get disabled
    if ($('input.classification_checkbox:checked').length > 0) {
        // Is an invalid combination already checked?
        if ((isPersonChecked || isVehicleChecked) && isAnythingChecked) {
            // If so, which one triggered this call?
            if (checkboxElement) {
                if (checkboxElement.id === 'classification_anything_checkbox') {
                    allowAnything = true;
                }
                else {
                    allowAnything = false;
                }
            }
            else {
                // We should never get to this point - where somehow we already
                // have both anything and vehicle or person checked, but not
                // because the user just clicked on one of those checkboxes.
                throw new Error('Detected existing invalid classification checkbox combination');
            }
        }
        else {
            // Otherwise things are simpler:
            // If person or vehicle is checked, disable anything.
            if (isPersonChecked || isVehicleChecked) {
                allowAnything = false;
            }
            else {
                // If anything is checked, disable person and vehicle.
                allowAnything = true;
            }
        }

        // If we came out of the above checks with allowAnything set to
        // true, then people and vehicle need to get disabled; if
        // allowAnything is false, then anything gets disabled.
        if (allowAnything) {
            // Disable people and vehicle.
            disableContainerIDs.push('human');
            disableContainerIDs.push('vehicle');
        }
        else {
            // Disable anything.
            disableContainerIDs.push('anything');
        }
    }

    // Are any actions selected that disallow some classifications?
    // The rules here are: if any action is child of class "not_people"
    // is checked, then the "Person" classification should be disabled
    // and unchecked; if no such action is checked, then the "Person"
    // classification may be enabled pending any other rules (such
    // as the state of the "Anything" classification checkbox).
    if ($('.not_people > input:checked').length > 0) {
        disableContainerIDs.push('human');
    }

    // If there's only one classification option visible, it should always
    // be disabled and checked (though we won't handle the "checked" part
    // from here, that's in displayClassificationOptions())
    // TODO: if there's only one *enabled* classification option, should
    //       the same rule apply? (historically it has not)
    // TODO: should this be an initial exit case (if only one is visible,
    //       check for that and disable/check as the first thing in this
    //       function, then exit)?
    // TODO: re-use visibleClassificationContainerElements collection here and
    //       below where we build enableContainerIDs (though will have to change
    //       whether collection of checkboxes or containers)
    visibleClassificationContainerElements = $('.classification_item_container:visible');
    if (visibleClassificationContainerElements.length === 1) {
        disableContainerIDs.push(visibleClassificationContainerElements[0].id);
    }

    // We have our disableContainers list - rather than enable everything and
    // then disable just these (which looks odd for items that were already
    // disabled, got enabled, then got re-disabled), let's look at what's
    // not in the disableContainers list, then generate an enableContainers
    // list out of that. Then we can start with what's enabled/disabled now,
    // and enable the enableContainers list, disable the disableContainers
    // list, and only what changed will visibly change for the user.
    $('input.classification_checkbox:visible').each(function () {
        var containerElement = $(this).closest('.classification_item_container');
        var containerElementId = containerElement.attr('id');
        if ($.inArray(containerElementId, disableContainerIDs) === -1) {
            enableContainerIDs.push(containerElementId);
        }
    });

    // Disable/enable as needed.
    $.each(disableContainerIDs, function (i, containerId) {
        var containerElement = $('#' + containerId);
        var checkboxElement = $('input.classification_checkbox', containerElement);
        // Uncheck checkbox - UNLESS it's the only visible classification option.
        if (visibleClassificationContainerElements.length > 1) {
            checkboxElement.removeAttr('checked');
            // add "disabled" class to container - UNLESS it's the only visible classification option
            containerElement.addClass('disabled');
        }
        // Disable checkbox.
        // Note that unlike displayAOIActions(), in this case we don't need
        // to be concerned with warning the user that their selection is
        // going to undo a previous selection. Technically we don't really
        // need to uncheck the checkbox at all, because all this disabling
        // ensures the user can't get into that situation.
        checkboxElement.prop('disabled', true);
    });

    $.each(enableContainerIDs, function (i, containerId) {
        var containerElement = $('#' + containerId);
        var checkboxElement = $('input.classification_checkbox', containerElement);
        // Remove "disabled" class from container.
        containerElement.removeClass('disabled');
        // Disable checkbox.
        checkboxElement.removeAttr('disabled');
    });
};


/**
 * Click event handler for event type (i.e., action) checkboxes that
 * have associated detail controls.
 * @param {Object} checkboxElement The checkbox input that was clicked,
 *                  as a DOM input element.
 */
var onActionWithDetailsClick = function (checkboxElement) {
    // Any event type checkbox that requires a "details" element should
    // have a "value" set to the OV Ready-based action name, and the
    // details element should be named <action name id>_details.
    var detailsElement;
    var actionName = $(checkboxElement).val();

    if (actionName) {
        detailsElement = $('#' + ACTION_TO_ID_HASH[actionName] + '_details');
        if (detailsElement) {
            if (checkboxElement.checked) {
                // Display the additional line.
                detailsElement.fadeIn();
            }
            else {
                // Hide the additional line
                detailsElement.fadeOut();
            }
        }
    }
};


/**
 * Click event handler for action checkboxes that have associated groups
 * of detail controls.
 * @param {Object} checkboxElement The checkbox input that was clicked,
 *                  as a DOM input element.
 */
var onActionGroupClick = function (checkboxElement) {
    // Get group contents container.
    var checkbox = $(checkboxElement);
    var contentsElement = checkbox.closest('.action_group_container').find('.action_group_contents');

    // Show or hide the contents as appropriate.
    if (checkbox.is(':checked')) {
        contentsElement.fadeIn();
        toggleDataAction(contentsElement.find('input.data_action').is(':checked'));
    }
    else {
        contentsElement.fadeOut('normal', function () {
            toggleDataAction(contentsElement.find('input.data_action').is(':visible:checked'));
        });
    }
};


/**
 * Completely shows or hides the classification checkboxes pane.
 * @param {Boolean} isShown If true, the classification pane will be shown;
 *                   if false, the pane will be hidden.
 * @param {Boolean} isAnimated Optiona. If specified and if true, the pane will
 *                   be shown or hidden with a slide up or slide down animation.
 */
var showClassificationOptions = function (isShown, isAnimated) {
    var pane = $('#classification_list_container');
    var link = $('#troubleshoot_link_events');
    if (isShown) {
        // Move the troubleshooting link back inside
        // the pane, then show the pane.
        link.prependTo(pane).css('padding-top', '0');
        if (isAnimated) {
            pane.slideDown();
        }
        else {
            pane.show();
        }
    }
    else {
        // Move the troubleshooting link out of the classification pane,
        // then hide the pane.
        link.prependTo('#event_type_list').css('padding-top', '5px');
        if (isAnimated) {
            pane.slideUp();
        }
        else {
            pane.hide();
        }
    }
};


/**
 * Alters which classification options are displayed, based on the
 * analyticsCapabilities reported for the channel.
 * @param {String} eventTypeName Name of an event type.
 * @param force {Boolean} If true, then this method will hide any
 *                         classification options as needed, even if they
 *                         had been checked by the user; if false, then if
 *                         this method recognizes that a checked
 *                         classification option is about to be hidden, it
 *                         will not hide any options and will instead just
 *                         return false.
 * @return {Boolean} True if changes were actually made, false if changes
 *                    would hide a selected item and "force" was set to false.
 */
// TODO: does displayClassificationOptions ever get called after the rule edit
//       page has initially loaded? in other words, is the force option needed?
//       will the user ever have a chance to check something, then will we
//       ever have to prompt them that their classification selection will
//       be unchecked?
var displayClassificationOptions = function (eventTypeName, force) {
    var supportedClassification, supportedClassificationId;
    var classificationContainerElement, classificationCheckboxElement;
    // var supportedClassificationList = getSupportedClassificationsForEvent(eventTypeName);
    var supportedClassificationList = [];

    // First determine if we're about to hide something that the user has
    // already checked, in which case they need a chance to cancel the
    // command that changes their classification options BEFORE anything
    // has actually been hidden.
    var willHideChecked = false;
    $('.classification_checkbox:checked').each(function (counter, checkboxElement) {
        if ($.inArray(checkboxElement.value, supportedClassificationList) === -1) {
            willHideChecked = true;
            // if force is true, then uncheck the checkbox before hiding it
            if (force) {
                $(checkboxElement).removeAttr('checked');
                disableClassificationOptions(checkboxElement);
            }
            // exit $.each loop
            return false;
        }
    });

    if (willHideChecked && !force) {
        return false;
    }

    // Technically we could just hide all of them, then display the ones
    // in the new list - but that might look funny to the user as they
    // switch between AOI and full frame, or tripwire and multiline tripwire.
    // So instead iterate over the ones that could potentially be displayed,
    // then decide to hide, show or leave alone each one.
    $('span.classification_item_container').each(function (counter, classificationElement) {
        // is it's name on the list?
        var name = CLASSIFICATION_FROM_ID_HASH[classificationElement.id];
        if ($.inArray(name, supportedClassificationList) > -1) {
            // If it's on the list, display it (if it's already displayed,
            // this won't do anything).
            $(classificationElement).fadeIn();
        }
        else {
            // If it's not on the list, hide it (if it's already hidden,
            // this won't do anything).
            $(classificationElement).fadeOut();
        }
    });

    if (supportedClassificationList.length === 0) {
        // None of the classifications is supported.
        // Move the troubleshooting link,then hide the whole box.
        showClassificationOptions(false);
    }
    else if (supportedClassificationList.length === 1) {
        // At the end, if there's only one option, may as well check it for the user.
        // TODO: merge with similar logic in disableClassificationOptions()? or only
        //       do this from disableClassificationOptions() (though right now it
        //       doesn't check the box, just disables)? or only from here?
        //       (depending on order, disableClassificationOptions() could re-enable
        //       the one checkbox, though)
        supportedClassification = supportedClassificationList[0];
        supportedClassificationId = CLASSIFICATION_TO_ID_HASH[supportedClassification];
        classificationContainerElement = $('#' + supportedClassificationId);
        classificationCheckboxElement = $('input.classification_checkbox', classificationContainerElement);
        classificationCheckboxElement.attr('checked', 'checked');
        // Disable it as well - if there's only one option, they shouldn't be
        // able to uncheck it.
        classificationCheckboxElement.prop('disabled', true);
        classificationCheckboxElement.addClass('disabled');
    }

    return true;
};


/**
 * Creates a new event definition object based on an existing event definition.
 * The actions, classifications, and filters properties are copied from the
 * source object to the new event definition.
 * @param {Object} src An existing event definition
 * @param {String} newType The type of event definition object to return, either
 *                  'AreaOfInterestEventDefinition' or 'FullFrameEventDefinition'.
 * @exception {Error} If src is not an event definition object or if
 *                     newType is not one of 'AreaOfInterestEventDefinition'
 *                     or 'FullFrameEventDefinition'.
 */
var createEventDefFrom = function (src, newType) {
    var newEvtDef, allowedActions;

    if (!src) {
        throw new Error('Invalid argument: src');
    }

    if (src.hasOwnProperty('actions') && !src.actions) {
        throw new Error('Invalid argument: src has null actions');
    }

    switch (newType) {
        case eventDefinitionTypes.AreaOfInterestEventDefinition:
            newEvtDef = objectvideo.ovready.areaOfInterestEventDefinition();
            break;
        case eventDefinitionTypes.FullFrameEventDefinition:
            newEvtDef = objectvideo.ovready.fullFrameEventDefinition();
            break;
        case eventDefinitionTypes.CountingAreaOfInterestEventDefinition:
            newEvtDef = objectvideo.ovready.countingAreaOfInterestEventDefinition();
            break;
        case eventDefinitionTypes.SimpleAreaOfInterestEventDefinition:
            newEvtDef = objectvideo.ovready.simpleAreaOfInterestEventDefinition();
            break;
        default:
            throw new Error('Invalid argument: newType. Must be an area-of-interest or full-frame event definition');
    }

    // Copy classifications and filters.
    if (newEvtDef.hasOwnProperty('classificationList') && src.hasOwnProperty('classificationList')) {
        if (newEvtDef.classificationList && src.classificationList) {
            $.each(src.classificationList, function () {
                newEvtDef.classificationList.push(this);
            });
        }
    }

    // TODO: Technically should handle the case where src and/or new eventdef supports
    //       only one classification (i.e. counting rules), though realistically it
    //       won't matter - we don't store the classification in the event definition
    //       until save-time anyway.
    // TODO: or, due to the above, re-check if it's *ever* necessary to copy the
    //       classification list when calling this method

    if (src.hasOwnProperty('filters') && newEvtDef.hasOwnProperty('filters')) {
        $.each(src.filters, function () {
            newEvtDef.filters.push(this);
        });
    }

    // Copy only supported actions.
    if (newEvtDef.hasOwnProperty('actions') && src.hasOwnProperty('actions')) {
        allowedActions = getSupportedActionsForEvent(newType);
        if (newEvtDef.actions && src.actions) {
            newEvtDef.actions = $.grep(src.actions, function (value) {
                return ($.inArray(allowedActions, value.actionName) >= 0);
            });
        }
    }
    // TODO: if the new and/or src event def supports a single action (i.e. counting rule), check if any of the originals are supported and copy one - unlikely situation, though

    // If the source and target both support points, copy those.
    if (newEvtDef.points && src.points) {
        $.each(src.points, function () {
            newEvtDef.points.push(this);
        });
    }

    return newEvtDef;
};


/**
 * This method is called when the user clicks the "Full frame"
 * tool icon. If the "force" parameter is set to false, and the user has checked
 * an action type that will be hidden, we'll prompt the user to confirm - and
 * this round, do nothing (if the user confirms, onFullFrameChange() will be called
 * again with force set to true). If "force" is set to true, then we won't prompt and
 * we will hide (and uncheck) any selected actions that are not valid for full
 * frame.
 * @param {boolean} force
 */
var onFullFrameChange = function (isActive, force) {
    var id, markupMsg, classificationSuccess = false;
    var staticCanvas = _snapController.staticCanvas();

    $('#action_full_view').toggleClass('active', isActive);

    // Change the available classifications based on whether we're in AOI or
    // full-frame mode.
    if (isActive) {
        classificationSuccess = displayClassificationOptions(eventDefinitionTypes.FullFrameEventDefinition, force);
        markupMsg = $('#markup_error_message');
        if (markupMsg.is(':visible')) {
            markupMsg.slideUp('fast');
            adjustExpandedBorderHeight(markupMsg, false);
        }
    }
    else {
        classificationSuccess = displayClassificationOptions(eventDefinitionTypes.AreaOfInterestEventDefinition, force);
    }
    if (!classificationSuccess) {
        // If the user confirms, the dialog will call displayClassificationOptions()
        // again, this time passing true as the second parameter to force the change
        // to take place.
        $('#confirm_fullframe_classification_dlg').dialog('open');
    }

    // Change the available actions based on whether we're in AOI or full-frame mode
    if (!displayAOIActions(force)) {
        // If displayAOIActions() returned false, that means it would have
        // hidden an option that the user had already checked. in that case,
        // prompt the user to find out if they really want to perform this
        // action.
        // If the user confirms, the dialog will call displayAOIActions() again, this
        // time passing true as the second parameter to force the change to take place.
        $('#confirm_fullframe_dlg').dialog('open');
    }
    else {
        id = (_rule.id || '_'); // Use '_' as event key for new rule.
        staticCanvas.removeEvent(id);

        if (isActive) {
            // Change _rule.eventDefinition to a fullFrameEventDefinition.
            _savedAoiProperties.planeType = _rule.eventDefinition.planeType;
            _savedAoiProperties.points = _rule.eventDefinition.points;
            _rule.eventDefinition = createEventDefFrom(_rule.eventDefinition, eventDefinitionTypes.FullFrameEventDefinition);
        }
        else {
            // Change _rule.eventDefinition to an areaOfInterestEventDefinition.
            _rule.eventDefinition = createEventDefFrom(_rule.eventDefinition, eventDefinitionTypes.AreaOfInterestEventDefinition);
            _rule.eventDefinition.planeType = _savedAoiProperties.planeType;
            _rule.eventDefinition.points = _savedAoiProperties.points;
        }

        if (isActive || (_rule.eventDefinition.points.length > 0)) {
            staticCanvas.addEvent(id, _rule.eventDefinition, true).setSelection(!isActive, 0);
        }
        staticCanvas.redraw();
        togglePaletteButtons(isActive);
    }
};


/**
 * Assuming other rules are already loaded into memory, display the
 * markup for those rules
 */
var displayOtherRuleMarkup = function () {
    if (_snapController) {
        for (id in _otherChannelEvents) {
            if (typeof _otherChannelEvents[id] !== 'function') {
                _snapController.staticCanvas().addEvent(id, _otherChannelEvents[id]);
            }
        }
        _snapController.staticCanvas().redraw();
    }
};


/**
 * Handles a mouse click event on the rule overlay checkbox by showing
 * or hiding markup for rules other than the one being created/edited.
 * @param {Object} event The click event.
 */
var onMarkupCheckboxClick = function (event) {
    var id;
    var markupMsg = $('#markup_warning_message');

    if (this.checked) {
        // have we loaded the data about the other rules?
        if (!_otherRuleDataLoaded) {
        }
        else {
            displayOtherRuleMarkup();
            if (_otherRuleDataPartiallyLoaded) {
                if (!markupMsg.is(':visible')) {
                    adjustExpandedBorderHeight(markupMsg.show(), true);
                }
            }
        }
    }
    else {
        if (markupMsg.is(':visible')) {
            adjustExpandedBorderHeight(markupMsg.hide(), false);
        }
        // Hide markup.
        if (_snapController) {
            for (id in _otherChannelEvents) {
                if (typeof _otherChannelEvents[id] !== 'function') {
                    _snapController.staticCanvas().removeEvent(id);
                }
            }
            _snapController.staticCanvas().redraw();
        }
    }

};


/**
 * Remove any options from the create filter select control that are not
 * found in the given array of supported filter types. If none of the
 * select options are found in the given array, remove the entire filters
 * page from the page.
 * @param {Array} supportedFilters An array of filter type names. May be
 *                 undefined or an empty array.
 */
var removeUnsupportedFilterOptions = function (supportedFilters) {
    var nFiltersSupported = 0;

    if (supportedFilters && supportedFilters.length) {
        // Check each create filter option value against the
        // supportedFilters array. Remove those that are not found.
        // Maintain a count of the number that are found.
        // $('#create_filter_btn option.ov_filter_type').each(function () {
        //     var filterType = $(this).val();
        //     if ($.inArray(filterType, supportedFilters) >= 0) {
        //         nFiltersSupported += 1;
        //     }
        //     else {
        //         $(this).remove();
        //     }
        // });
    }

    if (nFiltersSupported === 0) {
        // No filters are supported, so remove the whole filters pane.
        $('#filters_pane').remove();
        _filterValidator = null;
    }
};


/**
 * Sets the nearRect and farRect properties of the given filter object
 * to initial default values.
 * @param {Object} An instance of objectvideo.ovready.minimumSizeFilter
 *                  or objectvideo.ovready.maximumSizeFilter.
 */
var setInitialFilterRects = function (filter) {
    filter.farRect.x = 0.01;
    filter.farRect.y = 0.01;
    filter.farRect.width = 0.01;
    filter.farRect.height = 0.0;

    filter.nearRect.x = 0.6;
    filter.nearRect.y = 0.4;
    filter.nearRect.width = 0.2;
    filter.nearRect.height = 0.3;
};

/**
 * Returns index of the filter object in _rule.eventDefinition.filters
 * whose type corresponds to the value of rowId, if any.
 * @param {String} rowId The id of row element in the filter_list table.
 * @return {Number} The index into _rule.eventDefinition.filters of the
 *                   filter object that corresponds to the value of rowId
 *                   or -1 if no such filter object is found.
 * @exception {Error} If rowId is an unexpected value.
 */
var getFilterIndexForRowId = function (rowId) {
    var filterIdx = -1;

    if (!Boolean(rowId) || (typeof rowId !== 'string')) {
        throw new Error('Invalid argument: rowId not specified');
    }

    if (_rule.eventDefinition.filters && (_rule.eventDefinition.filters.length > 0)) {
        $.each(_rule.eventDefinition.filters, function (i) {
            switch (rowId) {
                case 'minimum_size_filter':
                    if (this.filterType === filterTypes.MinimumSizeFilter) {
                        filterIdx = i;
                    }
                    break;
                case 'maximum_size_filter':
                    if (this.filterType === filterTypes.MaximumSizeFilter) {
                        filterIdx = i;
                    }
                    break;
                case 'size_change_filter':
                    if (this.filterType === filterTypes.SizeChangeFilter) {
                        filterIdx = i;
                    }
                    break;
                case 'shape_and_direction_filter':
                    if (this.filterType === filterTypes.ShapeAndDirectionFilter) {
                        filterIdx = i;
                    }
                    break;
                default:
                    throw new Error('Unexpected filter row id: ' + rowId.toString());
            }

            // Exit early from $.each if we have found the filter.
            return (filterIdx === -1);
        });
    }

    return filterIdx;
};


/**
 * Returns the filter object in _rule.eventDefinition.filters whose type
 * corresponds to the value of rowId, if any.
 * @param {String} rowId The id of row element in the filter_list table.
 * @return {Object} The filter object that corresponds to the value of
 *                   rowId or null if no such filter object is found.
 * @exception {Error} If rowId is an unexpected value.
 */
var getFilterForRowId = function (rowId) {
    var filter = null;
    var filterIdx = getFilterIndexForRowId(rowId);

    if (filterIdx >= 0) {
        filter = _rule.eventDefinition.filters[filterIdx];
    }

    return filter;
};


/**
 * Shows or hides the filter mode overlay and filter edit Cancel and Save buttons.
 */
var toggleFilterModeView = function () {
    var fxFadeDuration = 'slow';
    var fxSlideDuration = 'normal';
    var filtersKeyBuffer = 5;
    var markupMsg;

    if (_toolMode !== toolModeEnum.filter) {
        _toolMode = toolModeEnum.filter;
    }
    else {
        _toolMode = toolModeEnum.select;
    }

    if (_toolMode === toolModeEnum.filter) {
        // Disable and dim tool palette buttons.
        $('#tool_palette .toolbtn:not(#tool_select)').addClass('disabled');

        // Hide the rule overlay checkbox.
        $('#snapshot_actions_pane .showhide_container').slideUp(fxSlideDuration);

        // Display an overlay blocking all but the snapshot editing area.
        $('#filters_pane').fadeOut(fxFadeDuration, function () {
            $('#markup_pane').css({
                'z-index': 100,
                'position': 'absolute'
            });
            fadeInOverlay($('#filter_mode_overlay'), fxFadeDuration);

            // Show the filter drawing legend.
            $('#markup_pane').width($('#markup_pane').width() +
                _filtersKeyWidth + filtersKeyBuffer);
            $('#filters_drawing_key').show();
            _filtersKeyWidth = $('#filters_drawing_key').width();
        });

        // Show the filter edit caption
        $('#tool_palette').removeClass('reduced_padding');
        $('#snapshot_caption').show();

        // Show the Save and Cancel buttons for the filter shapes.
        $('#filter_markup_buttons_pane').show();
        //$('#filter_markup_buttons_pane div.btn').slideDown(fxSlideDuration);
        $('#filter_markup_buttons_pane div.btn').show();
    }
    else {
        // Hide the error message, if it's showing.
        markupMsg = $('#markup_error_message');
        if (markupMsg.is(':visible')) {
            markupMsg.slideUp('fast');
            adjustExpandedBorderHeight(markupMsg, false);
        }

        // Hide the filter drawing legend.
        $('#filters_drawing_key').hide();
        $('#markup_pane').width($('#markup_pane').width() -
            (_filtersKeyWidth + filtersKeyBuffer));

        // Hide the Save and Cancel buttons for the filter shapes.
        $('#filter_markup_buttons_pane div.btn').slideUp(fxSlideDuration, function () {
            $('#filter_markup_buttons_pane').hide();
        });

        // Hide the filter edit caption
        $('#snapshot_caption').hide();
        if (getRuleType(_rule) === 'tripwire') {
            $('#tool_palette').addClass('reduced_padding');
        }

        // Hide overlay.
        $('#filter_mode_overlay').fadeOut(fxFadeDuration, function () {
            $('#markup_pane').css({
                'z-index': 0,
                'position': 'static'
            });
            $('#filters_pane').fadeIn(fxFadeDuration, function () {
                $('#filters_pane').width($('#markup_pane').outerWidth());
            });
        });

        // Restore the rule overlay checkbox.
        $('#snapshot_actions_pane .showhide_container').slideDown(fxSlideDuration, function () {
            // slideDown will set the showhide_container's display
            // property to block, but we really want it to be inline.
            $(this).css('display', 'inline');
        });

        if ($('#expanded_markup_overlay').is(':visible')) {
            // Switch out of expanded snapshot mode.
            _snapController.toggleExpandedMarkupMode(false);
        }

        // Show and enable tool palette buttons.
        togglePaletteButtons((getRuleType(_rule) === 'fullframe'));
        updateToolPalette();
    }
};


/**
 * Enter filter edit mode.
 * @param {Object} filter The filter to be edited.
 */
var filterEditMode = function (filter) {
    var filterRow;

    if (!filter) {
        throw new Error('Invalid argument: filter');
    }

    switch (filter.filterType) {
        case filterTypes.ShapeAndDirectionFilter:
        case filterTypes.SizeChangeFilter:
            return;
            break;
        case filterTypes.MinimumSizeFilter:
            $("#blue_rect").text("人体尺寸");
            $("#red_rect").text("ATM机位置");
            break;
        case filterTypes.MaximumSizeFilter:
            $("#blue_rect").text("入门区域");
            $("#red_rect").text("地板区域");
            break;
        default:
            break;
    }

    _filterEditInfo = filter;

    // Show the filter markup.
    _snapController.staticCanvas().hide();
    _snapController.drawingCanvas().addFilter(filter);

    if (filter.filterType === filterTypes.MinimumSizeFilter) {
        filterRow = $('tr#minimum_size_filter');
    }
    else {
        filterRow = $('tr#maximum_size_filter');
    }
    $('#snapshot_caption').text($('a', filterRow).text());

    /*var humanWidth = parseInt(filter.nearRect.width * 352);
     var humanHeight = parseInt(parseInt(filter.nearRect.height * 288));
     $('#people').text(humanWidth + 'x' + humanHeight);*/

    // Filter edit mode for either minimum or maximum size filter.
    toggleFilterModeView();
};


/**
 * Indicates whether the given filter is valid.
 * @param {Object} filter A filter.
 * @return {Boolean} True if the filter is valid; false, otherwise.
 */
var isValidFilter = function (filter) {
    var errorMsg, msgElt;

    if (filter && filter.nearRect && filter.farRect) {
        // 验证远景矩形必须小于前景矩形
        /*if ((filter.farRect.width > filter.nearRect.width) &&
         (filter.farRect.height > filter.nearRect.height)) {
         errorMsg = getString('validationText.filterRectSizes');
         msgElt = $('#markup_error_message');
         if (!msgElt.is(':visible')) {
         msgElt.text(errorMsg).show();
         adjustExpandedBorderHeight(msgElt, true);
         }
         return false;
         }*/
    }
    return true;
};


/**
 * Adds data from the specified filter into the rule's eventDefinition.
 * @param {Object} filter A filter.
 */
var addFilterToRule = function (filter) {
    var filterIdx = -1;

    if (filter) {
        if (!_rule.eventDefinition.filters) {
            _rule.eventDefinition.filters = [];
        }
        // Find the existing filter, if any, being edited.
        $.each(_rule.eventDefinition.filters, function (i) {
            if (filter.filterType === this.filterType) {
                filterIdx = i;
                return false;
            }
        });
        if (filterIdx < 0) {
            // New filter. Add it to the rule's list.
            _rule.eventDefinition.filters.push(filter);
        }
        else {
            // Replace the filter that was being edited.
            _rule.eventDefinition.filters[filterIdx] = filter;
        }

        setDirty(true);
    }
};


/**
 * Handles a change event on the create filter control.
 * @param {Object} event The change event.
 */
var onFilterCreate = function (event) {
    var i;
    var val;
    var filter;
    var showRow = false;

    if (!$(this).hasClass('nonchoice')) {
        // Guard against IE bug that allows user to select disabled options.
        val = $.trim($(this).val());
        if (val && $('option[value="' + val + '"]', this).is(':not(:disabled)')) {
            // Verify that we do not already have this filter.
            if (_rule.eventDefinition.filters) {
                for (i = 0; i < _rule.eventDefinition.filters.length; i++) {
                    if (val === _rule.eventDefinition.filters[i].filterType) {
                        return false;
                    }
                }
            }

            switch (val) {
                case 'copy_existing':
                    showCopyFilterDialog();
                    break;
                case filterTypes.MinimumSizeFilter:
                    filter = objectvideo.ovready.minimumSizeFilter();
                    setInitialFilterRects(filter);
                    break;
                case filterTypes.MaximumSizeFilter:
                    filter = objectvideo.ovready.maximumSizeFilter();
                    setInitialFilterRects(filter);
                    break;
                case filterTypes.SizeChangeFilter:
                    filter = objectvideo.ovready.sizeChangeFilter();
                    addFilterToRule(filter);
                    showRow = true;
                    break;
                case filterTypes.ShapeAndDirectionFilter:
                    filter = objectvideo.ovready.shapeAndDirectionFilter();
                    addFilterToRule(filter);
                    showRow = true;
                    break;
            }

            if (showRow) {
                showFilterRow(filter);

                $('#filter_list tr').removeClass('accent_bkgnd');
                $('#filter_list_pane').show();
                $('#filter_list tr:visible:even').addClass('accent_bkgnd');
            }

            if (filter) {
                filterEditMode(filter);
            }
        }
    }

    // Reset the select control to its default selection.
    $('option', this).removeAttr('selected');
    $('option:first', this).attr('selected', 'selected');
};


/**
 * Handles a mouseover event on a filters table row by showing the filter
 * markup.
 * @param {Object} event The mouseover event.
 * @see onFilterRowHoverOut#
 */
var onFilterRowHoverOver = function (event) {
    var rowId;
    if (_toolMode !== toolModeEnum.filter) {
        rowId = $(this).ancestorRowId();
        if ((rowId === 'minimum_size_filter') || (rowId === 'maximum_size_filter')) {
            _snapController.staticCanvas().addFilter(getFilterForRowId(rowId));
        }
    }
};


/**
 * Handles a mouseout event on a filters table row by removing the filter
 * markup previously set by onFilterRowHoverOver.
 * @param {Object} event The mouseout event
 * @see onFilterRowHoverOver#
 */
var onFilterRowHoverOut = function (event) {
    var rowId;
    var filter;
    if (_toolMode !== toolModeEnum.filter) {
        rowId = $(this).ancestorRowId();
        if ((rowId === 'minimum_size_filter') || (rowId === 'maximum_size_filter')) {
            filter = getFilterForRowId(rowId);
            if (filter) {
                _snapController.staticCanvas().removeFilter(filter.typeOf);
            }
        }
    }
};


/**
 * Handles a mouse click event on a filter name by entering the edit mode
 * appropriate to the filter type clicked.
 * @param {Object} event The mouse click event.
 */
var onFilterClick = function (event) {
    var rowId;
    var filter;
    try {
        rowId = $(this).ancestorRowId();
        filter = getFilterForRowId(rowId);
        if (filter) {
            // Edit a copy of the filter.
            filterEditMode(filter.clone());
        }
    }
    catch (ex) {
        $.log('Error handling click on filter name');
        $.log(ex);
    }
    return false;
};


/**
 * Handles a mouse click event on a filter delete "button" by removing
 * the apppropriate filter data from _rule.eventDefinition.filters.
 * @param {Object} event The mouse click event.
 */
var onFilterDeleteClick = function (event) {
    var rowId;
    var filterIdx, filter;

    try {
        // Get the index of the filter then remove it from the rule's array.
        rowId = $(this).ancestorRowId();
        filterIdx = getFilterIndexForRowId(rowId);
        if (filterIdx >= 0) {
            filter = _rule.eventDefinition.filters[filterIdx];
            _rule.eventDefinition.filters.splice(filterIdx, 1);

            // Mark the rule as dirty.
            setDirty(true);
        }
        else {
            $.log('ERROR: Cannot delete filter ' + rowId + ' because it does not exist.');
        }

        // Remove the filter's markup, if appropriate.
        if ((filter.filterType === filterTypes.MaximumSizeFilter) ||
            (filter.filterType === filterTypes.MinimumSizeFilter)) {
            if (_snapController) {
                _snapController.staticCanvas().removeFilter(filter.typeOf);
            }
        }

        // Hide the indicated row, restripe the remaining rows.
        $('#' + rowId).fadeOut('normal', function () {
            // Restripe all visible rows. Explicitly exclude the row
            // just hid, because it may not immediately register
            // as not "visible."
            $('#filter_list tr').removeClass('accent_bkgnd');
            $('#filter_list tr:visible:not(#' + rowId + '):even').addClass('accent_bkgnd');
        });

        // Enable the filter's item in the select control.
        //$('#create_filter_btn option[value="' + filter.filterType + '"]').removeAttr('disabled', 'disabled');
    }
    catch (ex) {
        $.log('Error handling click on delete filter icon');
        $.log(ex);
    }

    return false;
};


/**
 * The Occupancy Threshold action is a little different from other actions in that its
 * details can also expand depending on user selection. Specifically, by default the
 * action does not specify a time period - but the user can change "at any time" to "for"
 * in which case we should expand the details to include time period fields.
 *
 * @param {Object} selectElement The dropdown element allowing the user to specify
 *                               "at any time" (no time fields displayed) or "for"
 *                               (display time fields).
 */
var onChangeOccupancyThresholdTime = function (selectElement) {
    var selection = selectElement.val();
    if (selection === 'anytime') {
        // Hide the time inputs.
        $('#occupancy_threshold_min_time_inputs').fadeOut('normal', function () {
            _detailsValidator.element($('#occupancy_threshold_duration_minutes'));
            _detailsValidator.element($('#occupancy_threshold_duration_seconds'));
            _detailsValidator.element($('#occupancy_group_checkbox'));
        });
    }
    else {
        // Show the time inputs.
        $('#occupancy_threshold_min_time_inputs').fadeIn();
    }
    setDirty(true);
};


/**
 * Handler for window resize event.
 */
var onWindowResize = function () {
    if (_snapController) {
        _snapController.resetExpandButton();
    }
};


/**
 * Toggles the label shown to the left of the action list (typically "Detect when" vs. "Collect"), depending
 * on whether the user has selected an event or threshold type action vs. a counting action.
 *
 * @param {Object} isDataAction If true, indicates the user has selected a data/counting action; if false
 *                              indicates the user has selected an event/threshold action
 */
var toggleDataAction = function (isDataAction) {
    if (isDataAction) {
        $('#event_type_selection_label').text(_dataActionLabel);
    }
    else {
        $('#event_type_selection_label').text(_eventActionLabel);
    }
};


/**
 * Although we're displaying counting actions as another AOI option, internally counting rules
 * are an entirely different type than other AOI rules, and are represented internally by
 * a different object. This function switches our internal rule object when the user
 * switches their selection between a counting action and a non-counting action.
 *
 * @param {Object} checkboxElement The checkbox representing the counting or non-counting action
 *                                 that the user has clicked.
 */
var toggleEventDefinition = function (checkboxElement) {
    var isCounting = (checkboxElement.hasClass('counting_aoi') && checkboxElement.is(':checked'));
    var isSimple = (checkboxElement.hasClass('simple_aoi') && checkboxElement.is(':checked'));
    var isFullFrame = $('#action_full_view').hasClass('active');

    // Change _rule's event definition
    if (isCounting) {
        if (_rule.eventDefinition.typeOf !== eventDefObjectTypes.countingAreaOfInterestEventDefinition) {
            _rule.eventDefinition = createEventDefFrom(_rule.eventDefinition, eventDefinitionTypes.CountingAreaOfInterestEventDefinition);
        }

        // Disable (and un-check) non-counting actions via displayAOIActions().
        // Note that it is not necessary to confirm unchecking other selections
        // here, since we disable other action options as soon as the user
        // selects a counting action.
        displayAOIActions(true, checkboxElement);
    }
    else if (isSimple) {
        if (_rule.eventDefinition.typeOf !== eventDefObjectTypes.simpleAreaOfInterestEventDefinition) {
            _rule.eventDefinition = createEventDefFrom(_rule.eventDefinition, eventDefinitionTypes.SimpleAreaOfInterestEventDefinition);
        }
        // Disable other actions, and un-check any existing
        // actions via displayAOIActions().
        displayAOIActions(true, checkboxElement);

    }
    else {
        if ((_rule.eventDefinition.typeOf !== eventDefObjectTypes.areaOfInterestEventDefinition) &&
            (_rule.eventDefinition.typeOf !== eventDefObjectTypes.fullFrameEventDefinition)) {
            _rule.eventDefinition = createEventDefFrom(_rule.eventDefinition,
                isFullFrame ? eventDefinitionTypes.FullFrameEventDefinition : eventDefinitionTypes.AreaOfInterestEventDefinition);
        }
        // Enable non-counting actions, and un-check any existing counting
        // actions via displayAOIActions().
        displayAOIActions(true, checkboxElement);
    }
};


/**
 * Binds event handlers related to the snapshot_frame element.
 * @return {Object} The ruleEdit module.
 * @see unbindMarkupEventHandlers
 */
var bindMarkupEventHandlers = function () {
    // Handle mouse events inside markup pane.
    $('#snapshot_frame').bind('mousedown', onMarkupMouseDown)
        .bind('mouseup', onMarkupMouseUp)
        .bind('click', onMarkupClick)
        .bind('dblclick', onMarkupDblClick)
        .bind('mousemove', onMarkupMouseMove);

    // Detect key presses on behalf of markup pane.
    $(document).bind('keypress', onKeyPress);

    // If IE's setCapture method is not available,
    // detect mouse events on behalf of markup pane.
    if (!$('#snapshot_frame')[0].setCapture) {
        $(window).bind('mouseup', onWindowMouseUp);
    }

    return objectvideo.ruleEdit;
};


/**
 * Unbinds event handlers related to the snapshot_frame element.
 * @return {Object} The ruleEdit module.
 * @see bindMarkupEventHandlers
 */
var unbindMarkupEventHandlers = function () {
    $('#snapshot_frame').unbind('mousedown', onMarkupMouseDown)
        .unbind('mouseup', onMarkupMouseUp)
        .unbind('click', onMarkupClick)
        .unbind('dblclick', onMarkupDblClick)
        .unbind('mousemove', onMarkupMouseMove);

    $(window).unbind('keypress', onKeyPress)
        .unbind('mouseup', onWindowMouseUp);

    return objectvideo.ruleEdit;
};

/**
 * Binds event handlers for elements on the rule_edit sub-page.
 * @return {Object} The ruleEdit module.
 * @see unbindEventHandlers
 */
var bindEventHandlers = function () {
    // Suppress form submission - forms are only used for
    // the jQuery validation plugin.
    $('form').submit(function () {
        return false;
    });

    //
    // Elements under rule_and_schedules_pane
    //

    // Prevent non-numeric values in numeric fields
    // (identified via the "numeric" class).
    $(':text.numeric').keypress(function (event) {
        // Allow control characters and digits.
        return ((event.which < keyCode.space) ||
        (event.which >= keyCode.zero && event.which <= keyCode.nine));
    });

    // Allow only '.', '-' and numeric characters in the
    // "numeric_float" class fields.
    $(':text.numeric_float').keypress(function (event) {
        // Allow control characters, digits, minus sign, and decimal
        // point, which may be either ',' or '.' depending on locale.
        return ((event.which < keyCode.space) ||
        (event.which >= keyCode.comma && event.which <= keyCode.period) ||
        (event.which >= keyCode.zero && event.which <= keyCode.nine));
    });

    // Mark the page as "dirty," meaning it contains unsaved
    // changes, if controls in the rule_and_schedules_pane change.
    $('#rule_and_schedules_pane *:checkbox').add('#rule_and_schedules_pane *:radio').click(function () {
        if (!$(this).hasClass('ov_locked')) {
            setDirty(true);
        }
    });

    $('#rule_and_schedules_pane *:text.numeric').keypress(function (event) {
        if ((event.which >= keyCode.zero && event.which <= keyCode.nine) ||
            (event.which === keyCode.backspace)) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
    });

    $('#rule_and_schedules_pane *:text.numeric_float').keypress(function (event) {
        if ((event.which >= keyCode.zero && event.which <= keyCode.nine) ||
            (event.which === keyCode.period) || (event.which === keyCode.backspace)) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
    });

    // Mark the page as "dirty" if the user types in the rule name text box.
    $('#rule_name').keyup(function (event) {
        // Ignore characters below ASCII 32, except for 8, which is backspace.
        if (event.which >= keyCode.space || event.which === keyCode.backspace) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
    });

    // Suppress activation controls associate with
    // this special category of validation error label.
    $('.group_invalid_message label.invalid').on('click', function () {
        return false;
    });

    // Mark the page as "dirty" if the user types in the alert text box.
    $('#alert_text').keyup(function (event) {
        // Ignore characters below ASCII 32, except for 8, which is backspace.
        if (event.which >= keyCode.space || event.which === keyCode.backspace) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
    });

    // Handle clicks on the Custom Response link.
    $('#custom_response_link').click(function () {
        $('#custom_response_dlg').dialog('open');
    });

    // Handle classification checkbox clicks.
    $('input.classification_checkbox').click(function () {
        var ruleType;

        disableClassificationOptions(this);

        if (_rule) {
            // Changes to classification will sometimes require
            // changes to action checkboxes, handled via displayAOIActions.
            ruleType = getRuleType(_rule);
            if (ruleType === 'aoi' || ruleType === 'fullframe') {
                displayAOIActions(true);
            }
        }
    });

    // Show/hide action sub-controls
    bindActionCheckboxClick();

    // Enable/disable Person when taken-away or left-behind is clicked.
    $('.not_people > input:checkbox').click(function () {
        if (!$(this).hasClass('ov_locked')) {
            disableClassificationOptions();
        }
    });

    // Switch the action label depending on whether the user has selected
    // a data or an event action.
    $('input.action_group_radio_button').click(function () {
        toggleDataAction($(this).hasClass('data_action'));
    });

    $('input.event_type_checkbox').click(function () {
        var checkbox = $(this);
        if (checkbox.is(':checked') && (!checkbox.hasClass('ov_locked'))) {
            toggleDataAction(false);
        }
    });

    // Switch event definition when clicking on certain actions.
    $('input.counting_aoi, input.aoi_action_checkbox, input.simple_aoi').click(function () {
        var checkbox = $(this);
        if (!checkbox.hasClass('ov_locked')) {
            toggleEventDefinition(checkbox);
        }
    });

    $('#occupancy_threshold_time').change(function () {
        onChangeOccupancyThresholdTime($(this));
    });

    // Save the max size radio edit field value.
    $('#filter_max_size_ratio').change(function () {
        assignSizeChangeFilter(this);
    });

    // Mark page as "dirty" when action select controls are changed.
    $('#rule_details_form select').change(function () {
        setDirty(true);
    });

    $('#plan').keyup(function (event) {
        // Ignore characters below ASCII 32, except for 8, which is backspace.
        if (event.which >= keyCode.space || event.which === keyCode.backspace) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
        $(this).val($(this).val().substring(0, 128));
    });

    $("#ruleLevel").click(function () {
        setDirty(true);
    });
    //
    // Elements under markup_pane
    //

    // Handle hover over tool palette buttons
    $('#tool_palette .toolbtn').not('.selected').not('.disabled').hover(
        function (event) {
            if (!$(this).is('.disabled')) {
                $(this).css('border-color', 'gray');
            }
        },
        function (event) {
            if (!$(this).is('.disabled')) {
                $(this).css('border-color', 'transparent');
            }
        });

    // Show/hide expand/shrink "button" based on window size.
    $(window).resize(onWindowResize);

    // Handle expand/shrink "button".
    $('#expand_snapshot').click(function () {
        if ($('#expanded_markup_overlay').is(':visible')) {
            // Shrink
            if (_snapController) {
                _snapController.toggleExpandedMarkupMode(false);
            }
            return true;
        }
        else if (!$(this).hasClass('disabled')) {
            // Expand
            if (_snapController) {
                $('#expanded_markup_overlay').height($(document).height());
                _snapController.toggleExpandedMarkupMode(true);
            }
            return true;
        }
        return false;
    });

    // Handle tool palette clicks.
    $('#tool_palette > .toolbtn').click(onToolPaletteClick);

    // Handle tool palette "action button" clicks.
    $('#action_full_view').click(onFullViewClick);
    $('#action_delete').click(onDeleteMarkupClick);
    $('#action_direction').click(onTripwireChangeDirectionClick);

    // Handle tool palette options button.
    $('#config_options').click(function () {
        var btn;

        if ($(this).hasClass('disabled')) {
            return;
        }

        // "Check" the appropriate radio button in the dialog.
        if (_rule.eventDefinition.planeType === objectvideo.ovready.planeTypes.Image) {
            btn = $('#plane_image');
        }
        else {
            btn = $('#plane_ground');
        }
        btn.attr('checked', 'checked');

        // Open the dialog.
        $('#options_dlg').dialog('open');

        // Check the radio button again. Setting the radio button
        // both before AND after opening the dialog is sometimes
        // necessary under IE for some reason.
        btn.attr('checked', 'checked');
    });

    // Handle Show/Hide Coverage button click.
    $('#showhide_btn').click(onMarkupCheckboxClick);

    // Handle click outside of markup pane when in
    // expanded markup mode.
    $('#markup_overlay_screen').click(function (event) {
        if (_snapController) {
            _snapController.toggleExpandedMarkupMode(false);
        }
    });

    // Handle filter markup Save and Cancel buttons.
    $('#filter_markup_buttons_pane .btn').click(function (event) {
        event.stopPropagation();
        toggleFilterModeView();

        if (_snapController) {
            _snapController.drawingCanvas().removeFilters().redraw();
            _snapController.staticCanvas().removeFilters().show();
        }
    });

    $('#save_filter_markup_btn').click(function (event) {
        if (isValidFilter(_filterEditInfo)) {
            addFilterToRule(_filterEditInfo);

            // Redraw filter table.
            _filterEditInfo = null;
            showRuleFilters();

        }
        else {
            event.stopPropagation();
        }
    });

    $('#cancel_filter_markup_btn').click(function (event) {
        // Cancel filter drawing mode and redraw filter table.
        _filterEditInfo = null;
        showRuleFilters();
    });

    // Mark the page as "dirty" if the user types in the max size filter box
    $('#filter_max_size_ratio').keyup(function (event) {
        // Ignore non-numerics, except period and comma (for Europe)
        // and the backspace key.
        if (event.which === keyCode.backspace ||
            event.which === keyCode.comma ||
            event.which === keyCode.period ||
            (event.which >= keyCode.zero && event.which <= keyCode.nine)) {
            setDirty(true);
        }
    }).change(function () {
        setDirty(true);
    });

    // Handle events on the markup pane itself.
    bindMarkupEventHandlers();

    //
    // Elements under filters_pane
    //

    // Handle create filter selection.
    //$('#create_filter_btn').change(onFilterCreate);

    // Set hover and click handlers for filter table row links.
    $('#filter_list tr').hover(onFilterRowHoverOver, onFilterRowHoverOut);
    $('#filter_list tr a').click(onFilterClick);

    // Handle delete filter icon/button.
    $('#filter_list tr input.btn_delete').click(onFilterDeleteClick);

    //
    // Elements under buttons_pane
    //

    // Handle Cancel button click.
    $('#cancel_btn').click(function (event) {
        event.stopPropagation();
        // Go back to rule management page
        window.location.href = "/rule/home.aspx?channelId=" + channelId;
    });

    // Handle Save button click.
    $('#save_btn').click(function (event) {
        event.stopPropagation();
        saveRule(function (data, isAjaxBegun) {
            alert(data.txt);
            if (data.result) {
                var channelId = $('#channelId').val();
                window.location.href = "/rule/home.aspx?channelId=" + channelId;
                isAjaxBegun = true;
            }
        });
    });

    return objectvideo.ruleEdit;
};

/**
 * Unbinds event handlers for elements on the rule_edit sub-page.
 * @return {Object} The ruleEdit module.
 * @see bindEventHandlers
 */
var unbindEventHandlers = function () {
    unbindMarkupEventHandlers();
    $(window).unbind('resize', onWindowResize);
    $('#save_btn').unbind();
    $('#cancel_btn').unbind();
    $('#showhide_btn').unbind();
    $('#action_full_view').unbind();
    $('#expand_snapshot').unbind();
    $('#markup_overlay_screen').unbind();
    $('#filter_markup_buttons_pane .btn').unbind();
    $('#loiter_checkbox').unbind();
    $('#rule_name').unbind();
    $('#alert_text').unbind();
    $('#custom_response_link').unbind();
    //$('#create_filter_btn').unbind();
    $('#filter_list tr').unbind();
    $('#filter_list tr a').unbind();
    $('input.classification_checkbox').unbind();
    $('.toolbtn').unbind();
    $('input.with_collapsing_details').unbind();
    $('input.numeric').unbind();
    $('input.numeric_float').unbind();
    $('.not_people > input:checkbox').unbind();
    $('.group_invalid_message label.invalid').off('click');
    return objectvideo.ruleEdit;
};

/**
 * Handler for navigator "event" indicating that
 * this sub-page is about to be unloaded.
 * @param {Object} reinvoker An object which may be used to re-invoke the
 *                  action causing this page to be unloaded.
 * @return {Boolean} True if the caller should proceed with unloading the
 *                    rule edit page; false, if the page should not be
 *                    unloaded at this time.
 */
var beforeUnload = function (reinvoker) {
    if (_isDirty) {
        _reinvoker = reinvoker;
        $('#confirm_exit_dlg').dialog('open');
        return false;
    }
    else {
        return true;
    }
};


/**
 * Handler for sub-page exit "event".
 * @return {Object} This ruleEdit module.
 */
var onUnload = function () {
    // Clear initialized flag, signalling that we should
    // ignore any callbacks on outstanding ajax requests.
    _isInitialized = false;
    _schedulesPane.close();

    if (_snapController) {
        _snapController.snapPlayer().pause();
    }

    unbindEventHandlers();

    _template = '';
    _ruleLink = '';
    _rule = null;
    _isCopy = false;
    _otherChannelEvents = {};
    _shapes = [[]];
    _analyticsCapabilities = null;
    _nMaxPoints = undefined;
    _toolMode = toolModeEnum.select;
    _curDirection = tripwireDirections.AnyDirection;
    _schedulesPane = null;
    _snapController = null;

    objectvideo.ruleEdit.ruleSelectDialog.destroy();
    $('#confirm_fullframe_dlg').dialog('destroy').remove();
    $('#confirm_fullframe_classification_dlg').dialog('destroy').remove();
    $('#confirm_exit_dlg').dialog('destroy').remove();
    $('#custom_response_dlg').dialog('destroy').remove();
    $('#options_dlg').dialog('destroy').remove();

    return objectvideo.ruleEdit;
};

/**
 * Retrieves channelAnalyticsCapabilities from the specified channel.
 * @param {String} channelId ID of the channel from which to get
 *                  channelAnalyticsCapabilities
 */
var loadAnalyticsCapabilities = function (channelId) {
    objectvideo.channelManager.getAnalyticsCapabilities(channelId,
        function (analyticsCapabilities) {
            var isFullFrameSupported, i;

            if (!_isInitialized) {
                return;
            }

            _analyticsCapabilities = analyticsCapabilities;
            _nMaxPoints = undefined;

            if (analyticsCapabilities) {
                // Remove any filters that are not supported.
                removeUnsupportedFilterOptions(analyticsCapabilities.supportedFilters);

                isFullFrameSupported = isEventSupported(eventDefinitionTypes.FullFrameEventDefinition);

                // Hide the polygon toolbar icon if AOIs are not supported.
                if (!(isEventSupported(eventDefinitionTypes.AreaOfInterestEventDefinition) ||
                    isEventSupported(eventDefinitionTypes.CountingAreaOfInterestEventDefinition) ||
                    isEventSupported(eventDefinitionTypes.SimpleAreaOfInterestEventDefinition))) {
                    $('#tool_polygon').hide();
                    onFullFrameChange(isFullFrameSupported, true);
                }

                // Hide the full frame toolbar icon if full frame is not supported.
                if (!isFullFrameSupported) {
                    $('#action_full_view').hide();
                }

                // Hide the alert text field if alert output is not supported.
                if (!analyticsCapabilities.supportsAlertOutput) {
                    $('#alert_text').hide();
                    $('.text_counter_message').hide();
                    $('#alert_text_label').hide();
                    $('#alert_response_label').show();
                }
                else if (analyticsCapabilities.supportedResponses &&
                    (analyticsCapabilities.supportedResponses.length > 0)) {
                    // Set _alertTextLimit to the shortest
                    // supported response length.
                    _alertTextLimit = analyticsCapabilities.supportedResponses[0].maxMessageLength;
                    for (i = 1; i < analyticsCapabilities.supportedResponses.length; i++) {
                        _alertTextLimit = Math.min(_alertTextLimit,
                            analyticsCapabilities.supportedResponses[i].maxMessageLength);
                    }
                    if (_alertTextLimit > 128) {
                        _alertTextLimit = 128
                    }
                    // Limit alert text box.
                    $('#alert_text').limitUtf8Input(_alertTextLimit, '#alert_text_counter');
                }
            }
        },
        $('#rule_edit_block'));
};


/**
 * Alters what options are displayed (in the event type list), depending on
 * whether the user is editing/creating a tripwire or a multiline tripwire
 * @param {Boolean} isMultiline True if the tripwire is multi-line, false
 *                   if it is single-line.
 */
var displayTripwireActions = function (isMultiline) {
    if (isMultiline) {
        $('#crosses_multiline_tripwire').fadeIn();
        $('#crosses_tripwire').fadeOut();
    }
    else {
        $('#crosses_tripwire').fadeIn();
        $('#crosses_multiline_tripwire').fadeOut();
    }
};


/**
 * Gets the duration value from the multi-line tripwire input text controls.
 * @return {Number} A duration value in seconds.
 */
var getMultiLineTripwireDuration = function () {
    var minutes = parseInt($('#crossing_duration_minutes').val(), 10);
    var seconds = parseInt($('#crossing_duration_seconds').val(), 10);
    return (minutes * 60.0) + seconds;
};


/**
 * Sets the minutes and seconds text input controls for a multi-line
 * tripwire to the specified duration.
 * @param {Number} duration A duration value in seconds.
 */
var setMultiLineTripwireDuration = function (duration) {
    var minutes = Math.floor(duration / 60.0);
    var seconds = Math.floor(duration % 60.0);
    $('#crossing_duration_minutes').val(minutes);
    $('#crossing_duration_seconds').val(seconds);
};


/**
 * Gets the multi-line tripwire line crossing order value from the
 * line crossing control.
 */
var getMultiLineCrossingOrder = function () {
    var val = $('#crossing_order').val();
    if (val === 'before') {
        return objectvideo.ovready.lineCrossingOrders.Before;
    }
    else if (val === 'before_or_after') {
        return objectvideo.ovready.lineCrossingOrders.BeforeOrAfter;
    }
    else {
        throw new Error('Unexpected state: crossing_order ' + val + ' is not recognized');
    }
};


/**
 * Sets the line crossing order controls for a multi-line tripwire.
 * @param {Object} lineCrossingOrder
 */
var setMultiLineCrossingOrder = function (lineCrossingOrder) {
    $('#crossing_order option').removeAttr('selected');
    if (lineCrossingOrder === objectvideo.ovready.lineCrossingOrders.Before) {
        $('#crossing_order option[value="before"]').attr('selected', 'selected');
    }
    else if (lineCrossingOrder === objectvideo.ovready.lineCrossingOrders.BeforeOrAfter) {
        $('#crossing_order option[value="before_or_after"]').attr('selected', 'selected');
    }
};


/**
 * Gets the duration value from an area action's minutes and seconds
 * text input controls.
 * @param {Object} ancestor A jQuery-wrapped element that is the parent or
 *                  other ancestor of the input controls from which
 *                  duration will be retrieved.
 * @return {Number} A duration value in seconds.
 */
var getAreaActionDuration = function (ancestor) {
    var secondsInput, minutes, seconds;

    if ((!ancestor) || (ancestor.children().length === 0)) {
        throw new Error('Invalid argument: ancestor');
    }

    minutes = parseInt($('input.duration_minutes', ancestor).val(), 10);

    secondsInput = $('input.duration_seconds', ancestor);
    if (secondsInput.length !== 0) {
        seconds = parseInt(secondsInput.val(), 10);
    }
    else {
        secondsInput = $('input.duration_seconds_float', ancestor);
        seconds = parseFloat(secondsInput.val());
    }

    return (minutes * 60.0) + seconds;
};


/**
 * Given an action (or more specifically the element containing the action checkbox, details, etc.)
 * that contains a comparator dropdown (i.e. "at least," "exactly," "no more than"), return the
 * selected value for the comparator.
 *
 * @param {Object} ancestor The element containing the action checkbox, details, fields, etc.
 */
var getAreaActionComparator = function (ancestor) {
    if ((!ancestor) || (ancestor.children().length === 0)) {
        throw new Error('Invalid argument: ancestor');
    }

    return ($('.comparator', ancestor).val());
};


/**
 * Sets the minutes and seconds text input controls for
 * an AOI action to the specified duration.
 * @param {Object} ancestor A jQuery-wrapped element that is the parent or
 *                  other ancestor of the input controls to be set.
 * @param {Number} duration A duration value in seconds.
 */
var setAreaActionDuration = function (ancestor, duration) {
    var minutes = Math.floor(duration / 60.0);
    var seconds = duration % 60.0;
    $('input.duration_minutes', ancestor).val(minutes);
    $('input.duration_seconds', ancestor).val(Math.floor(seconds));
    $('input.duration_seconds_float', ancestor).val(seconds);
};


/**
 * Given an action (or more specifically the element containing the action checkbox, details, etc.)
 * that contains a comparator dropdown (i.e. "at least," "exactly," "no more than"), set the
 * value for the comparator.
 *
 * @param {Object} ancestor The element containing the action checkbox, details, fields, etc.
 * @param {String} comparatorValue The value to set for the comparator field
 */
var setAreaActionComparator = function (ancestor, comparatorValue) {
    $('.comparator', ancestor).val(comparatorValue);
};


/**
 * Sets the checkbox for the given classification and hides
 * incompatible classification checkbox(es), if any.
 * @param {String} classification Classification type.
 */
var initClassificationControl = function (classification) {
    var id = CLASSIFICATION_TO_ID_HASH[classification];
    var checkbox = $('#' + id).find(':checkbox');
    checkbox.attr('checked', 'checked');
    disableClassificationOptions(checkbox[0]);
};


/**
 * Sets the action type checkbox and related controls,
 * if any, for the specified action.
 * @param {Object} action An area action object from a rule's event defintion.
 */
var initActionControl = function (action) {
    var id = ACTION_TO_ID_HASH[action.actionName];
    var actionBlock = $('#' + id);
    var checkbox = $('.action_group_radio_button, .event_type_checkbox', actionBlock);
    var groupElement, groupCheckbox;

    // Check checkbox associated with the action.
    checkbox.attr('checked', 'checked');

    // if we just checked a radio button within a group, expand the group
    // (and check the top-level checkbox)
    if (checkbox.hasClass('action_group_radio_button')) {
        groupElement = checkbox.closest('.action_group_container');
        groupCheckbox = $('input.action_group_checkbox', groupElement);
        groupCheckbox.attr('checked', 'checked');
        onActionGroupClick(groupCheckbox);
    }

    // Toggle the action label appropriately depending on what was checked.
    toggleDataAction(checkbox.hasClass('data_action'));

    // Show/hide other controls as appropriate.
    disableClassificationOptions();
    onActionWithDetailsClick(checkbox[0]);

    if (action.duration !== undefined && action.duration !== null && action.duration > 0) {
        // Set duration fields.
        setAreaActionDuration(actionBlock, action.duration);

        // If there is a duration, and it's specifically an occupancy
        // threshold rule, then the "at any time"/"for at least" dropdown
        // must be set to "for at least."
        // TODO: is there a more generalized way of handling this case (both detecting and setting)?
        if (action.actionName === 'OccupancyThresholdAreaAction') {
            onChangeOccupancyThresholdTime($('#occupancy_threshold_time').val('atleast'));
        }
    }

    // NOTE: Support for action-specific fields like count
    // and comparator should be added here.
    // show comparator, if there was one
    if (action.comparator !== undefined) {
        setAreaActionComparator(actionBlock, action.comparator);
    }
    if (action.level !== undefined) {
        setAreaActionComparator(actionBlock, action.level);
    }

    if (action.count !== undefined) {
        $('input.count', actionBlock).val(action.count);
    }
};


/**
 * Shows/hides controls as appropriate to the specified basic rule type.
 * @param {String} ruleType Basic rule type. One of 'tripwire', 'aoi',
 *                  or 'fullframe'.
 * @param {Boolean} isMultiline If ruleType is 'tripwire', true indicates
 *                   a multi-line tripwire, false indicates a regular
 *                   tripwire. This parameter is ignored if ruleType is
 *                   not 'tripwire'.
 * @exception {Error} If ruleType is an unexpected value.
 * @see getRuleType
 */
var setControlsForRuleType = function (ruleType, isMultiline) {
    var eventTypeName = null;

    configureToolPalette(ruleType);

    displayPermittedActions(ruleType);

    switch (ruleType) {
        case 'tripwire':
            eventTypeName = eventDefinitionTypes.TripwireEventDefinition;
            displayTripwireActions(isMultiline);
            break;

        case 'aoi':
            eventTypeName = 'AreaOfInterestEventDefinition';
            displayAOIActions(true);
            break;

        case 'fullframe':
            eventTypeName = eventDefinitionTypes.FullFrameEventDefinition;
            displayAOIActions(true);
            break;

        case 'tamper':
            throw new Error('Camera tamper rule type is not supported.');

        default:
            throw new Error('Invalid argument: ruleType');
    }

    if (eventTypeName) {
        displayClassificationOptions(eventTypeName, true);
    }
};



/**
 * Displays the filter table row corresponding to the specified filter and,
 * if necessary, initializes control fields within the row.
 * @param {Object} filter A filter object.
 * @return {Object} The affected table row as a jQuery wrapped set.
 */
var showFilterRow = function (filter) {
    var ratioStr;

    // Disabled specified filter option in create filter control.
    // Note: We set the disabled attribute in a timer callback function
    // because setting it directly from this method will have no effect
    // if this method is invoked while handling a change event on the
    // select element.
    //setTimeout(function () {
    //$('#create_filter_btn option[value="' + filter.filterType + '"]').prop('disabled', true);
    //}, 1);

    switch (filter.typeOf) {
        case 'maximumSizeFilter':
            return $('#maximum_size_filter').show();

        case 'minimumSizeFilter':
            return $('#minimum_size_filter').show();

        case 'sizeChangeFilter':
            if (filter.maxSizeChangeRatio) {
                ratioStr = filter.maxSizeChangeRatio.toString();
                if (ratioStr.indexOf('.') === -1 && ratioStr.indexOf(',') === -1) {
                    // Add a decimal point
                    ratioStr = filter.maxSizeChangeRatio.toFixed(1);
                }
            }
            else {
                ratioStr = (1.5).toFixed(1);
            }
            $('#filter_max_size_ratio').val(ratioStr);
            return $('#size_change_filter').show();

        case 'shapeAndDirectionFilter':
            return $('#shape_and_direction_filter').show();

        default:
            $.log('ERROR: Uknown filter type "' + filter.typeOf + '"');
            return $([]);
    }
};


/**
 * Shows each rule in the filter_list table that matches a filter
 * object in the _rule.eventDefinition.filters list. Hides
 * any filter not in that list.
 */
var showRuleFilters = function () {
    //$('#create_filter_btn option').removeAttr('disabled');
    $('#filter_list tr').removeClass('accent_bkgnd');

    // Hide all of the filter rows.
    $('#filter_list tr').hide();

    if (_rule.eventDefinition.filters && (_rule.eventDefinition.filters.length > 0)) {
        $.each(_rule.eventDefinition.filters, function () {
            // Show each row that matches one of the rule's filters.
            // Add the temporary 'becoming_visible' class for later reference.
            var row = showFilterRow(this);
            row.addClass('becoming_visible');
        });

        // Add accent_bkgnd class to the even-numbered rows we just
        // made visible, then get rid of the temporary class.
        $('#filter_list tr.becoming_visible:even').addClass('accent_bkgnd');
        $('#filter_list tr').removeClass('becoming_visible');

        $('#filter_list_pane').show();
    }
    else {
        // The rule has no filters, so hide the entire pane.
        $('#filter_list_pane').hide();
    }

};


/**
 * Returns true if setRule has been called with a valid rule link argument;
 * false, otherwise.
 * @return {Boolean} True if _ruleLink is set; false, otherwise.
 * @see setRule
 */
var isRuleSet = function () {
    return Boolean(_ruleLink);
};


/**
 * Populates the page based on the _template value.
 * @exception {Error} If _template is not initialized.
 */
var initPageFromTemplate = function () {
    _viewId = $('viewId').val();
    _template = $('template').val();
    if ((_template === undefined) || (_template === null) ||
        (typeof _template !== 'string') || (_template === 'plain_tamper')) {
        throw new Error('Unexpeted state error: Template setting is invalid.');
    }

    _rule = objectvideo.ovready.rule();
    _rule.schedule = objectvideo.ovready.recurringWeeklySchedule();

    switch (_template) {
        case 'plain_tripwire':
            _rule.eventDefinition = objectvideo.ovready.tripwireEventDefinition();
            setControlsForRuleType('tripwire');
            break;

        case 'plain_aoi':
            if (isEventSupported(eventDefinitionTypes.CountingAreaOfInterestEventDefinition)) {
                _rule.eventDefinition = objectvideo.ovready.countingAreaOfInterestEventDefinition();
                setControlsForRuleType('aoi');
            }
            else if (isEventSupported(eventDefinitionTypes.AreaOfInterestEventDefinition)) {
                _rule.eventDefinition = objectvideo.ovready.areaOfInterestEventDefinition();
                setControlsForRuleType('aoi');
            }
            else if (isEventSupported(eventDefinitionTypes.SimpleAreaOfInterestEventDefinition)) {
                _rule.eventDefinition = objectvideo.ovready.simpleAreaOfInterestEventDefinition();
                setControlsForRuleType('aoi');
            }
            else if (isEventSupported(eventDefinitionTypes.FullFrameEventDefinition)) {
                _rule.eventDefinition = objectvideo.ovready.fullFrameEventDefinition();
                setControlsForRuleType('fullframe');
            }
            break;

        default:
            // TODO: Assume _template is the name of a template file
            // 1. Retrieve template file from the server, parse it to populate the page.
            // 2. Set _rule.eventDefinition to a new object of the appropriate type.
            // 3. Call setControlsForRuleType with 'tripwire' or 'aoi' argument.
            break;
    }

    updateToolPalette();
};


/**
 * Populates the page with data from the given XML document.
 * @param {Object} xml The rule XML document.
 */
var initPageFromRuleJSON = function (json) {
    var isMultiline = false;
    var ruleType;
    var id;

    try {
        // Parse the XML response
        _rule = objectvideo.ovready.ruleFactoryJSON(json);
        if (_rule) {
            if (_isCopy) {
                // We will be editing a copy of the rule, not the original.
                // Blank the ID, change the name and ensure that the view
                // ID is correct.
                _rule.id = '';
                id = '_'; // Use '_' as event key for new rule.

                if (_rule.name) {
                    // Prefix "Copy of " to the rule name.
                    _rule.name = getString('copyOf.format', _rule.name).substring(0, _textLimit);
                }

                if (_viewId) {
                    _rule.viewInfoItem = objectvideo.ovready.viewInfo();
                    _rule.viewInfoItem.id = _viewId;
                }
            }
            else {
                id = _rule.id;
            } ruleType = getRuleType(_rule);
            // Show/hide event type controls based on basic rule type.
            isMultiline = Boolean(_rule.eventDefinition) &&
                (_rule.eventDefinition.typeOf === eventDefObjectTypes.multiLineTripwireEventDefinition);
            setControlsForRuleType(ruleType, isMultiline);

            if (_rule.eventDefinition) {
                // Send rule markup information to markup component.
                if (_snapController) {
                    _snapController.staticCanvas().addEvent(id, _rule.eventDefinition);
                    _snapController.staticCanvas().setEventHighlight(id);
                    _snapController.staticCanvas().setSelection((getRuleType(_rule) !== 'fullframe'), 0);
                    _snapController.staticCanvas().redraw();
                }

                // Set classification.
                //                if (_rule.eventDefinition.classificationList) {
                //                    $.each(_rule.eventDefinition.classificationList, function () {
                //                        initClassificationControl(this);
                //                    });
                //                }
                //                else if (_rule.eventDefinition.classification) {
                //                    initClassificationControl(_rule.eventDefinition.classification);
                //                }

                //                 Set action checkboxes and related controls.
                //                if (_rule.eventDefinition.actions) {
                //                    $.each(_rule.eventDefinition.actions, function () {
                //                        initActionControl(this);
                //                    });
                //                }
                //                else if (_rule.eventDefinition.action) {
                //                    initActionControl(_rule.eventDefinition.action);
                //                }

                // Show filters.
                showRuleFilters();

                // Set eventDefinition-specific fields from multi-line tripwire.
                //   - duration
                if (_rule.eventDefinition.duration !== undefined) {
                    setMultiLineTripwireDuration(_rule.eventDefinition.duration);
                }
                //   - line crossing order
                if (_rule.eventDefinition.lineCrossingOrder !== undefined) {
                    setMultiLineCrossingOrder(_rule.eventDefinition.lineCrossingOrder);
                }
            }

            updateToolPalette();

            //            if (ruleType === 'aoi' || ruleType === 'fullframe') {
            //                displayAOIActions(true);
            //            }

            // Finally, make sure we flag the page as clean.
            //            setDirty(_isCopy);
        }
    }
    catch (ex) {
        $.log('Error attempting to populate page from rule XML.');
        if (ex.stack) {
            $.log(ex);
        }
    }
};


/**
 * Asynchronously loads the rule specified by _ruleLink, then loads the
 * rule data into the page by calling initPageFromRule.
 * @exception {Error} If _ruleLink does not specifiy a non-null,
 *                     non-empty string.
 */
var getRuleJSON = function () {
    var ruleId = $('#ruleid').text();
    var overlay;
    overlay = $('#rule_edit_block');
    overlay.addBlockOverlay();
    $.ajax({
        url: '/drawRuleDetail',
        data: { 'ruleId': ruleId },
        success: initPageFromRuleJSON,
        error: function (xhr, status, ex) {
            alert(status);
        },
        complete: function () {
            if (overlay) {
                overlay.removeBlockOverlay();
            }
        }
    });
};


/**
 * Initiailzes the dialog boxes used by this page.
 * Note that the dialogs created by this method are not intially opened/displayed.
 */
var initDialogs = function () {
    var dlgButtons = {};

    //
    // Confirm exit dialog
    //

    // Create Yes and No buttons for the exit confirmation dialog.
    // "No"
    dlgButtons[getString('noButtonLabel')] = function () {
        // If the user says no, close the dialog.
        $(this).dialog('close');
        _reinvoker = null;
    };
    // "Yes"
    dlgButtons[getString('yesButtonLabel')] = function () {
        var reinvokerObj = _reinvoker;
        _reinvoker = null;

        // If the user says yes, close the dialog, then reinvoke
        // the navigation function that triggered this dialog.
        $(this).dialog('close');
        _isDirty = false;
        if (reinvokerObj && reinvokerObj.reinvoke) {
            reinvokerObj.reinvoke();
        }
    };

    // Create the exit confirmation dialog.
    $('#confirm_exit_dlg').dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: dlgButtons
    });

    // Assign unique ids to button elements (for automated testing)
    assignDialogButtonIds('confirm_exit_dlg');


    //
    // Confirm full frame dialog
    //

    // Create Yes and No buttons for the full frame confirmation dialog.
    dlgButtons = {};
    // "No"
    dlgButtons[getString('noButtonLabel')] = function () {
        // If the user says no, close the dialog.
        $(this).dialog('close');
    };
    // "Yes"
    dlgButtons[getString('yesButtonLabel')] = function () {
        var isActive = $('#action_full_view').hasClass('active');
        $(this).dialog('close');

        // If the user confirms, call onFullFrameChange() with force set to true.
        onFullFrameChange(isActive, true);
    };

    // Create the Full Frame confirmation dialog.
    $('#confirm_fullframe_dlg').dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: dlgButtons,
        close: function () {
            // Uncheck the full frame box, regardless of how the close occurred.
            $('#action_full_view').removeClass('active');
        }
    });

    // Assign unique ids to button elements (for automated testing)
    assignDialogButtonIds('confirm_fullframe_dlg');


    //
    // Confirm full-frame classification dialog
    //

    // Create the classification/full-frame confirmation dialog.
    dlgButtons = {};
    // "No"
    dlgButtons[getString('noButtonLabel')] = function () {
        // If the user says no, close the dialog.
        $(this).dialog('close');
    };
    // "Yes"
    dlgButtons[getString('yesButtonLabel')] = function () {
        var isActive = $('#action_full_view').hasClass('active');
        $(this).dialog('close');

        // If the user confirms, call onFullFrameChange() with force set to true.
        onFullFrameChange(isActive, true);
    };

    $('#confirm_fullframe_classification_dlg').dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: dlgButtons,
        close: function () {
            // Uncheck the full frame box, regardless of how the close occurred.
            $('#action_full_view').removeClass('active');
        }
    });

    assignDialogButtonIds('confirm_fullframe_classification_dlg');

    //
    // Options dialog
    //

    // Create the options dialog. Note that we put the OK button first
    // because in this case, keeping, not discarding, the user's selection
    // is the "safe" choice.
    dlgButtons = {};

    // "OK"
    dlgButtons[getString('okButtonLabel')] = function () {
        // Get the "checked" radio button.
        var checkedBtnVal = $('#options_dlg input:radio:checked').val();

        // Close the dialog.
        $(this).dialog('close');

        // Set the rule's planeType.
        if (checkedBtnVal === 'image') {
            _rule.eventDefinition.planeType = objectvideo.ovready.planeTypes.Image;
            setDirty(true);
        }
        else if (checkedBtnVal === 'ground') {
            _rule.eventDefinition.planeType = objectvideo.ovready.planeTypes.Ground;
            setDirty(true);
        }
        else {
            $.log('ERROR: AOI Options dialog did not have a "checked" radio button for plane type.');
        }
    };

    // "Cancel"
    dlgButtons[getString('cancelButtonLabel')] = function () {
        // Close the dialog.
        $(this).dialog('close');
    };

    $('#options_dlg').dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: dlgButtons
    });

    // Assign unique ids to the dialog's button elements.
    assignDialogButtonIds('options_dlg');

    // Initialize the Rule Select dialog.
    objectvideo.ruleEdit.ruleSelectDialog.init();


    //
    // Custom Response Fields dialog
    //

    // Create the Custom Response Fields dialog. Note that we put the Save button first
    // because in this case, keeping, not discarding, the user's input
    // is the "safe" choice.
    dlgButtons = {};

    // "Okay"
    dlgButtons[getString('okButtonLabel')] = function () {
        // Push all rows in the custom response field dialog box to _rule object.
        saved = (setResponseFields());
        if (saved) {
            $(this).dialog('close');
        }
    };

    // "Cancel"
    dlgButtons[getString('cancelButtonLabel')] = function () {
        // Close the dialog.
        $(this).dialog('close');
    };

    $('#custom_response_dlg').dialog({
        autoOpen: false,
        resizable: true,
        modal: true,
        width: 580,
        minHeight: 225,
        buttons: dlgButtons,
        open: function () {
            // Load the custom response field data if any
            if (_rule.responseDefinition) {
                loadResponseFields();
            }
            else {
                addEmptyRespRow();
            }
            // Add an event handler to the ad row link.
            addResponseFieldEventHandler();
        },
        close: function () {
            // Remove all custom response field rows, and unbind event handlers.
            clearResponseFields();
        }
    });

    // Assign unique ids to the dialog's button elements.
    //assignDialogButtonIds('#custom_response_dlg');
};


/**
 * Custom Response Field Dialog box
 * Load custom response field details, add a row for each
 * custom response field in the array
 */
var loadResponseFields = function () {
    var respDef = _rule.responseDefinition;
    if (respDef.customResponseFields.length > 0) {
        $.each(respDef.customResponseFields, function (i, customResponseField) {
            addRespRow(customResponseField, i);
        });
    }
    else {
        // If no custom response fields exist add an empty row.
        addEmptyRespRow();
    }

};

/**
 * Custom Response Field Dialog box
 * For each response field in the array add a row in the dialog box
 * fill in the values for each field and add event handlers and validation
 * for the new rows
 * @param {Object} respField customResonseField returned with the get rule ajax call
 * @param {Object} i location of customResponse Field in the array
 */
var addRespRow = function (respField, i) {
    var maxRows, currentRows;

    // Make a copy of the temp row and give it a unique id.
    var newField = $('#custom_response_row').clone(true);
    $(newField).attr('id', 'custom_response_row' + _customRespRowCount);
    _customRespRowCount += 1;

    // Fill in the values for each input field.
    $('input.custom_response_key', newField).attr('value', respField.key);
    $('input.custom_response_value', newField).attr('value', respField.value);
    $(newField).insertBefore('#custom_response_row');

    // Add event handlers and validation for the new row.
    addRowEventHandlers(newField);
    maxRows = (addResponseFieldValidation(newField));
    currentRows = ($('tr.custom_response_row_class:not(#custom_response_row)').length);
    $(newField).show();
    if (maxRows && currentRows >= maxRows) {
        $('#add_rows').hide();
    }
    else {
        $('#add_rows').show();
    }
};


/**
 * Custom Response Field Dialog box
 * If no response fields yet add an empty row
 */
var addEmptyRespRow = function () {
    var newField = $('#custom_response_row').clone(true);
    $(newField).attr('id', 'custom_response_row' + _customRespRowCount);
    _customRespRowCount += 1;
    $(newField).insertBefore('#custom_response_row');

    // Add event handlers and validation to the new row.
    addRowEventHandlers(newField);
    var maxRows = (addResponseFieldValidation(newField));
    var currentRows = ($('tr.custom_response_row_class:not(#custom_response_row)').length);
    $(newField).show();
    if (maxRows && currentRows >= maxRows) {
        $('#add_rows').hide();
    }
    else {
        $('#add_rows').show();
    }
};


/**
 * Custom Response Field Dialog box
 * Clear the customResponseFields array and add a new
 * custom Response Field for each valid row
 */
var setResponseFields = function () {
    var respDef;

    if ($('#custom_response_fields_form').valid()) {
        if (!_rule.responseDefinition) {
            _rule.responseDefinition = objectvideo.ovready.simpleMessageResponse();
        }
        respDef = _rule.responseDefinition;
        respDef.customResponseFields = [];
        $('tr.custom_response_row_class:not(#custom_response_row)').each(function () {
            var responseRow = objectvideo.ovready.customResponseField();
            responseRow.key = $('input.custom_response_key', this).val();
            responseRow.value = $('input.custom_response_value', this).val();
            respDef.customResponseFields.push(responseRow);
        });

        // Set the rule dirty so the new response definition will be saved.
        setDirty(true);
        return true;
    }
    else {
        return false;
    }
};


/**
 * Custom Response Field Dialog box
 * On close remove the custom response rows and unbind the event
 * handlers.  They will be added next time the dialog box is opened
 */
var clearResponseFields = function () {
    _customRespRowCount = 0;
    $('tr.custom_response_row_class:not(#custom_response_row)').remove();
    $('#add_rows').unbind();
};


/**
 * Custom Response Field Dialog box
 * Add an event handler for the add rows link
 * which will add an empty row
 */
var addResponseFieldEventHandler = function () {
    $('#add_rows').click(function () {
        addEmptyRespRow();
    });
};


/**
 * Custom Response Field Dialog box
 * Add event handler for the delete row icon for row
 * @param {Object} field the row object being modified
 */
var addRowEventHandlers = function (field) {
    $('input.custom_response_delete').click(function () {
        var selectedRow;
        $(this).addClass('selected');
        selectedRow = $('.selected').parents('tr').attr('id');
        $('#' + selectedRow).remove();
        $(this).removeClass('selected');
        $('#add_rows').show();
    });
};


/**
 * Custom Response Field Dialog box
 * Add validation rules to the input fields in the dialog box
 * @param {Object} field the row object being modified
 */
var addResponseFieldValidation = function (field) {
    var numFields = _analyticsCapabilities.supportedResponses[0].maxCustomResponseFields;
    var keyLength = _analyticsCapabilities.supportedResponses[0].maxCustomResponseKeyLength;
    var valueLength = _analyticsCapabilities.supportedResponses[0].maxCustomResponseValueLength;
    var tempID = $(field).attr('id');

    $('input.custom_response_key', field).attr('name', 'custom_response_key' + tempID).rules('add', {
        required: true,
        maxlengthBytes: keyLength
    });
    $('input.custom_response_value', field).attr('name', 'custom_response_value' + tempID).rules('add', {
        required: true,
        maxlengthBytes: valueLength
    });
    return numFields;
};


/**
 * Sets up rules and other options for the $.validation plugin.
 */
var initValidation = function () {
    // Helper function for duration class rules
    function isAssociatedCheckboxChecked(element) {
        var container, associate;
        if (!$(element).is(':visible')) {
            return false;
        }

        container = $(element).closest('.validation_group');
        if (container.length === 0) {
            return false;
        }
        else {
            // Is the validation_master checkbox control checked?
            if (container.find('input.validation_master:visible:enabled:checked').length > 0) {
                // Yes, master checkbox is checked.
                // Does it have an associated, secondary control?
                associate = container.find('input.validation_associate');
                if (associate.length > 0) {
                    // Yes, so return true only if the associated control is also checked.
                    return associate.is(':visible:enabled:checked');
                }
                else {
                    // No, but the master checkbox is checked, so return true.
                    return true;
                }
            }
            else {
                return false;
            }
        }
    }

    // Add custom validation message similar to built-in range,
    // but which knows to treat hidden fields as valid.
    $.validator.addMethod('associatedRange',
        function associatedRange(value, element, params) {
            return this.optional(element) || (!isAssociatedCheckboxChecked(element)) ||
                (value >= params[0] && value <= params[1]);
        }, $.validator.messages.range);

    // Add custom validation method totalTimeRange.
    $.validator.addMethod('totalTimeRange',
        function totalTimeRange(value, element, params) {
            var associate;
            var container = $(element).closest('.validation_group');
            var timeInputs;

            // Helper function
            function isTotalSecondsValid() {
                var totalSeconds = 0, totalMinutes = 0;
                val = $('input.duration_seconds', container).val();
                if (val) {
                    totalSeconds = parseInt(val, 10);
                }
                else {
                    val = $('input.duration_seconds_float', container).val();
                    if (val) {
                        totalSeconds = parseFloat(val);
                    }
                }
                if (isNaN(totalSeconds)) {
                    totalSeconds = 0;
                }

                val = $('input.duration_minutes', container).val() || '0';
                if (val) {
                    totalMinutes = parseInt(val, 10);
                    if (isNaN(totalMinutes)) {
                        totalMinutes = 0;
                    }
                }
                totalSeconds += (60 * totalMinutes);
                return (totalSeconds >= params[0]) && (totalSeconds <= params[1]);
            }

            if (container.find('input.validation_master').is(':visible:enabled:checked')) {
                // The target element is a checked checkbox, possibly with
                // a secondary, associated radio button, and associated
                // duration inputs. Validate the group as a whole, rather
                // than the element itself.
                associate = container.find('input.validation_associate');
                if ((associate.length === 0) || associate.is(':visible:enabled:checked')) {
                    // If the duration input fields are visible and enabled,
                    // determine whether they are valid. Otherwise, just return true.
                    timeInputs = container.find('input.duration_minutes').add(container.find('input.duration_seconds')).add(container.find('input.duration_seconds_float'));
                    if (timeInputs.is(':visible:enabled')) {
                        return isTotalSecondsValid();
                    }
                    else {
                        return true;
                    }
                }
            }
            else if ($('select.validation_master', container).is(':visible:enabled')) {
                // The target element is a select control.
                // Validate the associated duration inputs rather
                // than the element itself.
                return isTotalSecondsValid();
            }

            return true;
        });

    // Add duration class rules.
    $.validator.addClassRules({
        duration_seconds: {
            required: isAssociatedCheckboxChecked,
            digits: true,
            associatedRange: [0, 59]
        },
        duration_seconds_float: {
            required: isAssociatedCheckboxChecked,
            number: true,
            associatedRange: [0.0, 59.999]
        },
        duration_minutes: {
            required: isAssociatedCheckboxChecked,
            digits: true,
            associatedRange: [0, 60]
        },
        count: {
            required: isAssociatedCheckboxChecked,
            digits: true
        }
    });

    // Set validation behavior for filter_max_size_ratio_form
    if ($('#filter_max_size_ratio_form').length !== 0) {
        _filterValidator = $('#filter_max_size_ratio_form').validate({
            rules: {
                'filter_max_size_ratio': {
                    required: true,
                    range: [1.5, 100]
                }
            },
            onkeyup: false,
            errorContainer: '#filter_max_size_ratio_error',
            errorLabelContainer: '#filter_max_size_ratio_error'
        });
    }

    // Add validation to the Custom Response Field Dialog box.
    // We add the actual validation rules later, when the dialog box is opened.
    $('#custom_response_fields_form').validate({});

    // Set validation behavior for rule_details_form
    _detailsValidator = $('#rule_details_form').validate({
        rules: {
            'rule_name': {
                required: true,
                maxlengthBytes: _textLimit
            },
            'alert_text': {
                maxlengthBytes: _alertTextLimit
            },
            'crossing_duration_minutes': {
                required: '#crosses_multiline_tripwire:visible'
            },
            'crossing_duration_seconds': {
                required: '#crosses_multiline_tripwire:visible'
            },
            'leftbehind_checkbox': {
                totalTimeRange: [1, 3600]
            },
            'loiter_area_action_checkbox': {
                totalTimeRange: [1, 3600]
            },
            'occupancygroup_checkbox': {
                totalTimeRange: [1, 3599]
            },
            'dwellgroup_checkbox': {
                totalTimeRange: [1, 3599]
            },
            'occupancy_threshold_duration_minutes': {
                associatedRange: [0, 59]
            },
            'dwell_threshold_duration_minutes': {
                associatedRange: [0, 59]
            },
            'density_checkbox': {
                totalTimeRange: [1, 1800]
            },
            'density_duration_minutes': {
                associatedRange: [0, 30]
            },
            'crossing_order': {
                totalTimeRange: [1, 300]
            },
            'crossing_duration_minutes': {
                associatedRange: [0, 5]
            }
        },

        messages: {
            'leftbehind_checkbox': getString('validationText.timeRangeMax60'),
            'loiter_area_action_checkbox': getString('validationText.timeRangeMax60'),
            'thresholdgroup_checkbox': getString('validationText.timeRangeMax59'),
            'density_checkbox': getString('validationText.timeRangeMax30'),
            'occupancygroup_checkbox': getString('validationText.timeRangeMax59'),
            'dwellgroup_checkbox': getString('validationText.timeRangeMax59'),
            'crossing_order': getString('validationText.timeRangeMax5')
        },

        errorPlacement: function (error, element) {
            var msgElement = element.closest('.validation_group').find('.group_invalid_message');
            if (element.hasClass('validation_master')) {
                // Custom error placement for validation_master controls.
                // Append error to div.group_invalid_message.
                msgElement.append(error);
            }
            else if (element.hasClass('grouped_validation')) {
                // Custom error placement for grouped_validation inputs.
                // Put error in front of div.group_invalid_message.
                msgElement.before(error).show();
            }
            else {
                error.insertAfter(element);
            }
        },

        highlight: function (element, errorClass, validClass) {
            var elt = $(element);
            if (elt.hasClass('validation_master')) {
                // Instead of marking the checkbox control invalid,
                // mark the event_type container div with 'invalid_group'.
                elt.closest('.validation_group').addClass('invalid_group').find('.group_invalid_message').show();
            }
            else if (elt.hasClass('grouped_validation')) {
                elt.closest('.validation_group').addClass('invalid_group');
                elt.addClass(errorClass).removeClass(validClass);
            }
            else {
                elt.addClass(errorClass).removeClass(validClass);
            }
        },

        unhighlight: function (element, errorClass, validClass) {
            var that = this;
            var associateCtrl;
            var elt = $(element);

            if (elt.hasClass('validation_master')) {
                // Unhighlight the group, not the checkbox/select.
                elt.closest('.validation_group').removeClass('invalid_group').find('.group_invalid_message').hide();
            }
            else {
                // If element we are unhighlighting is in a validation group,
                // we should re-evaluate the associated validation_master control.
                if (elt.is(':visible:enabled') && elt.hasClass('grouped_validation')) {
                    associateCtrl = elt.closest('.validation_group').find('.validation_master');
                }
            }

            elt.removeClass(errorClass).addClass(validClass);

            if (associateCtrl && (associateCtrl.length > 0)) {
                // Re-evaluate the associated control after we exit this function.
                setTimeout(function () {
                    that.element(associateCtrl);
                }, 1);
            }
        }
    });

    // Explicitly re-validate dependent controls if occupancy or dwell radio buttons clicked.
    $('#occupancy_area_action_block input.action_group_radio_button').click(function () {
        _detailsValidator.element($('#occupancy_group_checkbox'));
        _detailsValidator.element($('#occupancy_count_threshold'));
        _detailsValidator.element($('#occupancy_threshold_duration_minutes'));
        _detailsValidator.element($('#occupancy_threshold_duration_seconds'));
    });

    $('#dwell_area_action_block input.action_group_radio_button').click(function () {
        _detailsValidator.element($('#dwell_group_checkbox'));
        _detailsValidator.element($('#dwell_count_threshold'));
        _detailsValidator.element($('#dwell_threshold_duration_minutes'));
        _detailsValidator.element($('#dwell_threshold_duration_seconds'));
    });
};


/**
 * Sets up an instance of objectvideo.snapshot.snapshotPlayer.
 * @param {String} channelId The ID of the channel for which snapshots will be displayed.
 * @param {String} channelRoot  The "channel root" prefix of the URI associated with channelId.
 * @return {Object} A new, initialized instance of objectvideo.snapshot.snapshotPlayer
 */
var initSnapshotPlayer = function () {
    var player;

    player = objectvideo.snapshot.snapshotPlayer(
        $('#snapshot'),
        $('input#playpause_btn'),
        {
            loading: $('#snapshot_loading_message')
        });

    player.update();

    return player;
};

var extendDrawInfo = function (drawInfo) {
    if (!Boolean(drawInfo) || (typeof drawInfo !== 'object')) {
        throw new Error('Invalid argument: drawInfo');
    }

    // True if in the head circle.
    drawInfo.isInHead = false;

    // True if in the foot rectangle.
    drawInfo.isInFoot = false;

    drawInfo.setStart = function (pt, hitInfo) {
        this.baseSetStart(pt, hitInfo);
        if (hitInfo) {
            this.shapeIndex = hitInfo.index;
            this.isInHead = hitInfo.isInHead;
            this.isInFoot = hitInfo.isInFoot;
        }
    };

    drawInfo.reset = function () {
        this.baseReset();

        this.isInHead = false;
        this.isInFoot = false;
    };
};


// channelId = $('#channelId').val();

//$('#rule_edit_pane').replaceStrings();

_toolMode = toolModeEnum.select;
_curDirection = tripwireDirections.AnyDirection;
//initDialogs();
$('#rule_edit_pane').show();

//_schedulesPane = objectvideo.schedulesPane.init();
_isInitialized = true;
initAnalyticsCapabilities();
_snapController = objectvideo.snapshot.controller();
_snapController.init(initSnapshotPlayer());
extendDrawInfo(_snapController.drawInfo());
setDimensions();

getRuleJSON();
bindEventHandlers();
_snapController.show().resetExpandButton();
_snapController.snapPlayer().play();
if (window.G_vmlCanvasManager) {
    setTimeout(function () {
        if (_isInitialized && _snapController) {
            _snapController.staticCanvas().redraw();
        }
    }, 1);
}


// 规则等级更改
$('button.RuleEdit').click(function () {
    $('button.RuleEdit').removeClass('btn-success');
    $(this).addClass('btn-success');
    level_value=$(this).val()
    $('#level').val(level_value);
})

// 初始化界面
level=$('#level').val();
$('#btn_'+level).addClass('btn-success');

$('#sumbit').click(function () {

        saveRule(function () {

        })
    }
)
