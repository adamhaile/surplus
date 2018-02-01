import { setAttribute } from './dom';
import { isAttrOnlyField, isPropOnlyField, getAttrName, getPropName, isDeepProp, isNSAttr } from './fieldNames';
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
function setField(node, name, value, svg) {
    var deep;
    if (name === 'ref' || name === 'fm') {
        // ignore
    }
    else if (name === 'style') {
        if (value && typeof value === 'object')
            assign(node.style, value);
    }
    else if ((svg && !isPropOnlyField(name)) || (!svg && isAttrOnlyField(name))) {
        // attribute
        name = getAttrName(name);
        deep = isNSAttr(name);
        if (deep) {
            setAttributeNS(node, deep[0], deep[1], value);
        }
        else {
            setAttribute(node, name, value);
        }
    }
    else {
        // property
        name = getPropName(name);
        deep = isDeepProp(name);
        if (deep) {
            node = node[deep[0]];
            if (node)
                node[deep[1]] = value;
        }
        else {
            node[name] = value;
        }
    }
}
