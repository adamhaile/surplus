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

export class Content {
    private current = "" as string | Node | Node[];

    constructor(
        public readonly parent : Element
    ) {}

    update(value : InsertValue) {
        var parent  = this.parent,
            current = this.current,
            t       = typeof value;

        if (current === value) {
            // nothing to do
        } else if (t === 'string') {
            this.current = parent.textContent = value as string;
        } else if (t === 'number' || t === 'boolean') {
            value = value!.toString();
            this.current = parent.textContent = value;
        } else if (value == null) { // matches both null and undefined
            clear(parent);
            this.current = "";
        } else if (t === 'function') {
            var self = this;
            S(function () {
                self.update((value as Function)());
            });
        } else if (value instanceof Node) {
            if (Array.isArray(current)) {
                if (current.length === 0) {
                    parent.appendChild(value);
                } else if (current.length === 1) {
                    parent.replaceChild(value, current[0]);
                } else {
                    clear(parent);
                    parent.appendChild(value);
                }
            } else if (current === "") {
                parent.appendChild(value);
            } else {
                parent.replaceChild(value, parent.firstChild!);
            }
            this.current = value;
        } else if (Array.isArray(value)) {
            var array = normalizeIncomingArray([], value);
            if (array.length === 0) {
                clear(parent);
            } else {
                if (Array.isArray(current)) {
                    if (current.length === 0) {
                        appendNodes(parent, array, 0, array.length);
                    } else {
                        reconcileArrays(parent, current, array);
                    }
                } else if (current === "") {
                    appendNodes(parent, array, 0, array.length);
                } else {
                    reconcileArrays(parent, [parent.firstChild!], array);
                }
            }
            this.current = array as Node[];
        } else {
            throw new Error("content must be Node, stringable, or array of same");
        }

        return this;
    }
}

var NOMATCH = -1,
    NOINSERT = -2;

var RECONCILE_ARRAY_BATCH = 0;
const RECONCILE_ARRAY_BITS = 16,
    RECONCILE_ARRAY_INC = 1 << RECONCILE_ARRAY_BITS,
    RECONCILE_ARRAY_MASK = RECONCILE_ARRAY_INC - 1;

