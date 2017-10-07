import { S } from './index';
import { InsertValue, InsertScalar, InsertArray } from './insert';

// inline ES6 Map type definition, as we generally want to target ES5, but with Map
interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
}

interface MapConstructor {
    new (): Map<any, any>;
    new <K, V>(entries?: [K, V][]): Map<K, V>;
    readonly prototype: Map<any, any>;
}
declare var Map: MapConstructor;

// value : null | undefined | string | number | boolean | Node | (null | undefined | string | number | boolean | Node)[]
export function content(parent : Element, value : InsertValue) {
    var t = typeof value,
        len : number;

    if (t === 'string' || t === 'number' || t === 'boolean') {
        parent.textContent = value as string;
    } else if (value == null) { // matches both null and undefined
        clear(parent);
    } else if (t === 'function') {
        S(function () {
            content(parent, (value as Function)());
        });
    } else if (value instanceof Node) {
        len = parent.childNodes.length;
        if (len === 0) {
            parent.appendChild(value);
        } else if (parent.firstChild !== value) {
            if (len === 1) {
                parent.replaceChild(value, parent.firstChild!);
            } else {
                clear(parent);
                parent.appendChild(value);
            }
        }
    } else if (Array.isArray(value)) {
        insertArray(parent, value);
    } else {
        throw new Error("content must be Node, stringable, or array of same");
    }
};

function insertArray(parent : Element, _array : InsertArray) {
    var indices = new Map<Node, number>(),
        textNodes = [] as number[],
        array = [] as (Node | string)[],
        preservedNodes = prepareIncomingArray(array, indices, textNodes, _array, parent),
        len = array.length, 
        last = null as Node | null,
        a : Node | null,
        b : Node | string,
        t : Node | null,
        u : Node | null,
        ai : number | undefined,
        bi : number,
        ti : number | undefined,
        amax : number,
        acur : number,
        abest : number,
        bmin : number,
        bfound : boolean,
        abestloc : Node | null;

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
            } else {
                // both nodes preserved, have to decide whether to push back a or pull forward b
                amax = ai - bi;
                acur = abest = 0;
                bmin = 0;
                abestloc = null;
                t = a;
                bfound = false;
                while (bmin < amax) {
                    t = t.nextSibling!;
                    ti = indices.get(t);
                    while (t !== null && ti === undefined) {
                        u = t.nextSibling!;
                        parent.removeChild(t);
                        t = u;
                        ti = indices.get(t);
                    }
                    if (t === null) break;
                    if (ti! < ai) {
                        acur++;
                    } else {
                        acur--;
                        amax--;
                    }
                    if (acur > abest) {
                        abest = acur;
                        abestloc = t;
                    }
                    if (t === b) bfound = true;
                    if (bfound === false) bmin++;
                }
                if (bmin < abest) {
                    t = a.nextSibling;
                    parent.insertBefore(a, abestloc!.nextSibling);
                    a = t;
                } else {
                    parent.insertBefore(b, a);
                    b = array[++bi];
                }
            }
        } else {
            if (a.nodeType === Node.TEXT_NODE) {
                (a as Text).data = b;
                a = a.nextSibling;
                b = array[++bi];
            } else {
                // a is a non-text Node, b is a string, have to decide whether to pull forward a text node for b or push back a

            }
        }
    }

    if (bi < len) {
        // append extra new nodes
        appendNodes(parent, array, bi, len);
    } else {
        // remove extra discarded nodes
        while (a !== last) {
            t = a!.nextSibling;
            parent.removeChild(a!);
            a = t;
        }
    }
}

function appendNodes(parent : Node, array : (Node | string)[], i : number, end : number) {
    var node : Node | string;
    for (; i < end; i++) {
        node = array[i];
        if (node instanceof Node) {
            parent.appendChild(node);
        } else {
            node = document.createTextNode(node);
            parent.appendChild(node);
        }
    }
}

function prepareIncomingArray(normalized : (Node | string)[], indices : Map<Node, number>, textNodes : number[], array : InsertArray, parent : Node) : number {
    var childCount = 0;

    for (var i = 0, len = array.length; i < len; i++) {
        var item = array[i];
        if (item instanceof Node) {
            if (item.parentNode === parent) childCount++;
            indices.set(item, normalized.length);
            normalized.push(item);
        } else if (item == null) { // matches both null and undefined
            // skip
        } else if (Array.isArray(item)) {
            childCount += prepareIncomingArray(normalized, indices, textNodes, item, parent);
        } else {
            textNodes.push(normalized.length);
            normalized.push(item as string);
        }
    }

    return childCount;
}

function clear(node : Node) {
    node.textContent = null;
}
