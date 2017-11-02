describe("HTML Entites", function () {
    it("are translated to Unicode chars in static text", function () {
        var code = window.SurplusCompiler.compile(`
            var dec     = <span>&#160;</span>,
                hex     = <span>&#x00A0;</span>,
                named   = <span>&nbsp;</span>,
                adecb   = <span>a&#160;b</span>,
                ahexb   = <span>a&#x00A0;b</span>,
                anamedb = <span>a&nbsp;b</span>,
                mixed   = <span>&#160;&#x00A0;&nbsp;&#160;&nbsp;&#x00A0;&#160;</span>,
                bogus   = <span>&bogus;</span>;
                                                   
            expect(dec.textContent).toBe("\\xa0");
            expect(hex.textContent).toBe("\\xa0");
            expect(named.textContent).toBe("\\xa0");
            expect(adecb.textContent).toBe("a\\xa0b");
            expect(ahexb.textContent).toBe("a\\xa0b");
            expect(anamedb.textContent).toBe("a\\xa0b");
            expect(mixed.textContent).toBe("\\xa0\\xa0\\xa0\\xa0\\xa0\\xa0\\xa0");
            expect(bogus.textContent).toBe("&bogus;");   
        `);
        eval(code);
    });
});