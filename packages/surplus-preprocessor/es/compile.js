import { EmbeddedCode, CodeText, HtmlElement, HtmlText, HtmlComment, HtmlInsert, StaticProperty, DynamicProperty, Mixin } from './AST';
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
    function DOMExpression(ids, statements, computations) {
        this.ids = ids;
        this.statements = statements;
        this.computations = computations;
    }
    return DOMExpression;
}());
var SubComponent = (function () {
    function SubComponent(name, properties, children) {
        this.name = name;
        this.properties = properties;
        this.children = children;
    }
    return SubComponent;
}());
var compile = function (ctl, opts) {
    var compileSegments = function (node) {
        return node.segments.reduce(function (res, s) { return res + compileSegment(s, res); }, "");
    }, compileSegment = function (node, previousCode) {
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, previousCode);
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, previousCode) {
        var code = rx.upperStart.test(node.tag) ?
            compileSubComponent(buildSubComponent(node), previousCode) :
            (node.properties.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                "Surplus.createRootElement(\"" + node.tag + "\")" :
                compileDOMExpression(buildDOMExpression(node), previousCode);
        return markLoc(code, node.loc, opts);
    }, buildSubComponent = function (node) {
        var 
        // group successive properties into property objects, but mixins stand alone
        // e.g. a="1" b={foo} {...mixin} c="3" gets combined into [{a: "1", b: foo}, mixin, {c: "3"}]
        properties = node.properties.reduce(function (props, p) {
            var lastSegment = props[props.length - 1], value = p instanceof StaticProperty ? p.value : compileSegments(p.code);
            if (p instanceof Mixin)
                props.push(value);
            else if (props.length === 0 || typeof lastSegment === 'string')
                props.push((_a = {}, _a[p.name] = value, _a));
            else
                lastSegment[p.name] = value;
            return props;
            var _a;
        }, []), children = node.content.map(function (c) {
            return c instanceof HtmlElement ? compileHtmlElement(c, "") :
                c instanceof HtmlText ? codeStr(c.text.trim()) :
                    c instanceof HtmlInsert ? compileSegments(c.code) :
                        "document.createComment(" + codeStr(c.text) + ")";
        }).filter(Boolean);
        return new SubComponent(node.tag, properties, children);
    }, compileSubComponent = function (expr, prior) {
        var nl = "\r\n" + indent(prior), nli = nl + '    ', nlii = nli + '    ', 
        // convert children to an array expression
        children = expr.children.length === 0 ? '[]' : '[' + nlii
            + expr.children.join(',' + nlii) + nli
            + ']', properties0 = expr.properties[0];
        // add children property to first property object (creating one if needed)
        // this has the double purpose of creating the children property and making sure
        // that the first property group is not a mixin and can therefore be used as a base for extending
        if (typeof properties0 === 'string')
            expr.properties.unshift({ children: children });
        else
            properties0['children'] = children;
        // convert property objects to object expressions
        var properties = expr.properties.map(function (obj) {
            return typeof obj === 'string' ? obj :
                '{' + Object.keys(obj).map(function (p) { return "" + nli + p + ": " + obj[p]; }).join(',') + nl + '}';
        });
        // join multiple object expressions using Object.assign()
        var needLibrary = expr.properties.length > 1 || typeof expr.properties[0] === 'string';
        return needLibrary ? "Surplus.subcomponent(" + expr.name + ", [" + properties.join(', ') + "])"
            : expr.name + "(" + properties[0] + ")";
    }, buildDOMExpression = function (top) {
        var ids = [], statements = [], computations = [];
        var buildHtmlElement = function (node, parent, n) {
            var id = addId(parent, node.tag, n);
            if (rx.upperStart.test(node.tag)) {
                var expr = compileSubComponent(buildSubComponent(node), "");
                buildHtmlInsert(new HtmlInsert(new EmbeddedCode([new CodeText(expr, node.loc)]), node.loc), parent, n);
            }
            else {
                var exelen = computations.length;
                addStatement(parent ? id + " = Surplus.createElement('" + node.tag + "', " + parent + ")"
                    : id + " = Surplus.createRootElement('" + node.tag + "')");
                node.properties.forEach(function (p, i) { return buildProperty(p, id, i); });
                var myexes = computations.splice(exelen);
                node.content.forEach(function (c, i) { return buildChild(c, id, i); });
                computations.push.apply(computations, myexes);
            }
        }, buildProperty = function (node, id, n) {
            return node instanceof StaticProperty ? buildStaticProperty(node, id, n) :
                node instanceof DynamicProperty ? buildDynamicProperty(node, id, n) :
                    buildMixin(node, id, n);
        }, buildStaticProperty = function (node, id, n) {
            return addStatement(id + "." + node.name + " = " + node.value + ";");
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
            ids.push(id);
            return id;
        }, addStatement = function (stmt) {
            return statements.push(stmt);
        }, addComputation = function (body, varname, seed, loc) {
            body = varname ? "Surplus.S(function (" + varname + ") { return " + body + " }" + (seed ? ", " + seed : '') + ");"
                : "Surplus.S(function () { " + body + " });";
            computations.push(markLoc(body, loc, opts));
        };
        buildHtmlElement(top, '', 0);
        return new DOMExpression(ids, statements, computations);
    };
    return compileSegments(ctl);
}, compileDOMExpression = function (code, previousCode) {
    var nl = "\r\n" + indent(previousCode), inl = nl + '    ', iinl = inl + '    ';
    return '(function () {' + iinl
        + 'var ' + code.ids.join(', ') + ';' + iinl
        + code.statements.join(iinl) + iinl
        + code.computations.join(iinl) + iinl
        + 'return __;' + inl
        + '})()';
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
