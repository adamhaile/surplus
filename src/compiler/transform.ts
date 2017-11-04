// Cross-browser compatibility shims
import { Program, JSXStaticProperty, JSXDynamicProperty, JSXStyleProperty, JSXSpreadProperty, JSXProperty, JSXElement, JSXText, Copy } from './AST';
import { Params } from './compile';
import { codeStr } from './codeGen';
import { HtmlEntites } from './domRef';

const rx = {
    trimmableWS     : /^\s*?\n\s*|\s*?\n\s*$/g,
    extraWs         : /\s\s+/g,
    jsxEventProperty: /^on[A-Z]/,
    htmlEntity      : /(?:&#(\d+);|&#x([\da-fA-F]+);|&(\w+);)/g
};

const tf = [
    // active transforms, in order from first to last applied
    trimTextNodes,
    collapseExtraWhitespaceInTextNodes,
    removeEmptyTextNodes,
    translateHTMLEntitiesToUnicodeInTextNodes,
    translateJSXPropertyNames,
    translateHTMLPropertyNames,
    promoteTextOnlyContentsToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : Program, opt : Params) => tf.Program(node);

function trimTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node) { 
            if (node.tag !== 'pre') {
                // trim start and end whitespace in text nodes
                let content = node.content.map(c =>
                    c.kind === 'text' 
                    ? new JSXText(c.text.replace(rx.trimmableWS, '')) 
                    : c
                );
                node = new JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            }
            return tx.JSXElement.call(this, node);
        }
    };
}

function collapseExtraWhitespaceInTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            if (node.tag !== 'pre') {
                const lessWsContent = node.content.map(c => 
                    c instanceof JSXText
                    ? new JSXText(c.text.replace(rx.extraWs, ' '))
                    : c
                );
                node = new JSXElement(node.tag, node.properties, node.references, node.functions, lessWsContent, node.loc);
            }
            return tx.JSXElement.call(this, node);
        }
    }
}

function removeEmptyTextNodes(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            let content = node.content.filter(c => c.kind !== 'text' || c.text !== '');
            node = new JSXElement(node.tag, node.properties, node.references, node.functions, content, node.loc);
            return tx.JSXElement.call(this, node);
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
            if (raw !== unicode) node = new JSXText(unicode);
            return tx.JSXText.call(this, node);
        }
    }
}

function removeDuplicateProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            const { tag, properties, references, functions, content, loc } = node,
                lastid = {} as { [ name : string ] : number };

            properties.forEach((p, i) => p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty || (lastid[p.name] = i));

            const uniqueProperties = properties.filter((p, i) => 
                // spreads and styles can be repeated
                p instanceof JSXSpreadProperty 
                || p instanceof JSXStyleProperty 
                // but named properties can't
                || lastid[p.name] === i
            );

            if (properties.length !== uniqueProperties.length) {
                node = new JSXElement(tag, uniqueProperties, references, functions, content, loc);
            }

            return tx.JSXElement.call(this, node);
        }
    }
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node) {
            const { tag, properties, references, functions, content, loc } = node;
            if (node.isHTML) {
                const nonJSXProperties = properties.map(p =>
                    p instanceof JSXDynamicProperty 
                    ? new JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc) 
                    : p
                );
                node = new JSXElement(tag, nonJSXProperties, references, functions, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } 
    };
}

function translateJSXPropertyName(name : string) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}

function translateHTMLPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node) {
            if (node.isHTML) {
                const nonHTMLProperties = node.properties.map(p =>
                    p instanceof JSXDynamicProperty 
                    ? new JSXDynamicProperty(translateHTMLPropertyName(p.name), p.code, p.loc) :
                    p instanceof JSXStaticProperty
                    ? new JSXStaticProperty(translateHTMLPropertyName(p.name), p.value) :
                    p
                );
                node = new JSXElement(node.tag, nonHTMLProperties, node.references, node.functions, node.content, node.loc);
            }
            return tx.JSXElement.call(this, node);
        } 
    };
}

function translateHTMLPropertyName(name : string) {
    return name === "class" ? "className" : name === "for" ? "htmlFor" : name;
}

function promoteTextOnlyContentsToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            const { tag, properties, references, functions, content, loc } = node;
            if (node.isHTML && content.length === 1 && content[0] instanceof JSXText) {
                var text = this.JSXText(content[0] as JSXText),
                    textContent = new JSXStaticProperty("textContent", codeStr(text.text));
                node = new JSXElement(tag, [ ...properties, textContent ], references, functions, [], loc);
            }
            return tx.JSXElement.call(this, node);
        }
    };
}