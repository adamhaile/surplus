import { S } from './index';
var PendingClears = null;
// value : null | undefined | string | number | boolean | Node | (null | undefined | string | number | boolean | Node)[]
export function content(parent, value) {
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
;
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
