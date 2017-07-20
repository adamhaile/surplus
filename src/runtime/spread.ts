export function spread<T>(spread : ((node : Element, state : T) => T | T), node : Element, state : T, activeProps : { [ name : string ] : number }) : T {
    if (typeof spread === 'function') {
        return spread(node, state);
    } else {
        applyProps(node, spread, activeProps);
        removeStaleProps(node, state, activeProps);
        return spread;
    }
}

function applyProps(node : Element, props : { [ name : string ] : any }, propAges : { [ name : string ] : number }) {
    var current = propAges.__current,
        propName : string,
        propAge : number;
    for (var rawName in props) if (props.hasOwnProperty(rawName)) {
        propName = translateJSXPropertyName(rawName);
        propAge = propAges[propName] || 0;
        if (propAge < current) propAges[propName] = current;
        setField(node, propName, props[rawName]);
    }
}

function removeStaleProps<T>(node : Element, prior : T, propAges : { [ name : string ] : number }) {
    var current = propAges.__current;
    for (var name in prior) if (prior.hasOwnProperty(name) && propAges[name] < current) {
        clearField(node, name);
    }
}

function setField(node : Element, name : string, value : any) {
    if (isAttribute(name)) {
        node.setAttribute(name, value);
    } else {
        (node as any)[name] = value;
    }
}

function clearField(node : Element, name : string) {
    if (isAttribute(name)) {
        node.removeAttribute(name);
    } else {
        (node as any)[name] = defaultValue(node.tagName, name);
    }
}

var defaultValues = { } as { [ name : string ] : any };

function defaultValue(tag : string, name : string) {
    var emptyNode = defaultValues[tag] || (defaultValues[tag] = document.createElement(tag));
    return emptyNode[name];
}

var eventProperty = /^on/,
    jsxEventProperty = /^on[A-Z]/,
    attribute = /-/; 

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}


function isAttribute(prop : string) {
    return attribute.test(prop); // TODO: better heuristic for attributes than name contains a hyphen
}