var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Cross-browser compatibility shims
import * as AST from './AST';
import { codeStr } from './codeGen';
import { HtmlEntites, SvgOnlyTagRx, SvgForeignTag } from './domRef';
var namespaceAliases = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
};
var rx = {
    trimmableWS: /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs: /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    namespacedAttr: new RegExp("^(" + Object.keys(namespaceAliases).join('|') + ")([A-Z])(.*)"),
    htmlEntity: /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g,
    subcomponent: /(^[A-Z])|\./
};
// a Copy transform, for building non-identity transforms on top of
var Copy = {
    Program: function (node) {
        return { type: AST.Program, segments: this.CodeSegments(node.segments) };
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) {
            return node.type === AST.CodeText ? _this.CodeText(node) :
                _this.JSXElement(node, null);
        });
    },
    EmbeddedCode: function (node) {
        return { type: AST.EmbeddedCode, segments: this.CodeSegments(node.segments) };
    },
    JSXElement: function (node, parent) {
        var _this = this;
        return __assign({}, node, { properties: node.properties.map(function (p) { return _this.JSXProperty(p, node); }), references: node.references.map(function (r) { return _this.JSXReference(r); }), functions: node.functions.map(function (f) { return _this.JSXFunction(f); }), content: node.content.map(function (c) { return _this.JSXContent(c, node); }) });
    },
    JSXProperty: function (node, parent) {
        return node.type === AST.JSXStaticProperty ? this.JSXStaticProperty(node, parent) :
            node.type === AST.JSXDynamicProperty ? this.JSXDynamicProperty(node, parent) :
                node.type === AST.JSXStyleProperty ? this.JSXStyleProperty(node) :
                    this.JSXSpreadProperty(node);
    },
    JSXContent: function (node, parent) {
        return node.type === AST.JSXComment ? this.JSXComment(node) :
            node.type === AST.JSXText ? this.JSXText(node) :
                node.type === AST.JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node, parent);
    },
    JSXInsert: function (node) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    },
    CodeText: function (node) { return node; },
    JSXText: function (node) { return node; },
    JSXComment: function (node) { return node; },
    JSXStaticProperty: function (node, parent) { return node; },
    JSXDynamicProperty: function (node, parent) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    },
    JSXSpreadProperty: function (node) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    },
    JSXStyleProperty: function (node) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    },
    JSXReference: function (node) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    },
    JSXFunction: function (node) {
        return __assign({}, node, { code: this.EmbeddedCode(node.code) });
    }
};
var tf = [
    // active transforms, in order from first to last applied
    determineElementRole,
    trimTextNodes,
    collapseExtraWhitespaceInTextNodes,
    removeEmptyTextNodes,
    translateHTMLEntitiesToUnicodeInTextNodes,
    translateJSXPropertyNames,
    translateHTMLAttributeNames,
    translateSVGPropertyNames,
    translateNamespacedAttributes,
    translateDeepStylePropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.Program(node); };
function determineElementRole(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var kind = rx.subcomponent.test(node.tag) ? AST.JSXElementKind.SubComponent :
                SvgOnlyTagRx.test(node.tag) ? AST.JSXElementKind.SVG :
                    parent && parent.kind === AST.JSXElementKind.SVG && parent.tag !== SvgForeignTag ? AST.JSXElementKind.SVG :
                        AST.JSXElementKind.HTML;
            return tx.JSXElement.call(this, __assign({}, node, { kind: kind }), parent);
        } });
}
function trimTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                var content = node.content.map(function (c) {
                    return c.type === AST.JSXText ? __assign({}, c, { text: c.text.replace(rx.trimmableWS, '') }) : c;
                });
                node = __assign({}, node, { content: content });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function collapseExtraWhitespaceInTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            if (node.tag !== 'pre') {
                var content = node.content.map(function (c) {
                    return c.type === AST.JSXText
                        ? __assign({}, c, { text: c.text.replace(rx.extraWs, ' ') }) : c;
                });
                node = __assign({}, node, { content: content });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function removeEmptyTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var content = node.content.filter(function (c) { return c.type !== AST.JSXText || c.text !== ''; });
            node = __assign({}, node, { content: content });
            return tx.JSXElement.call(this, node, parent);
        } });
}
function translateHTMLEntitiesToUnicodeInTextNodes(tx) {
    return __assign({}, tx, { JSXText: function (node) {
            var text = node.text.replace(rx.htmlEntity, function (entity, dec, hex, named) {
                return dec ? String.fromCharCode(parseInt(dec, 10)) :
                    hex ? String.fromCharCode(parseInt(hex, 16)) :
                        HtmlEntites[named] ||
                            entity;
            });
            if (text !== node.text)
                node = __assign({}, node, { text: text });
            return tx.JSXText.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var lastid = {};
            node.properties.forEach(function (p, i) { return p.type === AST.JSXSpreadProperty || p.type === AST.JSXStyleProperty || (lastid[p.name] = i); });
            var properties = node.properties.filter(function (p, i) {
                // spreads and styles can be repeated
                return p.type === AST.JSXSpreadProperty
                    || p.type === AST.JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (properties.length !== node.properties.length) {
                node = __assign({}, node, { properties: properties });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXDynamicProperty: function (node, parent) {
            if (parent.kind === AST.JSXElementKind.HTML) {
                node = __assign({}, node, { name: translateJSXPropertyName(node.name) });
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        } });
}
function translateJSXPropertyName(name) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function translateHTMLAttributeNames(tx) {
    return __assign({}, tx, { JSXProperty: function (node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty)
                && parent.kind === AST.JSXElementKind.HTML) {
                var name_1 = node.name === "class" ? "className" : node.name === "for" ? "htmlFor" : node.name;
                node = __assign({}, node, { name: name_1 });
            }
            return tx.JSXProperty.call(this, node, parent);
        } });
}
function translateSVGPropertyNames(tx) {
    return __assign({}, tx, { JSXProperty: function (node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty)
                && parent.kind === AST.JSXElementKind.SVG) {
                var name_2 = node.name === "className" ? "class" : node.name === "htmlFor" ? "for" : node.name;
                node = __assign({}, node, { name: name_2 });
            }
            return tx.JSXProperty.call(this, node, parent);
        } });
}
function translateNamespacedAttributes(tx) {
    return __assign({}, tx, { JSXProperty: function (node, parent) {
            var m;
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty)
                && (m = rx.namespacedAttr.exec(node.name))) {
                var namespace = namespaceAliases[m[1]], name_3 = m[2].toLowerCase() + m[3];
                node = __assign({}, node, { name: name_3, namespace: namespace });
            }
            return tx.JSXProperty.call(this, node, parent);
        } });
}
function translateDeepStylePropertyNames(tx) {
    return __assign({}, tx, { JSXProperty: function (node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty)
                && parent.kind === AST.JSXElementKind.HTML
                && node.name.substr(0, 6) === 'style-') {
                node = __assign({}, node, { name: 'style.' + node.name.substr(6) });
            }
            return tx.JSXProperty.call(this, node, parent);
        } });
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var content0 = node.content[0];
            if (node.kind === AST.JSXElementKind.HTML && node.content.length === 1 && content0.type === AST.JSXText) {
                var text = this.JSXText(content0), textContent = { type: AST.JSXStaticProperty, name: "textContent", namespace: null, value: codeStr(text.text) };
                node = __assign({}, node, { properties: node.properties.concat([textContent]), content: [] });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
