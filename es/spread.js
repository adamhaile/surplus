var assign = 'assign' in Object ? Object.assign :
    function assign(a, b) {
        var props = Object.keys(b);
        for (var i = 0, len = props.length; i < len; i++) {
            var name = props[i];
            a[name] = b[name];
        }
    };
export function staticSpread(node, obj, svg) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var rawName = props[i];
        if (rawName === 'style') {
            assign(node.style, obj.style);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, obj[rawName], svg);
        }
    }
}
export function staticStyle(node, style) {
    assign(node.style, style);
}
var SingleSpreadState = /** @class */ (function () {
    function SingleSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.oldProps = null;
        this.oldStyles = null;
    }
    SingleSpreadState.prototype.apply = function (node, props, svg) {
        var oldProps = this.oldProps, newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === null) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, svg);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
                if (oldPropName !== propName) {
                    this.check(node, oldPropName, props, svg);
                }
                this.setField(node, propName, props, svg);
            }
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, svg);
            }
            for (; i < oldLen; i++) {
                this.check(node, oldProps[i], props, svg);
            }
        }
        this.oldProps = newProps;
    };
    SingleSpreadState.prototype.applyStyle = function (node, style) {
        var oldStyles = this.oldStyles, newStyles = Object.keys(style), newLen = newStyles.length, i = 0;
        if (oldStyles === null) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        }
        else {
            var oldLen = oldStyles.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newStyles[i], oldPropName = oldStyles[i];
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
    };
    SingleSpreadState.prototype.check = function (node, rawName, props, svg) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                clearField(node, propName, svg);
            }
        }
    };
    SingleSpreadState.prototype.setField = function (node, rawName, props, svg) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, value, svg);
        }
    };
    return SingleSpreadState;
}());
export { SingleSpreadState };
var MultiSpreadState = /** @class */ (function () {
    function MultiSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.current = 1;
        this.propAges = {};
        this.oldProps = [];
        this.checkProps = [];
        this.styleAges = {};
        this.oldStyles = null;
        this.checkStyles = null;
    }
    MultiSpreadState.prototype.apply = function (node, props, n, last, svg) {
        var oldProps = this.oldProps[n], newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === undefined) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last, svg);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
                if (oldPropName !== propName) {
                    this.check(oldPropName, props);
                }
                this.setField(node, propName, props, n, last, svg);
            }
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last, svg);
            }
            for (; i < oldLen; i++) {
                this.check(oldProps[i], props);
            }
        }
        this.oldProps[n] = newProps;
        if (last) {
            for (i = 0, len = this.checkProps.length; i < len; i++) {
                propName = this.checkProps.pop();
                if (this.propAges[propName] !== this.current) {
                    clearField(node, propName, svg);
                }
            }
            this.current++;
        }
    };
    MultiSpreadState.prototype.applyStyle = function (node, style, n, last) {
        var oldStyles = this.oldStyles && this.oldStyles[n], newStyles = Object.keys(style), styleAges = this.styleAges, current = this.current, styleAges = this.styleAges, checkStyles = this.checkStyles, newLen = newStyles.length, i = 0;
        if (!oldStyles) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        }
        else {
            var oldLen = oldStyles.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newStyles[i], oldPropName = oldStyles[i];
                if (oldPropName !== propName && !style.hasOwnProperty(oldPropName)) {
                    if (checkStyles === null)
                        checkStyles = this.checkStyles = [oldPropName];
                    else
                        checkStyles.push(oldPropName);
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
                    if (checkStyles === null)
                        checkStyles = this.checkStyles = [oldPropName];
                    else
                        checkStyles.push(oldPropName);
                }
            }
        }
        if (this.oldStyles === null)
            this.oldStyles = [];
        this.oldStyles[n] = newStyles;
        if (last) {
            if (checkStyles !== null) {
                for (i = 0, len = checkStyles.length; i < len; i++) {
                    propName = checkStyles.pop();
                    if (styleAges[propName] !== current) {
                        clearStyle(node, propName);
                    }
                }
            }
            this.current++;
        }
    };
    MultiSpreadState.prototype.check = function (rawName, props) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                this.checkProps.push(propName);
            }
        }
    };
    MultiSpreadState.prototype.setField = function (node, rawName, props, n, last, svg) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value, n, last);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            this.propAges[propName] = this.current;
            setField(node, propName, value, svg);
        }
    };
    return MultiSpreadState;
}());
export { MultiSpreadState };
function setField(node, name, value, svg) {
    if (name in node && !svg)
        node[name] = value;
    else if (value === false || value === null || value === undefined)
        node.removeAttribute(name);
    else
        node.setAttribute(name, value);
}
function clearField(node, name, svg) {
    if (name in node && !svg)
        node[name] = defaultValue(node.tagName, name);
    else
        node.removeAttribute(name);
}
function setStyle(node, name, style) {
    node.style[name] = style[name];
}
function clearStyle(node, name) {
    node.style[name] = '';
}
var defaultValues = {};
function defaultValue(tag, name) {
    var emptyNode = defaultValues[tag] || (defaultValues[tag] = document.createElement(tag));
    return emptyNode[name];
}
var jsxEventProperty = /^on[A-Z]/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name)
        ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase())
        : name;
}
