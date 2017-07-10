var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
import { StaticProperty, DynamicProperty, HtmlElement, HtmlText, Copy } from './AST';
import { codeStr } from './compile';
var rx = {
    ws: /^\s*$/,
    jsxEventProperty: /^on[A-Z]/,
    lowerStart: /^[a-z]/,
};
var tf = [
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.CodeTopLevel(node); };
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlElement: function (ctx) {
            var _a = ctx.node, tag = _a.tag, properties = _a.properties, content = _a.content, loc = _a.loc;
            content = content.filter(function (c) { return !(c instanceof HtmlText && rx.ws.test(c.text)); });
            if (content.length !== ctx.node.content.length) {
                ctx = ctx.swap(new HtmlElement(tag, properties, content, loc));
            }
            return tx.HtmlElement.call(this, ctx);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { DynamicProperty: function (ctx) {
            var _a = ctx.node, name = _a.name, code = _a.code, loc = _a.loc;
            if (rx.lowerStart.test(ctx.parent.node.tag) && rx.jsxEventProperty.test(name)) {
                name = name === "onDoubleClick" ? "ondblclick" : name.toLowerCase();
                ctx = ctx.swap(new DynamicProperty(name, code, loc));
            }
            return tx.DynamicProperty.call(this, ctx);
        } });
}
function promoteInitialTextNodesToTextContentProperties(tx) {
    return __assign({}, tx, { HtmlElement: function (ctx) {
            var _a = ctx.node, tag = _a.tag, properties = _a.properties, content = _a.content, loc = _a.loc;
            if (rx.lowerStart.test(tag) && content.length > 0 && content[0] instanceof HtmlText) {
                var textContent = new StaticProperty("textContent", codeStr(content[0].text)), node = new HtmlElement(tag, properties.concat([textContent]), content.slice(1), loc);
                ctx = ctx.swap(node);
            }
            return tx.HtmlElement.call(this, ctx);
        } });
}
