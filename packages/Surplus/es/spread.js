export function staticSpread(node, props) {
    var propName;
    for (var rawName in props)
        if (props.hasOwnProperty(rawName)) {
            propName = translateJSXPropertyName(rawName);
            setField(node, propName, props[rawName]);
        }
}
var SingleSpreadState = (function () {
    function SingleSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.oldProps = null;
    }
    SingleSpreadState.prototype.apply = function (node, props) {
        var oldProps = this.oldProps, newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === null) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
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
    };
    SingleSpreadState.prototype.check = function (node, rawName, props) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                clearField(node, propName);
            }
        }
    };
    SingleSpreadState.prototype.setField = function (node, rawName, props) {
        var propName = translateJSXPropertyName(rawName);
        setField(node, propName, props[rawName]);
    };
    return SingleSpreadState;
}());
export { SingleSpreadState };
var MultiSpreadState = (function () {
    function MultiSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.current = 1;
        this.propAges = {};
        this.oldProps = [];
        this.checkProps = [];
    }
    MultiSpreadState.prototype.apply = function (node, props, n, last) {
        var oldProps = this.oldProps[n], newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === undefined) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
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
                propName = this.checkProps.pop();
                if (this.propAges[propName] !== this.current) {
                    clearField(node, propName);
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
    MultiSpreadState.prototype.setField = function (node, rawName, props) {
        var value = props[rawName], propName = translateJSXPropertyName(rawName);
        this.propAges[propName] = this.current;
        setField(node, propName, value);
    };
    return MultiSpreadState;
}());
export { MultiSpreadState };
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
var jsxEventProperty = /^on[A-Z]/, attribute = /-/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name)
        ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase())
        : name;
}
function isAttribute(prop) {
    return attribute.test(prop); // TODO: better heuristic for attributes than name contains a hyphen
}
