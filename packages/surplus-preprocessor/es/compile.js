import { EmbeddedCode, CodeText, HtmlElement, HtmlText, HtmlComment, HtmlInsert, StaticProperty, DynamicProperty } from './AST';
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
        this.statements = [];
        this.computations = [];
    }
    return DOMExpression;
}());
var compile = function (ctl, opts) {
    var compileSegments = function (node) {
        return node.segments.reduce(function (res, s) { return res + compileSegment(s, res); }, "");
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
                        "document.createComment(" + codeStr(c.text) + ")";
        }); // FIXME: translate to js comment maybe?
        return node.tag + "({" + inl
            + props.join(inl) + inl
            + 'children: [' + iinl
            + children.join(',' + iinl) + inl
            + ']})';
    }, compileDOMExpression = function (code, previousCode) {
        var nl = "\r\n" + indent(previousCode), inl = nl + '    ', iinl = inl + '    ';
        return '(function () {' + iinl
            + 'var ' + code.ids.join(', ') + ';' + iinl
            + code.statements.join(iinl) + iinl
            + code.computations.join(iinl) + iinl
            + 'return __;' + inl
            + '})()';
    }, buildDOMExpression = function (top) {
        var code = new DOMExpression();
        var buildHtmlElement = function (node, parent, n) {
            var id = addId(parent, node.tag, n);
            if (rx.upperStart.test(node.tag)) {
                var expr = compileSubComponent(node, "");
                buildHtmlInsert(new HtmlInsert(new EmbeddedCode([new CodeText(expr, node.loc)]), node.loc), parent, n);
            }
            else {
                var exelen = code.computations.length;
                addStatement(parent ? id + " = Surplus.createElement('" + node.tag + "', " + parent + ")"
                    : id + " = Surplus.createRootElement('" + node.tag + "')");
                node.properties.forEach(function (p, i) { return buildProperty(p, id, i); });
                var myexes = code.computations.splice(exelen);
                node.content.forEach(function (c, i) { return buildChild(c, id, i); });
                code.computations.push.apply(code.computations, myexes);
            }
        }, buildProperty = function (node, id, n) {
            return node instanceof StaticProperty ? buildStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? buildDynamicProperty(node, id, n) :
                    buildMixin(node, id, n);
        }, buildStaticProperty = function (node, id, n) {
            addStatement(id + "." + node.name + " = " + node.value + ";");
        }, buildDynamicProperty = function (node, id, n) {
            var expr = compileSegments(node.code);
            if (node.name === "ref") {
                addStatement(expr + " = " + id + ";");
            }
            else {
                var setter = id + "." + node.name + " = " + expr + ";";
                if (noApparentSignals(expr))
                    addStatement(setter);
                else
                    addComputation(setter, "", "", node.loc);
            }
        }, buildMixin = function (node, id, n) {
            var expr = compileSegments(node.code);
            addComputation("(" + expr + ")(" + id + ", __state);", "__state", "", node.loc);
        }, buildChild = function (node, parent, n) {
            return node instanceof HtmlElement ? buildHtmlElement(node, parent, n) :
                node instanceof HtmlComment ? buildHtmlComment(node, parent) :
                    node instanceof HtmlText ? buildHtmlText(node, parent, n) :
                        buildHtmlInsert(node, parent, n);
        }, buildHtmlComment = function (node, parent) {
            return addStatement("Surplus.createComment(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlText = function (node, parent, n) {
            return addStatement("Surplus.createTextNode(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlInsert = function (node, parent, n) {
            var id = addId(parent, 'insert', n), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            addStatement(id + " = Surplus.createTextNode('', " + parent + ")");
            addComputation("Surplus.insert(range, " + ins + ");", "range", range, node.loc);
        }, addId = function (parent, tag, n) {
            var id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
            code.ids.push(id);
            return id;
        }, addStatement = function (stmt) {
            return code.statements.push(stmt);
        }, addComputation = function (body, varname, seed, loc) {
            body = varname ? "Surplus.S(function (" + varname + ") { return " + body + " }" + (seed ? ", " + seed : '') + ");"
                : "Surplus.S(function () { " + body + " });";
            code.computations.push(markLoc(body, loc, opts));
        };
        buildHtmlElement(top, '', 0);
        return code;
    };
    return compileSegments(ctl);
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
