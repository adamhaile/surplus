describe("JSX syntax", function () {
    it("sets a property to the value of a JSX expression", function () {
        eval(htmlliterals.preprocess('                      \
            var val = "foo",                                \
                input = <input value = {val} />;            \
                                                            \
            expect(input.value).toBe("foo");                \
        ', { jsx: true }));
    });

    it("inserts the value of a JSX expression into a node's children", function () {
        eval(htmlliterals.preprocess('                      \
            var val = "foo",                                \
                span = <span>{val}</span>;                  \
                                                            \
            expect(span.innerText).toBe("foo");             \
        ', { jsx: true }));
    });
});
