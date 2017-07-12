describe("JSX static property", function () {
    it("sets a property on the given node", function () {
        eval(window.SurplusPreprocessor.preprocess('        \n\
            var input = <input value="foo" />;              \n\
                                                            \n\
            expect(input.value).toBe("foo");                \n\
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
