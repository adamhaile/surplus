describe("Svg objects creatation", function () {

    it("Svg element is in the middle of other elements", function () {
        var code = window.SurplusPreprocessor.preprocess(`
            var element = 
            <section>
                <h1>Svg Section</h1>
                <div>
                    <h2>Svg test</h2>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                    <span>svg circle</span>
                </div>
                <footer>svg</footer>
            </section>;
            expect(element.querySelector("circle") instanceof SVGCircleElement).toBe(true)
        `);

        eval(code);
    });

    it("Svg element is the first of the parent element", function () {
        var code = window.SurplusPreprocessor.preprocess(`
            var element = 
            <section>
                <h1>Svg Section</h1>
                <div>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                </div>
                <footer>svg</footer>
            </section>;
            expect(element.querySelector("circle") instanceof SVGCircleElement).toBe(true)
        `);

        eval(code);
    });

    it("Svg element is the latter of the parent element", function () {
        var code = window.SurplusPreprocessor.preprocess(`
            var element = 
            <section>
                <h1>Svg Section</h1>
                <div>
                    <h2>Svg test</h2>
                    <svg>
                        <circle cx="100" cy="100" r="50" fill="red"></circle>
                    </svg>
                </div>
                <footer>svg</footer>
            </section>;
            expect(element.querySelector("circle") instanceof SVGCircleElement).toBe(true)
        `);

        eval(code);
    });

    it("Svg element is the root", function () {
        var code = window.SurplusPreprocessor.preprocess(`
            <svg>
                <circle cx="100" cy="100" r="50" fill="red"></circle>
            </svg>
        `);

        eval(code);
    });
});