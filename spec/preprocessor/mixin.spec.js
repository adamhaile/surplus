describe("HTML mixin", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("is called with its args then the node", function () {
        eval(htmlliterals.preprocess('                          \
            argsSpy.calls.reset(), nodeSpy.calls.reset();       \
                                                                \
            var a = <a @test("foo", 2) />;                      \
                                                                \
            expect(argsSpy).toHaveBeenCalledWith("foo", 2);     \
            expect(nodeSpy).toHaveBeenCalledWith(a, undefined); \
        '));
    });
});
