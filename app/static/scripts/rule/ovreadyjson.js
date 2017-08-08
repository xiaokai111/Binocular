objectvideo.ovreadyJSON = {};
var _timeDifference = 480;
(function ($) {
    function rule()
    {
        var that = {};
        var typeName = 'rule';
        var id = '';
        var name = '';
        var isActive = false;
        var viewInfoItem = null;
        var eventDefinition = null;
        var responseDefinition = null;
        var schedule = null;
        var ruleLink = null;
        function fromJSON(json)
        {
        }
        function toJSON(json)
        {
        }
        that.typeOf = typeName;
        that.id = id;
        that.name = name;
        that.isActive = isActive;
        that.viewInfoItem = viewInfoItem;
        that.eventDefinition = eventDefinition;
        that.responseDefinition = responseDefinition;
        that.schedule = schedule;
        // Expose public methods
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;
        that.ruleLink = ruleLink;
        return that;
    }

    function ruleFactory(json)
    {
        var obj = null;
        if (xml !== undefined && xml !== null)
        {
            try
            {
                obj = rule();
                obj.fromJSON(json);
            }
            catch (ex)
            {
                $.log('Error creating rule from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }
    }
})(jQuery);