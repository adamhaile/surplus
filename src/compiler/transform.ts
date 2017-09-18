// Cross-browser compatibility shims
import { Program, JSXStaticProperty, JSXDynamicProperty, JSXSpreadProperty, JSXProperty, JSXElement, JSXText, Copy } from './AST';
import { Params } from './compile';
import { codeStr } from './codeGen';

const rx = {
    ws              : /^\s*$/,
    jsxEventProperty: /^on[A-Z]/
};

const tf = [
    // active transforms, in order from first to last applied
    removeWhitespaceTextNodes,
    translateJSXPropertyNames,
    promoteInitialTextNodesToTextContentProperties,
    removeDuplicateProperties
].reverse().reduce((tf, fn) => fn(tf), Copy);

export const transform = (node : Program, opt : Params) => tf.Program(node);

function removeWhitespaceTextNodes(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node) { 
            const { tag, properties, content, loc } = node,
                nonWhitespaceContent = content.filter(c => !(c instanceof JSXText && rx.ws.test(c.text)));
             if (nonWhitespaceContent.length !== content.length) {
                node = new JSXElement(tag, properties, nonWhitespaceContent, loc);
            }
            return tx.JSXElement.call(this, node);        
        }
    };
}

function removeDuplicateProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            const { tag, properties, content, loc } = node,
                lastid = {} as { [ name : string ] : number };

            properties.forEach((p, i) => p instanceof JSXSpreadProperty || (lastid[p.name] = i));

            const uniqueProperties = properties.filter((p, i) => 
                p instanceof JSXSpreadProperty 
                || JSXDynamicProperty.SpecialPropName.test(p.name) 
                || lastid[p.name] === i
            );

            if (properties.length !== uniqueProperties.length) {
                node = new JSXElement(tag, uniqueProperties, content, loc);
            }

            return tx.JSXElement.call(this, node);
        }
    }
}

function translateJSXPropertyNames(tx : Copy) : Copy {
    return { 
        ...tx, 
        JSXElement(node) {
            const { tag, properties, content, loc } = node;
            if (node.isHTML) {
                const nonJSXProperties = properties.map(p =>
                    p instanceof JSXDynamicProperty 
                    ? new JSXDynamicProperty(translateJSXPropertyName(p.name), p.code, p.loc) 
                    : p
                );
                node = new JSXElement(tag, nonJSXProperties, content, loc);
            }
            return tx.JSXElement.call(this, node);
        } 
    };
}

function translateJSXPropertyName(name : string) {
    return rx.jsxEventProperty.test(name) ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase()) : name;
}

function promoteInitialTextNodesToTextContentProperties(tx : Copy) : Copy {
    return {
        ...tx,
        JSXElement(node) {
            const { tag, properties, content, loc } = node;
            if (node.isHTML && content.length > 0 && content[0] instanceof JSXText) {
                var textContent = new JSXStaticProperty("textContent", codeStr((content[0] as JSXText).text));
                node = new JSXElement(tag, [ ...properties, textContent ], content.slice(1), loc);
            }
            return tx.JSXElement.call(this, node);
        }
    };
}

