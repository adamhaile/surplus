// Cross-browser compatibility shims
import { 
    CodeTopLevel, 
    HtmlElement, 
    HtmlInsert, 
    EmbeddedCode, 
    CodeText, 
    HtmlText, 
    HtmlComment, 
    StaticProperty, 
    DynamicProperty, 
    Mixin, 
    Node 
} from './AST';
import { Params } from './preprocess';

const rx = {
    ws: /^\s*$/
};

type Context = { index: number, parent: Node | null, siblings: Node[], prune: boolean };
type Transform<T> = (item : T, ctx : Context) => void;

export const transform = (node : CodeTopLevel, opt : Params) => {
    transformCodeTopLevel(node, { index: 0, parent: null, siblings: [], prune: false});
    return node;
}

// add base shim methods that visit AST
let transformNode = (node : Node, ctx : Context) =>
        node instanceof CodeTopLevel    ? transformCodeTopLevel(node, ctx) :
        node instanceof EmbeddedCode    ? transformEmbeddedCode(node, ctx) :
        node instanceof CodeText        ? transformCodeText(node, ctx) : 
        node instanceof HtmlElement     ? transformHtmlElement(node, ctx) :
        node instanceof HtmlText        ? transformHtmlText(node, ctx) :
        node instanceof HtmlComment     ? transformHtmlComment(node, ctx) :
        node instanceof StaticProperty  ? transformStaticProperty(node, ctx) :
        node instanceof DynamicProperty ? transformDynamicProperty(node, ctx) :
        node instanceof Mixin           ? transformMixin(node, ctx) :
        transformHtmlInsert(node, ctx),
    transformCodeTopLevel = (node : CodeTopLevel, ctx : Context) =>
        transformSiblings(node, node.segments),
    transformEmbeddedCode = (node : EmbeddedCode, ctx : Context) =>
        transformSiblings(node, node.segments),
    transformHtmlElement = (node : HtmlElement, ctx : Context) => {
        transformSiblings(node, node.properties);
        transformSiblings(node, node.content);
    },
    transformHtmlInsert = (node : HtmlInsert, ctx : Context) =>
        transformEmbeddedCode(node.code, ctx),
    transformCodeText = (node : CodeText, ctx : Context) => { },
    transformHtmlText  = (node : HtmlText, ctx : Context) => { },
    transformHtmlComment = (node : HtmlComment, ctx : Context) => { },
    transformStaticProperty = (node : StaticProperty, ctx : Context) => { },
    transformDynamicProperty = (node : DynamicProperty, ctx : Context) =>
        transformEmbeddedCode(node.code, ctx),
    transformMixin = (node : Mixin, ctx : Context) =>
        transformEmbeddedCode(node.code, ctx);
    
const transformSiblings = <T extends Node>(parent : T, siblings : Node[]) => {
        var ctx : Context = { index: 0, parent: parent, siblings: siblings, prune: false };
        for (; ctx.index < siblings.length; ctx.index++) {
            transformNode(siblings[ctx.index], ctx);
            if (ctx.prune) {
                siblings.splice(ctx.index, 1);
                ctx.index--;
                ctx.prune = false;
            }
        }
    },
    composeTransforms = <T>(orig : Transform<T>, tx : Transform<T>) : Transform<T> => (node, ctx) => {
        tx(node, ctx); 
        if (!ctx.prune) orig(node, ctx);
    },
    prune = (ctx : Context) => {
        ctx.prune = true;
    },
    insertBefore = (node : Node, ctx : Context) => {
        ctx.siblings.splice(ctx.index, 0, node);
        transformNode(node, ctx);
        ctx.index++;
    },
    insertAfter = (node : Node, ctx : Context) => {
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
    transformHtmlText = composeTransforms(transformHtmlText, (node, ctx) => {
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
    transformHtmlText = composeTransforms(transformHtmlText, (node, ctx) => {
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
    transformHtmlComment = composeTransforms(transformHtmlComment, (node, ctx) => {
        if (ctx.index === 0) {
            insertBefore(new HtmlText('&#xfeff;'), ctx);
        }
    })
}
