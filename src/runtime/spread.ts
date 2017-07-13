export function spread<T>(spread : ((node : Node, state : T) => T | T), node : Node, state : T) : T {
    if (typeof spread === 'function') {
        return spread(node, state);
    } else {
        applyProps(node, spread);
        return spread;
    }
}

function applyProps(node : Node, props : { [ name : string ] : any }) {
    var domProp : string;
    for (var prop in props) if (props.hasOwnProperty(prop)) {
        domProp = translateJSXPropertyName(prop);
        (node as any)[domProp] = props[prop];
    }
}

var jsxEventProperty = /^on[A-Z]/;

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}