describe("Html::property", function () {
    it("sets the given property", function () {
        var input = document.createElement("input");

        // static property value
        input.type = "radio";

        expect(input.type).toBe("radio");
    });
})
