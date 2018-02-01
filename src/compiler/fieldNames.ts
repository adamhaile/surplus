// this file is common between compiler and runtime
export type FieldData = [ string, string | null, boolean ];

const
    // pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
    htmlFieldCache = {
        class        : [ 'className' , null, false ],
        for          : [ 'htmlFor'   , null, false ],
        onDoubleClick: [ 'ondblclick', null, false ]
    } as { [ field : string ] : FieldData },
    svgFieldCache = {
        className    : [ 'class'     , null, true ],
        htmlFor      : [ 'for'       , null, true ],
        onDoubleClick: [ 'ondblclick', null, false ]
    } as { [ field : string ] : FieldData };

const
    attributeOnlyRx = /^(aria|data)[\-A-Z]/,
    isAttrOnlyField = (prop : string) => attributeOnlyRx.test(prop),
    propOnlyRx      = /^(on|style)/,
    isPropOnlyField = (prop : string) => propOnlyRx.test(prop),
    propPartRx      = /[a-z][A-Z]/g,
    getAttrName     = (prop : string) => prop.replace(propPartRx, m => m[0] + '-' + m[1]).toLowerCase(),
    jsxEventPropRx  = /^on[A-Z]/,
    attrPartRx      = /\-(?:[a-z]|$)/g,
    getPropName     = (attr : string) => {
        var prop = attr.replace(attrPartRx, m => m.length === 1 ? '' : m[1].toUpperCase());
        return jsxEventPropRx.test(prop) ? prop.toLowerCase() : prop;
    },
    deepPropRx      = /^(style)([A-Z])/,
    buildPropData   = (prop : string) : FieldData => { 
        var m = deepPropRx.exec(prop); 
        return m ? [ m[2].toLowerCase() + prop.substr(m[0].length), m[1], false ] : [ prop, null, false ]; 
    },
    attrNamespaces  = {
        xlink: "http://www.w3.org/1999/xlink",
        xml:   "http://www.w3.org/XML/1998/namespace",
    } as { [ name : string ] : string },
    attrNamespaceRx = new RegExp(`^(${Object.keys(attrNamespaces).join('|')})-(.*)`),
    buildAttrData   = (attr : string) : FieldData => { 
        var m = attrNamespaceRx.exec(attr); 
        return m ? [ m[2], attrNamespaces[m[1]], true ] : [ attr, null, true ]; 
    };

export const 
    getFieldData = (field : string, svg : boolean) : FieldData => {
        const 
            cache  = svg ? svgFieldCache : htmlFieldCache,
            cached = cache[field];

        if (cached) return cached;

        let attr =  svg && !isPropOnlyField(field)
                 || !svg && isAttrOnlyField(field),
            name = attr ? getAttrName(field) : getPropName(field),
            data = attr ? buildAttrData(name) : buildPropData(name);

        return cache[field] = data;
    }