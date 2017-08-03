export function staticSpread(node : Element, props : { [ name : string ] : any }) {
    var propName : string;
    for (var rawName in props) if (props.hasOwnProperty(rawName)) {
        propName = translateJSXPropertyName(rawName);
        setField(node, propName, props[rawName]);
    }
}

export class SingleSpreadState {
    oldProps = null as null | string[];

    constructor(
        public namedProps : { [ name : string ] : boolean }
    ) { }

    apply(node : Element, props : { [ name : string ] : any }) {
        var oldProps = this.oldProps,
            newProps = Object.keys(props),
            newLen   = newProps.length,
            i        = 0;

        if (oldProps === null) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }
        } else {
            var oldLen = oldProps.length,
                len = oldLen < newLen ? oldLen : newLen

            for (; i < len; i++) {
                var propName = newProps[i],
                    oldPropName = oldProps[i];

                if (oldPropName !== propName) {
                    this.check(node, oldPropName, props);
                }

                this.setField(node, propName, props);
            }
            
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }
            
            for (; i < oldLen; i++) {
                this.check(node, oldProps[i], props);
            }
        }

        this.oldProps = newProps;
    }

    private check(node : Element, rawName : string, props : { [ name : string ] : any }) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                clearField(node, propName);
            }
        }
    }

    private setField(node : Element, rawName : string, props : { [ name : string ] : any }) {
        var propName = translateJSXPropertyName(rawName);
        setField(node, propName, props[rawName]);
    }
}

export class MultiSpreadState {
    current = 1;
    propAges = {} as { [ name : string ] : number };
    oldProps = [] as (string[] | undefined)[];
    checkProps = [] as string[];

    constructor(
        public namedProps : { [ name : string ] : boolean }
    ) { }

    apply(node : Element, props : { [ name : string ] : any }, n : number, last : boolean) {
        var oldProps = this.oldProps[n],
            newProps = Object.keys(props),
            newLen   = newProps.length,
            i        = 0;

        if (oldProps === undefined) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }
        } else {
            var oldLen = oldProps.length,
                len = oldLen < newLen ? oldLen : newLen;

            for (; i < len; i++) {
                var propName = newProps[i],
                    oldPropName = oldProps[i];

                if (oldPropName !== propName) {
                    this.check(oldPropName, props);
                }

                this.setField(node, propName, props);
            }
            
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }

            for (; i < oldLen; i++) {
                this.check(oldProps[i], props);
            }
        }

        this.oldProps[n] = newProps;

        if (last) {
            for (i = 0, len = this.checkProps.length; i < len; i++) {
                propName = this.checkProps.pop()!;
                if (this.propAges[propName] !== this.current) {
                    clearField(node, propName);
                }
            }

            this.current++;
        }
    }

    private check(rawName : string, props : { [ name : string ] : any }) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                this.checkProps.push(propName);
            }
        }
    }

    private setField(node : Element, rawName : string, props : { [ name : string ] : any }) {
        var value = props[rawName],
            propName = translateJSXPropertyName(rawName);
        this.propAges[propName] = this.current;
        setField(node, propName, value);
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

var jsxEventProperty = /^on[A-Z]/,
    attribute = /-/; 

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}

function isAttribute(prop : string) {
    return attribute.test(prop); // TODO: better heuristic for attributes than name contains a hyphen
}
