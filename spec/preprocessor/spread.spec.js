describe("JSX ...spreads", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("add properties on the node", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var spread = { id : "id" },                         \n\
                a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.id).toBe("id");                            \n\
        ');

        eval(code);
    });

    it("add styles on the node", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var spread = { style : { width: "50%" } },          \n\
                a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.style.width).toBe("50%");                  \n\
        ');

        eval(code);
    });

    it("add an attribute on the node when no property is available", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var spread = { "aria-hidden" : "true" },            \n\
                a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.getAttribute("aria-hidden")).toBe("true"); \n\
        ');

        eval(code);
    });

    it("remove properties from the node when no longer present", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var flag = S.data(true),                            \n\
                spread = { id : "id" },                         \n\
                a = <a {...flag() ? spread : {}} />;            \n\
                                                                \n\
            expect(a.id).toBe("id");                            \n\
            flag(false);                                        \n\
            expect(a.id).toBe("");                              \n\
        ');

        eval(code);
    });

    it("do not remove properties from earlier sets when that property is no longer present", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var flag = S.data(true),                            \n\
                spread = { id : "id2" },                        \n\
                a = <a                                          \n\
                        id="id1"                                \n\
                        {...flag() ? spread : {}}               \n\
                    />;                                         \n\
                                                                \n\
            expect(a.id).toBe("id2");                           \n\
            flag(false);                                        \n\
            expect(a.id).toBe("id1");                           \n\
        ');

        eval(code);
    });

    it("do not remove properties from earlier spreads when that property is no longer present", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var flag = S.data(true),                            \n\
                spread1 = { id : "id1" },                       \n\
                spread2 = { id : "id2" },                       \n\
                a = <a                                          \n\
                        {...flag() ? {} : spread1}              \n\
                        {...flag() ? spread2 : {}}              \n\
                    />;                                         \n\
                                                                \n\
            expect(a.id).toBe("id2");                           \n\
            flag(false);                                        \n\
            expect(a.id).toBe("id1");                           \n\
        ');

        eval(code);
    });

    it("convert JSX property names to DOM names", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var func = () => null,                              \n\
                spread = { onClick : func };                    \n\
                                                                \n\
            var a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.onclick).toBe(func);                       \n\
        ');

        eval(code);
    });

    it("properties set by spreads are overriden by later properties", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var spread = { id : "id" };                         \n\
                                                                \n\
            var a = <a {...spread} id="bar" />;                 \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        ');

        eval(code);
    });

    it("properties set by spreads are overriden by later spreads", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var spread1 = { id : "foo" },                       \n\
                spread2 = { id : "bar" };                       \n\
                                                                \n\
            var a = <a {...spread1} {...spread2} />;            \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        ');

        eval(code);
    });

    it("properties set by spreads are overriden by later properties, even if the spread re-evaluates", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var id = S.data("foo");                             \n\
                                                                \n\
            var a = <a {...{ id: id() }} id="bar" />;           \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        ');

        eval(code);
    });

    it("properties set by spreads are overriden by later spreads, even if the first re-evaluates", function () {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var id = S.data("foo"),                             \n\
                spread2 = { id: "bar" };                        \n\
                                                                \n\
            var a = <a {...{ id: id() }} {...spread2} />;       \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        ');

        eval(code);
    });
});
