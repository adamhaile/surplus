import { EmbeddedCode, CodeText, HtmlElement, HtmlText, HtmlComment, HtmlInsert, StaticProperty, DynamicProperty, Mixin } from './AST';
import { locationMark } from './sourcemap';
export { compile, codeStr };
// pre-compiled regular expressions
var rx = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen: /\)\s*$/,
    subcomponent: /(^[A-Z])|\./,
    singleQuotes: /'/g,
    attribute: /-/,
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
var Computation = (function () {
    function Computation(statements, loc, stateVar, seed) {
        this.statements = statements;
        this.loc = loc;
        this.stateVar = stateVar;
        this.seed = seed;
    }
    return Computation;
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
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode));
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, indent) {
        var code = rx.subcomponent.test(node.tag) ?
            emitSubComponent(buildSubComponent(node), indent) :
            (node.properties.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                "Surplus.createRootElement(\"" + node.tag + "\")" :
                emitDOMExpression(buildDOMExpression(node), indent);
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
    }, emitSubComponent = function (expr, indent) {
        var nl = "\r\n" + indent, nli = nl + '    ', nlii = nli + '    ', 
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
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc, id = addId(parent, tag, n);
            if (rx.subcomponent.test(tag)) {
                buildHtmlInsert(new HtmlInsert(new EmbeddedCode([node]), loc), parent, n);
            }
            else {
                addStatement(parent ? id + " = Surplus.createElement('" + tag + "', " + parent + ")"
                    : id + " = Surplus.createRootElement('" + tag + "')");
                var exprs_1 = properties.map(function (p) { return p instanceof StaticProperty ? '' : compileSegments(p.code); }), hasMixins = properties.some(function (p) { return p instanceof Mixin; }), dynamic = hasMixins || exprs_1.some(function (e) { return !noApparentSignals(e); }), stmts = properties.map(function (p, i) {
                    return p instanceof StaticProperty ? buildStaticProperty(p, id) :
                        p instanceof DynamicProperty ? buildDynamicProperty(p, id, exprs_1[i]) :
                            buildMixin(exprs_1[i], id, n);
                });
                if (!dynamic) {
                    stmts.forEach(addStatement);
                }
                content.forEach(function (c, i) { return buildChild(c, id, i); });
                if (dynamic) {
                    if (hasMixins) {
                        var propAges_1 = { __current: 0 }, maxAge_1 = 1 << 31 - 1;
                        properties.forEach(function (p) { return p instanceof Mixin || (propAges_1[p.name] = maxAge_1); });
                        stmts.unshift("__propAges.__current++;");
                        stmts.push("__propAges");
                        addComputation(stmts, "__propAges", JSON.stringify(propAges_1), loc);
                    }
                    else {
                        addComputation(stmts, null, null, loc);
                    }
                }
            }
        }, buildStaticProperty = function (node, id) {
            return buildProperty(id, node.name, node.value);
        }, buildDynamicProperty = function (node, id, expr) {
            return node.name === "ref"
                ? expr + " = " + id + ";"
                : buildProperty(id, node.name, expr);
        }, buildProperty = function (id, prop, expr) {
            return isAttribute(prop)
                ? id + ".setAttribute(" + codeStr(prop) + ", " + expr + ");"
                : id + "." + prop + " = " + expr + ";";
        }, buildMixin = function (expr, id, n) {
            var state = addId(id, 'mixin', n);
            return state + " = Surplus.spread(" + expr + ", " + id + ", " + state + ", __propAges);";
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
            addComputation(["Surplus.insert(range, " + ins + ");"], "range", range, node.loc);
        }, addId = function (parent, tag, n) {
            var id = parent === '' ? '__' : parent + (parent[parent.length - 1] === '_' ? '' : '_') + tag + (n + 1);
            ids.push(id);
            return id;
        }, addStatement = function (stmt) {
            return statements.push(stmt);
        }, addComputation = function (body, stateVar, seed, loc) {
            computations.push(new Computation(body, loc, stateVar, seed));
        };
        buildHtmlElement(top, '', 0);
        return new DOMExpression(ids, statements, computations);
    }, emitDOMExpression = function (code, indent) {
        var nl = "\r\n" + indent, nli = nl + '    ', nlii = nli + '    ';
        return '(function () {' + nli
            + 'var ' + code.ids.join(', ') + ';' + nli
            + code.statements.join(nli) + nli
            + code.computations.map(function (comp) {
                var statements = comp.statements, loc = comp.loc, stateVar = comp.stateVar, seed = comp.seed;
                if (stateVar)
                    statements[statements.length - 1] = 'return ' + statements[statements.length - 1];
                var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nlii), code = "Surplus.S(function (" + (stateVar || '') + ") {" + body + "}" + (seed ? ", " + seed : '') + ");";
                return markLoc(code, loc, opts);
            }).join(nli) + nli
            + 'return __;' + nl
            + '})()';
    };
    return compileSegments(ctl);
};
var noApparentSignals = function (code) {
    return !rx.hasParen.test(code) || (rx.loneFunction.test(code) && !rx.endsInParen.test(code));
}, isAttribute = function (prop) {
    return rx.attribute.test(prop);
}, // TODO: better heuristic for attributes than name contains a hyphen
indent = function (previousCode) {
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
