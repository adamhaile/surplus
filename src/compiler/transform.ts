// Cross-browser compatibility shims
import * as AST from './AST';
import { Params } from './compile';
import { codeStr } from './codeGen';
import { HtmlEntites, SvgOnlyTagRx, SvgForeignTag } from './domRef';

const rx = {
    trimmableWS     : /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs         : /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity      : /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g
};

// a Copy transform, for building non-identity transforms on top of
export const Copy = {
    Program(node : AST.Program) {
        return new AST.Program(this.CodeSegments(node.segments));
    },
    CodeSegments(segments : AST.CodeSegment[]) {
        return segments.map(node => 
            node instanceof AST.CodeText ? this.CodeText(node) : 
            this.JSXElement(node, false));
    },
    EmbeddedCode(node : AST.EmbeddedCode) {
        return new AST.EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement(node : AST.JSXElement, svg : boolean) : AST.JSXElement {
        return new AST.JSXElement(node.tag, 
            node.properties.map(p => this.JSXProperty(p)),
            node.references.map(r => this.JSXReference(r)),
            node.functions.map(f => this.JSXFunction(f)),
            node.content.map(c => this.JSXContent(c, node, svg)),
            node.loc
        );
    },
    JSXProperty(node : AST.JSXProperty) {
        return node instanceof AST.JSXStaticProperty  ? this.JSXStaticProperty(node) :
               node instanceof AST.JSXDynamicProperty ? this.JSXDynamicProperty(node) :
               node instanceof AST.JSXStyleProperty ? this.JSXStyleProperty(node) :
               this.JSXSpreadProperty(node);
    },
    JSXContent(node : AST.JSXContent, parent : AST.JSXElement, svg : boolean) {
        return node instanceof AST.JSXComment ? this.JSXComment(node) :
               node instanceof AST.JSXText    ? this.JSXText(node) :
               node instanceof AST.JSXInsert  ? this.JSXInsert(node) :
               this.JSXElement(node, svg || SvgOnlyTagRx.test(node.tag));
    },
    JSXInsert(node : AST.JSXInsert) {
        return new AST.JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText(node : AST.CodeText) { return node; },
    JSXText(node : AST.JSXText) { return node; },
    JSXComment(node : AST.JSXComment) { return node; },
    JSXStaticProperty(node : AST.JSXStaticProperty) { return node; },
    JSXDynamicProperty(node : AST.JSXDynamicProperty) {
        return new AST.JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty(node : AST.JSXSpreadProperty) {
        return new AST.JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXStyleProperty(node : AST.JSXStyleProperty) {
        return new AST.JSXStyleProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXReference(node : AST.JSXReference) {
        return new AST.JSXReference(this.EmbeddedCode(node.code), node.loc);
    },
    JSXFunction(node : AST.JSXFunction) {
        return new AST.JSXFunction(this.EmbeddedCode(node.code), node.loc);
    }
};

export type Copy = typeof Copy;

const tf = [
    // active transforms, in order from first to last applied
    setTreeContext,
    trimTextNodes,
    collapseExtraWhitespaceInTextNodes,
    removeEmptyTextNodes,
    translateHTMLEntitiesToUnicodeInTextNodes,
    translateJSXPropertyNames,
    translateHTMLPropertyNames,
    translateDeepStylePropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : AST.Program, opt : Params) => tf.Program(node);

function setTreeContext(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, svg) {
            return tx.JSXElement(node, svg || SvgOnlyTagRx.test(node.tag));
        },
        JSXContent(node, parent, svg) {
            return tx.JSXContent(node, parent, svg && parent.tag !== SvgForeignTag)
        }
    }
}

function trimTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node, svg) { 
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                let content = node.content.map(c =>
                    c.kind === 'text' 
                    ? new AST.JSXText(c.text.replace(rx.trimmableWS, '')) 
                    : c
                );
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        }
    };
}

function collapseExtraWhitespaceInTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, svg) {
            if (node.tag !== 'pre') {
                const lessWsContent = node.content.map(c => 
                    c instanceof AST.JSXText
                    ? new AST.JSXText(c.text.replace(rx.extraWs, ' '))
                    : c
                );
                node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, lessWsContent, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        }
    }
}

function removeEmptyTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, svg) {
            let content = node.content.filter(c => c.kind !== 'text' || c.text !== '');
            node = new AST.JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            return tx.JSXElement.call(this, node, svg);
        }
    }
}

function translateHTMLEntitiesToUnicodeInTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXText(node) {
            const 
                raw = node.text,
                unicode = raw.replace(rx.htmlEntity, (entity, dec, hex, named) =>
                    dec ? String.fromCharCode(parseInt(dec, 10)) :
                    hex ? String.fromCharCode(parseInt(hex, 16)) :
                    HtmlEntites[named] ||
                    entity
                );
            if (raw !== unicode) node = new AST.JSXText(unicode);
            return tx.JSXText.call(this, node);
        }
    }
}

function removeDuplicateProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, svg) {
            const { tag, properties, references, functions, content, loc } = node,
                lastid = {} as { [ name : string ] : number };

            properties.forEach((p, i) => p instanceof AST.JSXSpreadProperty || p instanceof AST.JSXStyleProperty || (lastid[p.name] = i));

            const uniqueProperties = properties.filter((p, i) => 
                // spreads and styles can be repeated
                p instanceof AST.JSXSpreadProperty 
                || p instanceof AST.JSXStyleProperty 
                // but named properties can't
                || lastid[p.name] === i
            );

            if (properties.length !== uniqueProperties.length) {
                node = new AST.JSXElement(tag, uniqueProperties, references, functions, content, loc);
            }

            return tx.JSXElement.call(this, node, svg);
        }
    }
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node, svg) {
            const { tag, properties, references, functions, content, loc } = node;
            if (node.isHTML) {
                const nonJSXProperties = properties.map(p =>
                    p instanceof AST.JSXDynamicProperty 
                    ? new AST.JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc) 
                    : p
                );
                node = new AST.JSXElement(tag, nonJSXProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } 
    };
}

function translateJSXPropertyName(name : string) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}

function translateHTMLPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node, svg) {
            if (node.isHTML) {
                const transName = svg ? translateHTMLPropertyToAttribute : translateHTMLAttributeToProperty,
                    translatedProperties = node.properties.map(p =>
                        p instanceof AST.JSXDynamicProperty 
                        ? new AST.JSXDynamicProperty(transName(p.name), p.code, p.loc) :
                        p instanceof AST.JSXStaticProperty
                        ? new AST.JSXStaticProperty(transName(p.name), p.value) :
                        p
                    );
                node = new AST.JSXElement(node.tag, translatedProperties, node.references, node.functions, node.content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } 
    };
}

function translateHTMLAttributeToProperty(name : string) {
    return name === "class" ? "className" : name === "for" ? "htmlFor" : name;
}

function translateHTMLPropertyToAttribute(name : string) {
    return name === "className" ? "class" : name === "htmlFor" ? "for" : name;
}

function translateDeepStylePropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node, svg) {
            if (node.isHTML) {
                const nonJSXProperties = node.properties.map(p =>
                    p instanceof AST.JSXDynamicProperty && p.name.substr(0, 6) === 'style-' ?
                        new AST.JSXDynamicProperty('style.' + p.name.substr(6), p.code, p.loc) :
                    p instanceof AST.JSXStaticProperty && p.name.substr(0, 6) === 'style-' ?
                        new AST.JSXStaticProperty('style.' + p.name.substr(6), p.value) :
                    p
                );
                node = new AST.JSXElement(node.tag, nonJSXProperties, node.references, node.functions, node.content, node.loc);
            }
            return tx.JSXElement.call(this, node, svg);
        } 
    };
}

function promoteTextOnlyContentsToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, svg) {
            const { tag, properties, references, functions, content, loc } = node;
            if (node.isHTML && content.length === 1 && content[0] instanceof AST.JSXText) {
                var text = this.JSXText(content[0] as AST.JSXText),
                    textContent = new AST.JSXStaticProperty("textContent", codeStr(text.text));
                node = new AST.JSXElement(tag, [ ...properties, textContent ], references, functions, [], loc);
            }
            return tx.JSXElement.call(this, node, svg);
        }
    };
}
