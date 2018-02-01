import { setAttribute } from './dom';
import { getFieldData, FieldData } from './fieldNames';
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

function setField(node : HTMLElement | SVGElement, field : string, value : any, svg : boolean) {
    if (field === 'ref' || field === 'fm') {
        // ignore
    } else if (field === 'style') {
        if (value && typeof value === 'object') assign(node.style, value);
    } else {
        var [ name, namespace, attr ] = getFieldData(field, svg);
        if (attr) {
            if (namespace) {
                setAttributeNS(node, namespace, name, value);
            } else {
                setAttribute(node, name, value);
            }
        } else {
            if (namespace) {
                node = (node as any)[namespace];
                if (node) (node as any)[name] = value;
            } else {
                (node as any)[name] = value;
            }
        }
    }
}
