(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SurplusCompiler = {})));
}(this, (function (exports) { 'use strict';

/// tokens:
/// < (followed by \w)
/// </ (followed by \w))
/// >
/// />
/// <!--
/// -->
/// =
/// {...
/// )
/// (
/// [
/// ]
/// {
/// }
/// "
/// '
/// `
/// ${
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)
// pre-compiled regular expressions
var tokensRx = /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|`|\$\{|\/\/|\n|\/\*|\*\/|(?:[^<>=\/()[\]{}"'`$\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?|\$(?!\{))+/g;
//                |          |    |    |   +- =
//                |          |    |    +- -->
//                |          |    +- <!--
//                |          +- /> or >
//                +- < or </ followed by \w
function tokenize(str, opts) {
    var toks = str.match(tokensRx);
    return toks || [];
}

// Reference information for the HTML and SVG DOM
var HtmlTags = [
    "a",
    "abbr",
    "acronym",
    "address",
    "applet",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "basefont",
    "bdi",
    "bdo",
    "bgsound",
    "big",
    "blink",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "command",
    "content",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "element",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    //"image", 
    "img",
    "input",
    "ins",
    "isindex",
    "kbd",
    "keygen",
    "label",
    "legend",
    "li",
    "link",
    "listing",
    "main",
    "map",
    "mark",
    "marquee",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "multicol",
    "nav",
    "nobr",
    "noembed",
    "noframes",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "plaintext",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "shadow",
    "slot",
    "small",
    "source",
    "spacer",
    "span",
    "strike",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "tt",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
    "xmp"
];
var HtmlTagRx = new RegExp("^(" + HtmlTags.join("|") + ")$");
var SvgTags = [
    "a",
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignObject",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "script",
    "set",
    "stop",
    "style",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern"
];
var SvgTagRx = new RegExp("^(" + SvgTags.join("|") + ")$");
var SvgOnlyTags = SvgTags.filter(function (t) { return !HtmlTagRx.test(t); });
var SvgOnlyTagRx = new RegExp("^(" + SvgOnlyTags.join("|") + ")$");
var SvgForeignTag = "foreignObject";
var AttributeRx = /-/;
var IsAttribute = function (prop) { return AttributeRx.test(prop); };
var HtmlEntites = {
    // support the same entites as Babel
    quot: "\u0022",
    amp: "&",
    apos: "\u0027",
    lt: "<",
    gt: ">",
    nbsp: "\u00A0",
    iexcl: "\u00A1",
    cent: "\u00A2",
    pound: "\u00A3",
    curren: "\u00A4",
    yen: "\u00A5",
    brvbar: "\u00A6",
    sect: "\u00A7",
    uml: "\u00A8",
    copy: "\u00A9",
    ordf: "\u00AA",
    laquo: "\u00AB",
    not: "\u00AC",
    shy: "\u00AD",
    reg: "\u00AE",
    macr: "\u00AF",
    deg: "\u00B0",
    plusmn: "\u00B1",
    sup2: "\u00B2",
    sup3: "\u00B3",
    acute: "\u00B4",
    micro: "\u00B5",
    para: "\u00B6",
    middot: "\u00B7",
    cedil: "\u00B8",
    sup1: "\u00B9",
    ordm: "\u00BA",
    raquo: "\u00BB",
    frac14: "\u00BC",
    frac12: "\u00BD",
    frac34: "\u00BE",
    iquest: "\u00BF",
    Agrave: "\u00C0",
    Aacute: "\u00C1",
    Acirc: "\u00C2",
    Atilde: "\u00C3",
    Auml: "\u00C4",
    Aring: "\u00C5",
    AElig: "\u00C6",
    Ccedil: "\u00C7",
    Egrave: "\u00C8",
    Eacute: "\u00C9",
    Ecirc: "\u00CA",
    Euml: "\u00CB",
    Igrave: "\u00CC",
    Iacute: "\u00CD",
    Icirc: "\u00CE",
    Iuml: "\u00CF",
    ETH: "\u00D0",
    Ntilde: "\u00D1",
    Ograve: "\u00D2",
    Oacute: "\u00D3",
    Ocirc: "\u00D4",
    Otilde: "\u00D5",
    Ouml: "\u00D6",
    times: "\u00D7",
    Oslash: "\u00D8",
    Ugrave: "\u00D9",
    Uacute: "\u00DA",
    Ucirc: "\u00DB",
    Uuml: "\u00DC",
    Yacute: "\u00DD",
    THORN: "\u00DE",
    szlig: "\u00DF",
    agrave: "\u00E0",
    aacute: "\u00E1",
    acirc: "\u00E2",
    atilde: "\u00E3",
    auml: "\u00E4",
    aring: "\u00E5",
    aelig: "\u00E6",
    ccedil: "\u00E7",
    egrave: "\u00E8",
    eacute: "\u00E9",
    ecirc: "\u00EA",
    euml: "\u00EB",
    igrave: "\u00EC",
    iacute: "\u00ED",
    icirc: "\u00EE",
    iuml: "\u00EF",
    eth: "\u00F0",
    ntilde: "\u00F1",
    ograve: "\u00F2",
    oacute: "\u00F3",
    ocirc: "\u00F4",
    otilde: "\u00F5",
    ouml: "\u00F6",
    divide: "\u00F7",
    oslash: "\u00F8",
    ugrave: "\u00F9",
    uacute: "\u00FA",
    ucirc: "\u00FB",
    uuml: "\u00FC",
    yacute: "\u00FD",
    thorn: "\u00FE",
    yuml: "\u00FF",
    OElig: "\u0152",
    oelig: "\u0153",
    Scaron: "\u0160",
    scaron: "\u0161",
    Yuml: "\u0178",
    fnof: "\u0192",
    circ: "\u02C6",
    tilde: "\u02DC",
    Alpha: "\u0391",
    Beta: "\u0392",
    Gamma: "\u0393",
    Delta: "\u0394",
    Epsilon: "\u0395",
    Zeta: "\u0396",
    Eta: "\u0397",
    Theta: "\u0398",
    Iota: "\u0399",
    Kappa: "\u039A",
    Lambda: "\u039B",
    Mu: "\u039C",
    Nu: "\u039D",
    Xi: "\u039E",
    Omicron: "\u039F",
    Pi: "\u03A0",
    Rho: "\u03A1",
    Sigma: "\u03A3",
    Tau: "\u03A4",
    Upsilon: "\u03A5",
    Phi: "\u03A6",
    Chi: "\u03A7",
    Psi: "\u03A8",
    Omega: "\u03A9",
    alpha: "\u03B1",
    beta: "\u03B2",
    gamma: "\u03B3",
    delta: "\u03B4",
    epsilon: "\u03B5",
    zeta: "\u03B6",
    eta: "\u03B7",
    theta: "\u03B8",
    iota: "\u03B9",
    kappa: "\u03BA",
    lambda: "\u03BB",
    mu: "\u03BC",
    nu: "\u03BD",
    xi: "\u03BE",
    omicron: "\u03BF",
    pi: "\u03C0",
    rho: "\u03C1",
    sigmaf: "\u03C2",
    sigma: "\u03C3",
    tau: "\u03C4",
    upsilon: "\u03C5",
    phi: "\u03C6",
    chi: "\u03C7",
    psi: "\u03C8",
    omega: "\u03C9",
    thetasym: "\u03D1",
    upsih: "\u03D2",
    piv: "\u03D6",
    ensp: "\u2002",
    emsp: "\u2003",
    thinsp: "\u2009",
    zwnj: "\u200C",
    zwj: "\u200D",
    lrm: "\u200E",
    rlm: "\u200F",
    ndash: "\u2013",
    mdash: "\u2014",
    lsquo: "\u2018",
    rsquo: "\u2019",
    sbquo: "\u201A",
    ldquo: "\u201C",
    rdquo: "\u201D",
    bdquo: "\u201E",
    dagger: "\u2020",
    Dagger: "\u2021",
    bull: "\u2022",
    hellip: "\u2026",
    permil: "\u2030",
    prime: "\u2032",
    Prime: "\u2033",
    lsaquo: "\u2039",
    rsaquo: "\u203A",
    oline: "\u203E",
    frasl: "\u2044",
    euro: "\u20AC",
    image: "\u2111",
    weierp: "\u2118",
    real: "\u211C",
    trade: "\u2122",
    alefsym: "\u2135",
    larr: "\u2190",
    uarr: "\u2191",
    rarr: "\u2192",
    darr: "\u2193",
    harr: "\u2194",
    crarr: "\u21B5",
    lArr: "\u21D0",
    uArr: "\u21D1",
    rArr: "\u21D2",
    dArr: "\u21D3",
    hArr: "\u21D4",
    forall: "\u2200",
    part: "\u2202",
    exist: "\u2203",
    empty: "\u2205",
    nabla: "\u2207",
    isin: "\u2208",
    notin: "\u2209",
    ni: "\u220B",
    prod: "\u220F",
    sum: "\u2211",
    minus: "\u2212",
    lowast: "\u2217",
    radic: "\u221A",
    prop: "\u221D",
    infin: "\u221E",
    ang: "\u2220",
    and: "\u2227",
    or: "\u2228",
    cap: "\u2229",
    cup: "\u222A",
    int: "\u222B",
    there4: "\u2234",
    sim: "\u223C",
    cong: "\u2245",
    asymp: "\u2248",
    ne: "\u2260",
    equiv: "\u2261",
    le: "\u2264",
    ge: "\u2265",
    sub: "\u2282",
    sup: "\u2283",
    nsub: "\u2284",
    sube: "\u2286",
    supe: "\u2287",
    oplus: "\u2295",
    otimes: "\u2297",
    perp: "\u22A5",
    sdot: "\u22C5",
    lceil: "\u2308",
    rceil: "\u2309",
    lfloor: "\u230A",
    rfloor: "\u230B",
    lang: "\u2329",
    rang: "\u232A",
    loz: "\u25CA",
    spades: "\u2660",
    clubs: "\u2663",
    hearts: "\u2665",
    diams: "\u2666",
};

// 'kind' properties are to make sure that Typescript treats each of these as distinct classes
// otherwise, two classes with same props, like the 4 with just code / loc, are treated
// as interchangeable
var Program = /** @class */ (function () {
    function Program(segments) {
        this.segments = segments;
        this.kind = 'program';
    }
    return Program;
}());
var CodeText = /** @class */ (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
        this.kind = 'code';
    }
    return CodeText;
}());
var EmbeddedCode = /** @class */ (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
        this.kind = 'embeddedcode';
    }
    return EmbeddedCode;
}());
var JSXElement = /** @class */ (function () {
    function JSXElement(tag, properties, references, functions, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.references = references;
        this.functions = functions;
        this.content = content;
        this.loc = loc;
        this.kind = 'element';
        this.isHTML = JSXElement.domTag.test(this.tag);
    }
    JSXElement.domTag = /^[a-z][^\.]*$/;
    return JSXElement;
}());
var JSXText = /** @class */ (function () {
    function JSXText(text) {
        this.text = text;
        this.kind = 'text';
    }
    return JSXText;
}());
var JSXComment = /** @class */ (function () {
    function JSXComment(text) {
        this.text = text;
        this.kind = 'comment';
    }
    return JSXComment;
}());
var JSXInsert = /** @class */ (function () {
    function JSXInsert(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'insert';
    }
    return JSXInsert;
}());
var JSXStaticProperty = /** @class */ (function () {
    function JSXStaticProperty(name, value) {
        this.name = name;
        this.value = value;
        this.kind = 'staticprop';
    }
    return JSXStaticProperty;
}());
var JSXDynamicProperty = /** @class */ (function () {
    function JSXDynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
        this.kind = 'dynamicprop';
    }
    return JSXDynamicProperty;
}());
var JSXSpreadProperty = /** @class */ (function () {
    function JSXSpreadProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'spread';
    }
    return JSXSpreadProperty;
}());
var JSXStyleProperty = /** @class */ (function () {
    function JSXStyleProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'style';
        this.name = "style";
    }
    return JSXStyleProperty;
}());
var JSXReference = /** @class */ (function () {
    function JSXReference(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'reference';
    }
    return JSXReference;
}());
var JSXFunction = /** @class */ (function () {
    function JSXFunction(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'function';
    }
    return JSXFunction;
}());
// a Copy transform, for building non-identity transforms on top of
var Copy = {
    Program: function (node) {
        return new Program(this.CodeSegments(node.segments));
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) {
            return node instanceof CodeText ? _this.CodeText(node) :
                _this.JSXElement(node, SvgOnlyTagRx.test(node.tag));
        });
    },
    EmbeddedCode: function (node) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement: function (node, svg) {
        var _this = this;
        return new JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p); }), node.references.map(function (r) { return _this.JSXReference(r); }), node.functions.map(function (f) { return _this.JSXFunction(f); }), node.content.map(function (c) { return _this.JSXContent(c, svg && node.tag !== SvgForeignTag); }), node.loc);
    },
    JSXProperty: function (node) {
        return node instanceof JSXStaticProperty ? this.JSXStaticProperty(node) :
            node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
                node instanceof JSXStyleProperty ? this.JSXStyleProperty(node) :
                    this.JSXSpreadProperty(node);
    },
    JSXContent: function (node, svg) {
        return node instanceof JSXComment ? this.JSXComment(node) :
            node instanceof JSXText ? this.JSXText(node) :
                node instanceof JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node, svg || SvgOnlyTagRx.test(node.tag));
    },
    JSXInsert: function (node) {
        return new JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText: function (node) { return node; },
    JSXText: function (node) { return node; },
    JSXComment: function (node) { return node; },
    JSXStaticProperty: function (node) { return node; },
    JSXDynamicProperty: function (node) {
        return new JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty: function (node) {
        return new JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXStyleProperty: function (node) {
        return new JSXStyleProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXReference: function (node) {
        return new JSXReference(this.EmbeddedCode(node.code), node.loc);
    },
    JSXFunction: function (node) {
        return new JSXFunction(this.EmbeddedCode(node.code), node.loc);
    }
};

// pre-compiled regular expressions
var rx = {
    identifier: /^[a-zA-Z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)*/,
    stringEscapedEnd: /[^\\](\\\\)*\\$/,
    leadingWs: /^\s+/,
    refProp: /^ref\d*$/,
    fnProp: /^fn\d*$/,
    styleProp: /^style$/,
    badStaticProp: /^(ref\d*|fn\d*|style)$/
};
var parens = {
    "(": ")",
    "[": "]",
    "{": "}",
    "{...": "}",
    "${": "}"
};

function parse(TOKS, opts) {
    var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
    return program();
    function program() {
        var segments = [], text = "", loc = LOC();
        while (!EOF) {
            if (IS('<')) {
                if (text)
                    segments.push(new CodeText(text, loc));
                text = "";
                segments.push(jsxElement());
                loc = LOC();
            }
            else if (IS('"') || IS("'")) {
                text += quotedString();
            }
            else if (IS('`')) {
                text = templateLiteral(segments, text, loc);
            }
            else if (IS('//')) {
                text += codeSingleLineComment();
            }
            else if (IS('/*')) {
                text += codeMultiLineComment();
            }
            else {
                text += TOK, NEXT();
            }
        }
        if (text)
            segments.push(new CodeText(text, loc));
        return new Program(segments);
    }
    function jsxElement() {
        if (NOT('<'))
            ERR("not at start of html element");
        var start = LOC(), tag = "", properties = [], references = [], functions = [], content = [], prop, hasContent = true;
        NEXT(); // pass '<'
        tag = SPLIT(rx.identifier);
        if (!tag)
            ERR("bad element name", start);
        SKIPWS();
        // scan for properties until end of opening tag
        while (!EOF && NOT('>') && NOT('/>')) {
            if (MATCH(rx.identifier)) {
                prop = jsxProperty();
                if (prop instanceof JSXReference)
                    references.push(prop);
                else if (prop instanceof JSXFunction)
                    functions.push(prop);
                else
                    properties.push(prop);
            }
            else if (IS('{...')) {
                properties.push(jsxSpreadProperty());
            }
            else {
                ERR("unrecognized content in begin tag");
            }
            SKIPWS();
        }
        if (EOF)
            ERR("unterminated start node", start);
        hasContent = IS('>');
        NEXT(); // pass '>' or '/>'
        if (hasContent) {
            while (!EOF && NOT('</')) {
                if (IS('<')) {
                    content.push(jsxElement());
                }
                else if (IS('{')) {
                    content.push(jsxInsert());
                }
                else if (IS('<!--')) {
                    content.push(jsxComment());
                }
                else {
                    content.push(jsxText());
                }
            }
            if (EOF)
                ERR("element missing close tag", start);
            NEXT(); // pass '</'
            if (tag !== SPLIT(rx.identifier))
                ERR("mismatched open and close tags", start);
            if (NOT('>'))
                ERR("malformed close tag");
            NEXT(); // pass '>'
        }
        return new JSXElement(tag, properties, references, functions, content, start);
    }
    function jsxText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && NOT('{') && NOT('</')) {
            text += TOK, NEXT();
        }
        return new JSXText(text);
    }
    function jsxComment() {
        if (NOT('<!--'))
            ERR("not in HTML comment");
        var start = LOC(), text = "";
        NEXT(); // skip '<!--'
        while (!EOF && NOT('-->')) {
            text += TOK, NEXT();
        }
        if (EOF)
            ERR("unterminated html comment", start);
        NEXT(); // skip '-->'
        return new JSXComment(text);
    }
    function jsxInsert() {
        var loc = LOC();
        return new JSXInsert(embeddedCode(), loc);
    }
    function jsxProperty() {
        if (!MATCH(rx.identifier))
            ERR("not at start of property declaration");
        var loc = LOC(), name = SPLIT(rx.identifier), code;
        SKIPWS(); // pass name
        if (IS('=')) {
            NEXT(); // pass '='
            SKIPWS();
            if (IS('"') || IS("'")) {
                if (rx.badStaticProp.test(name))
                    ERR("cannot name a static property '" + name + "' as it has a special meaning as a dynamic property", loc);
                return new JSXStaticProperty(name, quotedString());
            }
            else if (IS('{')) {
                code = embeddedCode();
                return rx.refProp.test(name) ? new JSXReference(code, loc) :
                    rx.fnProp.test(name) ? new JSXFunction(code, loc) :
                        rx.styleProp.test(name) ? new JSXStyleProperty(code, loc) :
                            new JSXDynamicProperty(name, code, loc);
            }
            else {
                return ERR("unexepected value for JSX property");
            }
        }
        else {
            return new JSXStaticProperty(name, "true");
        }
    }
    function jsxSpreadProperty() {
        if (NOT('{...'))
            ERR("not at start of JSX spread");
        var loc = LOC();
        return new JSXSpreadProperty(embeddedCode(), loc);
    }
    function embeddedCode() {
        if (NOT('{') && NOT('{...'))
            ERR("not at start of JSX embedded code");
        var prefixLength = TOK.length, segments = [], loc = LOC(), last = balancedParens(segments, "", loc);
        // remove closing '}'
        last = last.substr(0, last.length - 1);
        segments.push(new CodeText(last, loc));
        // remove opening '{' or '{...', adjusting code loc accordingly
        var first = segments[0];
        first.loc.col += prefixLength;
        segments[0] = new CodeText(first.text.substr(prefixLength), first.loc);
        return new EmbeddedCode(segments);
    }
    function balancedParens(segments, text, loc) {
        var start = LOC(), end = PARENS();
        if (end === undefined)
            ERR("not in parentheses");
        text += TOK, NEXT();
        while (!EOF && NOT(end)) {
            if (IS("'") || IS('"')) {
                text += quotedString();
            }
            else if (IS('`')) {
                text = templateLiteral(segments, text, loc);
            }
            else if (IS('//')) {
                text += codeSingleLineComment();
            }
            else if (IS('/*')) {
                text += codeMultiLineComment();
            }
            else if (IS("<")) {
                if (text)
                    segments.push(new CodeText(text, { line: loc.line, col: loc.col, pos: loc.pos }));
                text = "";
                segments.push(jsxElement());
                loc.line = LINE;
                loc.col = COL;
                loc.pos = POS;
            }
            else if (PARENS()) {
                text = balancedParens(segments, text, loc);
            }
            else {
                text += TOK, NEXT();
            }
        }
        if (EOF)
            ERR("unterminated parentheses", start);
        text += TOK, NEXT();
        return text;
    }
    function templateLiteral(segments, text, loc) {
        if (NOT('`'))
            ERR("not in template literal");
        var start = LOC();
        text += TOK, NEXT();
        while (!EOF && NOT('`')) {
            if (IS('${')) {
                text = balancedParens(segments, text, loc);
            }
            else {
                text += TOK, NEXT();
            }
        }
        if (EOF)
            ERR("unterminated template literal", start);
        text += TOK, NEXT();
        return text;
    }
    function quotedString() {
        if (NOT("'") && NOT('"'))
            ERR("not in quoted string");
        var start = LOC(), quote, text;
        quote = text = TOK, NEXT();
        while (!EOF && (NOT(quote) || rx.stringEscapedEnd.test(text))) {
            text += TOK, NEXT();
        }
        if (EOF)
            ERR("unterminated string", start);
        text += TOK, NEXT();
        return text;
    }
    function codeSingleLineComment() {
        if (NOT("//"))
            ERR("not in code comment");
        var text = "";
        while (!EOF && NOT('\n')) {
            text += TOK, NEXT();
        }
        // EOF within a code comment is ok, just means that the text ended with a comment
        if (!EOF)
            text += TOK, NEXT();
        return text;
    }
    function codeMultiLineComment() {
        if (NOT("/*"))
            ERR("not in code comment");
        var start = LOC(), text = "";
        while (!EOF && NOT('*/')) {
            text += TOK, NEXT();
        }
        if (EOF)
            ERR("unterminated multi-line comment", start);
        text += TOK, NEXT();
        return text;
    }
    // token stream ops
    function NEXT() {
        if (TOK === "\n")
            LINE++, COL = 0, POS++;
        else if (TOK)
            COL += TOK.length, POS += TOK.length;
        if (++i >= TOKS.length)
            EOF = true, TOK = "";
        else
            TOK = TOKS[i];
    }
    function ERR(msg, loc) {
        loc = loc || LOC();
        var frag = " at line " + loc.line + " col " + loc.col + ": ``" + TOKS.join('').substr(loc.pos, 30).replace("\n", "").replace("\r", "") + "''";
        throw new Error(msg + frag);
    }
    function IS(t) {
        return TOK === t;
    }
    function NOT(t) {
        return TOK !== t;
    }
    function MATCH(rx) {
        return rx.test(TOK);
    }
    function MATCHES(rx) {
        return rx.exec(TOK);
    }
    function PARENS() {
        return parens[TOK];
    }
    function SKIPWS() {
        while (true) {
            if (IS('\n'))
                NEXT();
            else if (MATCHES(rx.leadingWs))
                SPLIT(rx.leadingWs);
            else
                break;
        }
    }
    function SPLIT(rx) {
        var ms = MATCHES(rx), m;
        if (ms && (m = ms[0])) {
            COL += m.length;
            POS += m.length;
            TOK = TOK.substring(m.length);
            if (TOK === "")
                NEXT();
            return m;
        }
        else {
            return "";
        }
    }
    function LOC() {
        return { line: LINE, col: COL, pos: POS };
    }
}

var rx$3 = {
    locs: /(\n)|(\u0000(\d+),(\d+)\u0000)/g
};
var vlqFinalDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
var vlqContinuationDigits = "ghijklmnopqrstuvwxyz0123456789+/";
function locationMark(loc) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}
function extractMappings(embedded) {
    var line = [], lines = [], lastGeneratedCol = 0, lastSourceLine = 0, lastSourceCol = 0, lineStartPos = 0, lineMarksLength = 0;
    var src = embedded.replace(rx$3.locs, function (_, nl, mark, sourceLine, sourceCol, offset) {
        if (nl) {
            lines.push(line);
            line = [];
            lineStartPos = offset + 1;
            lineMarksLength = 0;
            lastGeneratedCol = 0;
            return nl;
        }
        else {
            var generatedCol = offset - lineStartPos - lineMarksLength;
            sourceLine = parseInt(sourceLine);
            sourceCol = parseInt(sourceCol);
            line.push(vlq(generatedCol - lastGeneratedCol)
                + "A" // only one file
                + vlq(sourceLine - lastSourceLine)
                + vlq(sourceCol - lastSourceCol));
            //lineMarksLength += mark.length;
            lineMarksLength -= 2;
            lastGeneratedCol = generatedCol;
            lastSourceLine = sourceLine;
            lastSourceCol = sourceCol;
            //return "";
            return "/*" + sourceLine + "," + sourceCol + "*/";
        }
    });
    lines.push(line);
    var mappings = lines.map(function (l) { return l.join(','); }).join(';');
    return {
        src: src,
        mappings: mappings
    };
}
function extractMap(src, original, opts) {
    var extract = extractMappings(src), map = createMap(extract.mappings, original, opts);
    return {
        src: extract.src,
        map: map
    };
}
function createMap(mappings, original, opts) {
    return {
        version: 3,
        file: opts.targetfile,
        sources: [opts.sourcefile],
        sourcesContent: [original],
        names: [],
        mappings: mappings
    };
}
function appendMap(src, original, opts) {
    var extract = extractMap(src, original, opts), appended = extract.src
        + "\n//# sourceMappingURL=data:application/json,"
        + encodeURIComponent(JSON.stringify(extract.map));
    return appended;
}
function vlq(num) {
    var str = "", i;
    // convert num sign representation from 2s complement to sign bit in lsd
    num = num < 0 ? (-num << 1) + 1 : num << 1 + 0;
    // convert num to base 32 number
    var numstr = num.toString(32);
    // convert base32 digits of num to vlq continuation digits in reverse order
    for (i = numstr.length - 1; i > 0; i--)
        str += vlqContinuationDigits[parseInt(numstr[i], 32)];
    // add final vlq digit
    str += vlqFinalDigits[parseInt(numstr[0], 32)];
    return str;
}

