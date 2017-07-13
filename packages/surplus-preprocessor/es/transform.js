var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
import { StaticProperty, DynamicProperty, Mixin, HtmlElement, HtmlText, Copy } from './AST';
import { codeStr } from './compile';
var rx = {
    ws: /^\s*$/,
    jsxEventProperty: /^on[A-Z]/,
    lowerStart: /^[a-z]/,
};
var tf = [
    // active transforms, in order from first to last applied
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.CodeTopLevel(node); };
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { HtmlElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc, nonWhitespaceContent = content.filter(function (c) { return !(c instanceof HtmlText && rx.ws.test(c.text)); });
            if (nonWhitespaceContent.length !== content.length) {
                node = new HtmlElement(tag, properties, nonWhitespaceContent, loc);
            }
            return tx.HtmlElement.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { HtmlElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc, lastid = {};
            properties.forEach(function (p, i) { return p instanceof Mixin || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) { return p instanceof Mixin || lastid[p.name] === i; });
            if (properties.length !== uniqueProperties.length) {
                node = new HtmlElement(tag, uniqueProperties, content, loc);
            }
            return tx.HtmlElement.call(this, node);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { HtmlElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (rx.lowerStart.test(tag)) {
                var nonJSXProperties = properties.map(function (p) {
                    return p instanceof DynamicProperty
                        ? new DynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc)
                        : p;
                });
                node = new HtmlElement(tag, nonJSXProperties, content, loc);
            }
            return tx.HtmlElement.call(this, node);
        } });
}
function translateJSXPropertyName(name) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function promoteInitialTextNodesToTextContentProperties(tx) {
    return __assign({}, tx, { HtmlElement: function (node) {
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (rx.lowerStart.test(tag) && content.length > 0 && content[0] instanceof HtmlText) {
                var textContent = new StaticProperty("textContent", codeStr(content[0].text));
                node = new HtmlElement(tag, properties.concat([textContent]), content.slice(1), loc);
            }
            return tx.HtmlElement.call(this, node);
        } });
}
