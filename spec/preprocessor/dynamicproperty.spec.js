describe("JSX dynamic property", function () {
    it("sets a property to the value of a javascript expression", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var val = "foo",                                \n\
                input = <input value = { val } />;          \n\
                                                            \n\
            expect(input.value).toBe("foo");                \n\
        ');
        eval(code);
    });

    it("sets an attribute to the value of the javascript expression when no property is available", function () {
        var code = window.SurplusPreprocessor.preprocess('          \n\
            var val = "true",                                       \n\
                input = <input aria-hidden = { val } />;            \n\
                                                                    \n\
            expect(input.getAttribute("aria-hidden")).toBe("true"); \n\
        ');
        eval(code);
    });

    it("can set multiple properties on the same node", function () {
        var code = window.SurplusPreprocessor.preprocess('     \n\
            var val = "foo",                                   \n\
                id = "id",                                     \n\
                input = <input value = { val } id = { id } />; \n\
                                                               \n\
            expect(input.value).toBe("foo");                   \n\
            expect(input.id).toBe("id");                       \n\
        ');
        eval(code);
    });

    it("later static properties take precedence,", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var id = S.data("a"),                           \n\
                div = <div id={id()} id="b"></div>;         \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
        ');
        eval(code);
    });

    it("later static properties take precedence, even if early ones are re-evaluated", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var id = S.data("a"),                           \n\
                div = <div id={id()} id="b"></div>;         \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
            id("c");                                        \n\
            expect(div.id).toBe("b");                       \n\
        ');
        eval(code);
    });

    it("later dynamic properties take precedence,", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var id1 = S.data("a"),                          \n\
                id2 = S.data("b"),                          \n\
                div = <div id={id1()} id={id2()}></div>;    \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
        ');
        eval(code);
    });

    it("later dynamic properties take precedence, even if early ones are re-evaluated", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var id1 = S.data("a"),                          \n\
                id2 = S.data("b"),                          \n\
                div = <div id={id1()} id={id2()}></div>;    \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
            id1("c");                                       \n\
            expect(div.id).toBe("b");                       \n\
        ');
        eval(code);
    });

    it("can set sub-properties", function () {
        var code = window.SurplusPreprocessor.preprocess('  \n\
            var width = S.data("50%"),                      \n\
                input = <input style.width={width()} />;    \n\
                                                            \n\
            expect(input.style.width).toBe("50%");          \n\
            width("75%");                                   \n\
            expect(input.style.width).toBe("75%");          \n\
        ');
        eval(code);
    });

    it("can set sub-properties with objects", function () {
        var code = window.SurplusPreprocessor.preprocess('   \n\
            var width = S.data("50%"),                       \n\
                input = <input style={{ width: width() }} />;\n\
                                                             \n\
            expect(input.style.width).toBe("50%");           \n\
            width("75%");                                    \n\
            expect(input.style.width).toBe("75%");           \n\
        ');
        eval(code);
    });

    it("can set sub-properties with objects multiple times", function () {
        var code = window.SurplusPreprocessor.preprocess('       \n\
            var override = S.data(true),                         \n\
                input = <input                                   \n\
                    style={{ width: "75%" }}                     \n\
                    style={ override() ? { width: "50%" } : {} } \n\
                />;                                              \n\
                                                                 \n\
            expect(input.style.width).toBe("50%");               \n\
            override(false);                                     \n\
            expect(input.style.width).toBe("75%");               \n\
        ');
        eval(code);
    });
});
