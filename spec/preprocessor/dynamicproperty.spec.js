describe("JSX dynamic property", function () {
    it("sets a property to the value of a javascript expression", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var val = "foo",                                \n\
                input = <input value = { val } />;          \n\
                                                            \n\
            expect(input.value).toBe("foo");                \n\
        '));
    });

    it("can set multiple properties on the same node", function () {
        eval(window.SurplusPreprocessor.preprocess('           \n\
            var val = "foo",                                   \n\
                id = "id",                                     \n\
                input = <input value = { val } id = { id } />; \n\
                                                               \n\
            expect(input.value).toBe("foo");                   \n\
            expect(input.id).toBe("id");                       \n\
        '));
    });

    it("later static properties take precedence,", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var id = S.data("a"),                           \n\
                div = <div id={id()} id="b"></div>;         \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
        '));
    });

    it("later static properties take precedence, even if early ones are re-evaluated", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var id = S.data("a"),                           \n\
                div = <div id={id()} id="b"></div>;         \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
            id("c");                                        \n\
            expect(div.id).toBe("b");                       \n\
        '));
    });

    it("later dynamic properties take precedence,", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var id1 = S.data("a"),                          \n\
                id2 = S.data("b"),                          \n\
                div = <div id={id1()} id={id2()}></div>;    \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
        '));
    });

    it("later dynamic properties take precedence, even if early ones are re-evaluated", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var id1 = S.data("a"),                          \n\
                id2 = S.data("b"),                          \n\
                div = <div id={id1()} id={id2()}></div>;    \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
            id("c");                                        \n\
            expect(div.id).toBe("b");                       \n\
        '));
    });
});
