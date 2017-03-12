// Cross-browser compatibility shims
define('shims', ['AST'], function (AST) {
    
    var rx = {
        ws: /^\s*$/
    };
    
    var shimmed = false;

    // add base shim methods that visit AST
    AST.CodeTopLevel.prototype.shim = function (ctx) { shimSiblings(this, this.segments, ctx); };
    AST.HtmlElement.prototype.shim  = function (ctx) { shimSiblings(this, this.content, ctx); };
    AST.HtmlInsert.prototype.shim   = function (ctx) { this.code.shim(ctx); };
    AST.EmbeddedCode.prototype.shim = function (ctx) { shimSiblings(this, this.segments, ctx) };
    AST.CodeText.prototype.shim     =
    AST.HtmlText.prototype.shim     =
    AST.HtmlComment.prototype.shim  = function (ctx) {};

    removeWhitespaceTextNodes();

    if (this && this.document && this.document.createElement) {
        // browser-based shims
        if (!browserPreservesWhitespaceTextNodes())
            addFEFFtoWhitespaceTextNodes();

        if (!browserPreservesInitialComments())
            insertTextNodeBeforeInitialComments();
    }

    return shimmed;

    function removeWhitespaceTextNodes() {
        shim(AST.HtmlText, function (ctx) {
            if (rx.ws.test(this.text)) {
                prune(ctx);
            }
        });
    }

    // IE <9 will removes text nodes that just contain whitespace in certain situations.
    // Solution is to add a zero-width non-breaking space (entity &#xfeff) to the nodes.
    function browserPreservesWhitespaceTextNodes() {
        var ul = document.createElement("ul");
        ul.innerHTML = "    <li></li>";
        return ul.childNodes.length === 2;
    }

    function addFEFFtoWhitespaceTextNodes() {
        shim(AST.HtmlText, function (ctx) {
            if (rx.ws.test(this.text) && !(ctx.parent instanceof AST.HtmlAttr)) {
                this.text = '&#xfeff;' + this.text;
            }
        });
    }

    // IE <9 will remove comments when they're the first child of certain elements
    // Solution is to prepend a non-whitespace text node, using the &#xfeff trick.
    function browserPreservesInitialComments() {
        var ul = document.createElement("ul");
        ul.innerHTML = "<!-- --><li></li>";
        return ul.childNodes.length === 2;
    }

    function insertTextNodeBeforeInitialComments() {
        shim(AST.HtmlComment, function (ctx) {
            if (ctx.index === 0) {
                insertBefore(new AST.HtmlText('&#xfeff;'), ctx);
            }
        })
    }

    function shimSiblings(parent, siblings, prevCtx) {
        var ctx = { index: 0, parent: parent, sibings: siblings, prune: false }
        for (; ctx.index < siblings.length; ctx.index++) {
            siblings[ctx.index].shim(ctx);
            if (ctx.prune) {
                siblings.splice(ctx.index, 1);
                ctx.index--;
                ctx.prune = false;
            }
        }
    }

    function shim(node, fn) {
        shimmed = true;
        var oldShim = node.prototype.shim;
        node.prototype.shim = function (ctx) { 
            fn.call(this, ctx); 
            if (!ctx.prune) oldShim.call(this, ctx); 
        };
    }

    function prune(ctx) {
        ctx.prune = true;
    }

    function insertBefore(node, ctx) {
        ctx.siblings.splice(ctx.index, 0, node);
        node.shim(ctx);
        ctx.index++;
    }

    function insertAfter(node, ctx) {
        ctx.siblings.splice(ctx.index + 1, 0, node);
    }

});