// reconcile the content of parent from ns to us
// see ivi's excellent writeup of diffing arrays in a vdom library: 
// https://github.com/ivijs/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1187
// this code isn't identical, since we're diffing real dom nodes to nodes-or-strings, 
// but the core methodology of trimming ends and reversals, matching nodes, then using
// the longest increasing subsequence to minimize DOM ops is inspired by ivi.
function reconcileArrays(parent : Element, ns : Node[], us : (string | Node)[]) {
    var ulen = us.length,
        // n = nodes, u = updates
        // ranges defined by min and max indices
        nmin = 0, 
        nmax = ns.length - 1,
        umin = 0,
        umax = ulen - 1,
        // start nodes of ranges
        n    = ns[nmin],
        u    = us[umin],
        // end nodes of ranges
        nx   = ns[nmax],
        ux   = us[umax],
        // node, if any, just after ux, used for doing .insertBefore() to put nodes at end
        ul   = nx.nextSibling,
        i    : number,
        j    : number,
        k    : number,
        loop = true;

    // scan over common prefixes, suffixes, and simple reversals
    fixes: while (loop) {
        loop = false;

        // common prefix, u === n
        while (equable(u, n, umin, us)) {
            umin++;
            nmin++;
            if (umin > umax || nmin > nmax) break fixes;
            u = us[umin];
            n = ns[nmin];
        }

        // common suffix, ux === nx
        while (equable(ux, nx, umax, us)) {
            ul = nx;
            umax--;
            nmax--;
            if (umin > umax || nmin > nmax) break fixes;
            ux = us[umax];
            nx = ns[nmax];
        }
        
        // reversal u === nx, have to swap node forward
        while (equable(u, nx, umin, us)) {
            loop = true;
            parent.insertBefore(nx, n);
            umin++;
            nmax--;
            if (umin > umax || nmin > nmax) break fixes;
            u = us[umin];
            nx = ns[nmax];
        }

        // reversal ux === n, have to swap node back
        while (equable(ux, n, umax, us)) {
            loop = true;
            if (ul === null) parent.appendChild(n);
            else parent.insertBefore(n, ul);
            ul = n;
            umax--;
            nmin++;
            if (umin > umax || nmin > nmax) break fixes;
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
    var ntext = [] as number[];

    // update global batch identifer
    RECONCILE_ARRAY_BATCH = (RECONCILE_ARRAY_BATCH + 1) % RECONCILE_ARRAY_INC;

    for (i = nmin, j = (nmin << RECONCILE_ARRAY_BITS) + RECONCILE_ARRAY_BATCH; i <= nmax; i++, j += RECONCILE_ARRAY_INC) {
        n = ns[i];
        // add or update special order property
        if ((n as any).__surplus_order === undefined) {
            Object.defineProperty(n, '__surplus_order', { value: j, writable: true });
        } else {
            (n as any).__surplus_order = j;
        }
        if (n instanceof Text) {
            ntext.push(i);
        }
    }

    // now loop through us, looking for the order property, otherwise recording NOMATCH
    var src = new Array(umax - umin + 1),
        utext = [] as number[],
        preserved = 0;

    for (i = umin; i <= umax; i++) {
        u = us[i];
        if (typeof u === 'string') {
            utext.push(i);
            src[i - umin] = NOMATCH;
        } else if ((j = (u as any).__surplus_order) !== undefined && (j & RECONCILE_ARRAY_MASK) === RECONCILE_ARRAY_BATCH) {
            j >>= RECONCILE_ARRAY_BITS;
            src[i - umin] = j;
            ns[j] = null!;
            preserved++;
        } else {
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
    var utexti = 0,
        lcsj  = 0,
        ntextk  = 0;
    for (i = 0, j = 0, k = 0; i < utext.length; i++) {
        utexti = utext[i];
        // need to answer qeustion "if utext[i] falls between two lcs nodes, is there an ntext between them which we can reuse?"
        // first, find j such that lcs[j] is the first lcs node *after* utext[i]
        while (j < lcs.length && (lcsj = lcs[j]) < utexti - umin) j++; 
        // now, find k such that ntext[k] is the first ntext *after* lcs[j-1] (or after start, if j === 0)
        while (k < ntext.length && (ntextk = ntext[k], j !== 0) && ntextk < src[lcs[j - 1]]) k++; 
        // if ntext[k] < lcs[j], then we know ntext[k] falls between lcs[j-1] (or start) and lcs[j] (or end)
        // that means we can re-use it without moving it
        if (k < ntext.length && (j === lcs.length || ntextk < src[lcsj])) {
            n = ns[ntextk];
            u = us[utexti];
            if ((n as Text).data !== u) (n as Text).data = u as string;
            ns[ntextk] = null!;
            us[utexti] = n;
            src[utexti] = NOINSERT;
            k++;
        } else {
            // if we didn't find one to re-use, make a new Text node
            us[utexti] = document.createTextNode(us[utexti] as string);
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
        ux = us[umax] as Node;
        if (src[umax - umin] !== NOINSERT) {
            if (ul === null) parent.appendChild(ux);
            else parent.insertBefore(ux, ul);
        }
        ul = ux;
        umax--;
    }
}

// two nodes are "equable" if they are identical (===) or if we can make them the same, i.e. they're 
// Text nodes, which we can reuse with the new text
function equable(u : string | Node, n : Node, i : number, us : (string | Node)[]) {
    if (u === n) {
        return true;
    } else if (typeof u === 'string' && n instanceof Text) {
        if (n.data !== u) n.data = u;
        us[i] = n;
        return true;
    } else {
        return false;
    }
}

function appendNodes(parent : Node, array : (Node | string)[], i : number, end : number) {
    var node : Node | string;
    for (; i < end; i++) {
        node = array[i];
        if (node instanceof Node) {
            parent.appendChild(node);
        } else {
            node = array[i] = document.createTextNode(node);
            parent.appendChild(node);
        }
    }
}

function insertOrAppend(parent : Node, node : string | Node, marker : Node | null, i : number, us : (string | Node)[]) {
    if (typeof node === 'string') {
        node = us[i] = document.createTextNode(node);
    }
    if (marker === null) parent.appendChild(node);
    else parent.insertBefore(node, marker);
}

function normalizeIncomingArray(normalized : (Node | string)[], array : InsertArray) : (Node | string)[] {
    for (var i = 0, len = array.length; i < len; i++) {
        var item = array[i];
        if (item instanceof Node) {
            normalized.push(item);
        } else if (item == null) { // matches both null and undefined
            // skip
        } else if (Array.isArray(item)) {
            normalizeIncomingArray(normalized, item);
        } else if (typeof item === 'string') {
            normalized.push(item);
        } else {
            normalized.push(item.toString());
        }
    }

    return normalized;
}

function clear(node : Node) {
    node.textContent = "";
}

// return an array of the indices of ns that comprise the longest increasing subsequence within ns
function longestPositiveIncreasingSubsequence(ns : number[]) {
    var seq = [] as number[],
        is  = [] as number[],
        l   = -1,
        pre = new Array(ns.length);

    for (var i = 0, len = ns.length; i < len; i++) {
        var n = ns[i];
        if (n < 0) continue;
        var j = findGreatestIndexLEQ(seq, n);
        if (j !== -1) pre[i] = is[j];
        if (j === l) {
            l++;
            seq[l] = n;
            is[l]  = i;
        } else if (n < seq[j + 1]) {
            seq[j + 1] = n;
            is[j + 1] = i;
        }
    }

    for (i = is[l]; l >= 0; i = pre[i], l--) {
        seq[l] = i;
    }

    return seq;
}

function findGreatestIndexLEQ(seq : number[], n : number) {
    // invariant: lo is guaranteed to be index of a value <= n, hi to be >
    // therefore, they actually start out of range: (-1, last + 1)
    var lo = -1,
        hi = seq.length;
    
    // fast path for simple increasing sequences
    if (hi > 0 && seq[hi - 1] <= n) return hi - 1;

    while (hi - lo > 1) {
        var mid = Math.floor((lo + hi) / 2);
        if (seq[mid] > n) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return lo;
}
