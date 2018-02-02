describe("SVG nodes", function () {

    it("can be a top-level <svg> element", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = 
                <svg>
                    <circle cx="100" cy="100" r="50" fill="red"></circle>
                </svg>;

            expect(svg instanceof SVGSVGElement).toBe(true);
            expect(svg.childNodes[0] instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can be a top-level SVG element other than <svg>", function () {
        var code = window.SurplusCompiler.compile(`
            var circle = <circle cx="100" cy="100" r="50" fill="red"></circle>;

            expect(circle instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can be a single top-level SVG element", function () {
        var code = window.SurplusCompiler.compile(`
            var circle = <circle></circle>;

            expect(circle instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can be a single top-level SVG element with a class", function () {
        var code = window.SurplusCompiler.compile(`
            var circle = <circle class="foo"></circle>;

            expect(circle instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can have static text content", function () {
        var code = window.SurplusCompiler.compile(`
            var text = <text>foo</text>;

            expect(text instanceof SVGTextElement).toBe(true);
            expect(text.textContent).toBe("foo");
        `);

        eval(code);
    });

    it("can have dynamic text content", function () {
        var code = window.SurplusCompiler.compile(`
            var foo = S.data("foo"),
                text = <text>{foo()}</text>;

            expect(text instanceof SVGTextElement).toBe(true);
            expect(text.textContent).toBe("foo");
            foo("bar");
            expect(text.textContent).toBe("bar");
        `);

        eval(code);
    });

    it("can have static child content", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = <g><text></text></g>;

            expect(svg instanceof SVGGElement).toBe(true);
            expect(svg.firstChild instanceof SVGTextElement).toBe(true);
        `);

        eval(code);
    });

    it("can have dynamic child content", function () {
        var code = window.SurplusCompiler.compile(`
            var child = S.data(<text></text>),
                svg = <g>{child()}></g>;

            expect(svg instanceof SVGGElement).toBe(true);
            expect(svg.firstChild instanceof SVGTextElement).toBe(true);
            child(<rect></rect>);
            expect(svg.firstChild instanceof SVGRectElement).toBe(true);
        `);

        eval(code);
    });

    it("can be an <svg> element that is the first child of an html element", function () {
        var code = window.SurplusCompiler.compile(`
            var div = 
                <div>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                </div>;

            expect(div.childNodes[0] instanceof SVGSVGElement).toBe(true);
            expect(div.childNodes[0].childNodes[0] instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can be an <svg> element that is in the middle of other html elements", function () {
        var code = window.SurplusCompiler.compile(`
            var div = 
                <div>
                    <h2>Svg test</h2>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                    <span>svg circle</span>
                </div>;

            expect(div.childNodes[1] instanceof SVGSVGElement).toBe(true);
            expect(div.childNodes[1].childNodes[0] instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can be an <svg> element that is the last child of an html element", function () {
        var code = window.SurplusCompiler.compile(`
            var div = 
                <div>
                    <h2>Svg test</h2>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                </div>;

            expect(div.childNodes[1] instanceof SVGSVGElement).toBe(true);
            expect(div.childNodes[1].childNodes[0] instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can have html elements inside <foreignObject> tags", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = 
                <svg>
                    <foreignObject>
                        <div>Html</div>
                    </foreignObject>
                </svg>;

            expect(svg instanceof SVGSVGElement).toBe(true);
            expect(svg.childNodes[0] instanceof SVGForeignObjectElement).toBe(true);
            expect(svg.childNodes[0].childNodes[0] instanceof HTMLDivElement).toBe(true);
            expect(svg.childNodes[0].childNodes[0].innerText).toBe("Html");
        `);

        eval(code);
    });

    it("are distinguished from nodes with same prefix", function () {
        var code = window.SurplusCompiler.compile(`
            var dom = <textField>Foo</textField>;

            expect(dom instanceof SVGElement).toBe(false);
        `);

        eval(code);
    });

    it("can have dynamic attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var cx = S.data("100"),
                circle = <circle cx={cx()} cy="100" r="50" fill="red"></circle>;

            expect(circle.getAttribute("cx")).toBe("100");
            cx("50");
            expect(circle.getAttribute("cx")).toBe("50");
        `);

        eval(code);
    });

    it("can have spread attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var cx = S.data("100"),
                circle = <circle {...{ cx: cx() }} cy="100" r="50" fill="red"></circle>;

            expect(circle.getAttribute("cx")).toBe("100");
            cx("50");
            expect(circle.getAttribute("cx")).toBe("50");
        `);

        eval(code);
    });

    it("can have xlink namespaced attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var circle = <circle xlinkHref="#foo"></circle>;

            expect(circle.getAttributeNS("http://www.w3.org/1999/xlink", "href")).toBe("#foo");
        `);

        eval(code);
    });

    it("can have xml namespaced attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var circle = <circle xmlRole="foo"></circle>;

            expect(circle.getAttributeNS("http://www.w3.org/XML/1998/namespace", "role")).toBe("foo");
        `);

        eval(code);
    });

    it("does not translate attributes to HTML property names", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = <svg class="foo" for="baz" cx="100" cy="100" r="50" fill="red"></svg>,
                svg2 = <svg class={"foo"} for={"baz"} cx="100" cy="100" r="50" fill="red"></svg>,
                svg3 = <svg {...{ class: "foo", for: "baz" }} cx="100" cy="100" r="50" fill="red"></svg>;

            [ svg, svg2, svg3 ].forEach(svg => {
                expect(svg.hasAttribute("className")).toBe(false);
                expect(svg.getAttribute("class")).toBe("foo");
                expect(svg.hasAttribute("htmlFor")).toBe(false);
                expect(svg.getAttribute("for")).toBe("baz");
            });
        `);

        eval(code);
    });

    it("does translate HTML property names to attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = <svg className="foo" htmlFor="baz" cx="100" cy="100" r="50" fill="red"></svg>,
                svg2 = <svg className={"foo"} htmlFor={"baz"} cx="100" cy="100" r="50" fill="red"></svg>,
                svg3 = <svg {...{ className: "foo", htmlFor: "baz" }} cx="100" cy="100" r="50" fill="red"></svg>;

            [ svg, svg2, svg3 ].forEach(svg => {
                expect(svg.hasAttribute("className")).toBe(false);
                expect(svg.getAttribute("class")).toBe("foo");
                expect(svg.hasAttribute("htmlFor")).toBe(false);
                expect(svg.getAttribute("for")).toBe("baz");
            });
        `);

        eval(code);
    });

    it("does translate JSX property names to attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var svg = <line strokeWidth="100"></line>,
                svg2 = <line strokeWidth={"100"}></line>,
                svg3 = <line {...{ strokeWidth: "100" }}></line>;

            [ svg, svg2, svg3 ].forEach(svg => {
                expect(svg.hasAttribute("strokeWidth")).toBe(false);
                expect(svg.getAttribute("stroke-width")).toBe("100");
            });
        `);

        eval(code);
    });

    it("can handle eccentrically capitalized SVG attributes", function () {
        var code = window.SurplusCompiler.compile(`
            var line, svg = 
                <svg viewBox="0 0 100 100">
                    <line ref={line} x1={0} y1={50} x2={100} y2={50} stroke="black" strokeWidth={100} />
                </svg>;
                
            expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
            expect(line.getAttribute("stroke-width")).toBe("100");
        `);

        eval(code);
    });

    it("can have refs", function () {
        var code = window.SurplusCompiler.compile(`
            var ref = null,
                circle = <circle ref={ref} cx="100" cy="100" r="50" fill="red"></circle>;

            expect(ref).not.toBe(null);
            expect(ref instanceof SVGCircleElement).toBe(true);
        `);

        eval(code);
    });

    it("can have fns", function () {
        var code = window.SurplusCompiler.compile(`
            var fn = el => el.id = "foo",
                circle = <circle fn={fn} cx="100" cy="100" r="50" fill="red"></circle>;

            expect(circle.id).toBe("foo");
        `);

        eval(code);
    });
});