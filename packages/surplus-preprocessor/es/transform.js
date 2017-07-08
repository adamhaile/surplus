var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
import { StaticProperty, HtmlText, Copy } from './AST';
var rx = {
    ws: /^\s*$/
};
export var transform = function (node, opt) {
    var tx = Copy;
    tx = removeWhitespaceTextNodes(tx);
    if (typeof window !== 'undefined' && window.document && window.document.createElement) {
        // browser-based shims
        if (!browserPreservesWhitespaceTextNodes())
            tx = addFEFFtoWhitespaceTextNodes(tx);
        if (!browserPreservesInitialComments())
            tx = insertTextNodeBeforeInitialComments(tx);
    }
    return tx.CodeTopLevel(node);
};
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlText: function (ctx) { return rx.ws.test(ctx.node.text) ? [] : tx.HtmlText(ctx); } });
}
// IE <9 will removes text nodes that just contain whitespace in certain situations.
// Solution is to add a zero-width non-breaking space (entity &#xfeff) to the nodes.
function browserPreservesWhitespaceTextNodes() {
    var ul = document.createElement("ul");
    ul.innerHTML = "    <li></li>";
    return ul.childNodes.length === 2;
}
function addFEFFtoWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlText: function (ctx) {
            return tx.HtmlText(rx.ws.test(ctx.node.text) && !(ctx.parent.node instanceof StaticProperty)
                ? ctx.swap(new HtmlText('&#xfeff;' + ctx.node.text))
                : ctx);
        } });
}
// IE <9 will remove comments when they're the first child of certain elements
// Solution is to prepend a non-whitespace text node, using the &#xfeff trick.
function browserPreservesInitialComments() {
    var ul = document.createElement("ul");
    ul.innerHTML = "<!-- --><li></li>";
    return ul.childNodes.length === 2;
}
function insertTextNodeBeforeInitialComments(tx) {
    return __assign({}, tx, { HtmlComment: function (ctx) {
            return (ctx.index === 0 ? tx.HtmlText(ctx.swap(new HtmlText('&#xfeff;'))) : []).concat(tx.HtmlComment(ctx));
        } });
}
