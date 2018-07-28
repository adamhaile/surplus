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
    /// $
    /// //
    /// \n
    /// /*
    /// */
    /// misc (any string not containing one of the above)
    // pre-compiled regular expressions
    var tokensRx = /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|`|\$|\/\/|\n|\/\*|\*\/|(?:[^<>=\/()[\]{}"'`$\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g;
    //                |          |    |    |   +- =
    //                |          |    |    +- -->
    //                |          |    +- <!--
    //                |          +- /> or >
    //                +- < or </ followed by \w
    function tokenize(str, opts) {
        var toks = str.match(tokensRx);
        return toks || [];
    }

    // ESTree compliant
    var Program = 'Program';
    var CodeText = 'CodeText';
    var EmbeddedCode = 'EmbeddedCode';
    var JSXElementKind;
    (function (JSXElementKind) {
        JSXElementKind[JSXElementKind["HTML"] = 0] = "HTML";
        JSXElementKind[JSXElementKind["SVG"] = 1] = "SVG";
        JSXElementKind[JSXElementKind["SubComponent"] = 2] = "SubComponent";
    })(JSXElementKind || (JSXElementKind = {}));
    var JSXElement = 'JSXElement';
    var JSXText = 'JSXText';
    var JSXComment = 'JSXComment';
    var JSXInsert = 'JSXInsert';
    var JSXStaticField = 'JSXStaticField';
    var JSXDynamicField = 'JSXDynamicField';
    var JSXSpread = 'JSXSpread';
    var JSXStyleProperty = 'JSXStyleProperty';
    var JSXReference = 'JSXReference';
    var JSXFunction = 'JSXFunction';

    // pre-compiled regular expressions
    var rx = {
        identifier: /^[a-zA-Z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)*/,
        stringEscapedEnd: /[^\\](\\\\)*\\$/,
        leadingWs: /^\s+/,
        hasNonWs: /\S/,
        refProp: /^ref\d*$/,
        fnProp: /^fn\d*$/,
        styleProp: /^style$/,
        badStaticProp: /^(ref\d*|fn\d*|style)$/
    };
    var parens = {
        "(": ")",
        "[": "]",
        "{": "}",
        "{...": "}"
    };
    function parse(TOKS, opts) {
        var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
        return program();
        function program() {
            var segments = [], text = "", loc = LOC();
            while (!EOF) {
                if (IS('<')) {
                    if (text)
                        segments.push({ type: CodeText, text: text, loc: loc });
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
                segments.push({ type: CodeText, text: text, loc: loc });
            return { type: Program, segments: segments };
        }
        function jsxElement() {
            if (NOT('<'))
                ERR("not at start of html element");
            var start = LOC(), tag = "", fields = [], references = [], functions = [], content = [], hasContent = true, field, insert;
            NEXT(); // pass '<'
            tag = SPLIT(rx.identifier);
            if (!tag)
                ERR("bad element name", start);
            SKIPWS();
            // scan for properties until end of opening tag
            while (!EOF && NOT('>') && NOT('/>')) {
                if (MATCH(rx.identifier)) {
                    field = jsxField();
                    if (field.type === JSXReference)
                        references.push(field);
                    else if (field.type === JSXFunction)
                        functions.push(field);
                    else
                        fields.push(field);
                }
                else if (IS('{...')) {
                    fields.push(jsxSpreadProperty());
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
                        insert = jsxInsertOrComment();
                        if (insert)
                            content.push(insert);
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
            return { type: JSXElement, tag: tag, fields: fields, references: references, functions: functions, content: content, kind: JSXElementKind.HTML, loc: start };
        }
        function jsxText() {
            var text = "";
            while (!EOF && NOT('<') && NOT('<!--') && NOT('{') && NOT('</')) {
                text += TOK, NEXT();
            }
            return { type: JSXText, text: text };
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
            return { type: JSXComment, text: text };
        }
        function jsxInsertOrComment() {
            if (NOT('{'))
                ERR("not in JSX insert");
            var loc = LOC(), flags = { hasContent: false }, code = embeddedCode(flags);
            return flags.hasContent ? { type: JSXInsert, code: code, loc: loc } : null;
        }
        function jsxField() {
            if (!MATCH(rx.identifier))
                ERR("not at start of property declaration");
            var loc = LOC(), name = SPLIT(rx.identifier), code, flags;
            SKIPWS(); // pass name
            if (IS('=')) {
                NEXT(); // pass '='
                SKIPWS();
                if (IS('"') || IS("'")) {
                    if (rx.badStaticProp.test(name))
                        ERR("cannot name a static property '" + name + "' as it has a special meaning as a dynamic property", loc);
                    return { type: JSXStaticField, name: name, value: quotedString() };
                }
                else if (IS('{')) {
                    flags = { hasContent: false };
                    code = embeddedCode(flags);
                    if (!flags.hasContent)
                        ERR("value for property '" + name + "' cannot be empty", loc);
                    return rx.refProp.test(name) ? { type: JSXReference, code: code, loc: loc } :
                        rx.fnProp.test(name) ? { type: JSXFunction, code: code, loc: loc } :
                            rx.styleProp.test(name) ? { type: JSXStyleProperty, name: 'style', code: code, loc: loc } :
                                { type: JSXDynamicField, name: name, code: code, loc: loc };
                }
                else {
                    return ERR("unexepected value for JSX property");
                }
            }
            else {
                return { type: JSXStaticField, name: name, value: "true" };
            }
        }
        function jsxSpreadProperty() {
            if (NOT('{...'))
                ERR("not at start of JSX spread");
            var loc = LOC(), flags = { hasContent: false }, code = embeddedCode(flags);
            if (!flags.hasContent)
                ERR("spread value cannot be empty", loc);
            return { type: JSXSpread, code: code, loc: loc };
        }
        function embeddedCode(flags) {
            if (NOT('{') && NOT('{...'))
                ERR("not at start of JSX embedded code");
            var prefixLength = TOK.length, segments = [], loc = LOC(), last = balancedParens(segments, "", loc, flags);
            // remove closing '}'
            last = last.substr(0, last.length - 1);
            segments.push({ type: CodeText, text: last, loc: loc });
            // remove opening '{' or '{...', adjusting code loc accordingly
            var first = segments[0];
            first.loc.col += prefixLength;
            segments[0] = { type: CodeText, text: first.text.substr(prefixLength), loc: first.loc };
            return { type: EmbeddedCode, segments: segments };
        }
        function balancedParens(segments, text, loc, flags) {
            var start = LOC(), end = PARENS();
            if (end === undefined)
                ERR("not in parentheses");
            text += TOK, NEXT();
            while (!EOF && NOT(end)) {
                if (IS("'") || IS('"')) {
                    if (flags)
                        flags.hasContent = true;
                    text += quotedString();
                }
                else if (IS('`')) {
                    if (flags)
                        flags.hasContent = true;
                    text = templateLiteral(segments, text, loc);
                }
                else if (IS('//')) {
                    text += codeSingleLineComment();
                }
                else if (IS('/*')) {
                    text += codeMultiLineComment();
                }
                else if (IS("<")) {
                    if (flags)
                        flags.hasContent = true;
                    if (text)
                        segments.push({ type: CodeText, text: text, loc: { line: loc.line, col: loc.col, pos: loc.pos } });
                    text = "";
                    segments.push(jsxElement());
                    loc.line = LINE;
                    loc.col = COL;
                    loc.pos = POS;
                }
                else if (PARENS()) {
                    if (flags)
                        flags.hasContent = true;
                    text = balancedParens(segments, text, loc, flags);
                }
                else {
                    if (flags)
                        flags.hasContent = flags.hasContent || rx.hasNonWs.test(TOK);
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
                if (IS('$') && !rx.stringEscapedEnd.test(text)) {
                    text += TOK, NEXT();
                    if (IS('{')) {
                        text = balancedParens(segments, text, loc);
                    }
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
                if (IS('//'))
                    codeSingleLineComment();
                else if (IS('/*'))
                    codeMultiLineComment();
                else if (IS('\n'))
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

    var rx$1 = {
        locs: /(\n)|(\u0000(\d+),(\d+)\u0000)/g
    }, vlqFinalDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef", vlqContinuationDigits = "ghijklmnopqrstuvwxyz0123456789+/";
    function locationMark(loc) {
        return "\u0000" + loc.line + "," + loc.col + "\u0000";
    }
    function extractMappings(embedded) {
        var line = [], lines = [], lastGeneratedCol = 0, lastSourceLine = 0, lastSourceCol = 0, lineStartPos = 0, lineMarksLength = 0;
        var src = embedded.replace(rx$1.locs, function (_, nl, mark, sourceLine, sourceCol, offset) {
            if (nl) {
                lines.push(line);
                line = [];
                lineStartPos = offset + 1;
                lineMarksLength = 0;
                lastGeneratedCol = 0;
                return nl;
            }
            else {
                var generatedCol = offset - lineStartPos - lineMarksLength, sourceLineNum = parseInt(sourceLine, 10), sourceColNum = parseInt(sourceCol, 10);
                line.push(vlq(generatedCol - lastGeneratedCol)
                    + "A" // only one file
                    + vlq(sourceLineNum - lastSourceLine)
                    + vlq(sourceColNum - lastSourceCol));
                lineMarksLength += mark.length;
                lastGeneratedCol = generatedCol;
                lastSourceLine = sourceLineNum;
                lastSourceCol = sourceColNum;
                return "";
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

    var 
    // pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
    htmlFieldCache = {
        // special props
        style: ['style', null, 3 /* Assign */],
        ref: ['ref', null, 2 /* Ignore */],
        fn: ['fn', null, 2 /* Ignore */],
        // attr compat
        class: ['className', null, 0 /* Property */],
        for: ['htmlFor', null, 0 /* Property */],
        "accept-charset": ['acceptCharset', null, 0 /* Property */],
        "http-equiv": ['httpEquiv', null, 0 /* Property */],
        // a few React oddities, mostly disagreeing about casing
        onDoubleClick: ['ondblclick', null, 0 /* Property */],
        spellCheck: ['spellcheck', null, 0 /* Property */],
        allowFullScreen: ['allowFullscreen', null, 0 /* Property */],
        autoCapitalize: ['autocapitalize', null, 0 /* Property */],
        autoFocus: ['autofocus', null, 0 /* Property */],
        autoPlay: ['autoplay', null, 0 /* Property */],
        // other
        // role is part of the ARIA spec but not caught by the aria- attr filter
        role: ['role', null, 1 /* Attribute */]
    }, svgFieldCache = {
        // special props
        style: ['style', null, 3 /* Assign */],
        ref: ['ref', null, 2 /* Ignore */],
        fn: ['fn', null, 2 /* Ignore */],
        // property compat
        className: ['class', null, 1 /* Attribute */],
        htmlFor: ['for', null, 1 /* Attribute */],
        tabIndex: ['tabindex', null, 1 /* Attribute */],
        // React compat
        onDoubleClick: ['ondblclick', null, 0 /* Property */],
        // attributes with eccentric casing - some SVG attrs are snake-cased, some camelCased
        allowReorder: ['allowReorder', null, 1 /* Attribute */],
        attributeName: ['attributeName', null, 1 /* Attribute */],
        attributeType: ['attributeType', null, 1 /* Attribute */],
        autoReverse: ['autoReverse', null, 1 /* Attribute */],
        baseFrequency: ['baseFrequency', null, 1 /* Attribute */],
        calcMode: ['calcMode', null, 1 /* Attribute */],
        clipPathUnits: ['clipPathUnits', null, 1 /* Attribute */],
        contentScriptType: ['contentScriptType', null, 1 /* Attribute */],
        contentStyleType: ['contentStyleType', null, 1 /* Attribute */],
        diffuseConstant: ['diffuseConstant', null, 1 /* Attribute */],
        edgeMode: ['edgeMode', null, 1 /* Attribute */],
        externalResourcesRequired: ['externalResourcesRequired', null, 1 /* Attribute */],
        filterRes: ['filterRes', null, 1 /* Attribute */],
        filterUnits: ['filterUnits', null, 1 /* Attribute */],
        gradientTransform: ['gradientTransform', null, 1 /* Attribute */],
        gradientUnits: ['gradientUnits', null, 1 /* Attribute */],
        kernelMatrix: ['kernelMatrix', null, 1 /* Attribute */],
        kernelUnitLength: ['kernelUnitLength', null, 1 /* Attribute */],
        keyPoints: ['keyPoints', null, 1 /* Attribute */],
        keySplines: ['keySplines', null, 1 /* Attribute */],
        keyTimes: ['keyTimes', null, 1 /* Attribute */],
        lengthAdjust: ['lengthAdjust', null, 1 /* Attribute */],
        limitingConeAngle: ['limitingConeAngle', null, 1 /* Attribute */],
        markerHeight: ['markerHeight', null, 1 /* Attribute */],
        markerUnits: ['markerUnits', null, 1 /* Attribute */],
        maskContentUnits: ['maskContentUnits', null, 1 /* Attribute */],
        maskUnits: ['maskUnits', null, 1 /* Attribute */],
        numOctaves: ['numOctaves', null, 1 /* Attribute */],
        pathLength: ['pathLength', null, 1 /* Attribute */],
        patternContentUnits: ['patternContentUnits', null, 1 /* Attribute */],
        patternTransform: ['patternTransform', null, 1 /* Attribute */],
        patternUnits: ['patternUnits', null, 1 /* Attribute */],
        pointsAtX: ['pointsAtX', null, 1 /* Attribute */],
        pointsAtY: ['pointsAtY', null, 1 /* Attribute */],
        pointsAtZ: ['pointsAtZ', null, 1 /* Attribute */],
        preserveAlpha: ['preserveAlpha', null, 1 /* Attribute */],
        preserveAspectRatio: ['preserveAspectRatio', null, 1 /* Attribute */],
        primitiveUnits: ['primitiveUnits', null, 1 /* Attribute */],
        refX: ['refX', null, 1 /* Attribute */],
        refY: ['refY', null, 1 /* Attribute */],
        repeatCount: ['repeatCount', null, 1 /* Attribute */],
        repeatDur: ['repeatDur', null, 1 /* Attribute */],
        requiredExtensions: ['requiredExtensions', null, 1 /* Attribute */],
        requiredFeatures: ['requiredFeatures', null, 1 /* Attribute */],
        specularConstant: ['specularConstant', null, 1 /* Attribute */],
        specularExponent: ['specularExponent', null, 1 /* Attribute */],
        spreadMethod: ['spreadMethod', null, 1 /* Attribute */],
        startOffset: ['startOffset', null, 1 /* Attribute */],
        stdDeviation: ['stdDeviation', null, 1 /* Attribute */],
        stitchTiles: ['stitchTiles', null, 1 /* Attribute */],
        surfaceScale: ['surfaceScale', null, 1 /* Attribute */],
        systemLanguage: ['systemLanguage', null, 1 /* Attribute */],
        tableValues: ['tableValues', null, 1 /* Attribute */],
        targetX: ['targetX', null, 1 /* Attribute */],
        targetY: ['targetY', null, 1 /* Attribute */],
        textLength: ['textLength', null, 1 /* Attribute */],
        viewBox: ['viewBox', null, 1 /* Attribute */],
        viewTarget: ['viewTarget', null, 1 /* Attribute */],
        xChannelSelector: ['xChannelSelector', null, 1 /* Attribute */],
        yChannelSelector: ['yChannelSelector', null, 1 /* Attribute */],
        zoomAndPan: ['zoomAndPan', null, 1 /* Attribute */],
    };
    var attributeOnlyRx = /-/, deepAttrRx = /^style-/, isAttrOnlyField = function (field) { return attributeOnlyRx.test(field) && !deepAttrRx.test(field); }, propOnlyRx = /^(on|style)/, isPropOnlyField = function (field) { return propOnlyRx.test(field); }, propPartRx = /[a-z][A-Z]/g, getAttrName = function (field) { return field.replace(propPartRx, function (m) { return m[0] + '-' + m[1]; }).toLowerCase(); }, jsxEventPropRx = /^on[A-Z]/, attrPartRx = /\-(?:[a-z]|$)/g, getPropName = function (field) {
        var prop = field.replace(attrPartRx, function (m) { return m.length === 1 ? '' : m[1].toUpperCase(); });
        return jsxEventPropRx.test(prop) ? prop.toLowerCase() : prop;
    }, deepPropRx = /^(style)([A-Z])/, buildPropData = function (prop) {
        var m = deepPropRx.exec(prop);
        return m ? [m[2].toLowerCase() + prop.substr(m[0].length), m[1], 0 /* Property */] : [prop, null, 0 /* Property */];
    }, attrNamespaces = {
        xlink: "http://www.w3.org/1999/xlink",
        xml: "http://www.w3.org/XML/1998/namespace",
    }, attrNamespaceRx = new RegExp("^(" + Object.keys(attrNamespaces).join('|') + ")-(.*)"), buildAttrData = function (attr) {
        var m = attrNamespaceRx.exec(attr);
        return m ? [m[2], attrNamespaces[m[1]], 1 /* Attribute */] : [attr, null, 1 /* Attribute */];
    };
    var getFieldData = function (field, svg) {
        var cache = svg ? svgFieldCache : htmlFieldCache, cached = cache[field];
        if (cached)
            return cached;
        var attr = svg && !isPropOnlyField(field)
            || !svg && isAttrOnlyField(field), name = attr ? getAttrName(field) : getPropName(field);
        if (name !== field && (cached = cache[name]))
            return cached;
        var data = attr ? buildAttrData(name) : buildPropData(name);
        return cache[field] = data;
    };

    var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
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
        nonIdChars: /[^a-zA-Z0-9]/g,
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
            return node.type === CodeText ? compileCodeText(node) : compileJSXElement(node, indent(previousCode));
        }, compileCodeText = function (node) {
            return markBlockLocs(node.text, node.loc, opts);
        }, compileJSXElement = function (node, indent) {
            var code = node.kind === JSXElementKind.SubComponent
                ? compileSubComponent(node, indent)
                : compileHtmlElement(node, indent);
            return markLoc(code, node.loc, opts);
        }, compileSubComponent = function (node, indent) {
            return emitSubComponent(buildSubComponent(node), indent);
        }, compileHtmlElement = function (node, indent) {
            var svg = node.kind === JSXElementKind.SVG;
            return (
            // optimization: don't need IIFE for simple single nodes
            (node.fields.length === 0 && node.functions.length === 0 && node.content.length === 0) ?
                node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                    + ("Surplus.create" + (svg ? 'Svg' : '') + "Element('" + node.tag + "', null, null)") :
                // optimization: don't need IIFE for simple single nodes with a single class attribute
                (node.fields.length === 1
                    && isStaticClassField(node.fields[0], svg)
                    && node.functions.length === 0
                    && node.content.length === 0) ?
                    node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                        + ("Surplus.create" + (svg ? 'Svg' : '') + "Element(" + codeStr(node.tag) + ", " + node.fields[0].value + ", null)") :
                    emitDOMExpression(buildDOMExpression(node), indent));
        }, buildSubComponent = function (node) {
            var refs = node.references.map(function (r) { return compileSegments(r.code); }), fns = node.functions.map(function (r) { return compileSegments(r.code); }), 
            // group successive properties into property objects, but spreads stand alone
            // e.g. a="1" b={foo} {...spread} c="3" gets combined into [{a: "1", b: foo}, spread, {c: "3"}]
            properties = node.fields.reduce(function (props, p) {
                var _a;
                var lastSegment = props.length > 0 ? props[props.length - 1] : null, value = p.type === JSXStaticField ? p.value : compileSegments(p.code);
                if (p.type === JSXSpread) {
                    props.push(value);
                }
                else if (lastSegment === null
                    || typeof lastSegment === 'string'
                    || (p.type === JSXStyleProperty && lastSegment["style"])) {
                    props.push((_a = {}, _a[p.name] = value, _a));
                }
                else {
                    lastSegment[p.name] = value;
                }
                return props;
            }, []), children = node.content.map(function (c) {
                return c.type === JSXElement ? compileJSXElement(c, indent("")) :
                    c.type === JSXText ? codeStr(c.text) :
                        c.type === JSXInsert ? compileSegments(c.code) :
                            "document.createComment(" + codeStr(c.text) + ")";
            });
            return new SubComponent(node.tag, refs, fns, properties, children, node.loc);
        }, emitSubComponent = function (sub, indent) {
            var nl = indent.nl, nli = indent.nli, nlii = indent.nlii;
            // build properties expression
            var 
            // convert children to an array expression
            children = sub.children.length === 0 ? null :
                sub.children.length === 1 ? sub.children[0] :
                    '[' + nlii
                        + sub.children.join(',' + nlii) + nli
                        + ']', lastProperty = sub.properties.length === 0 ? null : sub.properties[sub.properties.length - 1], 
            // if there are any children, add them to (or add a) last object
            propertiesWithChildren = children === null ? sub.properties :
                lastProperty === null || typeof lastProperty === 'string' ? sub.properties.concat([{ children: children }]) : sub.properties.slice(0, sub.properties.length - 1).concat([__assign({}, lastProperty, { children: children })]), 
            // if we're going to be Object.assign'ing to the first object, it needs to be one we made, not a spread
            propertiesWithInitialObject = propertiesWithChildren.length === 0 || (propertiesWithChildren.length > 1 && typeof propertiesWithChildren[0] === 'string')
                ? [{}].concat(propertiesWithChildren) : propertiesWithChildren, propertyExprs = propertiesWithInitialObject.map(function (obj) {
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
            var buildHtmlElement = function (node, parent, n) {
                var tag = node.tag, fields = node.fields, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
                if (node.kind === JSXElementKind.SubComponent) {
                    buildInsertedSubComponent(node, parent, n);
                }
                else {
                    var id_1 = addId(parent, tag, n), svg_1 = node.kind === JSXElementKind.SVG, fieldExprs_1 = fields.map(function (p) { return p.type === JSXStaticField ? '' : compileSegments(p.code); }), spreads_1 = fields.filter(function (p) { return p.type === JSXSpread || p.type === JSXStyleProperty; }), classField_1 = spreads_1.length === 0 && fields.filter(function (p) { return isStaticClassField(p, svg_1); })[0] || null, fieldsDynamic_1 = fieldExprs_1.some(function (e) { return !noApparentSignals(e); }), fieldStmts = fields.map(function (f, i) {
                        return f === classField_1 ? '' :
                            f.type === JSXStaticField ? buildField(id_1, f, f.value, node) :
                                f.type === JSXDynamicField ? buildField(id_1, f, fieldExprs_1[i], node) :
                                    f.type === JSXStyleProperty ? buildStyle(f, id_1, fieldExprs_1[i], fieldsDynamic_1, spreads_1) :
                                        buildSpread(id_1, fieldExprs_1[i], svg_1);
                    }).filter(function (s) { return s !== ''; }), refStmts = references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('');
                    addStatement(id_1 + " = " + refStmts + "Surplus.create" + (svg_1 ? 'Svg' : '') + "Element(" + codeStr(tag) + ", " + (classField_1 && classField_1.value) + ", " + (parent || null) + ");");
                    if (!fieldsDynamic_1) {
                        fieldStmts.forEach(addStatement);
                    }
                    if (content.length === 1 && content[0].type === JSXInsert) {
                        buildJSXContent(content[0], id_1);
                    }
                    else {
                        content.forEach(function (c, i) { return buildChild(c, id_1, i); });
                    }
                    if (fieldsDynamic_1) {
                        addComputation(fieldStmts, null, null, loc);
                    }
                    functions.forEach(function (f) { return buildNodeFn(f, id_1); });
                }
            }, buildField = function (id, field, expr, parent) {
                var _a = getFieldData(field.name, parent.kind === JSXElementKind.SVG), name = _a[0], namespace = _a[1], flags = _a[2], type = flags & 3 /* Type */;
                return (type === 0 /* Property */ ? buildProperty(id, name, namespace, expr) :
                    type === 1 /* Attribute */ ? buildAttribute(id, name, namespace, expr) :
                        '');
            }, buildProperty = function (id, name, namespace, expr) {
                return namespace ? id + "." + namespace + "." + name + " = " + expr + ";" : id + "." + name + " = " + expr + ";";
            }, buildAttribute = function (id, name, namespace, expr) {
                return namespace ? "Surplus.setAttributeNS(" + id + ", " + codeStr(namespace) + ", " + codeStr(name) + ", " + expr + ");" :
                    "Surplus.setAttribute(" + id + ", " + codeStr(name) + ", " + expr + ");";
            }, buildSpread = function (id, expr, svg) {
                return "Surplus.spread(" + id + ", " + expr + ", " + svg + ");";
            }, buildNodeFn = function (node, id) {
                var expr = compileSegments(node.code);
                addComputation(["(" + expr + ")(" + id + ", __state);"], '__state', null, node.loc);
            }, buildStyle = function (node, id, expr, dynamic, spreads) {
                return "Surplus.assign(" + id + ".style, " + expr + ");";
            }, buildChild = function (node, parent, n) {
                return node.type === JSXElement ? buildHtmlElement(node, parent, n) :
                    node.type === JSXComment ? buildHtmlComment(node, parent) :
                        node.type === JSXText ? buildJSXText(node, parent, n) :
                            buildJSXInsert(node, parent, n);
            }, buildInsertedSubComponent = function (node, parent, n) {
                return buildJSXInsert({ type: JSXInsert, code: { type: EmbeddedCode, segments: [node] }, loc: node.loc }, parent, n);
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
            buildHtmlElement(top, '', 0);
            return new DOMExpression(ids, statements, computations);
        }, emitDOMExpression = function (code, indent) {
            var nl = indent.nl, nli = indent.nli, nlii = indent.nlii;
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
            var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nli), code = "Surplus.S.effect(function (" + (stateVar || '') + ") {" + body + "}" + (seed !== null ? ", " + seed : '') + ");";
            return markLoc(code, loc, opts);
        };
        return compileSegments(ctl);
    };
    var isStaticClassField = function (p, svg) {
        return p.type === JSXStaticField && getFieldData(p.name, svg)[0] === (svg ? 'class' : 'className');
    }, noApparentSignals = function (code) {
        return !rx$2.hasParen.test(code) || (rx$2.loneFunction.test(code) && !rx$2.endsInParen.test(code));
    }, indent = function (previousCode) {
        var m = rx$2.indent.exec(previousCode), pad = m ? m[1] : '', nl = "\r\n" + pad, nli = nl + '    ', nlii = nli + '    ';
        return { nl: nl, nli: nli, nlii: nlii };
    }, codeStr = function (str) {
        return '"' +
            str.replace(rx$2.backslashes, "\\\\")
                .replace(rx$2.doubleQuotes, "\\\"")
                .replace(rx$2.newlines, "\\n") +
            '"';
    };
    var markLoc = function (str, loc, opts) {
        return opts.sourcemap ? locationMark(loc) + str : str;
    }, markBlockLocs = function (str, loc, opts) {
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

    // Reference information for the HTML and SVG DOM
    var htmlTags = [
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
    ], htmlTagRx = new RegExp("^(" + htmlTags.join("|") + ")$"), svgTags = [
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
    ], svgOnlyTags = svgTags.filter(function (t) { return !htmlTagRx.test(t); }), svgOnlyTagRx = new RegExp("^(" + svgOnlyTags.join("|") + ")$"), svgForeignTag = "foreignObject", htmlEntites = {
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

    var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    var rx$3 = {
        trimmableWS: /^\s*?\n\s*|\s*?\n\s*$/g,
        extraWs: /\s\s+/g,
        htmlEntity: /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g,
        subcomponent: /(^[A-Z])|\./
    };
    // a Copy transform, for building non-identity transforms on top of
    var Copy = {
        Program: function (node) {
            return { type: Program, segments: this.CodeSegments(node.segments) };
        },
        CodeSegments: function (segments) {
            var _this = this;
            return segments.map(function (node) {
                return node.type === CodeText ? _this.CodeText(node) :
                    _this.JSXElement(node, null);
            });
        },
        EmbeddedCode: function (node) {
            return { type: EmbeddedCode, segments: this.CodeSegments(node.segments) };
        },
        JSXElement: function (node, parent) {
            var _this = this;
            return __assign$1({}, node, { fields: node.fields.map(function (p) { return _this.JSXField(p, node); }), references: node.references.map(function (r) { return _this.JSXReference(r); }), functions: node.functions.map(function (f) { return _this.JSXFunction(f); }), content: node.content.map(function (c) { return _this.JSXContent(c, node); }) });
        },
        JSXField: function (node, parent) {
            return node.type === JSXStaticField ? this.JSXStaticField(node, parent) :
                node.type === JSXDynamicField ? this.JSXDynamicField(node, parent) :
                    node.type === JSXStyleProperty ? this.JSXStyleProperty(node) :
                        this.JSXSpreadProperty(node);
        },
        JSXContent: function (node, parent) {
            return node.type === JSXComment ? this.JSXComment(node) :
                node.type === JSXText ? this.JSXText(node) :
                    node.type === JSXInsert ? this.JSXInsert(node) :
                        this.JSXElement(node, parent);
        },
        JSXInsert: function (node) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        },
        CodeText: function (node) { return node; },
        JSXText: function (node) { return node; },
        JSXComment: function (node) { return node; },
        JSXStaticField: function (node, parent) { return node; },
        JSXDynamicField: function (node, parent) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        },
        JSXSpreadProperty: function (node) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        },
        JSXStyleProperty: function (node) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        },
        JSXReference: function (node) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        },
        JSXFunction: function (node) {
            return __assign$1({}, node, { code: this.EmbeddedCode(node.code) });
        }
    };
    var tf = [
        // active transforms, in order from first to last applied
        determineElementRole,
        trimTextNodes,
        collapseExtraWhitespaceInTextNodes,
        removeEmptyTextNodes,
        translateHTMLEntitiesToUnicodeInTextNodes,
        promoteTextOnlyContentsToTextContentProperties
    ].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
    var transform = function (node, opt) { return tf.Program(node); };
    function determineElementRole(tx) {
        return __assign$1({}, tx, { JSXElement: function (node, parent) {
                var kind = rx$3.subcomponent.test(node.tag) ? JSXElementKind.SubComponent :
                    svgOnlyTagRx.test(node.tag) ? JSXElementKind.SVG :
                        parent && parent.kind === JSXElementKind.SVG && parent.tag !== svgForeignTag ? JSXElementKind.SVG :
                            JSXElementKind.HTML;
                return tx.JSXElement.call(this, __assign$1({}, node, { kind: kind }), parent);
            } });
    }
    function trimTextNodes(tx) {
        return __assign$1({}, tx, { JSXElement: function (node, parent) {
                if (node.tag !== 'pre') {
                    // trim start and end whitespace in text nodes
                    var content = node.content.map(function (c) {
                        return c.type === JSXText ? __assign$1({}, c, { text: c.text.replace(rx$3.trimmableWS, '') }) : c;
                    });
                    node = __assign$1({}, node, { content: content });
                }
                return tx.JSXElement.call(this, node, parent);
            } });
    }
    function collapseExtraWhitespaceInTextNodes(tx) {
        return __assign$1({}, tx, { JSXElement: function (node, parent) {
                if (node.tag !== 'pre') {
                    var content = node.content.map(function (c) {
                        return c.type === JSXText
                            ? __assign$1({}, c, { text: c.text.replace(rx$3.extraWs, ' ') }) : c;
                    });
                    node = __assign$1({}, node, { content: content });
                }
                return tx.JSXElement.call(this, node, parent);
            } });
    }
    function removeEmptyTextNodes(tx) {
        return __assign$1({}, tx, { JSXElement: function (node, parent) {
                var content = node.content.filter(function (c) { return c.type !== JSXText || c.text !== ''; });
                node = __assign$1({}, node, { content: content });
                return tx.JSXElement.call(this, node, parent);
            } });
    }
    function translateHTMLEntitiesToUnicodeInTextNodes(tx) {
        return __assign$1({}, tx, { JSXText: function (node) {
                var text = node.text.replace(rx$3.htmlEntity, function (entity, dec, hex, named) {
                    return dec ? String.fromCharCode(parseInt(dec, 10)) :
                        hex ? String.fromCharCode(parseInt(hex, 16)) :
                            htmlEntites[named] ||
                                entity;
                });
                if (text !== node.text)
                    node = __assign$1({}, node, { text: text });
                return tx.JSXText.call(this, node);
            } });
    }
    function promoteTextOnlyContentsToTextContentProperties(tx) {
        return __assign$1({}, tx, { JSXElement: function (node, parent) {
                var content0 = node.content[0];
                if (node.kind === JSXElementKind.HTML && node.content.length === 1 && content0.type === JSXText) {
                    var text = this.JSXText(content0), textContent = { type: JSXStaticField, name: "textContent", attr: false, namespace: null, value: codeStr(text.text) };
                    node = __assign$1({}, node, { fields: node.fields.concat([textContent]), content: [] });
                }
                return tx.JSXElement.call(this, node, parent);
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
