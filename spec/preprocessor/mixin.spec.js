describe("JSX ...mixin function", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("is called with its args then the node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \
            argsSpy.calls.reset(), nodeSpy.calls.reset();       \
                                                                \
            var a = <a {...test("foo", 2)} />;                  \
                                                                \
            expect(argsSpy).toHaveBeenCalledWith("foo", 2);     \
            expect(nodeSpy).toHaveBeenCalledWith(a, undefined); \
        '));
    });

    it("can set properties on the node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin = el => el.id = "id";                     \n\
                                                                \n\
            var a = <a {...mixin} />;                           \n\
                                                                \n\
            expect(a.id).toBe("id");                            \n\
        '));
    });

    it("properties set by mixins are overriden by later properties", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin = el => el.id = "foo";                    \n\
                                                                \n\
            var a = <a {...mixin} id="bar" />;                  \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by mixins are overriden by later mixins", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin1 = el => el.id = "foo",                   \n\
                mixin2 = el => el.id = "bar";                   \n\
                                                                \n\
            var a = <a {...mixin1} {...mixin2} />;              \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by mixins are overriden by later properties, even if the mixin re-evaluates", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var id = S.data("foo"),                             \n\
                mixin = el => el.id = id();                     \n\
                                                                \n\
            var a = <a {...mixin} id="bar" />;                  \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by mixins are overriden by later mixins, even if the first re-evaluates", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var id = S.data("foo"),                             \n\
                mixin1 = el => el.id = id(),                    \n\
                mixin2 = el => el.id = "bar";                   \n\
                                                                \n\
            var a = <a {...mixin1} {...mixin2} />;              \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });
});
