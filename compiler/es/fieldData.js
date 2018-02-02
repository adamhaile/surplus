var 
// pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
htmlFieldCache = {
    // special props
    style: ['style', null, 3 /* Assign */],
    ref: ['ref', null, 2 /* Ignore */],
    fn: ['fn', null, 2 /* Ignore */],
    // attr compat
    class: ['className', null, 0 /* Property */],
    for: ['htmlFor', null, 0 /* Property */],
    // a few React oddities, mostly disagreeing about casing
    onDoubleClick: ['ondblclick', null, 0 /* Property */],
    spellCheck: ['spellcheck', null, 0 /* Property */],
    allowFullScreen: ['allowFullscreen', null, 0 /* Property */],
    autoFocus: ['autofocus', null, 0 /* Property */],
    autoPlay: ['autoplay', null, 0 /* Property */],
}, svgFieldCache = {
    // special props
    style: ['style', null, 3 /* Assign */],
    ref: ['ref', null, 2 /* Ignore */],
    fn: ['fn', null, 2 /* Ignore */],
    // property compat
    className: ['class', null, 1 /* Attribute */],
    htmlFor: ['for', null, 1 /* Attribute */],
    // React compat
    onDoubleClick: ['ondblclick', null, 0 /* Property */],
    // attributes with eccentric casing - some SVG attrs are snake-cased, some camelCased
    allowReorder: ['allowReorder', null, 1 /* Attribute */],
    attributeName: ['attributeName', null, 1 /* Attribute */],
    attributeType: ['attributeType', null, 1 /* Attribute */],
    autoReverse: ['autoReverse', null, 1 /* Attribute */],
    baseFrequency: ['baseFrequency', null, 1 /* Attribute */],
    calcMode: ['calcMode', null, 1 /* Attribute */],
    clipPathUnits: ['clipPathUnits', null, 1 /* Attribute */],
    contentScriptType: ['contentScriptType', null, 1 /* Attribute */],
    contentStyleType: ['contentStyleType', null, 1 /* Attribute */],
    diffuseConstant: ['diffuseConstant', null, 1 /* Attribute */],
    edgeMode: ['edgeMode', null, 1 /* Attribute */],
    externalResourcesRequired: ['externalResourcesRequired', null, 1 /* Attribute */],
    filterRes: ['filterRes', null, 1 /* Attribute */],
    filterUnits: ['filterUnits', null, 1 /* Attribute */],
    gradientTransform: ['gradientTransform', null, 1 /* Attribute */],
    gradientUnits: ['gradientUnits', null, 1 /* Attribute */],
    kernelMatrix: ['kernelMatrix', null, 1 /* Attribute */],
    kernelUnitLength: ['kernelUnitLength', null, 1 /* Attribute */],
    keyPoints: ['keyPoints', null, 1 /* Attribute */],
    keySplines: ['keySplines', null, 1 /* Attribute */],
    keyTimes: ['keyTimes', null, 1 /* Attribute */],
    lengthAdjust: ['lengthAdjust', null, 1 /* Attribute */],
    limitingConeAngle: ['limitingConeAngle', null, 1 /* Attribute */],
    markerHeight: ['markerHeight', null, 1 /* Attribute */],
    markerUnits: ['markerUnits', null, 1 /* Attribute */],
    maskContentUnits: ['maskContentUnits', null, 1 /* Attribute */],
    maskUnits: ['maskUnits', null, 1 /* Attribute */],
    numOctaves: ['numOctaves', null, 1 /* Attribute */],
    pathLength: ['pathLength', null, 1 /* Attribute */],
    patternContentUnits: ['patternContentUnits', null, 1 /* Attribute */],
    patternTransform: ['patternTransform', null, 1 /* Attribute */],
    patternUnits: ['patternUnits', null, 1 /* Attribute */],
    pointsAtX: ['pointsAtX', null, 1 /* Attribute */],
    pointsAtY: ['pointsAtY', null, 1 /* Attribute */],
    pointsAtZ: ['pointsAtZ', null, 1 /* Attribute */],
    preserveAlpha: ['preserveAlpha', null, 1 /* Attribute */],
    preserveAspectRatio: ['preserveAspectRatio', null, 1 /* Attribute */],
    primitiveUnits: ['primitiveUnits', null, 1 /* Attribute */],
    refX: ['refX', null, 1 /* Attribute */],
    refY: ['refY', null, 1 /* Attribute */],
    repeatCount: ['repeatCount', null, 1 /* Attribute */],
    repeatDur: ['repeatDur', null, 1 /* Attribute */],
    requiredExtensions: ['requiredExtensions', null, 1 /* Attribute */],
    requiredFeatures: ['requiredFeatures', null, 1 /* Attribute */],
    specularConstant: ['specularConstant', null, 1 /* Attribute */],
    specularExponent: ['specularExponent', null, 1 /* Attribute */],
    spreadMethod: ['spreadMethod', null, 1 /* Attribute */],
    startOffset: ['startOffset', null, 1 /* Attribute */],
    stdDeviation: ['stdDeviation', null, 1 /* Attribute */],
    stitchTiles: ['stitchTiles', null, 1 /* Attribute */],
    surfaceScale: ['surfaceScale', null, 1 /* Attribute */],
    systemLanguage: ['systemLanguage', null, 1 /* Attribute */],
    tableValues: ['tableValues', null, 1 /* Attribute */],
    targetX: ['targetX', null, 1 /* Attribute */],
    targetY: ['targetY', null, 1 /* Attribute */],
    textLength: ['textLength', null, 1 /* Attribute */],
    viewBox: ['viewBox', null, 1 /* Attribute */],
    viewTarget: ['viewTarget', null, 1 /* Attribute */],
    xChannelSelector: ['xChannelSelector', null, 1 /* Attribute */],
    yChannelSelector: ['yChannelSelector', null, 1 /* Attribute */],
    zoomAndPan: ['zoomAndPan', null, 1 /* Attribute */],
};
var attributeOnlyRx = /^(aria|data)[\-A-Z]/, isAttrOnlyField = function (prop) { return attributeOnlyRx.test(prop); }, propOnlyRx = /^(on|style)/, isPropOnlyField = function (prop) { return propOnlyRx.test(prop); }, propPartRx = /[a-z][A-Z]/g, getAttrName = function (prop) { return prop.replace(propPartRx, function (m) { return m[0] + '-' + m[1]; }).toLowerCase(); }, jsxEventPropRx = /^on[A-Z]/, attrPartRx = /\-(?:[a-z]|$)/g, getPropName = function (attr) {
    var prop = attr.replace(attrPartRx, function (m) { return m.length === 1 ? '' : m[1].toUpperCase(); });
    return jsxEventPropRx.test(prop) ? prop.toLowerCase() : prop;
}, deepPropRx = /^(style)([A-Z])/, buildPropData = function (prop) {
    var m = deepPropRx.exec(prop);
    return m ? [m[2].toLowerCase() + prop.substr(m[0].length), m[1], 0 /* Property */] : [prop, null, 0 /* Property */];
}, attrNamespaces = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
}, attrNamespaceRx = new RegExp("^(" + Object.keys(attrNamespaces).join('|') + ")-(.*)"), buildAttrData = function (attr) {
    var m = attrNamespaceRx.exec(attr);
    return m ? [m[2], attrNamespaces[m[1]], 1 /* Attribute */] : [attr, null, 1 /* Attribute */];
};
export var getFieldData = function (field, svg) {
    var cache = svg ? svgFieldCache : htmlFieldCache, cached = cache[field];
    if (cached)
        return cached;
    var attr = svg && !isPropOnlyField(field)
        || !svg && isAttrOnlyField(field), name = attr ? getAttrName(field) : getPropName(field), data = attr ? buildAttrData(name) : buildPropData(name);
    return cache[field] = data;
};
