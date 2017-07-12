describe("@ syntax", function () {
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
        var code = window.SurplusPreprocessor.preprocess('                  \n\
            var props = null,                                               \n\
                SubComponent = p => props = p,                              \n\
                sub =                                                       \n\
                    <SubComponent foo="2">                                  \n\
                        <span>text</span>                                   \n\
                        some words                                          \n\
                        <!-- comment -->                                    \n\
                    </SubComponent>;                                        \n\
                                                                            \n\
            expect(props).not.toBe(null);                                   \n\
            expect(props.foo).toBe("2");                                    \n\
            expect(props.children.length).toBe(3);                          \n\
            expect(props.children[0] instanceof HTMLSpanElement).toBe(true);\n\
            expect(props.children[0].innerText).toBe("text");               \n\
            expect(props.children[1]).toBe("some words");                   \n\
            expect(props.children[2] instanceof Comment).toBe(true);        \n\
            expect(props.children[2].data).toBe(" comment ");               \n\
        ', { jsx: false });

        eval(code);
    });

    it("can have sub-components as children", function () {
        var code = window.SurplusPreprocessor.preprocess('                  \n\
            var SubComponent = p => <span>@p.text</span>,                   \n\
                div =                                                       \n\
                    <div>                                                   \n\
                        <SubComponent text="foo" />                         \n\
                    </div>;                                                 \n\
                                                                            \n\
            expect(div instanceof HTMLDivElement).toBe(true);               \n\
            expect(div.childNodes.length).toBe(1);                          \n\
            expect(div.childNodes[0] instanceof HTMLSpanElement).toBe(true);\n\
            expect(div.childNodes[0].innerText).toBe("foo");                \n\
        ', { jsx: false });

        eval(code);
    });
});
