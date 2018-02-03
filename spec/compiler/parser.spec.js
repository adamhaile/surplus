describe("parser", function () {
    it("accepts all characters in source", function () {
        // sanity check on our tokenizer and parser
        // build a source string of all 2-char combinations of printable ASCII
        // and confirm that it compiles back to the same source.
        var src = "'";
        for (var i = 32; i <= 255; i++) {
            var c = escape(String.fromCharCode(i));
            for (var j = i; j <= 255; j++) {
                d = escape(String.fromCharCode(j));
                src += c + d;
            }
        }
        src += "'";

        var out = window.SurplusCompiler.compile(src);
        
        expect(src).toBe(out);
    });

    it("compiles template literals correctly", function () {
        var code = window.SurplusCompiler.compile('                 \n\
            var span = (<span>${`<div>${1+2+<div/>.children.length})&nbsp;`}&nbsp;</span>); \n\
                                                                    \n\
            expect(span.innerText).toBe("$<div>3)&nbsp;\xa0");       \n\
        ');
        eval(code);
    });

    it("compiles template literal bug report (#12)", function () {
        var code = window.SurplusCompiler.compile('                      \n\
            // dummy values for symbols used in template                 \n\
            const meta = { title: "foo" },                               \n\
                vendor = "",                                             \n\
                main = "",                                               \n\
                state = { foo: 1},                                       \n\
                styles = "",                                             \n\
                metas = [1, 2, 3],                                       \n\
                body = <div />;                                          \n\
                                                                         \n\
            /* eslint-disable */                                         \n\
            const html = `                                               \n\
                <!DOCTYPE html>                                          \n\
                <html lang=en>                                           \n\
                <head>                                                   \n\
                    <meta charset="utf-8" />                             \n\
                    <meta name="referrer" content="origin" />            \n\
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />\n\
                    <meta name="viewport" content="width=device-width, initial-scale=1" />\n\
                    <title>${meta.title}</title>                         \n\
                    <link rel="shortcut icon" href="/favicon.ico" />     \n\
                    <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Roboto+Slab:400,700|Material+Icons" />\n\
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css" />\n\
                    ${styles}                                            \n\
                    ${metas.reduce((acc, val) => acc + val)}             \n\
                    <script src=\'${vendor}\' defer></script>            \n\
                    <script src=\'${main}\' defer></script>              \n\
                    <script id="state" type="application/json">${JSON.stringify(state)}</script>\n\
                    </head>                                              \n\
                    ${body.outerHTML}                                    \n\
                </html>`;                                                \n\
        ');
        eval(code);
    });

    it("handles // comments in tags", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span 
                        // comment 1
                        className
                        // comment 2
                        =
                        // comment 3
                        "foo"
                        // comment 4
                        ></span>;
                                      
            expect(span.className).toBe("foo");
        `);
        eval(code);
    });

    it("handles single-line /* */ comments in tags", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span /* comment 1 */ className /* comment 2 */ = /* comment 3 */ "foo" /* comment 4 */ ></span>;
                                      
            expect(span.className).toBe("foo");
        `);
        eval(code);
    });

    it("handles multi-line /* */ comments in tags", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span /* comment 1 
                        */ className /* comment 2 
                        */ = /* comment 3 
                        */ "foo" /* comment 4 
                        */ 
                        ></span>;
                                      
            expect(span.className).toBe("foo");
        `);
        eval(code);
    });

    it("handles // comments in children", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span>
                1
                { 
                    // comment
                } 
            </span>;
                                      
            expect(span.childNodes.length).toBe(1);
        `);
        eval(code);
    });

    it("handles single-line { /* */ } comments in children", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span>
                1
                { /* comment */ }
            </span>;
                                      
            expect(span.childNodes.length).toBe(1);
        `);
        eval(code);
    });

    it("handles multi-line /* */ comments in tags", function () {
        var code = window.SurplusCompiler.compile(`
            var span = <span>
                1
                { /*
                    comment
                */ }
                </span>;
                                      
            expect(span.childNodes.length).toBe(1);
        `);
        eval(code);
    });

    it("throws on empty dynamic expressions", function () {
        var code1 = `<span className={ }></span>`,
            code2 = `<span className={ /* comment */ }></span>`;

        expect(() => window.SurplusCompiler.compile(code1)).toThrowError(/empty/);
        expect(() => window.SurplusCompiler.compile(code2)).toThrowError(/empty/);
    });

    it("throws on empty spread expressions", function () {
        var code1 = `<span {... }></span>`,
            code2 = `<span {... /* comment */ }></span>`;

        expect(() => window.SurplusCompiler.compile(code1)).toThrowError(/empty/);
        expect(() => window.SurplusCompiler.compile(code2)).toThrowError(/empty/);
    });
});

function escape(c) {
    return c === "'" ? "\\'" :
        c === "\n" ? "\\n" :
        c === "\\" ? "\\\\" :
        c;
}

