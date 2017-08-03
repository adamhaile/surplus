describe("JSX ref", () => {
    it("sets a variable to the value of the indicated node", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                a = <div ref={ref} />;                          \n\
                                                                \n\
            expect(a instanceof HTMLDivElement).toBe(true);     \n\
            expect(ref).not.toBe(null);                         \n\
            expect(a === ref).toBe(true);                       \n\
        ');
        eval(code);
    });

    it("can reference nested nodes", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                a = <div><a ref={ref}></a></div>;               \n\
                                                                \n\
            expect(a instanceof HTMLDivElement).toBe(true);     \n\
            expect(ref).not.toBe(null);                         \n\
            expect(ref instanceof HTMLAnchorElement).toBe(true);\n\
            expect(a.childNodes[0] === ref).toBe(true);         \n\
        ');
        eval(code);
    });

    it("can be repeated for multiple references", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref1 = null,                                    \n\
                ref2 = null,                                    \n\
                a = <div ref={ref1} ref={ref2} />;              \n\
                                                                \n\
            expect(a instanceof HTMLDivElement).toBe(true);     \n\
            expect(ref1).not.toBe(null);                        \n\
            expect(a === ref1).toBe(true);                      \n\
            expect(ref2).not.toBe(null);                        \n\
            expect(a === ref2).toBe(true);                      \n\
        ');
        eval(code);
    });

    it("can reference top-level sub-components", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                Sub = p => "sub",                               \n\
                a = <Sub ref={ref} />;                          \n\
                                                                \n\
            expect(a).toBe("sub");                              \n\
            expect(ref).not.toBe(null);                         \n\
            expect(ref).toBe(a);                                \n\
        ');
        eval(code);
    });

    it("can reference nested sub-components", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                Sub = p => "sub",                               \n\
                a = <div><Sub ref={ref} /></div>;               \n\
                                                                \n\
            expect(a instanceof HTMLDivElement).toBe(true);     \n\
            expect(ref).not.toBe(null);                         \n\
            expect(ref).toBe("sub");                            \n\
        ');
        eval(code);
    });

    it("are not passed as properties to nodes", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                a = <div ref={ref} />;                          \n\
                                                                \n\
            expect(a instanceof HTMLDivElement).toBe(true);     \n\
            expect(a === ref).toBe(true);                       \n\
            expect("ref" in a).toBe(false);                     \n\
        ');
        eval(code);
    });

    it("are not passed as properties to sub-components", () => {
        var code = window.SurplusPreprocessor.preprocess('      \n\
            var ref = null,                                     \n\
                props = null,                                   \n\
                Sub = p => (props = p, "sub"),                  \n\
                a = <Sub ref={ref} />;                          \n\
                                                                \n\
            expect(a).toBe("sub");                              \n\
            expect(props).not.toBe(null);                       \n\
            expect("ref" in props).toBe(false);                 \n\
        ');
        eval(code);
    });

    it("are set for any nodes before fns run", () => {
        var code = window.SurplusPreprocessor.preprocess('                        \n\
            var ref = null,                                                       \n\
                refWhenParentFnCalled = null,                                     \n\
                refWhenPriorSiblingFnCalled = null,                               \n\
                refWhenReffedFnCalled = null,                                     \n\
                refWhenChildFnCalled = null,                                      \n\
                refWhenLaterSiblingFnCalled = null,                               \n\
                Sub = () => (refWhenSubCalled = ref, "sub"),                      \n\
                a = <div fn={() => refWhenParentFnCalled = ref}>                  \n\
                        <div fn={() => refWhenPriorSiblingFnCalled = ref}></div>  \n\
                        <div fn={() => refWhenReffedFnCalled = ref} ref={ref}>    \n\
                            <div fn={() => refWhenChildFnCalled = ref}></div>     \n\
                        </div>                                                    \n\
                        <div fn={() => refWhenLaterSiblingFnCalled = ref}></div>  \n\
                    </div>;                                                       \n\
                                                                                  \n\
            expect(refWhenParentFnCalled).not.toBe(null);                         \n\
            expect(refWhenPriorSiblingFnCalled).not.toBe(null);                   \n\
            expect(refWhenReffedFnCalled).not.toBe(null);                         \n\
            expect(refWhenChildFnCalled).not.toBe(null);                          \n\
            expect(refWhenLaterSiblingFnCalled).not.toBe(null);                   \n\
        ');
        eval(code);
    });

    it("are not set in any children or prior siblings of sub-components", () => {
        var code = window.SurplusPreprocessor.preprocess('                        \n\
            var ref = null,                                                       \n\
                refWhenParentFnCalled = null,                                     \n\
                refWhenPriorSiblingFnCalled = null,                               \n\
                refWhenSubCalled = null,                                          \n\
                refWhenSubFnCalled = null,                                        \n\
                refWhenChildFnCalled = null,                                      \n\
                refWhenLaterSiblingFnCalled = null,                               \n\
                Sub = () => (refWhenSubCalled = ref, "sub"),                      \n\
                a = <div fn={() => refWhenParentFnCalled = ref}>                  \n\
                        <div fn={() => refWhenPriorSiblingFnCalled = ref}></div>  \n\
                        <Sub fn={() => refWhenSubFnCalled = ref} ref={ref}>       \n\
                            <div fn={() => refWhenChildFnCalled = ref}></div>     \n\
                        </Sub>                                                    \n\
                        <div fn={() => refWhenLaterSiblingFnCalled = ref}></div>  \n\
                    </div>;                                                       \n\
                                                                                  \n\
            expect(refWhenParentFnCalled).toBe("sub");                            \n\
            expect(refWhenPriorSiblingFnCalled).toBe(null);                       \n\
            expect(refWhenSubCalled).toBe(null);                                  \n\
            expect(refWhenSubFnCalled).toBe("sub");                               \n\
            expect(refWhenChildFnCalled).toBe(null);                              \n\
            expect(refWhenLaterSiblingFnCalled).toBe("sub");                      \n\
        ');
        eval(code);
    });
})