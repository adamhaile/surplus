describe("upper-case subcomponent", function () {
    it("is called with a property object", function () {
        var code = window.SurplusPreprocessor.preprocess('              \
            var props = null,                                           \
                SubComponent = p => props = p,                          \
                sub = <SubComponent foo="2" bar={3}/>;                  \
                                                                        \
            expect(props).toEqual({ foo: "2", bar: 3, children: [] });  \
        ');

        eval(code);
    });

    it("can have children", function () {
        var code = window.SurplusPreprocessor.preprocess('                  \
            var props = null,                                               \
                SubComponent = p => props = p,                              \
                sub =                                                       \
                    <SubComponent foo="2">                                  \
                        <span>text</span>                                   \
                        some words                                          \
                        <!-- comment -->                                    \
                    </SubComponent>;                                        \
                                                                            \
            expect(props).not.toBe(null);                                   \
            expect(props.foo).toBe("2");                                    \
            expect(props.children.length).toBe(3);                          \
            expect(props.children[0] instanceof HTMLSpanElement).toBe(true);\
            expect(props.children[0].innerText).toBe("text");               \
            expect(props.children[1]).toBe("some words");                   \
            expect(props.children[2] instanceof Comment).toBe(true);        \
            expect(props.children[2].data).toBe(" comment ");               \
        ');

        eval(code);
    });

    it("can be children", function () {
        var code = window.SurplusPreprocessor.preprocess('                  \
            var SubComponent = p => <span>{p.text}</span>,                  \
                div =                                                       \
                    <div>                                                   \
                        <SubComponent text="foo" />                         \
                    </div>;                                                 \
                                                                            \
            expect(div instanceof HTMLDivElement).toBe(true);               \
            expect(div.childNodes.length).toBe(1);                          \
            expect(div.childNodes[0] instanceof HTMLSpanElement).toBe(true);\
            expect(div.childNodes[0].innerText).toBe("foo");                \
        ');

        eval(code);
    });
});
