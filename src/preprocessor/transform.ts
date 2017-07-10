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
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : CodeTopLevel, opt : Params) => tf.CodeTopLevel(node);

function removeWhitespaceTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        HtmlElement(ctx) { 
            var { tag, properties, content, loc } = ctx.node;
            content = content.filter(c => !(c instanceof HtmlText && rx.ws.test(c.text)));
            if (content.length !== ctx.node.content.length) {
                ctx = ctx.swap(new HtmlElement(tag, properties, content, loc));
            }
            return tx.HtmlElement.call(this, ctx);
        } 
    };
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        DynamicProperty(ctx) {
            let { name, code, loc } = ctx.node;
            if (rx.lowerStart.test(ctx.parent.node.tag) && rx.jsxEventProperty.test(name)) {
                name = name === "onDoubleClick" ? "ondblclick" : name.toLowerCase();
                ctx = ctx.swap(new DynamicProperty(name, code, loc));
            }
            return tx.DynamicProperty.call(this, ctx);
        } 
    };
}

function promoteInitialTextNodesToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        HtmlElement(ctx) {
            const { tag, properties, content, loc } = ctx.node;
            if (rx.lowerStart.test(tag) && content.length > 0 && content[0] instanceof HtmlText) {
                var textContent = new StaticProperty("textContent", codeStr((content[0] as HtmlText).text)),
                    node = new HtmlElement(tag, [ ...properties, textContent ], content.slice(1), loc);
                ctx = ctx.swap(node);
            }
            return tx.HtmlElement.call(this, ctx);
        }
    };
}

