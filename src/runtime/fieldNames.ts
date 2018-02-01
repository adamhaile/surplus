// this file is common between compiler and runtime
export const
    attributeOnlyRx = /^(aria|data)[\-A-Z]/,
    isAttrOnlyField = (prop : string) => attributeOnlyRx.test(prop),
    propOnlyRx      = /^(on|style)/,
    isPropOnlyField = (prop : string) => propOnlyRx.test(prop),
    propPartRx      = /[a-z][A-Z]/g,
    getAttrName     = (prop : string) => {
        return prop === "className" ? "class" :
            prop === "htmlFor" ? "for" :
            prop.replace(propPartRx, m => m[0] + '-' + m[1]).toLowerCase();
    },
    jsxEventPropRx  = /^on[A-Z]/,
    attrPartRx      = /\-(?:[a-z]|$)/g,
    getPropName     = (attr : string) => {
        var prop = attr === "class" ? "className" :
            attr === "for" ? "htmlFor" :
            attr.replace(attrPartRx, m => m.length === 1 ? '' : m[1].toUpperCase());
        return jsxEventPropRx.test(prop) ? (prop === "onDoubleClick" ? "ondblclick" : prop.toLowerCase()) : prop;
    },
    deepPropRx      = /^(style)([A-Z])/,
    isDeepProp      = (prop : string) : [ string, string] | null => { var m = deepPropRx.exec(prop); return m ? [ m[1], m[2].toLowerCase() + prop.substr(m[0].length) ] : null },
    attrNamespaces  = {
        xlink: "http://www.w3.org/1999/xlink",
        xml:   "http://www.w3.org/XML/1998/namespace",
    } as { [ name : string ] : string },
    nsAttrRx        = new RegExp(`^(${Object.keys(attrNamespaces).join('|')})-(.*)`),
    isNSAttr        = (attr : string) : [ string, string ] | null => { var m = nsAttrRx.exec(attr); return m ? [ attrNamespaces[m[1]], m[2] ] : null; };