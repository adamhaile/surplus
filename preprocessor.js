(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["preprocessor"] = factory();
	else
		root["preprocessor"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ASTCodeNode = (function () {
    function ASTCodeNode() {
    }
    ASTCodeNode.prototype.shim = function (ctx) { };
    ASTCodeNode.prototype.genCode = function (params, prior) { return ""; };
    ;
    return ASTCodeNode;
}());
exports.ASTCodeNode = ASTCodeNode;
var ASTStatementNode = (function () {
    function ASTStatementNode() {
    }
    ASTStatementNode.prototype.shim = function (ctx) { };
    ASTStatementNode.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) { };
    return ASTStatementNode;
}());
exports.ASTStatementNode = ASTStatementNode;
var CodeTopLevel = (function (_super) {
    __extends(CodeTopLevel, _super);
    function CodeTopLevel(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return CodeTopLevel;
}(ASTCodeNode));
exports.CodeTopLevel = CodeTopLevel;
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
exports.CodeText = CodeText;
var EmbeddedCode = (function (_super) {
    __extends(EmbeddedCode, _super);
    function EmbeddedCode(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return EmbeddedCode;
}(ASTCodeNode));
exports.EmbeddedCode = EmbeddedCode;
var HtmlElement = (function (_super) {
    __extends(HtmlElement, _super);
    function HtmlElement(tag, properties, content) {
        var _this = _super.call(this) || this;
        _this.tag = tag;
        _this.properties = properties;
        _this.content = content;
        return _this;
    }
    HtmlElement.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) { };
    return HtmlElement;
}(ASTCodeNode));
exports.HtmlElement = HtmlElement;
var HtmlText = (function (_super) {
    __extends(HtmlText, _super);
    function HtmlText(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlText;
}(ASTStatementNode));
exports.HtmlText = HtmlText;
var HtmlComment = (function (_super) {
    __extends(HtmlComment, _super);
    function HtmlComment(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlComment;
}(ASTStatementNode));
exports.HtmlComment = HtmlComment;
var HtmlInsert = (function (_super) {
    __extends(HtmlInsert, _super);
    function HtmlInsert(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return HtmlInsert;
}(ASTStatementNode));
exports.HtmlInsert = HtmlInsert;
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
exports.StaticProperty = StaticProperty;
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
exports.DynamicProperty = DynamicProperty;
var Mixin = (function (_super) {
    __extends(Mixin, _super);
    function Mixin(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return Mixin;
}(ASTStatementNode));
exports.Mixin = Mixin;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var rx = {
    locs: /(\n)|(\u0000(\d+),(\d+)\u0000)|(\u0000\u0000)/g
}, vlqlast = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef", vlqcont = "ghijklmnopqrstuvwxyz0123456789+/";
function segmentStart(loc) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}
exports.segmentStart = segmentStart;
function segmentEnd() {
    return "\u0000\u0000";
}
exports.segmentEnd = segmentEnd;
function extractMappings(embedded) {
    var mappings = "", pgcol = 0, psline = 0, pscol = 0, insegment = false, linestart = 0, linecont = false;
    var src = embedded.replace(rx.locs, function (_, nl, start, line, col, end, offset) {
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
exports.extractMap = extractMap;
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
exports.appendMap = appendMap;
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


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tokenize_1 = __webpack_require__(7);
var parse_1 = __webpack_require__(5);
var shims_1 = __webpack_require__(6);
__webpack_require__(4);
var sourcemap = __webpack_require__(1);
function preprocess(str, opts) {
    opts = opts || {};
    var params = {
        exec: opts.exec || '',
        sourcemap: opts.sourcemap || null,
        jsx: opts.jsx || false
    };
    var toks = tokenize_1.tokenize(str, params), ast = parse_1.parse(toks, params);
    if (shims_1.shimmed)
        ast.shim();
    var code = ast.genCode(params), out;
    if (params.sourcemap === 'extract')
        out = sourcemap.extractMap(code, str, params);
    else if (params.sourcemap === 'append')
        out = sourcemap.appendMap(code, str, params);
    else
        out = code;
    return out;
}
exports.preprocess = preprocess;


/***/ }),
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var AST = __webpack_require__(0);
var sourcemap = __webpack_require__(1);
// pre-compiled regular expressions
var rx = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    singleQuotes: /'/g,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
// genCode
AST.CodeTopLevel.prototype.genCode =
    AST.EmbeddedCode.prototype.genCode = function (opts) { return concatResults(opts, this.segments, 'genCode'); };
AST.CodeText.prototype.genCode = function (opts) {
    return (opts.sourcemap ? sourcemap.segmentStart(this.loc) : "")
        + this.text
        + (opts.sourcemap ? sourcemap.segmentEnd() : "");
};
AST.HtmlElement.prototype.genCode = function (opts, prior) {
    var nl = "\r\n" + indent(prior), inl = nl + '    ', iinl = inl + '    ', ids = [], inits = [], exes = [];
    this.genDOMStatements(opts, ids, inits, exes, null, 0);
    return '(function () {' + iinl
        + 'var ' + ids.join(', ') + ';' + iinl
        + inits.join(iinl) + iinl
        + exes.join(iinl) + iinl
        + 'return __;' + inl + '})()';
};
// genDOMStatements
AST.HtmlElement.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, this.tag, n), myexes = [];
    createElement(inits, id, this.tag);
    for (var i = 0; i < this.properties.length; i++) {
        this.properties[i].genDOMStatements(opts, ids, inits, myexes, id, i);
    }
    for (i = 0; i < this.content.length; i++) {
        this.content[i].genDOMStatements(opts, ids, inits, exes, id, i);
    }
    exes.push.apply(exes, myexes);
    if (parent)
        appendNode(inits, parent, id);
};
AST.HtmlComment.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'comment', n);
    createComment(inits, id, this.text);
    appendNode(inits, parent, id);
};
AST.HtmlText.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'text', n);
    createText(inits, id, this.text);
    appendNode(inits, parent, id);
};
AST.HtmlInsert.prototype.genDOMStatements = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'insert', n);
    createText(inits, id, '');
    appendNode(inits, parent, id);
    exec(exes, opts, "function (range) { return Surplus.insert(range, " + this.code.genCode(opts) + "); }", "{ start: " + id + ", end: " + id + " }");
};
AST.StaticProperty.prototype.genDOMStatements = function (opts, ids, inits, exes, id, n) {
    inits.push(id + "." + propName(opts, this.name) + " = " + this.value + ";");
};
AST.DynamicProperty.prototype.genDOMStatements = function (opts, ids, inits, exes, id, n) {
    var code = this.code.genCode(opts);
    if (this.name === "ref") {
        inits.push(code + " = " + id + ";");
    }
    else {
        exec(exes, opts, "function () { " + id + "." + propName(opts, this.name) + " = " + code + "; }", "");
    }
};
AST.Mixin.prototype.genDOMStatements = function (opts, ids, inits, exes, id, n) {
    var code = this.code.genCode(opts);
    exec(exes, opts, "function (__state) { return " + code + "(" + id + ", __state); }", "");
};
function genIdentifier(ids, parent, tag, n) {
    var id = parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
    ids.push(id);
    return id;
}
function createElement(stmts, id, tag) {
    stmts.push(id + ' = document.createElement(\'' + tag + '\');');
}
function createComment(stmts, id, text) {
    stmts.push(id + ' = document.createComment(' + codeStr(text) + ');');
}
function createText(stmts, id, text) {
    stmts.push(id + ' = document.createTextNode(' + codeStr(text) + ');');
}
function appendNode(stmts, parent, child) {
    stmts.push(parent + '.appendChild(' + child + ');');
}
function exec(execs, opts, fn, val) {
    fn = opts.exec ? (opts.exec + '(' + fn + (val ? ', ' + val : '') + ');') : ('(' + fn + ')(' + val + ');');
    execs.push(fn);
}
function propName(opts, name) {
    return opts.jsx && name.substr(0, 2) === 'on' ? name.toLowerCase() : name;
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
    var m = rx.indent.exec(prior || '');
    return m ? m[1] : '';
}
function codeStr(str) {
    return "'" + str.replace(rx.backslashes, "\\\\")
        .replace(rx.singleQuotes, "\\'")
        .replace(rx.newlines, "\\\n")
        + "'";
}


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var AST = __webpack_require__(0);
// pre-compiled regular expressions
var rx = {
    identifier: /^[a-z]\w*/,
    stringEscapedEnd: /[^\\](\\\\)*\\$/,
    leadingWs: /^\s+/,
    codeTerminator: /^[\s<>/,;)\]}]/,
    codeContinuation: /^[^\s<>/,;)\]}]+/
};
var parens = {
    "(": ")",
    "[": "]",
    "{": "}"
};
function parse(TOKS, opts) {
    var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
    return codeTopLevel();
    function codeTopLevel() {
        var segments = [], text = "", loc = LOC();
        while (!EOF) {
            if (IS('<')) {
                if (text)
                    segments.push(new AST.CodeText(text, loc));
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
            segments.push(new AST.CodeText(text, loc));
        return new AST.CodeTopLevel(segments);
    }
    function htmlElement() {
        if (NOT('<'))
            ERR("not at start of html element");
        var start = LOC(), tag = "", properties = [], content = [], hasContent = true;
        NEXT(); // pass '<'
        tag = SPLIT(rx.identifier);
        if (!tag)
            ERR("bad element name", start);
        SPLIT(rx.leadingWs);
        // scan for properties until end of opening tag
        while (!EOF && NOT('>') && NOT('/>')) {
            if (MATCH(rx.identifier)) {
                properties.push(property());
            }
            else if (!opts.jsx && IS('@')) {
                properties.push(mixin());
            }
            else if (opts.jsx && IS('{...')) {
                ERR("JSX spread operator not supported");
            }
            else {
                ERR("unrecognized content in begin tag");
            }
            SPLIT(rx.leadingWs);
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
            if (tag !== SPLIT(rx.identifier))
                ERR("mismatched open and close tags", start);
            if (NOT('>'))
                ERR("malformed close tag");
            NEXT(); // pass '>'
        }
        return new AST.HtmlElement(tag, properties, content);
    }
    function htmlText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && (opts.jsx ? NOT('{') : NOT('@')) && NOT('</')) {
            text += TOK, NEXT();
        }
        return new AST.HtmlText(text);
    }
    function htmlComment() {
        if (NOT('<!--'))
            ERR("not in HTML comment");
        var start = LOC(), text = "";
        while (!EOF && NOT('-->')) {
            text += TOK, NEXT();
        }
        if (EOF)
            ERR("unterminated html comment", start);
        text += TOK, NEXT();
        return new AST.HtmlComment(text);
    }
    function htmlInsert() {
        if (NOT('@'))
            ERR("not at start of code insert");
        NEXT(); // pass '@'
        return new AST.HtmlInsert(embeddedCode());
    }
    function jsxHtmlInsert() {
        return new AST.HtmlInsert(jsxEmbeddedCode());
    }
    function property() {
        if (!MATCH(rx.identifier))
            ERR("not at start of property declaration");
        var name = SPLIT(rx.identifier);
        SPLIT(rx.leadingWs); // pass name
        if (NOT('='))
            ERR("expected equals sign after property name");
        NEXT(); // pass '='
        SPLIT(rx.leadingWs);
        if (IS('"') || IS("'")) {
            return new AST.StaticProperty(name, quotedString());
        }
        else if (opts.jsx && IS('{')) {
            return new AST.DynamicProperty(name, jsxEmbeddedCode());
        }
        else if (!opts.jsx) {
            return new AST.DynamicProperty(name, embeddedCode());
        }
        else {
            return ERR("unexepected value for JSX property");
        }
    }
    function mixin() {
        if (NOT('@'))
            ERR("not at start of mixin");
        NEXT(); // pass '@'
        return new AST.Mixin(embeddedCode());
    }
    function embeddedCode() {
        var start = LOC(), segments = [], text = "", loc = LOC();
        // consume source text up to the first top-level terminating character
        while (!EOF && !MATCH(rx.codeTerminator)) {
            if (PARENS()) {
                text = balancedParens(segments, text, loc);
            }
            else if (IS("'") || IS('"')) {
                text += quotedString();
            }
            else {
                text += SPLIT(rx.codeContinuation);
            }
        }
        if (text)
            segments.push(new AST.CodeText(text, loc));
        if (segments.length === 0)
            ERR("not in embedded code", start);
        return new AST.EmbeddedCode(segments);
    }
    function jsxEmbeddedCode() {
        if (NOT('{'))
            ERR("not at start of JSX embedded code");
        var segments = [], loc = LOC(), last = balancedParens(segments, "", loc);
        // replace opening and closing '{' and '}' with '(' and ')'
        last = last.substr(0, last.length - 1) + ')';
        segments.push(new AST.CodeText(last, loc));
        var first = segments[0];
        first.text = '(' + first.text.substr(1);
        return new AST.EmbeddedCode(segments);
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
                    segments.push(new AST.CodeText(text, { line: loc.line, col: loc.col }));
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
exports.parse = parse;
;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Cross-browser compatibility shims
var AST = __webpack_require__(0);
var rx = {
    ws: /^\s*$/
};
exports.shimmed = false;
// add base shim methods that visit AST
AST.CodeTopLevel.prototype.shim = function (ctx) { shimSiblings(this, this.segments); };
AST.HtmlElement.prototype.shim = function (ctx) { shimSiblings(this, this.content); };
AST.HtmlInsert.prototype.shim = function (ctx) { this.code.shim(ctx); };
AST.EmbeddedCode.prototype.shim = function (ctx) { shimSiblings(this, this.segments); };
AST.CodeText.prototype.shim =
    AST.HtmlText.prototype.shim =
        AST.HtmlComment.prototype.shim = function (ctx) { };
removeWhitespaceTextNodes();
if (this && this.document && this.document.createElement) {
    // browser-based shims
    if (!browserPreservesWhitespaceTextNodes())
        addFEFFtoWhitespaceTextNodes();
    if (!browserPreservesInitialComments())
        insertTextNodeBeforeInitialComments();
}
function removeWhitespaceTextNodes() {
    shim(AST.HtmlText, function (ctx) {
        if (rx.ws.test(this.text)) {
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
    shim(AST.HtmlText, function (ctx) {
        if (rx.ws.test(this.text) && !(ctx.parent instanceof AST.StaticProperty)) {
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
    shim(AST.HtmlComment, function (ctx) {
        if (ctx.index === 0) {
            insertBefore(new AST.HtmlText('&#xfeff;'), ctx);
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
    exports.shimmed = true;
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
function insertAfter(node, ctx) {
    ctx.siblings.splice(ctx.index + 1, 0, node);
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
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
exports.tokenize = tokenize;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var preprocess_1 = __webpack_require__(2);
exports.preprocess = preprocess_1.preprocess;


/***/ })
/******/ ]);
});