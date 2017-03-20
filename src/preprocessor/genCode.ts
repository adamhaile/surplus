import * as AST from './AST';
import * as sourcemap from './sourcemap';
import { Params } from './preprocess';

// pre-compiled regular expressions
const rx = {
    backslashes : /\\/g,
    newlines    : /\r?\n/g,
    hasParen    : /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
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
    if (this.properties.length === 0 && this.content.length === 0) {
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

// genDOMStatements
AST.HtmlElement.prototype.genDOMStatements     = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, this.tag, n),
        myexes = [] as string[];
    createElement(inits, id, this.tag);
    for (var i = 0; i < this.properties.length; i++) {
        this.properties[i].genDOMStatements(opts, ids, inits, myexes, id, i);
    }
    for (i = 0; i < this.content.length; i++) {
        this.content[i].genDOMStatements(opts, ids, inits, exes, id, i);
    }
    exes.push.apply(exes, myexes);
    if (parent) appendNode(inits, parent, id);
};
AST.HtmlComment.prototype.genDOMStatements     = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'comment', n);
    createComment(inits, id, this.text);
    appendNode(inits, parent, id);
}
AST.HtmlText.prototype.genDOMStatements        = function (opts, ids, inits, exes, parent, n) { 
    var id = genIdentifier(ids, parent, 'text', n);
    createText(inits, id, this.text);
    appendNode(inits, parent, id);
};
AST.HtmlInsert.prototype.genDOMStatements      = function (opts, ids, inits, exes, parent, n) {
    var id = genIdentifier(ids, parent, 'insert', n),
        code = this.code.genCode(opts),
        range = `{ start: ${id}, end: ${id} }`;
    createText(inits, id, '');
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

function genIdentifier(ids : string[], parent : string, tag : string, n : number) {
    var id = parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
    ids.push(id);
    return id;
}

function createElement(stmts : string[], id : string, tag : string) {
    stmts.push(id + ' = document.createElement(\'' + tag + '\');');
}

function createComment(stmts : string[], id : string, text : string) {
    stmts.push(id + ' = document.createComment(' + codeStr(text) + ');');
}

function createText(stmts : string[], id : string, text : string) {
    stmts.push(id + ' = document.createTextNode(' + codeStr(text) + ');');
}

function appendNode(stmts : string[], parent : string, child : string) {
    stmts.push(parent + '.appendChild(' + child + ');');
}

function exe(execs : string[], opts : Params, code : string, varname : string , seed : string) {
    if (opts.exec) {
        if (varname) {
            code = `${opts.exec}(function (${varname}) { return ${code} }${seed ? `, ${seed}` : ''});`;
        } else {
            code = `${opts.exec}(function () { ${code} });`;    
        }
    } else if (varname) {
        code = `(function (${varname}) { return ${code} })(${seed});`;
    }
    execs.push(code);
}

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