var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// pre-compiled regular expressions
var rx$2 = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen: /\)\s*$/,
    nonIdChars: /[^a-zA-Z0-9]/,
    doubleQuotes: /"/g,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
var DOMExpression = /** @class */ (function () {
    function DOMExpression(ids, statements, computations) {
        this.ids = ids;
        this.statements = statements;
        this.computations = computations;
    }
    return DOMExpression;
}());
var Computation = /** @class */ (function () {
    function Computation(statements, loc, stateVar, seed) {
        this.statements = statements;
        this.loc = loc;
        this.stateVar = stateVar;
        this.seed = seed;
    }
    return Computation;
}());
var SubComponent = /** @class */ (function () {
    function SubComponent(name, refs, fns, properties, children, loc) {
        this.name = name;
        this.refs = refs;
        this.fns = fns;
        this.properties = properties;
        this.children = children;
        this.loc = loc;
    }
    return SubComponent;
}());
var codeGen = function (ctl, opts) {
    var compileSegments = function (node) {
        return node.segments.reduce(function (res, s) { return res + compileSegment(s, res); }, "");
    }, compileSegment = function (node, previousCode) {
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode));
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, indent) {
        var code = !node.isHTML ?
            emitSubComponent(buildSubComponent(node), indent) :
            (node.properties.length === 0 && node.functions.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                    + ("Surplus.createElement('" + node.tag + "', null, null)") :
                (node.properties.length === 1
                    && node.properties[0] instanceof JSXStaticProperty
                    && node.properties[0].name === "className"
                    && node.functions.length === 1
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                        + ("Surplus.createElement('" + node.tag + "', " + node.properties[0].value + ", null)") :
                    emitDOMExpression(buildDOMExpression(node), indent);
        return markLoc(code, node.loc, opts);
    }, buildSubComponent = function (node) {
        var refs = node.references.map(function (r) { return compileSegments(r.code); }), fns = node.functions.map(function (r) { return compileSegments(r.code); }), 
        // group successive properties into property objects, but spreads stand alone
        // e.g. a="1" b={foo} {...spread} c="3" gets combined into [{a: "1", b: foo}, spread, {c: "3"}]
        properties = node.properties.reduce(function (props, p) {
            var lastSegment = props.length > 0 ? props[props.length - 1] : null, value = p instanceof JSXStaticProperty ? p.value : compileSegments(p.code);
            if (p instanceof JSXSpreadProperty) {
                props.push(value);
            }
            else if (lastSegment === null
                || typeof lastSegment === 'string'
                || (p instanceof JSXStyleProperty && lastSegment["style"])) {
                props.push((_a = {}, _a[p.name] = value, _a));
            }
            else {
                lastSegment[p.name] = value;
            }
            return props;
            var _a;
        }, []), children = node.content.map(function (c) {
            return c instanceof JSXElement ? compileHtmlElement(c, indent("")) :
                c instanceof JSXText ? codeStr(c.text.trim()) :
                    c instanceof JSXInsert ? compileSegments(c.code) :
                        "document.createComment(" + codeStr(c.text) + ")";
        });
        return new SubComponent(node.tag, refs, fns, properties, children, node.loc);
    }, emitSubComponent = function (sub, indent) {
        var nl = indent.nl, nli = indent.nli, nlii = indent.nlii;
        // build properties expression
        var 
        // convert children to an array expression
        children = sub.children.length === 0 ? '[]' : '[' + nlii
            + sub.children.join(',' + nlii) + nli
            + ']', property0 = sub.properties.length === 0 ? null : sub.properties[0], propertiesWithChildren = property0 === null || typeof property0 === 'string'
            // add children to first property object if we can, otherwise add an initial property object with just children
            ? [{ children: children }].concat(sub.properties) : [__assign$1({}, property0, { children: children })].concat(sub.properties.splice(1)), propertyExprs = propertiesWithChildren.map(function (obj) {
            return typeof obj === 'string' ? obj :
                '{' + Object.keys(obj).map(function (p) { return "" + nli + codeStr(p) + ": " + obj[p]; }).join(',') + nl + '}';
        }), properties = propertyExprs.length === 1 ? propertyExprs[0] :
            "Object.assign(" + propertyExprs.join(', ') + ")";
        // main call to sub-component
        var expr = sub.name + "(" + properties + ")";
        // ref assignments
        if (sub.refs.length > 0) {
            expr = sub.refs.map(function (r) { return r + " = "; }).join("") + expr;
        }
        // build computations for fns
        if (sub.fns.length > 0) {
            var comps = sub.fns.map(function (fn) { return new Computation(["(" + fn + ")(__, __state);"], sub.loc, '__state', null); });
            expr = "(function (__) {" + nli + "var __ = " + expr + ";" + nli + comps.map(function (comp) { return emitComputation(comp, indent) + nli; }) + nli + "return __;" + nl + "})()";
        }
        return expr;
    }, buildDOMExpression = function (top) {
        var ids = [], statements = [], computations = [];
        var buildHtmlElement = function (node, parent, n, svg) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            svg = svg || SvgOnlyTagRx.test(tag);
            if (!node.isHTML) {
                buildInsertedSubComponent(node, parent, n);
            }
            else {
                var id_1 = addId(parent, tag, n), propExprs_1 = properties.map(function (p) { return p instanceof JSXStaticProperty ? '' : compileSegments(p.code); }), spreads_1 = properties.filter(function (p) { return p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty; }), classProp_1 = spreads_1.length === 0 && properties.filter(function (p) { return p instanceof JSXStaticProperty && (svg ? p.name === 'class' : p.name === 'className'); })[0] || null, propsDynamic_1 = propExprs_1.some(function (e) { return !noApparentSignals(e); }), propStmts = properties.map(function (p, i) {
                    return p === classProp_1 ? '' :
                        p instanceof JSXStaticProperty ? buildProperty(id_1, p.name, p.value, svg) :
                            p instanceof JSXDynamicProperty ? buildProperty(id_1, p.name, propExprs_1[i], svg) :
                                p instanceof JSXStyleProperty ? buildStyle(p, id_1, propExprs_1[i], propsDynamic_1, spreads_1) :
                                    buildSpread(id_1, propExprs_1[i], svg);
                }).filter(function (s) { return s !== ''; }), refStmts = references.map(function (r) { return compileSegments(r.code) + ' = '; }).join(''), childSvg_1 = svg && tag !== SvgForeignTag;
                addStatement(id_1 + " = " + refStmts + "Surplus.create" + (svg ? 'Svg' : '') + "Element('" + tag + "', " + (classProp_1 && classProp_1.value) + ", " + (parent || null) + ");");
                if (!propsDynamic_1) {
                    propStmts.forEach(addStatement);
                }
                if (content.length === 1 && content[0] instanceof JSXInsert) {
                    buildJSXContent(content[0], id_1);
                }
                else {
                    content.forEach(function (c, i) { return buildChild(c, id_1, i, childSvg_1); });
                }
                if (propsDynamic_1) {
                    addComputation(propStmts, null, null, loc);
                }
                functions.forEach(function (f) { return buildNodeFn(f, id_1); });
            }
        }, buildProperty = function (id, prop, expr, svg) {
            return svg || IsAttribute(prop)
                ? id + ".setAttribute(" + codeStr(prop) + ", " + expr + ");"
                : id + "." + prop + " = " + expr + ";";
        }, buildSpread = function (id, expr, svg) {
            return "Surplus.spread(" + id + ", " + expr + ", " + svg + ");";
        }, buildNodeFn = function (node, id) {
            var expr = compileSegments(node.code);
            addComputation(["(" + expr + ")(" + id + ", __state);"], '__state', null, node.loc);
        }, buildStyle = function (node, id, expr, dynamic, spreads) {
            return "Surplus.assign(" + id + ".style, " + expr + ");";
        }, buildChild = function (node, parent, n, svg) {
            return node instanceof JSXElement ? buildHtmlElement(node, parent, n, svg) :
                node instanceof JSXComment ? buildHtmlComment(node, parent) :
                    node instanceof JSXText ? buildJSXText(node, parent, n) :
                        buildJSXInsert(node, parent, n);
        }, buildInsertedSubComponent = function (node, parent, n) {
            return buildJSXInsert(new JSXInsert(new EmbeddedCode([node]), node.loc), parent, n);
        }, buildHtmlComment = function (node, parent) {
            return addStatement("Surplus.createComment(" + codeStr(node.text) + ", " + parent + ")");
        }, buildJSXText = function (node, parent, n) {
            return addStatement("Surplus.createTextNode(" + codeStr(node.text) + ", " + parent + ")");
        }, buildJSXInsert = function (node, parent, n) {
            var id = addId(parent, 'insert', n), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            addStatement(id + " = Surplus.createTextNode('', " + parent + ")");
            addComputation(["Surplus.insert(__range, " + ins + ");"], "__range", range, node.loc);
        }, buildJSXContent = function (node, parent) {
            var content = compileSegments(node.code), dynamic = !noApparentSignals(content);
            if (dynamic)
                addComputation(["Surplus.content(" + parent + ", " + content + ", __current);"], '__current', "''", node.loc);
            else
                addStatement("Surplus.content(" + parent + ", " + content + ", \"\");");
        }, addId = function (parent, tag, n) {
            tag = tag.replace(rx$2.nonIdChars, '_');
            var id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
            ids.push(id);
            return id;
        }, addStatement = function (stmt) {
            return statements.push(stmt);
        }, addComputation = function (body, stateVar, seed, loc) {
            computations.push(new Computation(body, loc, stateVar, seed));
        };
        buildHtmlElement(top, '', 0, false);
        return new DOMExpression(ids, statements, computations);
    }, emitDOMExpression = function (code, indent) {
        var nl = indent.nl, nli = indent.nli;
        return '(function () {' + nli
            + 'var ' + code.ids.join(', ') + ';' + nli
            + code.statements.join(nli) + nli
            + code.computations.map(function (comp) { return emitComputation(comp, indent); })
                .join(nli) + (code.computations.length === 0 ? '' : nli)
            + 'return __;' + nl
            + '})()';
    }, emitComputation = function (comp, _a) {
        var nli = _a.nli, nlii = _a.nlii;
        var statements = comp.statements, loc = comp.loc, stateVar = comp.stateVar, seed = comp.seed;
        if (stateVar)
            statements[statements.length - 1] = 'return ' + statements[statements.length - 1];
        var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nli), code = "Surplus.S(function (" + (stateVar || '') + ") {" + body + "}" + (seed !== null ? ", " + seed : '') + ");";
        return markLoc(code, loc, opts);
    };
    return compileSegments(ctl);
};
var noApparentSignals = function (code) {
    return !rx$2.hasParen.test(code) || (rx$2.loneFunction.test(code) && !rx$2.endsInParen.test(code));
};
var indent = function (previousCode) {
    var m = rx$2.indent.exec(previousCode), pad = m ? m[1] : '', nl = "\r\n" + pad, nli = nl + '    ', nlii = nli + '    ';
    return { nl: nl, nli: nli, nlii: nlii };
};
var codeStr = function (str) {
    return '"' +
        str.replace(rx$2.backslashes, "\\\\")
            .replace(rx$2.doubleQuotes, "\\\"")
            .replace(rx$2.newlines, "\\n") +
        '"';
};
var markLoc = function (str, loc, opts) {
    return opts.sourcemap ? locationMark(loc) + str : str;
};
var markBlockLocs = function (str, loc, opts) {
    if (!opts.sourcemap)
        return str;
    var lines = str.split('\n'), offset = 0;
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        offset += line.length;
        var lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
        lines[i] = locationMark(lineloc) + line;
    }
    return locationMark(loc) + lines.join('\n');
};

