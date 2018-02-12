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
        // special props
        style           : [ 'style'          , null, FieldFlags.Assign    ],
        ref             : [ 'ref'            , null, FieldFlags.Ignore    ],
        fn              : [ 'fn'             , null, FieldFlags.Ignore    ],
        // attr compat
        class           : [ 'className'      , null, FieldFlags.Property  ],
        for             : [ 'htmlFor'        , null, FieldFlags.Property  ],
        "accept-charset": [ 'acceptCharset'  , null, FieldFlags.Property  ],
        "http-equiv"    : [ 'httpEquiv'      , null, FieldFlags.Property  ],
        // a few React oddities, mostly disagreeing about casing
        onDoubleClick   : [ 'ondblclick'     , null, FieldFlags.Property  ],
        spellCheck      : [ 'spellcheck'     , null, FieldFlags.Property  ],
        allowFullScreen : [ 'allowFullscreen', null, FieldFlags.Property  ],
        autoCapitalize  : [ 'autocapitalize' , null, FieldFlags.Property  ],
        autoFocus       : [ 'autofocus'      , null, FieldFlags.Property  ],
        autoPlay        : [ 'autoplay'       , null, FieldFlags.Property  ],
        // other
        // role is part of the ARIA spec but not caught by the aria- attr filter
        role           : [ 'role'           , null, FieldFlags.Attribute ]
    } as { [ field : string ] : FieldData },
    svgFieldCache = {
        // special props
        style        : [ 'style'      , null, FieldFlags.Assign    ],
        ref          : [ 'ref'        , null, FieldFlags.Ignore    ],
        fn           : [ 'fn'         , null, FieldFlags.Ignore    ],
        // property compat
        className    : [ 'class'      , null, FieldFlags.Attribute ],
        htmlFor      : [ 'for'        , null, FieldFlags.Attribute ],
        tabIndex     : [ 'tabindex'   , null, FieldFlags.Attribute ],
        // React compat
        onDoubleClick: [ 'ondblclick' , null, FieldFlags.Property  ],
        // attributes with eccentric casing - some SVG attrs are snake-cased, some camelCased
        allowReorder             : [ 'allowReorder'             , null, FieldFlags.Attribute ],
        attributeName            : [ 'attributeName'            , null, FieldFlags.Attribute ],
        attributeType            : [ 'attributeType'            , null, FieldFlags.Attribute ],
        autoReverse              : [ 'autoReverse'              , null, FieldFlags.Attribute ],
        baseFrequency            : [ 'baseFrequency'            , null, FieldFlags.Attribute ],
        calcMode                 : [ 'calcMode'                 , null, FieldFlags.Attribute ],
        clipPathUnits            : [ 'clipPathUnits'            , null, FieldFlags.Attribute ],
        contentScriptType        : [ 'contentScriptType'        , null, FieldFlags.Attribute ],
        contentStyleType         : [ 'contentStyleType'         , null, FieldFlags.Attribute ],
        diffuseConstant          : [ 'diffuseConstant'          , null, FieldFlags.Attribute ],
        edgeMode                 : [ 'edgeMode'                 , null, FieldFlags.Attribute ],
        externalResourcesRequired: [ 'externalResourcesRequired', null, FieldFlags.Attribute ],
        filterRes                : [ 'filterRes'                , null, FieldFlags.Attribute ],
        filterUnits              : [ 'filterUnits'              , null, FieldFlags.Attribute ],
        gradientTransform        : [ 'gradientTransform'        , null, FieldFlags.Attribute ],
        gradientUnits            : [ 'gradientUnits'            , null, FieldFlags.Attribute ],
        kernelMatrix             : [ 'kernelMatrix'             , null, FieldFlags.Attribute ],
        kernelUnitLength         : [ 'kernelUnitLength'         , null, FieldFlags.Attribute ],
        keyPoints                : [ 'keyPoints'                , null, FieldFlags.Attribute ],
        keySplines               : [ 'keySplines'               , null, FieldFlags.Attribute ],
        keyTimes                 : [ 'keyTimes'                 , null, FieldFlags.Attribute ],
        lengthAdjust             : [ 'lengthAdjust'             , null, FieldFlags.Attribute ],
        limitingConeAngle        : [ 'limitingConeAngle'        , null, FieldFlags.Attribute ],
        markerHeight             : [ 'markerHeight'             , null, FieldFlags.Attribute ],
        markerUnits              : [ 'markerUnits'              , null, FieldFlags.Attribute ],
        maskContentUnits         : [ 'maskContentUnits'         , null, FieldFlags.Attribute ],
        maskUnits                : [ 'maskUnits'                , null, FieldFlags.Attribute ],
        numOctaves               : [ 'numOctaves'               , null, FieldFlags.Attribute ],
        pathLength               : [ 'pathLength'               , null, FieldFlags.Attribute ],
        patternContentUnits      : [ 'patternContentUnits'      , null, FieldFlags.Attribute ],
        patternTransform         : [ 'patternTransform'         , null, FieldFlags.Attribute ],
        patternUnits             : [ 'patternUnits'             , null, FieldFlags.Attribute ],
        pointsAtX                : [ 'pointsAtX'                , null, FieldFlags.Attribute ],
        pointsAtY                : [ 'pointsAtY'                , null, FieldFlags.Attribute ],
        pointsAtZ                : [ 'pointsAtZ'                , null, FieldFlags.Attribute ],
        preserveAlpha            : [ 'preserveAlpha'            , null, FieldFlags.Attribute ],
        preserveAspectRatio      : [ 'preserveAspectRatio'      , null, FieldFlags.Attribute ],
        primitiveUnits           : [ 'primitiveUnits'           , null, FieldFlags.Attribute ],
        refX                     : [ 'refX'                     , null, FieldFlags.Attribute ],
        refY                     : [ 'refY'                     , null, FieldFlags.Attribute ],
        repeatCount              : [ 'repeatCount'              , null, FieldFlags.Attribute ],
        repeatDur                : [ 'repeatDur'                , null, FieldFlags.Attribute ],
        requiredExtensions       : [ 'requiredExtensions'       , null, FieldFlags.Attribute ],
        requiredFeatures         : [ 'requiredFeatures'         , null, FieldFlags.Attribute ],
        specularConstant         : [ 'specularConstant'         , null, FieldFlags.Attribute ],
        specularExponent         : [ 'specularExponent'         , null, FieldFlags.Attribute ],
        spreadMethod             : [ 'spreadMethod'             , null, FieldFlags.Attribute ],
        startOffset              : [ 'startOffset'              , null, FieldFlags.Attribute ],
        stdDeviation             : [ 'stdDeviation'             , null, FieldFlags.Attribute ],
        stitchTiles              : [ 'stitchTiles'              , null, FieldFlags.Attribute ],
        surfaceScale             : [ 'surfaceScale'             , null, FieldFlags.Attribute ],
        systemLanguage           : [ 'systemLanguage'           , null, FieldFlags.Attribute ],
        tableValues              : [ 'tableValues'              , null, FieldFlags.Attribute ],
        targetX                  : [ 'targetX'                  , null, FieldFlags.Attribute ],
        targetY                  : [ 'targetY'                  , null, FieldFlags.Attribute ],
        textLength               : [ 'textLength'               , null, FieldFlags.Attribute ],
        viewBox                  : [ 'viewBox'                  , null, FieldFlags.Attribute ],
        viewTarget               : [ 'viewTarget'               , null, FieldFlags.Attribute ],
        xChannelSelector         : [ 'xChannelSelector'         , null, FieldFlags.Attribute ],
        yChannelSelector         : [ 'yChannelSelector'         , null, FieldFlags.Attribute ],
        zoomAndPan               : [ 'zoomAndPan'               , null, FieldFlags.Attribute ],
    } as { [ field : string ] : FieldData };

const
    attributeOnlyRx = /-/,
    deepAttrRx = /^style-/,
    isAttrOnlyField = (field : string) => attributeOnlyRx.test(field) && !deepAttrRx.test(field),
    propOnlyRx      = /^(on|style)/,
    isPropOnlyField = (field : string) => propOnlyRx.test(field),
    propPartRx      = /[a-z][A-Z]/g,
    getAttrName     = (field : string) => field.replace(propPartRx, m => m[0] + '-' + m[1]).toLowerCase(),
    jsxEventPropRx  = /^on[A-Z]/,
    attrPartRx      = /\-(?:[a-z]|$)/g,
    getPropName     = (field : string) => {
        var prop = field.replace(attrPartRx, m => m.length === 1 ? '' : m[1].toUpperCase());
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
        let cache  = svg ? svgFieldCache : htmlFieldCache,
            cached = cache[field];

        if (cached) return cached;

        let attr =  svg && !isPropOnlyField(field)
                || !svg && isAttrOnlyField(field),
            name = attr ? getAttrName(field) : getPropName(field);

        if (name !== field && (cached = cache[name])) return cached;

        let data = attr ? buildAttrData(name) : buildPropData(name);

        return cache[field] = data;
    }