describe("JSX fn", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("is called with its args then the node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            argsSpy.calls.reset(), nodeSpy.calls.reset();       \n\
                                                                \n\
            var a = <a fn={test("foo", 2)} />;                  \n\
                                                                \n\
            expect(argsSpy).toHaveBeenCalledWith("foo", 2);     \n\
            expect(nodeSpy).toHaveBeenCalledWith(a, undefined); \n\
        '));
    });

    it("can pass state back to itself", function () {
        var code = window.SurplusPreprocessor.preprocess('            \n\
            var flag = S.data(true),                            \n\
                mixin = (el, state) =>                          \n\
                    (flag(), el.id = (state || 0) + 1);         \n\
                                                                \n\
            var a = <a fn={mixin} />;                           \n\
                                                                \n\
            expect(a.id).toBe("1");                             \n\
            flag(true);                                         \n\
            expect(a.id).toBe("2");                             \n\
        ');

        eval(code);
    });

    it("can be multiple for the same node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var fn1 = el => el.id = "foo",                      \n\
                fn2 = el => el.href = "http://bar/";            \n\
                fn3 = el => el.name = "blech";                  \n\
                                                                \n\
            var a = <a fn={fn1} fn={fn2} fn={fn3} />;           \n\
                                                                \n\
            expect(a.id).toBe("foo");                           \n\
            expect(a.href).toBe("http://bar/");                 \n\
            expect(a.name).toBe("blech");                       \n\
        '));
    });

    it("can set properties on the node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin = el => el.id = "id";                     \n\
                                                                \n\
            var a = <a fn={mixin} />;                           \n\
                                                                \n\
            expect(a.id).toBe("id");                            \n\
        '));
    });

    it("properties set by mixins are overriden by later properties", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin = el => el.id = "foo";                    \n\
                                                                \n\
            var a = <a fn={mixin} id="bar" />;                  \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by mixins are overriden by later mixins", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var mixin1 = el => el.id = "foo",                   \n\
                mixin2 = el => el.id = "bar";                   \n\
                                                                \n\
            var a = <a fn={mixin1} fn={mixin2} />;              \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by mixins are overriden by later properties, even if the mixin re-evaluates", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var id = S.data("foo"),                             \n\
                mixin = el => el.id = id();                     \n\
                                                                \n\
            var a = <a fn={mixin} id="bar" />;                  \n\
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
            var a = <a fn={mixin1} fn={mixin2} />;              \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });
});
