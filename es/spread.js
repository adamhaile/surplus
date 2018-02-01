import { setAttribute } from './dom';
import { getFieldData } from './fieldData';
import { setAttributeNS } from './index';
export function assign(a, b) {
    var props = Object.keys(b);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        a[name] = b[name];
    }
}
export function spread(node, obj, svg) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        setField(node, name, obj[name], svg);
    }
}
function setField(node, field, value, svg) {
    if (field === 'ref' || field === 'fm') {
        // ignore
    }
    else if (field === 'style') {
        if (value && typeof value === 'object')
            assign(node.style, value);
    }
    else {
        var _a = getFieldData(field, svg), name = _a[0], namespace = _a[1], attr = _a[2];
        if (attr) {
            if (namespace) {
                setAttributeNS(node, namespace, name, value);
            }
            else {
                setAttribute(node, name, value);
            }
        }
        else {
            if (namespace) {
                node = node[namespace];
                if (node)
                    node[name] = value;
            }
            else {
                node[name] = value;
            }
        }
    }
}
