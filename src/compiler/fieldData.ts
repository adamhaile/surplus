// WARNING: this file "lives" in the compiler source, and is copied into the runtime at build
// If you modify this in runtime, your changes will be erased during build.
export const enum FieldFlags {
    // bottom 2 bits encode field type
    Type      = 3,
    Property  = 0,
    Attribute = 1,
    Ignore    = 2,
    Assign    = 3
}

export type FieldData = [ string, string | null, FieldFlags ];

const
    // pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
    htmlFieldCache = {
        style          : [ 'style'          , null, FieldFlags.Assign    ],
        ref            : [ 'ref'            , null, FieldFlags.Ignore    ],
        fn             : [ 'fn'             , null, FieldFlags.Ignore    ],
        class          : [ 'className'      , null, FieldFlags.Property  ],
        for            : [ 'htmlFor'        , null, FieldFlags.Property  ],
        // a few React oddities, mostly disagreeing about casing
        onDoubleClick  : [ 'ondblclick'     , null, FieldFlags.Property  ],
        spellCheck     : [ 'spellcheck'     , null, FieldFlags.Property  ],
        allowFullScreen: [ 'allowFullscreen', null, FieldFlags.Property  ],
        autoFocus      : [ 'autofocus'      , null, FieldFlags.Property  ],
        autoPlay       : [ 'autoplay'       , null, FieldFlags.Property  ],
    } as { [ field : string ] : FieldData },
    svgFieldCache = {
        style        : [ 'style'      , null, FieldFlags.Assign    ],
        ref          : [ 'ref'        , null, FieldFlags.Ignore    ],
        fn           : [ 'fn'         , null, FieldFlags.Ignore    ],
        className    : [ 'class'      , null, FieldFlags.Attribute ],
        htmlFor      : [ 'for'        , null, FieldFlags.Attribute ],
        onDoubleClick: [ 'ondblclick' , null, FieldFlags.Property  ]
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
        return m ? [ m[2].toLowerCase() + prop.substr(m[0].length), m[1], FieldFlags.Property ] : [ prop, null, FieldFlags.Property ]; 
    },
    attrNamespaces  = {
        xlink: "http://www.w3.org/1999/xlink",
        xml:   "http://www.w3.org/XML/1998/namespace",
    } as { [ name : string ] : string },
    attrNamespaceRx = new RegExp(`^(${Object.keys(attrNamespaces).join('|')})-(.*)`),
    buildAttrData   = (attr : string) : FieldData => { 
        var m = attrNamespaceRx.exec(attr); 
        return m ? [ m[2], attrNamespaces[m[1]], FieldFlags.Attribute ] : [ attr, null, FieldFlags.Attribute ]; 
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