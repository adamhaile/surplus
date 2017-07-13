describe("JSX ...spreads", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("add properties on the node", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var spread = { id : "id" };                         \n\
                                                                \n\
            var a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.id).toBe("id");                            \n\
        '));
    });

    it("convert JSX property names to DOM names", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var func = () => null,                              \n\
                spread = { onClick : func };                    \n\
                                                                \n\
            var a = <a {...spread} />;                          \n\
                                                                \n\
            expect(a.onclick).toBe(func);                       \n\
        '));
    });

    it("properties set by spreads are overriden by later properties", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var spread = { id : "id" };                         \n\
                                                                \n\
            var a = <a {...spread} id="bar" />;                 \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by spreads are overriden by later spreads", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var spread1 = { id : "foo" },                       \n\
                spread2 = { id : "bar" };                       \n\
                                                                \n\
            var a = <a {...spread1} {...spread2} />;            \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by spreads are overriden by later properties, even if the spread re-evaluates", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var id = S.data("foo");                             \n\
                                                                \n\
            var a = <a {...{ id: id() }} id="bar" />;           \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });

    it("properties set by spreads are overriden by later spreads, even if the first re-evaluates", function () {
        eval(window.SurplusPreprocessor.preprocess('            \n\
            var id = S.data("foo"),                             \n\
                spread2 = el => el.id = "bar";                  \n\
                                                                \n\
            var a = <a {...{ id: id() }} {...spread2} />;       \n\
                                                                \n\
            expect(a.id).toBe("bar");                           \n\
            id("bleck");                                        \n\
            expect(a.id).toBe("bar");                           \n\
        '));
    });
});
