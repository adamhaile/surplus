import { setAttribute } from './dom';
import { isAttrOnlyField, isPropOnlyField, getAttrName, getPropName, isDeepProp, isNSAttr } from './fieldNames';
import { setAttributeNS } from './index';

export type PropObj = { [ name : string ] : any };

export function assign(a : PropObj, b : PropObj) {
    var props = Object.keys(b);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        a[name] = b[name];
    }
}

export function spread(node : HTMLElement, obj : PropObj, svg : boolean) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        setField(node, name, obj[name], svg);
    }
}

function setField(node : HTMLElement | SVGElement, name : string, value : any, svg : boolean) {
    var deep : [ string, string ] | null;
    if (name === 'ref' || name === 'fm') {
        // ignore
    } else if (name === 'style') {
        if (value && typeof value === 'object') assign(node.style, value);
    } else if ((svg && !isPropOnlyField(name)) || (!svg && isAttrOnlyField(name))) {
        // attribute
        name = getAttrName(name);
        deep = isNSAttr(name);
        if (deep) {
            setAttributeNS(node, deep[0], deep[1], value);
        } else {
            setAttribute(node, name, value);
        }
    } else {
        // property
        name = getPropName(name);
        deep = isDeepProp(name); 
        if (deep) {
            node = (node as any)[deep[0]];
            if (node) (node as any)[deep[1]] = value;
        } else {
            (node as any)[name] = value;
        }
    }
}
