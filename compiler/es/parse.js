import * as AST from './AST';
// pre-compiled regular expressions
var rx = {
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
;
export function parse(TOKS, opts) {
    var i = 0, EOF = TOKS.length === 0, TOK = EOF ? '' : TOKS[i], LINE = 0, COL = 0, POS = 0;
    return program();
    function program() {
        var segments = [], text = "", loc = LOC();
        while (!EOF) {
            if (IS('<')) {
                if (text)
                    segments.push(new AST.CodeText(text, loc));
                text = "";
                segments.push(jsxElement());
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
        return new AST.Program(segments);
    }
    function jsxElement() {
        if (NOT('<'))
            ERR("not at start of html element");
        var start = LOC(), tag = "", properties = [], content = [], hasContent = true;
        NEXT(); // pass '<'
        tag = SPLIT(rx.identifier);
        if (!tag)
            ERR("bad element name", start);
        SKIPWS();
        // scan for properties until end of opening tag
        while (!EOF && NOT('>') && NOT('/>')) {
            if (MATCH(rx.identifier)) {
                properties.push(jsxProperty());
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
        return new AST.JSXElement(tag, properties, content, start);
    }
    function jsxText() {
        var text = "";
        while (!EOF && NOT('<') && NOT('<!--') && NOT('{') && NOT('</')) {
            text += TOK, NEXT();
        }
        return new AST.JSXText(text);
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
        return new AST.JSXComment(text);
    }
    function jsxInsert() {
        var loc = LOC();
        return new AST.JSXInsert(embeddedCode(), loc);
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
                if (AST.JSXDynamicProperty.SpecialPropNameRx.test(name))
                    ERR("cannot name a static property '" + AST.JSXDynamicProperty.SpecialPropNames.join("' or '") + "'", loc);
                return new AST.JSXStaticProperty(name, quotedString());
            }
            else if (IS('{')) {
                return new AST.JSXDynamicProperty(name, embeddedCode(), loc);
            }
            else {
                return ERR("unexepected value for JSX property");
            }
        }
        else {
            return new AST.JSXStaticProperty(name, "true");
        }
    }
    function jsxSpreadProperty() {
        if (NOT('{...'))
            ERR("not at start of JSX spread");
        var loc = LOC();
        return new AST.JSXSpreadProperty(embeddedCode(), loc);
    }
    function embeddedCode() {
        if (NOT('{') && NOT('{...'))
            ERR("not at start of JSX embedded code");
        var prefixLength = TOK.length, segments = [], loc = LOC(), last = balancedParens(segments, "", loc);
        // remove closing '}'
        last = last.substr(0, last.length - 1);
        segments.push(new AST.CodeText(last, loc));
        // remove opening '{' or '{...', adjusting code loc accordingly
        var first = segments[0];
        first.loc.col += prefixLength;
        segments[0] = new AST.CodeText(first.text.substr(prefixLength), first.loc);
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
                    segments.push(new AST.CodeText(text, { line: loc.line, col: loc.col, pos: loc.pos }));
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
