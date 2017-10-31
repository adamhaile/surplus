var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
import { JSXStaticProperty, JSXDynamicProperty, JSXStyleProperty, JSXSpreadProperty, JSXElement, JSXText, Copy } from './AST';
import { codeStr } from './codeGen';
import { HtmlEntites } from './domRef';
var rx = {
    ws: /^\s*$/,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity: /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g
};
var tf = [
    // active transforms, in order from first to last applied
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties,
    translateHTMLEntitiesToUnicode
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.Program(node); };
function removeWhitespaceTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, nonWhitespaceContent = content.filter(function (c) { return !(c instanceof JSXText && rx.ws.test(c.text)); });
            if (nonWhitespaceContent.length !== content.length) {
                node = new JSXElement(tag, properties, references, functions, nonWhitespaceContent, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, lastid = {};
            properties.forEach(function (p, i) { return p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) {
                // spreads and styles can be repeated
                return p instanceof JSXSpreadProperty
                    || p instanceof JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (properties.length !== uniqueProperties.length) {
                node = new JSXElement(tag, uniqueProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            if (node.isHTML) {
                var nonJSXProperties = properties.map(function (p) {
                    return p instanceof JSXDynamicProperty
                        ? new JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc)
                        : p;
                });
                node = new JSXElement(tag, nonJSXProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function translateJSXPropertyName(name) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            if (node.isHTML && content.length === 1 && content[0] instanceof JSXText) {
                var text = this.JSXText(content[0]), textContent = new JSXStaticProperty("textContent", codeStr(text.text));
                node = new JSXElement(tag, properties.concat([textContent]), references, functions, [], loc);
            }
            return tx.JSXElement.call(this, node);
        } });
}
function translateHTMLEntitiesToUnicode(tx) {
    return __assign({}, tx, { JSXText: function (node) {
            var raw = node.text, unicode = raw.replace(rx.htmlEntity, function (entity, dec, hex, named) {
                return dec ? String.fromCharCode(parseInt(dec, 10)) :
                    hex ? String.fromCharCode(parseInt(hex, 16)) :
                        HtmlEntites[named] ||
                            entity;
            });
            return unicode === raw ? node : new JSXText(unicode);
        } });
}
