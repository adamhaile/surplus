export function assign(a, b) {
    var props = Object.keys(b);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        a[name] = b[name];
    }
}
export function spread(node, obj, svg) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var rawName = props[i];
        if (rawName === 'style') {
            assign(node.style, obj.style);
        }
        else {
            var propName = translateJSXPropertyName(rawName, svg);
            setField(node, propName, obj[rawName], svg);
        }
    }
}
function setField(node, name, value, svg) {
    if (name in node && !svg)
        node[name] = value;
    else if (value === false || value === null || value === undefined)
        node.removeAttribute(name);
    else
        node.setAttribute(name, value);
}
var jsxEventProperty = /^on[A-Z]/;
function translateJSXPropertyName(name, svg) {
    return jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) :
        svg ? (name === 'className' ? 'class' : name === 'htmlFor' ? 'for' : name) :
            name;
}
