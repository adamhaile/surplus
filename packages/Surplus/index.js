(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('s-js')) :
	typeof define === 'function' && define.amd ? define(['exports', 's-js'], factory) :
	(factory((global.Surplus = global.Surplus || {}),global.S));
}(this, (function (exports,S) { 'use strict';

S = S && 'default' in S ? S['default'] : S;

var TEXT_NODE = 3;
function insert$$1(range, value) {
    var parent = range.start.parentNode, test = range.start, good = null, t = typeof value;
    //if (parent === null) {
    //    throw new Error("Surplus.insert() can only be used on a node that has a parent node. \n"
    //        + "Node ``" + range.start + "'' is currently unattached to a parent.");
    //}
    //if (range.end.parentNode !== parent) {
    //    throw new Error("Surplus.insert() requires that the inserted nodes remain sibilings \n"
    //        + "of the original node.  The DOM has been modified such that this is \n"
    //        + "no longer the case.");
    //}
    if (t === 'string' || t === 'number' || t === 'boolean') {
        value = value.toString();
        if (test.nodeType === TEXT_NODE) {
            test.data = value;
            good = test;
        }
        else {
            value = document.createTextNode(value);
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    else if (value instanceof Node) {
        if (test !== value) {
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = value;
        }
        good = value;
    }
    else if (value instanceof Array) {
        insertArray(value);
    }
    else if (value instanceof Function) {
        S(function () {
            insert$$1(range, value());
        });
        good = range.end;
    }
    else if (value !== null && value !== undefined) {
        value = value.toString();
        if (test.nodeType === TEXT_NODE) {
            test.data = value;
            good = test;
        }
        else {
            value = document.createTextNode(value);
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    if (good === null) {
        if (range.start === parent.firstChild && range.end === parent.lastChild && range.start !== range.end) {
            // fast delete entire contents
            parent.textContent = "";
            value = document.createTextNode("");
            parent.appendChild(value);
            good = range.start = range.end = value;
        }
        else if (test.nodeType === TEXT_NODE) {
            test.data = "";
            good = test;
        }
        else {
            value = document.createTextNode("");
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    // remove anything left after the good cursor from the insert range
    while (good !== range.end) {
        test = range.end;
        range.end = test.previousSibling;
        parent.removeChild(test);
    }
    return range;
    function insertArray(array) {
        for (var i = 0, len = array.length; i < len; i++) {
            var value = array[i];
            if (good === range.end) {
                if (value instanceof Node) {
                    good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                }
                else if (value instanceof Array) {
                    insertArray(value);
                }
                else if (value !== null && value !== undefined) {
                    value = document.createTextNode(value.toString());
                    good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                }
            }
            else {
                if (value instanceof Node) {
                    if (test !== value) {
                        if (good === null) {
                            if (range.end === value)
                                range.end = value.previousSibling;
                            parent.replaceChild(value, test);
                            range.start = value;
                            if (range.end === test)
                                range.end = value;
                            test = value.nextSibling;
                        }
                        else {
                            if (test.nextSibling === value && test !== value.nextSibling && test !== range.end) {
                                parent.removeChild(test);
                                test = value.nextSibling;
                            }
                            else {
                                if (range.end === value)
                                    range.end = value.previousSibling;
                                parent.insertBefore(value, test);
                            }
                        }
                    }
                    else {
                        test = test.nextSibling;
                    }
                    good = value;
                }
                else if (value instanceof Array) {
                    insertArray(value);
                }
                else if (value !== null && value !== undefined) {
                    value = value.toString();
                    if (test.nodeType === TEXT_NODE) {
                        test.data = value;
                        if (good === null)
                            range.start = test;
                        good = test, test = good.nextSibling;
                    }
                    else {
                        value = document.createTextNode(value);
                        parent.insertBefore(value, test);
                        if (good === null)
                            range.start = value;
                        good = value;
                    }
                }
            }
        }
    }
}

function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (parent)
        parent.appendChild(el);
    return el;
}
function createComment(text, parent) {
    var comment = document.createComment(text);
    parent.appendChild(comment);
    return comment;
}
function createTextNode(text, parent) {
    var node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
}

var extend = 'assign' in Object ? Object.assign :
    function (a, b) {
        for (var p in b)
            if (b.hasOwnProperty(p))
                a[p] = b[p];
    };
function subcomponent(fn, params) {
    var props = params[0], // compiler guarantees that first item is a property object, not a mixin
    param, result, i;
    for (i = 1; i < params.length; i++) {
        param = params[i];
        if (typeof param !== 'function') {
            extend(props, param);
        }
    }
    result = fn(props);
    for (i = 0; i < params.length; i++) {
        param = params[i];
        if (typeof param === 'function') {
            param(result);
        }
    }
    return result;
}

function staticSpread(node, props) {
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
var jsxEventProperty = /^on[A-Z]/;
var attribute = /-/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name)
        ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase())
        : name;
}
function isAttribute(prop) {
    return attribute.test(prop); // TODO: better heuristic for attributes than name contains a hyphen
}

exports.insert = insert$$1;
exports.subcomponent = subcomponent;
exports.staticSpread = staticSpread;
exports.SingleSpreadState = SingleSpreadState;
exports.MultiSpreadState = MultiSpreadState;
exports.S = S;
exports.createElement = createElement;
exports.createComment = createComment;
exports.createTextNode = createTextNode;

Object.defineProperty(exports, '__esModule', { value: true });

})));
