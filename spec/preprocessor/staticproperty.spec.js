describe("JSX static property", function () {
    it("sets a property on the given node", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var input = <input value="foo" />;              \n\
                                                            \n\
            expect(input.value).toBe("foo");                \n\
        '));
    });

    it("sets an attribute on the given node when no property is available", function () {
        eval(window.SurplusPreprocessor.preprocess('                \n\
            var input = <input aria-hidden="true" />;               \n\
                                                                    \n\
            expect(input.getAttribute("aria-hidden")).toBe("true"); \n\
        '));
    });

    it("can be valueless", function () {
        eval(window.SurplusPreprocessor.preprocess('                \n\
            var input = <input type="checkbox" checked />;          \n\
                                                                    \n\
            expect(input.checked).toBe(true);                       \n\
        '));
    });

    it("can set multiple properties on the same node", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var input = <input value="foo" id="id" />;      \n\
                                                            \n\
            expect(input.value).toBe("foo");                \n\
            expect(input.id).toBe("id");                    \n\
        '));
    });

    it("later properties take precedence", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var div = <div id="a" id="b"></div>;            \n\
                                                            \n\
            expect(div.id).toBe("b");                       \n\
        '));
    });
});
