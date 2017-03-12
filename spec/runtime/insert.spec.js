describe("Html::insert", function () { 
    // <div>before<!-- insert -->after</div>
    var container = document.createElement("div");
    container.appendChild(document.createTextNode("before"));
    container.appendChild(document.createTextNode(""));
    container.appendChild(document.createTextNode("after"));

    it("inserts nothing for null", function () {
        var res = insert(null);
        expect(res.innerHTML)
        .toBe("beforeafter");
        expect(res.childNodes.length).toBe(3);
    });

    it("can insert strings", function () {
        var res = insert("foo");
        expect(res.innerHTML)
        .toBe("beforefooafter");
        expect(res.childNodes.length).toBe(3);
    });

    it("can insert a node", function () {
        var node = document.createElement("span");
        node.innerText = "foo";
        expect(insert(node).innerHTML)
        .toBe("before<span>foo</span>after");
    });

    it("can re-insert a node, thereby moving it", function () {
        var node = document.createElement("span");
        node.innerText = "foo";

        var first = insert(node),
            second = insert(node);

            expect(first.innerHTML)
            .toBe("beforeafter");
            expect(second.innerHTML)
            .toBe("before<span>foo</span>after");
    });

    /* fragments disabled for now, possibly permanent
    it("can insert a fragment", function () {
        // <span>foo</span>inside<span>bar</span>
        var frag = document.createDocumentFragment();
        var span1 = document.createElement("span");
        span1.innerText = "foo";
        frag.appendChild(span1);
        frag.appendChild(document.createTextNode("inside"));
        var span2 = document.createElement("span");
        span2.innerText = "bar";
        frag.appendChild(span2);
        frag.originalNodes = Array.prototype.slice.apply(frag.childNodes);

        expect(insert(frag).innerHTML)
        .toBe("before<span>foo</span>inside<span>bar</span><!-- insert -->after");
    });

    it("can re-insert a fragment, thereby moving it", function () {
        // <span>foo</span>inside<span>bar</span>
        var frag = document.createDocumentFragment();
        var span1 = document.createElement("span");
        span1.innerText = "foo";
        frag.appendChild(span1);
        frag.appendChild(document.createTextNode("inside"));
        var span2 = document.createElement("span");
        span2.innerText = "bar";
        frag.appendChild(span2);
        frag.originalNodes = Array.prototype.slice.apply(frag.childNodes);

        var first = insert(frag),
            second = insert(frag);

            expect(first.innerHTML)
            .toBe("before<!-- insert -->after");
            expect(second.innerHTML)
            .toBe("before<span>foo</span>inside<span>bar</span><!-- insert -->after");
    });
    */

    it("can insert an array of strings", function () {
        expect(insert(["foo", "bar"]).innerHTML)
        .toBe("beforefoobarafter", "array of strings");
    });

    it("can insert an array of nodes", function () {
        var nodes = [ document.createElement("span"), document.createElement("div")];
        nodes[0].innerText = "foo";
        nodes[1].innerText = "bar";
        expect(insert(nodes).innerHTML)
        .toBe("before<span>foo</span><div>bar</div>after");
    });

    it("can insert a changing array of nodes", function () {
        var container = document.createElement("div"),
            marker = container.appendChild(document.createTextNode(""));
            range = { start : marker, end : marker },
            span1 = document.createElement("span"), 
            div2 = document.createElement("div"),
            span3 = document.createElement("span");
        span1.innerText = "1";
        div2.innerText = "2";
        span3.innerText = "3"

        Html.insert(range, []);
        expect(container.innerHTML)
        .toBe("");

        Html.insert(range, [span1, div2, span3]);
        expect(container.innerHTML)
        .toBe("<span>1</span><div>2</div><span>3</span>");

        Html.insert(range, [div2, span3]);
        expect(container.innerHTML)
        .toBe("<div>2</div><span>3</span>");

        Html.insert(range, [div2, span3]);
        expect(container.innerHTML)
        .toBe("<div>2</div><span>3</span>");
    });

    it("can insert nested arrays", function () {
        // should we support this?
        expect(insert(["foo", ["bar", "blech"]]).innerHTML)
        .toBe("beforefoobarblechafter", "array of array of strings");
    });

    function newContainer() { return container.cloneNode(true); }
    function newRange(container) { return { start: container.childNodes[1], end: container.childNodes[1] }; }

    function insert(val) {
        var container = newContainer(),
            range = newRange(container);

        Html.insert(range, val);

        return container;
    }
});
