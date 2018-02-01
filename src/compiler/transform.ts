// Cross-browser compatibility shims
import * as AST from './AST';
import { Params } from './compile';
import { codeStr } from './codeGen';
import { htmlEntites, svgOnlyTagRx, svgForeignTag } from './domRef';
import { isAttrOnlyField, isPropOnlyField, getAttrName, getPropName, isDeepProp, isNSAttr } from './fieldNames';
import { JSXElementKind } from './AST';

const rx = {
    trimmableWS     : /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs         : /\s\s+/g,
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
            fields: node.fields.map(p => this.JSXField(p, node)),
            references: node.references.map(r => this.JSXReference(r)),
            functions: node.functions.map(f => this.JSXFunction(f)),
            content: node.content.map(c => this.JSXContent(c, node))
        };
    },
    JSXField(node : AST.JSXField, parent : AST.JSXElement) {
        return node.type === AST.JSXStaticField  ? this.JSXStaticField(node, parent) :
               node.type === AST.JSXDynamicField ? this.JSXDynamicField(node, parent) :
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
    JSXStaticField(node : AST.JSXStaticField, parent : AST.JSXElement) { return node; },
    JSXDynamicField(node : AST.JSXDynamicField, parent : AST.JSXElement) {
        return { ...node, code: this.EmbeddedCode(node.code) };
    },
    JSXSpreadProperty(node : AST.JSXSpread) {
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
    determinePropertiesAndAttributes,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateFields
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : AST.Program, opt : Params) => tf.Program(node);

function determineElementRole(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            const kind = 
                rx.subcomponent.test(node.tag) ? AST.JSXElementKind.SubComponent :
                svgOnlyTagRx.test(node.tag)    ? AST.JSXElementKind.SVG :
                parent && parent.kind === AST.JSXElementKind.SVG && parent.tag !== svgForeignTag ? AST.JSXElementKind.SVG :
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
                htmlEntites[named] ||
                entity
            );
            if (text !== node.text) node = { ...node, text };
            return tx.JSXText.call(this, node);
        }
    }
}

function removeDuplicateFields(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node, parent) {
            const lastid = {} as { [ name : string ] : number };

            node.fields.forEach((p, i) => p.type === AST.JSXSpread || p.type === AST.JSXStyleProperty || (lastid[p.name] = i));

            const fields = node.fields.filter((p, i) => 
                // spreads and styles can be repeated
                p.type === AST.JSXSpread 
                || p.type === AST.JSXStyleProperty 
                // but named properties can't
                || lastid[p.name] === i
            );

            if (fields.length !== node.fields.length) {
                node = { ...node, fields };
            }

            return tx.JSXElement.call(this, node, parent);
        }
    }
}

function determinePropertiesAndAttributes(tx : Copy) : Copy {
    // strategy: HTML prefers props, JSX attrs, unless not possible
    // translate given field name into attr/prop appropriate versions (snake vs camel case)
    // handle deep props and attr namespaces
    return { 
        ...tx, 
        JSXField(node, parent) {
            if ((node.type === AST.JSXDynamicField || node.type === AST.JSXStaticField) && parent.kind !== JSXElementKind.SubComponent) {
                let attr       =  parent.kind === JSXElementKind.SVG && !isPropOnlyField(node.name)
                               || parent.kind === JSXElementKind.HTML && isAttrOnlyField(node.name),
                    name       = attr ? getAttrName(node.name) : getPropName(node.name),
                    namespace  = null as null | string,
                    namespaced = attr ? isNSAttr(name) : isDeepProp(name);
                if (namespaced) [ namespace, name ] = namespaced;
                node = { ...node, attr, name, namespace };
            }
            return tx.JSXField.call(this, node, parent);
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
                    textContent = { type: AST.JSXStaticField, name: "textContent", attr: false, namespace: null, value: codeStr(text.text) };
                node = { ...node, fields: [ ...node.fields, textContent ], content: [] };
            }
            return tx.JSXElement.call(this, node, parent);
        }
    };
}
