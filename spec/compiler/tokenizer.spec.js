describe("tokenizer", function () {
    it("accepts all characters in source", function () {
        // sanity check on our tokenizer and compiler
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
});

function escape(c) {
    return c === "'" ? "\\'" :
        c === "\n" ? "\\n" :
        c === "\\" ? "\\\\" :
        c;
}

