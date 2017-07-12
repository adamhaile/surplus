// Cross-browser compatibility shims
import { CodeTopLevel, StaticProperty, DynamicProperty, HtmlElement, HtmlText, Copy } from './AST';
import { Params } from './preprocess';
import { codeStr } from './compile';

const rx = {
    ws              : /^\s*$/,
    jsxEventProperty: /^on[A-Z]/,
    lowerStart      : /^[a-z]/,
};

const tf = [
    // active transforms, in order from first to last applied
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : CodeTopLevel, opt : Params) => tf.CodeTopLevel(node);

function removeWhitespaceTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        HtmlElement(node) { 
            const { tag, properties, content, loc } = node,
                nonWhitespaceContent = content.filter(c => !(c instanceof HtmlText && rx.ws.test(c.text)));
            if (nonWhitespaceContent.length !== content.length) {
                node = new HtmlElement(tag, properties, nonWhitespaceContent, loc);
            }
            return tx.HtmlElement.call(this, node);
        } 
    };
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        HtmlElement(node) {
            const { tag, properties, content, loc } = node;
            if (rx.lowerStart.test(tag)) {
                const nonJSXProperties = properties.map(p =>
                    p instanceof DynamicProperty 
                    ? new DynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc) 
                    : p
                );
                node = new HtmlElement(tag, nonJSXProperties, content, loc);
            }
            return tx.HtmlElement.call(this, node);
        } 
    };
}

function translateJSXPropertyName(name : string) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}

function promoteInitialTextNodesToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        HtmlElement(node) {
            const { tag, properties, content, loc } = node;
            if (rx.lowerStart.test(tag) && content.length > 0 && content[0] instanceof HtmlText) {
                var textContent = new StaticProperty("textContent", codeStr((content[0] as HtmlText).text));
                node = new HtmlElement(tag, [ ...properties, textContent ], content.slice(1), loc);
            }
            return tx.HtmlElement.call(this, node);
        }
    };
}

