import { CodeText, HtmlElement, HtmlText, HtmlComment, HtmlInsert, StaticProperty, DynamicProperty } from './AST';
import * as sourcemap from './sourcemap';
export { compile };
// pre-compiled regular expressions
var rx = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    upperStart: /^[A-Z]/,
    singleQuotes: /'/g,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
var CodeBlock = (function () {
    function CodeBlock() {
        this.ids = [];
        this.staticStmts = [];
        this.dynamicStmts = [];
    }
    CodeBlock.prototype.id = function (id) { this.ids.push(id); return id; };
    CodeBlock.prototype.staticStmt = function (stmt) { this.staticStmts.push(stmt); return stmt; };
    CodeBlock.prototype.dynamicStmt = function (stmt) { this.dynamicStmts.push(stmt); return stmt; };
    return CodeBlock;
}());
var compile = function (node, opts) { return compileSegments(node, opts); }, compileSegments = function (node, opts) {
    var result = "", i;
    for (i = 0; i < node.segments.length; i++) {
        result += compileSegment(node.segments[i], result, opts);
    }
    return result;
}, compileSegment = function (node, previousCode, opts) {
    return node instanceof CodeText ? compileCodeText(node, opts) : compileHtmlElement(node, previousCode, opts);
}, compileCodeText = function (node, opts) {
    return markBlockLocs(node.text, node.loc, opts);
}, compileHtmlElement = function (node, previousCode, opts) {
    var code;
    if (rx.upperStart.test(node.tag)) {
        code = compileSubComponent(node, previousCode, opts);
    }
    else if (node.properties.length === 0 && node.content.length === 0) {
        // optimization: don't need IIFE for simple single nodes
        code = "document.createElement(\"" + node.tag + "\")";
    }
    else {
        var block = new CodeBlock(), expr = stmtsHtmlElement(node, block, null, 0, opts);
        code = compileCodeBlock(block, expr, indent(previousCode));
    }
    return markLoc(code, node.loc, opts);
}, compileSubComponent = function (node, prior, opts) {
    var nl = "\r\n" + indent(prior), inl = nl + '    ', iinl = inl + '    ', props = node.properties.map(function (p) {
        return p instanceof StaticProperty ? propName(opts, p.name) + ": " + p.value + "," :
            p instanceof DynamicProperty ? propName(opts, p.name) + ": " + compileSegments(p.code, opts) + "," :
                '';
    }), children = node.content.map(function (c) {
        return c instanceof HtmlElement ? compileHtmlElement(c, prior, opts) :
            c instanceof HtmlText ? codeStr(c.text.trim()) :
                c instanceof HtmlInsert ? compileSegments(c.code, opts) :
                    createComment(c.text);
    });
    return node.tag + "({" + inl
        + props.join(inl) + inl
        + 'children: [' + iinl
        + children.join(',' + iinl) + inl
        + ']})';
}, compileCodeBlock = function (code, expr, indent) {
    var nl = "\r\n" + indent, inl = nl + '    ', iinl = inl + '    ';
    return '(function () {' + iinl
        + 'var ' + code.ids.join(', ') + ';' + iinl
        + code.staticStmts.join(iinl) + iinl
        + code.dynamicStmts.join(iinl) + iinl
        + 'return ' + expr + ';' + inl
        + '})()';
}, stmtsHtmlElement = function (node, code, parent, n, opts) {
    var id = code.id(genIdentifier(parent, node.tag, n));
    if (rx.upperStart.test(node.tag)) {
        var expr = compileSubComponent(node, "", opts), range = "{ start: " + id + ", end: " + id + " }";
        code.staticStmt(assign(id, createText('')));
        code.dynamicStmt(computation("Surplus.insert(range, " + expr + ");", "range", range, node.loc, opts));
    }
    else {
        var exelen = code.dynamicStmts.length;
        code.staticStmt(assign(id, createElement(node.tag)));
        for (var i = 0; i < node.properties.length; i++) {
            stmtsProperty(node.properties[i], code, id, i, opts);
        }
        var myexes = code.dynamicStmts.splice(exelen);
        for (i = 0; i < node.content.length; i++) {
            var child = stmtsChild(node.content[i], code, id, i, opts);
            if (child)
                code.staticStmt(appendNode(id, child));
        }
        code.dynamicStmts = code.dynamicStmts.concat(myexes);
    }
    return id;
}, stmtsProperty = function (node, code, id, n, opts) {
    return node instanceof StaticProperty ? stmtsStaticProperty(node, code, id, n, opts) :
        node instanceof DynamicProperty ? stmtsDynamicProperty(node, code, id, n, opts) :
            stmtsMixin(node, code, id, n, opts);
}, stmtsStaticProperty = function (node, code, id, n, opts) {
    code.staticStmt(id + "." + propName(opts, node.name) + " = " + node.value + ";");
}, stmtsDynamicProperty = function (node, code, id, n, opts) {
    var expr = compileSegments(node.code, opts);
    if (node.name === "ref") {
        code.staticStmt(expr + " = " + id + ";");
    }
    else {
        var prop = propName(opts, node.name), setter = id + "." + prop + " = " + expr + ";";
        code.dynamicStmt(noApparentSignals(expr)
            ? setter
            : computation(setter, "", "", node.loc, opts));
    }
}, stmtsMixin = function (node, code, id, n, opts) {
    var expr = compileSegments(node.code, opts);
    code.dynamicStmt(computation("(" + expr + ")(" + id + ", __state);", "__state", "", node.loc, opts));
}, stmtsChild = function (node, code, parent, n, opts) {
    return node instanceof HtmlElement ? stmtsHtmlElement(node, code, parent, n, opts) :
        node instanceof HtmlComment ? stmtsHtmlComment(node) :
            node instanceof HtmlText ? stmtsHtmlText(node, code, parent, n) :
                stmtsHtmlInsert(node, code, parent, n, opts);
}, stmtsHtmlComment = function (node) {
    return createComment(node.text);
}, stmtsHtmlText = function (node, code, parent, n) {
    // if we're the first child, we can just set innerText
    if (n === 0) {
        code.staticStmt(parent + ".innerText = " + codeStr(node.text));
    }
    else {
        return createText(node.text);
    }
}, stmtsHtmlInsert = function (node, code, parent, n, opts) {
    var id = code.id(genIdentifier(parent, 'insert', n)), ins = compileSegments(node.code, opts), range = "{ start: " + id + ", end: " + id + " }";
    code.staticStmt(assign(id, createText('')));
    code.dynamicStmt(noApparentSignals(ins)
        ? "Surplus.insert(" + range + ", " + ins + ");"
        : computation("Surplus.insert(range, " + ins + ");", "range", range, node.loc, opts));
    return id;
}, genIdentifier = function (parent, tag, n) {
    return parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
}, propName = function (opts, name) {
    return opts.jsx && name.substr(0, 2) === 'on' ? (name === 'onDoubleClick' ? 'ondblclick' : name.toLowerCase()) : name;
};
var assign = function (id, expr) {
    return id + " = " + expr + ";";
}, appendNode = function (parent, child) {
    return "Surplus.appendChild(" + parent + ", " + child + ");";
}, createElement = function (tag) {
    return "Surplus.createElement('" + tag + "')";
}, createComment = function (text) {
    return "Surplus.createComment(" + codeStr(text) + ")";
}, createText = function (text) {
    return "Surplus.createTextNode(" + codeStr(text) + ")";
}, computation = function (code, varname, seed, loc, opts) {
    return markLoc(varname ? "Surplus.S(function (" + varname + ") { return " + code + " }" + (seed ? ", " + seed : '') + ");"
        : "Surplus.S(function () { " + code + " });", loc, opts);
};
var noApparentSignals = function (code) {
    return !rx.hasParen.test(code) || rx.loneFunction.test(code);
}, indent = function (previousCode) {
    var m = rx.indent.exec(previousCode);
    return m ? m[1] : '';
}, codeStr = function (str) {
    return "'" +
        str.replace(rx.backslashes, "\\\\")
            .replace(rx.singleQuotes, "\\'")
            .replace(rx.newlines, "\\\n") +
        "'";
};
var markLoc = function (str, loc, opts) {
    return opts.sourcemap ? sourcemap.locationMark(loc) + str : str;
}, markBlockLocs = function (str, loc, opts) {
    if (!opts.sourcemap)
        return str;
    var lines = str.split('\n'), offset = 0;
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        offset += line.length;
        var lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
        lines[i] = sourcemap.locationMark(lineloc) + line;
    }
    return sourcemap.locationMark(loc) + lines.join('\n');
};
