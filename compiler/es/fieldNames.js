var 
// pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
htmlFieldCache = {
    class: ['className', null, false],
    for: ['htmlFor', null, false],
    onDoubleClick: ['ondblclick', null, false]
}, svgFieldCache = {
    className: ['class', null, true],
    htmlFor: ['for', null, true],
    onDoubleClick: ['ondblclick', null, false]
};
var attributeOnlyRx = /^(aria|data)[\-A-Z]/, isAttrOnlyField = function (prop) { return attributeOnlyRx.test(prop); }, propOnlyRx = /^(on|style)/, isPropOnlyField = function (prop) { return propOnlyRx.test(prop); }, propPartRx = /[a-z][A-Z]/g, getAttrName = function (prop) { return prop.replace(propPartRx, function (m) { return m[0] + '-' + m[1]; }).toLowerCase(); }, jsxEventPropRx = /^on[A-Z]/, attrPartRx = /\-(?:[a-z]|$)/g, getPropName = function (attr) {
    var prop = attr.replace(attrPartRx, function (m) { return m.length === 1 ? '' : m[1].toUpperCase(); });
    return jsxEventPropRx.test(prop) ? prop.toLowerCase() : prop;
}, deepPropRx = /^(style)([A-Z])/, buildPropData = function (prop) {
    var m = deepPropRx.exec(prop);
    return m ? [m[2].toLowerCase() + prop.substr(m[0].length), m[1], false] : [prop, null, false];
}, attrNamespaces = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
}, attrNamespaceRx = new RegExp("^(" + Object.keys(attrNamespaces).join('|') + ")-(.*)"), buildAttrData = function (attr) {
    var m = attrNamespaceRx.exec(attr);
    return m ? [m[2], attrNamespaces[m[1]], true] : [attr, null, true];
};
export var getFieldData = function (field, svg) {
    var cache = svg ? svgFieldCache : htmlFieldCache, cached = cache[field];
    if (cached)
        return cached;
    var attr = svg && !isPropOnlyField(field)
        || !svg && isAttrOnlyField(field), name = attr ? getAttrName(field) : getPropName(field), data = attr ? buildAttrData(name) : buildPropData(name);
    return cache[field] = data;
};
