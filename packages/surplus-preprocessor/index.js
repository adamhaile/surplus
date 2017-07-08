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
/// @
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
    tokens: /<\/?(?=\w)|\/?>|<!--|-->|@|=|\{\.\.\.|\)|\(|\[|\]|\{|\}|"|'|\/\/|\n|\/\*|\*\/|(?:[^<>@=\/@=()[\]{}"'\n*-]|(?!-->)-|\/(?![>/*])|\*(?!\/)|(?!<\/?\w|<!--)<\/?)+/g,
};
function tokenize(str, opts) {
    var toks = str.match(rx.tokens);
    return toks || [];
}

var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Context = (function () {
    function Context(node) {
        this.node = node;
    }
    Context.prototype.child = function (node) { return new Child(node, this); };
    Context.prototype.sibling = function (node, i, siblings) { return new Sibling(node, i, siblings, this); };
    return Context;
}());
var Root = (function (_super) {
    __extends(Root, _super);
    function Root() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Root;
}(Context));
var Child = (function (_super) {
    __extends(Child, _super);
    function Child(node, parent) {
        var _this = _super.call(this, node) || this;
        _this.parent = parent;
        return _this;
    }
    Child.prototype.swap = function (node) { return new Child(node, this.parent); };
    return Child;
}(Context));
var Sibling = (function (_super) {
    __extends(Sibling, _super);
    function Sibling(node, index, siblings, parent) {
        var _this = _super.call(this, node) || this;
        _this.index = index;
        _this.siblings = siblings;
        _this.parent = parent;
        return _this;
    }
    Sibling.prototype.swap = function (node) { return new Sibling(node, this.index, this.siblings, this.parent); };
    return Sibling;
}(Context));

