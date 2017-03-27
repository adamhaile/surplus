import * as AST from './AST';
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
    genDOMStatements(opts : Params, code : CodeBlock, parent : string, n : number) : void;
}

// genCode
AST.CodeTopLevel.prototype.genCode   =
AST.EmbeddedCode.prototype.genCode   = function (opts) { return concatResults(opts, this.segments, 'genCode'); };
AST.CodeText.prototype.genCode       = function (opts) {
    return (opts.sourcemap ? sourcemap.segmentStart(this.loc) : "")
        + this.text
        + (opts.sourcemap ? sourcemap.segmentEnd() : "");
};
AST.HtmlElement.prototype.genCode = function (opts, prior?) {
    if (rx.upperStart.test(this.tag)) {
        return genSubComponent(this, opts, prior);
    } else if (this.properties.length === 0 && this.content.length === 0) {
        // optimization: don't need IIFE for simple single nodes
        return `document.createElement("${this.tag}")`;
    } else {
        var code = new CodeBlock();
        this.genDOMStatements(opts, code, null, 0);
        return code.toCode(indent(prior));
    }
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

    toCode(indent : string) {
        var nl = "\r\n" + indent,
            inl = nl + '    ',
            iinl = inl + '    ';

        return '(function () {' + iinl 
            + 'var ' + this.ids.join(', ') + ';' + iinl
            + this.inits.join(iinl) + iinl 
            + this.exes.join(iinl) + iinl
            + 'return __;' + inl 
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
        if (!opts.exec) {
            code.exe(`Surplus.insert(${range}, ${expr});`);   
        } else { 
            code.exe(exe(opts, `Surplus.insert(range, ${expr}, ${opts.exec});`, "range", range));
        }
    } else {
        var exelen = code.exes.length;
        code.init(assign(id, createElement(this.tag)));
        for (var i = 0; i < this.properties.length; i++) {
            this.properties[i].genDOMStatements(opts, code, id, i);
        }
        var myexes = code.exes.splice(exelen);
        for (i = 0; i < this.content.length; i++) {
            this.content[i].genDOMStatements(opts, code, id, i);
        }
        code.exes = code.exes.concat(myexes);
    }
    if (parent) code.init(appendNode(parent, id));
};
AST.HtmlComment.prototype.genDOMStatements     = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, 'comment', n));
    code.init(assign(id, createComment(this.text)));
    code.init(appendNode(parent, id));
}
AST.HtmlText.prototype.genDOMStatements        = function (opts, code, parent, n) { 
    var id = code.id(genIdentifier(parent, 'text', n));
    code.init(assign(id, createText(this.text)));
    code.init(appendNode(parent, id));
};
AST.HtmlInsert.prototype.genDOMStatements      = function (opts, code, parent, n) {
    var id = code.id(genIdentifier(parent, 'insert', n)),
        ins = this.code.genCode(opts),
        range = `{ start: ${id}, end: ${id} }`;
    code.init(assign(id, createText('')));
    code.init(appendNode(parent, id));
    if (!opts.exec || noApparentSignals(ins)) {
        code.exe(`Surplus.insert(${range}, ${ins});`);   
    } else { 
        code.exe(exe(opts, `Surplus.insert(range, ${ins}, ${opts.exec || "null"});`, "range", range));
    }
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
        if (noApparentSignals(expr)) {
            code.exe(setter);
        } else {
            code.exe(exe(opts, setter, "", ""));
        }
    }
};
AST.Mixin.prototype.genDOMStatements           = function (opts, code, id, n) {
    var expr = this.code.genCode(opts);
    code.exe(exe(opts, `(${expr})(${id}, __state);`, "__state", ""));
};

let genIdentifier = (parent : string, tag : string, n : number) =>
        parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1),
    assign = (id : string, expr : string) => 
        `${id} = ${expr};`,
    appendNode = (parent : string, child : string) =>
        parent + '.appendChild(' + child + ');',
    createElement = (tag : string)  => 
        `document.createElement(\'${tag}\')`,
    createComment = (text : string) => 
        `document.createComment(${codeStr(text)})`,
    createText    = (text : string) => 
        `document.createTextNode(${codeStr(text)})`,
    exe = (opts : Params, code : string, varname : string , seed : string) =>
        opts.exec ?
            (varname ? `${opts.exec}(function (${varname}) { return ${code} }${seed ? `, ${seed}` : ''});`
                        : `${opts.exec}(function () { ${code} });`) :
        varname ? `(function (${varname}) { return ${code} })(${seed});` :
        code;

function propName(opts : Params, name : string) {
    return opts.jsx && name.substr(0, 2) === 'on' ? name.toLowerCase() : name;
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
