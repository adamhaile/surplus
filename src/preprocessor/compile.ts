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
    Mixin          
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
    public ids = [] as string[];
    public staticStmts = [] as string[];
    public dynamicStmts = [] as string[];
    public result = "" as string;

    id(id : string)            { this.ids.push(id);            return id; }
    staticStmt(stmt : string)  { this.staticStmts.push(stmt);  return stmt; }
    dynamicStmt(stmt : string) { this.dynamicStmts.push(stmt); return stmt; }
}

const compile = (node : CodeTopLevel, opts : Params) => {
    const compileSegments = (node : CodeTopLevel | EmbeddedCode) => {
            var result = "", i;

            for (i = 0; i < node.segments.length; i++) {
                result += compileSegment(node.segments[i], result);
            }

            return result;
        },
        compileSegment = (node : CodeText | HtmlElement, previousCode : string) => 
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
                    createComment(c.text) );

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
                + code.staticStmts.join(iinl) + iinl 
                + code.dynamicStmts.join(iinl) + iinl
                + 'return ' + code.result + ';' + inl 
                +  '})()';
        },
        buildDOMExpression = (node : HtmlElement) => {
            const code = new DOMExpression();

            const stmtsHtmlElement = (node : HtmlElement, parent : string | null, n : number) => {
                var id = code.id(genIdentifier(parent, node.tag, n));
                if (rx.upperStart.test(node.tag)) {
                    var expr = compileSubComponent(node, ""),
                        range = `{ start: ${id}, end: ${id} }`;
                    code.staticStmt(assign(id, createText('')));
                    code.dynamicStmt(computation(`Surplus.insert(range, ${expr});`, "range", range, node.loc, opts));
                } else {
                    var exelen = code.dynamicStmts.length;
                    code.staticStmt(assign(id, createElement(node.tag)));
                    for (var i = 0; i < node.properties.length; i++) {
                        stmtsProperty(node.properties[i], id, i);
                    }
                    var myexes = code.dynamicStmts.splice(exelen);
                    for (i = 0; i < node.content.length; i++) {
                        var child = stmtsChild(node.content[i], id, i);
                        if (child) code.staticStmt(appendNode(id, child));
                    }
                    code.dynamicStmts = code.dynamicStmts.concat(myexes);
                }
                return id;
            },
            stmtsProperty = (node : StaticProperty | DynamicProperty | Mixin, id : string, n : number) =>
                node instanceof StaticProperty ? stmtsStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? stmtsDynamicProperty(node, id, n) :
                stmtsMixin(node, id, n),
            stmtsStaticProperty = (node : StaticProperty, id : string, n : number) => {
                code.staticStmt(id + "." + node.name + " = " + node.value + ";");
            },
            stmtsDynamicProperty = (node : DynamicProperty, id : string, n : number) => {
                var expr = compileSegments(node.code);
                if (node.name === "ref") {
                    code.staticStmt(expr + " = " + id + ";");
                } else {
                    var setter = `${id}.${node.name} = ${expr};`;

                    code.dynamicStmt(noApparentSignals(expr)
                        ? setter
                        : computation(setter, "", "", node.loc, opts));
                }
            },
            stmtsMixin = (node : Mixin, id : string, n : number) => {
                var expr = compileSegments(node.code);
                code.dynamicStmt(computation(`(${expr})(${id}, __state);`, "__state", "", node.loc, opts));
            },
            stmtsChild = (node : HtmlElement | HtmlComment | HtmlText | HtmlInsert, parent : string, n : number) =>
                node instanceof HtmlElement ? stmtsHtmlElement(node, parent, n) :
                node instanceof HtmlComment ? stmtsHtmlComment(node) :
                node instanceof HtmlText ? stmtsHtmlText(node, parent, n) :
                stmtsHtmlInsert(node, parent, n),
            stmtsHtmlComment = (node : HtmlComment) =>
                createComment(node.text),
            stmtsHtmlText = (node : HtmlText, parent : string, n : number) => { 
                return createText(node.text);
            },
            stmtsHtmlInsert = (node : HtmlInsert, parent : string, n : number) => {
                var id = code.id(genIdentifier(parent, 'insert', n)),
                    ins = compileSegments(node.code),
                    range = `{ start: ${id}, end: ${id} }`;

                code.staticStmt(assign(id, createText('')));

                code.dynamicStmt(noApparentSignals(ins)
                    ? `Surplus.insert(${range}, ${ins});`
                    : computation(`Surplus.insert(range, ${ins});`, "range", range, node.loc, opts));

                return id;
            };

            code.result = stmtsHtmlElement(node, null, 0);

            return code;
        };

        return compileSegments(node);
    };

const
    genIdentifier = (parent : string | null, tag : string, n : number) =>
        parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);

const 
    assign = (id : string, expr : string) => 
        `${id} = ${expr};`,
    appendNode = (parent : string, child : string) =>
        `Surplus.appendChild(${parent}, ${child});`,
    createElement = (tag : string)  => 
        `Surplus.createElement(\'${tag}\')`,
    createComment = (text : string) => 
        `Surplus.createComment(${codeStr(text)})`,
    createText    = (text : string) => 
        `Surplus.createTextNode(${codeStr(text)})`,
    computation = (code : string, varname : string , seed : string, loc : LOC, opts : Params) =>
        markLoc(varname ? `Surplus.S(function (${varname}) { return ${code} }${seed ? `, ${seed}` : ''});`
                        : `Surplus.S(function () { ${code} });`, loc, opts);

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