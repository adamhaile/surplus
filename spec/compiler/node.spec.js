describe("HTML node literal", function () {
    it("converts inline HTML to DOM objects", function () {
        var code = window.SurplusCompiler.compile(`
            var div = <div></div>,                                            
                h1 = <h1>title</h1>,                                          
                ul  = <ul>                                                    
                        <li>one</li>                                          
                        <li>two</li>                                          
                      </ul>,                                                  
                a   = <a href="#">link</a>;                                   
                                                                              
            expect(div instanceof HTMLDivElement).toBe(true);                 
            expect(div.childNodes.length).toBe(0);                            
                                                                              
            expect(h1 instanceof HTMLHeadingElement).toBe(true);              
            expect(h1.innerText).toBe("title");                               
                                                                              
            expect(ul instanceof HTMLUListElement).toBe(true);                
            expect(ul.childNodes.length).toBe(2);                             
            expect(ul.childNodes[0] instanceof HTMLLIElement).toBe(true);     
            expect(ul.childNodes[0].childNodes.length).toBe(1);               
            expect(ul.childNodes[0].childNodes[0] instanceof Text).toBe(true);
            expect(ul.childNodes[0].childNodes[0].data).toBe("one");          
            expect(ul.childNodes[1] instanceof HTMLLIElement).toBe(true);     
            expect(ul.childNodes[1].childNodes.length).toBe(1);               
            expect(ul.childNodes[1].childNodes[0] instanceof Text).toBe(true);
            expect(ul.childNodes[1].childNodes[0].data).toBe("two");          
                                                                              
            expect(a instanceof HTMLAnchorElement).toBe(true);                
            expect(a.getAttribute("href")).toBe("#");                         
            expect(a.childNodes.length).toBe(1);                              
            expect(a.childNodes[0] instanceof Text).toBe(true);               
            expect(a.childNodes[0].data).toBe("link");                        
        `);

        eval(code);
    });

    it("preserves static attributes", function () {
        var code = window.SurplusCompiler.compile('      \
            var a = <a href="#" target="top"></a>;              \
                                                                \
            expect(a.getAttribute("href")).toBe("#");           \
        ');

        eval(code);
    });
    
    it("preserves initial static text in presence of dynamic properties (issue #15)", () => {  
        const code = window.SurplusCompiler.compile(`
            const dv = (
                <div fn={() => {}}>
                    1<br />
                    2<br />
                </div>
            );

            expect(dv.outerHTML).toBe("<div>1<br>2<br></div>");
        `);

        eval(code);
    });
});
