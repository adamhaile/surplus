export type PropObj = { [ name : string ] : any };

const assign = 'assign' in Object ? (Object as any).assign :
    function assign(a : PropObj, b : PropObj) {
        var props = Object.keys(b);
        for (var i = 0, len = props.length; i < len; i++) {
            var name = props[i];
            a[name] = b[name];
        }
    }

export function staticSpread(node : HTMLElement, obj : PropObj) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var rawName = props[i];
        if (rawName === 'style') {
            assign(node.style, obj.style);
        } else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, obj[rawName]);
        }
    }
}

export function staticStyle(node : HTMLElement, style : PropObj) {
    assign(node.style, style);
}

export class SingleSpreadState {
    oldProps = null as null | string[];
    oldStyles = null as null | string | string[];

    constructor(
        public namedProps : { [ name : string ] : boolean }
    ) { }

    apply(node : Element, props : PropObj) {
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

    applyStyle(node : Element, style : PropObj) {
        var oldStyles = this.oldStyles,
            newStyles = Object.keys(style),
            newLen    = newStyles.length,
            i         = 0;

        if (oldStyles === null) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        } else {
            var oldLen = oldStyles.length,
                len = oldLen < newLen ? oldLen : newLen

            for (; i < len; i++) {
                var propName = newStyles[i],
                    oldPropName = oldStyles[i];

                if (oldPropName !== propName && !style.hasOwnProperty(oldPropName)) {
                    clearStyle(node, oldPropName);
                }

                setStyle(node, propName, style);
            }
            
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
            
            for (; i < oldLen; i++) {
                oldPropName = oldStyles[i];
                if (!style.hasOwnProperty(oldPropName)) {
                    clearStyle(node, oldPropName);
                }
            }
        }

        this.oldStyles = newStyles;
    }

    private check(node : Element, rawName : string, props : PropObj) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                clearField(node, propName);
            }
        }
    }

    private setField(node : Element, rawName : string, props : PropObj) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value);
        } else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, value);
        }
    }
}

export class MultiSpreadState {
    current     = 1;
    propAges    = {} as { [ name : string ] : number };
    oldProps    = [] as (string[] | undefined)[];
    checkProps  = [] as string[];
    styleAges   = {} as { [ name : string ] : number };
    oldStyles   = null as null | (string[] | undefined)[];
    checkStyles = null as null | string[];

    constructor(
        public namedProps : { [ name : string ] : boolean }
    ) { }

    apply(node : Element, props : PropObj, n : number, last : boolean) {
        var oldProps = this.oldProps[n],
            newProps = Object.keys(props),
            newLen   = newProps.length,
            i        = 0;

        if (oldProps === undefined) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last);
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

                this.setField(node, propName, props, n, last);
            }
            
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last);
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

    applyStyle(node : Element, style : PropObj, n : number, last : boolean) {
        var oldStyles   = this.oldStyles && this.oldStyles[n],
            newStyles   = Object.keys(style),
            styleAges   = this.styleAges,
            current     = this.current,
            styleAges   = this.styleAges,
            checkStyles = this.checkStyles,
            newLen      = newStyles.length,
            i           = 0;

        if (!oldStyles) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        } else {
            var oldLen = oldStyles.length,
                len = oldLen < newLen ? oldLen : newLen;

            for (; i < len; i++) {
                var propName = newStyles[i],
                    oldPropName = oldStyles[i];

                if (oldPropName !== propName && !style.hasOwnProperty(oldPropName)) {
                    if (checkStyles === null) checkStyles = this.checkStyles = [oldPropName];
                    else checkStyles.push(oldPropName);
                }

                styleAges[propName] = current;
                setStyle(node, propName, style);
            }
            
            for (; i < newLen; i++) {
                propName = newStyles[i];
                styleAges[propName] = current;
                setStyle(node, propName, style);
            }

            for (; i < oldLen; i++) {
                oldPropName = oldStyles[i];
                if (!style.hasOwnProperty(oldPropName)) {
                    if (checkStyles === null) checkStyles = this.checkStyles = [oldPropName];
                    else checkStyles.push(oldPropName);
                }
            }
        }

        if (this.oldStyles === null) this.oldStyles = [];
        this.oldStyles[n] = newStyles;

        if (last) {
            if (checkStyles !== null) {
                for (i = 0, len = checkStyles.length; i < len; i++) {
                    propName = checkStyles.pop()!;
                    if (styleAges[propName] !== current) {
                        clearStyle(node, propName);
                    }
                }
            }

            this.current++;
        }
    }

    private check(rawName : string, props : PropObj) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                this.checkProps.push(propName);
            }
        }
    }

    private setField(node : Element, rawName : string, props : PropObj, n : number, last : boolean) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value, n, last);
        } else {
            var propName = translateJSXPropertyName(rawName);
            this.propAges[propName] = this.current;
            setField(node, propName, value);
        }
    }
}

function setField(node : Element, name : string, value : any) {
    if (name in node) (node as any)[name] = value;
    else if (value === false || value === null || value === undefined) node.removeAttribute(name);
    else node.setAttribute(name, value);
}

function clearField(node : Element, name : string) {
    if (name in node) (node as any)[name] = defaultValue(node.tagName, name);
    else node.removeAttribute(name);
}

function setStyle(node : Element, name : string, style : PropObj) {
    (node as any).style[name] = style[name];
}

function clearStyle(node : Element, name : string,) {
    (node as any).style[name] = '';
}

var defaultValues = { } as { [ name : string ] : any };

function defaultValue(tag : string, name : string) {
    var emptyNode = defaultValues[tag] || (defaultValues[tag] = document.createElement(tag));
    return emptyNode[name];
}

var jsxEventProperty = /^on[A-Z]/; 

function translateJSXPropertyName(name : string) {
    return jsxEventProperty.test(name) 
    ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) 
    : name;
}
