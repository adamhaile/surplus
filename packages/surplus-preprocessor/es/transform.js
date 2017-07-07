// Cross-browser compatibility shims
import { CodeTopLevel, HtmlElement, EmbeddedCode, CodeText, HtmlText, HtmlComment, StaticProperty, DynamicProperty, Mixin } from './AST';
var rx = {
    ws: /^\s*$/
};
export var transform = function (node, opt) {
    transformCodeTopLevel(node, { index: 0, parent: null, siblings: [], prune: false });
    return node;
};
// add base shim methods that visit AST
var transformNode = function (node, ctx) {
    return node instanceof CodeTopLevel ? transformCodeTopLevel(node, ctx) :
        node instanceof EmbeddedCode ? transformEmbeddedCode(node, ctx) :
            node instanceof CodeText ? transformCodeText(node, ctx) :
                node instanceof HtmlElement ? transformHtmlElement(node, ctx) :
                    node instanceof HtmlText ? transformHtmlText(node, ctx) :
                        node instanceof HtmlComment ? transformHtmlComment(node, ctx) :
                            node instanceof StaticProperty ? transformStaticProperty(node, ctx) :
                                node instanceof DynamicProperty ? transformDynamicProperty(node, ctx) :
                                    node instanceof Mixin ? transformMixin(node, ctx) :
                                        transformHtmlInsert(node, ctx);
}, transformCodeTopLevel = function (node, ctx) {
    return transformSiblings(node, node.segments);
}, transformEmbeddedCode = function (node, ctx) {
    return transformSiblings(node, node.segments);
}, transformHtmlElement = function (node, ctx) {
    transformSiblings(node, node.properties);
    transformSiblings(node, node.content);
}, transformHtmlInsert = function (node, ctx) {
    return transformEmbeddedCode(node.code, ctx);
}, transformCodeText = function (node, ctx) { }, transformHtmlText = function (node, ctx) { }, transformHtmlComment = function (node, ctx) { }, transformStaticProperty = function (node, ctx) { }, transformDynamicProperty = function (node, ctx) {
    return transformEmbeddedCode(node.code, ctx);
}, transformMixin = function (node, ctx) {
    return transformEmbeddedCode(node.code, ctx);
};
var transformSiblings = function (parent, siblings) {
    var ctx = { index: 0, parent: parent, siblings: siblings, prune: false };
    for (; ctx.index < siblings.length; ctx.index++) {
        transformNode(siblings[ctx.index], ctx);
        if (ctx.prune) {
            siblings.splice(ctx.index, 1);
            ctx.index--;
            ctx.prune = false;
        }
    }
}, composeTransforms = function (orig, tx) { return function (node, ctx) {
    tx(node, ctx);
    if (!ctx.prune)
        orig(node, ctx);
}; }, prune = function (ctx) {
    ctx.prune = true;
}, insertBefore = function (node, ctx) {
    ctx.siblings.splice(ctx.index, 0, node);
    transformNode(node, ctx);
    ctx.index++;
}, insertAfter = function (node, ctx) {
    ctx.siblings.splice(ctx.index + 1, 0, node);
};
removeWhitespaceTextNodes();
if (typeof window !== 'undefined' && window.document && window.document.createElement) {
    // browser-based shims
    if (!browserPreservesWhitespaceTextNodes())
        addFEFFtoWhitespaceTextNodes();
    if (!browserPreservesInitialComments())
        insertTextNodeBeforeInitialComments();
}
function removeWhitespaceTextNodes() {
    transformHtmlText = composeTransforms(transformHtmlText, function (node, ctx) {
        if (rx.ws.test(node.text)) {
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
    transformHtmlText = composeTransforms(transformHtmlText, function (node, ctx) {
        if (rx.ws.test(node.text) && !(ctx.parent instanceof StaticProperty)) {
            node.text = '&#xfeff;' + node.text;
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
    transformHtmlComment = composeTransforms(transformHtmlComment, function (node, ctx) {
        if (ctx.index === 0) {
            insertBefore(new HtmlText('&#xfeff;'), ctx);
        }
    });
}
