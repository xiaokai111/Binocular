var channelId = undefined;
var _rule = null;

var initPageFromRule = function (json) {
    var isMultiline = false;
    var ruleType;
    var id;
    try
    {
        _rule = obj
    }
    catch (ex) {
        $.log('Error attempting to populate page from rule XML.');
        if (ex.stack) {
            $.log(ex);
        }
    }
}

var getRule = function () {
    var ruleId = $('#ruleId').val();
    var overlay;

    overlay = $('#rule_edit_block');
    overlay.addBlockOverlay();

    $.ajax({
        url: '/api/customRuleDetail.aspx',
        data: { 'ruleId': ruleId },
        success: initPageFromRule,
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

$(document).ready(function () {
    channelId = $('#channelId').val();
    getRule();
});