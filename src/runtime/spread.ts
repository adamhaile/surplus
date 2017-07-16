export function spread<T>(spread : ((node : Element, state : T) => T | T), node : Element, state : T) : T {
    if (typeof spread === 'function') {
        return spread(node, state);
    } else {
        applyProps(node, spread);
        return spread;
    }
}

function applyProps(node : Element, props : { [ name : string ] : any }) {
    var domProp : string;
    for (var prop in props) if (props.hasOwnProperty(prop)) {
        domProp = translateJSXPropertyName(prop);
        if (isAttribute(domProp)) {
            node.setAttribute(domProp, props[prop]);
        } else {
            (node as any)[domProp] = props[prop];
        }
    }
}

var jsxEventProperty = /^on[A-Z]/;

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}

var attribute = /-/; // TODO: better heuristic for attributes than name contains a hyphen

function isAttribute(prop : string) {
    return attribute.test(prop);
}