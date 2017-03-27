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
    genDOMStatements(opts : Params, ids : string[], inits : string[], exes : string[], parent : string, n : number) : void;
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
        var nl = "\r\n" + indent(prior),
            inl = nl + '    ',
            iinl = inl + '    ',
            ids = [] as string[],
            inits = [] as string[],
            exes = [] as string[];
        
        this.genDOMStatements(opts, ids, inits, exes, null, 0);

        return '(function () {' + iinl 
            + 'var ' + ids.join(', ') + ';' + iinl
            + inits.join(iinl) + iinl 
            + exes.join(iinl) + iinl
            + 'return __;' + inl 
            +  '})()';
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

// genDOMStatements
AST.HtmlElement.prototype.genDOMStatements     = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, this.tag, n);
    if (rx.upperStart.test(this.tag)) {
        var code = genSubComponent(this, opts, ""),
            range = `{ start: ${id}, end: ${id} }`;
        assign(inits, id, createText(''));
        if (!opts.exec) {
            exes.push(`Surplus.insert(${range}, ${code});`);   
        } else { 
            exe(exes, opts, `Surplus.insert(range, ${code}, ${opts.exec});`, "range", range);
        }
    } else {
        var myexes = [] as string[];
        assign(inits, id, createElement(this.tag));
        for (var i = 0; i < this.properties.length; i++) {
            this.properties[i].genDOMStatements(opts, ids, inits, myexes, id, i);
        }
        for (i = 0; i < this.content.length; i++) {
            this.content[i].genDOMStatements(opts, ids, inits, exes, id, i);
        }
        exes.push.apply(exes, myexes);
    }
    if (parent) appendNode(inits, parent, id);
};
AST.HtmlComment.prototype.genDOMStatements     = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'comment', n);
    assign(inits, id, createComment(this.text));
    appendNode(inits, parent, id);
}
AST.HtmlText.prototype.genDOMStatements        = function (opts, ids, inits, exes, parent, n) { 
    var id = genIdentifier(ids, parent, 'text', n);
    assign(inits, id, createText(this.text));
    appendNode(inits, parent, id);
};
AST.HtmlInsert.prototype.genDOMStatements      = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'insert', n),
        code = this.code.genCode(opts),
        range = `{ start: ${id}, end: ${id} }`;
    assign(inits, id, createText(''));
    appendNode(inits, parent, id);
    if (!opts.exec || noApparentSignals(code)) {
        exes.push(`Surplus.insert(${range}, ${code});`);   
    } else { 
        exe(exes, opts, `Surplus.insert(range, ${code}, ${opts.exec || "null"});`, "range", range);
    }
};
AST.StaticProperty.prototype.genDOMStatements  = function (opts, ids, inits, exes, id, n) {
    inits.push(id + "." + propName(opts, this.name) + " = " + this.value + ";");
};
AST.DynamicProperty.prototype.genDOMStatements = function (opts, ids, inits, exes, id, n) {
    var code = this.code.genCode(opts);
    if (this.name === "ref") {
        inits.push(code + " = " + id + ";");
    } else {
        var prop = propName(opts, this.name),
            setter = `${id}.${prop} = ${code};`;
        if (noApparentSignals(code)) {
            exes.push(setter);
        } else {
            exe(exes, opts, setter, "", "");
        }
    }
};
AST.Mixin.prototype.genDOMStatements           = function (opts, ids, inits, exes, id, n) {
    var code = this.code.genCode(opts);
    exe(exes, opts, `(${code})(${id}, __state);`, "__state", "");
};

let genIdentifier = (ids : string[], parent : string, tag : string, n : number) => {
        var id = parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
        ids.push(id);
        return id;
    },
    assign = (stmts : string[], id : string, expr : string) => 
        stmts.push(`${id} = ${expr};`),
    appendNode = (stmts : string[], parent : string, child : string) =>
        stmts.push(parent + '.appendChild(' + child + ');'),
    createElement = (tag : string)  => 
        `document.createElement(\'${tag}\')`,
    createComment = (text : string) => 
        `document.createComment(${codeStr(text)})`,
    createText    = (text : string) => 
        `document.createTextNode(${codeStr(text)})`,
    exe = (execs : string[], opts : Params, code : string, varname : string , seed : string) =>
        execs.push(
            opts.exec ?
                (varname ? `${opts.exec}(function (${varname}) { return ${code} }${seed ? `, ${seed}` : ''});`
                         : `${opts.exec}(function () { ${code} });`) :
            varname ? `(function (${varname}) { return ${code} })(${seed});` :
            code);

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
