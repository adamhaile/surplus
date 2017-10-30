describe("JSX fn", function () {
    var nodeSpy = jasmine.createSpy(),
        argsSpy = jasmine.createSpy().and.returnValue(nodeSpy),
        test = argsSpy;

    it("is called with its args then the node", function () {
        eval(window.SurplusCompiler.compile(`
            argsSpy.calls.reset(), nodeSpy.calls.reset();      
                                                               
            var a = <a fn={test("foo", 2)} />;                 
                                                               
            expect(argsSpy).toHaveBeenCalledWith("foo", 2);    
            expect(nodeSpy).toHaveBeenCalledWith(a, undefined);
        `));
    });

    it("can pass state back to itself", function () {
        var code = window.SurplusCompiler.compile(`     
            var flag = S.data(true),                    
                mixin = (el, state) =>                  
                    (flag(), el.id = (state || 0) + 1); 
                                                        
            var a = <a fn={mixin} />;                   
                                                        
            expect(a.id).toBe("1");                     
            flag(true);                                 
            expect(a.id).toBe("2");                     
        `);

        eval(code);
    });

    it("can be repeated for multiple fns on the same node", function () {
        eval(window.SurplusCompiler.compile(`         
            var fn1 = el => el.id = "foo",            
                fn2 = el => el.href = "http://bar/";  
                fn3 = el => el.name = "blech";        
                                                      
            var a = <a fn={fn1} fn={fn2} fn={fn3} />; 
                                                      
            expect(a.id).toBe("foo");                 
            expect(a.href).toBe("http://bar/");       
            expect(a.name).toBe("blech");             
        `));
    });

    it("can set properties on the node", function () {
        eval(window.SurplusCompiler.compile(`
            var mixin = el => el.id = "id";  
                                             
            var a = <a fn={mixin} />;        
                                             
            expect(a.id).toBe("id");         
        `));
    });

    it("properties set by fns override named properties", function () {
        eval(window.SurplusCompiler.compile(`  
            var mixin = el => el.id = "foo";   
                                               
            var a = <a fn={mixin} id="bar" />; 
                                               
            expect(a.id).toBe("foo");          
        `));
    });

    it("properties set by fns are overriden by later fns", function () {
        eval(window.SurplusCompiler.compile(`
            var mixin1 = el => el.id = "foo",                   
                mixin2 = el => el.id = "bar";                   
                                                                
            var a = <a fn={mixin1} fn={mixin2} />;              
                                                                
            expect(a.id).toBe("bar");                           
        `));
    });

    it("properties set by fns are overriden by other fns when the other fn re re-evaluates", function () {
        eval(window.SurplusCompiler.compile(`
            var id = S.data("foo"),           
                fn1 = el => el.id = id(),     
                fn2 = el => el.id = "bar";    
                                            
            var a = <a fn={fn1} fn={fn2} />;  
                                            
            expect(a.id).toBe("bar");         
            id("bleck");                      
            expect(a.id).toBe("bleck");         
        `));
    });

    it("can be aliased as fn1, fn2, etc.", function () {
        eval(window.SurplusCompiler.compile(`               
            var fn1   = el => el.id = "foo",                
                fn2   = el => el.href = "http://bar/",      
                fn007 = el => el.name = "bond";             
                                                            
            var a = <a fn1={fn1} fn2={fn2} fn007={fn007} />;
                                                            
            expect(a.id).toBe("foo");                       
            expect(a.href).toBe("http://bar/");             
            expect(a.name).toBe("bond");                    
        `));
    });
});
