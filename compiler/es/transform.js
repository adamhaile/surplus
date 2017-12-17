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
var TreeContext;
(function (TreeContext) {
    TreeContext[TreeContext["HTML"] = 0] = "HTML";
    TreeContext[TreeContext["SVG"] = 1] = "SVG";
    TreeContext[TreeContext["SubComponent"] = 2] = "SubComponent";
})(TreeContext || (TreeContext = {}));
// a Copy transform, for building non-identity transforms on top of
var Copy = {
    Program: function (node) {
        return new AST.Program(this.CodeSegments(node.segments));
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) {
            return node instanceof AST.CodeText ? _this.CodeText(node) :
                _this.JSXElement(node, TreeContext.HTML);
        });
    },
    EmbeddedCode: function (node) {
        return new AST.EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement: function (node, ctx) {
        var _this = this;
        return new AST.JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p, ctx); }), node.references.map(function (r) { return _this.JSXReference(r); }), node.functions.map(function (f) { return _this.JSXFunction(f); }), node.content.map(function (c) { return _this.JSXContent(c, node, ctx); }), node.loc);
    },
    JSXProperty: function (node, ctx) {
        return node instanceof AST.JSXStaticProperty ? this.JSXStaticProperty(node, ctx) :
            node instanceof AST.JSXDynamicProperty ? this.JSXDynamicProperty(node, ctx) :
                node instanceof AST.JSXStyleProperty ? this.JSXStyleProperty(node) :
                    this.JSXSpreadProperty(node);
    },
    JSXContent: function (node, parent, ctx) {
        return node instanceof AST.JSXComment ? this.JSXComment(node) :
            node instanceof AST.JSXText ? this.JSXText(node) :
                node instanceof AST.JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node, ctx);
    },
    JSXInsert: function (node) {
        return new AST.JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText: function (node) { return node; },
    JSXText: function (node) { return node; },
    JSXComment: function (node) { return node; },
    JSXStaticProperty: function (node, ctx) { return node; },
    JSXDynamicProperty: function (node, ctx) {
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
    setTreeContext,
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
function setTreeContext(tx) {
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            return tx.JSXElement(node, rx.subcomponent.test(node.tag) ? TreeContext.SubComponent :
                SvgOnlyTagRx.test(node.tag) || ctx === TreeContext.SVG ? TreeContext.SVG :
                    TreeContext.HTML);
        },
        JSXContent: function (node, parent, ctx) {
            return tx.JSXContent(node, parent, parent.tag === SvgForeignTag ? TreeContext.HTML : ctx);
        } });
}
function trimTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                var content = node.content.map(function (c) {
                    return c.kind === 'text'
                        ? new AST.JSXText(c.text.replace(rx.trimmableWS, ''))
                        : c;
                });
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            }
            return tx.JSXElement.call(this, node, ctx);
        } });
}
function collapseExtraWhitespaceInTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            if (node.tag !== 'pre') {
                var lessWsContent = node.content.map(function (c) {
                    return c instanceof AST.JSXText
                        ? new AST.JSXText(c.text.replace(rx.extraWs, ' '))
                        : c;
                });
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, lessWsContent, node.loc);
            }
            return tx.JSXElement.call(this, node, ctx);
        } });
}
function removeEmptyTextNodes(tx) {
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            var content = node.content.filter(function (c) { return c.kind !== 'text' || c.text !== ''; });
            node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            return tx.JSXElement.call(this, node, ctx);
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
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc, lastid = {};
            properties.forEach(function (p, i) { return p instanceof AST.JSXSpreadProperty || p instanceof AST.JSXStyleProperty || (lastid[p.name] = i); });
            var uniqueProperties = properties.filter(function (p, i) {
                // spreads and styles can be repeated
                return p instanceof AST.JSXSpreadProperty
                    || p instanceof AST.JSXStyleProperty
                    // but named properties can't
                    || lastid[p.name] === i;
            });
            if (properties.length !== uniqueProperties.length) {
                node = new AST.JSXElement(tag, uniqueProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node, ctx);
        } });
}
function translateJSXPropertyNames(tx) {
    return __assign({}, tx, { JSXDynamicProperty: function (node, ctx) {
            if (ctx === TreeContext.HTML) {
                node = new AST.JSXDynamicProperty(translateJSXPropertyName(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty.call(this, node, ctx);
        } });
}
function translateJSXPropertyName(name) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}
function translateHTMLAttributeNames(tx) {
    var txAttributeToProperty = function (name) { return name === "class" ? "className" : name === "for" ? "htmlFor" : name; };
    return __assign({}, tx, { JSXDynamicProperty: function (node, ctx) {
            if (ctx === TreeContext.HTML) {
                node = new AST.JSXDynamicProperty(txAttributeToProperty(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty(node, ctx);
        },
        JSXStaticProperty: function (node, ctx) {
            if (ctx === TreeContext.HTML) {
                node = new AST.JSXStaticProperty(txAttributeToProperty(node.name), node.value);
            }
            return tx.JSXStaticProperty(node, ctx);
        } });
}
function translateSVGPropertyNames(tx) {
    var txPropertyToAttribute = function (name) { return name === "className" ? "class" : name === "htmlFor" ? "for" : name; };
    return __assign({}, tx, { JSXDynamicProperty: function (node, ctx) {
            if (ctx === TreeContext.SVG) {
                node = new AST.JSXDynamicProperty(txPropertyToAttribute(node.name), node.code, node.loc);
            }
            return tx.JSXDynamicProperty(node, ctx);
        },
        JSXStaticProperty: function (node, ctx) {
            if (ctx === TreeContext.SVG) {
                node = new AST.JSXStaticProperty(txPropertyToAttribute(node.name), node.value);
            }
            return tx.JSXStaticProperty(node, ctx);
        } });
}
function translateDeepStylePropertyNames(tx) {
    return __assign({}, tx, { JSXDynamicProperty: function (node, ctx) {
            if (ctx === TreeContext.HTML && node.name.substr(0, 6) === 'style-') {
                node = new AST.JSXDynamicProperty('style.' + node.name.substr(6), node.code, node.loc);
            }
            return tx.JSXDynamicProperty(node, ctx);
        },
        JSXStaticProperty: function (node, ctx) {
            if (ctx === TreeContext.HTML && node.name.substr(0, 6) === 'style-') {
                node = new AST.JSXStaticProperty('style.' + node.name.substr(6), node.value);
            }
            return tx.JSXStaticProperty(node, ctx);
        } });
}
function promoteTextOnlyContentsToTextContentProperties(tx) {
    return __assign({}, tx, { JSXElement: function (node, ctx) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            if (ctx === TreeContext.HTML && content.length === 1 && content[0] instanceof AST.JSXText) {
                var text = this.JSXText(content[0]), textContent = new AST.JSXStaticProperty("textContent", codeStr(text.text));
                node = new AST.JSXElement(tag, properties.concat([textContent]), references, functions, [], loc);
            }
            return tx.JSXElement.call(this, node, ctx);
        } });
}
