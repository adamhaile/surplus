import { 
    Program,   
    EmbeddedCode,   
    CodeText,       
    JSXElement,    
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
import { SvgOnlyTagRx, SvgForeignTag, IsAttribute } from './domRef';

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
            node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode)),
        compileCodeText = (node : CodeText) =>
            markBlockLocs(node.text, node.loc, opts),
        compileHtmlElement = (node : JSXElement, indent : Indents) : string => {
            const code = 
                !node.isHTML ?
                    emitSubComponent(buildSubComponent(node), indent) :
                (node.properties.length === 0 && node.functions.length === 0 && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    node.references.map(r => compileSegments(r.code) + ' = ').join('')
                    + `Surplus.createElement('${node.tag}', null, null)` :
                (node.properties.length === 1 
                    && node.properties[0] instanceof JSXStaticProperty 
                    && (node.properties[0] as JSXStaticProperty).name === "className" 
                    && node.functions.length === 1
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    node.references.map(r => compileSegments(r.code) + ' = ').join('')
                    + `Surplus.createElement('${node.tag}', ${(node.properties[0] as JSXStaticProperty).value}, null)` :
                emitDOMExpression(buildDOMExpression(node), indent);
            return markLoc(code, node.loc, opts);
        },
        buildSubComponent = (node : JSXElement) => {
            const 
                refs = node.references.map(r => compileSegments(r.code)),
                fns = node.functions.map(r => compileSegments(r.code)),
                // group successive properties into property objects, but spreads stand alone
                // e.g. a="1" b={foo} {...spread} c="3" gets combined into [{a: "1", b: foo}, spread, {c: "3"}]
                properties = node.properties.reduce((props : (string | { [name : string] : string })[], p) => {
                    const lastSegment = props.length > 0 ? props[props.length - 1] : null,
                        value = p instanceof JSXStaticProperty ? p.value : compileSegments(p.code);
                    
                    if (p instanceof JSXSpreadProperty) {
                        props.push(value);
                    } else if (lastSegment === null 
                        || typeof lastSegment === 'string' 
                        || (p instanceof JSXStyleProperty && lastSegment["style"])
                    ) {
                        props.push({ [p.name]: value });
                    } else {
                        lastSegment[p.name] = value;
                    }

                    return props;
                }, []),
                children = node.content.map(c => 
                    c instanceof JSXElement ? compileHtmlElement(c, indent("")) :
                    c instanceof JSXText    ? codeStr(c.text.trim()) :
                    c instanceof JSXInsert  ? compileSegments(c.code) :
                    `document.createComment(${codeStr(c.text)})`
                ); 

            return new SubComponent(node.tag, refs, fns, properties, children, node.loc);
        },
        emitSubComponent = (sub : SubComponent, indent : Indents) => {
            const { nl, nli, nlii } = indent;

            // build properties expression
            const 
                // convert children to an array expression
                children = sub.children.length === 0 ? '[]' : '[' + nlii
                    + sub.children.join(',' + nlii) + nli
                    + ']',
                property0 = sub.properties.length === 0 ? null : sub.properties[0],
                propertiesWithChildren = property0 === null || typeof property0 === 'string' 
                    // add children to first property object if we can, otherwise add an initial property object with just children
                    ? [{ children: children }, ...sub.properties ]
                    : [{ ...property0, children: children }, ...sub.properties.splice(1)],
                propertyExprs = propertiesWithChildren.map(obj =>
                    typeof obj === 'string' ? obj :
                    '{' + Object.keys(obj).map(p => `${nli}${p}: ${obj[p]}`).join(',') + nl + '}'
                ),
                properties = propertyExprs.length === 1 ? propertyExprs[0] :
                    `Object.assign(${propertyExprs.join(', ')})`;
            
            // main call to sub-component
            let expr = `${sub.name}(${properties})`;

            // ref assignments
            if (sub.refs.length > 0) {
                expr = sub.refs.map(r => r + " = ").join("") + expr;
            }

            // build computation for fns
            if (sub.fns.length > 0) {
                const 
                    vars = sub.fns.length === 1 ? null : sub.fns.map((fn, i) => `__state${i}`),
                    comp = sub.fns.length === 1 
                        ? new Computation([`(${sub.fns[0]})(__, __state);`], sub.loc, '__state', null)
                        : new Computation(sub.fns.map((fn, i) => `__state${i} = (${fn})(__, __state${i});`), sub.loc, null, null);
                
                expr = '(function (__) { ' + nli +
                    (vars ? `var ${vars.join(', ')};` + nli : '') +
                    emitComputation(comp, indent) + nli +
                    'return __;' + nl +
                `})(${expr})`;
            }
            
            return expr;
        },
        buildDOMExpression = (top : JSXElement) => {
            const ids = [] as string[],
                statements = [] as string[],
                computations = [] as Computation[];

            const buildHtmlElement = (node : JSXElement, parent : string, n : number, svg : boolean) => {
                const { tag, properties, references, functions, content, loc } = node;
                svg = svg || SvgOnlyTagRx.test(tag);
                if (!node.isHTML) {
                    buildInsertedSubComponent(node, parent, n);
                } else {
                    const
                        id           = addId(parent, tag, n),
                        propExprs    = properties.map(p => p instanceof JSXStaticProperty ? '' : compileSegments(p.code)), 
                        spreads      = properties.filter(p => p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty),
                        classProp    = spreads.length === 0 && properties.filter(p => p instanceof JSXStaticProperty && p.name === 'className')[0] as JSXStaticProperty || null,
                        propsDynamic = propExprs.some(e => !noApparentSignals(e)),
                        propStmts    = properties.map((p, i) => 
                            p === classProp                 ? '' :
                            p instanceof JSXStaticProperty  ? buildProperty(id, p.name, p.value, svg) :
                            p instanceof JSXDynamicProperty ? buildProperty(id, p.name, propExprs[i], svg) :
                            p instanceof JSXStyleProperty   ? buildStyle(p, id, propExprs[i], propsDynamic, spreads) :
                            buildSpread(id, propExprs[i], svg)
                        ).filter(s => s !== ''),
                        refStmts     = references.map(r => compileSegments(r.code) + ' = ').join(''),
                        childSvg     = svg && tag !== SvgForeignTag;

                    addStatement(`${id} = ${refStmts}Surplus.create${svg ? 'Svg' : ''}Element('${tag}', ${classProp && classProp.value}, ${parent || null});`);
                    
                    if (!propsDynamic) {
                        propStmts.forEach(addStatement);
                    }
                    
                    if (content.length === 1 && content[0] instanceof JSXInsert) {
                        buildJSXContent(content[0] as JSXInsert, id);
                    } else {
                        content.forEach((c, i) => buildChild(c, id, i, childSvg));
                    }

                    if (propsDynamic) {
                        addComputation(propStmts, null, null, loc);
                    }

                    functions.forEach(f => buildNodeFn(f, id));
                }
            },
            buildProperty = (id : string, prop : string, expr : string, svg : boolean) =>
                svg || IsAttribute(prop)
                ? `${id}.setAttribute(${codeStr(prop)}, ${expr});`
                : `${id}.${prop} = ${expr};`,
            buildSpread = (id : string, expr : string, svg : boolean) =>
                `Surplus.spread(${id}, ${expr}, ${svg});`,
            buildNodeFn = (node : JSXFunction, id : string) => {
                var expr = compileSegments(node.code);
                addComputation([`(${expr})(${id}, __state);`], '__state', null, node.loc);
            },
            buildStyle = (node : JSXStyleProperty, id : string, expr : string, dynamic : boolean, spreads : JSXProperty[]) =>
                `Surplus.assign(${id}.style, ${expr});`,
            buildChild = (node : JSXContent, parent : string, n : number, svg : boolean) =>
                node instanceof JSXElement ? buildHtmlElement(node, parent, n, svg) :
                node instanceof JSXComment ? buildHtmlComment(node, parent) :
                node instanceof JSXText    ? buildJSXText(node, parent, n) :
                buildJSXInsert(node, parent, n),
            buildInsertedSubComponent = (node : JSXElement, parent : string, n : number) => 
                buildJSXInsert(new JSXInsert(new EmbeddedCode([node]), node.loc), parent, n),
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

            buildHtmlElement(top, '', 0, false);

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
