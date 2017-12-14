describe("subcomponent", function () {
    it("is called with a property object", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent foo="2" bar={3}/>;

            expect(props).toEqual({ foo: "2", bar: 3, children: [] });
        `);
        eval(code);
    });

    it("can have children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub =
                    <SubComponent foo="2">
                        <span>text</span>
                        some words
                        <!-- comment -->
                    </SubComponent>;

            expect(props).not.toBe(null);
            expect(props.foo).toBe("2");
            expect(props.children.length).toBe(3);
            expect(props.children[0] instanceof HTMLSpanElement).toBe(true);
            expect(props.children[0].innerText).toBe("text");
            expect(props.children[1]).toBe("some words");
            expect(props.children[2] instanceof Comment).toBe(true);
            expect(props.children[2].data).toBe(" comment ");
        `);
        eval(code);
    });

    it("can have a single text child", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => (props = p, "sub"),
                sub = <SubComponent>some words</SubComponent>;

            expect(sub).toBe("sub");
            expect(props).not.toBe(null);
            expect(props.children.length).toBe(1);
            expect(typeof props.children[0]).toBe("string");
            expect(props.children[0]).toBe("some words");
        `);
        eval(code);
    });

    it("can be children", function () {
        var code = window.SurplusCompiler.compile(`
            var SubComponent = p => <span>{p.text}</span>,
                div =
                    <div>
                        <SubComponent text="foo" />
                    </div>;

            expect(div instanceof HTMLDivElement).toBe(true);
            expect(div.childNodes.length).toBe(1);
            expect(div.childNodes[0] instanceof HTMLSpanElement).toBe(true);
            expect(div.childNodes[0].innerText).toBe("foo");
        `);
        eval(code);
    });

    it("can have spread and fn properties", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                mixin = p => p.d = 6,
                sub = <SubComponent
                        a="1"
                        {...{ a: "2", b: true, c: "4"}}
                        c={5}
                        fn={mixin} />;

            expect(props).toEqual({ a: "2", b: true, c: 5, children: [], d: 6 });
        `);
        eval(code);
    });

    it("is re-called when a property changes", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent foo="2" bar={3}/>;

            expect(props).toEqual({ foo: "2", bar: 3, children: [] });
        `);
        eval(code);
    });

    it("can have dotted identifiers", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                a = { b: { c: { sub: p => (props = p, "sub") } } },
                sub = <a.b.c.sub foo="2" bar={3}/>;

            expect(sub).toEqual("sub");
            expect(props).toEqual({ foo: "2", bar: 3, children: [] });
        `);
        eval(code);
    });

    it("can be children with dotted identifiers", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                a = { b: { c: { sub: p => (props = p, "sub") } } },
                div = <div><a.b.c.sub foo="2" bar={3}/></div>;

            expect(div instanceof HTMLDivElement).toBe(true);
            expect(div.childNodes.length).toBe(1);
            expect(div.childNodes[0] instanceof Text).toBe(true);
            expect(div.childNodes[0].data).toBe("sub");
            expect(props).toEqual({ foo: "2", bar: 3, children: [] });
        `);
        eval(code);
    });
});
