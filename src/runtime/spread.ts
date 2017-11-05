export type PropObj = { [ name : string ] : any };

export function assign(a : PropObj, b : PropObj) {
    var props = Object.keys(b);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        a[name] = b[name];
    }
}

export function spread(node : HTMLElement, obj : PropObj, svg : boolean) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var rawName = props[i];
        if (rawName === 'style') {
            assign(node.style, obj.style);
        } else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, obj[rawName], svg);
        }
    }
}

function setField(node : Element, name : string, value : any, svg : boolean) {
    if (name in node && !svg) (node as any)[name] = value;
    else if (value === false || value === null || value === undefined) node.removeAttribute(name);
    else node.setAttribute(name, value);
}

var jsxEventProperty = /^on[A-Z]/; 

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}
