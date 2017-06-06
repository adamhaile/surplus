import * as AST from './AST';
import { LOC } from './parse';
import * as sourcemap from './sourcemap';
import { Params } from './preprocess';

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

export interface ICodeGenerator {
    genCode(opts : Params, prior? : string) : string;
}

export interface IStatementGenerator {
    genDOMStatements(opts : Params, code : CodeBlock, parent : string, n : number) : string | void;
}

// genCode
AST.CodeTopLevel.prototype.genCode   =
AST.EmbeddedCode.prototype.genCode   = function (opts) { return concatResults(opts, this.segments, 'genCode'); };
AST.CodeText.prototype.genCode       = function (opts) {
    return markBlock(this.text, this.loc, opts);
};
AST.HtmlElement.prototype.genCode = function (opts, prior?) {
    var code : string;
    if (rx.upperStart.test(this.tag)) {
        code = genSubComponent(this, opts, prior);
    } else if (this.properties.length === 0 && this.content.length === 0) {
        // optimization: don't need IIFE for simple single nodes
        code = `document.createElement("${this.tag}")`;
    } else {
        var block = new CodeBlock(),
            expr = this.genDOMStatements(opts, block, null, 0);
        code = block.toCode(expr!, indent(prior));
    }
    return markLoc(code, this.loc, opts);
};

function genSubComponent(cmp : AST.HtmlElement, opts : Params, prior? : string) {
    var nl = "\r\n" + indent(prior),
        inl = nl + '    ',
        iinl = inl + '    ',
        props = cmp.properties.map(p =>
            p instanceof AST.StaticProperty  ? `${propName(opts, p.name)}: ${p.value},` :
            p instanceof AST.DynamicProperty ? `${propName(opts, p.name)}: ${p.code.genCode(opts, prior)},` :
            ''),
        children = cmp.content.map(c => 
            c instanceof AST.HtmlElement ? c.genCode(opts, prior) :
            c instanceof AST.HtmlText    ? codeStr(c.text.trim()) :
            c instanceof AST.HtmlInsert  ? c.code.genCode(opts, prior) :
            createComment(c.text) );

    return `${cmp.tag}({` + inl
        + props.join(inl) + inl
        + 'children: [' + iinl
        + children.join(',' + iinl) + inl
        + ']})';
}

export class CodeBlock {
    public ids = [] as string[];
    public inits = [] as string[];
    public exes = [] as string[];

    id(id : string)     { this.ids.push(id);     return id; }
    init(stmt : string) { this.inits.push(stmt); return stmt; }
    exe(stmt : string)  { this.exes.push(stmt);  return stmt; }

    toCode(expr : string, indent : string) {
        var nl = "\r\n" + indent,
            inl = nl + '    ',
            iinl = inl + '    ';

        return '(function () {' + iinl 
            + 'var ' + this.ids.join(', ') + ';' + iinl
            + this.inits.join(iinl) + iinl 
            + this.exes.join(iinl) + iinl
            + 'return ' + expr + ';' + inl 
            +  '})()';
    }
}

// genDOMStatements
AST.HtmlElement.prototype.genDOMStatements     = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, this.tag, n));
    if (rx.upperStart.test(this.tag)) {
        var expr = genSubComponent(this, opts, ""),
            range = `{ start: ${id}, end: ${id} }`;
        code.init(assign(id, createText('')));
        code.exe(exe(`Surplus.insert(range, ${expr});`, "range", range, this.loc, opts));
    } else {
        var exelen = code.exes.length;
        code.init(assign(id, createElement(this.tag)));
        for (var i = 0; i < this.properties.length; i++) {
            this.properties[i].genDOMStatements(opts, code, id, i);
        }
        var myexes = code.exes.splice(exelen);
        for (i = 0; i < this.content.length; i++) {
            var child = this.content[i].genDOMStatements(opts, code, id, i);
            if (child) code.init(appendNode(id, child));
        }
        code.exes = code.exes.concat(myexes);
    }
    return id;
};
AST.HtmlComment.prototype.genDOMStatements     = function (opts, code, parent, n) {
    return createComment(this.text);
}
AST.HtmlText.prototype.genDOMStatements        = function (opts, code, parent, n) { 
    if (n === 0) {
        code.init(`${parent}.innerText = ${codeStr(this.text)}`);
    } else {
        return createText(this.text);
    }
};
AST.HtmlInsert.prototype.genDOMStatements      = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, 'insert', n)),
        ins = this.code.genCode(opts),
        range = `{ start: ${id}, end: ${id} }`;

    code.init(assign(id, createText('')));

    code.exe(noApparentSignals(ins)
        ? `Surplus.insert(${range}, ${ins});`
        : exe(`Surplus.insert(range, ${ins});`, "range", range, this.loc, opts));

    return id;
};

AST.StaticProperty.prototype.genDOMStatements  = function (opts, code, id, n) {
    code.init(id + "." + propName(opts, this.name) + " = " + this.value + ";");
};

AST.DynamicProperty.prototype.genDOMStatements = function (opts, code, id, n) {
    var expr = this.code.genCode(opts);
    if (this.name === "ref") {
        code.init(expr + " = " + id + ";");
    } else {
        var prop = propName(opts, this.name),
            setter = `${id}.${prop} = ${expr};`;

        code.exe(noApparentSignals(expr)
            ? setter
            : exe(setter, "", "", this.loc, opts));
    }
};
AST.Mixin.prototype.genDOMStatements           = function (opts, code, id, n) {
    var expr = this.code.genCode(opts);
    code.exe(exe(`(${expr})(${id}, __state);`, "__state", "", this.loc, opts));
};

let genIdentifier = (parent : string | null, tag : string, n : number) =>
        parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1),
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
    exe = (code : string, varname : string , seed : string, loc : LOC, opts : Params) =>
        markLoc(varname ? `Surplus.S(function (${varname}) { return ${code} }${seed ? `, ${seed}` : ''});`
                        : `Surplus.S(function () { ${code} });`, loc, opts);

function propName(opts : Params, name : string) {
    return opts.jsx && name.substr(0, 2) === 'on' ? (name === 'onDoubleClick' ? 'ondblclick' : name.toLowerCase()) : name;
}

function noApparentSignals(code : string) {
    return !rx.hasParen.test(code) || rx.loneFunction.test(code);
}

function concatResults(opts : Params, children : any[], method : string, sep? : string) {
    var result = "", i;

    for (i = 0; i < children.length; i++) {
        if (i && sep) result += sep;
        result += children[i][method](opts, result);
    }

    return result;
}

function indent(prior? : string) {
    var m = rx.indent.exec(prior || '');
    return m ? m[1] : '';
}

function codeStr(str : string) {
    return "'" + str.replace(rx.backslashes, "\\\\")
                    .replace(rx.singleQuotes, "\\'")
                    .replace(rx.newlines, "\\\n")
                + "'";
}

function markLoc(str : string, loc : LOC, opts : Params) {
    return opts.sourcemap ? sourcemap.locationMark(loc) + str : str;
}

function markBlock(str : string, loc : LOC, opts : Params) {
    if (!opts.sourcemap) return str;

    var lines = str.split('\n'),
        offset = 0;

    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        offset += line.length;
        var lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
        lines[i] = sourcemap.locationMark(lineloc) + line;
    }

    return sourcemap.locationMark(loc) + lines.join('\n');
}
