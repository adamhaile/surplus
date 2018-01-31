import * as AST from './AST';
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
    "{...": "}"
};
;
export function parse(TOKS, opts) {
    var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
    return program();
    function program() {
        var segments = [], text = "", loc = LOC();
        while (!EOF) {
            if (IS('<')) {
                if (text)
                    segments.push({ type: AST.CodeText, text: text, loc: loc });
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
            segments.push({ type: AST.CodeText, text: text, loc: loc });
        return { type: AST.Program, segments: segments };
    }
    function jsxElement() {
        if (NOT('<'))
            ERR("not at start of html element");
        var start = LOC(), tag = "", fields = [], references = [], functions = [], content = [], field, hasContent = true;
        NEXT(); // pass '<'
        tag = SPLIT(rx.identifier);
        if (!tag)
            ERR("bad element name", start);
        SKIPWS();
        // scan for properties until end of opening tag
        while (!EOF && NOT('>') && NOT('/>')) {
            if (MATCH(rx.identifier)) {
                field = jsxField();
                if (field.type === AST.JSXReference)
                    references.push(field);
                else if (field.type === AST.JSXFunction)
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
        return { type: AST.JSXElement, tag: tag, fields: fields, references: references, functions: functions, content: content, kind: AST.JSXElementKind.HTML, loc: start };
    }
    function jsxText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && NOT('{') && NOT('</')) {
            text += TOK, NEXT();
        }
        return { type: AST.JSXText, text: text };
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
        return { type: AST.JSXComment, text: text };
    }
    function jsxInsert() {
        var loc = LOC();
        return { type: AST.JSXInsert, code: embeddedCode(), loc: loc };
    }
    function jsxField() {
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
                return { type: AST.JSXStaticField, name: name, namespace: null, value: quotedString() };
            }
            else if (IS('{')) {
                code = embeddedCode();
                return rx.refProp.test(name) ? { type: AST.JSXReference, code: code, loc: loc } :
                    rx.fnProp.test(name) ? { type: AST.JSXFunction, code: code, loc: loc } :
                        rx.styleProp.test(name) ? { type: AST.JSXStyleProperty, name: 'style', code: code, loc: loc } :
                            { type: AST.JSXDynamicField, name: name, namespace: null, code: code, loc: loc };
            }
            else {
                return ERR("unexepected value for JSX property");
            }
        }
        else {
            return { type: AST.JSXStaticField, name: name, namespace: null, value: "true" };
        }
    }
    function jsxSpreadProperty() {
        if (NOT('{...'))
            ERR("not at start of JSX spread");
        var loc = LOC();
        return { type: AST.JSXSpread, code: embeddedCode(), loc: loc };
    }
    function embeddedCode() {
        if (NOT('{') && NOT('{...'))
            ERR("not at start of JSX embedded code");
        var prefixLength = TOK.length, segments = [], loc = LOC(), last = balancedParens(segments, "", loc);
        // remove closing '}'
        last = last.substr(0, last.length - 1);
        segments.push({ type: AST.CodeText, text: last, loc: loc });
        // remove opening '{' or '{...', adjusting code loc accordingly
        var first = segments[0];
        first.loc.col += prefixLength;
        segments[0] = { type: AST.CodeText, text: first.text.substr(prefixLength), loc: first.loc };
        return { type: AST.EmbeddedCode, segments: segments };
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
                    segments.push({ type: AST.CodeText, text: text, loc: { line: loc.line, col: loc.col, pos: loc.pos } });
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
;
