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
var rx = {
    trimmableWS: /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs: /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity: /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g,
    subcomponent: /(^[A-Z])|\./
};
// a Copy transform, for building non-identity transforms on top of
var Copy = {
    Program: function (node) {
        return new AST.Program(this.CodeSegments(node.segments));
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) {
            return node instanceof AST.CodeText ? _this.CodeText(node) :
                _this.JSXElement(node, null);
        });
    },
    EmbeddedCode: function (node) {
        return new AST.EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement: function (node, parent) {
        var _this = this;
        return new AST.JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p, node); }), node.references.map(function (r) { return _this.JSXReference(r); }), node.functions.map(function (f) { return _this.JSXFunction(f); }), node.content.map(function (c) { return _this.JSXContent(c, node); }), node.role, node.loc);
    },
    JSXProperty: function (node, parent) {
        return node instanceof AST.JSXStaticProperty ? this.JSXStaticProperty(node, parent) :
            node instanceof AST.JSXDynamicProperty ? this.JSXDynamicProperty(node, parent) :
                node instanceof AST.JSXStyleProperty ? this.JSXStyleProperty(node) :
                    this.JSXSpreadProperty(node);
    },
    JSXContent: function (node, parent) {
        return node instanceof AST.JSXComment ? this.JSXComment(node) :
            node instanceof AST.JSXText ? this.JSXText(node) :
                node instanceof AST.JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node, parent);
    },
    JSXInsert: function (node) {
        return new AST.JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText: function (node) { return node; },
    JSXText: function (node) { return node; },
    JSXComment: function (node) { return node; },
    JSXStaticProperty: function (node, parent) { return node; },
    JSXDynamicProperty: function (node, parent) {
        return new AST.JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty: function (node) {
        return new AST.JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXStyleProperty: function (node) {
        return new AST.JSXStyleProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXReference: function (node) {
        return new AST.JSXReference(this.EmbeddedCode(node.code), node.loc);
    },
    JSXFunction: function (node) {
        return new AST.JSXFunction(this.EmbeddedCode(node.code), node.loc);
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
    translateDeepStylePropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce(function (tf, fn) { return fn(tf); }, Copy);
export var transform = function (node, opt) { return tf.Program(node); };
function determineElementRole(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var role = rx.subcomponent.test(node.tag) ? AST.JSXElementRole.SubComponent :
                SvgOnlyTagRx.test(node.tag) ? AST.JSXElementRole.SVG :
                    parent && parent.role === AST.JSXElementRole.SVG && parent.tag !== SvgForeignTag ? AST.JSXElementRole.SVG :
                        AST.JSXElementRole.HTML;
            node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, node.content, role, node.loc);
            return tx.JSXElement.call(this, node, parent);
        } });
}
function trimTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                var content = node.content.map(function (c) {
                    return c.kind === 'text' ? new AST.JSXText(c.text.replace(rx.trimmableWS, '')) : c;
                });
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.role, node.loc);
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function collapseExtraWhitespaceInTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            if (node.tag !== 'pre') {
                var lessWsContent = node.content.map(function (c) {
                    return c instanceof AST.JSXText
                        ? new AST.JSXText(c.text.replace(rx.extraWs, ' '))
                        : c;
                });
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, lessWsContent, node.role, node.loc);
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function removeEmptyTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var content = node.content.filter(function (c) { return c.kind !== 'text' || c.text !== ''; });
            node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.role, node.loc);
            return tx.JSXElement.call(this, node, parent);
        } });
}
function translateHTMLEntitiesToUnicodeInTextNodes(tx) {
    return __assign({}, tx, { JSXText: function (node) {
            var raw = node.text, unicode = raw.replace(rx.htmlEntity, function (entity, dec, hex, named) {
                return dec ? String.fromCharCode(parseInt(dec, 10)) :
                    hex ? String.fromCharCode(parseInt(hex, 16)) :
                        HtmlEntites[named] ||
                            entity;
            });
            if (raw !== unicode)
                node = new AST.JSXText(unicode);
            return tx.JSXText.call(this, node);
        } });
}
function removeDuplicateProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, role = node.role, lastid = {};
            properties.forEach(function (p, i) { return p instanceof AST.JSXSpreadProperty || p instanceof AST.JSXStyleProperty || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) {
                // spreads and styles can be repeated
                return p instanceof AST.JSXSpreadProperty
                    || p instanceof AST.JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (properties.length !== uniqueProperties.length) {
                node = new AST.JSXElement(tag, uniqueProperties, references, functions, content, role, loc);
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXDynamicProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.HTML) {
                node = new AST.JSXDynamicProperty(translateJSXPropertyName(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        } });
}
function translateJSXPropertyName(name) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function translateHTMLAttributeNames(tx) {
    var txAttributeToProperty = function (name) { return name === "class" ? "className" : name === "for" ? "htmlFor" : name; };
    return __assign({}, tx, { JSXDynamicProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.HTML) {
                node = new AST.JSXDynamicProperty(txAttributeToProperty(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        },
        JSXStaticProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.HTML) {
                node = new AST.JSXStaticProperty(txAttributeToProperty(node.name), node.value);
            }
            return tx.JSXStaticProperty.call(this, node, parent);
        } });
}
function translateSVGPropertyNames(tx) {
    var txPropertyToAttribute = function (name) { return name === "className" ? "class" : name === "htmlFor" ? "for" : name; };
    return __assign({}, tx, { JSXDynamicProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.SVG) {
                node = new AST.JSXDynamicProperty(txPropertyToAttribute(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        },
        JSXStaticProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.SVG) {
                node = new AST.JSXStaticProperty(txPropertyToAttribute(node.name), node.value);
            }
            return tx.JSXStaticProperty.call(this, node, parent);
        } });
}
function translateDeepStylePropertyNames(tx) {
    return __assign({}, tx, { JSXDynamicProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.HTML && node.name.substr(0, 6) === 'style-') {
                node = new AST.JSXDynamicProperty('style.' + node.name.substr(6), node.code, node.loc);
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        },
        JSXStaticProperty: function (node, parent) {
            if (parent.role === AST.JSXElementRole.HTML && node.name.substr(0, 6) === 'style-') {
                node = new AST.JSXStaticProperty('style.' + node.name.substr(6), node.value);
            }
            return tx.JSXStaticProperty.call(this, node, parent);
        } });
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, parent) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, role = node.role;
            if (node.role === AST.JSXElementRole.HTML && content.length === 1 && content[0] instanceof AST.JSXText) {
                var text = this.JSXText(content[0]), textContent = new AST.JSXStaticProperty("textContent", codeStr(text.text));
                node = new AST.JSXElement(tag, properties.concat([textContent]), references, functions, [], role, loc);
            }
            return tx.JSXElement.call(this, node, parent);
        } });
}
