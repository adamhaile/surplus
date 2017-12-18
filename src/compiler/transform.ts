// Cross-browser compatibility shims
import * as AST from './AST';
import { Params } from './compile';
import { codeStr } from './codeGen';
import { HtmlEntites, SvgOnlyTagRx, SvgForeignTag } from './domRef';

const rx = {
    trimmableWS     : /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs         : /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity      : /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g,
    subcomponent    : /(^[A-Z])|\./
};

// a Copy transform, for building non-identity transforms on top of
const Copy = {
    Program(node : AST.Program) {
        return { type: AST.Program, segments: this.CodeSegments(node.segments) };
    },
    CodeSegments(segments : AST.CodeSegment[]) {
        return segments.map(node => 
            node.type === AST.CodeText ? this.CodeText(node) : 
            this.JSXElement(node, null));
    },
    EmbeddedCode(node : AST.EmbeddedCode) {
        return { type: AST.EmbeddedCode, segments: this.CodeSegments(node.segments) };
    },
    JSXElement(node : AST.JSXElement, parent : AST.JSXElement | null) : AST.JSXElement {
        return { 
            ...node,
            properties: node.properties.map(p => this.JSXProperty(p, node)),
            references: node.references.map(r => this.JSXReference(r)),
            functions: node.functions.map(f => this.JSXFunction(f)),
            content: node.content.map(c => this.JSXContent(c, node))
        };
    },
    JSXProperty(node : AST.JSXProperty, parent : AST.JSXElement) {
        return node.type === AST.JSXStaticProperty  ? this.JSXStaticProperty(node, parent) :
               node.type === AST.JSXDynamicProperty ? this.JSXDynamicProperty(node, parent) :
               node.type === AST.JSXStyleProperty   ? this.JSXStyleProperty(node) :
               this.JSXSpreadProperty(node);
    },
    JSXContent(node : AST.JSXContent, parent : AST.JSXElement) {
        return node.type === AST.JSXComment ? this.JSXComment(node) :
               node.type === AST.JSXText    ? this.JSXText(node) :
               node.type === AST.JSXInsert  ? this.JSXInsert(node) :
               this.JSXElement(node, parent);
    },
    JSXInsert(node : AST.JSXInsert) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    CodeText(node : AST.CodeText) { return node; },
    JSXText(node : AST.JSXText) { return node; },
    JSXComment(node : AST.JSXComment) { return node; },
    JSXStaticProperty(node : AST.JSXStaticProperty, parent : AST.JSXElement) { return node; },
    JSXDynamicProperty(node : AST.JSXDynamicProperty, parent : AST.JSXElement) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    JSXSpreadProperty(node : AST.JSXSpreadProperty) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    JSXStyleProperty(node : AST.JSXStyleProperty) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    JSXReference(node : AST.JSXReference) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    JSXFunction(node : AST.JSXFunction) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    }
};

type Copy = typeof Copy;

const tf = [
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
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : AST.Program, opt : Params) => tf.Program(node);

function determineElementRole(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            const kind = 
                rx.subcomponent.test(node.tag) ? AST.JSXElementKind.SubComponent :
                SvgOnlyTagRx.test(node.tag)    ? AST.JSXElementKind.SVG :
                parent && parent.kind === AST.JSXElementKind.SVG && parent.tag !== SvgForeignTag ? AST.JSXElementKind.SVG :
                AST.JSXElementKind.HTML;
            return tx.JSXElement.call(this, { ...node, kind }, parent);
        }
    }
}

function trimTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node, parent) { 
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                const content = node.content.map(c =>
                    c.type === AST.JSXText ? { ...c, text: c.text.replace(rx.trimmableWS, '') } : c
                );
                node = { ...node, content };
            }
            return tx.JSXElement.call(this, node, parent);
        }
    };
}

function collapseExtraWhitespaceInTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            if (node.tag !== 'pre') {
                const content = node.content.map(c => 
                    c.type === AST.JSXText
                    ? { ...c, text: c.text.replace(rx.extraWs, ' ') }
                    : c
                );
                node = { ...node, content };
            }
            return tx.JSXElement.call(this, node, parent);
        }
    }
}

function removeEmptyTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            let content = node.content.filter(c => c.type !== AST.JSXText || c.text !== '');
            node = { ...node, content };
            return tx.JSXElement.call(this, node, parent);
        }
    }
}

function translateHTMLEntitiesToUnicodeInTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXText(node) {
            const text = node.text.replace(rx.htmlEntity, (entity, dec, hex, named) =>
                dec ? String.fromCharCode(parseInt(dec, 10)) :
                hex ? String.fromCharCode(parseInt(hex, 16)) :
                HtmlEntites[named] ||
                entity
            );
            if (text !== node.text) node = { ...node, text };
            return tx.JSXText.call(this, node);
        }
    }
}

function removeDuplicateProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            const lastid = {} as { [ name : string ] : number };

            node.properties.forEach((p, i) => p.type === AST.JSXSpreadProperty || p.type === AST.JSXStyleProperty || (lastid[p.name] = i));

            const properties = node.properties.filter((p, i) => 
                // spreads and styles can be repeated
                p.type === AST.JSXSpreadProperty 
                || p.type === AST.JSXStyleProperty 
                // but named properties can't
                || lastid[p.name] === i
            );

            if (properties.length !== node.properties.length) {
                node = { ...node, properties };
            }

            return tx.JSXElement.call(this, node, parent);
        }
    }
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXDynamicProperty(node, parent) {
            if (parent.kind === AST.JSXElementKind.HTML) {
                node = { ...node, name: translateJSXPropertyName(node.name) };
            }
            return tx.JSXDynamicProperty.call(this, node, parent);
        } 
    };
}

function translateJSXPropertyName(name : string) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}

function translateHTMLAttributeNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXProperty(node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty) 
                && parent.kind === AST.JSXElementKind.HTML
            ) {
                const name = node.name === "class" ? "className" : node.name === "for" ? "htmlFor" : node.name;
                node = { ...node, name };
            }
            return tx.JSXProperty.call(this, node, parent);
        }
    };
}

function translateSVGPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXProperty(node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty) 
                && parent.kind === AST.JSXElementKind.SVG
            ) {
                const name = node.name === "className" ? "class" : node.name === "htmlFor" ? "for" : node.name
                node = { ...node, name };
            }
            return tx.JSXProperty.call(this, node, parent);
        }
    };
}

function translateDeepStylePropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXProperty(node, parent) {
            if ((node.type === AST.JSXDynamicProperty || node.type === AST.JSXStaticProperty) 
                && parent.kind === AST.JSXElementKind.HTML 
                && node.name.substr(0, 6) === 'style-'
            ) {
                node = { ...node, name: 'style.' + node.name.substr(6) };
            }
            return tx.JSXProperty.call(this, node, parent);
        }
    };
}

function promoteTextOnlyContentsToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            const content0 = node.content[0];
            if (node.kind === AST.JSXElementKind.HTML && node.content.length === 1 && content0.type === AST.JSXText) {
                var text = this.JSXText(content0),
                    textContent = { type: AST.JSXStaticProperty, name: "textContent", value: codeStr(text.text) };
                node = { ...node, properties: [ ...node.properties, textContent ], content: [] };
            }
            return tx.JSXElement.call(this, node, parent);
        }
    };
}
