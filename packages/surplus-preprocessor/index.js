(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SurplusPreprocessor = global.SurplusPreprocessor || {})));
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
/// //
/// \n
/// /*
/// */
/// misc (any string not containing one of the above)
// pre-compiled regular expressions
var rx = {
    tokens: /<\/?(?=\w)|\/?>|<!--|-->|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|\/\/|\n|\/\*|\*\/|(?:[^<>@=\/@=()[\]{}"'\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g,
};
function tokenize(str, opts) {
    var toks = str.match(rx.tokens);
    return toks || [];
}

var Program = (function () {
    function Program(segments) {
        this.segments = segments;
    }
    return Program;
}());
var CodeText = (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
    }
    return CodeText;
}());
var EmbeddedCode = (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
    }
    return EmbeddedCode;
}());
var JSXElement = (function () {
    function JSXElement(tag, properties, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.content = content;
        this.loc = loc;
        this.isHTML = JSXElement.domTag.test(this.tag);
    }
    JSXElement.domTag = /^[a-z][^\.]*$/;
    return JSXElement;
}());
var JSXText = (function () {
    function JSXText(text) {
        this.text = text;
    }
    return JSXText;
}());
var JSXComment = (function () {
    function JSXComment(text) {
        this.text = text;
    }
    return JSXComment;
}());
var JSXInsert = (function () {
    function JSXInsert(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return JSXInsert;
}());
var JSXStaticProperty = (function () {
    function JSXStaticProperty(name, value) {
        this.name = name;
        this.value = value;
    }
    return JSXStaticProperty;
}());
var JSXDynamicProperty = (function () {
    function JSXDynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
    }
    return JSXDynamicProperty;
}());
var JSXSpreadProperty = (function () {
    function JSXSpreadProperty(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return JSXSpreadProperty;
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
                _this.JSXElement(node);
        });
    },
    EmbeddedCode: function (node) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement: function (node) {
        var _this = this;
        return new JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p); }), node.content.map(function (c) { return _this.JSXContent(c); }), node.loc);
    },
    JSXProperty: function (node) {
        return node instanceof JSXStaticProperty ? this.JSXStaticProperty(node) :
            node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
                this.JSXSpreadProperty(node);
    },
    JSXContent: function (node) {
        return node instanceof JSXComment ? this.JSXComment(node) :
            node instanceof JSXText ? this.JSXText(node) :
                node instanceof JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node);
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
    }
};

// pre-compiled regular expressions
var rx$1 = {
    identifier: /^[a-zA-Z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)*/,
    stringEscapedEnd: /[^\\](\\\\)*\\$/,
    leadingWs: /^\s+/
};
var parens = {
    "(": ")",
    "[": "]",
    "{": "}",
    "{...": "}"
};

