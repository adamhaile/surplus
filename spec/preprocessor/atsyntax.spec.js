describe("JSX syntax", function () {
    it("sets a property to the value of a JSX expression", function () {
        eval(window.SurplusPreprocessor.preprocess('        \
            var val = "foo",                                \
                input = <input value = val />;              \
                                                            \
            expect(input.value).toBe("foo");                \
        ', { jsx: false }));
    });

    it("inserts the value of a JSX expression into a node's children", function () {
        eval(window.SurplusPreprocessor.preprocess('        \
            var val = "foo",                                \
                span = <span>@val</span>;                   \
                                                            \
            expect(span.innerText).toBe("foo");             \
        ', { jsx: false }));
    });

    it("calls upper-cased sub-components", function () {
        var code = window.SurplusPreprocessor.preprocess('              \
            var props = null,                                           \
                SubComponent = p => props = p,                          \
                sub = <SubComponent foo="2" bar=3/>;                    \
                                                                        \
            expect(props).toEqual({ foo: "2", bar: 3, children: [] });  \
        ', { jsx: false });

        eval(code);
    });

    it("can have sub-components with children", function () {
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
        ', { jsx: false });

        eval(code);
    });

    it("can have sub-components as children", function () {
        var code = window.SurplusPreprocessor.preprocess('                  \
            var SubComponent = p => <span>@p.text</span>,                   \
                div =                                                       \
                    <div>                                                   \
                        <SubComponent text="foo" />                         \
                    </div>;                                                 \
                                                                            \
            expect(div instanceof HTMLDivElement).toBe(true);               \
            expect(div.childNodes.length).toBe(1);                          \
            expect(div.childNodes[0] instanceof HTMLSpanElement).toBe(true);\
            expect(div.childNodes[0].innerText).toBe("foo");                \
        ', { jsx: false });

        eval(code);
    });
});
