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

class CodeBlock {
    public ids = [] as string[];
    public staticStmts = [] as string[];
    public dynamicStmts = [] as string[];

    id(id : string)            { this.ids.push(id);            return id; }
    staticStmt(stmt : string)  { this.staticStmts.push(stmt);  return stmt; }
    dynamicStmt(stmt : string) { this.dynamicStmts.push(stmt); return stmt; }
}

const 
    compile = (node : CodeTopLevel, opts : Params) => compileSegments(node, opts),
    compileSegments = (node : CodeTopLevel | EmbeddedCode, opts : Params) => {
        var result = "", i;

        for (i = 0; i < node.segments.length; i++) {
            result += compileSegment(node.segments[i], result, opts);
        }

        return result;
    },
    compileSegment = (node : CodeText | HtmlElement, previousCode : string, opts : Params) => 
        node instanceof CodeText ? compileCodeText(node, opts) : compileHtmlElement(node, previousCode, opts),
    compileCodeText = (node : CodeText, opts : Params) =>
        markBlockLocs(node.text, node.loc, opts),
    compileHtmlElement = (node : HtmlElement, previousCode : string, opts : Params) => {
        var code : string;
        if (rx.upperStart.test(node.tag)) {
            code = compileSubComponent(node, previousCode, opts);
        } else if (node.properties.length === 0 && node.content.length === 0) {
            // optimization: don't need IIFE for simple single nodes
            code = `document.createElement("${node.tag}")`;
        } else {
            var block = new CodeBlock(),
                expr = stmtsHtmlElement(node, block, null, 0, opts);
            code = compileCodeBlock(block, expr!, indent(previousCode));
        }
        return markLoc(code, node.loc, opts);
    },
    compileSubComponent = (node : HtmlElement, prior : string, opts : Params) => {
        var nl = "\r\n" + indent(prior),
            inl = nl + '    ',
            iinl = inl + '    ',
            props = node.properties.map(p =>
                p instanceof StaticProperty  ? `${propName(opts, p.name)}: ${p.value},` :
                p instanceof DynamicProperty ? `${propName(opts, p.name)}: ${compileSegments(p.code, opts)},` :
                ''),
            children = node.content.map(c => 
                c instanceof HtmlElement ? compileHtmlElement(c, prior, opts) :
                c instanceof HtmlText    ? codeStr(c.text.trim()) :
                c instanceof HtmlInsert  ? compileSegments(c.code, opts) :
                createComment(c.text) );

        return `${node.tag}({` + inl
            + props.join(inl) + inl
            + 'children: [' + iinl
            + children.join(',' + iinl) + inl
            + ']})';
    },
    compileCodeBlock = (code : CodeBlock, expr : string, indent : string) => {
        var nl = "\r\n" + indent,
            inl = nl + '    ',
            iinl = inl + '    ';

        return '(function () {' + iinl 
            + 'var ' + code.ids.join(', ') + ';' + iinl
            + code.staticStmts.join(iinl) + iinl 
            + code.dynamicStmts.join(iinl) + iinl
            + 'return ' + expr + ';' + inl 
            +  '})()';
    },
    stmtsHtmlElement = (node : HtmlElement, code : CodeBlock, parent : string | null, n : number, opts : Params) => {
        var id = code.id(genIdentifier(parent, node.tag, n));
        if (rx.upperStart.test(node.tag)) {
            var expr = compileSubComponent(node, "", opts),
                range = `{ start: ${id}, end: ${id} }`;
            code.staticStmt(assign(id, createText('')));
            code.dynamicStmt(computation(`Surplus.insert(range, ${expr});`, "range", range, node.loc, opts));
        } else {
            var exelen = code.dynamicStmts.length;
            code.staticStmt(assign(id, createElement(node.tag)));
            for (var i = 0; i < node.properties.length; i++) {
                stmtsProperty(node.properties[i], code, id, i, opts);
            }
            var myexes = code.dynamicStmts.splice(exelen);
            for (i = 0; i < node.content.length; i++) {
                var child = stmtsChild(node.content[i], code, id, i, opts);
                if (child) code.staticStmt(appendNode(id, child));
            }
            code.dynamicStmts = code.dynamicStmts.concat(myexes);
        }
        return id;
    },
    stmtsProperty = (node : StaticProperty | DynamicProperty | Mixin, code : CodeBlock, id : string, n : number, opts : Params) =>
        node instanceof StaticProperty ? stmtsStaticProperty(node, code, id, n, opts) :
        node instanceof DynamicProperty ? stmtsDynamicProperty(node, code, id, n, opts) :
        stmtsMixin(node, code, id, n, opts),
    stmtsStaticProperty = (node : StaticProperty, code : CodeBlock, id : string, n : number, opts : Params) => {
        code.staticStmt(id + "." + propName(opts, node.name) + " = " + node.value + ";");
    },
    stmtsDynamicProperty = (node : DynamicProperty, code : CodeBlock, id : string, n : number, opts : Params) => {
        var expr = compileSegments(node.code, opts);
        if (node.name === "ref") {
            code.staticStmt(expr + " = " + id + ";");
        } else {
            var prop = propName(opts, node.name),
                setter = `${id}.${prop} = ${expr};`;

            code.dynamicStmt(noApparentSignals(expr)
                ? setter
                : computation(setter, "", "", node.loc, opts));
        }
    },
    stmtsMixin = (node : Mixin, code : CodeBlock, id : string, n : number, opts : Params) => {
        var expr = compileSegments(node.code, opts);
        code.dynamicStmt(computation(`(${expr})(${id}, __state);`, "__state", "", node.loc, opts));
    },
    stmtsChild = (node : HtmlElement | HtmlComment | HtmlText | HtmlInsert, code : CodeBlock, parent : string, n : number, opts : Params) =>
        node instanceof HtmlElement ? stmtsHtmlElement(node, code, parent, n, opts) :
        node instanceof HtmlComment ? stmtsHtmlComment(node) :
        node instanceof HtmlText ? stmtsHtmlText(node, code, parent, n) :
        stmtsHtmlInsert(node, code, parent, n, opts),
    stmtsHtmlComment = (node : HtmlComment) =>
        createComment(node.text),
    stmtsHtmlText = (node : HtmlText, code : CodeBlock, parent : string, n : number) => { 
        // if we're the first child, we can just set innerText
        if (n === 0) {
            code.staticStmt(`${parent}.innerText = ${codeStr(node.text)}`);
        } else {
            return createText(node.text);
        }
    },
    stmtsHtmlInsert = (node : HtmlInsert, code : CodeBlock, parent : string, n : number, opts : Params) => {
        var id = code.id(genIdentifier(parent, 'insert', n)),
            ins = compileSegments(node.code, opts),
            range = `{ start: ${id}, end: ${id} }`;

        code.staticStmt(assign(id, createText('')));

        code.dynamicStmt(noApparentSignals(ins)
            ? `Surplus.insert(${range}, ${ins});`
            : computation(`Surplus.insert(range, ${ins});`, "range", range, node.loc, opts));

        return id;
    },
    genIdentifier = (parent : string | null, tag : string, n : number) =>
        parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1),
    propName = (opts : Params, name : string) =>
        opts.jsx && name.substr(0, 2) === 'on' ? (name === 'onDoubleClick' ? 'ondblclick' : name.toLowerCase()) : name;

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