function parse(TOKS, opts) {
    var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
    return codeTopLevel();
    function codeTopLevel() {
        var segments = [], text = "", loc = LOC();
        while (!EOF) {
            if (IS('<')) {
                if (text)
                    segments.push(new CodeText(text, loc));
                text = "";
                segments.push(htmlElement());
                loc = LOC();
            }
            else if (IS('"') || IS("'")) {
                text += quotedString();
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
    function htmlElement() {
        if (NOT('<'))
            ERR("not at start of html element");
        var start = LOC(), tag = "", properties = [], content = [], hasContent = true;
        NEXT(); // pass '<'
        tag = SPLIT(rx$1.identifier);
        if (!tag)
            ERR("bad element name", start);
        SKIPWS();
        // scan for properties until end of opening tag
        while (!EOF && NOT('>') && NOT('/>')) {
            if (MATCH(rx$1.identifier)) {
                properties.push(property());
            }
            else if (IS('{...')) {
                properties.push(spread());
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
                    content.push(htmlElement());
                }
                else if (IS('{')) {
                    content.push(htmlInsert());
                }
                else if (IS('<!--')) {
                    content.push(htmlComment());
                }
                else {
                    content.push(htmlText());
                }
            }
            if (EOF)
                ERR("element missing close tag", start);
            NEXT(); // pass '</'
            if (tag !== SPLIT(rx$1.identifier))
                ERR("mismatched open and close tags", start);
            if (NOT('>'))
                ERR("malformed close tag");
            NEXT(); // pass '>'
        }
        return new JSXElement(tag, properties, content, start);
    }
    function htmlText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && NOT('{') && NOT('</')) {
            text += TOK, NEXT();
        }
        return new JSXText(text);
    }
    function htmlComment() {
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
    function htmlInsert() {
        var loc = LOC();
        return new JSXInsert(embeddedCode(), loc);
    }
    function property() {
        if (!MATCH(rx$1.identifier))
            ERR("not at start of property declaration");
        var loc = LOC(), name = SPLIT(rx$1.identifier), code;
        SKIPWS(); // pass name
        if (IS('=')) {
            NEXT(); // pass '='
            SKIPWS();
            if (IS('"') || IS("'")) {
                return new JSXStaticProperty(name, quotedString());
            }
            else if (IS('{')) {
                return new JSXDynamicProperty(name, embeddedCode(), loc);
            }
            else {
                return ERR("unexepected value for JSX property");
            }
        }
        else {
            return new JSXStaticProperty(name, "true");
        }
    }
    function spread() {
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
                segments.push(htmlElement());
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
    function quotedString() {
        if (NOT("'") && NOT('"'))
            ERR("not in quoted string");
        var start = LOC(), quote, text;
        quote = text = TOK, NEXT();
        while (!EOF && (NOT(quote) || rx$1.stringEscapedEnd.test(text))) {
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
            else if (MATCHES(rx$1.leadingWs))
                SPLIT(rx$1.leadingWs);
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

var rx$4 = {
    locs: /(\n)|(\u0000(\d+),(\d+)\u0000)/g
};
var vlqFinalDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
var vlqContinuationDigits = "ghijklmnopqrstuvwxyz0123456789+/";
function locationMark(loc) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}
function extractMappings(embedded) {
    var line = [], lines = [], lastGeneratedCol = 0, lastSourceLine = 0, lastSourceCol = 0, lineStartPos = 0, lineMarksLength = 0;
    var src = embedded.replace(rx$4.locs, function (_, nl, mark, sourceLine, sourceCol, offset) {
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

// pre-compiled regular expressions
var rx$3 = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen: /\)\s*$/,
    nonIdChars: /[^a-zA-Z0-9]/,
    singleQuotes: /'/g,
    attribute: /-/,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
var DOMExpression = (function () {
    function DOMExpression(ids, statements, computations) {
        this.ids = ids;
        this.statements = statements;
        this.computations = computations;
    }
    return DOMExpression;
}());
var Computation = (function () {
    function Computation(statements, loc, stateVar, seed) {
        this.statements = statements;
        this.loc = loc;
        this.stateVar = stateVar;
        this.seed = seed;
    }
    return Computation;
}());
var SubComponent = (function () {
    function SubComponent(name, properties, children) {
        this.name = name;
        this.properties = properties;
        this.children = children;
    }
    return SubComponent;
}());
var compile = function (ctl, opts) {
    var compileSegments = function (node) {
        return node.segments.reduce(function (res, s) { return res + compileSegment(s, res); }, "");
    }, compileSegment = function (node, previousCode) {
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode));
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, indent) {
        var code = !node.isHTML ?
            emitSubComponent(buildSubComponent(node), indent) :
            (node.properties.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                "Surplus.createElement('" + node.tag + "', null, null)" :
                (node.properties.length === 1
                    && node.properties[0] instanceof JSXStaticProperty
                    && node.properties[0].name === "className"
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    "Surplus.createElement('" + node.tag + "', " + node.properties[0].value + ", null)" :
                    emitDOMExpression(buildDOMExpression(node), indent);
        return markLoc(code, node.loc, opts);
    }, buildSubComponent = function (node) {
        var 
        // group successive properties into property objects, but mixins stand alone
        // e.g. a="1" b={foo} {...mixin} c="3" gets combined into [{a: "1", b: foo}, mixin, {c: "3"}]
        properties = node.properties.reduce(function (props, p) {
            var lastSegment = props[props.length - 1], value = p instanceof JSXStaticProperty ? p.value : compileSegments(p.code);
            if (p instanceof JSXSpreadProperty)
                props.push(value);
            else if (props.length === 0 || typeof lastSegment === 'string')
                props.push((_a = {}, _a[p.name] = value, _a));
            else
                lastSegment[p.name] = value;
            return props;
            var _a;
        }, []), children = node.content.map(function (c) {
            return c instanceof JSXElement ? compileHtmlElement(c, "") :
                c instanceof JSXText ? codeStr(c.text.trim()) :
                    c instanceof JSXInsert ? compileSegments(c.code) :
                        "document.createComment(" + codeStr(c.text) + ")";
        });
        return new SubComponent(node.tag, properties, children);
    }, emitSubComponent = function (expr, indent) {
        var nl = "\r\n" + indent, nli = nl + '    ', nlii = nli + '    ', 
        // convert children to an array expression
        children = expr.children.length === 0 ? '[]' : '[' + nlii
            + expr.children.join(',' + nlii) + nli
            + ']', properties0 = expr.properties[0];
        // add children property to first property object (creating one if needed)
        // this has the double purpose of creating the children property and making sure
        // that the first property group is not a mixin and can therefore be used as a base for extending
        if (properties0 === undefined || typeof properties0 === 'string')
            expr.properties.unshift({ children: children });
        else
            properties0['children'] = children;
        // convert property objects to object expressions
        var properties = expr.properties.map(function (obj) {
            return typeof obj === 'string' ? obj :
                '{' + Object.keys(obj).map(function (p) { return "" + nli + p + ": " + obj[p]; }).join(',') + nl + '}';
        });
        // join multiple object expressions using Object.assign()
        var needLibrary = expr.properties.length > 1 || typeof expr.properties[0] === 'string';
        return needLibrary ? "Surplus.subcomponent(" + expr.name + ", [" + properties.join(', ') + "])"
            : expr.name + "(" + properties[0] + ")";
    }, buildDOMExpression = function (top) {
        var ids = [], statements = [], computations = [];
        var buildHtmlElement = function (node, parent, n) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (!node.isHTML) {
                buildInsertedSubComponent(node, parent, n);
            }
            else {
                var id_1 = addId(parent, tag, n), exprs_1 = properties.map(function (p) { return p instanceof JSXStaticProperty ? '' : compileSegments(p.code); }), hasMixins = properties.some(function (p) { return p instanceof JSXSpreadProperty; }), classProp_1 = !hasMixins && properties.filter(function (p) { return p instanceof JSXStaticProperty && p.name === 'className'; })[0] || null, dynamic = hasMixins || exprs_1.some(function (e) { return !noApparentSignals(e); }), stmts = properties.map(function (p, i) {
                    return p === classProp_1 ? '' :
                        p instanceof JSXStaticProperty ? buildStaticProperty(p, id_1) :
                            p instanceof JSXDynamicProperty ? buildDynamicProperty(p, id_1, exprs_1[i]) :
                                buildSpread(p, id_1, n, exprs_1[i]);
                }).filter(function (s) { return s !== ''; });
                addStatement(id_1 + " = Surplus.createElement('" + tag + "', " + (classProp_1 && classProp_1.value) + ", " + (parent || 'null') + ");");
                if (!dynamic) {
                    stmts.forEach(addStatement);
                }
                content.forEach(function (c, i) { return buildChild(c, id_1, i); });
                if (dynamic) {
                    if (hasMixins) {
                        // create propAges object and use it as state of our computation
                        var propAges_1 = { __current: 0 }, maxAge_1 = 1 << 31 - 1;
                        properties.forEach(function (p) { return p instanceof JSXSpreadProperty || (propAges_1[p.name] = maxAge_1); });
                        stmts.unshift("__propAges.__current++;");
                        stmts.push("__propAges");
                        addComputation(stmts, "__propAges", JSON.stringify(propAges_1), loc);
                    }
                    else {
                        addComputation(stmts, null, null, loc);
                    }
                }
            }
        }, buildStaticProperty = function (node, id) {
            return buildProperty(id, node.name, node.value);
        }, buildDynamicProperty = function (node, id, expr) {
            return node.name === "ref" ? buildReference(expr, id) :
                node.name === 'S' ? buildMixin(node, id, expr) :
                    buildProperty(id, node.name, expr);
        }, buildProperty = function (id, prop, expr) {
            return isAttribute(prop)
                ? id + ".setAttribute(" + codeStr(prop) + ", " + expr + ");"
                : id + "." + prop + " = " + expr + ";";
        }, buildReference = function (ref, id) {
            return ref + " = " + id + ";";
        }, buildSpread = function (node, id, n, expr) {
            var state = addId(id, 'mixin', n);
            return state + " = Surplus.spread(" + expr + ", " + id + ", " + state + ", __propAges);";
        }, buildMixin = function (node, id, expr) {
            addComputation(["(" + expr + ")(" + id + ", __state)"], '__state', null, node.loc);
            return '';
        }, buildChild = function (node, parent, n) {
            return node instanceof JSXElement ? buildHtmlElement(node, parent, n) :
                node instanceof JSXComment ? buildHtmlComment(node, parent) :
                    node instanceof JSXText ? buildHtmlText(node, parent, n) :
                        buildHtmlInsert(node, parent, n);
        }, buildInsertedSubComponent = function (node, parent, n) {
            return buildHtmlInsert(new JSXInsert(new EmbeddedCode([node]), node.loc), parent, n);
        }, buildHtmlComment = function (node, parent) {
            return addStatement("Surplus.createComment(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlText = function (node, parent, n) {
            return addStatement("Surplus.createTextNode(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlInsert = function (node, parent, n) {
            var id = addId(parent, 'insert', n), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            addStatement(id + " = Surplus.createTextNode('', " + parent + ")");
            addComputation(["Surplus.insert(range, " + ins + ");"], "range", range, node.loc);
        }, addId = function (parent, tag, n) {
            tag = tag.replace(rx$3.nonIdChars, '_');
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
        var nl = "\r\n" + indent, nli = nl + '    ', nlii = nli + '    ';
        return '(function () {' + nli
            + 'var ' + code.ids.join(', ') + ';' + nli
            + code.statements.join(nli) + nli
            + code.computations.map(function (comp) {
                var statements = comp.statements, loc = comp.loc, stateVar = comp.stateVar, seed = comp.seed;
                if (stateVar)
                    statements[statements.length - 1] = 'return ' + statements[statements.length - 1];
                var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nlii), code = "Surplus.S(function (" + (stateVar || '') + ") {" + body + "}" + (seed ? ", " + seed : '') + ");";
                return markLoc(code, loc, opts);
            }).join(nli) + nli
            + 'return __;' + nl
            + '})()';
    };
    return compileSegments(ctl);
};
var noApparentSignals = function (code) {
    return !rx$3.hasParen.test(code) || (rx$3.loneFunction.test(code) && !rx$3.endsInParen.test(code));
};
var isAttribute = function (prop) {
    return rx$3.attribute.test(prop);
};
var indent = function (previousCode) {
    var m = rx$3.indent.exec(previousCode);
    return m ? m[1] : '';
};
var codeStr = function (str) {
    return "'" +
        str.replace(rx$3.backslashes, "\\\\")
            .replace(rx$3.singleQuotes, "\\'")
            .replace(rx$3.newlines, "\\\n") +
        "'";
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
var rx$2 = {
    ws: /^\s*$/,
    jsxEventProperty: /^on[A-Z]/
};
var tf = [
    // active transforms, in order from first to last applied
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
var transform = function (node, opt) { return tf.Program(node); };
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc, nonWhitespaceContent = content.filter(function (c) { return !(c instanceof JSXText && rx$2.ws.test(c.text)); });
            if (nonWhitespaceContent.length !== content.length) {
                node = new JSXElement(tag, properties, nonWhitespaceContent, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc, lastid = {};
            properties.forEach(function (p, i) { return p instanceof JSXSpreadProperty || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) { return p instanceof JSXSpreadProperty || lastid[p.name] === i; });
            if (properties.length !== uniqueProperties.length) {
                node = new JSXElement(tag, uniqueProperties, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (node.isHTML) {
                var nonJSXProperties = properties.map(function (p) {
                    return p instanceof JSXDynamicProperty
                        ? new JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc)
                        : p;
                });
                node = new JSXElement(tag, nonJSXProperties, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function translateJSXPropertyName(name) {
    return rx$2.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function promoteInitialTextNodesToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (node.isHTML && content.length > 0 && content[0] instanceof JSXText) {
                var textContent = new JSXStaticProperty("textContent", codeStr(content[0].text));
                node = new JSXElement(tag, properties.concat([textContent]), content.slice(1), loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}

function preprocess(str, opts) {
    opts = opts || {};
    var params = {
        sourcemap: opts.sourcemap || null,
        sourcefile: opts.sourcefile || 'in.js',
        targetfile: opts.targetfile || 'out.js',
        jsx: 'jsx' in opts ? opts.jsx : true
    };
    var toks = tokenize(str, params), ast = parse(toks, params), ast2 = transform(ast, params), code = compile(ast2, params), out = params.sourcemap === 'extract' ? extractMap(code, str, params) :
        params.sourcemap === 'append' ? appendMap(code, str, params) :
            code;
    return out;
}

exports.preprocess = preprocess;

Object.defineProperty(exports, '__esModule', { value: true });

})));
