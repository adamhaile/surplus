export function spread(spread, node, state, activeProps) {
    if (typeof spread === 'function') {
        return spread(node, state);
    }
    else {
        applyProps(node, spread, activeProps);
        removeStaleProps(node, state, activeProps);
        return spread;
    }
}
function applyProps(node, props, propAges) {
    var current = propAges.__current, propName, propAge;
    for (var rawName in props)
        if (props.hasOwnProperty(rawName)) {
            propName = translateJSXPropertyName(rawName);
            propAge = propAges[propName] || 0;
            if (propAge < current)
                propAges[propName] = current;
            setField(node, propName, props[rawName]);
        }
}
function removeStaleProps(node, prior, propAges) {
    var current = propAges.__current;
    for (var name in prior)
        if (prior.hasOwnProperty(name) && propAges[name] < current) {
            clearField(node, name);
        }
}
function setField(node, name, value) {
    if (isAttribute(name)) {
        node.setAttribute(name, value);
    }
    else {
        node[name] = value;
    }
}
function clearField(node, name) {
    if (isAttribute(name)) {
        node.removeAttribute(name);
    }
    else {
        node[name] = defaultValue(node.tagName, name);
    }
}
var defaultValues = {};
function defaultValue(tag, name) {
    var emptyNode = defaultValues[tag] || (defaultValues[tag] = document.createElement(tag));
    return emptyNode[name];
}
var eventProperty = /^on/, jsxEventProperty = /^on[A-Z]/, attribute = /-/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name)
        ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase())
        : name;
}
function isAttribute(prop) {
    return attribute.test(prop); // TODO: better heuristic for attributes than name contains a hyphen
}
