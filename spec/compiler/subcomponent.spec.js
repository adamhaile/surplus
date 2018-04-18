describe("subcomponent", function () {
    it("is called with a property object", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent foo="2" bar={3} />;

            expect(props).toEqual({ foo: "2", bar: 3 });
        `);
        eval(code);
    });

    it("can have no children, in which case props.children is not set", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent />;

            expect('children' in props).toBe(false);
        `);
        eval(code);
    });

    it("can have a single text child, which equals props.children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => (props = p, "sub"),
                sub = <SubComponent>some words</SubComponent>;

            expect(sub).toBe("sub");
            expect(props).not.toBe(null);
            expect(props.children).toBe("some words");
        `);
        eval(code);
    });

    it("can have a single node child, which equals props.children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => (props = p, "sub"),
                sub = <SubComponent><span>text</span></SubComponent>;

            expect(sub).toBe("sub");
            expect(props).not.toBe(null);
            expect(props.children instanceof HTMLSpanElement).toBe(true);
        `);
        eval(code);
    });

    it("can have a single computed child, whose value equals props.children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => (props = p, "sub"),
                sub = <SubComponent>{1}</SubComponent>;

            expect(sub).toBe("sub");
            expect(props).not.toBe(null);
            expect(props.children).toBe(1);
        `);
        eval(code);
    });

    it("can have a single subcomponent child, whose value equals props.children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => (props = p, "sub"),
                cprops = null,
                ChildComponent = p => (cprops = p, "child"),
                sub = <SubComponent foo={1}><ChildComponent bar={2} /></SubComponent>;

            expect(sub).toBe("sub");
            expect(props).toEqual({ foo: 1, children: "child" });
            expect(cprops).toEqual({ bar: 2});
        `);
        eval(code);
    });

    it("can have multiple children, passed as an array in props.children", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                cprops = null,
                ChildComponent = p => (cprops = p, "child"),
                sub =
                    <SubComponent foo="2">
                        <span>text</span>
                        some words
                        <!-- comment -->
                        {4}
                        <ChildComponent />
                    </SubComponent>;

            expect(props).not.toBe(null);
            expect(props.foo).toBe("2");
            expect(props.children.length).toBe(5);
            expect(props.children[0] instanceof HTMLSpanElement).toBe(true);
            expect(props.children[0].innerText).toBe("text");
            expect(props.children[1]).toBe("some words");
            expect(props.children[2] instanceof Comment).toBe(true);
            expect(props.children[2].data).toBe(" comment ");
            expect(props.children[3]).toBe(4);
            expect(props.children[4]).toBe("child");
        `);
        eval(code);
    });

    it("JSX children override any children in props", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent children="foo">bar</SubComponent>;

            expect(props).not.toBe(null);
            expect(props.children).toBe("bar");
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

    it("can be children, which are re-evaluated when a signal changes", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                count = 0,
                SubComponent = p => (props = p, count++),
                text = S.data("foo"),
                div = <div><SubComponent>{text()}</SubComponent></div>;

            expect(div instanceof HTMLDivElement).toBe(true);
            expect(count).toBe(1);
            expect(props).not.toBe(null);
            expect(props.children).toBe("foo");
            expect(div.innerText).toBe("0");
            text("bar");
            expect(count).toBe(2);
            expect(props.children).toBe("bar");
            expect(div.innerText).toBe("1");
        `);
        eval(code);
    });

    it("can have node children, whose update does not cause the subcomponent to re-evaluate", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                count = 0,
                SubComponent = p => (props = p, count++),
                text = S.data("foo"),
                div = <div><SubComponent><span>{text()}</span></SubComponent></div>;

            expect(div instanceof HTMLDivElement).toBe(true);
            expect(count).toBe(1);
            expect(props).not.toBe(null);
            expect(props.children instanceof HTMLSpanElement).toBe(true);
            expect(props.children.innerText).toBe("foo");
            expect(div.innerText).toBe("0");
            text("bar");
            expect(count).toBe(1);
            expect(props.children.innerText).toBe("bar");
            expect(div.innerText).toBe("0");
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

            expect(props).toEqual({ a: "2", b: true, c: 5, d: 6 });
        `);
        eval(code);
    });

    it("can have multiple fn properties", function () {
        var code = window.SurplusCompiler.compile(`
            var fn1 = el => el.p1 = "foo",
                fn2 = el => el.p2 = "bar",
                fn3 = el => el.p3 = "blech",
                SubComponent = p => props = p,
                sub = <SubComponent fn={fn1} fn={fn2} fn={fn3} />;

            expect(props).toEqual({p1: "foo", p2: "bar", p3: "blech"});
        `);
        eval(code);
    });

    it("is re-called when a child and a property changes", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                count = 0,
                SubComponent = p => (count++, props = p),
                data = S.data(1),
                div = <div>
                        <SubComponent foo={data()}/>
                    </div>;

            expect(count).toBe(1);
            expect(props).toEqual({ foo: 1 });
            data(2);
            expect(count).toBe(2);
            expect(props).toEqual({ foo: 2 });
        `);
        eval(code);
    });
    
    it("can have dotted identifiers", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                a = { b: { c: { sub: p => (props = p, "sub") } } },
                sub = <a.b.c.sub foo="2" bar={3}/>;

            expect(sub).toEqual("sub");
            expect(props).toEqual({ foo: "2", bar: 3 });
        `);
        eval(code);
    });

    it("can have dashed attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var props = null,
                SubComponent = p => props = p,
                sub = <SubComponent foo-bar={3}/>;

            expect(props).toEqual({ "foo-bar": 3 });
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
            expect(props).toEqual({ foo: "2", bar: 3 });
        `);
        eval(code);
    });
});
