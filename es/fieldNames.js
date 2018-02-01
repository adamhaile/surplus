// this file is common between compiler and runtime
export var attributeOnlyRx = /^(aria|data)[\-A-Z]/, isAttrOnlyField = function (prop) { return attributeOnlyRx.test(prop); }, propOnlyRx = /^(on|style)/, isPropOnlyField = function (prop) { return propOnlyRx.test(prop); }, propPartRx = /[a-z][A-Z]/g, getAttrName = function (prop) {
    return prop === "className" ? "class" :
        prop === "htmlFor" ? "for" :
            prop.replace(propPartRx, function (m) { return m[0] + '-' + m[1]; }).toLowerCase();
}, jsxEventPropRx = /^on[A-Z]/, attrPartRx = /\-(?:[a-z]|$)/g, getPropName = function (attr) {
    var prop = attr === "class" ? "className" :
        attr === "for" ? "htmlFor" :
            attr.replace(attrPartRx, function (m) { return m.length === 1 ? '' : m[1].toUpperCase(); });
    return jsxEventPropRx.test(prop) ? (prop === "onDoubleClick" ? "ondblclick" : prop.toLowerCase()) : prop;
}, deepPropRx = /^(style)([A-Z])/, isDeepProp = function (prop) { var m = deepPropRx.exec(prop); return m ? [m[1], m[2].toLowerCase() + prop.substr(m[0].length)] : null; }, attrNamespaces = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
}, nsAttrRx = new RegExp("^(" + Object.keys(attrNamespaces).join('|') + ")-(.*)"), isNSAttr = function (attr) { var m = nsAttrRx.exec(attr); return m ? [attrNamespaces[m[1]], m[2]] : null; };
