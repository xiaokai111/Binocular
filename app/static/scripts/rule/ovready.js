/**
 * "The Software contains copyright protected material, trade secrets and other proprietary information
 * and material of ObjectVideo, Inc. and/or its licensor(s), if any, and is protected by copyright laws,
 * international copyright treaties and trade secret laws, as well as other intellectual property laws and
 * treaties. One or more claims of U.S. Patent Nos. 6,696,945, 6,970,083, 6,954,498, 6,625,310, 7,224,852,
 * 7,424,175, 6,687,883, 6,999,600, 7,424,167, 7,391,907 may apply to this Software."
 */

/**
 * ovready.js
 */

// Declare the ovready module object.
objectvideo.ovready = {};
var _timeDifference=480;
(function ($) {

    //-------- Module Helper Functions --------//

    /**
     * Convert the given xml string to a JSXB object and verify the root tag name.
     *
     * @param {Object|String} xml A given xml string or a JSXB object.
     * @param {String} rootName The root tag name.
     * @return {Object} A JSXB object.
     */
    function getRootNode(xml, rootName) {
        var root = null;

        if (typeof xml === 'undefined' || xml === null) {
            throw new Error('Invalid argument: xml');
        }
        else if (rootName === undefined || (typeof rootName) !== 'string' || rootName === '') {
            throw new Error('Invalid argument: rootName');
        }
        else if (typeof xml === 'string') {
            if (xml === '') {
                throw new Error('Invalid argument: xml (empty string)');
            }
            else {
                root = $.xml2json(xml, true);
                if (root === null || root.rootName !== rootName) {
                    throw new Error('Invalid ' + rootName + ' xml');
                }
            }
        }
        else {
            root = xml;
        }

        return root;
    }

    //
    // Compare two objectvideo.ovready objects by callig the equals method.
    //
    // @param lhs An objectvideo.ovready object.
    // @param rhs An objectvideo.ovready object.
    // @return {Boolean} True if both objects are equal; otherwise, false.
    //
    function objectMatch(lhs, rhs) {
        var retVal = true;

        if (lhs === undefined || rhs === undefined ||
            (typeof lhs) !== 'object' || (typeof rhs) !== 'object') {
            throw new Error('Invalid Argument: lhs and/or rhs');
        }

        if (lhs === rhs) {
            // covers following situations:
            // (lhs === null && rhs === null), and
            // lhs object is rhs object
            retVal = true;
        }
        else if (lhs.typeOf !== rhs.typeOf) {
            retVal = false;
        }
        else {
            retVal = lhs.equals(rhs);
        }

        return retVal;
    }

    //
    // Compare two array objects.
    //
    // @param lhs An array object.
    // @param rhs An array object.
    // @param useEquals Indication of using equals method for comparing.
    // @return {Boolean} True if both array objects are equal; otherwise, false.
    // @remarks The useEquals flag is mainly for objectvideo.ovready objects.
    //
    function arrayMatch(lhs, rhs, useEquals) {
        var retVal = true;
        var i = 0;

        if (typeof useEquals !== 'boolean') {
            useEquals = false;
        }
        lhs.sort();
        rhs.sort();

        if (lhs.length !== rhs.length) {
            retVal = false;
        }
        else if (useEquals === true) {
            for (i = 0; i < lhs.length; i += 1) {
                if (lhs[i].typeOf !== rhs[i].typeOf || ! lhs[i].equals(rhs[i])) {
                    retVal = false;
                    break;
                }
            }
        }
        else {
            for (i = 0; i < lhs.length; i += 1) {
                if (lhs[i] !== rhs[i]) {
                    retVal = false;
                    break;
                }
            }
        }

        return retVal;
    }

    //
    // Compare two associative array objects. Similar to arrayMatch(), except that
    // associativeArrayMatch() does not specify the useEquals flag - instead it
    // dynamically determines for each value whether it supports equals(), and will
    // use equals() only if it is supported.
    //
    // @param lhs An associative array object.
    // @param rhs An associative array object.
    // @return {Boolean} True if both array objects are equal; otherwise, false.
    //
    function associativeArrayMatch(lhs, rhs) {
        var retVal = true;
        var i = 0;
        var key;

        // first, check if each value for each key in lhs matches the same
        // value for that same key in rhs
        var lhsCount = 0;
        for (key in lhs) {
            lhsCount++;
            if (!rhs[key]) {
                // if rhs has no value for this key, obviously the arrays do not match
                retVal = false;
                break;
            }

            if (lhs[key].equals !== undefined) {
                if (lhs[key].typeOf !== rhs[key].typeOf || !lhs[key].equals(rhs[key])) {
                    retVal = false;
                    break;
                }
            }
            else {
                if (lhs[key] !== rhs[key]) {
                    retVal = false;
                    break;
                }
            }
        }

        // assuming we passed this much, compare the sizes of the arrays
        var rhsCount = 0;
        for (key in rhs) {
            rhsCount++;
        }

        if (lhsCount != rhsCount) {
            retVal = false;
        }

        return retVal;
    }

    //
    // Convert the given value to a boolean value.
    //
    // @param value A given value.
    // @param defaultValue the default value (optional argument).
    // @return {Boolean} A valid boolen value.
    //
    function toBoolean(value, defaultValue) {
        var retVal = false;

        if (defaultValue !== undefined && (typeof defaultValue) !== 'boolean') {
            throw new Error('Invalid argument (defaultValue) type: ', defaultValue);
        }

        //boolean
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'false') {
                retVal = false;
            }
            else if (value.toLowerCase() === 'true') {
                retVal = true;
            }
            else if (defaultValue !== undefined) {
                retVal = defaultValue;
            }
            else {
                throw new Error("Invalid boolean value");
            }
        }
        else {
            retVal = Boolean(value);
        }

        return retVal;
    }

    /**
     * Convert the given text bool tag to a boolean value.
     *
     * @param {String} value A given bool tag value.
     * @param {Boolean} defaultValue the default value (optional argument).
     * @return {Boolean} retVal Return value of true or false
     */
    function boolTagToBoolean(value, defaultValue) {
        var retVal = defaultValue;

        if (value.text !== undefined) {
            retVal = toBoolean(value.text, defaultValue);
        }

        return retVal;
    }

    /**
     * Convert the given node to width and height members.
     *
     * @param {Object} node A JSXB object containing width and height
     * @param {Object} output Object with width and height elements
     */
    function convertNodeWidthHeight(node, output) {
        // Tag: Width (must be an integer)
        if (isNaN(node.Width[0].text)) {
            throw new Error('Invalid Width: ' + node.Width[0].text);
        }
        else {
            output.width = parseInt(node.Width[0].text, 10);
        }

        // Tag: Height (must be an integer)
        if (isNaN(node.Height[0].text)) {
            throw new Error('Invalid Height: ' + node.Height[0].text);
        }
        else {
            output.height = parseInt(node.Height[0].text, 10);
        }
    }

    //-------- OV Ready Objects --------//

    //
    // OV Ready module constants
    //
    var specVersion = '1.1.1'; // Specification version

    var specRequiredVersion = /^1\.1/;

    var xmlDeclaration = '<?xml version="1.0" encoding="utf-8"?>';

    var xmlnsAttr = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.objectvideo.com/schemas/ovready"';

    var xmlnsXLink = 'xmlns:xlink="http://www.w3.org/1999/xlink"';

    var xsiType = 'xsi:type="';

    var xlinkSimple = 'xlink:type="simple" xlink:href="';

    //-------- OV Ready: Enumerations --------//

    var eventDefinitionTypes = {
        AreaOfInterestEventDefinition: 'AreaOfInterestEventDefinition',
        CameraTamperEventDefinition: 'CameraTamperEventDefinition',
        CountingAreaOfInterestEventDefinition: 'CountingAreaOfInterestEventDefinition',
        SimpleAreaOfInterestEventDefinition: 'SimpleAreaOfInterestEventDefinition',
        FullFrameEventDefinition: 'FullFrameEventDefinition',
        MultiLineTripwireEventDefinition: 'MultiLineTripwireEventDefinition',
        TripwireEventDefinition: 'TripwireEventDefinition'
    };

    var eventDefObjectTypes = {
        areaOfInterestEventDefinition: 'areaOfInterestEventDefinition',
        cameraTamperEventDefinition: 'cameraTamperEventDefinition',
        countingAreaOfInterestEventDefinition: 'countingAreaOfInterestEventDefinition',
        simpleAreaOfInterestEventDefinition: 'simpleAreaOfInterestEventDefinition',
        fullFrameEventDefinition: 'fullFrameEventDefinition',
        multiLineTripwireEventDefinition: 'multiLineTripwireEventDefinition',
        tripwireEventDefinition: 'tripwireEventDefinition'
    };

    //
    // aoiActions enumeration.
    //
    var aoiActions = {
        EnterAreaAction: 'EnterAreaAction',
        ExitAreaAction: 'ExitAreaAction',
        AppearAreaAction: 'AppearAreaAction',
        DisappearAreaAction: 'DisappearAreaAction',
        InsideAreaAction: 'InsideAreaAction',
        TakeAwayAreaAction: 'TakeAwayAreaAction',
        LeaveBehindAreaAction: 'LeaveBehindAreaAction',
        LoiterAreaAction: 'LoiterAreaAction'
    };

    //
    // aoiCountingActions enumeration.
    //
    var aoiCountingActions = { OccupancyDataAreaAction: 'OccupancyDataAreaAction',
        OccupancyThresholdAreaAction: 'OccupancyThresholdAreaAction',
        DwellDataAreaAction: 'DwellDataAreaAction',
        DwellThresholdAreaAction: 'DwellThresholdAreaAction' };

    //
    // simpleAoiActions enumeration.
    //
    var simpleAoiActions = {
        DensityAreaAction: 'DensityAreaAction'
    };

    //
    // AuthenticationTypes enumeration.
    //
    var authenticationTypes = { None: 'None', HTTPBasic: 'HTTPBasic', OVSimple: 'OVSimple' };

    //
    // channelOperations enumeration.
    //
    var channelOperations = { Reset: 'Reset' };

    //
    // classifications enumeration.
    //
    var classifications = { Human: 'Human',
        Vehicle: 'Vehicle',
        Unknown: 'Unknown',
        Anything: 'Anything' };

    //
    // comparators enumeration.
    //
    var comparators = { Equal: 'Equal',
        GreaterThanOrEqual: 'GreaterThanOrEqual',
        LessThanOrEqual: 'LessThanOrEqual' };

    /**
     * DensityAreaAction Level enumeration
     */
    var densityActionLevels = {
        Low: 'Low',
        MediumOrLow: 'MediumOrLow',
        Medium: 'Medium',
        MediumOrHigh: 'MediumOrHigh',
        High: 'High'
    };

    //
    // contentTransferEncodings enumeration.
    //
    var contentTransferEncodings = { x_identity: 'x-identity',
        x_deflate: 'x-deflate',
        x_xml_token: 'x-xml-token',
        x_xml_token_deflate: 'x-xml-token-deflate' };

    //
    // eventPushReceiverTypes enumeration.
    //
    var eventPushReceiverTypes = { HTTPXMLEventPushReceiver: 'HTTPXMLEventPushReceiver',
        HTTPSXMLEventPushReceiver: 'HTTPSXMLEventPushReceiver' };

    //
    // eventPushModes enumeration.
    //
    var eventPushModes = { Failover: 'Failover',
        Redundancy: 'Redundancy' };

    //
    // countRuleTypes enumeration.
    //
    var countRuleTypes = { TriggeredRule: 'TriggeredRule',
        OccupancyDataRule: 'OccupancyDataRule',
        DwellDataRule: 'DwellDataRule' };

    //
    // DataFormatTypes enumeration.
    //
    var dataFormatTypes = { XML: 'XML' };

    //
    // dateTimeConfigurationTypes enumeration.
    //
    var dateTimeConfigurationTypes = { ManualDateTimeConfiguration: 'ManualDateTimeConfiguration',
        NTPDateTimeConfiguration: 'NTPDateTimeConfiguration' };

    //
    // dateTimeFormats enumeration.
    //
    var dateTimeFormats = { Default: 'Default' };

    //
    // deviceOperations enumeration.
    //
    var deviceOperations = { Reset: 'Reset' };

    //
    // deviceStatuses enumeration.
    //
    var deviceStatuses = { OK: 'OK', WARNING: 'WARNING', ERROR: 'ERROR' };

    //
    // filterTypes enumeration.
    //
    var filterTypes = { MinimumSizeFilter: 'MinimumSizeFilter',
        MaximumSizeFilter: 'MaximumSizeFilter',
        SizeChangeFilter: 'SizeChangeFilter',
        ShapeAndDirectionFilter: 'ShapeAndDirectionFilter' };

    //
    // lineCrossingOrders enumeration.
    //
    var lineCrossingOrders = { BeforeOrAfter: 'BeforeOrAfter', Before: 'Before' };

    //
    // passwordSchemes enumeration.
    //
    var passwordSchemes = { Basic: 'Basic', Encrypted: 'Encrypted' };

    //
    // planeTypes enumeration.
    //
    var planeTypes = { Ground: 'Ground', Image: 'Image' };

    //
    // TransportTypes enumeration.
    //
    var transportTypes = { HTTP: 'HTTP', HTTPS: 'HTTPS' };

    //
    // tripwireDirections enumeration.
    //
    var tripwireDirections = { LeftToRight: 'LeftToRight',
        RightToLeft: 'RightToLeft',
        AnyDirection: 'AnyDirection' };

    //
    // ViewStates enumeration.
    //
    var viewStates = {    BadSignal: 'BadSignal',
        UnknownView: 'UnknownView',
        KnownView: 'KnownView',
        SearchingForView: 'SearchingForView' };

    //-------- Enum Helper Functions --------//

    //
    // Validate and convert Classification value
    //
    // @param value A tag or attribute value
    // @return A valid value with correct type.
    // @remarks The value shall be one of the Classifications enum.
    //
    function validateClassificationValue(value) {
        if (value !== classifications.Human &&
            value !== classifications.Vehicle &&
            value !== classifications.Unknown &&
            value !== classifications.Anything) {
            throw new Error('Invalid Classification value: ' + value);
        }

        return value;
    }

    //
    // Validate and convert PlaneType value
    //
    // @param value A tag or attribute value
    // @return A valid value with correct type.
    // @remarks The value shall be one of the PlaneTypes enum.
    //
    function validatePlaneTypeValue(value) {
        if (value !== planeTypes.Ground &&
            value !== planeTypes.Image) {
            throw new Error('Invalid PlaneType value: ' + value);
        }

        return value;
    }

    //
    // Validate and convert TripwireDirection value
    //
    // @param value A tag or attribute value
    // @return A valid value with correct type.
    // @remarks The value shall be one of the tripwireDirections enum.
    //
    function validateTripwireDirectionValue(value) {
        if (value !== tripwireDirections.LeftToRight &&
            value !== tripwireDirections.RightToLeft &&
            value !== tripwireDirections.AnyDirection) {
            throw new Error('Invalid TripwireDirection value: ' + value);
        }

        return value;
    }

    //-------- OV Ready: Geometric Objects --------//

    //
    // Point object constructor (PointF)
    //
    function point(x, y) {
        // Base object inherits from objectvideo.geometry.createPoint
        var that = objectvideo.geometry.createPoint(x || 0.0, y || 0.0);
        that.typeOf = 'point';

        //-------- Public Methods --------//

        // Override the equals method
        that.baseEquals = that.equals;

        that.equals = function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (this === obj) {
                retVal = true;
            }
            else if (! obj.hasOwnProperty('typeOf') || obj.typeOf !== this.typeOf) {
                retVal = false;
            }
            else {
                retVal = this.baseEquals(obj);
            }

            return retVal;
        };

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            fromXMLNode(xml, 'Point');
        }

        function fromXMLNode(xml, rootName) {
            var root = null;

            // Tag: Point
            root = getRootNode(xml, rootName);

            // Tag: X (must be a number)
            if (isNaN(root.X[0].text)) {
                throw new Error('Invalid X: ' + root.X[0].text);
            }
            else {
                that.x = parseFloat(root.X[0].text);
            }

            // Tag: Y (must be a number)
            if (isNaN(root.Y[0].text)) {
                throw new Error('Invalid Y: ' + root.Y[0].text);
            }
            else {
                that.y = parseFloat(root.Y[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return toXMLNode('Point');
        }

        function toXMLNode(nodeName) {
            var xml = '';

            xml += '<' + nodeName + '>';
            xml += '<X>' + that.x + '</X>';
            xml += '<Y>' + that.y + '</Y>';
            xml += '</' + nodeName + '>';

            return xml;
        }

        // Expose public methods
        that.fromXML = fromXML;
        that.fromXMLNode = fromXMLNode;
        that.toXML = toXML;
        that.toXMLNode = toXMLNode;

        return that;
    }

    function pointJSON(x, y) {
        // Base object inherits from objectvideo.geometry.createPoint
        var that = objectvideo.geometry.createPoint(x || 0.0, y || 0.0);
        that.typeOf = 'point';

        //-------- Public Methods --------//

        // Override the equals method
        that.baseEquals = that.equals;

        that.equals = function equals(obj) {
        };

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            fromJSONNode(json, 'Point');
        }

        function fromJSONNode(root) {
            // Tag: Point      
            // Tag: X (must be a number)
            if (isNaN(root.X)) {
                throw new Error('Invalid X: ' + root.X);
            }
            else {
                that.x = parseFloat(root.X);
            }

            // Tag: Y (must be a number)
            if (isNaN(root.Y)) {
                throw new Error('Invalid Y: ' + root.Y);
            }
            else {
                that.y = parseFloat(root.Y, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toJSON() {
            return toJSONNode('Point');
        }

        function toJSONNode(nodeName) {
        }

        // Expose public methods
        that.fromJSON = fromJSON;
        that.fromJSONNode = fromJSONNode;
        that.toJSON = toJSON;
        that.toJSONNode = toJSONNode;

        return that;
    }

    // TODO: Document the function parameterSliderList
    function parameterSliderList() {
        var that = {};
        var typeName = 'parameterSliderList';
        var sliderList = [];

        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.sliderList, obj.sliderList, true)) {
                retVal = false;
            }

            return retVal;
        }

        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: ParameterSliders
            root = getRootNode(xml, 'ParameterSliders');

            // Tag: SliderSummary
            that.sliderList = []; // clean-out the array
            node = root.SliderSummary;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = parameterSliderSummary();
                    obj.fromXML(node[i]);
                    that.sliderList.push(obj);
                }
            }
        }

        function toXML() {
            // TBD
        }

        // Expose public fields
        that.typeOf = typeName;
        that.sliderList = sliderList;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }


    // TODO: Document the function parameterSlider
    function parameterSlider() {
        var that = {}; // base object
        var typeName = 'parameterSlider'; // object type name
        var sliderType = '';
        var currentPosition = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two parameterSlider objects have the same value
        //
        // @param obj A parameterSlider object
        // @return {Boolean} True if obj is an instance of parameterSlider and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.sliderType !== obj.sliderType ||
                that.currentPosition !== obj.currentPosition) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: RuleSummary
            root = getRootNode(xml, 'ParameterSlider');

            // Tag: Type
            if (root.Type[0].text !== undefined) {
                that.sliderType = root.Type[0].text;
            }

            // Tag: CurrentPosition (must be a number)
            if (isNaN(root.CurrentPosition[0].text)) {
                throw new Error('Invalid CurrentPosition: ' + root.CurrentPosition[0].text);
            }
            else {
                that.currentPosition = parseFloat(root.CurrentPosition[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;

            xml += '<ParameterSlider ' + xmlnsAttr + '>';
            xml += '<Type>' + that.type + '</Type>';
            xml += '<CurrentPosition>' + that.currentPosition + '</CurrentPosition>';
            xml += '</ParameterSlider>';

            return xml;

        }

        // Expose public fields
        that.typeOf = typeName;
        that.sliderType = sliderType;
        that.currentPosition = currentPosition;
        // Expose public methods
        that.equals = equals;
        that.toXML = toXML;
        that.fromXML = fromXML;

        return that;
    }


    // TODO: Document the function parameterSliderSummary
    function parameterSliderSummary() {
        var that = {}; // base object
        var typeName = 'parameterSliderSummary'; // object type name
        var sliderType = '';
        var isEnabled = false;
        var requiresRestart = false;
        var currentPosition = 0;
        var defaultPosition = 0;
        var maximumPosition = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two parameterSlider objects have the same value
        //
        // @param obj A parameterSlider object
        // @return {Boolean} True if obj is an instance of parameterSlider and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.sliderType !== obj.sliderType ||
                that.isEnabled !== obj.isEnabled ||
                that.requiresRestart !== obj.requiresRestart ||
                that.currentPosition !== obj.currentPosition ||
                that.defaultPosition !== obj.defaultPosition ||
                that.maximumPosition !== obj.maximumPosition) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: SliderSummary
            root = getRootNode(xml, 'SliderSummary');

            // Tag: Type
            if (root.Type[0].text !== undefined) {
                that.sliderType = root.Type[0].text;
            }

            // Tag: IsEnabled
            that.isEnabled = toBoolean(root.IsEnabled[0].text, false);

            // Tag: RequiresRestart
            that.requiresRestart = toBoolean(root.RequiresRestart[0].text, false);

            // Tag: CurrentPosition (must be a number)
            if (isNaN(root.CurrentPosition[0].text)) {
                throw new Error('Invalid CurrentPosition: ' + root.CurrentPosition[0].text);
            }
            else {
                that.currentPosition = parseFloat(root.CurrentPosition[0].text, 10);
            }

            // Tag: DefaultPosition (must be a number)
            if (isNaN(root.DefaultPosition[0].text)) {
                throw new Error('Invalid DefaultPosition: ' + root.DefaultPosition[0].text);
            }
            else {
                that.defaultPosition = parseFloat(root.DefaultPosition[0].text, 10);
            }

            // Tag: MaximumPosition (must be a number)
            if (isNaN(root.MaximumPosition[0].text)) {
                throw new Error('Invalid MaximumPosition: ' + root.MaximumPosition[0].text);
            }
            else {
                that.maximumPosition = parseFloat(root.MaximumPosition[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            // TBD
        }

        // Expose public fields
        that.typeOf = typeName;
        that.sliderType = sliderType;
        that.currentPosition = currentPosition;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    //
    // Rect object constructor (RectF)
    //
    function rect() {
        // Base object inherits from objectvideo.geometry.createRectangle
        var that = objectvideo.geometry.createRectangle();
        that.typeOf = 'rect'; // object type name

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        // Override equals
        that.baseEquals = that.equals;

        //
        // Determines whether two rect objects have the same value
        //
        // @param obj A rect object
        // @return {Boolean} True if obj is an instance of rect and
        //         its value is the same as this instance; otherwise, false.
        //
        that.equals = function equals(obj) {
            var retVal = true;

            if (! obj) {
                retVal = false;
            }
            else if (this === obj) {
                retVal = true;
            }
            else if (! obj.hasOwnProperty('typeOf') || obj.typeOf !== this.typeOf) {
                retVal = false;
            }
            else {
                retVal = this.baseEquals(obj);
            }

            return retVal;
        };


        function copy(r) {
            if (r) {
                this.x = r.x;
                this.y = r.y;
                this.width = r.width;
                this.height = r.height;
            }
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @param nodeName The name of the root node.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXMLNode(xml, nodeName) {
            var root = null;

            root = getRootNode(xml, nodeName);

            // Tag: X (must be a number)
            if (isNaN(root.X[0].text)) {
                throw new Error('Invalid X: ' + root.X[0].text);
            }
            else {
                that.x = parseFloat(root.X[0].text);
            }

            // Tag: Y (must be a number)
            if (isNaN(root.Y[0].text)) {
                throw new Error('Invalid Y: ' + root.Y[0].text);
            }
            else {
                that.y = parseFloat(root.Y[0].text, 10);
            }

            // Tag: Width (must be a number)
            if (isNaN(root.Width[0].text)) {
                throw new Error('Invalid Width: ' + root.Width[0].text);
            }
            else {
                that.width = parseFloat(root.Width[0].text);
            }

            // Tag: Height (must be a number)
            if (isNaN(root.Height[0].text)) {
                throw new Error('Invalid Height: ' + root.Height[0].text);
            }
            else {
                that.height = parseFloat(root.Height[0].text);
            }
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            // Tag: Rect
            fromXMLNode(xml, 'Rect');
        }

        function fromJson(json){
            that.x = parseFloat(json.X);
            that.y=parseFloat(json.Y)
            that.width=parseFloat(json.Width)
            that.height=parseFloat(json.Height)
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXMLNode(nodeName) {
            var xml = '';

            xml += '<' + nodeName + '>';
            xml += '<X>' + that.x + '</X>';
            xml += '<Y>' + that.y + '</Y>';
            xml += '<Width>' + that.width + '</Width>';
            xml += '<Height>' + that.height + '</Height>';
            xml += '</' + nodeName + '>';

            return xml;
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return toXMLNode('Rect');
        }

        // Expose public methods
        that.copy = copy;
        that.fromXMLNode = fromXMLNode;
        that.fromXML = fromXML;
        that.toXMLNode = toXMLNode;
        that.toXML = toXML;
        that.fromJson=fromJson;

        return that;
    }

    //
    // NearRectangle object constructor (RectF)
    //
    function nearRectangle() {
        // Inherit from rect() object.
        var that = rect();

        that.typeOf = 'nearRectangle'; // Override object type name

        // Override XML deserialization
        that.fromXML = function(xml) {
            that.fromXMLNode(xml, 'NearRectangle');
        };

        // Override XML serialization
        that.toXML = function() {
            return that.toXMLNode('NearRectangle');
        };

        that.clone = function() {
            var r = nearRectangle();
            r.copy(this);
            return r;
        };

        return that;
    }

    //
    // FarRectangle object constructor (RectF)
    //
    function farRectangle() {
        // Inherit from rect() object.
        var that = rect();

        that.typeOf = 'farRectangle'; // Override object type name

        // Override XML deserialization
        that.fromXML = function(xml) {
            that.fromXMLNode(xml, 'FarRectangle');
        };

        // Override XML serialization
        that.toXML = function() {
            return that.toXMLNode('FarRectangle');
        };

        that.clone = function() {
            var r = farRectangle();
            r.copy(this);
            return r;
        };

        return that;
    }

    function midRectangle() {
        // Inherit from rect() object.
        var that = rect();

        that.typeOf = 'midRectangle'; // Override object type name

        // Override XML deserialization
        that.fromXML = function(xml) {
            that.fromXMLNode(xml, 'MidRectangle');
        };

        // Override XML serialization
        that.toXML = function() {
            return that.toXMLNode('MidRectangle');
        };

        that.clone = function() {
            var r = midRectangle();
            r.copy(this);
            return r;
        };

        return that;
    }

    //-------- OV Ready: Protocol --------//

    //
    // Transport object constructor
    //
    function transport() {
        var that = {}; // base object
        var typeName = 'transport'; // object type name
        var type = transportTypes.HTTP;
        var port = 80;

        //-------- Private Methods --------//

        //
        // Validate and convert type value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the transportTypes enum.
        //
        function validateTypeValue(value) {
            if (value !== transportTypes.HTTP &&
                value !== transportTypes.HTTPS) {
                throw new Error('Invalid Type value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two transport objects have the same value
        //
        // @param obj A transport object
        // @return {Boolean} True if obj is an instance of transport and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.type !== obj.type || that.port !== obj.port) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Transport
            root = getRootNode(xml, 'Transport');

            // Tag: Type (must be a transportTypes)
            that.type = validateTypeValue(root.Type[0].text);

            // Tag: Port (must be an integer)
            if (isNaN(root.Port[0].text)) {
                throw new Error('Invalid Port: ' + root.Port[0].text);
            }
            else {
                that.port = parseInt(root.Port[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Transport>';
            xml += '<Type>' + that.type + '</Type>';
            xml += '<Port>' + that.port + '</Port>';
            xml += '</Transport>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.type = type;
        that.port = port;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // OVReadyProtocol object constructor
    //
    function ovreadyProtocol() {
        var that = {}; // base object
        var typeName = 'ovreadyProtocol';     // object type name
        var protocolVersion = specVersion;
        var root = '';
        var supportedDataFormats = [];         // dataFormatTypes []
        var supportedTransports = [];         // transport []
        var supportedAuthentications = [];    // authenticationTypes []

        //-------- Private Methods --------//

        //
        // Validate and convert DataFormate value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the dataFormatTypes enum.
        //
        function validateDataFormetValue(value) {
            if (value !== dataFormatTypes.XML) {
                throw new Error('Invalid dataFormatTypes value: ' + value);
            }

            return value;
        }

        //
        // Validate and convert Authentication value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the authenticationTypes enum.
        //
        function validateAuthenticationValue(value) {
            if (value !== authenticationTypes.None &&
                value !== authenticationTypes.HTTPBasic &&
                value !== authenticationTypes.OVSimple) {
                throw new Error('Invalid authenticationTypes value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two ovreadyProtocol objects have the same value
        //
        // @param obj A arrayOfDataFormatTypes object
        // @return {Boolean} True if obj is an instance of arrayOfDataFormatTypes and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.protocolVersion !== obj.protocolVersion) {
                retVal = false;
            }
            else if (that.root !== obj.root) {
                retVal = false;
            }
            else if (! arrayMatch(that.supportedDataFormats, obj.supportedDataFormats)) {
                retVal = false;
            }
            else if (! arrayMatch(that.supportedTransports, obj.supportedTransports, true)) {
                retVal = false;
            }
            else if (! arrayMatch(that.supportedAuthentications, obj.supportedAuthentications)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string).
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: OVReadyProtocol
            root = getRootNode(xml, 'OVReadyProtocol');

            // Tag: ProtocolVersion
            that.protocolVersion = root.ProtocolVersion[0].text;
            if (! specRequiredVersion.test(that.protocolVersion)) {
                throw new Error('Invalid ProtocolVersion: ' + that.protocolVersion);
            }

            // Tag: Root
            if (root.Root[0].text !== undefined) {
                that.root = root.Root[0].text;
            }

            // Tag: SupportedDataFormats
            that.supportedDataFormats = []; // clean-out the array
            node = root.SupportedDataFormats[0].DataFormat;
            if (node === undefined) {
                throw new Error('Missing tag: SupportedDataFormats');
            }
            for (i = 0; i < node.length; i += 1) {
                // Tag: DataFormat
                that.supportedDataFormats.push(
                    validateDataFormetValue(node[i].text));
            }

            // Tag: SupportedTransports
            that.supportedTransports = []; // clean-out the array
            node = root.SupportedTransports[0].Transport;
            if (node === undefined) {
                throw new Error('Missing tag: SupportedTransports');
            }
            for (i = 0; i < node.length; i += 1) {
                // Tag: Transport
                obj = transport();
                obj.fromXML(node[i]);
                that.supportedTransports.push(obj);
            }

            // Tag: SupportedAuthentications
            that.supportedAuthentications = []; // clean-out the array
            node = root.SupportedAuthentications[0].Authentication;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    // Tag: Authentication
                    that.supportedAuthentications.push(
                        validateAuthenticationValue(node[i].text));
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<OVReadyProtocol ' + xmlnsAttr + '>';
            xml += '<ProtocolVersion>' + that.protocolVersion + '</ProtocolVersion>';
            xml += '<Root>' + that.root + '</Root>';
            xml += '<SupportedDataFormats>';
            for (i = 0; i < that.supportedDataFormats.length; i += 1) {
                xml = xml + '<DataFormat>' + that.supportedDataFormats[i] + '</DataFormat>';
            }
            xml += '</SupportedDataFormats>';
            xml += '<SupportedTransports>';
            for (i = 0; i < that.supportedTransports.length; i += 1) {
                xml += that.supportedTransports[i].toXML();
            }
            xml += '</SupportedTransports>';
            xml += '<SupportedAuthentications>';
            for (i = 0; i < that.supportedAuthentications.length; i += 1) {
                xml = xml + '<Authentication>' + that.supportedAuthentications[i] + '</Authentication>';
            }
            xml += '</SupportedAuthentications>';
            xml += '</OVReadyProtocol>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.protocolVersion = protocolVersion;
        that.root = root;
        that.supportedDataFormats = supportedDataFormats;
        that.supportedTransports = supportedTransports;
        that.supportedAuthentications = supportedAuthentications;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //-------- OV Ready: Channel --------//

    //
    // SupportedTamperOptions constructor
    //
    function supportedTamperOptions() {
        var that = {};
        var typeName = 'supportedTamperOptions';

        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml){
            var root = null;

            // Tag: Options
            root = getRootNode(xml, 'Options');
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    function supportedTamperOptionsJSON()
    {
        var that = {};
        var typeName = 'supportedTamperOptions';

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            var root = null;

            // Tag: Options
            root = json;
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        // Expose public methods  
        that.fromJSON = fromJSON;

        return that;
    }

    //
    // SupportedTripwireOptions constructor
    //
    function supportedTripwireOptions() {
        var that = {};
        var typeName = 'supportedTripwireOptions';
        var maxPoints = 0;
        var supportedClassifications = [];

        function supportedTripwireEquals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.maxPoints !== obj.maxPoints ||
                !arrayMatch(that.supportedClassifications, obj.supportedClassifications)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedTripwireXML(xml){
            var root = null;
            var node;
            var classificationCount;

            // Tag: Options
            root = getRootNode(xml, 'Options');

            // Tag: MaxPoints
            if (isNaN(root.MaxPoints[0].text)) {
                throw new Error('Invalid MaxPoints: ' + root.MaxPoints[0].text);
            }
            else {
                that.maxPoints = parseInt(root.MaxPoints[0].text, 10);
            }

            // Tag: SupportedClassifications
            that.supportedClassifications = [];
            if (root.SupportedClassifications !== undefined &&
                root.SupportedClassifications.length > 0 &&
                root.SupportedClassifications[0].Classification !== undefined &&
                root.SupportedClassifications[0].Classification.length > 0) {
                // Tag: Classification
                node = root.SupportedClassifications[0].Classification;
                for (classificationCount = 0; classificationCount < node.length; classificationCount += 1) {
                    that.supportedClassifications.push(validateClassificationValue(node[classificationCount].text));
                }
            }

            return root;
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxPoints = maxPoints;
        that.supportedClassifications = supportedClassifications;
        // Expose public methods
        that.equals = supportedTripwireEquals;
        that.fromXML = fromSupportedTripwireXML;

        return that;
    }

    function supportedTripwireOptionsJSON()
    {
        var that = {};
        var typeName = 'supportedTripwireOptions';
        var maxPoints = 0;
        var supportedClassifications = [];

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedTripwireJSON(json) {
            var root = json;
            var node;
            var classificationCount;

            // Tag: Options          

            // Tag: MaxPoints
            if (isNaN(json.MaxPoints)) {
                throw new Error('Invalid MaxPoints: ' + json.MaxPoints);
            }
            else {
                that.maxPoints = parseInt(json.MaxPoints, 10);
            }

            // Tag: SupportedClassifications
            that.supportedClassifications = [];
            if (json.SupportedClassifications !== undefined &&
                json.SupportedClassifications.Classification !== undefined &&
                json.SupportedClassifications.Classification.length > 0) {
                // Tag: Classification
                node = json.SupportedClassifications.Classification;
                for (classificationCount = 0; classificationCount < node.length; classificationCount += 1) {
                    that.supportedClassifications.push(validateClassificationValue(node[classificationCount]));
                }
            }

            return root;
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxPoints = maxPoints;
        that.supportedClassifications = supportedClassifications;
        // Expose public methods    
        that.fromJSON = fromSupportedTripwireJSON;

        return that;
    }

    //
    // SupportedMultilineTripwireOptions constructor
    //
    function supportedMultilineTripwireOptions() {
        // Inherit from supportedTripwireOptions
        var that = supportedTripwireOptions();
        var typeName = 'supportedMultilineTripwireOptions';
        var maxLines = 0;
        var _baseEquals = that.equals;
        var _baseFromXML = that.fromXML;

        function supportedMultilineTripwireXMLEquals(obj) {
            return _baseEquals(obj) && (that.maxLines === obj.maxLines);
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedMultilineTripwireXML(xml) {
            var root = _baseFromXML(xml);

            // Tag: MaxLines
            if (isNaN(root.MaxLines[0].text)) {
                throw new Error('Invalid MaxLines: ' + root.MaxLines[0].text);
            }
            else {
                that.maxLines = parseInt(root.MaxLines[0].text, 10);
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxLines = maxLines;
        // Expose public methods
        that.equals = supportedMultilineTripwireXMLEquals;
        that.fromXML = fromSupportedMultilineTripwireXML;

        return that;
    }

    function supportedMultilineTripwireOptionsJSON()
    {
        var that = supportedTripwireOptionsJSON();
        var typeName = 'supportedMultilineTripwireOptions';
        var maxLines = 0;
        var _baseFromJSON = that.fromJSON;

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedMultilineTripwireJSON(json) {
            var root = _baseFromJSON(json);

            // Tag: MaxLines
            if (isNaN(root.MaxLines)) {
                throw new Error('Invalid MaxLines: ' + root.MaxLines);
            }
            else {
                that.maxLines = parseInt(root.MaxLines, 10);
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxLines = maxLines;
        // Expose public methods     
        that.fromJSON = fromSupportedMultilineTripwireJSON;

        return that;
    }

    //
    // supportedDensityOptions
    //
    function supportedDensityOptions() {
        // Inherit from supportedTripwireOptions
        var that = supportedTripwireOptions();
        var typeName = 'SupportedDensityOptions';
        var supportedActions = [];
        var _baseEquals = that.equals;
        var _baseFromXML = that.fromXML;

        function supportedDensityXMLEquals(obj) {
            return _baseEquals(obj) &&
                arrayMatch(that.supportedActions, obj.supportedActions);
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedDensityXMLEqualsXML(xml) {
            var root = _baseFromXML(xml);
            var actionNode, actionCount;

            // Tag: SupportedActions
            that.supportedActions = [];
            if (root.SupportedActions !== undefined &&
                root.SupportedActions.length > 0 &&
                root.SupportedActions[0].Action !== undefined &&
                root.SupportedActions[0].Action.length > 0) {
                // Tag: Action
                actionNode = root.SupportedActions[0].Action;
                for (actionCount = 0; actionCount < actionNode.length; actionCount++) {
                    that.supportedActions.push(actionNode[actionCount].text);
                }
            }

            return root;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.supportedActions = supportedActions;
        // Expose public methods
        that.equals = supportedDensityXMLEquals;
        that.fromXML = fromSupportedDensityXMLEqualsXML;

        return that;
    }

    function supportedDensityOptionsJSON()
    {
        // Inherit from supportedTripwireOptions
        var that = supportedTripwireOptionsJSON();
        var typeName = 'SupportedDensityOptions';
        var supportedActions = [];
        var _baseFromJSON = that.fromJSON;

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromSupportedDensityJSONEqualsJSON(json) {
            var root = _baseFromJSON(json);
            var actionNode, actionCount;

            // Tag: SupportedActions
            that.supportedActions = [];
            if (root.SupportedActions !== undefined &&
                root.SupportedActions.length > 0 &&
                root.SupportedActions[0].Action !== undefined &&
                root.SupportedActions[0].Action.length > 0) {
                // Tag: Action
                actionNode = root.SupportedActions[0].Action;
                for (actionCount = 0; actionCount < actionNode.length; actionCount++) {
                    that.supportedActions.push(actionNode[actionCount].text);
                }
            }

            return root;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.supportedActions = supportedActions;
        // Expose public methods   
        that.fromJSON = fromSupportedDensityJSONEqualsJSON;

        return that;
    }

    //
    // SupportedAOIOptions constructor
    //
    function supportedAOIOptions() {
        // Inherit from supportedDensityOptions
        var that = supportedDensityOptions();
        var typeName = 'SupportedAOIOptions';
        var supportsGroundPlane = false;
        var supportsImagePlane = false;
        var _baseEquals = that.equals;
        var _baseFromXML = that.fromXML;

        that.equals = function equals(obj) {
            return _baseEquals(obj) &&
                (that.supportsGroundPlane === obj.supportsGroundPlane) &&
                (that.supportsImagePlane === obj.supportsImagePlane);
        };


        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        that.fromXML = function fromXML(xml) {
            var root = _baseFromXML(xml);

            // Tag: SupportsGroundPlane
            that.supportsGroundPlane = toBoolean(root.SupportsGroundPlane[0].text, false);

            // Tag: SupportsImagePlane
            that.supportsImagePlane = toBoolean(root.SupportsImagePlane[0].text, false);
        };

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.supportsGroundPlane = supportsGroundPlane;
        that.supportsImagePlane = supportsImagePlane;

        return that;
    }

    function supportedAOIOptionsJSON()
    {
        // Inherit from supportedDensityOptions
        var that = supportedDensityOptions();
        var typeName = 'SupportedAOIOptions';
        var supportsGroundPlane = false;
        var supportsImagePlane = false;
        var _baseEquals = that.equals;
        var _baseFromJSON = that.fromJSON;

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        that.fromJSON = function fromJSON(json) {
            // Tag: SupportsGroundPlane
            that.supportsGroundPlane = toBoolean(json.SupportsGroundPlane, false);

            // Tag: SupportsImagePlane
            that.supportsImagePlane = toBoolean(json.SupportsImagePlane, false);
        };

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.supportsGroundPlane = supportsGroundPlane;
        that.supportsImagePlane = supportsImagePlane;

        return that;
    }

    //
    // supportedCountingAOIOptions
    //
    function supportedCountingAOIOptions() {
        // Inherit from supportedAOIOptions
        var that = supportedAOIOptions();
        that.typeOf = 'SupportedCountingAOIOptions';
        return that;
    }

    function supportedCountingAOIOptionsJSON()
    {

    }

    //
    // SupportedFullFrameOptions constructor
    //
    function supportedFullFrameOptions() {
        var that = {};
        var typeName = 'SupportedFullFrameOptions';
        var supportedClassifications = [];
        var supportedActions = [];

        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (!arrayMatch(that.supportedClassifications, obj.supportedClassifications) ||
                !arrayMatch(that.supportedActions, obj.supportedActions)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml){
            var root = null;
            var classificationNode, actionNode;
            var classificationCount, actionCount;

            // Tag: Options
            root = getRootNode(xml, 'Options');

            // Tag: SupportedClassifications
            that.supportedClassifications = [];
            if (root.SupportedClassifications !== undefined &&
                root.SupportedClassifications.length > 0 &&
                root.SupportedClassifications[0].Classification !== undefined &&
                root.SupportedClassifications[0].Classification.length > 0) {
                // Tag: Classification
                classificationNode = root.SupportedClassifications[0].Classification;
                for (classificationCount = 0; classificationCount < classificationNode.length; classificationCount += 1) {
                    that.supportedClassifications.push(validateClassificationValue(classificationNode[classificationCount].text));
                }
            }

            // Tag: SupportedActions
            that.supportedActions = [];
            if (root.SupportedActions !== undefined &&
                root.SupportedActions.length > 0 &&
                root.SupportedActions[0].Action !== undefined &&
                root.SupportedActions[0].Action.length > 0) {
                // Tag: Action
                actionNode = root.SupportedActions[0].Action;
                for (actionCount = 0; actionCount < actionNode.length; actionCount += 1) {
                    that.supportedActions.push(actionNode[actionCount].text);
                }
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.supportedClassifications = supportedClassifications;
        that.supportedActions = supportedActions;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    function supportedFullFrameOptionsJSON()
    {
        var that = {};
        var typeName = 'SupportedFullFrameOptions';
        var supportedClassifications = [];
        var supportedActions = [];

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            var classificationNode, actionNode;
            var classificationCount, actionCount;

            // Tag: SupportedClassifications
            that.supportedClassifications = [];
            if (json.SupportedClassifications !== undefined &&
                json.SupportedClassifications.Classification !== undefined &&
                json.SupportedClassifications.Classification.length > 0) {
                // Tag: Classification
                classificationNode = json.SupportedClassifications.Classification;
                for (classificationCount = 0; classificationCount < classificationNode.length; classificationCount += 1) {
                    that.supportedClassifications.push(validateClassificationValue(classificationNode[classificationCount]));
                }
            }

            // Tag: SupportedActions
            that.supportedActions = [];
            if (json.SupportedActions !== undefined &&
                json.SupportedActions.Action !== undefined &&
                json.SupportedActions.Action.length > 0) {
                // Tag: Action
                actionNode = json.SupportedActions.Action;
                for (actionCount = 0; actionCount < actionNode.length; actionCount += 1) {
                    that.supportedActions.push(actionNode[actionCount]);
                }
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.supportedClassifications = supportedClassifications;
        that.supportedActions = supportedActions;
        // Expose public methods
        that.fromJSON = fromJSON;

        return that;
    }

    //
    // SupportedEvent constructor
    //
    function supportedEvent(){
        var that = {};
        var typeName = 'supportedEvent';
        var xsiType = '';
        var options = null;

        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.xsiType !== obj.xsiType ||
                !objectMatch(that.options, obj.options)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml){
            var root = null;
            var subOptions;

            // Tag: AnalyticsCapabilities
            root = getRootNode(xml, 'SupportedEvent');

            // Tag: XsiType
            if (root.XsiType[0].text !== undefined) {
                that.xsiType = root.XsiType[0].text;
            }

            // depending on the XsiType, we'll have different Options next...
            if (root.Options !== undefined) {
                if (that.xsiType === eventDefinitionTypes.CameraTamperEventDefinition) {
                    subOptions = supportedTamperOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.TripwireEventDefinition) {
                    subOptions = supportedTripwireOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.MultiLineTripwireEventDefinition) {
                    subOptions = supportedMultilineTripwireOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.AreaOfInterestEventDefinition) {
                    subOptions = supportedAOIOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.FullFrameEventDefinition) {
                    subOptions = supportedFullFrameOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.CountingAreaOfInterestEventDefinition) {
                    subOptions = supportedCountingAOIOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition) {
                    subOptions = supportedDensityOptions();
                    subOptions.fromXML(root.Options[0]);
                    that.options = subOptions;
                }
                else {
                    throw new Error('Unrecognized SupportedEvent type: ' + that.xsiType);
                }

            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.xsiType = xsiType;
        that.options = options;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    function supportedEventJSON() {
        var that = {};
        var typeName = 'supportedEvent';
        var xsiType = '';
        var options = null;

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            var subOptions;

            // Tag: XsiType
            if (json.XsiType !== undefined) {
                that.xsiType = json.XsiType;
            }

            // depending on the XsiType, we'll have different Options next...
            if (json.Options !== undefined) {
                if (that.xsiType === eventDefinitionTypes.CameraTamperEventDefinition) {
                    subOptions = supportedTamperOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.TripwireEventDefinition) {
                    subOptions = supportedTripwireOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.MultiLineTripwireEventDefinition) {
                    subOptions = supportedMultilineTripwireOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.AreaOfInterestEventDefinition) {
                    subOptions = supportedAOIOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.FullFrameEventDefinition) {
                    subOptions = supportedFullFrameOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.CountingAreaOfInterestEventDefinition) {
                    subOptions = supportedCountingAOIOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else if (that.xsiType === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition) {
                    subOptions = supportedDensityOptionsJSON();
                    subOptions.fromJSON(json.Options);
                    that.options = subOptions;
                }
                else {
                    throw new Error('Unrecognized SupportedEvent type: ' + that.xsiType);
                }

            }
        }

        that.typeOf = typeName;
        that.xsiType = xsiType;
        that.options = options;
        // Expose public methods
        that.fromJSON = fromJSON;

        return that;
    }

    //
    // SupportedScheduleType constructor
    //
    function supportedScheduleType(){
        var that = {};
        var typeName = 'supportedScheduleType';
        var maxTimeBlocks = 0;

        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.maxTimeBlocks !== obj.maxTimeBlocks) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml){
            var root = null;

            // Tag: AnalyticsCapabilities
            root = getRootNode(xml, 'Type');

            // Tag: MaxTimeBlocks
            if (isNaN(root.MaxTimeBlocks[0].text)) {
                throw new Error('Invalid MaxTimeBlocks: ' + root.MaxTimeBlocks[0].text);
            }
            else {
                that.maxTimeBlocks = parseInt(root.MaxTimeBlocks[0].text, 10);
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxTimeBlocks = maxTimeBlocks;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    //
    // SupportedResponse constructor
    //
    function supportedResponse(){
        var that = {};
        var typeName = 'supportedResponse';
        var maxMessageLength = 0;
        var maxCustomResponseFields = 0;
        var maxCustomResponseKeyLength = 0;
        var maxCustomResponseValueLength = 0;

        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.maxMessageLength !== obj.maxMessageLength ||
                that.maxCustomResponseFields !== obj.maxCustomResponseFields ||
                that.maxCustomResponseKeyLength !== obj.maxCustomResponseKeyLength ||
                that.maxCustomResponseValueLength !== maxCustomResponseValueLength) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml){
            var root = null;

            // Tag: AnalyticsCapabilities
            root = getRootNode(xml, 'Type');

            // Tag: MaxMessageLength (must be an integer)
            if (isNaN(root.MaxMessageLength[0].text)) {
                throw new Error('Invalid MaxRulesPerView: ' + root.MaxMessageLength[0].text);
            }
            else {
                that.maxMessageLength = parseInt(root.MaxMessageLength[0].text, 10);
            }

            // Tag: MaxCustomResponseFields (must be an integer)
            if (isNaN(root.MaxCustomResponseFields[0].text)) {
                throw new Error('Invalid MaxRulesPerView: ' + root.MaxCustomResponseFields[0].text);
            }
            else {
                that.maxCustomResponseFields = parseInt(root.MaxCustomResponseFields[0].text, 10);
            }

            // Tag: MaxCustomResponseKeyLength (must be an integer)
            if (isNaN(root.MaxCustomResponseKeyLength[0].text)) {
                throw new Error('Invalid MaxRulesPerView: ' + root.MaxCustomResponseKeyLength[0].text);
            }
            else {
                that.maxCustomResponseKeyLength = parseInt(root.MaxCustomResponseKeyLength[0].text, 10);
            }

            // Tag: MaxCustomResponseValueLength (must be an integer)
            if (isNaN(root.MaxCustomResponseValueLength[0].text)) {
                throw new Error('Invalid MaxRulesPerView: ' + root.MaxCustomResponseValueLength[0].text);
            }
            else {
                that.maxCustomResponseValueLength = parseInt(root.MaxCustomResponseValueLength[0].text, 10);
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // Expose public fields
        that.typeOf = typeName;
        that.maxCustomResponseFields = maxCustomResponseFields;
        that.maxCustomResponseKeyLength = maxCustomResponseKeyLength;
        that.maxCustomResponseValueLength = maxCustomResponseValueLength;
        that.maxMessageLength = maxMessageLength;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    //
    // ChannelAnalyticsCapabilities constructor
    //
    function channelAnalyticsCapabilities() {
        var that = {};
        var typeName = 'channelAnalyticsCapabilities';
        var analyticsType = '';
        var maxRulesPerView = 0;
        var maxViews = 0;
        var supportsAlertOutput = false;
        var supportsCountOutput = false;
        var supportsMetadataOutput = false;
        var supportsPeopleOnlyTracking = false;
        var isPeopleOnlyTrackingEnabled = false;
        var requiresCalibration = false;
        var channelId = 0;
        // supportedEvents is an associative array mapping th event xsiType to
        // the event object
        var supportedEvents = {};
        var supportedScheduleTypes = [];
        // supportedFilters is an array of filter names (strings)
        var supportedFilters = [];
        var supportedResponses = [];

        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.analyticsType !== obj.analyticsType ||
                that.maxRulesPerView != obj.maxRulesPerView ||
                that.supportsAlertOutput != obj.supportsAlertOutput ||
                that.supportsCountOutput != obj.supportsCountOutput ||
                that.supportsMetadataOutput != obj.supportsMetadataOutput ||
                that.supportsPeopleOnlyTracking != obj.supportsPeopleOnlyTracking ||
                that.isPeopleOnlyTrackingEnabled != obj.isPeopleOnlyTrackingEnabled ||
                that.requiresCalibration != obj.requiresCalibration ||
                that.maxViews != obj.maxViews) {
                retVal = false;
            }
            else if (! associativeArrayMatch(that.supportedEvents, obj.supportedEvents, true)) {
                retVal = false;
            }
            else if (! arrayMatch(that.supportedScheduleTypes, obj.supportedScheduleTypes, true)) {
                retVal = false;
            }
            else if (! arrayMatch(that.supportedFilters, obj.supportedFilters)) {
                retVal = false;
            }
            else if (!arrayMatch(that.supportedResponses, obj.supportedResponses, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var eventNode, scheduleTypeNode, filterNode, responseTypeNode;
            var i, obj;

            // Tag: AnalyticsCapabilities
            root = getRootNode(xml, 'AnalyticsCapabilities');

            // Tag: AnalyticsType
            if (root.AnalyticsType[0].text !== undefined) {
                that.analyticsType = root.AnalyticsType[0].text;
            }

            // Tag: MaxRulesPerView (must be an integer)
            if (isNaN(root.MaxRulesPerView[0].text)) {
                throw new Error('Invalid MaxRulesPerView: ' + root.MaxRulesPerView[0].text);
            }
            else {
                that.maxRulesPerView = parseInt(root.MaxRulesPerView[0].text, 10);
            }

            // Tag: MaxViews (must be an integer)
            if (isNaN(root.MaxViews[0].text)) {
                throw new Error('Invalid MaxViews: ' + root.MaxViews[0].text);
            }
            else {
                that.maxViews = parseInt(root.MaxViews[0].text, 10);
            }

            // Tag: SupportsAlertOutput
            that.supportsAlertOutput = toBoolean(root.SupportsAlertOutput[0].text, false);

            // Tag: SupportsCountOutput
            that.supportsCountOutput = toBoolean(root.SupportsCountOutput[0].text, false);

            // Tag: SupportsMetadataOutput
            that.supportsMetadataOutput = toBoolean(root.SupportsMetadataOutput[0].text, false);

            // Tag: SupportsPeopleOnlyTracking
            that.supportsPeopleOnlyTracking = toBoolean(root.SupportsPeopleOnlyTracking[0].text, false);

            // Tag: IsPeopleOnlyTrackingEnabled
            that.isPeopleOnlyTrackingEnabled = toBoolean(root.IsPeopleOnlyTrackingEnabled[0].text, false);

            // Tag: RequiresCalibration
            that.requiresCalibration = toBoolean(root.RequiresCalibration[0].text, false);

            // Tag: SupportedEvents
            that.supportedEvents = {};
            if (root.SupportedEvents !== undefined &&
                root.SupportedEvents.length > 0 &&
                root.SupportedEvents[0].SupportedEvent !== undefined &&
                root.SupportedEvents[0].SupportedEvent.length > 0) {
                eventNode = root.SupportedEvents[0].SupportedEvent;

                var eventsLength = 0;
                for (i = 0; i < eventNode.length; i++) {
                    obj = supportedEvent();
                    obj.fromXML(eventNode[i]);
                    if (obj && obj.xsiType) {
                        eventsLength++;
                        that.supportedEvents[obj.xsiType] = obj;
                    }
                }
                that.supportedEvents.length = eventsLength;
            }

            // Tag: SupportedSchedules
            that.supportedScheduleTypes = [];
            if (root.SupportedSchedules !== undefined &&
                root.SupportedSchedules.length > 0 &&
                root.SupportedSchedules[0].Type !== undefined &&
                root.SupportedSchedules[0].Type.length > 0) {
                scheduleTypeNode = root.SupportedSchedules[0].Type;

                for (i = 0; i < scheduleTypeNode.length; i++) {
                    obj = supportedScheduleType();
                    obj.fromXML(scheduleTypeNode[i]);
                    that.supportedScheduleTypes.push(obj);
                }
            }

            // Tag: SupportedFilters
            that.supportedFilters = [];
            if (root.SupportedFilters !== undefined &&
                root.SupportedFilters.length > 0 &&
                root.SupportedFilters[0].Type !== undefined &&
                root.SupportedFilters[0].Type.length > 0) {
                // Tag: Type
                filterNode = root.SupportedFilters[0].Type;
                for (i = 0; i < filterNode.length; i++) {
                    that.supportedFilters.push(filterNode[i].text.toString());
                }
            }

            // Tag: SupportedResponses
            that.supportedResponses = [];
            if (root.SupportedResponses !== undefined &&
                root.SupportedResponses.length > 0 &&
                root.SupportedResponses[0].Type !== undefined &&
                root.SupportedResponses[0].Type.length > 0) {
                responseNode = root.SupportedResponses[0].Type;

                for (i = 0; i < responseNode.length; i++) {
                    obj = supportedResponse();
                    obj.fromXML(responseNode[i]);
                    that.supportedResponses.push(obj);
                }
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // expose public fields
        that.typeOf = typeName;
        that.analyticsType = analyticsType;
        that.maxRulesPerView = maxRulesPerView;
        that.supportsAlertOutput = supportsAlertOutput;
        that.supportsCountOutput = supportsCountOutput;
        that.supportsMetadataOutput = supportsMetadataOutput;
        that.supportsPeopleOnlyTracking = supportsPeopleOnlyTracking;
        that.isPeopleOnlyTrackingEnabled = isPeopleOnlyTrackingEnabled;
        that.requiresCalibration = requiresCalibration;
        that.maxViews = maxViews;
        that.supportedEvents = supportedEvents;
        that.supportedScheduleTypes = supportedScheduleTypes;
        that.supportedFilters = supportedFilters;
        that.supportedResponses = supportedResponses;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;

        return that;
    }

    function channelAnalyticsCapabilitiesJSON() {
        var that = {};
        var typeName = 'channelAnalyticsCapabilities';
        // supportedEvents is an associative array mapping th event xsiType to
        // the event object
        var supportedEvents = {};

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            // Tag: SupportedEvents
            that.supportedEvents = {};
            if (json.SupportedEvents !== undefined &&
                json.SupportedEvents.SupportedEvent !== undefined &&
                json.SupportedEvents.SupportedEvent.length > 0) {
                eventNode = json.SupportedEvents.SupportedEvent;

                var eventsLength = 0;
                for (i = 0; i < eventNode.length; i++) {
                    obj = supportedEventJSON();
                    obj.fromJSON(eventNode[i]);
                    if (obj && obj.xsiType) {
                        eventsLength++;
                        that.supportedEvents[obj.xsiType] = obj;
                    }
                }
                that.supportedEvents.length = eventsLength;
            }
        }

        // note: there is no toXML() for this object, since OV Ready does not support
        // setting analytics capabilities

        // expose public fields
        that.typeOf = typeName;
        that.supportedEvents = supportedEvents;
        that.fromJSON = fromJSON;
        return that;
    }
    //
    // ChannelSummary object constructor
    //
    function channelSummary() {
        var that = {}; // base object
        var typeName = 'channelSummary'; // object type name
        var channelLink = '';
        var id = 0;
        var name = '';
        var analyticsType = '';
        var isAnalyticsEnabled = false;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two channelSummary objects have the same value
        //
        // @param obj A channelSummary object
        // @return {Boolean} True if obj is an instance of channelSummary and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.channelLink !== obj.channelLink ||
                that.id !== obj.id ||
                that.name !== obj.name ||
                that.analyticsType !== obj.analyticsType ||
                that.isAnalyticsEnabled !== obj.isAnalyticsEnabled) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: ChannelSummary
            root = getRootNode(xml, 'ChannelSummary');

            // Tag: ChannelSummary Attribute: xlink:href
            if (root['xlink:href'] === undefined) {
                throw new Error('xlink:href undefined');
            }
            else {
                that.channelLink = root['xlink:href'];
            }

            // Tag: ID
            that.id = root.ID[0].text;

            // Tag: Name
            if (root.Name[0].text !== undefined) {
                that.name = root.Name[0].text;
            }

            // Tag: AnalyticsType
            that.analyticsType = root.AnalyticsType[0].text;

            // Tag: IsAnalyticsEnabled
            that.isAnalyticsEnabled = toBoolean(root.IsAnalyticsEnabled[0].text, false);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<ChannelSummary ' + xlinkSimple + that.channelLink + '">';
            xml += '<ID>' + that.id + '</ID>';
            xml += '<Name>' + that.name + '</Name>';
            xml += '<AnalyticsType>' + that.analyticsType + '</AnalyticsType>';
            xml += '<IsAnalyticsEnabled>' + that.isAnalyticsEnabled + '</IsAnalyticsEnabled>';
            xml += '</ChannelSummary>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.channelLink = channelLink;
        that.id = id;
        that.name = name;
        that.analyticsType = analyticsType;
        that.isAnalyticsEnabled = isAnalyticsEnabled;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // ChannelList object constructor
    //
    function channelList() {
        var that = {}; // base object
        var typeName = 'channelList'; // object type name
        var channelSummaryList = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two channelList objects have the same value
        //
        // @param obj A channelList object
        // @return {Boolean} True if obj is an instance of channelList and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.channelSummaryList, obj.channelSummaryList, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: ChannelList
            root = getRootNode(xml, 'ChannelList');

            // Tag: ChannelSummary
            that.channelSummaryList = []; // clean-out the array
            node = root.ChannelSummary;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = channelSummary();
                    obj.fromXML(node[i]);
                    that.channelSummaryList.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<ChannelList ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            for (i = 0; i < that.channelSummaryList.length; i += 1) {
                xml += that.channelSummaryList[i].toXML();
            }
            xml += '</ChannelList>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.channelSummaryList = channelSummaryList;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // AnalyticsFrameSize object constructor
    //
    function analyticsFrameSize() {
        var that = {}; // base object
        var typeName = 'analyticsFrameSize'; // object type name
        var width = 0;
        var height = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two analyticsFrameSize objects have the same value
        //
        // @param obj A analyticsFrameSize object
        // @return {Boolean} True if obj is an instance of analyticsFrameSize and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.width !== obj.width ||
                that.height !== obj.height) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: AnalyticsFrameSize
            root = getRootNode(xml, 'AnalyticsFrameSize');

            convertNodeWidthHeight(root, that);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<AnalyticsFrameSize>';
            xml += '<Width>' + that.width + '</Width>';
            xml += '<Height>' + that.height + '</Height>';
            xml += '</AnalyticsFrameSize>';

            return xml;
        }

        function clone() {
            var copy = analyticsFrameSize();
            copy.width = that.width;
            copy.height = that.height;
            return copy;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.width = width;
        that.height = height;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.clone = clone;

        return that;
    }

    //
    // AlertPolling object constructor
    //
    function alertPolling() {
        var that = {}; // base object
        var typeName = 'alertPolling'; // object type name
        var snapshotOutput = false;
        var daySnapshotOutput = false;
        var targetOutput = false;
        var snapshotsInline = false;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two alertPolling objects have the same value
        //
        // @param obj A alertPolling object
        // @return {Boolean} True if obj is an instance of alertPolling and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.snapshotOutput !== obj.snapshotOutput ||
                that.daySnapshotOutput !== obj.daySnapshotOutput ||
                that.targetOutput !== obj.targetOutput ||
                that.snapshotsInline !== obj.snapshotsInline) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: AlertPolling
            root = getRootNode(xml, 'AlertPolling');

            // Tag: SnapshotOutput (must be a boolean)
            that.snapshotOutput = toBoolean(root.SnapshotOutput[0].text);

            // Tag: DaySnapshotOutput (must be a boolean)
            that.daySnapshotOutput = toBoolean(root.DaySnapshotOutput[0].text);

            // Tag: TargetOutput (must be a boolean)
            that.targetOutput = toBoolean(root.TargetOutput[0].text);

            // Tag: SnapshotsInline (must be a boolean)
            that.snapshotsInline = toBoolean(root.SnapshotsInline[0].text);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<AlertPolling>';
            xml += '<SnapshotOutput>' + that.snapshotOutput + '</SnapshotOutput>';
            xml += '<DaySnapshotOutput>' + that.daySnapshotOutput + '</DaySnapshotOutput>';
            xml += '<TargetOutput>' + that.targetOutput + '</TargetOutput>';
            xml += '<SnapshotsInline>' + that.snapshotsInline + '</SnapshotsInline>';
            xml += '</AlertPolling>';

            return xml;
        }

        function clone() {
            var copy = alertPolling();
            copy.snapshotOutput = that.snapshotOutput;
            copy.daySnapshotOutput = that.daySnapshotOutput;
            copy.targetOutput = that.targetOutput;
            copy.snapshotsInline = that.snapshotsInline;
            return copy;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.snapshotOutput = snapshotOutput;
        that.daySnapshotOutput = daySnapshotOutput;
        that.targetOutput = targetOutput;
        that.snapshotsInline = snapshotsInline;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.clone = clone;

        return that;
    }

    //
    // AlertStreaming object constructor
    //
    function alertStreaming() {
        var that = {}; // base object
        var typeName = 'alertStreaming'; // object type name
        var snapshotOutput = false;
        var daySnapshotOutput = false;
        var targetOutput = false;
        var snapshotsInline = false;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two alertStreaming objects have the same value
        //
        // @param obj A alertStreaming object
        // @return {Boolean} True if obj is an instance of alertStreaming and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.snapshotOutput !== obj.snapshotOutput ||
                that.daySnapshotOutput !== obj.daySnapshotOutput ||
                that.targetOutput !== obj.targetOutput ||
                that.snapshotsInline !== obj.snapshotsInline) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: AlertStreaming
            root = getRootNode(xml, 'AlertStreaming');

            // Tag: SnapshotOutput (must be a boolean)
            that.snapshotOutput = toBoolean(root.SnapshotOutput[0].text);

            // Tag: DaySnapshotOutput (must be a boolean)
            that.daySnapshotOutput = toBoolean(root.DaySnapshotOutput[0].text);

            // Tag: TargetOutput (must be a boolean)
            that.targetOutput = toBoolean(root.TargetOutput[0].text);

            // Tag: SnapshotsInline (must be a boolean)
            that.snapshotsInline = toBoolean(root.SnapshotsInline[0].text);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<AlertStreaming>';
            xml += '<SnapshotOutput>' + that.snapshotOutput + '</SnapshotOutput>';
            xml += '<DaySnapshotOutput>' + that.daySnapshotOutput + '</DaySnapshotOutput>';
            xml += '<TargetOutput>' + that.targetOutput + '</TargetOutput>';
            xml += '<SnapshotsInline>' + that.snapshotsInline + '</SnapshotsInline>';
            xml += '</AlertStreaming>';

            return xml;
        }

        function clone() {
            var copy = alertStreaming();
            copy.snapshotOutput = that.snapshotOutput;
            copy.daySnapshotOutput = that.daySnapshotOutput;
            copy.targetOutput = that.targetOutput;
            copy.snapshotsInline = that.snapshotsInline;
            return copy;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.snapshotOutput = snapshotOutput;
        that.daySnapshotOutput = daySnapshotOutput;
        that.targetOutput = targetOutput;
        that.snapshotsInline = snapshotsInline;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.clone = clone;

        return that;
    }

    //
    // AlertConfiguration object constructor
    //
    function alertConfiguration() {
        var that = {}; // base object
        var typeName = 'alertConfiguration'; // object type name
        var alertPollingItem = null;
        var alertStreamingItem = null;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two alertConfiguration objects have the same value
        //
        // @param obj A alertConfiguration object
        // @return {Boolean} True if obj is an instance of alertConfiguration and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! objectMatch(that.alertPollingItem, obj.alertPollingItem) ||
                ! objectMatch(that.alertStreamingItem, obj.alertStreamingItem)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: AlertConfiguration
            root = getRootNode(xml, 'AlertConfiguration');

            // Tag: AlertPolling (optional)
            if (root.AlertPolling === undefined) {
                that.alertPollingItem = null;
            }
            else {
                that.alertPollingItem = alertPolling();
                that.alertPollingItem.fromXML(root.AlertPolling[0]);
            }

            // Tag: AlertStreaming (optional)
            if (root.AlertStreaming === undefined) {
                that.alertStreamingItem = null;
            }
            else {
                that.alertStreamingItem = alertStreaming();
                that.alertStreamingItem.fromXML(root.AlertStreaming[0]);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<AlertConfiguration>';
            if (that.alertPollingItem !== null) {
                xml += that.alertPollingItem.toXML();
            }
            if (that.alertStreamingItem !== null) {
                xml += that.alertStreamingItem.toXML();
            }
            xml += '</AlertConfiguration>';

            return xml;
        }

        function clone() {
            var copy = alertConfiguration();
            copy.alertPollingItem = that.alertPollingItem ? that.alertPollingItem.clone() : null;
            copy.alertStreamingItem = that.alertStreamingItem ? that.alertStreamingItem.clone() : null;
            return copy;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.alertPollingItem = alertPollingItem;
        that.alertStreamingItem = alertStreamingItem;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.clone = clone;

        return that;
    }

    //
    // analyticsCalibration data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return An analyticsCalibration object if the xml represents correct
    //         object data; otherwise, null.
    //
    function analyticsCalibrationFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = analyticsCalibration();

                if ((typeof xml) === 'string' && xml !== "") {
                    obj.fromXML(xml);
                }
                else if (xml !== "") {
                    // Assume the xml is a DOM oject
                    var result=$.xml2json(xml, true);
                    obj.fromXML(result);
                }
                // allow an empyt analytics calibration
            }
            catch (ex) {
                $.log('Error creating analyticsCapabilities from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // AnalyticsCalibration object constructor
    //
    function analyticsCalibration() {
        var that = {}; // base object
        var typeName = 'analyticsCalibration'; // object type name
        var calibrationSamples = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two analyticsCalibration objects have the same value
        //
        // @param obj A analyticsCalibration object
        // @return {Boolean} True if obj is an instance of analyticsCalibration and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.calibrationSamples, obj.calibrationSamples, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: AnalyticsCalibration
            root = getRootNode(xml, 'AnalyticsCalibration');

            // Tag: PersonCalibrationSample
            that.calibrationSamples = []; // clean-out the array
            node = root.Sample;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = personCalibrationSample();
                    obj.fromXML(node[i]);
                    that.calibrationSamples.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<AnalyticsCalibration ' + xmlnsAttr+ '>';
            for (i = 0; i < that.calibrationSamples.length; i += 1) {
                xml += that.calibrationSamples[i].toXML();
            }
            xml += '</AnalyticsCalibration>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.calibrationSamples = calibrationSamples;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // PersonCalibrationSample object constructor
    //
    function personCalibrationSample() {
        var that = {}; // base object
        var typeName = 'personCalibrationSample'; // object type name
        var headPoint = null;
        var footPoint = null;
        var boundingBox = null;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two personCalibrationSample objects have the same value
        //
        // @param obj A personCalibrationSample object
        // @return {Boolean} True if obj is an instance of personCalibrationSample and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (!obj.headPoint.equals(that.headPoint)) {
                retVal = false;
            }
            else if (!obj.footPoint.equals(that.footPoint)) {
                retVal = false;
            }
            else if (!obj.boundingBox.equals(that.boundingBox)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;

            // Tag: Sample
            root = getRootNode(xml, 'Sample');

            // Tag: HeadPoint
            node = root.HeadPoint[0];
            that.headPoint = point();
            that.headPoint.fromXML(node, 'HeadPoint');

            // Tag: FootPoint
            node = root.FootPoint[0];
            that.footPoint = point();
            that.footPoint.fromXML(node, 'FootPoint');

            // Tag: BoundingBox
            node = root.BoundingBox[0];
            that.boundingBox = rect();
            that.boundingBox.fromXML(node, 'BoundingBox');
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Sample ' + xsiType + '"PersonCalibrationSample">';
            xml += that.headPoint.toXMLNode('HeadPoint');
            xml += that.footPoint.toXMLNode('FootPoint');
            xml += that.boundingBox.toXMLNode('BoundingBox');
            xml += '</Sample>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.headPoint = headPoint;
        that.footPoint = footPoint;
        that.boundingBox = boundingBox;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // Channel object constructor
    //
    function channel() {
        var that = {}; // base object
        var typeName = 'channel'; // object type name
        var id = 'xyz';
        var analyticsType = "";
        var name = "";
        var videoSource = "";
        var isAnalyticsEnabled = false;
        var isAnalyticsCalibrationRequired  = false;
        var isAnalyticsCalibrated = false;
        var analyticsFrameSizeItem = analyticsFrameSize();
        var alertConfigurationItem = alertConfiguration();

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two channel objects have the same value
        //
        // @param obj A channel object
        // @return {Boolean} True if obj is an instance of channel and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.id !== obj.id ||
                that.analyticsType !== obj.analyticsType ||
                that.name !== obj.name ||
                that.videoSource !== obj.videoSource ||
                that.isAnalyticsEnabled !== obj.isAnalyticsEnabled ||
                that.isAnalyticsCalibrationRequired !== obj.isAnalyticsCalibrationRequired ||
                that.isAnalyticsCalibrated !== obj.isAnalyticsCalibrated ||
                ! objectMatch(that.analyticsFrameSizeItem, obj.analyticsFrameSizeItem) ||
                ! objectMatch(that.alertConfigurationItem, obj.alertConfigurationItem)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var obj = null;

            // Tag: Channel
            root = getRootNode(xml, 'Channel');

            // Tag: ID
            if (root.ID[0].text !== undefined) {
                that.id = root.ID[0].text;
            }

            // Tag: AnalyticsType
            if (root.AnalyticsType[0].text !== undefined) {
                that.analyticsType = root.AnalyticsType[0].text;
            }

            // Tag: Name (optional)
            // A missing name tag equivalents to an empty tag, <TagName/> or
            // <TagNmae></TagName>.
            if (root.Name[0].text !== undefined) {
                that.name = root.Name[0].text;
            }

            // Tag: VideoSource (optinal)
            // A missing name tag equivalents to an empty tag, <TagName/> or
            // <TagNmae></TagName>.
            if (root.VideoSource[0].text !== undefined) {
                that.videoSource = root.VideoSource[0].text;
            }

            // Tag: IsAnalyticsEnabled
            that.isAnalyticsEnabled = toBoolean(root.IsAnalyticsEnabled[0].text);

            // Tag: IsAnalyticsCalibrationRequired
            that.isAnalyticsCalibrationRequired = toBoolean(root.IsAnalyticsCalibrationRequired[0].text);

            // Tag: IsAnalyticsCalibrated
            that.isAnalyticsCalibrated = toBoolean(root.IsAnalyticsCalibrated[0].text);

            // Tag: AnalyticsFrameSize
            obj = analyticsFrameSize();
            obj.fromXML(root.AnalyticsFrameSize[0]);
            that.analyticsFrameSizeItem = obj;

            // Tag: AlertConfiguration
            obj = alertConfiguration();
            if (root.AlertConfiguration[0] && root.AlertConfiguration[0] !== undefined && root.AlertConfiguration[0] !== '') {
                obj.fromXML(root.AlertConfiguration[0]);
                that.alertConfigurationItem = obj;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;

            xml += '<Channel ' + xmlnsAttr + '>';
            xml += '<ID>' + that.id + '</ID>';
            xml += '<AnalyticsType>' + that.analyticsType + '</AnalyticsType>';
            xml += '<Name>' + that.name + '</Name>';
            xml += '<VideoSource>' + that.videoSource + '</VideoSource>';
            xml += '<IsAnalyticsEnabled>' + that.isAnalyticsEnabled + '</IsAnalyticsEnabled>';
            xml += '<IsAnalyticsCalibrationRequired>' + that.isAnalyticsCalibrationRequired + '</IsAnalyticsCalibrationRequired>';
            xml += '<IsAnalyticsCalibrated>' + that.isAnalyticsCalibrated + '</IsAnalyticsCalibrated>';
            xml += that.analyticsFrameSizeItem.toXML();
            xml += that.alertConfigurationItem.toXML();
            xml += '</Channel>';

            return xml;
        }

        function clone() {
            var copy = channel();
            copy.id = that.id;
            copy.analyticsType = that.analyticsType;
            copy.name = that.name;
            copy.videoSource = that.videoSource;
            copy.isAnalyticsEnabled = that.isAnalyticsEnabled;
            copy.isAnalyticsCalibrationRequired = that.isAnalyticsCalibrationRequired;
            copy.isAnalyticsCalibrated = that.isAnalyticsCalibrated;
            copy.analyticsFrameSizeItem = that.analyticsFrameSizeItem ? that.analyticsFrameSizeItem.clone() : null;
            copy.alertConfigurationItem = that.alertConfigurationItem ? that.alertConfigurationItem.clone() : null;
            return copy;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.id = id;
        that.analyticsType = analyticsType;
        that.name = name;
        that.videoSource = videoSource;
        that.isAnalyticsEnabled = isAnalyticsEnabled;
        that.isAnalyticsCalibrationRequired  = isAnalyticsCalibrationRequired;
        that.isAnalyticsCalibrated = isAnalyticsCalibrated;
        that.analyticsFrameSizeItem = analyticsFrameSizeItem;
        that.alertConfigurationItem = alertConfigurationItem;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.clone = clone;

        return that;
    }

    //-------- OV Ready: Views --------//

    //
    // ViewSummary object constructor
    //
    function viewSummary() {
        var that = {}; // base object
        var typeName = 'viewSummary'; // object type name
        var viewLink = '';
        var id = '';
        var name = '';
        var isCurrentView = false;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two viewSummary objects have the same value
        //
        // @param obj A viewSummary object
        // @return {Boolean} True if obj is an instance of viewSummary and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.viewLink !== obj.viewLink ||
                that.id !== obj.id ||
                that.name !== obj.name ||
                that.isCurrentView !== obj.isCurrentView) {
                retVal = false;
            }

            return retVal;
        }

        //
        // clone
        //
        function clone() {
            var copy = viewSummary();
            copy.viewLink = that.viewLink;
            copy.id = that.id;
            copy.name = that.name;
            copy.isCurrentView = that.isCurrentView;
            return copy;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: ViewSummary
            root = getRootNode(xml, 'ViewSummary');

            // Tag: ViewSummary Attribute: xlink:href
            if (root['xlink:href'] === undefined) {
                throw new Error('xlink:href undefined');
            }
            else {
                that.viewLink = root['xlink:href'];
            }

            // Tag: ID
            if (root.ID[0].text !== undefined) {
                that.id = root.ID[0].text;
            }

            // Tag: Name
            if (root.Name[0].text !== undefined) {
                that.name = root.Name[0].text;
            }

            // Tag: IsCurrentView
            that.isCurrentView = toBoolean(root.IsCurrentView[0].text, false);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<ViewSummary ' + xlinkSimple + that.viewLink + '">';
            xml += '<ID>' + that.id + '</ID>';
            xml += '<Name>' + that.name + '</Name>';
            xml += '<IsCurrentView>' + that.isCurrentView + '</IsCurrentView>';
            xml += '</ViewSummary>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.viewLink = viewLink;
        that.id = id;
        that.name = name;
        that.isCurrentView = isCurrentView;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // ViewList object constructor
    //
    function viewList() {
        var that = {}; // base object
        var typeName = 'viewList'; // object type name
        var viewSummaryList = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two viewList objects have the same value
        //
        // @param obj A viewList object
        // @return {Boolean} True if obj is an instance of viewList and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(! obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.viewSummaryList, obj.viewSummaryList, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // clone
        //
        function clone() {
            var copy = viewList();
            $.each(that.viewSummaryList, function() {
                var cloned = this.clone();
                copy.viewSummaryList.push(cloned);
            });
            return copy;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: ViewList
            root = getRootNode(xml, 'ViewList');

            // Tag: ViewSummary
            that.viewSummaryList = []; // clean-out the array
            node = root.ViewSummary;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = viewSummary();
                    obj.fromXML(node[i]);
                    that.viewSummaryList.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<ViewList ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            for (i = 0; i < that.viewSummaryList.length; i += 1) {
                xml += that.viewSummaryList[i].toXML();
            }
            xml += '</ViewList>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.viewSummaryList = viewSummaryList;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // ViewInfo object constructor
    //
    function viewInfo() {
        var that = {}; // base object
        var typeName = 'viewInfo'; // object type name
        var viewLink = '';
        var id = '';
        var name = '';

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two viewInfo objects have the same value
        //
        // @param obj A viewInfo object
        // @return {Boolean} True if obj is an instance of viewInfo and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.viewLink !== obj.viewLink ||
                that.id !== obj.id ||
                that.name !== obj.name) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: ViewInfo
            root = getRootNode(xml, 'ViewInfo');

            // Tag: ViewInfo Attribute: xlink:href
            if (root['xlink:href'] === undefined) {
                throw new Error('xlink:href undefined');
            }
            else {
                that.viewLink = root['xlink:href'];
            }

            // Tag: ID
            if (root.ID[0].text !== undefined) {
                that.id = root.ID[0].text;
            }

            // Tag: Name
            if (root.Name[0].text !== undefined) {
                that.name = root.Name[0].text;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<ViewInfo ' + xlinkSimple + that.viewLink + '">';
            xml += '<ID>' + that.id + '</ID>';
            xml += '<Name>' + that.name + '</Name>';
            xml += '</ViewInfo>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.viewLink = viewLink;
        that.id = id;
        that.name = name;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function viewInfoJSON()
    {
        var that = {};
        var typeName = "viewInfo";
        var viewLink = '';
        var id = '';
        var name = '';

        function equals(obj)
        {

        }

        function fromJSON(json)
        {
            var root = json;
            if (root.xlink_href !== undefined)
                that.viewLink = root.xlink_href;
            if (root.ID !== undefined)
                that.id = root.ID;
            if (root.Name !== undefined)
                that.name = root.Name;
        }

        function toJSON()
        {

        }

        that.typeOf = typeName;
        that.viewLink = viewLink;
        that.id = id;
        that.name = name;
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;
        return that;
    }

    //
    // ViewStatus object constructor
    //
    function viewStatus() {
        var that = {}; // base object
        var typeName = 'viewStatus'; // object type name
        var viewState = viewStates.UnknownView;
        var viewInfoItem = null;

        //-------- Private Methods --------//
        //
        // Validate and convert ViewState value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the viewStates enum.
        //
        function validateViewStateValue(value) {
            if (value !== viewStates.BadSignal &&
                value !== viewStates.UnknownView &&
                value !== viewStates.KnownView &&
                value !== viewStates.SearchingForView) {
                throw new Error('Invalid viewStates value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two viewList objects have the same value
        //
        // @param obj A viewStatus object
        // @return {Boolean} True if obj is an instance of viewStatus and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.viewState !== obj.viewState ||
                ! objectMatch(that.viewInfoItem, obj.viewInfoItem)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;

            // Tag: ViewStatus
            root = getRootNode(xml, 'ViewStatus');

            // Tag: ViewState
            that.viewState = validateViewStateValue(root.ViewState[0].text);

            // Tag: ViewInfo
            node = root.ViewInfo;
            if (node !== undefined) {
                that.viewInfoItem = viewInfo();
                that.viewInfoItem.fromXML(node[0]);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;

            xml += '<ViewStatus ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            xml += '<ViewState>' + that.viewState + '</ViewState>';
            xml += that.viewInfoItem.toXML();
            xml += '</ViewStatus>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.viewState = viewState;
        that.viewInfoItem = viewInfoItem;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //-------- OV Ready: Rules --------//

    //
    // RuleSummary object constructor
    //
    function ruleSummary() {
        var that = {}; // base object
        var typeName = 'ruleSummary'; // object type name
        var ruleLink = '';
        var id = '';
        var name = '';
        var viewInfoItem = null;
        var isActive = false;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two ruleSummary objects have the same value
        //
        // @param obj A ruleSummary object
        // @return {Boolean} True if obj is an instance of ruleSummary and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.ruleLink !== obj.ruleLink ||
                that.id !== obj.id ||
                that.name !== obj.name ||
                ! objectMatch(that.viewInfoItem, obj.viewInfoItem) ||
                that.isActive !== obj.isActive) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: RuleSummary
            root = getRootNode(xml, 'RuleSummary');

            // Tag: RuleSummary Attribute: xlink:href
            if (root['xlink:href'] === undefined) {
                throw new Error('xlink:href undefined');
            }
            else {
                that.ruleLink = root['xlink:href'];
            }

            // Tag: ID
            if (root.ID[0].text !== undefined) {
                that.id = root.ID[0].text;
            }

            // Tag: Name
            if (root.Name[0].text !== undefined) {
                that.name = root.Name[0].text;
            }

            // Tag: ViewInfo (optional)
            if (root.ViewInfo !== undefined) {
                that.viewInfoItem = viewInfo();
                that.viewInfoItem.fromXML(root.ViewInfo[0]);
            }
            else {
                that.viewInfoItem = null;
            }

            // Tag: IsActive
            that.isActive = toBoolean(root.IsActive[0].text);
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<RuleSummary ' + xlinkSimple + that.ruleLink + '">';
            xml += '<ID>' + that.id + '</ID>';
            xml += '<Name>' + that.name + '</Name>';
            if (that.viewInfoItem !== null) {
                xml += that.viewInfoItem.toXML();
            }
            xml += '<IsActive>' + that.isActive + '</IsActive>';
            xml += '</RuleSummary>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.ruleLink = ruleLink;
        that.id = id;
        that.name = name;
        that.viewInfoItem = viewInfoItem;
        that.isActive = isActive;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // RuleList object constructor
    //
    function ruleList() {
        var that = {}; // base object
        var typeName = 'ruleList'; // object type name
        var ruleSummaryList = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two ruleList objects have the same value
        //
        // @param obj A ruleList object
        // @return {Boolean} True if obj is an instance of ruleList and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.ruleSummaryList, obj.ruleSummaryList, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: RuleList
            root = getRootNode(xml, 'RuleList');

            // Tag: RuleSummary
            that.ruleSummaryList = []; // clean-out the array
            node = root.RuleSummary;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = ruleSummary();
                    obj.fromXML(node[i]);
                    that.ruleSummaryList.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<RuleList ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            for (i = 0; i < that.ruleSummaryList.length; i += 1) {
                xml += that.ruleSummaryList[i].toXML();
            }
            xml += '</RuleList>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.ruleSummaryList = ruleSummaryList;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // RuleList object constructor
    //
    function fullRuleList() {
        var that = {}; // base object
        var typeName = 'fullRuleList'; // object type name
        var ruleList = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two fullRuleList objects have the same value
        //
        // @param obj A ruleList object
        // @return {Boolean} True if obj is an instance of ruleList and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.ruleList, obj.ruleList, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = null;
            var i = 0;

            // Tag: RuleList
            root = getRootNode(xml, 'Rules');

            // Tag: Rules
            that.ruleList = []; // clean-out the array
            node = root.Rule;
            if (node !== undefined) {
                for (i = 0; i < node.length; i += 1) {
                    obj = rule();
                    obj.fromXML(node[i]);
                    that.ruleList.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;
            var i = 0;

            xml += '<Rules ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            for (i = 0; i < that.ruleList.length; i += 1) {
                xml += that.ruleList[i].toXML();
            }
            xml += '</Rules>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.ruleList = ruleList;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // Rule object constructor
    //
    function rule() {
        var that = {}; // base object
        var typeName = 'rule'; // object type name
        var id = '';
        var name = '';
        var isActive = false;
        var viewInfoItem = null;
        var eventDefinition = null;
        var responseDefinition = null;
        var schedule = null;
        var ruleLink = null;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two rule objects have the same value
        //
        // @param obj A rule object
        // @return {Boolean} True if obj is an instance of rule and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.id !== obj.id ||
                that.name !== obj.name ||
                that.isActive !== obj.isActive ||
                that.ruleLink !== obj.ruleLink ||
                ! objectMatch(that.viewInfoItem, obj.viewInfoItem) ||
                ! objectMatch(that.eventDefinition, obj.eventDefinition) ||
                ! objectMatch(that.responseDefinition, obj.responseDefinition) ||
                ! objectMatch(that.schedule, obj.schedule)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var obj = null;

            // Tag: Rule
            root = getRootNode(xml, 'Rule');

            // Tag: RuleSummary Attribute: xlink:href
            if (root['xlink:href'] !== undefined) {
                that.ruleLink = root['xlink:href'];
            }

            // Tag: ID
            that.id = root.ID[0].text;

            // Tag: Name
            that.name = root.Name[0].text;

            // Tag: IsActive
            that.isActive = toBoolean(root.IsActive[0].text);

            // Tag: ViewInfo
            that.viewInfoItem = null;
            if (root.ViewInfo !== undefined) {
                obj = viewInfo();
                obj.fromXML(root.ViewInfo[0]);
                that.viewInfoItem = obj;
            }

            // Tag: EventDefinition
            that.eventDefinition = eventDefinitionFactory(root.EventDefinition[0]);

            // Tag: ResponseDefinition
            that.responseDefinition = null;
            if (root.ResponseDefinition !== undefined) {
                obj = responseDefinitionFactory(root.ResponseDefinition[0]);
                that.responseDefinition = obj;
            }

            // Tag: Schedule
            that.schedule = null;
            if (root.Schedule !== undefined) {
                obj = scheduleFactory(root.Schedule[0]);
                that.schedule = obj;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = xmlDeclaration;

            if (that.ruleLink) {
                xml += '<Rule ' + xlinkSimple + that.ruleLink + '">';
            }
            else {
                xml += '<Rule ' + xmlnsAttr + ' ' + xmlnsXLink + '>';
            }
            if (that.id) {
                xml += '<ID>' + that.id + '</ID>';
            }
            xml += '<Name>' + that.name + '</Name>';
            xml += '<IsActive>' + that.isActive + '</IsActive>';
            if (that.viewInfoItem !== null) {
                xml += that.viewInfoItem.toXML();
            }
            if (that.eventDefinition !== null) {
                xml += that.eventDefinition.toXML();
            }
            else {
                throw new Error('Missing rule.eventDefinition');
            }

            if (that.responseDefinition !== null) {
                xml += that.responseDefinition.toXML();
            }

            if (that.schedule !== null) {
                xml += that.schedule.toXML();
            }
            xml += '</Rule>';

            return xml;
        }

        // Expose public fields
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
        that.fromXML = fromXML;
        that.toXML = toXML;
        that.ruleLink = ruleLink;

        return that;
    }

    function ruleJSON()
    {
        var that = {}; // base object
        var typeName = 'rule'; // object type name
        var id = '';
        var name = '';
        var isActive = false;
        var viewInfoItem = null;
        var eventDefinition = null;
        var responseDefinition = null;
        var schedule = null;
        var ruleLink = null;

        function equals(obj)
        {

        }

        function fromJSON(json) {
            var root = null;
            var obj = null;
            obj = eval('(' + json + ')');
            root = obj.Rule;
            that.id = root.ID;
            that.name = root.Name;
            that.isActive = toBoolean(root.IsActive);

            that.viewInfoItem = null;
            if (root.ViewInfo != undefined)
            {
                obj = viewInfoJSON();
                obj.fromJSON(root.ViewInfo);
                that.viewInfoItem = obj;
            }

            that.eventDefinition = eventDefinitionFactoryJSON(root.EventDefinition);

            that.responseDefinition = null;
            if (root.ResponseDefinition !== undefined)
            {
                obj = responseDefinitionFactoryJSON(root.ResponseDefinition);
                that.responseDefinition = obj;
            }
        }

        function toJSON(json)
        {

        }

        // Expose public fields
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


    //-------- OV Ready: Filters --------//

    //
    // ShapeAndDirectionFilter object constructor (Filter)
    //
    function shapeAndDirectionFilter() {
        var that = {}; // base object
        var typeName = 'shapeAndDirectionFilter'; // object type name
        var realType = filterTypes.ShapeAndDirectionFilter;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two shapeAndDirectionFilter objects have the same value
        //
        // @param obj A shapeAndDirectionFilter object
        // @return {Boolean} True if obj is an instance of shapeAndDirectionFilter and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        function clone() {
            return shapeAndDirectionFilter();
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Filter
            root = getRootNode(xml, 'Filter');

            // Tag: Filter Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Filter ' + xsiType + realType + '">' + '</Filter>';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.filterType = realType;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // SizeChangeFilter object constructor (Filter)
    //
    function sizeChangeFilter() {
        var that = {}; // base object
        var typeName = 'sizeChangeFilter'; // object type name
        var realType = filterTypes.SizeChangeFilter;
        var maxSizeChangeRatio = 0.0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two sizeChangeFilter objects have the same value
        //
        // @param obj A sizeChangeFilter object
        // @return {Boolean} True if obj is an instance of sizeChangeFilter and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.maxSizeChangeRatio !== obj.maxSizeChangeRatio) {
                retVal = false;
            }

            return retVal;
        }

        function clone() {
            var copy = sizeChangeFilter();
            copy.maxSizeChangeRatio = this.maxSizeChangeRatio;
            return copy;
        }


        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Filter
            root = getRootNode(xml, 'Filter');

            // Tag: Filter Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: MaxSizeChangeRatio (must be a number)
            if (isNaN(root.MaxSizeChangeRatio[0].text)) {
                throw new Error('Invalid MaxSizeChangeRatio: ' + root.MaxSizeChangeRatio[0].text);
            }
            else {
                that.maxSizeChangeRatio = parseFloat(root.MaxSizeChangeRatio[0].text);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Filter ' + xsiType + realType + '">';
            xml += '<MaxSizeChangeRatio>' + that.maxSizeChangeRatio + '</MaxSizeChangeRatio>';
            xml += '</Filter>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.filterType = realType;
        that.maxSizeChangeRatio = maxSizeChangeRatio;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // MaximumSizeFilter object constructor (Filter)
    //
    function maximumSizeFilter() {
        var that = {}; // base object
        var typeName = 'maximumSizeFilter'; // object type name
        var realType = filterTypes.MaximumSizeFilter;
        var nearRect = nearRectangle();
        var farRect = farRectangle();

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two maximumSizeFilter objects have the same value
        //
        // @param obj A maximumSizeFilter object
        // @return {Boolean} True if obj is an instance of maximumSizeFilter and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! objectMatch(that.nearRect, obj.nearRect) ||
                ! objectMatch(that.farRect, obj.farRect)) {
                retVal = false;
            }

            return retVal;
        }

        function clone() {
            var copy = maximumSizeFilter();
            copy.nearRect = this.nearRect.clone();
            copy.farRect = this.farRect.clone();
            return copy;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Filter
            root = getRootNode(xml, 'Filter');

            // Tag: Filter Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: NearRectangle
            that.nearRect.fromXML(root.NearRectangle[0]);

            // Tag: FarRectangle
            that.farRect.fromXML(root.FarRectangle[0]);
        }

        function  fromJson(json) {
            that.nearRect.fromJson(json.NearRectangle);
            that.farRect.fromJson(json.FarRectangle)
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Filter ' + xsiType + realType + '">';
            xml += that.nearRect.toXML();
            xml += that.farRect.toXML();
            xml += '</Filter>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.filterType = realType;
        that.nearRect = nearRect;
        that.farRect = farRect;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.fromJson=fromJson;
        that.toXML = toXML;

        return that;
    }

    //
    // MinimumSizeFilter object constructor (Filter)
    //
    function minimumSizeFilter() {
        var that = {}; // base object
        var typeName = 'minimumSizeFilter'; // object type name
        var realType = filterTypes.MinimumSizeFilter;
        var nearRect = nearRectangle();
        var farRect = farRectangle();
        var midRect=midRectangle();

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two minimumSizeFilter objects have the same value
        //
        // @param obj A minimumSizeFilter object
        // @return {Boolean} True if obj is an instance of minimumSizeFilter and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! objectMatch(that.nearRect, obj.nearRect) ||
                ! objectMatch(that.farRect, obj.farRect)) {
                retVal = false;
            }

            return retVal;
        }

        function clone() {
            var copy = minimumSizeFilter();
            copy.nearRect = this.nearRect.clone();
            copy.farRect = this.farRect.clone();
            copy.midRect=this.midRect.clone();

            return copy;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Filter
            root = getRootNode(xml, 'Filter');

            // Tag: Filter Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: NearRectangle
            that.nearRect.fromXML(root.NearRectangle[0]);

            // Tag: FarRectangle
            that.farRect.fromXML(root.FarRectangle[0]);

            //Tag:MidRectangle
            if(root.MidRectangle){
                that.midRect.fromXML(root.MidRectangle[0]);
            }

        }

        function  fromJson(json) {
            that.nearRect.fromJson(json.NearRectangle);
            that.farRect.fromJson(json.FarRectangle)
            if (json.MidRectangle){
                that.MidRect.fromJson(json.MidRectangle);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Filter ' + xsiType + realType + '">';
            xml += that.nearRect.toXML();
            xml += that.farRect.toXML();
            xml += '</Filter>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.filterType = realType;
        that.nearRect = nearRect;
        that.farRect = farRect;
        that.midRect=midRect;
        // Expose public methods
        that.equals = equals;
        that.clone = clone;
        that.fromXML = fromXML;
        that.fromJson=fromJson;
        that.toXML = toXML;

        return that;
    }

    //-------- OV Ready: Events --------//

    //
    // EnterAreaAction object constructor (AreaAction)
    //
    function enterAreaAction() {
        var that = {}; // base object
        var typeName = 'enterAreaAction'; // object type name
        var realType = aoiActions.EnterAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two enterAreaAction objects have the same value
        //
        // @param obj An enterAreaAction object
        // @return {Boolean} True if obj is an instance of enterAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // ExitAreaAction object constructor (AreaAction)
    //
    function exitAreaAction() {
        var that = {}; // base object
        var typeName = 'exitAreaAction'; // object type name
        var realType = aoiActions.ExitAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two exitAreaAction objects have the same value
        //
        // @param obj An exitAreaAction object
        // @return {Boolean} True if obj is an instance of exitAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // AppearAreaAction object constructor (AreaAction)
    //
    function appearAreaAction() {
        var that = {}; // base object
        var typeName = 'appearAreaAction'; // object type name
        var realType = aoiActions.AppearAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two appearAreaAction objects have the same value
        //
        // @param obj An appearAreaAction object
        // @return {Boolean} True if obj is an instance of appearAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // DisappearAreaAction object constructor (AreaAction)
    //
    function disappearAreaAction() {
        var that = {}; // base object
        var typeName = 'disappearAreaAction'; // object type name
        var realType = aoiActions.DisappearAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two disappearAreaAction objects have the same value
        //
        // @param obj A disappearAreaAction object
        // @return {Boolean} True if obj is an instance of disappearAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // InsideAreaAction object constructor (AreaAction)
    //
    function insideAreaAction() {
        var that = {}; // base object
        var typeName = 'insideAreaAction'; // object type name
        var realType = aoiActions.InsideAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two insideAreaAction objects have the same value
        //
        // @param obj An insideAreaAction object
        // @return {Boolean} True if obj is an instance of insideAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // TakeAwayAreaAction object constructor (AreaAction)
    //
    function takeAwayAreaAction() {
        var that = {}; // base object
        var typeName = 'takeAwayAreaAction'; // object type name
        var realType = aoiActions.TakeAwayAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two takeAwayAreaAction objects have the same value
        //
        // @param obj A takeAwayAreaAction object
        // @return {Boolean} True if obj is an instance of takeAwayAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function takeAwayAreaActionJSON() {
        var that = {}; // base object
        var typeName = 'takeAwayAreaAction'; // object type name
        var realType = aoiActions.TakeAwayAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two takeAwayAreaAction objects have the same value
        //
        // @param obj A takeAwayAreaAction object
        // @return {Boolean} True if obj is an instance of takeAwayAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {

            // Tag: Action Attribute: xsi:type
            if (json.xsi_type === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== json.xsi_type) {
                throw new Error(that.typeOf + ': wrong type - ' + json.xsi_type);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toJSON() {

        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;

        return that;
    }

    //
    // LeaveBehindAreaAction object constructor (AreaAction)
    //
    function leaveBehindAreaAction() {
        var that = {}; // base object
        var typeName = 'leaveBehindAreaAction'; // object type name
        var realType = aoiActions.LeaveBehindAreaAction;
        var duration = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two leaveBehindAreaAction objects have the same value
        //
        // @param obj A leaveBehindAreaAction object
        // @return {Boolean} True if obj is an instance of leaveBehindAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.duration !== obj.duration) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Duration (must be an integer)
            if (isNaN(root.Duration[0].text)) {
                throw new Error('Invalid Duration: ' + root.Duration[0].text);
            }
            else {
                that.duration = parseInt(root.Duration[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Action ' + xsiType + realType + '">';

            xml += '<Duration>' + that.duration + '</Duration>';

            xml += '</Action>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        that.duration = duration;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // LoiterAreaAction object constructor (AreaAction)
    //
    function loiterAreaAction() {
        var that = {}; // base object
        var typeName = 'loiterAreaAction'; // object type name
        var realType = aoiActions.LoiterAreaAction;
        var duration = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two loiterAreaAction objects have the same value
        //
        // @param obj A loiterAreaAction object
        // @return {Boolean} True if obj is an instance of loiterAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.duration !== obj.duration) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Duration (must be an integer)
            if (isNaN(root.Duration[0].text)) {
                throw new Error('Invalid Duration: ' + root.Duration[0].text);
            }
            else {
                that.duration = parseInt(root.Duration[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Action ' + xsiType + realType + '">';

            xml += '<Duration>' + that.duration + '</Duration>';

            xml += '</Action>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        that.duration = duration;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // OccupancyDataAreaAction object constructor (AreaAction)
    //
    function occupancyDataAreaAction() {
        var that = {}; // base object
        var typeName = 'occupancyDataAreaAction'; // object type name
        var realType = aoiCountingActions.OccupancyDataAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two occupancyDataAreaAction objects have the same value
        //
        // @param obj An occupancyDataAreaAction object
        // @return {Boolean} True if obj is an instance of occupancyDataAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // OccupancyThresholdAreaAction object constructor (AreaAction)
    //
    function occupancyThresholdAreaAction() {
        var that = {}; // base object
        var typeName = 'occupancyThresholdAreaAction'; // object type name
        var realType = aoiCountingActions.OccupancyThresholdAreaAction;
        var comparator = comparators.Equal;
        var count = 0;
        var duration = null; // optional


        //-------- Private Methods --------//

        //
        // Validate and convert Comparator value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the comparators enum.
        //
        function validateComparatorValue(value) {
            if (value !== comparators.Equal &&
                value !== comparators.GreaterThanOrEqual &&
                value !== comparators.LessThanOrEqual) {
                throw new Error('Invalid Comparator value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two occupancyThresholdAreaAction objects have the same value
        //
        // @param obj An occupancyThresholdAreaAction object
        // @return {Boolean} True if obj is an instance of occupancyThresholdAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.comparator !== obj.comparator ||
                that.count !== obj.count ||
                that.duration === null && obj.duration !== null ||
                that.duration !== null && obj.duration === null ||
                that.duration !== obj.duration) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Comparator (must be a Comparators)
            that.comparator =
                validateComparatorValue(root.Comparator[0].text);

            // Tag: Count (must be an integer)
            if (isNaN(root.Count[0].text)) {
                throw new Error('Invalid Count: ' + root.Count[0].text);
            }
            else {
                that.count = parseInt(root.Count[0].text, 10);
            }

            // Tag: Duration (optional and must be an integer)
            if (root.Duration !== undefined && root.Duration !== '') {
                if (isNaN(root.Duration[0].text)) {
                    throw new Error('Invalid Duration: ' + root.Duration[0].text);
                }
                else {
                    that.duration = parseFloat(root.Duration[0].text);
                }
            }
            else {
                that.duration = null;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Action ' + xsiType + realType + '">';

            xml += '<Comparator>' + that.comparator + '</Comparator>';

            xml += '<Count>' + that.count + '</Count>';

            if (that.duration !== null) {
                xml += '<Duration>' + that.duration + '</Duration>';
            }

            xml += '</Action>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        that.comparator = comparator;
        that.count = count;
        that.duration = duration;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // DwellDataAreaAction object constructor (AreaAction)
    //
    function dwellDataAreaAction() {
        var that = {}; // base object
        var typeName = 'dwellDataAreaAction'; // object type name
        var realType = aoiCountingActions.DwellDataAreaAction;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two dwellDataAreaAction objects have the same value
        //
        // @param obj A dwellDataAreaAction object
        // @return {Boolean} True if obj is an instance of dwellDataAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<Action ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // DwellThresholdAreaAction object constructor (AreaAction)
    //
    function dwellThresholdAreaAction() {
        var that = {}; // base object
        var typeName = 'dwellThresholdAreaAction'; // object type name
        var realType = aoiCountingActions.DwellThresholdAreaAction;
        var duration = 0;
        var count = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two dwellThresholdAreaAction objects have the same value
        //
        // @param obj A dwellThresholdAreaAction object
        // @return {Boolean} True if obj is an instance of dwellThresholdAreaAction and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.duration !== obj.duration ||
                that.count !== obj.count) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: Action
            root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Duration (must be an integer)
            if (isNaN(root.Duration[0].text)) {
                throw new Error('Invalid Duration: ' + root.Duration[0].text);
            }
            else {
                that.duration = parseFloat(root.Duration[0].text);
            }

            // Tag: Count (must be an integer)
            if (isNaN(root.Count[0].text)) {
                throw new Error('Invalid Count: ' + root.Count[0].text);
            }
            else {
                that.count = parseInt(root.Count[0].text, 10);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<Action ' + xsiType + realType + '">';

            xml += '<Duration>' + that.duration + '</Duration>';

            xml += '<Count>' + that.count + '</Count>';

            xml += '</Action>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.actionName = realType;
        that.duration = duration;
        that.count = count;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }


    /**
     * DensityAreaAction constructor
     * @return {Object} A new densityAreaAction object
     */
    function densityAreaAction() {
        var that = {}; // base object

        that.typeOf = 'densityAreaAction'; // object type name
        that.actionName = simpleAoiActions.DensityAreaAction;
        that.duration = 30;
        that.level = densityActionLevels.Low;

        //-------- Private Methods --------//
        /**
         * Validate densityActionLevels value
         * @param {String} A string representing a DensityAreaAction Level
         * @return {String} The value argument
         * @exception {Error} If value is not a member of the densityActionLevels enumeration
         */
        function validateLevelValue(value) {
            if (value !== densityActionLevels.Low &&
                value !== densityActionLevels.MediumOrLow &&
                value !== densityActionLevels.Medium &&
                value !== densityActionLevels.MediumOrHigh &&
                value !== densityActionLevels.High) {
                throw new Error('Invalid Level value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//
        /**
         * Determines whether two densityAreaAction objects have the same value
         * @param {Object} obj A densityAreaAction object
         * @return {Boolean} True if obj is an instance of densityAreaAction
         *          and its value is the same as this instance; otherwise, false.
         */
        function equals(obj) {
            var retVal = false;

            if (obj) {
                if (that === obj) {
                    retVal = true;
                }
                else {
                    retVal = (that.typeOf === obj.typeOf) &&
                        (that.duration === obj.duration) &&
                        (that.level === obj.level);
                }
            }

            return retVal;
        }

        /**
         * XML deserialization. Initializes this object from the given XML data.
         * @param {Object | String} xml An XML object or string
         */
        function fromXML(xml) {
            // Tag: Action
            var root = getRootNode(xml, 'Action');

            // Tag: Action Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (that.actionName !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Duration (must be an integer)
            if (isNaN(root.Duration[0].text)) {
                throw new Error('Invalid Duration: ' + root.Duration[0].text);
            }
            else {
                that.duration = parseInt(root.Duration[0].text, 10);
            }

            // Tag: Level
            that.level = validateLevelValue(root.Level[0].text);
        }

        /**
         * XML serialization
         * @return {String} An XML string representing this object
         */
        function toXML() {
            return '<Action ' + xsiType + that.actionName + '">' +
                '<Duration>' + that.duration + '</Duration>' +
                '<Level>' +  that.level + '</Level></Action>';
        }

        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }


    //
    // Tripwire object constructor
    //
    function tripwire() {
        var that = {}; // base object
        var typeName = 'tripwire'; // object type name
        var tripwireDirection = tripwireDirections.AnyDirection;
        var points = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two tripwire objects have the same value
        //
        // @param obj A tripwire object
        // @return {Boolean} True if obj is an instance of tripwire and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.tripwireDirection !== obj.tripwireDirection ||
                ! arrayMatch(that.points, obj.points, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var i;
            var node, obj;

            // Tag: Tripwire
            root = getRootNode(xml, 'Tripwire');

            // Tag: TripwireDirection (must be a TripwireDirections)
            that.tripwireDirection =
                validateTripwireDirectionValue(root.TripwireDirection[0].text);

            // Tag: Points
            that.points = [];
            if (root.Points !== undefined &&
                root.Points.length > 0 &&
                root.Points[0].Point !== undefined &&
                root.Points[0].Point.length > 0) {
                // Tag: Point
                node = root.Points[0].Point;
                for (i = 0; i < node.length; i += 1) {
                    obj = point();
                    obj.fromXML(node[i]);
                    that.points.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var i;

            xml += '<Tripwire>';

            xml += '<TripwireDirection>' + that.tripwireDirection + '</TripwireDirection>';

            if (that.points.length > 0) {
                xml += '<Points>';
                for (i = 0; i < that.points.length; i += 1) {
                    xml += that.points[i].toXML();
                }
                xml += '</Points>';
            }

            xml += '</Tripwire>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.tripwireDirection = tripwireDirection;
        that.points = points;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // CameraTamperEventDefinition object constructor (EventDefinition)
    //
    function cameraTamperEventDefinition() {
        var that = {}; // base object
        var typeName = eventDefObjectTypes.cameraTamperEventDefinition; // object type name
        var realType = eventDefinitionTypes.CameraTamperEventDefinition;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two cameraTamperEventDefinition objects have the same value
        //
        // @param obj A cameraTamperEventDefinition object
        // @return {Boolean} True if obj is an instance of cameraTamperEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: EventDefinition
            root = getRootNode(xml, 'EventDefinition');

            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            return '<EventDefinition ' + xsiType + realType + '" />';
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function cameraTamperEventDefinitionJSON()
    {

    }

    //
    // TripwireEventDefinition object constructor (EventDefinition)
    //
    function tripwireEventDefinition() {
        var that = {}; // base object
        var typeName = eventDefObjectTypes.tripwireEventDefinition; // object type name
        var realType = eventDefinitionTypes.TripwireEventDefinition;
        var classificationList = [];
        var tripwireDirection = tripwireDirections.AnyDirection;
        var points = [];
        var filters = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two tripwireEventDefinition objects have the same value
        //
        // @param obj A tripwireEventDefinition object
        // @return {Boolean} True if obj is an instance of tripwireEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.classificationList, obj.classificationList) ||
                that.tripwireDirection !== obj.tripwireDirection ||
                ! arrayMatch(that.points, obj.points, true) ||
                ! arrayMatch(that.filters, obj.filters, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var i = 0;
            var obj = null;

            // Tag: EventDefinition
            root = getRootNode(xml, 'EventDefinition');

            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Classifications
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.length > 0 &&
                root.Classifications[0].Classification !== undefined &&
                root.Classifications[0].Classification.length > 0) {
                // Tag: Classification
                node = root.Classifications[0].Classification;
                for (i = 0; i < node.length; i += 1) {
                    that.classificationList.push(validateClassificationValue(node[i].text));
                }
            }

            // Tag: TripwireDirection (must be a TripwireDirections)
            that.tripwireDirection =
                validateTripwireDirectionValue(root.TripwireDirection[0].text);

            // Tag: Points
            that.points = [];
            if (root.Points !== undefined &&
                root.Points.length > 0 &&
                root.Points[0].Point !== undefined &&
                root.Points[0].Point.length > 0) {
                // Tag: Point
                node = root.Points[0].Point;
                for (i = 0; i < node.length; i += 1) {
                    obj = point();
                    obj.fromXML(node[i]);
                    that.points.push(obj);
                }
            }

            // Tag: Filters
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0) {
                // Tag: Filter
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; i += 1) {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var i = 0;

            xml += '<EventDefinition ' + xsiType + realType + '">';

            if (that.classificationList.length > 0) {
                xml += '<Classifications>';
                for (i = 0; i < that.classificationList.length; i += 1) {
                    xml += '<Classification>' + that.classificationList[i] + '</Classification>';
                }
                xml += '</Classifications>';
            }

            xml += '<TripwireDirection>' + that.tripwireDirection + '</TripwireDirection>';

            if (that.points.length > 0) {
                xml += '<Points>';
                for (i = 0; i < that.points.length; i += 1) {
                    xml += that.points[i].toXML();
                }
                xml += '</Points>';
            }

            if (that.filters.length > 0) {
                xml += '<Filters>';
                for (i = 0; i < that.filters.length; i += 1) {
                    xml += that.filters[i].toXML();
                }
                xml += '</Filters>';
            }

            xml += '</EventDefinition>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        that.classificationList = classificationList;
        that.tripwireDirection = tripwireDirection;
        that.points = points;
        that.filters = filters;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function tripwireEventDefinitionJSON()
    {
        var that = {}; // base object
        var typeName = eventDefObjectTypes.tripwireEventDefinition; // object type name
        var realType = eventDefinitionTypes.TripwireEventDefinition;
        var classificationList = [];
        var tripwireDirection = tripwireDirections.AnyDirection;
        var points = [];
        var filters = [];
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.classificationList, obj.classificationList) ||
                that.tripwireDirection !== obj.tripwireDirection ||
                ! arrayMatch(that.points, obj.points, true) ||
                ! arrayMatch(that.filters, obj.filters, true)) {
                retVal = false;
            }

            return retVal;
        }
        function fromJSON(json)
        {
            data={"a":1,"b":2}
            var t=data.a;
            var t1=data["b"];
            var root = null;
            var node = null;
            var i = 0;
            var obj = null;


            // Tag: EventDefinition
            root =json;

            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi_type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi_type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Classifications
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.Classification !== undefined &&
                root.Classifications.Classification!="") {
                // Tag: Classification
                node = root.Classifications.Classification;

                that.classificationList.push(validateClassificationValue(node));

            }

            // Tag: TripwireDirection (must be a TripwireDirections)
            that.tripwireDirection =
                validateTripwireDirectionValue(root.Direction);

            // Tag: Points
            that.points = [];
            if (root.Points !== undefined &&
                root.Points["Point"]!== undefined &&
                root.Points["Point"].length > 0) {
                // Tag: Point
                node = root.Points["Point"];
                for (i = 0; i < node.length; i += 1) {
                    obj = pointJSON();
                    obj.fromJSON(node[i])
                    that.points.push(obj);
                }
            }

            // Tag: Filters
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0) {
                // Tag: Filter
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; i += 1) {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        function  toJSON() {

        }
        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        that.classificationList = classificationList;
        that.tripwireDirection = tripwireDirection;
        that.points = points;
        that.filters = filters;
        // Expose public methods
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;
        return that;
    }

    //
    // MultiLineTripwireEventDefinition object constructor (EventDefinition)
    //
    function multiLineTripwireEventDefinition() {
        var that = {}; // base object
        var typeName = eventDefObjectTypes.multiLineTripwireEventDefinition; // object type name
        var realType = eventDefinitionTypes.MultiLineTripwireEventDefinition;
        var classificationList = [];
        var lineCrossingOrder = lineCrossingOrders.BeforeOrAfter;
        var duration = 0;
        var tripwires = [];
        var filters = [];

        //-------- Private Methods --------//

        //
        // Validate and convert LineCrossingOrder value
        //
        // @param value A tag or attribute value
        // @return A valid value with correct type.
        // @remarks The value shall be one of the lineCrossingOrders enum.
        //
        function validateLineCrossingOrderValue(value) {
            if (value !== lineCrossingOrders.Before &&
                value !== lineCrossingOrders.BeforeOrAfter) {
                throw new Error('Invalid LineCrossingOrder value: ' + value);
            }

            return value;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two multiLineTripwireEventDefinition objects have the same value
        //
        // @param obj A multiLineTripwireEventDefinition object
        // @return {Boolean} True if obj is an instance of multiLineTripwireEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.classificationList, obj.classificationList) ||
                that.lineCrossingOrder !== obj.lineCrossingOrder ||
                that.duration !== obj.duration ||
                ! arrayMatch(that.tripwires, obj.tripwires, true) ||
                ! arrayMatch(that.filters, obj.filters, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var i = 0;
            var obj = null;

            // Tag: EventDefinition
            root = getRootNode(xml, 'EventDefinition');

            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Classifications
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.length > 0 &&
                root.Classifications[0].Classification !== undefined &&
                root.Classifications[0].Classification.length > 0) {
                // Tag: Classification
                node = root.Classifications[0].Classification;
                for (i = 0; i < node.length; i += 1) {
                    that.classificationList.push(validateClassificationValue(node[i].text));
                }
            }

            // Tag: LineCrossingOrder (must be a LineCrossingOrders)
            that.lineCrossingOrder =
                validateLineCrossingOrderValue(root.LineCrossingOrder[0].text);

            // Tag: Duration (must be an integer)
            if (isNaN(root.Duration[0].text)) {
                throw new Error('Invalid Duration: ' + root.Duration[0].text);
            }
            else {
                that.duration = parseInt(root.Duration[0].text, 10);
            }

            // Tag: Tripwires
            that.tripwires = [];
            if (root.Tripwires !== undefined &&
                root.Tripwires.length > 0 &&
                root.Tripwires[0].Tripwire !== undefined &&
                root.Tripwires[0].Tripwire.length > 0) {
                // Tag: Tripwire
                node = root.Tripwires[0].Tripwire;
                for (i = 0; i < node.length; i += 1) {
                    obj = tripwire();
                    obj.fromXML(node[i]);
                    that.tripwires.push(obj);
                }
            }

            // Tag: Filters
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0) {
                // Tag: Filter
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; i += 1) {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var i = 0;

            xml += '<EventDefinition ' + xsiType + realType + '">';

            if (that.classificationList.length > 0) {
                xml += '<Classifications>';
                for (i = 0; i < that.classificationList.length; i += 1) {
                    xml += '<Classification>' + that.classificationList[i] + '</Classification>';
                }
                xml += '</Classifications>';
            }

            xml += '<LineCrossingOrder>' + that.lineCrossingOrder + '</LineCrossingOrder>';

            xml += '<Duration>' + that.duration + '</Duration>';

            if (that.tripwires.length > 0) {
                xml += '<Tripwires>';
                for (i = 0; i < that.tripwires.length; i += 1) {
                    xml += that.tripwires[i].toXML();
                }
                xml += '</Tripwires>';
            }

            if (that.filters.length > 0) {
                xml += '<Filters>';
                for (i = 0; i < that.filters.length; i += 1) {
                    xml += that.filters[i].toXML();
                }
                xml += '</Filters>';
            }

            xml += '</EventDefinition>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        that.classificationList = classificationList;
        that.lineCrossingOrder = lineCrossingOrder;
        that.duration = duration;
        that.tripwires = tripwires;
        that.filters = filters;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function multiLineTripwireEventDefinitionJSON()
    {

    }

    //
    // FullFrameEventDefinition object constructor (EventDefinition)
    //
    function fullFrameEventDefinition() {
        var that = {}; // base object
        var typeName = eventDefObjectTypes.fullFrameEventDefinition; // object type name
        var realType = eventDefinitionTypes.FullFrameEventDefinition;
        var classificationList = [];
        var actions = [];
        var filters = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two fullFrameEventDefinition objects have the same value
        //
        // @param obj A fullFrameEventDefinition object
        // @return {Boolean} True if obj is an instance of fullFrameEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.classificationList, obj.classificationList) ||
                ! arrayMatch(that.actions, obj.actions, true) ||
                ! arrayMatch(that.filters, obj.filters, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var i = 0;
            var obj = null;

            // Tag: EventDefinition
            root = getRootNode(xml, 'EventDefinition');

            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Classifications
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.length > 0 &&
                root.Classifications[0].Classification !== undefined &&
                root.Classifications[0].Classification.length > 0) {
                // Tag: Classification
                node = root.Classifications[0].Classification;
                for (i = 0; i < node.length; i += 1) {
                    that.classificationList.push(validateClassificationValue(node[i].text));
                }
            }

            // Tag: Actions
            that.actions = [];
            if (root.Actions !== undefined &&
                root.Actions.length > 0 &&
                root.Actions[0].Action !== undefined &&
                root.Actions[0].Action.length > 0) {
                // Tag: Action
                node = root.Actions[0].Action;
                for (i = 0; i < node.length; i += 1) {
                    obj = areaActionFactory(node[i]);
                    that.actions.push(obj);
                }
            }

            // Tag: Filters
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0) {
                // Tag: Filter
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; i += 1) {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var i = 0;

            xml += '<EventDefinition ' + xsiType + realType + '">';

            if (that.classificationList.length > 0) {
                xml += '<Classifications>';
                for (i = 0; i < that.classificationList.length; i += 1) {
                    xml += '<Classification>' + that.classificationList[i] + '</Classification>';
                }
                xml += '</Classifications>';
            }

            if (that.actions.length > 0) {
                xml += '<Actions>';
                for (i = 0; i < that.actions.length; i += 1) {
                    xml += that.actions[i].toXML();
                }
                xml += '</Actions>';
            }

            if (that.filters.length > 0) {
                xml += '<Filters>';
                for (i = 0; i < that.filters.length; i += 1) {
                    xml += that.filters[i].toXML();
                }
                xml += '</Filters>';
            }

            xml += '</EventDefinition>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        that.classificationList = classificationList;
        that.actions = actions;
        that.filters = filters;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function fullFrameEventDefinitionJSON()
    {

    }

    //
    // areaEventDefinitionBase object constructor (EventDefinition)
    //
    function areaEventDefinitionBase() {
        var that = {}; // base object
        var typeName = ''; // object type name
        var realType = ''; // XML type
        var planeType = planeTypes.Ground;
        var points = [];

        //
        // Determines whether two areaEventDefinitionBase objects have the same value
        //
        // @param obj An areaEventDefinitionBase object
        // @return {Boolean} True if obj is an instance of areaEventDefinitionBase and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (this === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if ((this.planeType === null && obj.planeType !== null) ||
                (this.planeType !== null && obj.planeType === null) ||
                this.planeType !== obj.planeType ||
                ! arrayMatch(this.points, obj.points, true)) {
                retVal = false;
            }

            return retVal;
        }

        function validateXsiType(root) {
            // Tag: EventDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (this.eventType !== root['xsi:type']) {
                throw new Error(this.typeOf + ': wrong type - ' + root['xsi:type']);
            }
        }

        function getPlaneType(root) {
            // Tag: PlaneType (optional and must be a PlaneTypes)
            if (root.PlaneType !== undefined) {
                this.planeType = validatePlaneTypeValue(root.PlaneType[0].text);
            }
            else {
                this.planeType = null;
            }
        }

        function getPoints(root) {
            // Tag: Points
            this.points = [];
            if (root.Points !== undefined &&
                root.Points.length > 0 &&
                root.Points[0].Point !== undefined &&
                root.Points[0].Point.length > 0) {
                // Tag: Point
                node = root.Points[0].Point;
                for (i = 0; i < node.length; i += 1) {
                    obj = point();
                    obj.fromXML(node[i]);
                    this.points.push(obj);
                }
            }
        }

        function openXml() {
            return '<EventDefinition ' + xsiType + this.eventType + '">';
        }

        function planeTypeToXml() {
            return ((this.planeType !== null) ? '<PlaneType>' + this.planeType + '</PlaneType>' : '');
        }

        function pointsToXml() {
            var i, xml = '';

            if (this.points.length > 0) {
                xml += '<Points>';
                for (i = 0; i < this.points.length; i += 1) {
                    xml += this.points[i].toXML();
                }
                xml += '</Points>';
            }

            return xml;
        }


        function closeXml() {
            return '</EventDefinition>';
        }

        // Expose public fields
        that.planeType = planeType;
        that.points = points;

        // Expose public methods
        that.equals = equals;
        that.validateXsiType = validateXsiType;
        that.getPlaneType = getPlaneType;
        that.getPoints = getPoints;
        that.openXml = openXml;
        that.planeTypeToXml = planeTypeToXml;
        that.pointsToXml = pointsToXml;
        that.closeXml = closeXml;

        return that;
    }

    function areaEventDefinitionBaseJSON()
    {
        var that = {};
        var typeName = '';
        var realType = '';
        var planeType = planeTypes.Ground;
        var points = [];

        function equals(obj)
        {

        }

        function validateXsiType(root)
        {
            if (root.xsi_type === undefined)
            {
                throw new Error('xsi:type undefined');
            }
            else if (this.eventType !== root.xsi_type)
            {
                throw new Error(this.typeOf + ": wrong type -" + root.xsi_type);
            }
        }

        function getPlaneType(root)
        {
            if (root.PlaneType !== undefined)
            {
                this.planeType = validatePlaneTypeValue(root.PlaneType);
            }
            else
            {
                this.planeType = null;
            }
        }

        function getPoints(root)
        {
            this.points = [];
            if (root.Points !== undefined &&
                root.Points.Point !== undefined &&
                root.Points.Point.length > 0)
            {
                node = root.Points.Point;
                for (i = 0; i < node.length; ++i)
                {
                    obj = pointJSON();
                    obj.fromJSON(node[i]);
                    this.points.push(obj);
                }
            }
        }

        function openJSON()
        {

        }

        function planeTypeToJSON()
        {

        }

        function pointsToJSON()
        {

        }

        function closeJSON()
        {

        }

        that.planeType = planeType;
        that.points = points;

        that.equals = equals;
        that.validateXsiType = validateXsiType;
        that.getPlaneType = getPlaneType;
        that.getPoints = getPoints;
        that.openJSON = openJSON;
        that.planeTypeToJSON = planeTypeToJSON;
        that.pointsToJSON = pointsToJSON;
        that.closeJSON = closeJSON;
        return that;
    }

    //
    // AreaOfInterestEventDefinition object constructor (EventDefinition)
    //
    function areaOfInterestEventDefinition() {
        var typeName = eventDefObjectTypes.areaOfInterestEventDefinition; // object type name
        var realType = eventDefinitionTypes.AreaOfInterestEventDefinition;
        // Inherit from areaEventDefinitionBase
        var that = areaEventDefinitionBase();
        that.actions = [];
        that.classificationList = [];
        that.filters = [];
        that.baseEquals = that.equals;

        //
        // Determines whether two areaOfInterestEventDefinition objects have the same value
        //
        // @param obj An areaOfInterestEventDefinition object
        // @return {Boolean} True if obj is an instance of areaOfInterestEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            if (! this.baseEquals(obj)) {
                return false;
            }
            return arrayMatch(that.classificationList, obj.classificationList) &&
                arrayMatch(this.actions, obj.actions, true) &&
                arrayMatch(that.filters, obj.filters, true);
        }

        function getClassifications(root) {
            var i, node;

            // Tag: Classifications
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.length > 0 &&
                root.Classifications[0].Classification !== undefined &&
                root.Classifications[0].Classification.length > 0) {
                // Tag: Classification
                node = root.Classifications[0].Classification;
                for (i = 0; i < node.length; i++) {
                    that.classificationList.push(validateClassificationValue(node[i].text));
                }
            }
        }

        function classificationToXml() {
            var i, xml = '';

            if (that.classificationList.length > 0) {
                xml += '<Classifications>';
                for (i = 0; i < that.classificationList.length; i++) {
                    xml += '<Classification>' + that.classificationList[i] + '</Classification>';
                }
                xml += '</Classifications>';
            }

            return xml;
        }

        function getActions(root) {
            var i, node, obj;

            // Tag: Actions
            that.actions = [];
            if (root.Actions !== undefined &&
                root.Actions.length > 0 &&
                root.Actions[0].Action !== undefined &&
                root.Actions[0].Action.length > 0) {
                // Tag: Action
                node = root.Actions[0].Action;
                for (i = 0; i < node.length; i++) {
                    obj = areaActionFactory(node[i]);
                    that.actions.push(obj);
                }
            }
        }

        function actionsToXml() {
            var i, xml = '';

            if (that.actions.length > 0) {
                xml += '<Actions>';
                for (i = 0; i < that.actions.length; i += 1) {
                    xml += that.actions[i].toXML();
                }
                xml += '</Actions>';
            }

            return xml;
        }

        function getFilters(root) {
            // Tag: Filters
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0) {
                // Tag: Filter
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; i++) {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        function filtersToXml() {
            var i, xml = '';

            if (that.filters.length > 0) {
                xml += '<Filters>';
                for (i = 0; i < that.filters.length; i++) {
                    xml += that.filters[i].toXML();
                }
                xml += '</Filters>';
            }

            return xml;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = getRootNode(xml, 'EventDefinition');
            that.validateXsiType(root);
            that.getPlaneType(root);
            that.getPoints(root);
            getClassifications(root);
            getActions(root);
            getFilters(root);
        }


        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = that.openXml();
            xml += that.planeTypeToXml();
            xml += that.pointsToXml();
            xml += classificationToXml();
            xml += actionsToXml();
            xml += filtersToXml();
            xml += that.closeXml();

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function areaOfInterestEventDefinitionJSON()
    {
        var typeName = eventDefObjectTypes.areaOfInterestEventDefinition;
        var realType = eventDefinitionTypes.AreaOfInterestEventDefinition;
        var that = areaEventDefinitionBaseJSON();
        that.actions = [];
        that.classificationList = [];
        that.filters = [];
        that.baseEquals = that.equals;

        function equals(obj)
        {

        }

        function getClassifications(root)
        {
            var i, node;
            that.classificationList = [];
            if (root.Classifications !== undefined &&
                root.Classifications.Classification !== undefined &&
                root.Classifications.Classification.length > 0)
            {
                node = root.Classifications.Classification;
                that.classificationList.push(validateClassificationValue(node));
            }
        }

        function classificationToJSON()
        {

        }

        function getActions(root)
        {
            var i, node, obj;
            that.actions = [];
            /* if (root.Actions !== undefined &&
             root.Actions.xsi_type !== undefined)
             {
             node = root.Actions.xsi_type;
             obj = areaActionFactoryJSON(root.Actions);
             that.actions.push(obj);
             } */
        }

        function actionsToJSON()
        {

        }

        function getFilters(root)
        {
            that.filters = [];
            if (root.Filters !== undefined &&
                root.Filters.length > 0 &&
                root.Filters[0].Filter !== undefined &&
                root.Filters[0].Filter.length > 0)
            {
                node = root.Filters[0].Filter;
                for (i = 0; i < node.length; ++i)
                {
                    obj = filterFactory(node[i]);
                    that.filters.push(obj);
                }
            }
        }

        function filtersToJSON()
        {

        }

        function fromJSON(json)
        {
            that.validateXsiType(json);
            that.getPlaneType(json);
            that.getPoints(json);
            getClassifications(json);
            getActions(json);
            getFilters(json);
        }

        function toJSON(json)
        {

        }

        that.typeOf = typeName;
        that.eventType = realType;
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;

        return that;
    }

    //
    // CountingAreaOfInterestEventDefinition object constructor (EventDefinition)
    //
    function countingAreaOfInterestEventDefinition() {
        var typeName = eventDefObjectTypes.countingAreaOfInterestEventDefinition; // object type name
        var realType = eventDefinitionTypes.CountingAreaOfInterestEventDefinition;

        // Inherit from areaEventDefinitionBase
        var that = areaEventDefinitionBase();
        that.action = null;
        that.classification = null; // optional
        that.baseEquals = that.equals;

        //
        // Determines whether two countingAreaOfInterestEventDefinition objects have the same value
        //
        // @param obj A countingAreaOfInterestEventDefinition object
        // @return {Boolean} True if obj is an instance of countingAreaOfInterestEventDefinition and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            return this.baseEquals(obj) &&
                (that.classification === obj.classification) &&
                objectMatch(that.action, obj.action);
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = getRootNode(xml, 'EventDefinition');
            that.validateXsiType(root);
            that.getPlaneType(root);
            that.getPoints(root);

            // Tag: Classification
            if ((root.Classification !== undefined) && (root.Classification[0] !== undefined)) {
                that.classification = validateClassificationValue(root.Classification[0].text);
            }
            else {
                that.classification = null;
            }

            // Tag: Action
            if ((root.Action !== undefined) && (root.Action[0] !== undefined)) {
                that.action = areaActionFactory(root.Action[0]);
            }
            else {
                that.action = null;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = that.openXml();
            xml += that.planeTypeToXml();
            xml += that.pointsToXml();

            if (that.classification !== null) {
                xml += '<Classification>' + that.classification + '</Classification>';
            }

            if (that.action !== null) {
                xml += that.action.toXML();
            }

            xml += that.closeXml();
            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function countingAreaOfInterestEventDefinitionJSON()
    {

    }

    //
    // SimpleAreaOfInterestEventDefinition object constructor (EventDefinition)
    //
    function simpleAreaOfInterestEventDefinition() {
        var typeName = eventDefObjectTypes.simpleAreaOfInterestEventDefinition; // object type name
        var realType = eventDefinitionTypes.SimpleAreaOfInterestEventDefinition;

        // Inherit from areaEventDefinitionBase
        var that = areaEventDefinitionBase();
        that.action = null;

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = getRootNode(xml, 'EventDefinition');
            that.validateXsiType(root);
            that.getPlaneType(root);
            that.getPoints(root);

            // Tag: Action
            if ((root.Action !== undefined) && (root.Action[0] !== undefined)) {
                that.action = areaActionFactory(root.Action[0]);
            }
            else {
                that.action = null;
            }
        }


        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = that.openXml();
            xml += that.planeTypeToXml();
            xml += that.pointsToXml();

            if (that.action !== null) {
                xml += that.action.toXML();
            }

            xml += that.closeXml();

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.eventType = realType;
        // Expose public methods
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function simpleAreaOfInterestEventDefinitionJSON()
    {

    }


    //-------- OV Ready: Responses --------//

    //
    // SimpleMessageResponse object constructor (ResponseDefinition)
    //
    function simpleMessageResponse() {
        var that = {}; // base object
        var typeName = 'simpleMessageResponse'; // object type name
        var realType = 'SimpleMessageResponse';
        var message = '';
        var customResponseFields = [];

        //-------- Private Methods --------//

        //
        // Determines whether two asociative arrays are identical.
        //
        // @param rhs An asociative array object
        // @param lhs An asociative array object
        // @return {Boolean} True if two arrays are identical; otherwise, false.
        //
        function isSameArray(rhs, lhs) {
            var retVal = true;
            var key = null;

            if (rhs === undefined || rhs === null ||
                lhs === undefined || lhs === null) {
                throw new Error('Invalid argument. rhs and lhs must be asociative arrays');
            }

            for (key in rhs) {
                if (rhs[key] !== lhs[key]) {
                    retVal = false;
                    break;
                }
            }

            if (retVal === true) {
                for (key in lhs) {
                    if (lhs[key] !== rhs[key]) {
                        retVal = false;
                        break;
                    }
                }
            }

            return retVal;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two simpleMessageResponse objects have the same value
        //
        // @param obj A simpleMessageResponse object
        // @return {Boolean} True if obj is an instance of simpleMessageResponse and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.message !== obj.message ||
                ! isSameArray(that.customResponseFields, obj.customResponseFields)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var obj = [];
            var i = 0;


            // Tag: ResponseDefinition
            root = getRootNode(xml, 'ResponseDefinition');

            // Tag: ResponseDefinition Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: Message (optional)
            if (root.Message !== undefined &&
                root.Message[0].text !== undefined) {
                that.message = root.Message[0].text;
            }
            else {
                that.message = '';
            }

            // Tag: CustomResponseFields (optional)
            that.customResponseFields = []; //clean-out array
            if (root.CustomResponseFields !== undefined &&
                root.CustomResponseFields.length > 0 &&
                root.CustomResponseFields[0].CustomResponseField !== undefined &&
                root.CustomResponseFields[0].CustomResponseField.length > 0) {
                // Tag: CustomResponseField
                node = root.CustomResponseFields[0].CustomResponseField;
                for (i = 0; i < node.length; i += 1) {
                    obj = customResponseField();
                    obj.fromXML(node[i]);
                    that.customResponseFields.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var temp = '';
            var count = 0;
            var key;

            xml += '<ResponseDefinition ' + xsiType + realType + '">';
            xml += '<Message>' + that.message + '</Message>';
            xml += '<CustomResponseFields>';
            if (that.customResponseFields.length >0) {
                for (i=0; i< that.customResponseFields.length; i+=1){
                    xml += that.customResponseFields[i].toXML();
                }
            }
            xml += '</CustomResponseFields>';
            xml += '</ResponseDefinition>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.message = message;
        that.customResponseFields = customResponseFields;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    function simpleMessageResponseJSON() {
        var that = {}; // base object
        var typeName = 'simpleMessageResponse'; // object type name
        var realType = 'SimpleMessageResponse';
        var message = '';
        var customResponseFields = [];

        //-------- Private Methods --------//

        //
        // Determines whether two asociative arrays are identical.
        //
        // @param rhs An asociative array object
        // @param lhs An asociative array object
        // @return {Boolean} True if two arrays are identical; otherwise, false.
        //
        function isSameArray(rhs, lhs) {
            var retVal = true;
            var key = null;

            if (rhs === undefined || rhs === null ||
                lhs === undefined || lhs === null) {
                throw new Error('Invalid argument. rhs and lhs must be asociative arrays');
            }

            for (key in rhs) {
                if (rhs[key] !== lhs[key]) {
                    retVal = false;
                    break;
                }
            }

            if (retVal === true) {
                for (key in lhs) {
                    if (lhs[key] !== rhs[key]) {
                        retVal = false;
                        break;
                    }
                }
            }

            return retVal;
        }

        //-------- Public Methods --------//

        //
        // Determines whether two simpleMessageResponse objects have the same value
        //
        // @param obj A simpleMessageResponse object
        // @return {Boolean} True if obj is an instance of simpleMessageResponse and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if (!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.message !== obj.message ||
                !isSameArray(that.customResponseFields, obj.customResponseFields)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromJSON(json) {
            var root = null;
            var node = null;
            var obj = [];
            var i = 0;


            // Tag: ResponseDefinition           

            // Tag: ResponseDefinition Attribute: xsi:type
            if (json.xsi_type === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== json.xsi_type) {
                throw new Error(that.typeOf + ': wrong type - ' + json.xsi_type);
            }

            // Tag: Message (optional)
            if (json.Message !== undefined) {
                that.message = json.Message;
            }
            else {
                that.message = '';
            }

            // Tag: CustomResponseFields (optional)
            /* that.customResponseFields = []; //clean-out array
             if (json.CustomResponseFields !== undefined &&
             json.CustomResponseFields.CustomResponseField !== undefined &&
             json.CustomResponseFields.CustomResponseField.length > 0) {
             // Tag: CustomResponseField
             node = json.CustomResponseFields[0].CustomResponseField;
             for (i = 0; i < node.length; i += 1) {
             obj = customResponseField();
             obj.fromXML(node[i]);
             that.customResponseFields.push(obj);
             }
             } */
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toJSON() {

        }

        // Expose public fields
        that.typeOf = typeName;
        that.message = message;
        that.customResponseFields = customResponseFields;
        // Expose public methods
        that.equals = equals;
        that.fromJSON = fromJSON;
        that.toJSON = toJSON;

        return that;
    }

    function customResponseField(){
        var that = {}; //base object
        var key = '';
        var value = '';

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two Event Push Receiver objects have the same value
        //
        // @param obj A eventPushReceiver object
        // @return {Boolean} True if obj is an instance of eventPushReceiver and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj){
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else
            if (that === obj) {
                retVal = true;
            }
            else
            if (that.key !== obj.key ||
                that.value !== obj.value) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        function fromXML(xml){
            var root = null;

            // Tag: CustomResponseField
            root = getRootNode(xml, 'CustomResponseField');

            // Tag: Key
            if (root.Key[0].text !== undefined) {
                that.key = root.Key[0].text;
            }
            // Tag: Value
            if (root.Value[0].text !== undefined) {
                that.value = root.Value[0].text;
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<CustomResponseField>';
            xml += '<Key>' + that.key + '</Key>';
            xml += '<Value>' + that.value + '</Value>';
            xml += '</CustomResponseField>';

            return xml;
        }

        // Expose public fields
        that.key = key;
        that.value = value;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //-------- OV Ready: Schedules --------//

    //
    // WeeklyTimeBlock object constructor
    //
    function weeklyTimeBlock() {
        var that = {}; // base object
        var typeName = 'weeklyTimeBlock'; // object type name
        var startDayOfWeek = 0;
        var endDayOfWeek = 0;
        var startMinuteOfDay = 0;
        var endMinuteOfDay = 0;

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two weeklyTimeBlock objects have the same value
        //
        // @param obj A weeklyTimeBlock object
        // @return {Boolean} True if obj is an instance of weeklyTimeBlock and its value
        //         is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (that.startDayOfWeek !== obj.startDayOfWeek ||
                that.endDayOfWeek !== obj.endDayOfWeek ||
                that.startMinuteOfDay !== obj.startMinuteOfDay ||
                that.endMinuteOfDay !== obj.endMinuteOfDay) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;

            // Tag: WeeklyTimeBlock
            root = getRootNode(xml, 'WeeklyTimeBlock');

            // Tag: StartDayOfWeek (must be an integer)
            if (isNaN(root.StartDayOfWeek[0].text)) {
                throw new Error('Invalid StartDayOfWeek: ' + root.StartDayOfWeek[0].text);
            }
            else {
                that.startDayOfWeek = parseInt(root.StartDayOfWeek[0].text, 10);
            }

            // Tag: EndDayOfWeek (must be an integer)
            if (isNaN(root.EndDayOfWeek[0].text)) {
                throw new Error('Invalid EndDayOfWeek: ' + root.EndDayOfWeek[0].text);
            }
            else {
                that.endDayOfWeek = parseInt(root.EndDayOfWeek[0].text, 10);
            }

            // Tag: StartMinuteOfDay (must be an integer)
            if (isNaN(root.StartMinuteOfDay[0].text)) {
                throw new Error('Invalid StartMinuteOfDay: ' + root.StartMinuteOfDay[0].text);
            }
            else {
                that.startMinuteOfDay = parseInt(root.StartMinuteOfDay[0].text, 10);
            }

            // Tag: EndMinuteOfDay (must be an integer)
            if (isNaN(root.EndMinuteOfDay[0].text)) {
                throw new Error('Invalid EndMinuteOfDay: ' + root.EndMinuteOfDay[0].text);
            }
            else {
                that.endMinuteOfDay = parseInt(root.EndMinuteOfDay[0].text, 10);
            }


        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';

            xml += '<WeeklyTimeBlock>';
            xml += '<StartDayOfWeek>' + that.startDayOfWeek + '</StartDayOfWeek>';
            xml += '<EndDayOfWeek>' + that.endDayOfWeek + '</EndDayOfWeek>';
            xml += '<StartMinuteOfDay>' + that.startMinuteOfDay + '</StartMinuteOfDay>';
            xml += '<EndMinuteOfDay>' + that.endMinuteOfDay + '</EndMinuteOfDay>';
            xml += '</WeeklyTimeBlock>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.startDayOfWeek = startDayOfWeek;
        that.endDayOfWeek = endDayOfWeek;
        that.startMinuteOfDay = startMinuteOfDay;
        that.endMinuteOfDay = endMinuteOfDay;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //
    // RecurringWeeklySchedule object constructor (Schedule)
    //
    function recurringWeeklySchedule() {
        var that = {}; // base object
        var typeName = 'recurringWeeklySchedule'; // object type name
        var realType = 'RecurringWeeklySchedule';
        var weeklyTimeBlocks = [];

        //-------- Private Methods --------//

        //-------- Public Methods --------//

        //
        // Determines whether two recurringWeeklySchedule objects have the same value
        //
        // @param obj A recurringWeeklySchedule object
        // @return {Boolean} True if obj is an instance of recurringWeeklySchedule and
        //         its value is the same as this instance; otherwise, false.
        //
        function equals(obj) {
            var retVal = true;

            if (obj === null) {
                retVal = false;
            }
            else if (that === obj) {
                retVal = true;
            }
            else if(!obj.hasOwnProperty('typeOf') || obj.typeOf !== typeName) {
                retVal = false;
            }
            else if (! arrayMatch(that.weeklyTimeBlocks, obj.weeklyTimeBlocks, true)) {
                retVal = false;
            }

            return retVal;
        }

        //
        // XML Deserialization
        //
        // @param xml A given xml content (string) or a JSXBObject object.
        // @remarks This function assumes the argument xml is a JSXBObject object
        //          if xml is not a string.
        //
        function fromXML(xml) {
            var root = null;
            var node = null;
            var i = 0;
            var obj = null;

            // Tag: Schedule
            root = getRootNode(xml, 'Schedule');

            // Tag: Schedule Attribute: xsi:type
            if (root['xsi:type'] === undefined) {
                throw new Error('xsi:type undefined');
            }
            else if (realType !== root['xsi:type']) {
                throw new Error(that.typeOf + ': wrong type - ' + root['xsi:type']);
            }

            // Tag: WeeklyTimeBlocks
            that.weeklyTimeBlocks = [];
            if (root.WeeklyTimeBlocks !== undefined &&
                root.WeeklyTimeBlocks.length > 0 &&
                root.WeeklyTimeBlocks[0].WeeklyTimeBlock !== undefined &&
                root.WeeklyTimeBlocks[0].WeeklyTimeBlock.length > 0) {
                // Tag: WeeklyTimeBlock
                node = root.WeeklyTimeBlocks[0].WeeklyTimeBlock;
                for (i = 0; i < node.length; i += 1) {
                    obj = weeklyTimeBlock();
                    obj.fromXML(node[i]);
                    if(root['xmlns']==undefined){
                        obj.endMinuteOfDay+=_timeDifference;
                        if(obj.endMinuteOfDay>=1440){
                            obj.endMinuteOfDay-=1440;
                            obj.endDayOfWeek+=1;
                            if(obj.endDayOfWeek==7){
                                obj.endDayOfWeek-=7;
                            }
                        }
                        obj.startMinuteOfDay+=_timeDifference;
                        if(obj.startMinuteOfDay>=1440){
                            obj.startMinuteOfDay-=1440;
                            obj.startDayOfWeek+=1;
                            if(obj.startDayOfWeek==7){
                                obj.startDayOfWeek-=7;
                            }
                        }
                    }
                    that.weeklyTimeBlocks.push(obj);
                }
            }
        }

        //
        // XML Serialization
        //
        // @return A XML string.
        //
        function toXML() {
            var xml = '';
            var i = 0;

            xml += '<Schedule ' + xsiType + realType + '">';

            if (that.weeklyTimeBlocks.length > 0) {
                xml += '<WeeklyTimeBlocks>';
                for (i = 0; i < that.weeklyTimeBlocks.length; i += 1) {
                    that.weeklyTimeBlocks[i].endMinuteOfDay-=_timeDifference;
                    if(that.weeklyTimeBlocks[i].endMinuteOfDay<0){
                        that.weeklyTimeBlocks[i].endMinuteOfDay+=1440;
                        that.weeklyTimeBlocks[i].endDayOfWeek-=1;
                        if(that.weeklyTimeBlocks[i].endDayOfWeek<0){
                            that.weeklyTimeBlocks[i].endDayOfWeek+=7;
                        }
                    }
                    that.weeklyTimeBlocks[i].startMinuteOfDay-=_timeDifference;
                    if(that.weeklyTimeBlocks[i].startMinuteOfDay<0){
                        that.weeklyTimeBlocks[i].startMinuteOfDay+=1440;
                        that.weeklyTimeBlocks[i].startDayOfWeek-=1;
                        if(that.weeklyTimeBlocks[i].startDayOfweek<0){
                            that.weeklyTimeBlocks[i].startDayOfweek+=7;
                        }
                    }
                    xml += that.weeklyTimeBlocks[i].toXML();
                }
                xml += '</WeeklyTimeBlocks>';
            }

            xml += '</Schedule>';

            return xml;
        }

        // Expose public fields
        that.typeOf = typeName;
        that.weeklyTimeBlocks = weeklyTimeBlocks;
        // Expose public methods
        that.equals = equals;
        that.fromXML = fromXML;
        that.toXML = toXML;

        return that;
    }

    //-------- Data Binding Factory Functions (JSXB) --------//

    /**
     * Returns a new area action object based on the given action name.
     * @param {String} actionName Action name. Must match a member of the
     *                  aoiActions enumeration.
     * @return {Object} A new area action object with default values.
     * @exception {Error} If actionName is not a String or does not specify a
     *                     a valid area action name.
     */
    function createAreaAction(actionName) {
        if (! actionName || (typeof actionName !== 'string')) {
            throw new Error('Invalid argument: actionName');
        }

        switch (actionName) {
            case aoiActions.EnterAreaAction:
                return enterAreaAction();
            case aoiActions.ExitAreaAction:
                return exitAreaAction();
            case aoiActions.AppearAreaAction:
                return appearAreaAction();
            case aoiActions.DisappearAreaAction:
                return disappearAreaAction();
            case aoiActions.InsideAreaAction:
                return insideAreaAction();
            case aoiActions.TakeAwayAreaAction:
                return takeAwayAreaAction();
            case aoiActions.LeaveBehindAreaAction:
                return leaveBehindAreaAction();
            case aoiActions.LoiterAreaAction:
                return loiterAreaAction();
            case aoiCountingActions.OccupancyDataAreaAction:
                return occupancyDataAreaAction();
            case aoiCountingActions.OccupancyThresholdAreaAction:
                return occupancyThresholdAreaAction();
            case aoiCountingActions.DwellDataAreaAction:
                return dwellDataAreaAction();
            case aoiCountingActions.DwellThresholdAreaAction:
                return dwellThresholdAreaAction();
            case simpleAoiActions.DensityAreaAction:
                return densityAreaAction();
            default:
                throw new Error('Invalid area action type "' + actionName + '"');
        }
    }

    //
    // area action data binding factory
    //
    // @param jsxb A given JSXB object.
    // @return An area action object if the xml represents correct
    //         object data; otherwise, null.
    //
    function areaActionFactory(jsxb) {

        var obj = null;

        if (typeof jsxb === 'undefined' || jsxb === null ||
            typeof jsxb === 'string') {
            throw new Error('Invalid argument: jsxb');
        }

        if (jsxb['xsi:type'] === aoiActions.EnterAreaAction) {
            obj = enterAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.ExitAreaAction) {
            obj = exitAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.AppearAreaAction) {
            obj = appearAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.DisappearAreaAction) {
            obj = disappearAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.InsideAreaAction) {
            obj = insideAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.TakeAwayAreaAction) {
            obj = takeAwayAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.LeaveBehindAreaAction) {
            obj = leaveBehindAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiActions.LoiterAreaAction) {
            obj = loiterAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiCountingActions.OccupancyDataAreaAction) {
            obj = occupancyDataAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiCountingActions.OccupancyThresholdAreaAction) {
            obj = occupancyThresholdAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiCountingActions.DwellDataAreaAction) {
            obj = dwellDataAreaAction();
        }
        else if (jsxb['xsi:type'] === aoiCountingActions.DwellThresholdAreaAction) {
            obj = dwellThresholdAreaAction();
        }
        else if (jsxb['xsi:type'] === simpleAoiActions.DensityAreaAction) {
            obj = densityAreaAction();
        }
        else {
            throw new Error('Invalid area action type: ' + jsxb['xsi:type']);
        }

        obj.fromXML(jsxb);

        return obj;
    }

    function areaActionFactoryJSON(json) {

        var obj = null;

        if (typeof json === 'undefined' || json === null ||
            typeof json === 'string') {
            throw new Error('Invalid argument: json');
        }

        if (json.xsi_type === aoiActions.EnterAreaAction) {
            obj = enterAreaAction();
        }
        else if (json.xsi_type === aoiActions.ExitAreaAction) {
            obj = exitAreaAction();
        }
        else if (json.xsi_type === aoiActions.AppearAreaAction) {
            obj = appearAreaAction();
        }
        else if (json.xsi_type === aoiActions.DisappearAreaAction) {
            obj = disappearAreaAction();
        }
        else if (json.xsi_type === aoiActions.InsideAreaAction) {
            obj = insideAreaAction();
        }
        else if (json.xsi_type === aoiActions.TakeAwayAreaAction) {
            obj = takeAwayAreaActionJSON();
        }
        else if (json.xsi_type === aoiActions.LeaveBehindAreaAction) {
            obj = leaveBehindAreaAction();
        }
        else if (json.xsi_type === aoiActions.LoiterAreaAction) {
            obj = loiterAreaAction();
        }
        else if (json.xsi_type === aoiCountingActions.OccupancyDataAreaAction) {
            obj = occupancyDataAreaAction();
        }
        else if (json.xsi_type === aoiCountingActions.OccupancyThresholdAreaAction) {
            obj = occupancyThresholdAreaAction();
        }
        else if (json.xsi_type === aoiCountingActions.DwellDataAreaAction) {
            obj = dwellDataAreaAction();
        }
        else if (json.xsi_type === aoiCountingActions.DwellThresholdAreaAction) {
            obj = dwellThresholdAreaAction();
        }
        else if (json.xsi_type === simpleAoiActions.DensityAreaAction) {
            obj = densityAreaAction();
        }
        else {
            throw new Error('Invalid area action type: ' + json.xsi_type);
        }

        obj.fromJSON(json);

        return obj;
    }

    //
    // filter data binding factory
    //
    // @param jsxb A given JSXB object.
    // @return A filter object if the xml represents correct
    //         object data; otherwise, null.
    //
    function filterFactory(jsxb) {

        var obj = null;

        if (typeof jsxb === 'undefined' || jsxb === null ||
            typeof jsxb === 'string') {
            throw new Error('Invalid argument: jsxb');
        }

        if (jsxb['xsi:type'] === filterTypes.ShapeAndDirectionFilter) {
            obj = shapeAndDirectionFilter();
        }
        else if (jsxb['xsi:type'] === filterTypes.SizeChangeFilter) {
            obj = sizeChangeFilter();
        }
        else if (jsxb['xsi:type'] === filterTypes.MaximumSizeFilter) {
            obj = maximumSizeFilter();
        }
        else if (jsxb['xsi:type'] === filterTypes.MinimumSizeFilter) {
            obj = minimumSizeFilter();
        }
        else {
            throw new Error('Invalid filter type: ' + jsxb['xsi:type']);
        }

        //obj.fromXML(jsxb);
        obj.fromJson(jsxb);
        return obj;
    }

    function filterFactoryJSON(json) {

        var obj = null;

        if (typeof json === 'undefined' || json === null ||
            typeof json === 'string') {
            throw new Error('Invalid argument: json');
        }

        if (json.xsi_type === filterTypes.ShapeAndDirectionFilter) {
            obj = shapeAndDirectionFilter();
        }
        else if (json.xsi_type === filterTypes.SizeChangeFilter) {
            obj = sizeChangeFilter();
        }
        else if (json.xsi_type === filterTypes.MaximumSizeFilter) {
            obj = maximumSizeFilter();
        }
        else if (json.xsi_type === filterTypes.MinimumSizeFilter) {
            obj = minimumSizeFilter();
        }
        else {
            throw new Error('Invalid filter type: ' + json.xsi_type);
        }

        obj.fromXML(json);

        return obj;
    }

    //
    // event definition data binding factory
    //
    // @param jsxb A given JSXB object.
    // @return A event definition object if the xml represents correct
    //         object data; otherwise, null.
    //
    function eventDefinitionFactory(jsxb) {

        var obj = null;

        if (typeof jsxb === 'undefined' || jsxb === null ||
            typeof jsxb === 'string') {
            throw new Error('Invalid argument: jsxb');
        }

        if (jsxb['xsi:type'] === eventDefinitionTypes.CameraTamperEventDefinition) {
            obj = cameraTamperEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.TripwireEventDefinition) {
            obj = tripwireEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.MultiLineTripwireEventDefinition) {
            obj = multiLineTripwireEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.FullFrameEventDefinition) {
            obj = fullFrameEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.AreaOfInterestEventDefinition) {
            obj = areaOfInterestEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.CountingAreaOfInterestEventDefinition) {
            obj = countingAreaOfInterestEventDefinition();
        }
        else if (jsxb['xsi:type'] === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition) {
            obj = simpleAreaOfInterestEventDefinition();
        }
        else {
            throw new Error('Invalid event definition type: ' + jsxb['xsi:type']);
        }

        obj.fromXML(jsxb);

        return obj;
    }

    function eventDefinitionFactoryJSON(json)
    {
        var obj = null;
        if (typeof json === 'undefined' || json === null ||
            typeof json ==='string')
        {
            throw new Error('Invalid argument: json');
        }

        if (json.xsi_type === eventDefinitionTypes.CameraTamperEventDefinition)
        {
            obj = cameraTamperEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.TripwireEventDefinition)
        {
            obj = tripwireEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.MultiLineTripwireEventDefinition)
        {
            obj = multiLineTripwireEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.FullFrameEventDefinition)
        {
            obj = fullFrameEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.AreaOfInterestEventDefinition)
        {
            obj = areaOfInterestEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.CountingAreaOfInterestEventDefinition)
        {
            obj = countingAreaOfInterestEventDefinitionJSON();
        }
        else if (json.xsi_type === eventDefinitionTypes.SimpleAreaOfInterestEventDefinition)
        {
            obj = simpleAreaOfInterestEventDefinitionJSON();
        }
        else
        {
            throw new Error('Invalid event definition type: ' + json.xsi_type);
        }
        obj.fromJSON(json);
        return obj;
    }

    //
    // response definition data binding factory
    //
    // @param jsxb A given JSXB object.
    // @return A response definition object if the xml represents correct
    //         object data; otherwise, null.
    //
    function responseDefinitionFactory(jsxb) {

        var obj = null;

        if (typeof jsxb === 'undefined' || jsxb === null ||
            typeof jsxb === 'string') {
            throw new Error('Invalid argument: jsxb');
        }

        if (jsxb['xsi:type'] === 'SimpleMessageResponse') {
            obj = simpleMessageResponse();
        }
        else {
            throw new Error('Invalid event definition type: ' + jsxb['xsi:type']);
        }

        obj.fromXML(jsxb);

        return obj;
    }

    function responseDefinitionFactoryJSON(json) {

        var obj = null;

        if (typeof json === 'undefined' || json === null ||
            typeof json === 'string') {
            throw new Error('Invalid argument: json');
        }

        if (json.xsi_type === 'SimpleMessageResponse') {
            obj = simpleMessageResponseJSON();
        }
        else {
            throw new Error('Invalid event definition type: ' + json.xsi_type);
        }

        obj.fromJSON(json);

        return obj;
    }
    //
    // schedule data binding factory
    //
    // @param jsxb A given JSXB object.
    // @return A schedule object if the xml represents correct
    //         object data; otherwise, null.
    //
    function scheduleFactory(jsxb) {

        var obj = null;

        if (typeof jsxb === 'undefined' || jsxb === null ||
            typeof jsxb === 'string') {
            throw new Error('Invalid argument: jsxb');
        }

        if (jsxb['xsi:type'] === 'RecurringWeeklySchedule') {
            obj = recurringWeeklySchedule();
        }
        else {
            throw new Error('Invalid schedule type: ' + jsxb['xsi:type']);
        }

        obj.fromXML(jsxb);

        return obj;
    }

    //-------- Data Binding Factory Functions (XML) --------//

    //
    // ovreadyProtocol data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return An ovreadyProtocol object if the xml represents correct
    //         object data; otherwise, null.
    //
    function ovreadyProtocolFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = ovreadyProtocol();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating ovreadyProtocol from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // channelList data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A channelList object if the xml represents correct
    //         object data; otherwise, null.
    //
    function channelListFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = channelList();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating channelList from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // channel data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A channel object if the xml represents correct
    //         object data; otherwise, null.
    //
    function channelFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = channel();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating channel from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    function parameterSliderFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = parameterSlider();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating parameterSlider from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    function parameterSliderListFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = parameterSliderList();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating parameterSliderList from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // channelAnalyticsCapabilities data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return An channelAnalyticsCapabilities object if the xml represents correct
    //         object data; otherwise, null.
    //
    function channelAnalyticsCapabilitiesFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = channelAnalyticsCapabilities();
                if ((typeof xml) === 'string' && xml !== "") {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating analyticsCapabilities from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    function channelAnalyticsCapabilitiesFactoryJSON(json) {
        var obj = null;

        if (json !== undefined && json !== null) {
            try {
                obj = channelAnalyticsCapabilitiesJSON();
                obj.fromJSON(json);
            }
            catch (ex) {
                $.log('Error creating analyticsCapabilities from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // viewList data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A viewList object if the xml represents correct
    //         object data; otherwise, null.
    //
    function viewListFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = viewList();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating viewList from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // viewStatus data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A viewStatus object if the xml represents correct
    //         object data; otherwise, null.
    //
    function viewStatusFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = viewStatus();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating viewStatus from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // ruleList data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A ruleList object if the xml represents correct
    //         object data; otherwise, null.
    //
    function ruleListFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = ruleList();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating ruleList from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // fullRuleList data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A ruleList object if the xml represents correct
    //         object data; otherwise, null.
    //
    function fullRuleListFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = fullRuleList();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating fullRuleList from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    //
    // rule data binding factory
    //
    // @param xml A given xml object. The xml object type can be
    //                either a text string or DOM document.
    // @return A rule object if the xml represents correct
    //         object data; otherwise, null.
    //
    function ruleFactory(xml) {
        var obj = null;

        if (xml !== undefined && xml !== null) {
            try {
                obj = rule();
                if ((typeof xml) === 'string') {
                    obj.fromXML(xml);
                }
                else {
                    // Assume the xml is a DOM oject
                    obj.fromXML($.xml2json(xml, true));
                }
            }
            catch (ex) {
                $.log('Error creating rule from XML: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }

        return obj;
    }

    function ruleFactoryJSON(json)
    {
        var obj = null;

        if (json !== undefined && json !== null)
        {
            try
            {
                obj = ruleJSON();
                obj.fromJSON(json);
            }
            catch (ex) {
                $.log('Error creating rule from JSON: ' + ex.name + ' - ' + ex.message);
                if (ex.stack) {
                    $.log(ex.stack);
                }
                obj = null;
            }
        }
        return obj;
    }

    var setDirty = function (isDirty) {
        _isDirty = isDirty;
        if (_isDirty) {
            $('#save_btn').prop('disabled', false);
        }
        else {
            $('#save_btn').prop('disabled', true);
        }
        return _isDirty;
    };

    // Export public functions and fields.
    var ns = objectvideo.ovready;
    ns.specVersion = specVersion;
    // OV Ready: Enumerations
    ns.eventDefinitionTypes = eventDefinitionTypes;
    ns.eventDefObjectTypes = eventDefObjectTypes;
    ns.aoiActions = aoiActions;
    ns.aoiCountingActions = aoiCountingActions;
    ns.simpleAoiActions = simpleAoiActions;
    ns.authenticationTypes = authenticationTypes;
    ns.channelOperations = channelOperations;
    ns.classifications = classifications;
    ns.comparators = comparators;
    ns.densityActionLevels = densityActionLevels;
    ns.contentTransferEncodings = contentTransferEncodings;
    ns.eventPushReceiverTypes = eventPushReceiverTypes;
    ns.eventPushModes = eventPushModes;
    ns.countRuleTypes = countRuleTypes;
    ns.dataFormatTypes = dataFormatTypes;
    ns.dateTimeConfigurationTypes = dateTimeConfigurationTypes;
    ns.dateTimeFormats = dateTimeFormats;
    ns.deviceOperations = deviceOperations;
    ns.deviceStatuses = deviceStatuses;
    ns.filterTypes = filterTypes;
    ns.lineCrossingOrders = lineCrossingOrders;
    ns.passwordSchemes = passwordSchemes;
    ns.planeTypes = planeTypes;
    ns.transportTypes = transportTypes;
    ns.tripwireDirections = tripwireDirections;
    ns.viewStates = viewStates;
    // OV Ready: Geometric Objects
    ns.point = point;
    ns.rect = rect;
    ns.nearRectangle = nearRectangle;
    ns.farRectangle = farRectangle;
    // OV Ready: Protocol
    ns.transport = transport;
    ns.ovreadyProtocol = ovreadyProtocol;
    // OV Ready: Channel
    ns.channelSummary = channelSummary;
    ns.channelList = channelList;
    ns.analyticsFrameSize = analyticsFrameSize;
    ns.alertPolling = alertPolling;
    ns.alertStreaming = alertStreaming;
    ns.alertConfiguration = alertConfiguration;
    ns.channel = channel;
    ns.channelAnalyticsCapabilities = channelAnalyticsCapabilities;
    ns.channelAnalyticsCapabilitiesFactory = channelAnalyticsCapabilitiesFactory;
    ns.channelAnalyticsCapabilitiesFactoryJSON = channelAnalyticsCapabilitiesFactoryJSON;
    ns.supportedEvent = supportedEvent;
    // OV Ready: Views
    ns.viewSummary = viewSummary;
    ns.viewList = viewList;
    ns.viewInfo = viewInfo;
    ns.viewStatus = viewStatus;
    // OV Ready: Rules
    ns.ruleSummary = ruleSummary;
    ns.ruleList = ruleList;
    ns.fullRuleList = fullRuleList;
    ns.fullRuleListFactory = fullRuleListFactory;
    ns.rule = rule;
    // OV Ready: Filters
    ns.shapeAndDirectionFilter = shapeAndDirectionFilter;
    ns.sizeChangeFilter = sizeChangeFilter;
    ns.maximumSizeFilter = maximumSizeFilter;
    ns.minimumSizeFilter = minimumSizeFilter;
    // OV Ready: Events
    ns.enterAreaAction = enterAreaAction;
    ns.exitAreaAction = exitAreaAction;
    ns.appearAreaAction = appearAreaAction;
    ns.disappearAreaAction = disappearAreaAction;
    ns.insideAreaAction = insideAreaAction;
    ns.takeAwayAreaAction = takeAwayAreaAction;
    ns.leaveBehindAreaAction = leaveBehindAreaAction;
    ns.loiterAreaAction = loiterAreaAction;
    ns.occupancyDataAreaAction = occupancyDataAreaAction;
    ns.occupancyThresholdAreaAction = occupancyThresholdAreaAction;
    ns.dwellDataAreaAction = dwellDataAreaAction;
    ns.dwellThresholdAreaAction = dwellThresholdAreaAction;
    ns.densityAreaAction = densityAreaAction;
    ns.tripwire = tripwire;
    ns.cameraTamperEventDefinition = cameraTamperEventDefinition;
    ns.tripwireEventDefinition = tripwireEventDefinition;
    ns.multiLineTripwireEventDefinition = multiLineTripwireEventDefinition;
    ns.fullFrameEventDefinition = fullFrameEventDefinition;
    ns.areaOfInterestEventDefinition = areaOfInterestEventDefinition;
    ns.countingAreaOfInterestEventDefinition = countingAreaOfInterestEventDefinition;
    ns.simpleAreaOfInterestEventDefinition = simpleAreaOfInterestEventDefinition;
    // OV Ready: Responses
    ns.simpleMessageResponse = simpleMessageResponse;
    ns.customResponseField = customResponseField;
    // OV Ready: Schedules
    ns.weeklyTimeBlock = weeklyTimeBlock;
    ns.recurringWeeklySchedule = recurringWeeklySchedule;
    // Data Binding Factory Functions (JSXB)
    ns.createAreaAction = createAreaAction;
    ns.areaActionFactory = areaActionFactory;
    ns.filterFactory = filterFactory;
    ns.eventDefinitionFactory = eventDefinitionFactory;
    ns.eventDefinitionFactoryJSON = eventDefinitionFactoryJSON;
    ns.responseDefinitionFactory = responseDefinitionFactory;
    ns.scheduleFactory = scheduleFactory;
    // Data Binding Factory Functions (XML)
    ns.ovreadyProtocolFactory = ovreadyProtocolFactory;
    ns.channelListFactory = channelListFactory;
    ns.channelFactory = channelFactory;
    ns.viewListFactory = viewListFactory;
    ns.viewStatusFactory = viewStatusFactory;
    ns.ruleListFactory = ruleListFactory;
    ns.ruleFactory = ruleFactory;
    ns.ruleFactoryJSON = ruleFactoryJSON;
    ns.analyticsCalibration = analyticsCalibration;
    ns.analyticsCalibrationFactory = analyticsCalibrationFactory;
    ns.personCalibrationSample = personCalibrationSample;
    ns.parameterSlider = parameterSlider;
    ns.parameterSliderFactory = parameterSliderFactory;
    ns.parameterSliderList = parameterSliderList;
    ns.parameterSliderSummary = parameterSliderSummary;
    ns.parameterSliderListFactory = parameterSliderListFactory;

    // TEMPORARY FOR SUB-FILE USAGE ONLY
    // utility functions
    ns.objectMatch = objectMatch;
    ns.getRootNode = getRootNode;
    ns.arrayMatch = arrayMatch;
    ns.associativeArrayMatch = associativeArrayMatch;
    ns.toBoolean = toBoolean;
    ns.boolTagToBoolean = boolTagToBoolean;
    ns.convertNodeWidthHeight = convertNodeWidthHeight;

    // XML common
    ns.xmlDeclaration = xmlDeclaration;
    ns.xmlnsAttr = xmlnsAttr;
    ns.xmlnsXLink = xmlnsXLink;
    ns.xsiType = xsiType;
    ns.xlinkSimple = xlinkSimple;

    // Common Validation
    ns.validateClassificationValue = validateClassificationValue;
    ns.validatePlaneType = validatePlaneTypeValue;
    ns.validateTripwireDirectionValue = validateTripwireDirectionValue;

    ns.setDirty=setDirty;
})(jQuery);
