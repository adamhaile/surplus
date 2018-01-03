import { 
    Program,   
    EmbeddedCode,   
    CodeText,       
    JSXElement,    
    JSXElementKind,
    JSXText,       
    JSXComment,    
    JSXInsert,     
    JSXProperty,
    JSXStaticProperty, 
    JSXDynamicProperty,
    JSXStyleProperty,
    JSXFunction,
    JSXContent,
    JSXSpreadProperty,  
    CodeSegment
} from './AST';
import { LOC } from './parse';
import { locationMark } from './sourcemap';
import { Params } from './compile';
import { IsAttribute } from './domRef';

export { codeGen, codeStr };

// pre-compiled regular expressions
const rx = {
    backslashes : /\\/g,
    newlines    : /\r?\n/g,
    hasParen    : /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen : /\)\s*$/,
    nonIdChars  : /[^a-zA-Z0-9]/,
    doubleQuotes: /"/g,
    indent      : /\n(?=[^\n]+$)([ \t]*)/
};

class DOMExpression {
    constructor(
        public readonly ids          : string[],
        public readonly statements   : string[],
        public readonly computations : Computation[]
    ) { }
}

class Computation {
    constructor(
        public readonly statements : string[],
        public readonly loc : LOC,
        public readonly stateVar : string | null,
        public readonly seed : string | null,
    ) { }
}

class SubComponent {
    constructor(
        public readonly name : string,
        public readonly refs : string[],
        public readonly fns : string[],
        public readonly properties : (string | { [ name : string ] : string })[],
        public readonly children : string[],
        public readonly loc : LOC
    ) { }
}

