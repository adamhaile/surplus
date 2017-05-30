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
var ASTCodeNode = (function () {
    function ASTCodeNode() {
    }
    ASTCodeNode.prototype.shim = function (ctx) { };
    ASTCodeNode.prototype.genCode = function (params, prior) { return ""; };
    
    return ASTCodeNode;
}());
var ASTStatementNode = (function () {
    function ASTStatementNode() {
    }
    ASTStatementNode.prototype.shim = function (ctx) { };
    ASTStatementNode.prototype.genDOMStatements = function (opts, code, parent, n) { };
    return ASTStatementNode;
}());
var CodeTopLevel = (function (_super) {
    __extends(CodeTopLevel, _super);
    function CodeTopLevel(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return CodeTopLevel;
}(ASTCodeNode));
var CodeText = (function (_super) {
    __extends(CodeText, _super);
    function CodeText(text, loc) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.loc = loc;
        return _this;
    }
    return CodeText;
}(ASTCodeNode));
var EmbeddedCode = (function (_super) {
    __extends(EmbeddedCode, _super);
    function EmbeddedCode(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return EmbeddedCode;
}(ASTCodeNode));
var HtmlElement = (function (_super) {
    __extends(HtmlElement, _super);
    function HtmlElement(tag, properties, content) {
        var _this = _super.call(this) || this;
        _this.tag = tag;
        _this.properties = properties;
        _this.content = content;
        return _this;
    }
    HtmlElement.prototype.genDOMStatements = function (opts, code, parent, n) { };
    return HtmlElement;
}(ASTCodeNode));
var HtmlText = (function (_super) {
    __extends(HtmlText, _super);
    function HtmlText(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlText;
}(ASTStatementNode));
var HtmlComment = (function (_super) {
    __extends(HtmlComment, _super);
    function HtmlComment(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlComment;
}(ASTStatementNode));
var HtmlInsert = (function (_super) {
    __extends(HtmlInsert, _super);
    function HtmlInsert(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return HtmlInsert;
}(ASTStatementNode));
var StaticProperty = (function (_super) {
    __extends(StaticProperty, _super);
    function StaticProperty(name, value) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.value = value;
        return _this;
    }
    return StaticProperty;
}(ASTStatementNode));
var DynamicProperty = (function (_super) {
    __extends(DynamicProperty, _super);
    function DynamicProperty(name, code) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.code = code;
        return _this;
    }
    return DynamicProperty;
}(ASTStatementNode));
var Mixin = (function (_super) {
    __extends(Mixin, _super);
    function Mixin(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return Mixin;
}(ASTStatementNode));

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
        SPLIT(rx$1.leadingWs);
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
            SPLIT(rx$1.leadingWs);
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
        return new HtmlElement(tag, properties, content);
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
        NEXT(); // pass '@'
        return new HtmlInsert(embeddedCode());
    }
    function jsxHtmlInsert() {
        return new HtmlInsert(jsxEmbeddedCode());
    }
    function property() {
        if (!MATCH(rx$1.identifier))
            ERR("not at start of property declaration");
        var name = SPLIT(rx$1.identifier);
        SPLIT(rx$1.leadingWs); // pass name
        if (NOT('='))
            ERR("expected equals sign after property name");
        NEXT(); // pass '='
        SPLIT(rx$1.leadingWs);
        if (IS('"') || IS("'")) {
            return new StaticProperty(name, quotedString());
        }
        else if (opts.jsx && IS('{')) {
            return new DynamicProperty(name, jsxEmbeddedCode());
        }
        else if (!opts.jsx) {
            return new DynamicProperty(name, embeddedCode());
        }
        else {
            return ERR("unexepected value for JSX property");
        }
    }
    function mixin() {
        if (NOT('@'))
            ERR("not at start of mixin");
        NEXT(); // pass '@'
        return new Mixin(embeddedCode());
    }
    function jsxMixin() {
        if (NOT('{...'))
            ERR("not at start of JSX mixin");
        return new Mixin(jsxEmbeddedCode());
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
        var prefix = TOK.length, segments = [], loc = LOC(), last = balancedParens(segments, "", loc);
        // remove opening and closing '{|{...' and '}'
        last = last.substr(0, last.length - 1);
        segments.push(new CodeText(last, loc));
        var first = segments[0];
        first.text = first.text.substr(prefix);
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

// Cross-browser compatibility shims
var rx$2 = {
    ws: /^\s*$/
};
var shimmed = false;
// add base shim methods that visit AST
CodeTopLevel.prototype.shim = function (ctx) { shimSiblings(this, this.segments); };
HtmlElement.prototype.shim = function (ctx) { shimSiblings(this, this.content); };
HtmlInsert.prototype.shim = function (ctx) { this.code.shim(ctx); };
EmbeddedCode.prototype.shim = function (ctx) { shimSiblings(this, this.segments); };
CodeText.prototype.shim =
    HtmlText.prototype.shim =
        HtmlComment.prototype.shim = function (ctx) { };
removeWhitespaceTextNodes();
if (typeof window !== 'undefined' && window.document && window.document.createElement) {
    // browser-based shims
    if (!browserPreservesWhitespaceTextNodes())
        addFEFFtoWhitespaceTextNodes();
    if (!browserPreservesInitialComments())
        insertTextNodeBeforeInitialComments();
}
function removeWhitespaceTextNodes() {
    shim(HtmlText, function (ctx) {
        if (rx$2.ws.test(this.text)) {
            prune(ctx);
        }
    });
}
// IE <9 will removes text nodes that just contain whitespace in certain situations.
// Solution is to add a zero-width non-breaking space (entity &#xfeff) to the nodes.
function browserPreservesWhitespaceTextNodes() {
    var ul = document.createElement("ul");
    ul.innerHTML = "    <li></li>";
    return ul.childNodes.length === 2;
}
function addFEFFtoWhitespaceTextNodes() {
    shim(HtmlText, function (ctx) {
        if (rx$2.ws.test(this.text) && !(ctx.parent instanceof StaticProperty)) {
            this.text = '&#xfeff;' + this.text;
        }
    });
}
// IE <9 will remove comments when they're the first child of certain elements
// Solution is to prepend a non-whitespace text node, using the &#xfeff trick.
function browserPreservesInitialComments() {
    var ul = document.createElement("ul");
    ul.innerHTML = "<!-- --><li></li>";
    return ul.childNodes.length === 2;
}
function insertTextNodeBeforeInitialComments() {
    shim(HtmlComment, function (ctx) {
        if (ctx.index === 0) {
            insertBefore(new HtmlText('&#xfeff;'), ctx);
        }
    });
}
function shimSiblings(parent, siblings) {
    var ctx = { index: 0, parent: parent, siblings: siblings, prune: false };
    for (; ctx.index < siblings.length; ctx.index++) {
        siblings[ctx.index].shim(ctx);
        if (ctx.prune) {
            siblings.splice(ctx.index, 1);
            ctx.index--;
            ctx.prune = false;
        }
    }
}
function shim(node, fn) {
    shimmed = true;
    var oldShim = node.prototype.shim;
    node.prototype.shim = function (ctx) {
        fn.call(this, ctx);
        if (!ctx || !ctx.prune)
            oldShim.call(this, ctx);
    };
}
function prune(ctx) {
    ctx.prune = true;
}
function insertBefore(node, ctx) {
    ctx.siblings.splice(ctx.index, 0, node);
    node.shim(ctx);
    ctx.index++;
}

var rx$4 = {
    locs: /(\n)|(\u0000(\d+),(\d+)\u0000)|(\u0000\u0000)/g
};
var vlqlast = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
var vlqcont = "ghijklmnopqrstuvwxyz0123456789+/";
function segmentStart(loc) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}
function segmentEnd() {
    return "\u0000\u0000";
}
function extractMappings(embedded) {
    var mappings = "", pgcol = 0, psline = 0, pscol = 0, insegment = false, linestart = 0, linecont = false;
    var src = embedded.replace(rx$4.locs, function (_, nl, start, line, col, end, offset) {
        if (nl) {
            mappings += ";";
            if (insegment) {
                mappings += "AA" + vlq(1) + vlq(0 - pscol);
                psline++;
                pscol = 0;
                linecont = true;
            }
            else {
                linecont = false;
            }
            linestart = offset + nl.length;
            pgcol = 0;
            return nl;
        }
        else if (start) {
            var gcol = offset - linestart;
            line = parseInt(line);
            col = parseInt(col);
            mappings += (linecont ? "," : "")
                + vlq(gcol - pgcol)
                + "A" // only one file
                + vlq(line - psline)
                + vlq(col - pscol);
            insegment = true;
            linecont = true;
            pgcol = gcol;
            psline = line;
            pscol = col;
            return "";
        }
        else if (end) {
            insegment = false;
            return "";
        }
    });
    return {
        src: src,
        mappings: mappings
    };
}
function extractMap(src, original, opts) {
    var extract = extractMappings(src), map = createMap(extract.mappings, original);
    return {
        src: extract.src,
        map: map
    };
}
function createMap(mappings, original) {
    return {
        version: 3,
        file: 'out.js',
        sources: ['in.js'],
        sourcesContent: [original],
        names: [],
        mappings: mappings
    };
}
function appendMap(src, original, opts) {
    var extract = extractMap(src, original, opts), appended = extract.src
        + "\n//# sourceMappingURL=data:"
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
        str += vlqcont[parseInt(numstr[i], 32)];
    // add final vlqlast digit
    str += vlqlast[parseInt(numstr[0], 32)];
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
// genCode
CodeTopLevel.prototype.genCode =
    EmbeddedCode.prototype.genCode = function (opts) { return concatResults(opts, this.segments, 'genCode'); };
CodeText.prototype.genCode = function (opts) {
    return (opts.sourcemap ? segmentStart(this.loc) : "")
        + this.text
        + (opts.sourcemap ? segmentEnd() : "");
};
HtmlElement.prototype.genCode = function (opts, prior) {
    if (rx$3.upperStart.test(this.tag)) {
        return genSubComponent(this, opts, prior);
    }
    else if (this.properties.length === 0 && this.content.length === 0) {
        // optimization: don't need IIFE for simple single nodes
        return "document.createElement(\"" + this.tag + "\")";
    }
    else {
        var code = new CodeBlock(), expr = this.genDOMStatements(opts, code, null, 0);
        return code.toCode(expr, indent(prior));
    }
};
function genSubComponent(cmp, opts, prior) {
    var nl = "\r\n" + indent(prior), inl = nl + '    ', iinl = inl + '    ', props = cmp.properties.map(function (p) {
        return p instanceof StaticProperty ? propName(opts, p.name) + ": " + p.value + "," :
            p instanceof DynamicProperty ? propName(opts, p.name) + ": " + p.code.genCode(opts, prior) + "," :
                '';
    }), children = cmp.content.map(function (c) {
        return c instanceof HtmlElement ? c.genCode(opts, prior) :
            c instanceof HtmlText ? codeStr(c.text.trim()) :
                c instanceof HtmlInsert ? c.code.genCode(opts, prior) :
                    createComment(c.text);
    });
    return cmp.tag + "({" + inl
        + props.join(inl) + inl
        + 'children: [' + iinl
        + children.join(',' + iinl) + inl
        + ']})';
}
var CodeBlock = (function () {
    function CodeBlock() {
        this.ids = [];
        this.inits = [];
        this.exes = [];
    }
    CodeBlock.prototype.id = function (id) { this.ids.push(id); return id; };
    CodeBlock.prototype.init = function (stmt) { this.inits.push(stmt); return stmt; };
    CodeBlock.prototype.exe = function (stmt) { this.exes.push(stmt); return stmt; };
    CodeBlock.prototype.toCode = function (expr, indent) {
        var nl = "\r\n" + indent, inl = nl + '    ', iinl = inl + '    ';
        return '(function () {' + iinl
            + 'var ' + this.ids.join(', ') + ';' + iinl
            + this.inits.join(iinl) + iinl
            + this.exes.join(iinl) + iinl
            + 'return ' + expr + ';' + inl
            + '})()';
    };
    return CodeBlock;
}());
// genDOMStatements
HtmlElement.prototype.genDOMStatements = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, this.tag, n));
    if (rx$3.upperStart.test(this.tag)) {
        var expr = genSubComponent(this, opts, ""), range = "{ start: " + id + ", end: " + id + " }";
        code.init(assign(id, createText('')));
        code.exe(exe("Surplus.insert(range, " + expr + ");", "range", range));
    }
    else {
        var exelen = code.exes.length;
        code.init(assign(id, createElement(this.tag)));
        for (var i = 0; i < this.properties.length; i++) {
            this.properties[i].genDOMStatements(opts, code, id, i);
        }
        var myexes = code.exes.splice(exelen);
        for (i = 0; i < this.content.length; i++) {
            var child = this.content[i].genDOMStatements(opts, code, id, i);
            if (child)
                code.init(appendNode(id, child));
        }
        code.exes = code.exes.concat(myexes);
    }
    return id;
};
HtmlComment.prototype.genDOMStatements = function (opts, code, parent, n) {
    return createComment(this.text);
};
HtmlText.prototype.genDOMStatements = function (opts, code, parent, n) {
    if (n === 0) {
        code.init(parent + ".innerText = " + codeStr(this.text));
    }
    else {
        return createText(this.text);
    }
};
HtmlInsert.prototype.genDOMStatements = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, 'insert', n)), ins = this.code.genCode(opts), range = "{ start: " + id + ", end: " + id + " }";
    code.init(assign(id, createText('')));
    if (noApparentSignals(ins)) {
        code.exe("Surplus.insert(" + range + ", " + ins + ");");
    }
    else {
        code.exe(exe("Surplus.insert(range, " + ins + ");", "range", range));
    }
    return id;
};
StaticProperty.prototype.genDOMStatements = function (opts, code, id, n) {
    code.init(id + "." + propName(opts, this.name) + " = " + this.value + ";");
};
DynamicProperty.prototype.genDOMStatements = function (opts, code, id, n) {
    var expr = this.code.genCode(opts);
    if (this.name === "ref") {
        code.init(expr + " = " + id + ";");
    }
    else {
        var prop = propName(opts, this.name), setter = id + "." + prop + " = " + expr + ";";
        if (noApparentSignals(expr)) {
            code.exe(setter);
        }
        else {
            code.exe(exe(setter, "", ""));
        }
    }
};
Mixin.prototype.genDOMStatements = function (opts, code, id, n) {
    var expr = this.code.genCode(opts);
    code.exe(exe("(" + expr + ")(" + id + ", __state);", "__state", ""));
};
var genIdentifier = function (parent, tag, n) {
    return parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
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
var exe = function (code, varname, seed) {
    return varname ? "Surplus.S(function (" + varname + ") { return " + code + " }" + (seed ? ", " + seed : '') + ");"
        : "Surplus.S(function () { " + code + " });";
};
function propName(opts, name) {
    return opts.jsx && name.substr(0, 2) === 'on' ? (name === 'onDoubleClick' ? 'ondblclick' : name.toLowerCase()) : name;
}
function noApparentSignals(code) {
    return !rx$3.hasParen.test(code) || rx$3.loneFunction.test(code);
}
function concatResults(opts, children, method, sep) {
    var result = "", i;
    for (i = 0; i < children.length; i++) {
        if (i && sep)
            result += sep;
        result += children[i][method](opts, result);
    }
    return result;
}
function indent(prior) {
    var m = rx$3.indent.exec(prior || '');
    return m ? m[1] : '';
}
function codeStr(str) {
    return "'" + str.replace(rx$3.backslashes, "\\\\")
        .replace(rx$3.singleQuotes, "\\'")
        .replace(rx$3.newlines, "\\\n")
        + "'";
}

function preprocess(str, opts) {
    opts = opts || {};
    var params = {
        sourcemap: opts.sourcemap || null,
        jsx: 'jsx' in opts ? opts.jsx : true
    };
    var toks = tokenize(str, params), ast = parse(toks, params);
    if (shimmed)
        ast.shim();
    var code = ast.genCode(params), out;
    if (params.sourcemap === 'extract')
        out = extractMap(code, str, params);
    else if (params.sourcemap === 'append')
        out = appendMap(code, str, params);
    else
        out = code;
    return out;
}

exports.preprocess = preprocess;

Object.defineProperty(exports, '__esModule', { value: true });

})));
