(function ($) {
    $.i18n = {};
    $.i18n.map = {};
    $.i18n.properties = function (settings) {
        var defaults = { name: "Messages", language: "", path: "", mode: "vars", callback: function () { } };
        settings = $.extend(defaults, settings);
        if (settings.language === null || settings.language == "") {
            settings.language = normaliseLanguageCode(navigator.language || navigator.userLanguage)
        }
        if (settings.language === null) {
            settings.language = ""
        }
        var files = getFiles(settings.name);
        for (i = 0; i < files.length; i++) {
            loadAndParseFile(settings.path + files[i] + ".properties", settings.language, settings.mode);
            if (settings.language.length >= 2) {
                loadAndParseFile(settings.path + files[i] + "_" + settings.language.substring(0, 2) + ".properties", settings.language, settings.mode)
            }
            if (settings.language.length >= 5) { loadAndParseFile(settings.path + files[i] + "_" + settings.language.substring(0, 5) + ".properties", settings.language, settings.mode) }
        }
        if (settings.callback) {
            settings.callback()
        }
    };
    $.i18n.prop = function (key, placeHolderValues) {
        var value = $.i18n.map[key];
        if (value === null) {
            return key
        }
        if (!placeHolderValues) {
            return value
        } else {
            for (var i = 0; i < placeHolderValues.length; i++) {
                var regexp = new RegExp("\\{(" + i + ")\\}", "g");
                value = value.replace(regexp, placeHolderValues[i])
            } return value
        }
    };
    function loadAndParseFile(filename, language, mode) {
        $.ajax({
            url: filename,
            async: false,
             dataType: "text",
            success: function (data, status) {
                var parsed = "";
                var parameters = data.split(/\n/);
                var regPlaceHolder = /(\{\d+\})/g;
                var regRepPlaceHolder = /\{(\d+)\}/g;
                for (var i = 0; i < parameters.length; i++) {
                    parameters[i] = parameters[i].replace(/^\s\s*/, "").replace(/\s\s*$/, "");
                    if (parameters[i].length > 0 && parameters[i].match("^#") != "#") {
                        var pair = parameters[i].split("=");
                        if (pair.length > 0) {
                            var name = unescape(pair[0]).replace(/^\s\s*/, "").replace(/\s\s*$/, "");
                            var value = pair.length == 1 ? "" : pair[1]; value = value.replace(/"/g, '\\"');
                            value = value.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
                            if (mode == "map" || mode == "both") {
                                $.i18n.map[name] = value
                            }
                            if (mode == "vars" || mode == "both") {
                                checkKeyNamespace(name);
                                if (regPlaceHolder.test(value)) {
                                    var parts = value.split(regPlaceHolder);
                                    var first = true; var fnArgs = "";
                                    var usedArgs = [];
                                    for (var p = 0; p < parts.length; p++) {
                                        if (regPlaceHolder.test(parts[p]) && usedArgs.indexOf(parts[p]) == -1) {
                                            if (!first) {
                                                fnArgs += ","
                                            }
                                            fnArgs += parts[p].replace(regRepPlaceHolder, "v$1"); usedArgs.push(parts[p]); first = false
                                        }
                                    } parsed += name + "=function(" + fnArgs + "){"; var fnExpr = '"' + value.replace(regRepPlaceHolder, '"+v$1+"') + '"'; parsed += "return " + fnExpr + ";};"
                                } else { parsed += name + '="' + value + '";' }
                            }
                        }
                    }
                } 
                eval(parsed)
            }
        })
    }
    function checkKeyNamespace(key) {
        var regDot = /\./g;
        if (regDot.test(key)) {
            var fullname = "";
            var names = key.split(/\./);
            for (var i = 0; i < names.length; i++) {
                if (i > 0) {
                    fullname += "."
                }
                fullname += names[i];
                if (eval("typeof " + fullname + ' == "undefined"')) {
                    eval(fullname + "={};")
                }
            }
        }
    }
    function getFiles(names) {
        return (names && names.constructor == Array) ? names : [names]
    }
    function normaliseLanguageCode(lang) {
        lang = lang.toLowerCase();
        if (lang.length > 3) {
            lang = lang.substring(0, 3) + lang.substring(3).toUpperCase()
        }
        return lang
    }
})(jQuery);