const codeGen = (ctl : Program, opts : Params) => {
    const compileSegments = (node : Program | EmbeddedCode) => {
            return node.segments.reduce((res, s) => res + compileSegment(s, res), "");
        },
        compileSegment = (node : CodeSegment, previousCode : string) => 
            node.type === CodeText ? compileCodeText(node) : compileJSXElement(node, indent(previousCode)),
        compileCodeText = (node : CodeText) =>
            markBlockLocs(node.text, node.loc, opts),
        compileJSXElement = (node : JSXElement, indent : Indents) : string => {
            const code = 
                node.kind === JSXElementKind.SubComponent 
                ? compileSubComponent(node, indent) 
                : compileHtmlElement(node, indent);
            return markLoc(code, node.loc, opts);
        },
        compileSubComponent = (node : JSXElement, indent : Indents) : string => {
            return emitSubComponent(buildSubComponent(node), indent);
        },
        compileHtmlElement = (node : JSXElement, indent : Indents) : string => {
            const svg = node.kind === JSXElementKind.SVG;
            return (
                // optimization: don't need IIFE for simple single nodes
                (node.properties.length === 0 && node.functions.length === 0 && node.content.length === 0) ?
                    node.references.map(r => compileSegments(r.code) + ' = ').join('')
                    + `Surplus.create${svg ? 'Svg' : ''}Element('${node.tag}', null, null)` :
                // optimization: don't need IIFE for simple single nodes with a single class attribute
                (node.properties.length === 1 
                    && node.properties[0].type === JSXStaticProperty 
                    && (node.properties[0] as JSXStaticProperty).name === (svg ? "class" : "className")
                    && node.functions.length === 0
                    && node.content.length === 0) ?
                    node.references.map(r => compileSegments(r.code) + ' = ').join('')
                    + `Surplus.create${svg ? 'Svg' : ''}Element('${node.tag}', ${(node.properties[0] as JSXStaticProperty).value}, null)` :
                emitDOMExpression(buildDOMExpression(node), indent)
            );
        },
        buildSubComponent = (node : JSXElement) => {
            const 
                refs = node.references.map(r => compileSegments(r.code)),
                fns = node.functions.map(r => compileSegments(r.code)),
                // group successive properties into property objects, but spreads stand alone
                // e.g. a="1" b={foo} {...spread} c="3" gets combined into [{a: "1", b: foo}, spread, {c: "3"}]
                properties = node.properties.reduce((props : (string | { [name : string] : string })[], p) => {
                    const lastSegment = props.length > 0 ? props[props.length - 1] : null,
                        value = p.type === JSXStaticProperty ? p.value : compileSegments(p.code);
                    
                    if (p.type === JSXSpreadProperty) {
                        props.push(value);
                    } else if (lastSegment === null 
                        || typeof lastSegment === 'string' 
                        || (p.type === JSXStyleProperty && lastSegment["style"])
                    ) {
                        props.push({ [p.name]: value });
                    } else {
                        lastSegment[p.name] = value;
                    }

                    return props;
                }, []),
                children = node.content.map(c => 
                    c.type === JSXElement ? compileJSXElement(c, indent("")) :
                    c.type === JSXText    ? codeStr(c.text.trim()) :
                    c.type === JSXInsert  ? compileSegments(c.code) :
                    `document.createComment(${codeStr(c.text)})`
                ); 

            return new SubComponent(node.tag, refs, fns, properties, children, node.loc);
        },
        emitSubComponent = (sub : SubComponent, indent : Indents) => {
            const { nl, nli, nlii } = indent;

            // build properties expression
            const 
                // convert children to an array expression
                children = sub.children.length === 0 ? null : 
                    sub.children.length === 1 ? sub.children[0] :
                    '[' + nlii
                        + sub.children.join(',' + nlii) + nli
                    + ']',
                lastProperty = sub.properties.length === 0 ? null : sub.properties[sub.properties.length - 1],
                // if there are any children, add them to (or add a) last object
                propertiesWithChildren = 
                    children === null ? sub.properties :
                    lastProperty === null || typeof lastProperty === 'string' ?
                        // add a new property object to hold children
                        [...sub.properties, { children: children }] :
                    // add children to last property object
                    [...sub.properties.slice(0, sub.properties.length - 1), { ...lastProperty, children: children }],
                // if we're going to ber Object.assign'ing to the first object, it needs to be one we made, not a spread
                propertiesWithInitialObject = 
                    propertiesWithChildren.length === 0 || (propertiesWithChildren.length > 1 && typeof propertiesWithChildren[0] === 'string')
                    ? [ {}, ...propertiesWithChildren ]
                    : propertiesWithChildren,
                propertyExprs = propertiesWithInitialObject.map(obj =>
                    typeof obj === 'string' ? obj :
                    '{' + Object.keys(obj).map(p => `${nli}${codeStr(p)}: ${obj[p]}`).join(',') + nl + '}'
                ),
                properties = propertyExprs.length === 1 ? propertyExprs[0] :
                    `Object.assign(${propertyExprs.join(', ')})`;
            
            // main call to sub-component
            let expr = `${sub.name}(${properties})`;

            // ref assignments
            if (sub.refs.length > 0) {
                expr = sub.refs.map(r => r + " = ").join("") + expr;
            }

            // build computations for fns
            if (sub.fns.length > 0) {
                const comps = sub.fns.map(fn => new Computation([`(${fn})(__, __state);`], sub.loc, '__state', null));
                
                expr = `(function (__) {${
                    nli}var __ = ${expr};${
                    nli}${comps.map(comp => emitComputation(comp, indent) + nli)}${
                    nli}return __;${
                nl}})()`;
            }
            
            return expr;
        },
        buildDOMExpression = (top : JSXElement) => {
            const ids = [] as string[],
                statements = [] as string[],
                computations = [] as Computation[];

            const buildHtmlElement = (node : JSXElement, parent : string, n : number) => {
                const { tag, properties, references, functions, content, loc } = node;
                if (node.kind === JSXElementKind.SubComponent) {
                    buildInsertedSubComponent(node, parent, n);
                } else {
                    const
                        id           = addId(parent, tag, n),
                        svg          = node.kind === JSXElementKind.SVG,
                        propExprs    = properties.map(p => p.type === JSXStaticProperty ? '' : compileSegments(p.code)), 
                        spreads      = properties.filter(p => p.type === JSXSpreadProperty || p.type === JSXStyleProperty),
                        classProp    = spreads.length === 0 && properties.filter(p => p.type === JSXStaticProperty && (svg ? p.name === 'class' : p.name === 'className'))[0] as JSXStaticProperty || null,
                        propsDynamic = propExprs.some(e => !noApparentSignals(e)),
                        propStmts    = properties.map((p, i) => 
                            p === classProp                 ? '' :
                            p.type === JSXStaticProperty  ? buildProperty(id, p.name, p.value, svg) :
                            p.type === JSXDynamicProperty ? buildProperty(id, p.name, propExprs[i], svg) :
                            p.type === JSXStyleProperty   ? buildStyle(p, id, propExprs[i], propsDynamic, spreads) :
                            buildSpread(id, propExprs[i], svg)
                        ).filter(s => s !== ''),
                        refStmts     = references.map(r => compileSegments(r.code) + ' = ').join('');

                    addStatement(`${id} = ${refStmts}Surplus.create${svg ? 'Svg' : ''}Element('${tag}', ${classProp && classProp.value}, ${parent || null});`);
                    
                    if (!propsDynamic) {
                        propStmts.forEach(addStatement);
                    }
                    
                    if (content.length === 1 && content[0].type === JSXInsert) {
                        buildJSXContent(content[0] as JSXInsert, id);
                    } else {
                        content.forEach((c, i) => buildChild(c, id, i));
                    }

                    if (propsDynamic) {
                        addComputation(propStmts, null, null, loc);
                    }

                    functions.forEach(f => buildNodeFn(f, id));
                }
            },
            buildProperty = (id : string, prop : string, expr : string, svg : boolean) =>
                svg || IsAttribute(prop)
                ? `Surplus.setAttribute(${id}, ${codeStr(prop)}, ${expr});`
                : `${id}.${prop} = ${expr};`,
            buildSpread = (id : string, expr : string, svg : boolean) =>
                `Surplus.spread(${id}, ${expr}, ${svg});`,
            buildNodeFn = (node : JSXFunction, id : string) => {
                var expr = compileSegments(node.code);
                addComputation([`(${expr})(${id}, __state);`], '__state', null, node.loc);
            },
            buildStyle = (node : JSXStyleProperty, id : string, expr : string, dynamic : boolean, spreads : JSXProperty[]) =>
                `Surplus.assign(${id}.style, ${expr});`,
            buildChild = (node : JSXContent, parent : string, n : number) =>
                node.type === JSXElement ? buildHtmlElement(node, parent, n) :
                node.type === JSXComment ? buildHtmlComment(node, parent) :
                node.type === JSXText    ? buildJSXText(node, parent, n) :
                buildJSXInsert(node, parent, n),
            buildInsertedSubComponent = (node : JSXElement, parent : string, n : number) => 
                buildJSXInsert({ type: JSXInsert, code: { type: EmbeddedCode, segments: [node] }, loc: node.loc }, parent, n),
            buildHtmlComment = (node : JSXComment, parent : string) =>
                addStatement(`Surplus.createComment(${codeStr(node.text)}, ${parent})`),
            buildJSXText = (node : JSXText, parent : string, n : number) =>
                addStatement(`Surplus.createTextNode(${codeStr(node.text)}, ${parent})`),
            buildJSXInsert = (node : JSXInsert, parent : string, n : number) => {
                const id = addId(parent, 'insert', n),
                    ins = compileSegments(node.code),
                    range = `{ start: ${id}, end: ${id} }`;
                addStatement(`${id} = Surplus.createTextNode('', ${parent})`);
                addComputation([`Surplus.insert(__range, ${ins});`], "__range", range, node.loc);
            },
            buildJSXContent = (node : JSXInsert, parent : string) => {
                const content = compileSegments(node.code),
                    dynamic = !noApparentSignals(content);
                if (dynamic) addComputation([`Surplus.content(${parent}, ${content}, __current);`], '__current', "''", node.loc);
                else addStatement(`Surplus.content(${parent}, ${content}, "");`);
            },
            addId = (parent : string, tag : string, n : number) => {
                tag = tag.replace(rx.nonIdChars, '_');
                const id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
                ids.push(id);
                return id;
            },
            addStatement = (stmt : string) =>
                statements.push(stmt),
            addComputation = (body : string[], stateVar : string | null, seed : string | null, loc : LOC) => {
                computations.push(new Computation(body, loc, stateVar, seed));
            }

            buildHtmlElement(top, '', 0);

            return new DOMExpression(ids, statements, computations);
        },
        emitDOMExpression = (code : DOMExpression, indent : Indents) => {
            const { nl, nli, nlii } = indent;
            return '(function () {' + nli
                + 'var ' + code.ids.join(', ') + ';' + nli
                + code.statements.join(nli) + nli
                + code.computations.map(comp => emitComputation(comp, indent))
                    .join(nli) + (code.computations.length === 0 ? '' : nli)
                + 'return __;' + nl
                +  '})()';
        },
        emitComputation = (comp : Computation, { nli, nlii } : Indents) => {
            const { statements, loc, stateVar, seed } = comp;

            if (stateVar) statements[statements.length - 1] = 'return ' + statements[statements.length - 1];

            const body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nli),
                code = `Surplus.S(function (${stateVar || ''}) {${body}}${seed !== null ? `, ${seed}` : ''});`;

            return markLoc(code, loc, opts);
        };

        return compileSegments(ctl);
    };

const
    noApparentSignals = (code : string) =>
        !rx.hasParen.test(code) || (rx.loneFunction.test(code) && !rx.endsInParen.test(code)),
    indent = (previousCode : string) : Indents => {
        const m  = rx.indent.exec(previousCode),
            pad  = m ? m[1] : '',
            nl   = "\r\n" + pad,
            nli  = nl   + '    ',
            nlii = nli  + '    ';

        return { nl, nli, nlii };
    },
    codeStr = (str : string) =>
        '"' + 
        str.replace(rx.backslashes, "\\\\")
           .replace(rx.doubleQuotes, "\\\"")
           .replace(rx.newlines, "\\n") +
        '"';

interface Indents { nl : string, nli : string, nlii : string }

const 
    markLoc = (str : string, loc : LOC, opts : Params) =>
        opts.sourcemap ? locationMark(loc) + str : str,
    markBlockLocs = (str : string, loc : LOC, opts : Params) => {
        if (!opts.sourcemap) return str;

        let lines = str.split('\n'),
            offset = 0;

        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            offset += line.length;
            let lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
            lines[i] = locationMark(lineloc) + line;
        }

        return locationMark(loc) + lines.join('\n');
    };
