describe("JSX dynamic property", function () {
    it("sets a property to the value of a javascript expression", function () {
        var code = window.SurplusCompiler.compile(`
            var val = "foo",
                input = <input value = { val } />;

            expect(input.value).toBe("foo");
        `);
        eval(code);
    });

    it("sets an attribute to the value of the javascript expression when the name is known to be an attribute", function () {
        var code = window.SurplusCompiler.compile(`
            var val = "true",
                input = <input aria-hidden = { val } />;

            expect(input.getAttribute("aria-hidden")).toBe("true");
        `);
        eval(code);
    });

    it("does not set an attribute to the value of the javascript expression when the name is known to be an attribute but the value is null, false, or undefined", function () {
        var code = window.SurplusCompiler.compile(`
            var val = S.data(true),
                input = <input aria-hidden = { val() } />;

            expect(input.hasAttribute("aria-hidden")).toBe(true);
            val(false);
            expect(input.hasAttribute("aria-hidden")).toBe(false);
            val(null);
            expect(input.hasAttribute("aria-hidden")).toBe(false);
            val(undefined);
            expect(input.hasAttribute("aria-hidden")).toBe(false);
            val("foo");
            expect(input.hasAttribute("aria-hidden")).toBe(true);
        `);
        eval(code);
    });

    it("can set multiple properties on the same node", function () {
        var code = window.SurplusCompiler.compile(`
            var val = "foo",
                id = "id",
                input = <input value = { val } id = { id } />;

            expect(input.value).toBe("foo");
            expect(input.id).toBe("id");
        `);
        eval(code);
    });

    it("later static properties take precedence,", function () {
        var code = window.SurplusCompiler.compile(`
            var id = S.data("a"),
                div = <div id={id()} id="b"></div>;

            expect(div.id).toBe("b");
        `);
        eval(code);
    });

    it("later static properties take precedence, even if early ones are re-evaluated", function () {
        var code = window.SurplusCompiler.compile(`
            var id = S.data("a"),
                div = <div id={id()} id="b"></div>;

            expect(div.id).toBe("b");
            id("c");
            expect(div.id).toBe("b");
        `);
        eval(code);
    });

    it("later dynamic properties take precedence,", function () {
        var code = window.SurplusCompiler.compile(`
            var id1 = S.data("a"),
                id2 = S.data("b"),
                div = <div id={id1()} id={id2()}></div>;

            expect(div.id).toBe("b");
        `);
        eval(code);
    });

    it("later dynamic properties take precedence, even if early ones are re-evaluated", function () {
        var code = window.SurplusCompiler.compile(`
            var id1 = S.data("a"),
                id2 = S.data("b"),
                div = <div id={id1()} id={id2()}></div>;

            expect(div.id).toBe("b");
            id1("c");
            expect(div.id).toBe("b");
        `);
        eval(code);
    });

    it("can set sub-properties", function () {
        var code = window.SurplusCompiler.compile(`
            var width = S.data("50%"),
                input = <input style.width={width()} />;

            expect(input.style.width).toBe("50%");
            width("75%");
            expect(input.style.width).toBe("75%");
        `);
        eval(code);
    });

    it("can set style sub-properties with a dash instead of a dot", function () {
        var code = window.SurplusCompiler.compile(`
            var width = S.data("50%"),
                input = <input style-width={width()} />;

            expect(input.style.width).toBe("50%");
            width("75%");
            expect(input.style.width).toBe("75%");
        `);
        eval(code);
    });

    it("can set sub-properties with objects", function () {
        var code = window.SurplusCompiler.compile(`
            var width = S.data("50%"),
                input = <input style={{ width: width() }} />;

            expect(input.style.width).toBe("50%");
            width("75%");
            expect(input.style.width).toBe("75%");
        `);
        eval(code);
    });

    it("can set sub-properties with objects multiple times", function () {
        var code = window.SurplusCompiler.compile(`
            var override = S.data(true),
                input = <input
                    style={{ width: "75%" }}
                    style={ override() ? { width: "50%" } : {} }
                />;

            expect(input.style.width).toBe("50%");
            override(false);
            expect(input.style.width).toBe("75%");
        `);
        eval(code);
    });
});
