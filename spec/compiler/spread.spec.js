describe("JSX ...spreads", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("add properties on the node", function () {
        var code = window.SurplusCompiler.compile(`
            var spread = { id : "id" },
                a = <a {...spread} />;

            expect(a.id).toBe("id");
        `);

        eval(code);
    });

    it("add styles on the node", function () {
        var code = window.SurplusCompiler.compile(`
            var spread = { style : { width: "50%" } },
                a = <a {...spread} />;

            expect(a.style.width).toBe("50%");
        `);

        eval(code);
    });

    it("add an attribute on the node when no property is available", function () {
        var code = window.SurplusCompiler.compile(`
            var spread = { "aria-hidden" : "true" },
                a = <a {...spread} />;

            expect(a.getAttribute("aria-hidden")).toBe("true");
        `);

        eval(code);
    });

    it("remove properties from the node when no longer present", function () {
        var code = window.SurplusCompiler.compile(`
            var flag = S.data(true),
                spread = { id : "id" },
                a = <a {...flag() ? spread : {}} />;

            expect(a.id).toBe("id");
            flag(false);
            expect(a.id).toBe("");
        `);

        eval(code);
    });

    it("do not remove properties from earlier sets when that property is no longer present", function () {
        var code = window.SurplusCompiler.compile(`
            var flag = S.data(true),
                spread = { id : "id2" },
                a = <a
                        id="id1"
                        {...flag() ? spread : {}}
                    />;

            expect(a.id).toBe("id2");
            flag(false);
            expect(a.id).toBe("id1");
        `);

        eval(code);
    });

    it("do not remove properties from earlier spreads when that property is no longer present", function () {
        var code = window.SurplusCompiler.compile(`
            var flag = S.data(true),
                spread1 = { id : "id1" },
                spread2 = { id : "id2" },
                a = <a
                        {...flag() ? {} : spread1}
                        {...flag() ? spread2 : {}}
                    />;

            expect(a.id).toBe("id2");
            flag(false);
            expect(a.id).toBe("id1");
        `);

        eval(code);
    });

    it("convert JSX property names to DOM names", function () {
        var code = window.SurplusCompiler.compile(`
            var func = () => null,
                spread = { onClick : func };

            var a = <a {...spread} />;

            expect(a.onclick).toBe(func);
        `);

        eval(code);
    });

    it("convert HTML property names to DOM names", function () {
        var code = window.SurplusCompiler.compile(`
            var spread = { "class": "foo", "for" : "bar" };

            var label = <label {...spread} />;

            expect(label.className).toBe("foo");
            expect(label.htmlFor).toBe("bar");
        `);

        eval(code);
    });

    it("properties set by spreads are overriden by later properties", function () {
        var code = window.SurplusCompiler.compile(`
            var spread = { id : "id" };

            var a = <a {...spread} id="bar" />;

            expect(a.id).toBe("bar");
        `);

        eval(code);
    });

    it("properties set by spreads are overriden by later spreads", function () {
        var code = window.SurplusCompiler.compile(`
            var spread1 = { id : "foo" },
                spread2 = { id : "bar" };

            var a = <a {...spread1} {...spread2} />;

            expect(a.id).toBe("bar");
        `);

        eval(code);
    });

    it("properties set by spreads are overriden by later properties, even if the spread re-evaluates", function () {
        var code = window.SurplusCompiler.compile(`
            var id = S.data("foo");

            var a = <a {...{ id: id() }} id="bar" />;

            expect(a.id).toBe("bar");
            id("bleck");
            expect(a.id).toBe("bar");
        `);

        eval(code);
    });

    it("properties set by spreads are overriden by later spreads, even if the first re-evaluates", function () {
        var code = window.SurplusCompiler.compile(`
            var id = S.data("foo"),
                spread2 = { id: "bar" };

            var a = <a {...{ id: id() }} {...spread2} />;

            expect(a.id).toBe("bar");
            id("bleck");
            expect(a.id).toBe("bar");
        `);

        eval(code);
    });
});
