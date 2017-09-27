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