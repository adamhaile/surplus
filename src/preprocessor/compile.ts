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
    upperStart  : /^[A-Z]/,
    singleQuotes: /'/g,
    indent      : /\n(?=[^\n]+$)([ \t]*)/
};

class DOMExpression {
    constructor(
        public readonly ids          : string[],
        public readonly statements   : string[],
        public readonly computations : string[]
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
            node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, previousCode),
        compileCodeText = (node : CodeText) =>
            markBlockLocs(node.text, node.loc, opts),
        compileHtmlElement = (node : HtmlElement, previousCode : string) : string => {
            const code = 
                rx.upperStart.test(node.tag) ? 
                    compileSubComponent(buildSubComponent(node), previousCode) :
                (node.properties.length === 0 && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    `Surplus.createRootElement("${node.tag}")` :
                compileDOMExpression(buildDOMExpression(node), previousCode);
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
        compileSubComponent = (expr : SubComponent, prior : string) => {
            const nl  = "\r\n" + indent(prior),
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
                computations = [] as string[];

            const buildHtmlElement = (node : HtmlElement, parent : string, n : number) => {
                const id = addId(parent, node.tag, n);
                if (rx.upperStart.test(node.tag)) {
                    const expr = compileSubComponent(buildSubComponent(node), "");
                    buildHtmlInsert(new HtmlInsert(new EmbeddedCode([new CodeText(expr, node.loc)]), node.loc), parent, n);
                } else {
                    const exelen = computations.length;
                    addStatement(parent ? `${id} = Surplus.createElement(\'${node.tag}\', ${parent})`
                                        : `${id} = Surplus.createRootElement(\'${node.tag}\')`);
                    node.properties.forEach((p, i) => buildProperty(p, id, i));
                    const myexes = computations.splice(exelen);
                    node.content.forEach((c, i) => buildChild(c, id, i));
                    computations.push.apply(computations, myexes);
                }
            },
            buildProperty = (node : StaticProperty | DynamicProperty | Mixin, id : string, n : number) =>
                node instanceof StaticProperty  ? buildStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? buildDynamicProperty(node, id, n) :
                buildMixin(node, id, n),
            buildStaticProperty = (node : StaticProperty, id : string, n : number) =>
                addStatement(id + "." + node.name + " = " + node.value + ";"),
            buildDynamicProperty = (node : DynamicProperty, id : string, n : number) => {
                const expr = compileSegments(node.code);
                if (node.name === "ref") {
                    addStatement(expr + " = " + id + ";");
                } else {
                    const setter = `${id}.${node.name} = ${expr};`;

                    if (noApparentSignals(expr)) addStatement(setter);
                    else addComputation(setter, "", "", node.loc);
                }
            },
            buildMixin = (node : Mixin, id : string, n : number) => {
                const expr = compileSegments(node.code);
                addComputation(`(${expr})(${id}, __state);`, "__state", "", node.loc);
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
                addComputation(`Surplus.insert(range, ${ins});`, "range", range, node.loc);
            },
            addId = (parent : string, tag : string, n : number) => {
                const id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
                ids.push(id);
                return id;
            },
            addStatement = (stmt : string) =>
                statements.push(stmt),
            addComputation = (body : string, varname : string , seed : string, loc : LOC) => {
                body = varname ? `Surplus.S(function (${varname}) { return ${body} }${seed ? `, ${seed}` : ''});`
                               : `Surplus.S(function () { ${body} });`;
                computations.push(markLoc(body, loc, opts));
            }

            buildHtmlElement(top, '', 0);

            return new DOMExpression(ids, statements, computations);
        };

        return compileSegments(ctl);
    },
    compileDOMExpression = (code : DOMExpression, previousCode : string) => {
        var nl = "\r\n" + indent(previousCode),
            inl = nl + '    ',
            iinl = inl + '    ';

        return '(function () {' + iinl 
            + 'var ' + code.ids.join(', ') + ';' + iinl
            + code.statements.join(iinl) + iinl 
            + code.computations.join(iinl) + iinl
            + 'return __;' + inl 
            +  '})()';
    };

const
    noApparentSignals = (code : string) =>
        !rx.hasParen.test(code) || rx.loneFunction.test(code),
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