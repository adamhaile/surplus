import { CodeText, HtmlElement, HtmlText, HtmlComment, HtmlInsert, StaticProperty, DynamicProperty } from './AST';
import { locationMark } from './sourcemap';
export { compile, codeStr };
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
var DOMExpression = (function () {
    function DOMExpression() {
        this.ids = [];
        this.staticStmts = [];
        this.dynamicStmts = [];
        this.result = "";
    }
    DOMExpression.prototype.id = function (id) { this.ids.push(id); return id; };
    DOMExpression.prototype.staticStmt = function (stmt) { this.staticStmts.push(stmt); return stmt; };
    DOMExpression.prototype.dynamicStmt = function (stmt) { this.dynamicStmts.push(stmt); return stmt; };
    return DOMExpression;
}());
var compile = function (node, opts) {
    var compileSegments = function (node) {
        var result = "", i;
        for (i = 0; i < node.segments.length; i++) {
            result += compileSegment(node.segments[i], result);
        }
        return result;
    }, compileSegment = function (node, previousCode) {
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, previousCode);
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, previousCode) {
        var code;
        if (rx.upperStart.test(node.tag)) {
            code = compileSubComponent(node, previousCode);
        }
        else if (node.properties.length === 0 && node.content.length === 0) {
            // optimization: don't need IIFE for simple single nodes
            code = "document.createElement(\"" + node.tag + "\")";
        }
        else {
            code = compileDOMExpression(buildDOMExpression(node), previousCode);
        }
        return markLoc(code, node.loc, opts);
    }, compileSubComponent = function (node, prior) {
        var nl = "\r\n" + indent(prior), inl = nl + '    ', iinl = inl + '    ', props = node.properties.map(function (p) {
            return p instanceof StaticProperty ? p.name + ": " + p.value + "," :
                p instanceof DynamicProperty ? p.name + ": " + compileSegments(p.code) + "," :
                    '';
        }), children = node.content.map(function (c) {
            return c instanceof HtmlElement ? compileHtmlElement(c, prior) :
                c instanceof HtmlText ? codeStr(c.text.trim()) :
                    c instanceof HtmlInsert ? compileSegments(c.code) :
                        createComment(c.text);
        });
        return node.tag + "({" + inl
            + props.join(inl) + inl
            + 'children: [' + iinl
            + children.join(',' + iinl) + inl
            + ']})';
    }, compileDOMExpression = function (code, previousCode) {
        var nl = "\r\n" + indent(previousCode), inl = nl + '    ', iinl = inl + '    ';
        return '(function () {' + iinl
            + 'var ' + code.ids.join(', ') + ';' + iinl
            + code.staticStmts.join(iinl) + iinl
            + code.dynamicStmts.join(iinl) + iinl
            + 'return ' + code.result + ';' + inl
            + '})()';
    }, buildDOMExpression = function (node) {
        var code = new DOMExpression();
        var stmtsHtmlElement = function (node, parent, n) {
            var id = code.id(genIdentifier(parent, node.tag, n));
            if (rx.upperStart.test(node.tag)) {
                var expr = compileSubComponent(node, ""), range = "{ start: " + id + ", end: " + id + " }";
                code.staticStmt(assign(id, createText('')));
                code.dynamicStmt(computation("Surplus.insert(range, " + expr + ");", "range", range, node.loc, opts));
            }
            else {
                var exelen = code.dynamicStmts.length;
                code.staticStmt(assign(id, createElement(node.tag)));
                for (var i = 0; i < node.properties.length; i++) {
                    stmtsProperty(node.properties[i], id, i);
                }
                var myexes = code.dynamicStmts.splice(exelen);
                for (i = 0; i < node.content.length; i++) {
                    var child = stmtsChild(node.content[i], id, i);
                    if (child)
                        code.staticStmt(appendNode(id, child));
                }
                code.dynamicStmts = code.dynamicStmts.concat(myexes);
            }
            return id;
        }, stmtsProperty = function (node, id, n) {
            return node instanceof StaticProperty ? stmtsStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? stmtsDynamicProperty(node, id, n) :
                    stmtsMixin(node, id, n);
        }, stmtsStaticProperty = function (node, id, n) {
            code.staticStmt(id + "." + node.name + " = " + node.value + ";");
        }, stmtsDynamicProperty = function (node, id, n) {
            var expr = compileSegments(node.code);
            if (node.name === "ref") {
                code.staticStmt(expr + " = " + id + ";");
            }
            else {
                var setter = id + "." + node.name + " = " + expr + ";";
                code.dynamicStmt(noApparentSignals(expr)
                    ? setter
                    : computation(setter, "", "", node.loc, opts));
            }
        }, stmtsMixin = function (node, id, n) {
            var expr = compileSegments(node.code);
            code.dynamicStmt(computation("(" + expr + ")(" + id + ", __state);", "__state", "", node.loc, opts));
        }, stmtsChild = function (node, parent, n) {
            return node instanceof HtmlElement ? stmtsHtmlElement(node, parent, n) :
                node instanceof HtmlComment ? stmtsHtmlComment(node) :
                    node instanceof HtmlText ? stmtsHtmlText(node, parent, n) :
                        stmtsHtmlInsert(node, parent, n);
        }, stmtsHtmlComment = function (node) {
            return createComment(node.text);
        }, stmtsHtmlText = function (node, parent, n) {
            return createText(node.text);
        }, stmtsHtmlInsert = function (node, parent, n) {
            var id = code.id(genIdentifier(parent, 'insert', n)), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            code.staticStmt(assign(id, createText('')));
            code.dynamicStmt(noApparentSignals(ins)
                ? "Surplus.insert(" + range + ", " + ins + ");"
                : computation("Surplus.insert(range, " + ins + ");", "range", range, node.loc, opts));
            return id;
        };
        code.result = stmtsHtmlElement(node, null, 0);
        return code;
    };
    return compileSegments(node);
};
var genIdentifier = function (parent, tag, n) {
    return parent === null ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
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
    return opts.sourcemap ? locationMark(loc) + str : str;
}, markBlockLocs = function (str, loc, opts) {
    if (!opts.sourcemap)
        return str;
    var lines = str.split('\n'), offset = 0;
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        offset += line.length;
        var lineloc = { line: loc.line + i, col: 0, pos: loc.pos + offset + i };
        lines[i] = locationMark(lineloc) + line;
    }
    return locationMark(loc) + lines.join('\n');
};
