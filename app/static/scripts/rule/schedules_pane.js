/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws,
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852,
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
 * @file schedules_pane.js
 * schedulesPane module
 */
objectvideo.schedulesPane = {};

(function($) {
    /**
     * "Import" of objectvideo.common.getString function.
     * @type {Function}
     */
    var getString = objectvideo.getString;

    /**
     * "Import" of objectvideo.main.errorDialog function.
     * @type {Function}
     */
    var errorDialog = objectvideo.errorDialog;

    /**
     * "Import" of objectvideo.common.isTwelveHourTime
     * @type {Boolean}
     */
    var _isTwelveHourTime = objectvideo.isTwelveHourTime;

    /**
     * Day of week array for converting between numeric values and string
     * values for each day of the week. This maps to the value attribute in
     * the html dropdown list, and is not visible.  To localize the days
     * of the week simply modify the text in the html for each dropdown.
     * @type {Array}
     */
    var _dayOfWeekArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    /**
     * True, if the schedulesPane module has been initialized and is ready to
     * handle ajax callbacks; false, if the module has either not yet been
     * initialized or has been cleaned-up by close#.
     * @type {Boolean}
     */
    var _isInitialized = false;

    /**
     * True, if the _schedulesList property has been initialized; false, if it has not.
     * @type {Boolean}
     */
    var _isSchedulesListReady = false;

    /**
     * Value of the most recently selected option in the select_schedule list.
     */
    var _lastSelection = '';

    /**
     * The schedule managed and displayed by this module.
     * @type {Object}
     */
    var _currentSchedule = null;

    /**
     * If true, the _currentSchedule represents a custom schedule.
     * @type {Boolean}
     */
    var _isCustom = false;

    /**
     * The number of rows that have been added to the schedule edit pane.
     * Note that this value is never decremented, even if a row is deleted.
     * @type {Number}
     */
    var _rowCount = 0;

    /**
     * True if data in the schedule_edit_container form has been modified.
     * @type {Boolean}
     */
    var _isDirty = false;

    /**
     * The list of available schedule templates.
     * @type {Object}
     */
    var _schedulesList = null;

    /**
     * An array of schedules and associated template file names. Each entry in
     * the array is an object having properties name, a String, and schedule,
     * an instance of objectvideo.ovready.schedule.
     * @type {Array}
     */
    var _scheduleArray = [];


    /**
     * Makes an ajax call to load _schedulesList.
     */
    var getSchedulesList = function() {
        // Load schedule template list.
        $.ajax({
            url: './data/schedulesList.json',
            dataType: 'json',
            cache: true,
            success: function(jsonObj, status) {
                if (_isInitialized) {
                    // Save deserialized JSON object.
                    _schedulesList = jsonObj;
                    buildScheduleList(_schedulesList);
                    _isSchedulesListReady = true;
                    if (_currentSchedule) {
                        showScheduleType();
                    }
                }
            },
            error: function(xhr, status, ex) {
                if (_isInitialized) {
                    // Handle error.
                    errorDialog(getString('error.getScheduleList'), ex || xhr);
                }
            }
        });
    };


    /**
     * Add the list of schedules to the schedule select dropdown box.
     * @param {Object} schedList List of schedule templates
     */
    var buildScheduleList = function(schedList) {
        var separatorOption = $('#select_schedule > option[value="sep1"]');

        $.each(schedList, function(i){
            var newOption = $('#schedule_template').clone(true);
            $(newOption).val(this.fileName)
                .text(getString(this.fileName))
                .attr('id', 'schedule_template' + i)
                .insertBefore(separatorOption)
                .show();
        });

        if (! _lastSelection) {
            _lastSelection = $('#select_schedule').val();
        }
    };


    /**
     * Sets the schedule select option based on _currentSchedule. 
     */
    var showScheduleType = function() {
        var scheduleMatch = false;

        $('#schedule_table_subpane').show().addBlockOverlay();

        try {
            // Decide if we need to compare the current schedule to the templates
            // based on the number of TimeBlocks.  If the number of timeBlocks
            // matches one of the templates, compare the individual TimeBlocks,
            // otherwise show a custom schedule.
            var count = 0;
            $.each(_schedulesList, function(i) {
                var fileName = this.fileName;
                var currentNumBlocks = _currentSchedule.weeklyTimeBlocks.length;
                if (String(currentNumBlocks) === this.numBlocks) {
                    // If there is more than one weekly time block, be sure it is sorted in descending order
                    // by startDayOfWeek; if not, sort it before comparing the schedules.
                    if (currentNumBlocks > 1 &&
                    _currentSchedule.weeklyTimeBlocks[0].startDayOfWeek > _currentSchedule.weeklyTimeBlocks[1].startDayOfWeek) {
                        _currentSchedule.weeklyTimeBlocks.sort(sortByWTB('startDayOfWeek', sortByWTB('endDayOfWeek')));
                    }
                    if (_currentSchedule.equals(findTimeBlocks(fileName))) {
                        _lastSelection = fileName;
                        $('#select_schedule').val(fileName);
                        showSchedules(_currentSchedule);
                        scheduleMatch = true;
                    }
                }
                return (!scheduleMatch);
            });
            
            if (! scheduleMatch) {
                _lastSelection = 'custom';
                $('#select_schedule').val(_lastSelection);
                showSchedules(_currentSchedule);
                _isCustom = true;
            }
        }
        finally {
            $('#schedule_table_subpane').removeBlockOverlay();
        }
    };


    /**
     * Sets the schedule managed and displayed by this module.
     * @param {Object} schedule Schedule object
     */
    var setSchedule = function(schedule) {
        if (typeof schedule !== 'object') {
            throw new Error('Invalid argument: schedule');
        }

        _currentSchedule = schedule;
        if (_isSchedulesListReady) {
            showScheduleType();
        }
    };

   /**
    * The javascript sort function is not working properly for multi-deminsional arrays
    * so, sort the weekly Time Blocks before comparing the schedules sort by
    * startDayOfWeek, and in case of a tie sort by endDayOfWeek
    * @param {Object} sdow startDayOfWeek for each TimeBlock
    * @param {Object} edow endDayOfWeek for each TimeBlock, used to break ties
    */
    var sortByWTB = function(sdow, edow){
      return function(o,p){
          var a, b;
          if (typeof o === 'object' && typeof p === 'object' && o && p){
              a = o[sdow];
              b = p[sdow];
              if (a === b){
                  return typeof edow === 'function' ? edow(o,p):0;
              }
              if (typeof a === typeof b){
                  return a < b ? -1:1;
              }
              return typeof a < typeof b ? -1:1;
          }
          else {
            // handle error
            throw new Error('Invalid argument: startDayOfWeek or endDayOfWeek');
          }
        };
    };


    /**
     * Show schedule table and enable the edit button.
     * @param {Object} schedule Schedule object.
     */
    var showSchedules = function(schedule) {
        $('.selected_timeblock').removeClass('selected_timeblock');
        $('#schedule_table_subpane').show();
        $('#edit_btn').removeAttr('disabled');
        $.each(schedule.weeklyTimeBlocks, function() {
                buildCustom(this);
            });
    };


    /**
     * Add background color class to cells to display selected schedule.
     * @param {Object} tBlock Weekly time block
     */
    var buildCustom = function(tBlock) {
        var startDayOfWeek = tBlock.startDayOfWeek;
        var endDayOfWeek = tBlock.endDayOfWeek;
        var startMinuteOfDay = tBlock.startMinuteOfDay;
        var endMinuteOfDay = tBlock.endMinuteOfDay;
        var timeClass = null;
        var dayClass = null;
        var numDays = null;
        var j, count;
        var day;

        // Handle different schedule scenarios
        // Start day comes before end day
        if (startDayOfWeek < endDayOfWeek) {
            numDays = endDayOfWeek - startDayOfWeek;
        }
        // Start day and end day are the same and start minute is before end minute, timeblock is less than one day
        if (startDayOfWeek === endDayOfWeek && startMinuteOfDay <= endMinuteOfDay) {
            numDays = 0;
        }
        // Start day and end day are the same but start minute is after end minute, timeblock is almost a full week
        if (startDayOfWeek === endDayOfWeek && startMinuteOfDay > endMinuteOfDay) {
            numDays = 7;
        }
        // Start day is greater than end day, timeblock wraps past Saturday into Sunday, but is less than a week
        else if (startDayOfWeek > endDayOfWeek) {
            numDays = ((7 - startDayOfWeek) + (endDayOfWeek - 0));
        }

        if (numDays === 0) {
            for (j = startMinuteOfDay; j < endMinuteOfDay; j += 30) {
                timeClass = '.t' + j;
                dayClass = '.d' + startDayOfWeek;
                $(timeClass + dayClass).addClass('selected_timeblock');
            }
        }
        else {
            for (count = 0; count <= numDays; count++) {
                // If we roll past Saturday subtract 7 from the startDayOfWeek plus count total.
                if (startDayOfWeek + count > 6) {
                    day = (startDayOfWeek + count - 7);
                }
                else {
                    day = startDayOfWeek + count;
                }

                // First day of timeblock start at startMinuteOfDay and fill to end of the day
                // per the spec the max minutes per day is 1439, thus 1410 + 30 is the last minute cell
                // increment by 30 becuase the each cell represents 30 minutes.
                if (count === 0) {
                    for (j = startMinuteOfDay; j <= 1410; j += 30) {
                        timeClass = '.t' + j;
                        dayClass = '.d' + day;
                        $(timeClass + dayClass).addClass('selected_timeblock');
                    }
                }
                // For all the days in between fill the whole day.
                if (count > 0 && count < numDays) {
                    for (j = 0; j <= 1410; j += 30) {
                        timeClass = '.t' + j;
                        dayClass = '.d' + day;
                        $(timeClass + dayClass).addClass('selected_timeblock');
                    }
                }
                // Last day of timeblock start at beginning of the day and fill to endMinuteOfDay.
                if (count === numDays) {
                    for (j = 0; j < endMinuteOfDay; j += 30) {
                        timeClass = '.t' + j;
                        dayClass = '.d' + day;
                        $(timeClass + dayClass).addClass('selected_timeblock');
                    }
                }
            }
        }
    };


    /**
     * Called by rule_edit page when the rule is saved.  Will return the current schedule
     * if defined, else returns null.
     * @return {Object} The current, selected schedule or null if no schedule is defined.
     */
    var getSchedule = function() {
        var selectedTemplate = $('#select_schedule').attr('value');
        if (selectedTemplate === 'no_schedule') {
            return null;
        }
        else {
            return _currentSchedule;
        }
    };


    /**
     * Unbinds event handler set by a previous call to addEventHandlers.
     * @return {Object} The schedulesPane module.
     */
    var unbindEventHandlers = function() {
        $('#select_schedule').unbind();
        $('#edit_btn').unbind();
        $('#schedule_add_row_image').unbind();
        $('input.schedule_delete').unbind();
        $('#schedule_done_edit_link').unbind();
        $('select.day_dropdown').unbind();
        $('input.txt_schedule_time').unbind();

        return objectvideo.schedulesPane;
    };


    /**
     * Handles a change event on the schedule select control.
     * Modifies _currentSchedule.
     * @param {Object} event The change event.
     */
    var onScheduleChange = function(event) {
        var selectElt = $(this);
        var template = $.trim(selectElt.val());

        // Guard against IE bug that allows user to select disabled options.
        if ((! template) || $(this).find('option[value="' + template + '"]').is(':disabled')) {
            selectElt.find('option').removeAttr('selected');
            selectElt.val(_lastSelection);
            return;
        }

        if (template === 'copy_existing') {
            selectElt.find('option').removeAttr('selected');
            selectElt.val(_lastSelection);
            // Display the copy schedule dialog, then exit.
            // The dialog callback function will handle the rest.
            objectvideo.ruleEdit.showCopyScheduleDialog();
            return;
        }

        _lastSelection = template;

        $('.selected_timeblock').removeClass('selected_timeblock');
        if (template === 'no_schedule') {
            $('#schedule_table_subpane').hide();
            $('#edit_btn').attr('disabled', 'true');
            _currentSchedule = null;
        }
        else if (template === 'custom') {
            // If we have a custom schedule show that, otherwise it will show blank.
            if (_isCustom) {
                showSchedules(_currentSchedule);
            }
            else {
                _currentSchedule = objectvideo.ovready.recurringWeeklySchedule();
            }

            // Show table and enable the edit button.
            $('#schedule_table_subpane').show();
            $('#edit_btn').removeAttr('disabled');
        }
        else {
            $('#schedule_table_subpane').addBlockOverlay();
            try {
                $('#edit_btn').removeAttr('disabled');

                // Check to see if already have the timeblocks for
                // the selected template, then show the schedule.
                _currentSchedule = findTimeBlocks(template);
                showSchedules(_currentSchedule);
            }
            finally {
                $('#schedule_table_subpane').removeBlockOverlay();
            }
        }

        // Since the current schedule changed set the ruleEdit page to dirty.
        objectvideo.ruleEdit.setDirty(true);
    };


    /**
     * Handles a click event on the schedule edit button.
     * @param {Object} event The click event.
     */
    var onEditClick = function(event) {
        var selectedSchedule = $('#select_schedule').attr('value');
        $('#schedule_table_subpane').hide();

        if (selectedSchedule === 'custom' && _isCustom) {
            // Show edit rows based on a custom schedule.
            buildEditRows(_currentSchedule);
        }
        else {
            // Build edit rows based on selected schedule.
            getEditRows(selectedSchedule);
        }

        // Show the edit pane, disable the edit button,
        // and disable the select dropdown.
        $('#schedule_edit_subpane').show();
        $(this).attr('disabled', 'true');
        $('#select_schedule').attr('disabled', 'true');

        // Prevent the default anchor link behavior of scrolling to the top.
        return false;
    };


    /**
     * Add event handlers for the schedule select drop down
     * based on selection load template from the xml documents.
     */
    var addEventHandlers = function() {
        $('#select_schedule').change(onScheduleChange);

        // Add event handler for Edit button.
        $('#edit_btn').click(onEditClick);

        // Add event handler for the add row button.
        $('#schedule_add_row_image').click(function() {
            addWTBRow();
            restripe();
            setDirty(true);

            // Prevent the default anchor link behavior of scrolling to the top.
            return false;
        });

        // Add event handler for delete row button.
        $('input.schedule_delete').click(function() {
            var selectedWTBRow;
            $(this).addClass('selected');
            selectedWTBRow = $('.selected').parents('tr').attr('id');
            removeWTBRow(selectedWTBRow);
            $(this).removeClass('selected');
            setDirty(true);
        });

        // Add event handler for Done editing button.
        $('#schedule_done_edit_link').click(function() {
            if (_isDirty) {
                doneEdit();
            }
            else {
                cancelEdit();
            }
        });

        // Add event handler to select fields to set schedule edit pane to dirty.
        $('select.day_dropdown').change(function() {
            setDirty(true);
        });

        // Add event handler to time fields to set schedule edit pane to dirty if modified.
        $('input.txt_schedule_time').keyup(function() {
            setDirty(true);
        });
    };


    /**
     * If form is valid set dropdown to custom and build new schedule display.
     * If form is not valid show errors, and do nothing.
     * @return {Boolean} True if the schedule edit container is valid,
     *                    false if invalid.
     */
    var doneEdit = function() {
        if ($('.schedule_edit_container').valid()) {
            $('#schedule_edit_subpane').addBlockOverlay();
            try {
                _lastSelection = 'custom';
                $('#select_schedule').val(_lastSelection);
                buildCustomSchedule();
                setDirty(false);
                return true;
            }
            finally {
                $('#schedule_edit_subpane').removeBlockOverlay();
            }
        }
        else {
            return false;
        }
    };


    /**
     * If no changes were made to the edit pane, simply revert back to previous
     * selection and display.
     */
    var cancelEdit = function() {
        var selectedSchedule = $('#select_schedule').attr('value');
        $('#schedule_edit_subpane').hide();
        $('#schedule_table_subpane').show();
        $('#edit_btn').removeAttr('disabled');
        $('#select_schedule').removeAttr('disabled');
        setDirty(false);
    };

    /**
     * Switch from visual display of schedule to edit pane,
     * Get weekly time blocks for selected template
     * @param {String} selectedSchedule Selected schedule identifier
     */
    var getEditRows = function(selectedSchedule) {
        var selectedTB;

        if (selectedSchedule === 'custom') {
            removeAllWTBRows();
            addWTBRow();
            $('#wtblock0').hide();
            $('.schedule_edit_container').show();
        }
        else {
            selectedTB = '_' + selectedSchedule + "TimeBlocks";
            removeAllWTBRows();
            buildEditRows(_currentSchedule);
        }
    };


    /**
     * Add each row to the edit pane, one row for each weekly time block
     * @param {Object} schedule The schedule from which to build edit rows.
     */
    var buildEditRows = function(schedule) {
        removeAllWTBRows();
        $.each(schedule.weeklyTimeBlocks, function(i, weeklyTimeBlock) {
            var rowId;
            addWTBRow();
            rowId = '#wtblock' + _rowCount;
            updateWTBRow(weeklyTimeBlock, rowId);
        });
        $('#wtblock0').hide();
        $('.schedule_edit_container').show();

        restripe();
    };

    /**
     * Fill in details for each field in edit pane table.
     * @param {Object} weeklyTimeBlock time block data for the row
     * @param {Object} rowId Row id
     */
    var updateWTBRow = function(weeklyTimeBlock, rowId) {
        var startDayOfWeek = weeklyTimeBlock.startDayOfWeek;
        var endDayOfWeek = weeklyTimeBlock.endDayOfWeek;
        var startMinuteOfDay = weeklyTimeBlock.startMinuteOfDay;
        var endMinuteOfDay = weeklyTimeBlock.endMinuteOfDay;
        var startTimeString, endTimeString;

        // Populate start day of week dropdown.
        if (startDayOfWeek >= 0 && startDayOfWeek <= 6) {
            $('.start_day', rowId).val(_dayOfWeekArray[startDayOfWeek]);
        }
        else {
            // Handle error.
            errorDialog(getString('error.readSchedule'), ex);
        }

        // Populate end day of week dropdown.
        if (endDayOfWeek >= 0 && endDayOfWeek <= 6) {
            $('.end_day', rowId).val(_dayOfWeekArray[endDayOfWeek]);
        }
        else {
            // Handle error.
            errorDialog(getString('error.readSchedule'), ex);
        }

        startTimeString = getTimeString(startMinuteOfDay);
        $('input.start_time', rowId).val(startTimeString);

        endTimeString = getTimeString(endMinuteOfDay);
        $('input.end_time', rowId).val(endTimeString);
    };


    /**
     * Build the time string.
     * @param {Number} timeOfDay Time as number of minutes since midnight
     * @return {String} Formatted time of day
     */
    var getTimeString = function(timeOfDay) {
        var meridian, timeString;
        var time = +timeOfDay / 60;
        // For hour we can drop decimal places.
        var hour = Math.floor(time);
        var minutes = (time - hour) * 60;
        // Round to the closet whole minute.
        var minString = String(Math.round(minutes));
        if (minString.length < 2) {
            minString = '0' + minString;
        }
        // Convert to 12 hour time, if false leave as 24 hour time.
        if (_isTwelveHourTime) {
            meridian = 'AM';
            if (hour >= 12) {
                meridian = 'PM';
                hour -= 12;
            }

            if (hour === 0) {
                hour += 12;
            }
        }
        // Build the string, if twelve hour add AM or PM.
        timeString = hour + ':' + minString;
        if (_isTwelveHourTime) {
            timeString = timeString + ' ' + meridian;
        }
        return timeString;
    };


    /**
     * Add a new row to the edit pane, first new row copy wtblock0, after that
     * copy previous row to keep time values. Give each field a unique name
     * using _rowCount, and add validation rules
     */
    var addWTBRow = function() {
        var newWTBID;
        var newWTB = null;
        _rowCount++;
        if ($('tr.schedule_row').length <= 1) {
            newWTB = $('#wtblock0').clone(true);
            // If using 24 hour time, override the default values of 8:00 AM and 5:00 PM in the html.
            if (!_isTwelveHourTime) {
                $('input.start_time', newWTB).val('8:00');
                $('input.end_time', newWTB).val('17:00');
            }
        }
        else {
            newWTB = $('tr.schedule_row:not(#wtblock0):last').clone(true);
        }
        // Give each row a unique id.
        newWTB.attr('id', 'wtblock' + _rowCount);
        newWTB.insertBefore('#wtblock0');
        newWTBID = '#' + $(newWTB).attr('id');

        // Add form validation to each field.
        $('.start_day', newWTBID).val('none').attr('name', 'start_day' + _rowCount).rules('add', {
            selectNone: true
        });
        $('input.start_time', newWTBID).attr('name', 'start_time' + _rowCount).rules('add', {
            required: true,
            timeFormat: true,
            notIdentical: true
        });
        $('.end_day', newWTBID).val('none').attr('name', 'end_day' + _rowCount).rules('add', {
            selectNone: true
        });
        $('input.end_time', newWTBID).attr('name', 'end_time' + _rowCount).rules('add', {
            required: true,
            timeFormat: true
        });
        $('input.start_time', newWTBID).focus();

        // Set scroll bar postion to where the row was just added
        window.scroll(window.scrollMaxX, window.scrollMaxY);
        // Show the new row.
        newWTB.show();
    };


    /**
     * Delete single row in edit pane
     * @param {String} selectedWTBRow Row id
     */
    var removeWTBRow = function(selectedWTBRow) {
        $('#' + selectedWTBRow).remove();
        // Revalidate form, since the row with the error, may have just been removed.
        $('.schedule_edit_container').validate().form();
    };


    /**
     * Delete all rows in edite pane except #wtblock0
     */
    var removeAllWTBRows = function() {
        $('tr.schedule_row:not(#wtblock0)').remove();
    };


    /**
     * Restripe the schedule rows.
     */
    var restripe = function() {
        $('tr.schedule_row').removeClass('accent_bkgnd').filter(':nth-child(odd)').addClass('accent_bkgnd');
    };


    /**
     * Check to see if we have loaded the selected schedule yet.  If it is the
     * first time a schedule is called do the ajax call, by calling getTimeBlock.
     * Then make a copy of that schedule and hold on to it in order to avoid redundant
     * ajax calls.
     * @param {String} fileName Schedule template name.
     * @return {Object} The schedule associated with fileName.
     */
    var findTimeBlocks = function(fileName) {
        var schedule = null;
        var i;

        // Search through _scheduleArray for a named schedule
        // matching fileName.
        for (i = 0; i < _scheduleArray.length; i++) {
            if (_scheduleArray[i].name === fileName) {
                schedule = $.extend(true, {}, _scheduleArray[i].schedule);
                break;
            }
        }

        if (! schedule) {
            // No match found so make the ajax call to get
            // the schedule, then make a copy.
            schedule = $.extend(true, {}, getTimeBlocks(fileName));

            // Save a reference to the schedule for next time.
            _scheduleArray.push({
                schedule: schedule,
                name: fileName
            });
        }

        return schedule;
    };


    /**
     * Get selected weekly schedule via synchronous ajax call.
     * @param {String} fileName Schedule template
     * @return {Object} The schedule corresponding to fileName or null if
     *                   an error occurs.
     */
    var getTimeBlocks = function(fileName) {
        var schedule = null;
        var url = './data/' + fileName + '.xml';

        $.ajax({
            // Note: Synchronous call to get template file.
            async: false,
            url: url,
            processData: false,
            dataType: 'text',
            success: function(xml) {
                if (_isInitialized) {
                    schedule = objectvideo.ovready.recurringWeeklySchedule();
                    schedule.fromXML(xml);
                }
            },
            error: function(xhr, status, ex) {
                if (_isInitialized) {
                    errorDialog(getString('error.getSchedule'), ex || xhr);
                }
            }
        });

        return schedule;
    };


    /**
     * Build new instance of _currentSchedule by pushing each new schedule row
     * onto the weekly time block array.
     */
    var buildCustomSchedule = function() {
        _currentSchedule.weeklyTimeBlocks = [];
        $('tr.schedule_row:not(#wtblock0)').each(function(i) {
            var scheduleRow = objectvideo.ovready.weeklyTimeBlock();

            // Get the value from each field in the row.
            var stringStartDay = $('.start_day', this).val();
            var stringEndDay = $('.end_day', this).val();
            var stringStartTime = $('input.start_time', this).val();
            var stringEndTime = $('input.end_time', this).val();

            // Compare the string to our dayOfWeek array to get index for the day.
            scheduleRow.startDayOfWeek = dayOfWeek(stringStartDay);
            scheduleRow.endDayOfWeek = dayOfWeek(stringEndDay);

            // Convert string into minutes.
            scheduleRow.startMinuteOfDay = getTime(stringStartTime);
            scheduleRow.endMinuteOfDay = getTime(stringEndTime);

            // Add timeblock to the currentSchedule array.
            _currentSchedule.weeklyTimeBlocks.push(scheduleRow);
        });

        showSchedules(_currentSchedule);
        $('#schedule_edit_subpane').hide();
        $('#edit_btn').removeAttr('disabled');
        $('#select_schedule').removeAttr('disabled');
        _isCustom = true;
    };


    /**
     * Get index into _dayOfWeekArray for given day.
     * @param {String} stringDay Day of week
     * @return {Number} Index of stringDay in _dayOfWeekArray, or -1 if not found
     */
    var dayOfWeek = function(stringDay) {
        // Note: IE does not support indexOf an Array, so have to do the same
        // thing here with a for loop.
        var i;
        for (i = 0; i < _dayOfWeekArray.length; i++) {
            if (_dayOfWeekArray[i] === stringDay) {
                return i;
            }
        }
        return -1;
    };


    /**
     * Get time as number of minutes from the given string.
     * @param {String} timeString Formatted time of day
     * @return {Number} Number of minutes since midnight
     */
    var getTime = function(timeString) {
        var meridian, minute;
        // Break string into hours and minutes.
        var pos = timeString.search(':');
        var hour = timeString.slice(0, pos);
        // Convert hour string into an integer.
        hour = parseInt(hour, 10);

        // If twelve hour time handle AM and PM.
        if (_isTwelveHourTime) {
            meridian = timeString.slice(timeString.length - 2);
            meridian = meridian.toUpperCase();
            if (meridian === 'PM' && hour !== 12) {
                hour += 12;
            }
            if (meridian === 'AM' && hour === 12) {
                hour = 0;
            }
        }
        hour = (hour * 60);

        minute = timeString.slice(pos + 1, pos + 3);
        // Convert minute string into an integer.
        minute = parseInt(minute, 10);
        time = hour + minute;
        return time;
    };


    /**
     * Sets or clears a flag that indicates whether the schedule data state is
     * "dirty", meaning that changes to the data have not been saved.
     * @param {Boolean} isDirty True if the data should be flagged as dirty;
     *                   false, if the data contains no unsaved changes.
     * @return {Boolean} The value of the isDirty parameter.
     */
    var setDirty = function(isDirty) {
        _isDirty = isDirty;
        if (isDirty) {
            objectvideo.ruleEdit.setScheduleDirty(true);
            objectvideo.ruleEdit.setDirty(true);
        }
        else {
            objectvideo.ruleEdit.setScheduleDirty(false);
        }
        return isDirty;
    };


    /**
     * Sets up rules and other options for the $.validation plugin.
     */
    var initValidation = function() {
        // Validate that a day has been selected
        $.validator.addMethod('selectNone', function(value, element) {
                if (element.value === 'none') {
                    return false;
                }
                else {
                    return true;
                }
            }, getString('validationText.selectNone'));

        // Validate that a start and end are not identical
        $.validator.addMethod('notIdentical', function(value, element) {
                var rowId = '#' + $(element).parents('tr.schedule_row').attr('id');

                if ($('input.start_time', rowId).val() === $('input.end_time', rowId).val() && $('.start_day', rowId).val() === $('.end_day', rowId).val()) {
                    return false;
                }
                else {
                    return true;
                }
            }, getString('validationText.identical'));

        // Validate time strings using regular expressions, change _isTwelveHourTime to false for 24 hour time
        $.validator.addMethod('timeFormat', function(value, element) {
                if (_isTwelveHourTime) {
                    if (/^ *(1[0-2]|[1-9]):[0-5][0-9] *(a|p|A|P)(m|M) *$/.test(value)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    if (/^(([1-9]{1})|([0-1][0-9])|([1-2][0-3])):([0-5][0-9])$/.test(value)) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            },
            // For 24 hour time, change timeFormat string in strings.properties file
            getString('validationText.timeFormat'));

        // Add validation to edit pane
        $('.schedule_edit_container').validate({
                errorClass: 'invalid',
                wrapper: "p",
                errorPlacement: function(error, element) {
                    // Only show one error string at a time.
                    if ($('#schedules_pane label:visible').hasClass('invalid')) {
                        // supress extra error messages
                    }
                    else {
                        error.insertAfter('#done_edit');
                    }
                }
            });
    };


    /**
     * Initializes the schedulesPane module.
     * @return {Object} The schedulesPane module.
     * @see close#
     */
    var init = function() {
        _isInitialized = true;

        getSchedulesList();
        addEventHandlers();
        initValidation();

        return objectvideo.schedulesPane;
    };


    /**
     * De-initializes the schedulesPane module.
     * @return {Object} The schedulesPane module.
     * @see init#
     */
    var close  = function() {
        _isInitialized = false;

        unbindEventHandlers();

        _lastSelection = '';
        _currentSchedule = null;
        _isCustom = false;
        _isDirty = false;
        _schedulesList = null;
        _isSchedulesListReady = false;
        _scheduleArray = [];
    };


    // "export" function names
    var ns = objectvideo.schedulesPane;
    ns.init        = init;
    ns.close       = close;
    ns.setSchedule = setSchedule;
    ns.getSchedule = getSchedule;
    ns.doneEdit    = doneEdit;

})(jQuery);
