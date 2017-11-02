describe("whitespace", function () {
    it("all-whitespace text nodes that span a line are removed", function () {
        var code = window.SurplusCompiler.compile(`
            var only  = <span>
                        </span>,
                start = <span>     
                        <br/></span>,
                inner = <span><br/>
                        <br/></span>,
                end   = <span><br/>    
                        </span>,
                presOnly  = <span>     </span>,
                presStart = <span>    <br/></span>,
                presInner = <span><br/>    <br/></span>,
                presEnd   = <span><br/>    </span>;

            expect(only.childNodes.length).toBe(0);

            expect(start.childNodes.length).toBe(1);
            expect(start.childNodes[0] instanceof HTMLBRElement).toBe(true);
            
            expect(inner.childNodes.length).toBe(2);
            expect(inner.childNodes[0] instanceof HTMLBRElement).toBe(true);
            expect(inner.childNodes[1] instanceof HTMLBRElement).toBe(true);

            expect(end.childNodes.length).toBe(1);
            expect(end.childNodes[0] instanceof HTMLBRElement).toBe(true);
                
            expect(presOnly.childNodes.length).toBe(1);
            expect(presOnly.childNodes[0] instanceof Text).toBe(true);

            expect(presStart.childNodes.length).toBe(2);
            expect(presStart.childNodes[0] instanceof Text).toBe(true);
            expect(presStart.childNodes[1] instanceof HTMLBRElement).toBe(true);

            expect(presInner.childNodes.length).toBe(3);
            expect(presInner.childNodes[0] instanceof HTMLBRElement).toBe(true);
            expect(presInner.childNodes[1] instanceof Text).toBe(true);
            expect(presInner.childNodes[2] instanceof HTMLBRElement).toBe(true);
            
            expect(presEnd.childNodes.length).toBe(2);
            expect(presEnd.childNodes[0] instanceof HTMLBRElement).toBe(true);
            expect(presEnd.childNodes[1] instanceof Text).toBe(true);

        `);
        eval(code);
    });

    it("extra whitespace in text nodes is trimmed to a single space", function () {
        var code = window.SurplusCompiler.compile(`
            var node = <span>     a     <br/>    
                            b    
                       </span>;

            expect(node.childNodes.length).toBe(3);
            expect(node.childNodes[0].data).toBe(" a ");
            expect(node.childNodes[2].data).toBe(" b ");
        `);
        eval(code);
    });
    
    it("extra whitespace trimming does not remove whitespace HTML entities", function () {
        var code = window.SurplusCompiler.compile(`
            var node = <span>   &nbsp;   a&nbsp;b   &nbsp;</span>;
            expect(node.childNodes.length).toBe(1);
            expect(node.childNodes[0].data).toBe(" \\xa0 a\\xa0b \\xa0");
        `);
        eval(code);
    });

    it("in <pre/> elements is not changed", function () {
        var code = window.SurplusCompiler.compile(`
            var pre = 
<pre>
    <i/>    a    <i/>
</pre>;

            expect(pre.childNodes.length).toBe(5);
            expect(pre.childNodes[0].data).toBe("\\n    ");
            expect(pre.childNodes[2].data).toBe("    a    ");
            expect(pre.childNodes[4].data).toBe("\\n");
        `);
        eval(code);
    })
});