import { 
    CodeTopLevel,   
    EmbeddedCode,   
    CodeText,       
    HtmlElement,    
    HtmlText,       
    HtmlComment,    
    HtmlInsert,     
    StaticProperty, 
    DynamicProperty,
    Mixin,                  
    CodeSegment, 
    Node
} from './AST';
import { LOC } from './parse';
import { locationMark } from './sourcemap';
import { Params } from './preprocess';

export { compile, codeStr };

// pre-compiled regular expressions
const rx = {
    backslashes : /\\/g,
    newlines    : /\r?\n/g,
    hasParen    : /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen : /\)\s*$/,
    subcomponent: /(^[A-Z])|\./,
    nonIdChars  : /[^a-zA-Z0-9]/,
    singleQuotes: /'/g,
    attribute   : /-/,
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
        public statements : string[],
        public loc : LOC,
        public stateVar : string | null,
        public seed : string | null,
    ) { }
}

class SubComponent {
    constructor(
        public readonly name : string,
        public readonly properties : (string | { [ name : string ] : string })[],
        public readonly children : string[]
    ) { }
}

const compile = (ctl : CodeTopLevel, opts : Params) => {
    const compileSegments = (node : CodeTopLevel | EmbeddedCode) => {
            return node.segments.reduce((res, s) => res + compileSegment(s, res), "");
        },
        compileSegment = (node : CodeSegment, previousCode : string) => 
            node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode)),
        compileCodeText = (node : CodeText) =>
            markBlockLocs(node.text, node.loc, opts),
        compileHtmlElement = (node : HtmlElement, indent : string) : string => {
            const code = 
                rx.subcomponent.test(node.tag) ? 
                    emitSubComponent(buildSubComponent(node), indent) :
                (node.properties.length === 0 && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    `Surplus.createElement('${node.tag}', null, null)` :
                (node.properties.length === 1 
                    && node.properties[0] instanceof StaticProperty 
                    && (node.properties[0] as StaticProperty).name === "className" 
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    `Surplus.createElement('${node.tag}', ${(node.properties[0] as StaticProperty).value}, null)` :
                emitDOMExpression(buildDOMExpression(node), indent);
            return markLoc(code, node.loc, opts);
        },
        buildSubComponent = (node : HtmlElement) => {
            const 
                // group successive properties into property objects, but mixins stand alone
                // e.g. a="1" b={foo} {...mixin} c="3" gets combined into [{a: "1", b: foo}, mixin, {c: "3"}]
                properties = node.properties.reduce((props : (string | { [name : string] : string })[], p) => {
                    const lastSegment = props[props.length - 1],
                        value = p instanceof StaticProperty ? p.value : compileSegments(p.code);
                    
                    if (p instanceof Mixin) props.push(value);
                    else if (props.length === 0 || typeof lastSegment === 'string') props.push({ [p.name]: value });
                    else lastSegment[p.name] = value;

                    return props;
                }, []),
                children = node.content.map(c => 
                    c instanceof HtmlElement ? compileHtmlElement(c, "") :
                    c instanceof HtmlText    ? codeStr(c.text.trim()) :
                    c instanceof HtmlInsert  ? compileSegments(c.code) :
                    `document.createComment(${codeStr(c.text)})`
                ).filter(Boolean); 

            return new SubComponent(node.tag, properties, children);
        },
        emitSubComponent = (expr : SubComponent, indent : string) => {
            const nl  = "\r\n" + indent,
                nli   = nl   + '    ',
                nlii  = nli  + '    ',
                // convert children to an array expression
                children = expr.children.length === 0 ? '[]' : '[' + nlii
                    + expr.children.join(',' + nlii) + nli
                    + ']',
                properties0 = expr.properties[0];

            // add children property to first property object (creating one if needed)
            // this has the double purpose of creating the children property and making sure
            // that the first property group is not a mixin and can therefore be used as a base for extending
            if (typeof properties0 === 'string') expr.properties.unshift({ children: children });
            else properties0['children'] = children;

            // convert property objects to object expressions
            const properties = expr.properties.map(obj =>
                typeof obj === 'string' ? obj :
                '{' + Object.keys(obj).map(p => `${nli}${p}: ${obj[p]}`).join(',') + nl + '}'
            );

            // join multiple object expressions using Object.assign()
            const needLibrary = expr.properties.length > 1 || typeof expr.properties[0] === 'string';

            return needLibrary ? `Surplus.subcomponent(${expr.name}, [${properties.join(', ')}])`
                               : `${expr.name}(${properties[0]})`;
        },
        buildDOMExpression = (top : HtmlElement) => {
            const ids = [] as string[],
                statements = [] as string[],
                computations = [] as Computation[];

            const buildHtmlElement = (node : HtmlElement, parent : string, n : number) => {
                const { tag, properties, content, loc } = node;
                if (rx.subcomponent.test(tag)) {
                    buildHtmlInsert(new HtmlInsert(new EmbeddedCode([node]), loc), parent, n);
                } else {
                    const
                        id         = addId(parent, tag, n),
                        exprs      = properties.map(p => p instanceof StaticProperty ? '' : compileSegments(p.code)), 
                        hasMixins  = properties.some(p => p instanceof Mixin),
                        classProp  = !hasMixins && properties.filter(p => p instanceof StaticProperty && p.name === 'className')[0] as StaticProperty || null,
                        dynamic    = hasMixins || exprs.some(e => !noApparentSignals(e)),
                        stmts      = properties.map((p, i) => 
                            p === classProp              ? '' :
                            p instanceof StaticProperty  ? buildStaticProperty(p, id) :
                            p instanceof DynamicProperty ? buildDynamicProperty(p, id, exprs[i]) :
                            buildMixin(exprs[i], id, n)
                        ).filter(s => s !== '');

                    addStatement(`${id} = Surplus.createElement('${tag}', ${classProp && classProp.value}, ${parent || 'null'});`);
                    
                    if (!dynamic) {
                        stmts.forEach(addStatement);
                    }
                    
                    content.forEach((c, i) => buildChild(c, id, i));

                    if (dynamic) {
                        if (hasMixins) {
                            const propAges = { __current : 0 } as { [ name : string ] : number },
                                maxAge = 1 << 31 - 1;
                            properties.forEach(p => p instanceof Mixin || (propAges[p.name] = maxAge));
                            stmts.unshift("__propAges.__current++;");
                            stmts.push("__propAges");
                            addComputation(stmts, "__propAges", JSON.stringify(propAges), loc);
                        } else {
                            addComputation(stmts, null, null, loc);
                        }
                    }
                }
            },
            buildStaticProperty = (node : StaticProperty, id : string) =>
                buildProperty(id, node.name, node.value),
            buildDynamicProperty = (node : DynamicProperty, id : string, expr : string) =>
                node.name === "ref"
                ? `${expr} = ${id};`
                : buildProperty(id, node.name, expr),
            buildProperty = (id : string, prop : string, expr : string) =>
                isAttribute(prop)
                ? `${id}.setAttribute(${codeStr(prop)}, ${expr});`
                : `${id}.${prop} = ${expr};`,
            buildMixin = (expr : string, id : string, n : number) => {
                const state = addId(id, 'mixin', n);
                return `${state} = Surplus.spread(${expr}, ${id}, ${state}, __propAges);`;
            },
            buildChild = (node : HtmlElement | HtmlComment | HtmlText | HtmlInsert, parent : string, n : number) =>
                node instanceof HtmlElement ? buildHtmlElement(node, parent, n) :
                node instanceof HtmlComment ? buildHtmlComment(node, parent) :
                node instanceof HtmlText    ? buildHtmlText(node, parent, n) :
                buildHtmlInsert(node, parent, n),
            buildHtmlComment = (node : HtmlComment, parent : string) =>
                addStatement(`Surplus.createComment(${codeStr(node.text)}, ${parent})`),
            buildHtmlText = (node : HtmlText, parent : string, n : number) =>
                addStatement(`Surplus.createTextNode(${codeStr(node.text)}, ${parent})`),
            buildHtmlInsert = (node : HtmlInsert, parent : string, n : number) => {
                const id = addId(parent, 'insert', n),
                    ins = compileSegments(node.code),
                    range = `{ start: ${id}, end: ${id} }`;
                addStatement(`${id} = Surplus.createTextNode('', ${parent})`);
                addComputation([`Surplus.insert(range, ${ins});`], "range", range, node.loc);
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
        emitDOMExpression = (code : DOMExpression, indent : string) => {
            var nl    = "\r\n" + indent,
                nli   = nl   + '    ',
                nlii  = nli  + '    ';

            return '(function () {' + nli
                + 'var ' + code.ids.join(', ') + ';' + nli
                + code.statements.join(nli) + nli
                + code.computations.map(comp => {
                    const { statements, loc, stateVar, seed } = comp;

                    if (stateVar) statements[statements.length - 1] = 'return ' + statements[statements.length - 1];

                    const body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nlii),
                        code = `Surplus.S(function (${stateVar || ''}) {${body}}${seed ? `, ${seed}` : ''});`;

                    return markLoc(code, loc, opts);
                }).join(nli) + nli
                + 'return __;' + nl
                +  '})()';
        };

        return compileSegments(ctl);
    };

const
    noApparentSignals = (code : string) =>
        !rx.hasParen.test(code) || (rx.loneFunction.test(code) && !rx.endsInParen.test(code)),
    isAttribute = (prop : string) =>
        rx.attribute.test(prop), // TODO: better heuristic for attributes than name contains a hyphen
    indent = (previousCode : string) => {
        const m = rx.indent.exec(previousCode);
        return m ? m[1] : '';
    },
    codeStr = (str : string) =>
        "'" + 
        str.replace(rx.backslashes, "\\\\")
           .replace(rx.singleQuotes, "\\'")
           .replace(rx.newlines, "\\\n") +
        "'";

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