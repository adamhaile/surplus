describe("JSX static property", function () {
    it("sets a property on the given node", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input value="foo" />;

            expect(input.value).toBe("foo");
        `));
    });

    it("sets an attribute on the given node when the name is a known attribute", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input aria-hidden="true" />;

            expect(input.getAttribute("aria-hidden")).toBe("true");
        `));
    });

    it("can be valueless", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input type="checkbox" checked />;

            expect(input.checked).toBe(true);
        `));
    });

    it("can set multiple properties on the same node", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input value="foo" id="id" />;

            expect(input.value).toBe("foo");
            expect(input.id).toBe("id");
        `));
    });
    
    it("can use JSX property names as aliases for DOM properties", function () {
        eval(window.SurplusCompiler.compile(`
            var fn = () => {},
                input = <input onClick={fn} spellCheck={true} />;

            expect(input.onclick).toBe(fn);
            expect(input.spellcheck).toBe(true);
        `));
    });

    it("can use HTML attribute names when different from DOM property names", function () {
        eval(window.SurplusCompiler.compile(`
            var label = <label class="foo" for="bar" />;

            expect(label.className).toBe("foo");
            expect(label.htmlFor).toBe("bar");
        `));
    });

    it("can set custom attributes (identified by containing a dash '-')", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input custom-attribute="foo" />;

            expect(input.getAttribute("custom-attribute")).toBe("foo");
        `));
    });

    it("can set sub-properties", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input style.width="50%" />;

            expect(input.style.width).toBe("50%");
        `));
    });


    it("can set style sub-properties", function () {
        eval(window.SurplusCompiler.compile(`
            var input = <input style={{ width: "50%" }} />;

            expect(input.style.width).toBe("50%");
        `));
    });

    it("later properties take precedence", function () {
        eval(window.SurplusCompiler.compile(`
            var div = <div id="a" id="b"></div>;

            expect(div.id).toBe("b");
        `));
    });

    it("throws if named 'ref' or 'fn'", function () {
        expect(() => window.SurplusCompiler.compile(
            '<div ref="ref"></div>'
        )).toThrowError(/ref/);
        
        expect(() => window.SurplusCompiler.compile(
            '<div fn="fn"></div>'
        )).toThrowError(/fn/);
    });
});
