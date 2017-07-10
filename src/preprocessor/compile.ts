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
    public readonly ids          = [] as string[];
    public readonly statements   = [] as string[];
    public readonly computations = [] as string[];
}

const compile = (ctl : CodeTopLevel, opts : Params) => {
    const compileSegments = (node : CodeTopLevel | EmbeddedCode) => {
            return node.segments.reduce((res, s) => res + compileSegment(s, res), "");
        },
        compileSegment = (node : CodeSegment, previousCode : string) => 
            node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, previousCode),
        compileCodeText = (node : CodeText) =>
            markBlockLocs(node.text, node.loc, opts),
        compileHtmlElement = (node : HtmlElement, previousCode : string) => {
            var code : string;
            if (rx.upperStart.test(node.tag)) {
                code = compileSubComponent(node, previousCode);
            } else if (node.properties.length === 0 && node.content.length === 0) {
                // optimization: don't need IIFE for simple single nodes
                code = `document.createElement("${node.tag}")`;
            } else {
                code = compileDOMExpression(buildDOMExpression(node), previousCode);
            }
            return markLoc(code, node.loc, opts);
        },
        compileSubComponent = (node : HtmlElement, prior : string) => {
            var nl = "\r\n" + indent(prior),
                inl = nl + '    ',
                iinl = inl + '    ',
                props = node.properties.map(p =>
                    p instanceof StaticProperty  ? `${p.name}: ${p.value},` :
                    p instanceof DynamicProperty ? `${p.name}: ${compileSegments(p.code)},` :
                    ''),
                children = node.content.map(c => 
                    c instanceof HtmlElement ? compileHtmlElement(c, prior) :
                    c instanceof HtmlText    ? codeStr(c.text.trim()) :
                    c instanceof HtmlInsert  ? compileSegments(c.code) :
                    `document.createComment(${codeStr(c.text)})` ); // FIXME: translate to js comment maybe?

            return `${node.tag}({` + inl
                + props.join(inl) + inl
                + 'children: [' + iinl
                + children.join(',' + iinl) + inl
                + ']})';
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
        },
        buildDOMExpression = (top : HtmlElement) => {
            const code = new DOMExpression();

            const buildHtmlElement = (node : HtmlElement, parent : string, n : number) => {
                var id = addId(parent, node.tag, n);
                if (rx.upperStart.test(node.tag)) {
                    var expr = compileSubComponent(node, "");
                    buildHtmlInsert(new HtmlInsert(new EmbeddedCode([new CodeText(expr, node.loc)]), node.loc), parent, n);
                } else {
                    const exelen = code.computations.length;
                    addStatement(parent ? `${id} = Surplus.createElement(\'${node.tag}\', ${parent})`
                                        : `${id} = Surplus.createRootElement(\'${node.tag}\')`);
                    node.properties.forEach((p, i) => buildProperty(p, id, i));
                    const myexes = code.computations.splice(exelen);
                    node.content.forEach((c, i) => buildChild(c, id, i));
                    code.computations.push.apply(code.computations, myexes);
                }
            },
            buildProperty = (node : StaticProperty | DynamicProperty | Mixin, id : string, n : number) =>
                node instanceof StaticProperty  ? buildStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? buildDynamicProperty(node, id, n) :
                buildMixin(node, id, n),
            buildStaticProperty = (node : StaticProperty, id : string, n : number) => {
                addStatement(id + "." + node.name + " = " + node.value + ";");
            },
            buildDynamicProperty = (node : DynamicProperty, id : string, n : number) => {
                var expr = compileSegments(node.code);
                if (node.name === "ref") {
                    addStatement(expr + " = " + id + ";");
                } else {
                    var setter = `${id}.${node.name} = ${expr};`;

                    if (noApparentSignals(expr)) addStatement(setter);
                    else addComputation(setter, "", "", node.loc);
                }
            },
            buildMixin = (node : Mixin, id : string, n : number) => {
                var expr = compileSegments(node.code);
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
                var id = addId(parent, 'insert', n),
                    ins = compileSegments(node.code),
                    range = `{ start: ${id}, end: ${id} }`;
                addStatement(`${id} = Surplus.createTextNode('', ${parent})`);
                addComputation(`Surplus.insert(range, ${ins});`, "range", range, node.loc);
            },
            addId = (parent : string, tag : string, n : number) => {
                const id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
                code.ids.push(id);
                return id;
            },
            addStatement = (stmt : string) =>
                code.statements.push(stmt),
            addComputation = (body : string, varname : string , seed : string, loc : LOC) => {
                body = varname ? `Surplus.S(function (${varname}) { return ${body} }${seed ? `, ${seed}` : ''});`
                               : `Surplus.S(function () { ${body} });`;
                code.computations.push(markLoc(body, loc, opts));
            }

            buildHtmlElement(top, '', 0);

            return code;
        };

        return compileSegments(ctl);
    };

const
    noApparentSignals = (code : string) =>
        !rx.hasParen.test(code) || rx.loneFunction.test(code),
    indent = (previousCode : string) => {
        var m = rx.indent.exec(previousCode);
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

        var lines = str.split('\n'),
            offset = 0;

        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            offset += line.length;
            var lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
            lines[i] = locationMark(lineloc) + line;
        }

        return locationMark(loc) + lines.join('\n');
    };