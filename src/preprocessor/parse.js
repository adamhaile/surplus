define('parse', ['AST'], function (AST) {

    // pre-compiled regular expressions
    var rx = {
        identifier       : /^[a-z]\w*/,
        stringEscapedEnd : /[^\\](\\\\)*\\$/, // ending in odd number of escape slashes = next char of string escaped
        leadingWs        : /^\s+/,
        codeTerminator   : /^[\s<>/,;)\]}]/,
        codeContinuation : /^[^\s<>/,;)\]}]+/
    };

    var parens = {
        "(": ")",
        "[": "]",
        "{": "}"
    };

    return function parse(TOKS, opts) {
        var i = 0,
            EOF = TOKS.length === 0,
            TOK = !EOF && TOKS[i],
            LINE = 0,
            COL = 0,
            POS = 0;

        return codeTopLevel();

        function codeTopLevel() {
            var segments = [],
                text = "",
                loc = LOC();

            while (!EOF) {
                if (IS('<')) {
                    if (text) segments.push(new AST.CodeText(text, loc));
                    text = "";
                    segments.push(htmlElement());
                    loc = LOC();
                } else if (IS('"') || IS("'")) {
                    text += quotedString();
                } else if (IS('//')) {
                    text += codeSingleLineComment();
                } else if (IS('/*')) {
                    text += codeMultiLineComment();
                } else {
                    text += TOK, NEXT();
                }
            }

            if (text) segments.push(new AST.CodeText(text, loc));

            return new AST.CodeTopLevel(segments);
        }

        function htmlElement() {
            if (NOT('<')) ERR("not at start of html element");

            var start = LOC(),
                tag = "",
                properties = [],
                content = [],
                hasContent = true;

            NEXT(); // pass '<'

            tag = SPLIT(rx.identifier);

            if (!tag) ERR("bad element name", start);

            SPLIT(rx.leadingWs);

            // scan for properties until end of opening tag
            while (!EOF && NOT('>') && NOT('/>')) {
                if (MATCH(rx.identifier)) {
                    properties.push(property());
                } else if (!opts.jsx && IS('@')) {
                    properties.push(mixin());
                } else if (opts.jsx && IS('{...')) {
                    ERR("JSX spread operator not supported");
                } else {
                    ERR("unrecognized content in begin tag");
                }

                SPLIT(rx.leadingWs);
            }

            if (EOF) ERR("unterminated start node", start);

            hasContent = IS('>');

            NEXT(); // pass '>' or '/>'

            if (hasContent) {
                while (!EOF && NOT('</')) {
                    if (IS('<')) {
                        content.push(htmlElement());
                    } else if (!opts.jsx && IS('@')) {
                        content.push(htmlInsert());
                    } else if (opts.jsx && IS('{')) {
                        content.push(jsxHtmlInsert());
                    } else if (IS('<!--')) {
                        content.push(htmlComment());
                    } else {
                        content.push(htmlText());
                    }
                }

                if (EOF) ERR("element missing close tag", start);

                NEXT(); // pass '</'

                if (tag !== SPLIT(rx.identifier)) ERR("mismatched open and close tags", start);

                if (NOT('>')) ERR("malformed close tag");

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
            if (NOT('<!--')) ERR("not in HTML comment");

            var start = LOC(),
                text = "";

            while (!EOF && NOT('-->')) {
                text += TOK, NEXT();
            }

            if (EOF) ERR("unterminated html comment", start);

            text += TOK, NEXT();

            return new AST.HtmlComment(text);
        }

        function htmlInsert() {
            if (NOT('@')) ERR("not at start of code insert");

            NEXT(); // pass '@'

            return new AST.HtmlInsert(embeddedCode());
        }

        function jsxHtmlInsert() {
            return new AST.HtmlInsert(jsxEmbeddedCode());
        }

        function property() {
            if (!MATCH(rx.identifier)) ERR("not at start of property declaration");

            var name = SPLIT(rx.identifier);

            SPLIT(rx.leadingWs); // pass name

            if (NOT('=')) ERR("expected equals sign after property name");

            NEXT(); // pass '='

            SPLIT(rx.leadingWs);

            if (IS('"') || IS("'")) {
                return new AST.StaticProperty(name, quotedString());
            } else if (opts.jsx && IS('{')) {
                return new AST.DynamicProperty(name, jsxEmbeddedCode());
            } else if (!opts.jsx) {
                return new AST.DynamicProperty(name, embeddedCode());
            } else {
                ERR("unexepected value for JSX property");
            }
        }

        function mixin() {
            if (NOT('@')) ERR("not at start of mixin");

            NEXT(); // pass '@'

            return new AST.Mixin(embeddedCode());
        }

        function embeddedCode() {
            var start = LOC(),
                segments = [],
                text = "",
                loc = LOC();

            // consume source text up to the first top-level terminating character
            while(!EOF && !MATCH(rx.codeTerminator)) {
                if (PARENS()) {
                    text = balancedParens(segments, text, loc);
                } else if (IS("'") || IS('"')) {
                    text += quotedString();
                } else {
                    text += SPLIT(rx.codeContinuation);
                }
            }

            if (text) segments.push(new AST.CodeText(text, loc));

            if (segments.length === 0) ERR("not in embedded code", start);

            return new AST.EmbeddedCode(segments);
        }

        function jsxEmbeddedCode() {
            if (NOT('{')) ERR("not at start of JSX embedded code");

            var segments = [],
                loc = LOC(),
                last = balancedParens(segments, "", loc);
            
            // replace opening and closing '{' and '}' with '(' and ')'
            last = last.substr(0, last.length - 1) + ')';
            segments.push(new AST.CodeText(last, loc));

            var first = segments[0];
            first.text = '(' + first.text.substr(1);

            return new AST.EmbeddedCode(segments);
        }

        function balancedParens(segments, text, loc) {
            var start = LOC(),
                end = PARENS();

            if (end === undefined) ERR("not in parentheses");

            text += TOK, NEXT();

            while (!EOF && NOT(end)) {
                if (IS("'") || IS('"')) {
                    text += quotedString();
                } else if (IS('//')) {
                    text += codeSingleLineComment();
                } else if (IS('/*')) {
                    text += codeMultiLineComment();
                } else if (IS("<")) {
                    if (text) segments.push(new AST.CodeText(text, { line: loc.line, col: loc.col }));
                    text = "";
                    segments.push(htmlElement());
                    loc.line = LINE;
                    loc.col = COL;
                    loc.POS = POS;
                } else if (PARENS()) {
                    text = balancedParens(segments, text, loc);
                } else {
                    text += TOK, NEXT();
                }
            }

            if (EOF) ERR("unterminated parentheses", start);

            text += TOK, NEXT();

            return text;
        }

        function quotedString() {
            if (NOT("'") && NOT('"')) ERR("not in quoted string");

            var start = LOC(),
                quote,
                text;

            quote = text = TOK, NEXT();

            while (!EOF && (NOT(quote) || rx.stringEscapedEnd.test(text))) {
                text += TOK, NEXT();
            }

            if (EOF) ERR("unterminated string", start);

            text += TOK, NEXT();

            return text;
        }

        function codeSingleLineComment() {
            if (NOT("//")) ERR("not in code comment");

            var text = "";

            while (!EOF && NOT('\n')) {
                text += TOK, NEXT();
            }

            // EOF within a code comment is ok, just means that the text ended with a comment
            if (!EOF) text += TOK, NEXT();

            return text;
        }

        function codeMultiLineComment() {
            if (NOT("/*")) ERR("not in code comment");

            var start = LOC(),
                text = "";

            while (!EOF && NOT('*/')) {
                text += TOK, NEXT();
            }

            if (EOF) ERR("unterminated multi-line comment", start);

            text += TOK, NEXT();

            return text;
        }

        // token stream ops
        function NEXT() {
            if (TOK === "\n") LINE++, COL = 0, POS++;
            else if (TOK) COL += TOK.length, POS += TOK.length;

            if (++i >= TOKS.length) EOF = true, TOK = null;
            else TOK = TOKS[i];
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
            var m = MATCHES(rx);
            if (m && (m = m[0])) {
                COL += m.length;
                POS += m.length;
                TOK = TOK.substring(m.length);
                if (TOK === "") NEXT();
                return m;
            } else {
                return null;
            }
        }

        function LOC() {
            return { line: LINE, col: COL, pos: POS };
        }
    };
});
