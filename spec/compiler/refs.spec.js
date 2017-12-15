describe("JSX ref", () => {
    it("sets a variable to the value of the indicated node", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                a = <div ref={ref} />;

            expect(a instanceof HTMLDivElement).toBe(true);
            expect(ref).not.toBe(null);
            expect(a === ref).toBe(true);
        `);
        eval(code);
    });

    it("can reference nested nodes", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                a = <div><a ref={ref}></a></div>;

            expect(a instanceof HTMLDivElement).toBe(true);
            expect(ref).not.toBe(null);
            expect(ref instanceof HTMLAnchorElement).toBe(true);
            expect(a.childNodes[0] === ref).toBe(true);
        `);
        eval(code);
    });

    it("can be repeated for multiple references", () => {
        var code = window.SurplusCompiler.compile(`
            var ref1 = null,
                ref2 = null,
                a = <div ref={ref1} ref={ref2} />;

            expect(a instanceof HTMLDivElement).toBe(true);
            expect(ref1).not.toBe(null);
            expect(a === ref1).toBe(true);
            expect(ref2).not.toBe(null);
            expect(a === ref2).toBe(true);
        `);
        eval(code);
    });

    it("can reference top-level sub-components", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                Sub = p => "sub",
                a = <Sub ref={ref} />;

            expect(a).toBe("sub");
            expect(ref).not.toBe(null);
            expect(ref).toBe(a);
        `);
        eval(code);
    });

    it("can reference nested sub-components", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                Sub = p => "sub",
                a = <div><Sub ref={ref} /></div>;

            expect(a instanceof HTMLDivElement).toBe(true);
            expect(ref).not.toBe(null);
            expect(ref).toBe("sub");
        `);
        eval(code);
    });

    it("are not passed as properties to nodes", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                a = <div ref={ref} />;

            expect(a instanceof HTMLDivElement).toBe(true);
            expect(a === ref).toBe(true);
            expect("ref" in a).toBe(false);
        `);
        eval(code);
    });

    it("are not passed as properties to sub-components", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                props = null,
                Sub = p => (props = p, "sub"),
                a = <Sub ref={ref} />;

            expect(a).toBe("sub");
            expect(props).not.toBe(null);
            expect("ref" in props).toBe(false);
        `);
        eval(code);
    });

    it("are set for any nodes before fns run", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                refWhenParentFnCalled = null,
                refWhenPriorSiblingFnCalled = null,
                refWhenReffedFnCalled = null,
                refWhenChildFnCalled = null,
                refWhenLaterSiblingFnCalled = null,
                Sub = () => (refWhenSubCalled = ref, "sub"),
                a = <div fn={() => refWhenParentFnCalled = ref}>
                        <div fn={() => refWhenPriorSiblingFnCalled = ref}></div>
                        <div fn={() => refWhenReffedFnCalled = ref} ref={ref}>
                            <div fn={() => refWhenChildFnCalled = ref}></div>
                        </div>
                        <div fn={() => refWhenLaterSiblingFnCalled = ref}></div>
                    </div>;

            expect(refWhenParentFnCalled).not.toBe(null);
            expect(refWhenPriorSiblingFnCalled).not.toBe(null);
            expect(refWhenReffedFnCalled).not.toBe(null);
            expect(refWhenChildFnCalled).not.toBe(null);
            expect(refWhenLaterSiblingFnCalled).not.toBe(null);
        `);
        eval(code);
    });

    it("are not set in any children or prior siblings of sub-components", () => {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                refWhenParentFnCalled = null,
                refWhenPriorSiblingFnCalled = null,
                refWhenSubCalled = null,
                refWhenSubFnCalled = null,
                refWhenChildFnCalled = null,
                refWhenLaterSiblingFnCalled = null,
                Sub = () => (refWhenSubCalled = ref, "sub"),
                a = <div fn={() => refWhenParentFnCalled = ref}>
                        <div fn={() => refWhenPriorSiblingFnCalled = ref}></div>
                        <Sub fn={() => refWhenSubFnCalled = ref} ref={ref}>
                            <div fn={() => refWhenChildFnCalled = ref}></div>
                        </Sub>
                        <div fn={() => refWhenLaterSiblingFnCalled = ref}></div>
                    </div>;

            expect(refWhenParentFnCalled).toBe("sub");
            expect(refWhenPriorSiblingFnCalled).toBe(null);
            expect(refWhenSubCalled).toBe(null);
            expect(refWhenSubFnCalled).toBe("sub");
            expect(refWhenChildFnCalled).toBe(null);
            expect(refWhenLaterSiblingFnCalled).toBe("sub");
        `);
        eval(code);
    });
})