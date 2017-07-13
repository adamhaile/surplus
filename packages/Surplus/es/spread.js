export function spread(spread, node, state) {
    if (typeof spread === 'function') {
        return spread(node, state);
    }
    else {
        applyProps(node, spread);
        return spread;
    }
}
function applyProps(node, props) {
    var domProp;
    for (var prop in props)
        if (props.hasOwnProperty(prop)) {
            domProp = translateJSXPropertyName(prop);
            node[domProp] = props[prop];
        }
}
var jsxEventProperty = /^on[A-Z]/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
