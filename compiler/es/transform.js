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
import { htmlEntites, svgOnlyTagRx, svgForeignTag } from './domRef';
import { getFieldData } from './fieldData';
import { JSXElementKind } from './AST';
var rx = {
    trimmableWS: /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs: /\s\s+/g,
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
        return __assign({}, node, { fields: node.fields.map(function (p) { return _this.JSXField(p, node); }), references: node.references.map(function (r) { return _this.JSXReference(r); }), functions: node.functions.map(function (f) { return _this.JSXFunction(f); }), content: node.content.map(function (c) { return _this.JSXContent(c, node); }) });
    },
    JSXField: function (node, parent) {
        return node.type === AST.JSXStaticField ? this.JSXStaticField(node, parent) :
            node.type === AST.JSXDynamicField ? this.JSXDynamicField(node, parent) :
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
    JSXStaticField: function (node, parent) { return node; },
    JSXDynamicField: function (node, parent) {
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
    determinePropertiesAndAttributes,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateFields
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.Program(node); };
function determineElementRole(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var kind = rx.subcomponent.test(node.tag) ? AST.JSXElementKind.SubComponent :
                svgOnlyTagRx.test(node.tag) ? AST.JSXElementKind.SVG :
                    parent && parent.kind === AST.JSXElementKind.SVG && parent.tag !== svgForeignTag ? AST.JSXElementKind.SVG :
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
                        htmlEntites[named] ||
                            entity;
            });
            if (text !== node.text)
                node = __assign({}, node, { text: text });
            return tx.JSXText.call(this, node);
        } });
}
function removeDuplicateFields(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var lastid = {};
            node.fields.forEach(function (p, i) { return p.type === AST.JSXSpread || p.type === AST.JSXStyleProperty || (lastid[p.name] = i); });
            var fields = node.fields.filter(function (p, i) {
                // spreads and styles can be repeated
                return p.type === AST.JSXSpread
                    || p.type === AST.JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (fields.length !== node.fields.length) {
                node = __assign({}, node, { fields: fields });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function determinePropertiesAndAttributes(tx) {
    // strategy: HTML prefers props, JSX attrs, unless not possible
    // translate given field name into attr/prop appropriate versions (snake vs camel case)
    // handle deep props and attr namespaces
    return __assign({}, tx, { JSXField: function (node, parent) {
            if ((node.type === AST.JSXDynamicField || node.type === AST.JSXStaticField) && parent.kind !== JSXElementKind.SubComponent) {
                var _a = getFieldData(node.name, parent.kind === JSXElementKind.SVG), name_1 = _a[0], namespace = _a[1], attr = _a[2];
                node = __assign({}, node, { attr: attr, name: name_1, namespace: namespace });
            }
            return tx.JSXField.call(this, node, parent);
        } });
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var content0 = node.content[0];
            if (node.kind === AST.JSXElementKind.HTML && node.content.length === 1 && content0.type === AST.JSXText) {
                var text = this.JSXText(content0), textContent = { type: AST.JSXStaticField, name: "textContent", attr: false, namespace: null, value: codeStr(text.text) };
                node = __assign({}, node, { fields: node.fields.concat([textContent]), content: [] });
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