var CodeTopLevel = (function () {
    function CodeTopLevel(segments) {
        this.segments = segments;
    }
    return CodeTopLevel;
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
var HtmlElement = (function () {
    function HtmlElement(tag, properties, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.content = content;
        this.loc = loc;
    }
    return HtmlElement;
}());
var HtmlText = (function () {
    function HtmlText(text) {
        this.text = text;
    }
    return HtmlText;
}());
var HtmlComment = (function () {
    function HtmlComment(text) {
        this.text = text;
    }
    return HtmlComment;
}());
var HtmlInsert = (function () {
    function HtmlInsert(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return HtmlInsert;
}());
var StaticProperty = (function () {
    function StaticProperty(name, value) {
        this.name = name;
        this.value = value;
    }
    return StaticProperty;
}());
var DynamicProperty = (function () {
    function DynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
    }
    return DynamicProperty;
}());
var Mixin = (function () {
    function Mixin(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return Mixin;
}());
var Copy = {
    CodeTopLevel: function (node) {
        return new CodeTopLevel(flatten(node.segments.map(this.CodeSegment(new Root(node)))));
    },
    CodeSegment: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof CodeText ? _this.CodeText(ctx.sibling(n, i, a)) :
                _this.HtmlElement(ctx.sibling(n, i, a));
        };
    },
    EmbeddedCode: function (ctx) {
        return new EmbeddedCode(flatten(ctx.node.segments.map(this.CodeSegment(ctx))));
    },
    HtmlElement: function (ctx) {
        return [new HtmlElement(ctx.node.tag, flatten(ctx.node.properties.map(this.HtmlProperty(ctx))), flatten(ctx.node.content.map(this.HtmlContent(ctx))), ctx.node.loc)];
    },
    HtmlProperty: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof StaticProperty ? _this.StaticProperty(ctx.sibling(n, i, a)) :
                n instanceof DynamicProperty ? _this.DynamicProperty(ctx.sibling(n, i, a)) :
                    _this.Mixin(ctx.sibling(n, i, a));
        };
    },
    HtmlContent: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof HtmlComment ? _this.HtmlComment(ctx.sibling(n, i, a)) :
                n instanceof HtmlText ? _this.HtmlText(ctx.sibling(n, i, a)) :
                    n instanceof HtmlInsert ? _this.HtmlInsert(ctx.sibling(n, i, a)) :
                        _this.HtmlElement(ctx.sibling(n, i, a));
        };
    },
    HtmlInsert: function (ctx) {
        return [new HtmlInsert(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    },
    CodeText: function (ctx) { return [ctx.node]; },
    HtmlText: function (ctx) { return [ctx.node]; },
    HtmlComment: function (ctx) { return [ctx.node]; },
    StaticProperty: function (ctx) { return [ctx.node]; },
    DynamicProperty: function (ctx) {
        return [new DynamicProperty(ctx.node.name, this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    },
    Mixin: function (ctx) {
        return [new Mixin(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    }
};
var flatten = function (aas) { return aas.reduce(function (as, a) { return as.concat(a); }, []); };

// pre-compiled regular expressions
var rx$1 = {
    identifier: /^[a-zA-Z]\w*/,
    stringEscapedEnd: /[^\\](\\\\)*\\$/,
    leadingWs: /^\s+/,
    codeTerminator: /^[\s<>/,;)\]}]/,
    codeContinuation: /^[^\s<>/,;)\]}]+/
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
        return new CodeTopLevel(segments);
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
            else if (!opts.jsx && IS('@')) {
                properties.push(mixin());
            }
            else if (opts.jsx && IS('{...')) {
                properties.push(jsxMixin());
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
                else if (!opts.jsx && IS('@')) {
                    content.push(htmlInsert());
                }
                else if (opts.jsx && IS('{')) {
                    content.push(jsxHtmlInsert());
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
        return new HtmlElement(tag, properties, content, start);
    }
    function htmlText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && (opts.jsx ? NOT('{') : NOT('@')) && NOT('</')) {
            text += TOK, NEXT();
        }
        return new HtmlText(text);
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
        return new HtmlComment(text);
    }
    function htmlInsert() {
        if (NOT('@'))
            ERR("not at start of code insert");
        var loc = LOC();
        NEXT(); // pass '@'
        return new HtmlInsert(embeddedCode(), loc);
    }
    function jsxHtmlInsert() {
        var loc = LOC();
        return new HtmlInsert(jsxEmbeddedCode(), loc);
    }
    function property() {
        if (!MATCH(rx$1.identifier))
            ERR("not at start of property declaration");
        var loc = LOC(), name = SPLIT(rx$1.identifier);
        SKIPWS(); // pass name
        if (NOT('='))
            ERR("expected equals sign after property name");
        NEXT(); // pass '='
        SKIPWS();
        if (IS('"') || IS("'")) {
            return new StaticProperty(name, quotedString());
        }
        else if (opts.jsx && IS('{')) {
            return new DynamicProperty(name, jsxEmbeddedCode(), loc);
        }
        else if (!opts.jsx) {
            return new DynamicProperty(name, embeddedCode(), loc);
        }
        else {
            return ERR("unexepected value for JSX property");
        }
    }
    function mixin() {
        if (NOT('@'))
            ERR("not at start of mixin");
        var loc = LOC();
        NEXT(); // pass '@'
        return new Mixin(embeddedCode(), loc);
    }
    function jsxMixin() {
        if (NOT('{...'))
            ERR("not at start of JSX mixin");
        var loc = LOC();
        return new Mixin(jsxEmbeddedCode(), loc);
    }
    function embeddedCode() {
        var start = LOC(), segments = [], text = "", loc = LOC();
        // consume source text up to the first top-level terminating character
        while (!EOF && !MATCH(rx$1.codeTerminator)) {
            if (PARENS()) {
                text = balancedParens(segments, text, loc);
            }
            else if (IS("'") || IS('"')) {
                text += quotedString();
            }
            else {
                text += SPLIT(rx$1.codeContinuation);
            }
        }
        if (text)
            segments.push(new CodeText(text, loc));
        if (segments.length === 0)
            ERR("not in embedded code", start);
        return new EmbeddedCode(segments);
    }
    function jsxEmbeddedCode() {
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
    ws: /^\s*$/
};
var transform = function (node, opt) {
    var tx = Copy;
    tx = removeWhitespaceTextNodes(tx);
    if (typeof window !== 'undefined' && window.document && window.document.createElement) {
        // browser-based shims
        if (!browserPreservesWhitespaceTextNodes())
            tx = addFEFFtoWhitespaceTextNodes(tx);
        if (!browserPreservesInitialComments())
            tx = insertTextNodeBeforeInitialComments(tx);
    }
    return tx.CodeTopLevel(node);
};
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlText: function (ctx) { return rx$2.ws.test(ctx.node.text) ? [] : tx.HtmlText(ctx); } });
}
// IE <9 will removes text nodes that just contain whitespace in certain situations.
// Solution is to add a zero-width non-breaking space (entity &#xfeff) to the nodes.
function browserPreservesWhitespaceTextNodes() {
    var ul = document.createElement("ul");
    ul.innerHTML = "    <li></li>";
    return ul.childNodes.length === 2;
}
function addFEFFtoWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlText: function (ctx) {
            return tx.HtmlText(rx$2.ws.test(ctx.node.text) && !(ctx.parent.node instanceof StaticProperty)
                ? ctx.swap(new HtmlText('&#xfeff;' + ctx.node.text))
                : ctx);
        } });
}
// IE <9 will remove comments when they're the first child of certain elements
// Solution is to prepend a non-whitespace text node, using the &#xfeff trick.
function browserPreservesInitialComments() {
    var ul = document.createElement("ul");
    ul.innerHTML = "<!-- --><li></li>";
    return ul.childNodes.length === 2;
}
function insertTextNodeBeforeInitialComments(tx) {
    return __assign({}, tx, { HtmlComment: function (ctx) {
            return (ctx.index === 0 ? tx.HtmlText(ctx.swap(new HtmlText('&#xfeff;'))) : []).concat(tx.HtmlComment(ctx));
        } });
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
    upperStart: /^[A-Z]/,
    singleQuotes: /'/g,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
var CodeBlock = (function () {
    function CodeBlock() {
        this.ids = [];
        this.staticStmts = [];
        this.dynamicStmts = [];
    }
    CodeBlock.prototype.id = function (id) { this.ids.push(id); return id; };
    CodeBlock.prototype.staticStmt = function (stmt) { this.staticStmts.push(stmt); return stmt; };
    CodeBlock.prototype.dynamicStmt = function (stmt) { this.dynamicStmts.push(stmt); return stmt; };
    return CodeBlock;
}());
var compile = function (node, opts) { return compileSegments(node, opts); };
var compileSegments = function (node, opts) {
    var result = "", i;
    for (i = 0; i < node.segments.length; i++) {
        result += compileSegment(node.segments[i], result, opts);
    }
    return result;
};
var compileSegment = function (node, previousCode, opts) {
    return node instanceof CodeText ? compileCodeText(node, opts) : compileHtmlElement(node, previousCode, opts);
};
var compileCodeText = function (node, opts) {
    return markBlockLocs(node.text, node.loc, opts);
};
var compileHtmlElement = function (node, previousCode, opts) {
    var code;
    if (rx$3.upperStart.test(node.tag)) {
        code = compileSubComponent(node, previousCode, opts);
    }
    else if (node.properties.length === 0 && node.content.length === 0) {
        // optimization: don't need IIFE for simple single nodes
        code = "document.createElement(\"" + node.tag + "\")";
    }
    else {
        var block = new CodeBlock(), expr = stmtsHtmlElement(node, block, null, 0, opts);
        code = compileCodeBlock(block, expr, indent(previousCode));
    }
    return markLoc(code, node.loc, opts);
};
var compileSubComponent = function (node, prior, opts) {
    var nl = "\r\n" + indent(prior), inl = nl + '    ', iinl = inl + '    ', props = node.properties.map(function (p) {
        return p instanceof StaticProperty ? propName(opts, p.name) + ": " + p.value + "," :
            p instanceof DynamicProperty ? propName(opts, p.name) + ": " + compileSegments(p.code, opts) + "," :
                '';
    }), children = node.content.map(function (c) {
        return c instanceof HtmlElement ? compileHtmlElement(c, prior, opts) :
            c instanceof HtmlText ? codeStr(c.text.trim()) :
                c instanceof HtmlInsert ? compileSegments(c.code, opts) :
                    createComment(c.text);
    });
    return node.tag + "({" + inl
        + props.join(inl) + inl
        + 'children: [' + iinl
        + children.join(',' + iinl) + inl
        + ']})';
};
var compileCodeBlock = function (code, expr, indent) {
    var nl = "\r\n" + indent, inl = nl + '    ', iinl = inl + '    ';
    return '(function () {' + iinl
        + 'var ' + code.ids.join(', ') + ';' + iinl
        + code.staticStmts.join(iinl) + iinl
        + code.dynamicStmts.join(iinl) + iinl
        + 'return ' + expr + ';' + inl
        + '})()';
};
var stmtsHtmlElement = function (node, code, parent, n, opts) {
    var id = code.id(genIdentifier(parent, node.tag, n));
    if (rx$3.upperStart.test(node.tag)) {
        var expr = compileSubComponent(node, "", opts), range = "{ start: " + id + ", end: " + id + " }";
        code.staticStmt(assign(id, createText('')));
        code.dynamicStmt(computation("Surplus.insert(range, " + expr + ");", "range", range, node.loc, opts));
    }
    else {
        var exelen = code.dynamicStmts.length;
        code.staticStmt(assign(id, createElement(node.tag)));
        for (var i = 0; i < node.properties.length; i++) {
            stmtsProperty(node.properties[i], code, id, i, opts);
        }
        var myexes = code.dynamicStmts.splice(exelen);
        for (i = 0; i < node.content.length; i++) {
            var child = stmtsChild(node.content[i], code, id, i, opts);
            if (child)
                code.staticStmt(appendNode(id, child));
        }
        code.dynamicStmts = code.dynamicStmts.concat(myexes);
    }
    return id;
};
var stmtsProperty = function (node, code, id, n, opts) {
    return node instanceof StaticProperty ? stmtsStaticProperty(node, code, id, n, opts) :
        node instanceof DynamicProperty ? stmtsDynamicProperty(node, code, id, n, opts) :
            stmtsMixin(node, code, id, n, opts);
};
var stmtsStaticProperty = function (node, code, id, n, opts) {
    code.staticStmt(id + "." + propName(opts, node.name) + " = " + node.value + ";");
};
var stmtsDynamicProperty = function (node, code, id, n, opts) {
    var expr = compileSegments(node.code, opts);
    if (node.name === "ref") {
        code.staticStmt(expr + " = " + id + ";");
    }
    else {
        var prop = propName(opts, node.name), setter = id + "." + prop + " = " + expr + ";";
        code.dynamicStmt(noApparentSignals(expr)
            ? setter
            : computation(setter, "", "", node.loc, opts));
    }
};
var stmtsMixin = function (node, code, id, n, opts) {
    var expr = compileSegments(node.code, opts);
    code.dynamicStmt(computation("(" + expr + ")(" + id + ", __state);", "__state", "", node.loc, opts));
};
var stmtsChild = function (node, code, parent, n, opts) {
    return node instanceof HtmlElement ? stmtsHtmlElement(node, code, parent, n, opts) :
        node instanceof HtmlComment ? stmtsHtmlComment(node) :
            node instanceof HtmlText ? stmtsHtmlText(node, code, parent, n) :
                stmtsHtmlInsert(node, code, parent, n, opts);
};
var stmtsHtmlComment = function (node) {
    return createComment(node.text);
};
var stmtsHtmlText = function (node, code, parent, n) {
    // if we're the first child, we can just set innerText
    if (n === 0) {
        code.staticStmt(parent + ".innerText = " + codeStr(node.text));
    }
    else {
        return createText(node.text);
    }
};
var stmtsHtmlInsert = function (node, code, parent, n, opts) {
    var id = code.id(genIdentifier(parent, 'insert', n)), ins = compileSegments(node.code, opts), range = "{ start: " + id + ", end: " + id + " }";
    code.staticStmt(assign(id, createText('')));
    code.dynamicStmt(noApparentSignals(ins)
        ? "Surplus.insert(" + range + ", " + ins + ");"
        : computation("Surplus.insert(range, " + ins + ");", "range", range, node.loc, opts));
    return id;
};
var genIdentifier = function (parent, tag, n) {
    return parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
};
var propName = function (opts, name) {
    return opts.jsx && name.substr(0, 2) === 'on' ? (name === 'onDoubleClick' ? 'ondblclick' : name.toLowerCase()) : name;
};
var assign = function (id, expr) {
    return id + " = " + expr + ";";
};
var appendNode = function (parent, child) {
    return "Surplus.appendChild(" + parent + ", " + child + ");";
};
var createElement = function (tag) {
    return "Surplus.createElement('" + tag + "')";
};
var createComment = function (text) {
    return "Surplus.createComment(" + codeStr(text) + ")";
};
var createText = function (text) {
    return "Surplus.createTextNode(" + codeStr(text) + ")";
};
var computation = function (code, varname, seed, loc, opts) {
    return markLoc(varname ? "Surplus.S(function (" + varname + ") { return " + code + " }" + (seed ? ", " + seed : '') + ");"
        : "Surplus.S(function () { " + code + " });", loc, opts);
};
var noApparentSignals = function (code) {
    return !rx$3.hasParen.test(code) || rx$3.loneFunction.test(code);
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
