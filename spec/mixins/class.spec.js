describe("Surplus.class", function () {
    it("can toggle a class on or off based on a truthy value", function () {
        var input = document.createElement("input");

        SurplusMixins.class("true", true)(input);
        SurplusMixins.class("false", false)(input);
        SurplusMixins.class("one", 1)(input);
        SurplusMixins.class("zero", 0)(input);

        expect(input.classList.contains("true")).toBe(true);
        expect(input.classList.contains("false")).toBe(false);
        expect(input.classList.contains("one")).toBe(true);
        expect(input.classList.contains("zero")).toBe(false);
    });

    it("can toggle between two classes based on a truthy value", function () {
        var input = document.createElement("input");

        // on/off classes with static flag
        SurplusMixins.class("blech", "unblech", true)(input);
        SurplusMixins.class("garg", "ungarg", false)(input);

        expect(input.classList.contains("blech")).toBe(true);
        expect(input.classList.contains("unblech")).toBe(false);

        expect(input.classList.contains("garg")).toBe(false);
        expect(input.classList.contains("ungarg")).toBe(true);
    });
})
