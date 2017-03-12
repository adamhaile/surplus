describe("HTML dynamic property", function () {
    it("sets a property to the value of a javascript expression", function () {
        eval(htmlliterals.preprocess('                      \
            var val = "foo",                                \
                input = <input value = val />;              \
                                                            \
            expect(input.value).toBe("foo");                \
        '));
    });
});
