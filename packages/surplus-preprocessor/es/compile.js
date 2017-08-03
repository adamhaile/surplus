import { EmbeddedCode, CodeText, JSXElement, JSXText, JSXComment, JSXInsert, JSXStaticProperty, JSXDynamicProperty, JSXSpreadProperty } from './AST';
import { locationMark } from './sourcemap';
export { compile, codeStr };
// pre-compiled regular expressions
var rx = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen: /\)\s*$/,
    nonIdChars: /[^a-zA-Z0-9]/,
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
        var code = !node.isHTML ?
            emitSubComponent(buildSubComponent(node), indent) :
            (node.properties.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                "Surplus.createElement('" + node.tag + "', null, null)" :
                (node.properties.length === 1
                    && node.properties[0] instanceof JSXStaticProperty
                    && node.properties[0].name === "className"
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    "Surplus.createElement('" + node.tag + "', " + node.properties[0].value + ", null)" :
                    emitDOMExpression(buildDOMExpression(node), indent);
        return markLoc(code, node.loc, opts);
    }, buildSubComponent = function (node) {
        var 
        // group successive properties into property objects, but mixins stand alone
        // e.g. a="1" b={foo} {...mixin} c="3" gets combined into [{a: "1", b: foo}, mixin, {c: "3"}]
        properties = node.properties.reduce(function (props, p) {
            var lastSegment = props[props.length - 1], value = p instanceof JSXStaticProperty ? p.value : compileSegments(p.code);
            if (p instanceof JSXSpreadProperty)
                props.push(value);
            else if (props.length === 0 || typeof lastSegment === 'string')
                props.push((_a = {}, _a[p.name] = value, _a));
            else
                lastSegment[p.name] = value;
            return props;
            var _a;
        }, []), children = node.content.map(function (c) {
            return c instanceof JSXElement ? compileHtmlElement(c, "") :
                c instanceof JSXText ? codeStr(c.text.trim()) :
                    c instanceof JSXInsert ? compileSegments(c.code) :
                        "document.createComment(" + codeStr(c.text) + ")";
        });
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
        if (properties0 === undefined || typeof properties0 === 'string')
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
            var tag = node.tag, properties = node.properties, content = node.content, loc = node.loc;
            if (!node.isHTML) {
                buildInsertedSubComponent(node, parent, n);
            }
            else {
                var id_1 = addId(parent, tag, n), exprs_1 = properties.map(function (p) { return p instanceof JSXStaticProperty ? '' : compileSegments(p.code); }), spreads_1 = properties.filter(function (p) { return p instanceof JSXSpreadProperty; }), fns = properties.filter(function (p) { return p instanceof JSXDynamicProperty && p.isFn; }), refs = properties.filter(function (p) { return p instanceof JSXDynamicProperty && p.isRef; }), classProp_1 = spreads_1.length === 0 && fns.length === 0 && properties.filter(function (p) { return p instanceof JSXStaticProperty && p.name === 'className'; })[0] || null, dynamic_1 = fns.length > 0 || exprs_1.some(function (e) { return !noApparentSignals(e); }), stmts = properties.map(function (p, i) {
                    return p === classProp_1 ? '' :
                        p instanceof JSXStaticProperty ? buildStaticProperty(p, id_1) :
                            p instanceof JSXDynamicProperty ? buildDynamicProperty(p, id_1, i, exprs_1[i]) :
                                buildSpread(p, id_1, exprs_1[i], dynamic_1, spreads_1);
                }).filter(function (s) { return s !== ''; }), refStmts = refs.map(function (r) { return compileSegments(r.code) + ' = '; }).join('');
                addStatement(id_1 + " = " + refStmts + "Surplus.createElement('" + tag + "', " + (classProp_1 && classProp_1.value) + ", " + (parent || null) + ");");
                if (!dynamic_1) {
                    stmts.forEach(addStatement);
                }
                content.forEach(function (c, i) { return buildChild(c, id_1, i); });
                if (dynamic_1) {
                    if (spreads_1.length > 0) {
                        // create namedProps object and use it to initialize our spread state
                        var namedProps_1 = {};
                        properties.forEach(function (p) { return p instanceof JSXSpreadProperty || (namedProps_1[p.name] = true); });
                        var state = "new Surplus." + (spreads_1.length === 1 ? 'Single' : 'Multi') + "SpreadState(" + JSON.stringify(namedProps_1) + ")";
                        stmts.push("__spread;");
                        addComputation(stmts, "__spread", state, loc);
                    }
                    else {
                        addComputation(stmts, null, null, loc);
                    }
                }
            }
        }, buildStaticProperty = function (node, id) {
            return buildProperty(id, node.name, node.value);
        }, buildDynamicProperty = function (node, id, n, expr) {
            return node.isRef ? buildReference(expr, id) :
                node.isFn ? buildNodeFn(node, id, n, expr) :
                    buildProperty(id, node.name, expr);
        }, buildProperty = function (id, prop, expr) {
            return isAttribute(prop)
                ? id + ".setAttribute(" + codeStr(prop) + ", " + expr + ");"
                : id + "." + prop + " = " + expr + ";";
        }, buildReference = function (ref, id) { return ''; }, buildSpread = function (node, id, expr, dynamic, spreads) {
            return !dynamic ? buildStaticSpread(node, id, expr) :
                spreads.length === 1 ? buildSingleSpread(node, id, expr) :
                    buildMultiSpread(node, id, expr, spreads);
        }, buildStaticSpread = function (node, id, expr) {
            return "Surplus.staticSpread(" + id + ", " + expr + ");";
        }, buildSingleSpread = function (node, id, expr) {
            return "__spread.apply(" + id + ", " + expr + ");";
        }, buildMultiSpread = function (node, id, expr, spreads) {
            var n = spreads.indexOf(node), final = n === spreads.length - 1;
            return "__spread.apply(" + id + ", " + expr + ", " + n + ", " + final + ");";
        }, buildNodeFn = function (node, id, n, expr) {
            var state = addId(id, 'fn', n);
            return state + " = (" + expr + ")(" + id + ", " + state + ");";
        }, buildChild = function (node, parent, n) {
            return node instanceof JSXElement ? buildHtmlElement(node, parent, n) :
                node instanceof JSXComment ? buildHtmlComment(node, parent) :
                    node instanceof JSXText ? buildHtmlText(node, parent, n) :
                        buildHtmlInsert(node, parent, n);
        }, buildInsertedSubComponent = function (node, parent, n) {
            return buildHtmlInsert(new JSXInsert(new EmbeddedCode([node]), node.loc), parent, n);
        }, buildHtmlComment = function (node, parent) {
            return addStatement("Surplus.createComment(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlText = function (node, parent, n) {
            return addStatement("Surplus.createTextNode(" + codeStr(node.text) + ", " + parent + ")");
        }, buildHtmlInsert = function (node, parent, n) {
            var id = addId(parent, 'insert', n), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            addStatement(id + " = Surplus.createTextNode('', " + parent + ")");
            addComputation(["Surplus.insert(range, " + ins + ");"], "range", range, node.loc);
        }, addId = function (parent, tag, n) {
            tag = tag.replace(rx.nonIdChars, '_');
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
                var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nli), code = "Surplus.S(function (" + (stateVar || '') + ") {" + body + "}" + (seed ? ", " + seed : '') + ");";
                return markLoc(code, loc, opts);
            }).join(nli) + (code.computations.length === 0 ? '' : nli)
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
