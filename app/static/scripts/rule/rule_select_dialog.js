/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws,
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852,
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
 * @file rule_select_dialog.js
 * Rule select dialog for choosing a rule from which to copy
 * a resource such as filters or schedule.
 */

if (!objectvideo.ruleEdit) {
    objectvideo.ruleEdit = {};
}

(function($) {

    /**
     * "Import" of objectvideo.common.getString.
     */
    var getString = objectvideo.getString;

    /**
     * "Import" of objectvideo.main.errorDialog.
     */
    var errorDialog = objectvideo.errorDialog;

    /**
     * The rule select dialog object.
     * @type {Object}
     */
    objectvideo.ruleEdit.ruleSelectDialog = (function() {
        /**
         * Width of the dialog if channel list and snapshot are shown.
         */
        var _channelsWidth = 640;

        /**
         * Width of the dialog if channel list and snapshot are hidden.
         */
        var _rulesWidth = 380;

        /**
         * Default width of rule selection div, if channel list and snapshot are shown.
         */
        var _ruleSelectionWidth = '48%';

        /**
         * Default margin-left of selection pane.
         */
        var _selectionPaneMargin = '170px';


        /**
         * The pick rule dialog wrapped element.
         * @type {Object}
         * @private
         */
        var _dlg = $([]);

        /**
         * The callback function used to determine whether a rule should be
         * included in the dialog's rule select control.
         */
        var _selectionCallback = null;

        /**
         * The callback function to invoke when the user clicks
         * the Pick Rule dialog's OK button.
         * @type {Object}
         * @private
         */
        var _resultCallback = null;

        /**
         * Name to use in place of an empty channel name.
         * @type {String}
         * @private
         */
        var _untitled = '';

        /**
         * An associative array of rules keyed by ruleLink URL strings.
         * @type {Object}
         * @private
         */
        var _ruleMap = {};


        /**
         * Passes the specified rule to the selection callback to test whether
         * it should be included in this dialog's rule list. If the rule passes
         * the callback test, it is added to _ruleMap.
         * @param {Object} rule An objectvideo.ovready.rule object.
         */
        var selectRule = function(rule) {
            // Pass the rule through the selection callback to
            // determine whether it should be included in the list.
            //if (_selectionCallback(rule)) {
                // Save a reference to the rule object in _ruleMap so
                // that we look it up again later, then add an option
                // element for the rule to the select list.
                _ruleMap[rule.id] = rule;
                $('<option></option>').val(rule.RuleId).text(decodeURI(rule.RuleName)).attr('title', rule.RuleName).appendTo('#pick_rsrc_dlg_rules');
            //}
        };


        /**
         * Handles the successful ajax call to retrieve an individual rule
         * by passing it to the selection callback, then including it in
         * the rules select control if it passes the callback test.
         *
         * @param {Object} xml The response body.
         * @param {String} status Status indicator string.
         */
        var onGetRuleDetail = function(xml, status) {
            var rule = null;

            try {
                // Parse the XML response
                rule = objectvideo.ovready.ruleFactory(xml);
                if (rule) {
                    selectRule(rule);
                }
                else {
                    $.log('Error: Failed to parse rule from ' + xml);
                }
            }
            catch (ex) {
                $.log('Exception while parsing rule details: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex);
                }
                errorDialog(objectvideo.getString('error.loadRule'), ex);
            }
        };


        /**
         * Gets details for each rule in rulesList.
         * @param {Object} rulesList List of rules.
         */
        var getRuleDetails = function(rulesList) {
            var nPendingResponses = 0;

            _ruleMap = {};

            if (Boolean(_selectionCallback) && (rulesList.length > 0)) {
                nPendingResponses = rulesList.length;
                $.each(rulesList, function() {
                    $.ajax({
                        url: this.ruleLink,
                        success: onGetRuleDetail,
                        error: function(xhr, status, ex) {
                            errorDialog(getString('error.loadRule'), ex || xhr);
                        },
                        complete: function() {
                            if (--nPendingResponses <= 0) {
                                _dlg.removeBlockOverlay();
                            }
                        }
                    });
                });
            }
            else {
                _dlg.removeBlockOverlay();
            }
        };


        /**
         * Gets a summary list of rules for the specified channel,
         * then passes it to getRuleDetails.
         * @param {String} channelLink The relative URI of the selected channel.
         * @private
         * @see getRuleDetails#
         */
        var getChannelRuleSummary = function(channelLink) {
           
        };


        /**
         * Gets all rules for the specified channel.
         * @param {String} channelLink The relative URI of the selected channel.
         * @private
         */
        var getChannelRules = function(channelLink) {
            if (! _selectionCallback) {
                return;
            }
            var ruleId = $('#ruleId').val();
            $.ajax({
                url: "/api/ruleFilter.ashx",
                data:{"ChannelId":channelLink,"RuleId":ruleId},
                dataType:"json",
                success: function(data, status) {
                    if(data.Rules){
                        $.each(data.Rules,function(){
                        selectRule(this);
                        });
                        _dlg.removeBlockOverlay();
                    }else {
                        _dlg.removeBlockOverlay();
                        //errorDialog(getString('error.loadRuleList'));
                    }
                },
                error: function(xhr, status, ex) {
                    _dlg.removeBlockOverlay();
                    if ((xhr.readyState >= 3) && (xhr.status === 404)) {
                        // The /rules/all API is not supported, so fall back
                        // to calling the older /rules API for a summary list.
                        getChannelRuleSummary(channelLink);
                    }
                    else {
                        errorDialog(getString('error.loadRuleList'), ex || xhr);
                    }
                }                
            });
        };


        /**
         * Updates the channel snapshot thumbnail and list of rules
         * when the user selects a channel.
         * @param {String} channelLink The relative URI of the selected channel.
         * @private
         */
        var onSelectChannel = function(channelLink) {
            _dlg.addBlockOverlay();

            try {
                // Clear the rules select box and disable the OK button.
                $('#pick_rsrc_dlg_rules > option').remove();
                $('#pick_rsrc_dlg_btn_ok').attr('disabled', 'disabled').addClass('ui-state-disabled');

                // Get rules for the selected channel, populate the rules select box.
                getChannelRules(channelLink);

                // Update the dialog's snapshot thumbnail.
                $('#pick_rsrc_dlg img.thumbnail').attr('src', channelLink + '/snapshot');
            }
            catch (ex) {
                _dlg.removeBlockOverlay();
                $.log('Error while populating pick rule dialog: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex);
                }
                errorDialog(getString('error.loadRuleList'), ex);
            }
        };


        /**
         * Populates the channel select list with the specified channels,
         * shows the dialog, then updates the snapshot and rule select list.
         * @param {Object} channelList A list of channels.
         */
        var populateAndShow = function(channelList) {
            var selectedChannelLink;
            var selectedChannelId = objectvideo.channelManager.getSelectedChannelId();

            if (channelList && channelList.channelSummaryList) {
                $.each(channelList.channelSummaryList, function() {
                    // Create a new option element for the channel.
                    var name =decodeURI(this.name) || _untitled;
                    var option = $('<option></option>');
                    option.val(this.channelLink).text(name).attr('title', name);

                    if (this.id === selectedChannelId) {
                        // This channel is the currently selected one.
                        // Mark the option selected and save the link for later.
                        option.attr('selected', 'selected');
                        selectedChannelLink = this.channelLink;
                    }

                    // Add the new option element to the end of the select element.
                    $('#pick_rsrc_dlg_channels').append(option);
                });

                // Display the dialog.
                _dlg.dialog('open');

                // Populate the rule list and snapshot thumbnail
                // from the channel link.
                onSelectChannel(selectedChannelLink);
            }
        };


        return {
            /**
             * Initializes the pick rule dialog.
             */
            init: function() {
                var dlgButtons = {};

                // Replace dialog text with localized strings.
                _dlg = $('#pick_rsrc_dlg');
                _dlg.replaceStrings();

                _untitled = objectvideo.getString('noChannelName');

                // Create OK and Cancel buttons.
                // Attach callback function to OK button.
                // "OK"
                dlgButtons[objectvideo.getString('okButtonLabel')] = function() {
                        var ruleId = $('#pick_rsrc_dlg_rules').val();
                        if (_resultCallback) {
                            _resultCallback(ruleId);
                        }
                        $(this).dialog('close');
                    };
                // "Cancel"
                dlgButtons[objectvideo.getString('cancelButtonLabel')] = function() {
                        $(this).dialog('close');
                    };

                // Create the pick rule dialog, but do not show it.
                _dlg.dialog({
                        autoOpen:  false,
                        modal:     true,
                        resizable: false,
                        minHeight: 280,
                        minWidth:  _rulesWidth,
                        width:     _channelsWidth,
                        buttons:   dlgButtons,
                        close:     function() {
                            _selectionCallback = null;
                            _resultCallback = null;
                            _ruleMap = {};
                        }
                    });

                // Assign unique ids to the dialog's button elements.
                objectvideo.assignDialogButtonIds(_dlg[0].id);

                // Handle change events for channel select control.
                $('#pick_rsrc_dlg_channels').change(function(event) {
                        var channelLink = $.trim($(this).val());
                        onSelectChannel(channelLink);
                    });

                // Handle change and dblclick events for rule select control.
                $('#pick_rsrc_dlg_rules').change(function(event) {
                        $('#pick_rsrc_dlg_btn_ok').removeAttr('disabled').removeClass('ui-state-disabled');
                    }).dblclick(function(event) {
                            $('#pick_rsrc_dlg_btn_ok').not('.ui-state-disabled').trigger('click');
                        });

                // Enter key, keycode 13, within the dialog activates the OK button.
                _dlg.keyup(function(event) {
                        if (event && (event.which === 13)) {
                            $('#pick_rsrc_dlg_btn_ok').not('.ui-state-disabled').trigger('click');
                        }
                    });
            },


            /**
             * Releases the pick rule dialog.
             */
            destroy: function() {
                _dlg.dialog('destroy').remove();
            },


            /**
             * Initializes controls and shows the pick channel/rule dialog.
             * @param {String} title The dialog box title.
             * @param {String} prompt A prompt string providing instructions to the user.
             * @param {Boolean} showChannels If true, allows the user to select
             *                   from all channels on the device. Otherwise, the
             *                   dialog will show only rules on the current channel
             *                   as specified by
             *                   objectvideo.channelManager.getSelectedChannelId#.
             * @param {Object} selectionCallback A function that will be called
             *                  once for each rule on a selected channel. The
             *                  function will be passed an objectvideo.ovready.rule
             *                  object as its only argument and should return true
             *                  if the rule should be included in the dialog's rule
             *                  list or false if it should be excluded.
             * @param {Object} resultCallback The function to be called when the
             *                  user clicks the OK button. The function will be passed
             *                  a single String argument, which is the URI of the
             *                  selected rule.
             * @param {Object | String} blockedElt Optional. If specified, a jQuery
             *                           wrapped set specifying the element(s) to be
             *                           covered by a "blocked" UI overlay.
             */
            show: function(title, prompt, showChannels, selectionCallback, resultCallback, blockedElt) {
                var promptElt;

                if (! title) {
                    throw new Error('Invalid argument: title is not a non-empty string');
                }
                if (typeof prompt !== 'string') {
                    throw new Error('Invalid argument: prompt must be of type String.');
                }
                if (typeof selectionCallback !== 'function') {
                    throw new Error('Invalid argument: selectionCallback is not a function');
                }
                if (typeof resultCallback !== 'function') {
                    throw new Error('Invalid argument: resultCallback is not a function');
                }

                // Save the callback functions, so we can invoke them later.
                _selectionCallback = selectionCallback;
                _resultCallback = resultCallback;

                // Set the dialog title.
                _dlg.dialog('option', 'title', title);

                // Set the prompt or hide it if the caller passed an empty string.
                promptElt = $('.ov_dialog_prompt', _dlg);
                if (prompt) {
                    promptElt.text(prompt).show();
                }
                else {
                    promptElt.hide();
                }

                // Clear the channels select
                $('#pick_rsrc_dlg_channels > option').remove();

                if (showChannels) {
                    _dlg.dialog('option', 'width', _channelsWidth);
                    _dlg.find('.selection_pane').css('margin-left', _selectionPaneMargin);
                    _dlg.find('.rule_selection_pane').css('width', _ruleSelectionWidth);
                    _dlg.find('.channel_selection_pane').show();
                    _dlg.find('.thumbnail_pane').show();

                    // Get the list of channels and populate the channels select box.
                    // The populateAndShow callback function will actually
                    // open the dialog.
                    objectvideo.channelManager.getChannelList(populateAndShow, blockedElt);
                }
                else {
                    // Hide the unused thumbnail and channel selection panes.
                    _dlg.find('.thumbnail_pane').hide();
                    _dlg.find('.selection_pane').css('margin-left', 0);
                    _dlg.find('.channel_selection_pane').hide();
                    _dlg.find('.rule_selection_pane').css('width', '100%');
                    _dlg.dialog('option', 'width', _rulesWidth);

                    // Display the dialog.
                    _dlg.dialog('open');

                    if (blockedElt) {
                        blockedElt.removeBlockOverlay();
                    }

                    // Populate the rule list from the selected channel.
                    onSelectChannel($('#channelId').val());
                }
            }
        };
    })();
})(jQuery);
