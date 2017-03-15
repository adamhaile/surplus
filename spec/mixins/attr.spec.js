describe("Surplus.attr", function () {
    it("sets the given attribute", function () {
        var input = document.createElement("input");

        // static property value
        SurplusMixins.attr("type", "radio")(input);

        expect(input.getAttribute("type")).toBe("radio");
    });
})