var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
var rx$1 = {
    trimmableWS: /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs: /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity: /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g
};
var tf = [
    // active transforms, in order from first to last applied
    trimTextNodes,
    collapseExtraWhitespaceInTextNodes,
    removeEmptyTextNodes,
    translateHTMLEntitiesToUnicodeInTextNodes,
    translateJSXPropertyNames,
    translateHTMLPropertyNames,
    translateDeepStylePropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
var transform = function (node, opt) { return tf.Program(node); };
function trimTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                var content = node.content.map(function (c) {
                    return c.kind === 'text'
                        ? new JSXText(c.text.replace(rx$1.trimmableWS, ''))
                        : c;
                });
                node = new JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function collapseExtraWhitespaceInTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            if (node.tag !== 'pre') {
                var lessWsContent = node.content.map(function (c) {
                    return c instanceof JSXText
                        ? new JSXText(c.text.replace(rx$1.extraWs, ' '))
                        : c;
                });
                node = new JSXElement(node.tag, node.properties, node.references, node.functions, lessWsContent, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function removeEmptyTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            var content = node.content.filter(function (c) { return c.kind !== 'text' || c.text !== ''; });
            node = new JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            return tx.JSXElement.call(this, node, svg);
        } });
}
function translateHTMLEntitiesToUnicodeInTextNodes(tx) {
    return __assign({}, tx, { JSXText: function (node) {
            var raw = node.text, unicode = raw.replace(rx$1.htmlEntity, function (entity, dec, hex, named) {
                return dec ? String.fromCharCode(parseInt(dec, 10)) :
                    hex ? String.fromCharCode(parseInt(hex, 16)) :
                        HtmlEntites[named] ||
                            entity;
            });
            if (raw !== unicode)
                node = new JSXText(unicode);
            return tx.JSXText.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, lastid = {};
            properties.forEach(function (p, i) { return p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) {
                // spreads and styles can be repeated
                return p instanceof JSXSpreadProperty
                    || p instanceof JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (properties.length !== uniqueProperties.length) {
                node = new JSXElement(tag, uniqueProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            if (node.isHTML) {
                var nonJSXProperties = properties.map(function (p) {
                    return p instanceof JSXDynamicProperty
                        ? new JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc)
                        : p;
                });
                node = new JSXElement(tag, nonJSXProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function translateJSXPropertyName(name) {
    return rx$1.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function translateHTMLPropertyNames(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            if (node.isHTML) {
                var transName_1 = svg ? translateHTMLPropertyToAttribute : translateHTMLAttributeToProperty, translatedProperties = node.properties.map(function (p) {
                    return p instanceof JSXDynamicProperty
                        ? new JSXDynamicProperty(transName_1(p.name), p.code, p.loc) :
                        p instanceof JSXStaticProperty
                            ? new JSXStaticProperty(transName_1(p.name), p.value) :
                            p;
                });
                node = new JSXElement(node.tag, translatedProperties, node.references, node.functions, node.content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function translateHTMLAttributeToProperty(name) {
    return name === "class" ? "className" : name === "for" ? "htmlFor" : name;
}
function translateHTMLPropertyToAttribute(name) {
    return name === "className" ? "class" : name === "htmlFor" ? "for" : name;
}
function translateDeepStylePropertyNames(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            if (node.isHTML) {
                var nonJSXProperties = node.properties.map(function (p) {
                    return p instanceof JSXDynamicProperty && p.name.substr(0, 6) === 'style-' ?
                        new JSXDynamicProperty('style.' + p.name.substr(6), p.code, p.loc) :
                        p instanceof JSXStaticProperty && p.name.substr(0, 6) === 'style-' ?
                            new JSXStaticProperty('style.' + p.name.substr(6), p.value) :
                            p;
                });
                node = new JSXElement(node.tag, nonJSXProperties, node.references, node.functions, node.content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, svg) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            if (node.isHTML && content.length === 1 && content[0] instanceof JSXText) {
                var text = this.JSXText(content[0]), textContent = new JSXStaticProperty("textContent", codeStr(text.text));
                node = new JSXElement(tag, properties.concat([textContent]), references, functions, [], loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } });
}

function compile(str, opts) {
    opts = opts || {};
    var params = {
        sourcemap: opts.sourcemap || null,
        sourcefile: opts.sourcefile || 'in.js',
        targetfile: opts.targetfile || 'out.js'
    };
    var toks = tokenize(str, params), ast = parse(toks, params), ast2 = transform(ast, params), code = codeGen(ast2, params), out = params.sourcemap === 'extract' ? extractMap(code, str, params) :
        params.sourcemap === 'append' ? appendMap(code, str, params) :
            code;
    return out;
}

exports.compile = compile;

Object.defineProperty(exports, '__esModule', { value: true });

})));
