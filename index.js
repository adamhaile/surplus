(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('s-js')) :
	typeof define === 'function' && define.amd ? define(['exports', 's-js'], factory) :
	(factory((global.Surplus = {}),global.S));
}(this, (function (exports,S) { 'use strict';

S = S && S.hasOwnProperty('default') ? S['default'] : S;

var TEXT_NODE = 3;
function insert(range, value) {
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
    else if (Array.isArray(value)) {
        insertArray(value);
    }
    else if (value instanceof Function) {
        S(function () {
            insert(range, value());
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

// value : null | undefined | string | number | boolean | Node | (null | undefined | string | number | boolean | Node)[]
function content(parent, value) {
    var t = typeof value, len;
    if (t === 'string' || t === 'number' || t === 'boolean') {
        parent.textContent = value;
    }
    else if (value == null) {
        clear(parent);
    }
    else if (t === 'function') {
        S(function () {
            content(parent, value());
        });
    }
    else if (value instanceof Node) {
        len = parent.childNodes.length;
        if (len === 0) {
            parent.appendChild(value);
        }
        else if (parent.firstChild !== value) {
            if (len === 1) {
                parent.replaceChild(value, parent.firstChild);
            }
            else {
                clear(parent);
                parent.appendChild(value);
            }
        }
    }
    else if (Array.isArray(value)) {
        insertArray(parent, value);
    }
    else {
        throw new Error("content must be Node, stringable, or array of same");
    }
}

function insertArray(parent, _array) {
    var indices = new Map(), textNodes = [], array = [], preservedNodes = prepareIncomingArray(array, indices, textNodes, _array, parent), len = array.length, last = null, a, b, t, u, ai, bi, ti, amax, acur, abest, bmin, bfound, abestloc;
    // fast path: no nodes preserved, use fast .textContent clear and append all new ones
    if (preservedNodes === 0) {
        clear(parent);
        if (len !== 0) {
            appendNodes(parent, array, 0, len);
        }
        return;
    }
    for (a = parent.firstChild, bi = 0, b = array[bi]; a !== null && bi < len;) {
        // fast path: unmodified sequences
        if (a === b) {
            a = a.nextSibling;
            b = array[++bi];
            continue;
        }
        ai = indices.get(a);
        // check if node was removed
        if (ai === undefined) {
            t = a.nextSibling;
            parent.removeChild(a);
            a = t;
            continue;
        }
        if (b instanceof Node) {
            if (b.parentNode !== parent) {
                // node was added
                parent.insertBefore(b, a);
                b = array[++bi];
            }
            else {
                // both nodes preserved, have to decide whether to push back a or pull forward b
                amax = ai - bi;
                acur = abest = 0;
                bmin = 0;
                abestloc = null;
                t = a;
                bfound = false;
                while (bmin < amax) {
                    t = t.nextSibling;
                    ti = indices.get(t);
                    while (t !== null && ti === undefined) {
                        u = t.nextSibling;
                        parent.removeChild(t);
                        t = u;
                        ti = indices.get(t);
                    }
                    if (t === null)
                        break;
                    if (ti < ai) {
                        acur++;
                    }
                    else {
                        acur--;
                        amax--;
                    }
                    if (acur > abest) {
                        abest = acur;
                        abestloc = t;
                    }
                    if (t === b)
                        bfound = true;
                    if (bfound === false)
                        bmin++;
                }
                if (bmin < abest) {
                    t = a.nextSibling;
                    parent.insertBefore(a, abestloc.nextSibling);
                    a = t;
                }
                else {
                    parent.insertBefore(b, a);
                    b = array[++bi];
                }
            }
        }
        else {
            if (a.nodeType === Node.TEXT_NODE) {
                a.data = b;
                a = a.nextSibling;
                b = array[++bi];
            }
            else {
                // a is a non-text Node, b is a string, have to decide whether to pull forward a text node for b or push back a
            }
        }
    }
    if (bi < len) {
        // append extra new nodes
        appendNodes(parent, array, bi, len);
    }
    else {
        // remove extra discarded nodes
        while (a !== last) {
            t = a.nextSibling;
            parent.removeChild(a);
            a = t;
        }
    }
}
function appendNodes(parent, array, i, end) {
    var node;
    for (; i < end; i++) {
        node = array[i];
        if (node instanceof Node) {
            parent.appendChild(node);
        }
        else {
            node = document.createTextNode(node);
            parent.appendChild(node);
        }
    }
}
function prepareIncomingArray(normalized, indices, textNodes, array, parent) {
    var childCount = 0;
    for (var i = 0, len = array.length; i < len; i++) {
        var item = array[i];
        if (item instanceof Node) {
            if (item.parentNode === parent)
                childCount++;
            indices.set(item, normalized.length);
            normalized.push(item);
        }
        else if (item == null) {
            // skip
        }
        else if (Array.isArray(item)) {
            childCount += prepareIncomingArray(normalized, indices, textNodes, item, parent);
        }
        else {
            textNodes.push(normalized.length);
            normalized.push(item);
        }
    }
    return childCount;
}
/*
function scheduleClear(node : Node) {
    if (PendingClears === null) {
        PendingClears = [node];
        requestAnimationFrame(performPendingClears);
    } else {
        PendingClears.push(node);
    }
}

function unscheduleClear(node : Node) {
    if (PendingClears !== null) {
        var i = PendingClears.indexOf(node);
        if (i !== -1) PendingClears.splice(i, 1);
    }
}

function performPendingClears() {
    if (PendingClears === null) return;
    for (var i = 0; i < PendingClears.length; i++) {
        clear(PendingClears[i]);
    }
    PendingClears = null;
}
*/
function clear(node) {
    node.textContent = null;
}

var svgNS = "http://www.w3.org/2000/svg";
function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (parent)
        parent.appendChild(el);
    return el;
}
function createSvgElement(tag, className, parent) {
    var el = document.createElementNS(svgNS, tag);
    if (className)
        el.setAttribute("class", className);
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

var assign = 'assign' in Object ? Object.assign :
    function assign(a, b) {
        var props = Object.keys(b);
        for (var i = 0, len = props.length; i < len; i++) {
            var name = props[i];
            a[name] = b[name];
        }
    };
function staticSpread(node, obj, svg) {
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
function staticStyle(node, style) {
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

exports.insert = insert;
exports.content = content;
exports.staticSpread = staticSpread;
exports.staticStyle = staticStyle;
exports.SingleSpreadState = SingleSpreadState;
exports.MultiSpreadState = MultiSpreadState;
exports.S = S;
exports.createElement = createElement;
exports.createSvgElement = createSvgElement;
exports.createComment = createComment;
exports.createTextNode = createTextNode;

Object.defineProperty(exports, '__esModule', { value: true });

})));
