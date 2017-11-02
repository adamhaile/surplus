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

function content(parent, value, current) {
    var t = typeof value;
    if (current === value) {
        // nothing to do
    }
    else if (t === 'string') {
        current = parent.textContent = value;
    }
    else if (t === 'number' || t === 'boolean') {
        value = value.toString();
        current = parent.textContent = value;
    }
    else if (value == null) {
        clear(parent);
        current = "";
    }
    else if (t === 'function') {
        S(function () {
            current = content(parent, value(), current);
        });
    }
    else if (value instanceof Node) {
        if (Array.isArray(current)) {
            if (current.length === 0) {
                parent.appendChild(value);
            }
            else if (current.length === 1) {
                parent.replaceChild(value, current[0]);
            }
            else {
                clear(parent);
                parent.appendChild(value);
            }
        }
        else if (current === "") {
            parent.appendChild(value);
        }
        else {
            parent.replaceChild(value, parent.firstChild);
        }
        current = value;
    }
    else if (Array.isArray(value)) {
        var array = normalizeIncomingArray([], value);
        if (array.length === 0) {
            clear(parent);
        }
        else {
            if (Array.isArray(current)) {
                if (current.length === 0) {
                    appendNodes(parent, array, 0, array.length);
                }
                else {
                    reconcileArrays(parent, current, array);
                }
            }
            else if (current === "") {
                appendNodes(parent, array, 0, array.length);
            }
            else {
                reconcileArrays(parent, [parent.firstChild], array);
            }
        }
        current = array;
    }
    else {
        throw new Error("content must be Node, stringable, or array of same");
    }
    return current;
}
var NOMATCH = -1;
var NOINSERT = -2;
var RECONCILE_ARRAY_BATCH = 0;
var RECONCILE_ARRAY_BITS = 16;
var RECONCILE_ARRAY_INC = 1 << RECONCILE_ARRAY_BITS;
var RECONCILE_ARRAY_MASK = RECONCILE_ARRAY_INC - 1;
// reconcile the content of parent from ns to us
// see ivi's excellent writeup of diffing arrays in a vdom library: 
// https://github.com/ivijs/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1187
// this code isn't identical, since we're diffing real dom nodes to nodes-or-strings, 
// but the core methodology of trimming ends and reversals, matching nodes, then using
// the longest increasing subsequence to minimize DOM ops is inspired by ivi.
function reconcileArrays(parent, ns, us) {
    var ulen = us.length, 
    // n = nodes, u = updates
    // ranges defined by min and max indices
    nmin = 0, nmax = ns.length - 1, umin = 0, umax = ulen - 1, 
    // start nodes of ranges
    n = ns[nmin], u = us[umin], 
    // end nodes of ranges
    nx = ns[nmax], ux = us[umax], 
    // node, if any, just after ux, used for doing .insertBefore() to put nodes at end
    ul = nx.nextSibling, i, j, k, loop = true;
    // scan over common prefixes, suffixes, and simple reversals
    fixes: while (loop) {
        loop = false;
        // common prefix, u === n
        while (equable(u, n, umin, us)) {
            umin++;
            nmin++;
            if (umin > umax || nmin > nmax)
                break fixes;
            u = us[umin];
            n = ns[nmin];
        }
        // common suffix, ux === nx
        while (equable(ux, nx, umax, us)) {
            ul = nx;
            umax--;
            nmax--;
            if (umin > umax || nmin > nmax)
                break fixes;
            ux = us[umax];
            nx = ns[nmax];
        }
        // reversal u === nx, have to swap node forward
        while (equable(u, nx, umin, us)) {
            loop = true;
            parent.insertBefore(nx, n);
            umin++;
            nmax--;
            if (umin > umax || nmin > nmax)
                break fixes;
            u = us[umin];
            nx = ns[nmax];
        }
        // reversal ux === n, have to swap node back
        while (equable(ux, n, umax, us)) {
            loop = true;
            if (ul === null)
                parent.appendChild(n);
            else
                parent.insertBefore(n, ul);
            ul = n;
            umax--;
            nmin++;
            if (umin > umax || nmin > nmax)
                break fixes;
            ux = us[umax];
            n = ns[nmin];
        }
    }
    // if that covered all updates, just need to remove any remaining nodes and we're done
    if (umin > umax) {
        // remove any remaining nodes
        while (nmin <= nmax) {
            parent.removeChild(ns[nmax]);
            nmax--;
        }
        return;
    }
    // if that covered all current nodes, just need to insert any remaining updates and we're done
    if (nmin > nmax) {
        // insert any remaining nodes
        while (umin <= umax) {
            insertOrAppend(parent, us[umin], ul, umin, us);
            umin++;
        }
        return;
    }
    // simple cases don't apply, have to actually match up nodes and figure out minimum DOM ops
    // loop through nodes and mark them with a special property indicating their order
    // we'll then go through the updates and look for those properties
    // in case any of the updates have order properties left over from earlier runs, we 
    // use the low bits of the order prop to record a batch identifier.
    // I'd much rather use a Map than a special property, but Maps of objects are really
    // slow currently, like only 100k get/set ops / second
    // for Text nodes, all that matters is their order, as they're easily, interchangeable
    // so we record their positions in ntext[]
    var ntext = [];
    // update global batch identifer
    RECONCILE_ARRAY_BATCH = (RECONCILE_ARRAY_BATCH + 1) % RECONCILE_ARRAY_INC;
    for (i = nmin, j = (nmin << RECONCILE_ARRAY_BITS) + RECONCILE_ARRAY_BATCH; i <= nmax; i++, j += RECONCILE_ARRAY_INC) {
        n = ns[i];
        // add or update special order property
        if (n.__surplus_order === undefined) {
            Object.defineProperty(n, '__surplus_order', { value: j, writable: true });
        }
        else {
            n.__surplus_order = j;
        }
        if (n instanceof Text) {
            ntext.push(i);
        }
    }
    // now loop through us, looking for the order property, otherwise recording NOMATCH
    var src = new Array(umax - umin + 1), utext = [], preserved = 0;
    for (i = umin; i <= umax; i++) {
        u = us[i];
        if (typeof u === 'string') {
            utext.push(i);
            src[i - umin] = NOMATCH;
        }
        else if ((j = u.__surplus_order) !== undefined && (j & RECONCILE_ARRAY_MASK) === RECONCILE_ARRAY_BATCH) {
            j >>= RECONCILE_ARRAY_BITS;
            src[i - umin] = j;
            ns[j] = null;
            preserved++;
        }
        else {
            src[i - umin] = NOMATCH;
        }
    }
    if (preserved === 0 && nmin === 0 && nmax === ns.length - 1) {
        // no nodes preserved, use fast clear and append
        clear(parent);
        while (umin <= umax) {
            insertOrAppend(parent, us[umin], null, umin, us);
            umin++;
        }
        return;
    }
    // find longest common sequence between ns and us, represented as the indices 
    // of the longest increasing subsequence in src
    var lcs = longestPositiveIncreasingSubsequence(src);
    // we know we can preserve their order, so march them as NOINSERT
    for (i = 0; i < lcs.length; i++) {
        src[lcs[i]] = NOINSERT;
    }
    /*
              0   1   2   3   4   5   6   7
    ns    = [ n,  n,  t,  n,  n,  n,  t,  n ]
                  |          /   /       /
                  |        /   /       /
                  +------/---/-------/----+
                       /   /       /      |
    us    = [ n,  s,  n,  n,  s,  n,  s,  n ]
    src   = [-1, -1,  4,  5, -1,  7, -1,  1 ]
    lis   = [         2,  3,      5]
                      j
    utext = [     1,          4,      6 ]
                  i
    ntext = [         2,              6 ]
                      k
    */
    // replace strings in us with Text nodes, reusing Text nodes from ns when we can do so without moving them
    var utexti = 0, lcsj = 0, ntextk = 0;
    for (i = 0, j = 0, k = 0; i < utext.length; i++) {
        utexti = utext[i];
        // need to answer qeustion "if utext[i] falls between two lcs nodes, is there an ntext between them which we can reuse?"
        // first, find j such that lcs[j] is the first lcs node *after* utext[i]
        while (j < lcs.length && (lcsj = lcs[j]) < utexti - umin)
            j++;
        // now, find k such that ntext[k] is the first ntext *after* lcs[j-1] (or after start, if j === 0)
        while (k < ntext.length && (ntextk = ntext[k], j !== 0) && ntextk < src[lcs[j - 1]])
            k++;
        // if ntext[k] < lcs[j], then we know ntext[k] falls between lcs[j-1] (or start) and lcs[j] (or end)
        // that means we can re-use it without moving it
        if (k < ntext.length && (j === lcs.length || ntextk < src[lcsj])) {
            n = ns[ntextk];
            u = us[utexti];
            if (n.data !== u)
                n.data = u;
            ns[ntextk] = null;
            us[utexti] = n;
            src[utexti] = NOINSERT;
            k++;
        }
        else {
            // if we didn't find one to re-use, make a new Text node
            us[utexti] = document.createTextNode(us[utexti]);
        }
    }
    // remove stale nodes in ns
    while (nmin <= nmax) {
        n = ns[nmin];
        if (n !== null) {
            parent.removeChild(n);
        }
        nmin++;
    }
    // insert new nodes
    while (umin <= umax) {
        ux = us[umax];
        if (src[umax - umin] !== NOINSERT) {
            if (ul === null)
                parent.appendChild(ux);
            else
                parent.insertBefore(ux, ul);
        }
        ul = ux;
        umax--;
    }
}
// two nodes are "equable" if they are identical (===) or if we can make them the same, i.e. they're 
// Text nodes, which we can reuse with the new text
function equable(u, n, i, us) {
    if (u === n) {
        return true;
    }
    else if (typeof u === 'string' && n instanceof Text) {
        if (n.data !== u)
            n.data = u;
        us[i] = n;
        return true;
    }
    else {
        return false;
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
            node = array[i] = document.createTextNode(node);
            parent.appendChild(node);
        }
    }
}
function insertOrAppend(parent, node, marker, i, us) {
    if (typeof node === 'string') {
        node = us[i] = document.createTextNode(node);
    }
    if (marker === null)
        parent.appendChild(node);
    else
        parent.insertBefore(node, marker);
}
function normalizeIncomingArray(normalized, array) {
    for (var i = 0, len = array.length; i < len; i++) {
        var item = array[i];
        if (item instanceof Node) {
            normalized.push(item);
        }
        else if (item == null) {
            // skip
        }
        else if (Array.isArray(item)) {
            normalizeIncomingArray(normalized, item);
        }
        else if (typeof item === 'string') {
            normalized.push(item);
        }
        else {
            normalized.push(item.toString());
        }
    }
    return normalized;
}
function clear(node) {
    node.textContent = "";
}
// return an array of the indices of ns that comprise the longest increasing subsequence within ns
function longestPositiveIncreasingSubsequence(ns) {
    var seq = [], is = [], l = -1, pre = new Array(ns.length);
    for (var i = 0, len = ns.length; i < len; i++) {
        var n = ns[i];
        if (n < 0)
            continue;
        var j = findGreatestIndexLEQ(seq, n);
        if (j !== -1)
            pre[i] = is[j];
        if (j === l) {
            l++;
            seq[l] = n;
            is[l] = i;
        }
        else if (n < seq[j + 1]) {
            seq[j + 1] = n;
            is[j + 1] = i;
        }
    }
    for (i = is[l]; l >= 0; i = pre[i], l--) {
        seq[l] = i;
    }
    return seq;
}
function findGreatestIndexLEQ(seq, n) {
    // invariant: lo is guaranteed to be index of a value <= n, hi to be >
    // therefore, they actually start out of range: (-1, last + 1)
    var lo = -1, hi = seq.length;
    // fast path for simple increasing sequences
    if (hi > 0 && seq[hi - 1] <= n)
        return hi - 1;
    while (hi - lo > 1) {
        var mid = Math.floor((lo + hi) / 2);
        if (seq[mid] > n) {
            hi = mid;
        }
        else {
            lo = mid;
        }
    }
    return lo;
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
