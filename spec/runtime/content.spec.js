describe("Surplus.content", function () { 
    // <div>before<!-- insert -->after</div>
    var container = document.createElement("div");
    container.appendChild(document.createTextNode("before"));
    container.appendChild(document.createTextNode(""));
    container.appendChild(document.createTextNode("after"));

    it("inserts nothing for null", function () {
        var res = content(null);
        expect(res.innerHTML)
        .toBe("");
        expect(res.childNodes.length).toBe(0);
    });

    it("can insert strings", function () {
        var res = content("foo");
        expect(res.innerHTML)
        .toBe("foo");
        expect(res.childNodes.length).toBe(1);
    });

    it("can insert a node", function () {
        var node = document.createElement("span");
        node.innerText = "foo";
        expect(content(node).innerHTML)
        .toBe("<span>foo</span>");
    });

    it("can re-insert a node, thereby moving it", function () {
        var node = document.createElement("span");
        node.innerText = "foo";

        var first = content(node),
            second = content(node);

            expect(first.innerHTML)
            .toBe("");
            expect(second.innerHTML)
            .toBe("<span>foo</span>");
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
        expect(content(["foo", "bar"]).innerHTML)
        .toBe("foobar", "array of strings");
    });

    it("can insert an array of nodes", function () {
        var nodes = [ document.createElement("span"), document.createElement("div")];
        nodes[0].innerText = "foo";
        nodes[1].innerText = "bar";
        expect(content(nodes).innerHTML)
        .toBe("<span>foo</span><div>bar</div>");
    });

    it("can insert a changing array of nodes", function () {
        var parent = document.createElement("div"),
            n1 = document.createElement("span"), 
            n2 = document.createElement("div"),
            n3 = document.createElement("span"),
            n4 = document.createElement("div");
            orig = [n1, n2, n3, n4];

        n1.innerText = "1";
        n2.innerText = "2";
        n3.innerText = "3"
        n4.innerText = "4";
        
        var origExpected = expected(orig)

        // identity
        test([n1, n2, n3, n4]);

        // 1 missing
        test([    n2, n3, n4]);
        test([n1,     n3, n4]);
        test([n1, n2,     n4]);
        test([n1, n2, n3    ]);

        // 2 missing
        test([        n3, n4]);
        test([    n2,     n4]);
        test([    n2, n3    ]);
        test([n1,         n4]);
        test([n1,     n3    ]);
        test([n1, n2,       ]);

        // 3 missing
        test([n1            ]);
        test([    n2        ]);
        test([        n3    ]);
        test([            n4]);

        // all missing
        test([              ]);

        // swaps
        test([n2, n1, n3, n4]);
        test([n3, n2, n1, n4]);
        test([n4, n2, n3, n1]);
        
        // rotations
        test([n2, n3, n4, n1]);
        test([n3, n4, n1, n2]);
        test([n4, n1, n2, n3]);

        // reversal
        test([n4, n3, n2, n1]);

        function test(array) {
            Surplus.content(parent, array);
            expect(parent.innerHTML).toBe(expected(array));
            Surplus.content(parent, orig);
            expect(parent.innerHTML).toBe(origExpected);
        }

        function expected(array) {
            return array.map(n => n.outerHTML).join("");
        }
    });

    it("can insert nested arrays", function () {
        // should we support this?
        expect(content(["foo", ["bar", "blech"]]).innerHTML)
        .toBe("foobarblech", "array of array of strings");
    });

    function newParent() { return container.cloneNode(true); }

    function content(val) {
        var parent = newParent();

        Surplus.content(parent, val);

        return parent;
    }
});
