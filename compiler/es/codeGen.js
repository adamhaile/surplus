var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { EmbeddedCode, CodeText, JSXElement, JSXText, JSXComment, JSXInsert, JSXStaticProperty, JSXDynamicProperty, JSXStyleProperty, JSXSpreadProperty } from './AST';
import { locationMark } from './sourcemap';
import { SvgOnlyTagRx, SvgForeignTag, IsAttribute } from './domRef';
export { codeGen, codeStr };
// pre-compiled regular expressions
var rx = {
    backslashes: /\\/g,
    newlines: /\r?\n/g,
    hasParen: /\(/,
    loneFunction: /^function |^\(\w*\) =>|^\w+ =>/,
    endsInParen: /\)\s*$/,
    nonIdChars: /[^a-zA-Z0-9]/,
    doubleQuotes: /"/g,
    indent: /\n(?=[^\n]+$)([ \t]*)/
};
var DOMExpression = /** @class */ (function () {
    function DOMExpression(ids, statements, computations) {
        this.ids = ids;
        this.statements = statements;
        this.computations = computations;
    }
    return DOMExpression;
}());
var Computation = /** @class */ (function () {
    function Computation(statements, loc, stateVar, seed) {
        this.statements = statements;
        this.loc = loc;
        this.stateVar = stateVar;
        this.seed = seed;
    }
    return Computation;
}());
var SubComponent = /** @class */ (function () {
    function SubComponent(name, refs, fns, properties, children, loc) {
        this.name = name;
        this.refs = refs;
        this.fns = fns;
        this.properties = properties;
        this.children = children;
        this.loc = loc;
    }
    return SubComponent;
}());
var codeGen = function (ctl, opts) {
    var compileSegments = function (node) {
        return node.segments.reduce(function (res, s) { return res + compileSegment(s, res); }, "");
    }, compileSegment = function (node, previousCode) {
        return node instanceof CodeText ? compileCodeText(node) : compileHtmlElement(node, indent(previousCode));
    }, compileCodeText = function (node) {
        return markBlockLocs(node.text, node.loc, opts);
    }, compileHtmlElement = function (node, indent) {
        var code = !node.isHTML ?
            emitSubComponent(buildSubComponent(node), indent) :
            (node.properties.length === 0 && node.functions.length === 0 && node.content.length === 0) ?
                // optimization: don't need IIFE for simple single nodes
                node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                    + ("Surplus.createElement('" + node.tag + "', null, null)") :
                (node.properties.length === 1
                    && node.properties[0] instanceof JSXStaticProperty
                    && node.properties[0].name === "className"
                    && node.functions.length === 1
                    && node.content.length === 0) ?
                    // optimization: don't need IIFE for simple single nodes
                    node.references.map(function (r) { return compileSegments(r.code) + ' = '; }).join('')
                        + ("Surplus.createElement('" + node.tag + "', " + node.properties[0].value + ", null)") :
                    emitDOMExpression(buildDOMExpression(node), indent);
        return markLoc(code, node.loc, opts);
    }, buildSubComponent = function (node) {
        var refs = node.references.map(function (r) { return compileSegments(r.code); }), fns = node.functions.map(function (r) { return compileSegments(r.code); }), 
        // group successive properties into property objects, but spreads stand alone
        // e.g. a="1" b={foo} {...spread} c="3" gets combined into [{a: "1", b: foo}, spread, {c: "3"}]
        properties = node.properties.reduce(function (props, p) {
            var lastSegment = props.length > 0 ? props[props.length - 1] : null, value = p instanceof JSXStaticProperty ? p.value : compileSegments(p.code);
            if (p instanceof JSXSpreadProperty) {
                props.push(value);
            }
            else if (lastSegment === null
                || typeof lastSegment === 'string'
                || (p instanceof JSXStyleProperty && lastSegment["style"])) {
                props.push((_a = {}, _a[p.name] = value, _a));
            }
            else {
                lastSegment[p.name] = value;
            }
            return props;
            var _a;
        }, []), children = node.content.map(function (c) {
            return c instanceof JSXElement ? compileHtmlElement(c, indent("")) :
                c instanceof JSXText ? codeStr(c.text.trim()) :
                    c instanceof JSXInsert ? compileSegments(c.code) :
                        "document.createComment(" + codeStr(c.text) + ")";
        });
        return new SubComponent(node.tag, refs, fns, properties, children, node.loc);
    }, emitSubComponent = function (sub, indent) {
        var nl = indent.nl, nli = indent.nli, nlii = indent.nlii;
        // build properties expression
        var 
        // convert children to an array expression
        children = sub.children.length === 0 ? '[]' : '[' + nlii
            + sub.children.join(',' + nlii) + nli
            + ']', property0 = sub.properties.length === 0 ? null : sub.properties[0], propertiesWithChildren = property0 === null || typeof property0 === 'string'
            // add children to first property object if we can, otherwise add an initial property object with just children
            ? [{ children: children }].concat(sub.properties) : [__assign({}, property0, { children: children })].concat(sub.properties.splice(1)), propertyExprs = propertiesWithChildren.map(function (obj) {
            return typeof obj === 'string' ? obj :
                '{' + Object.keys(obj).map(function (p) { return "" + nli + p + ": " + obj[p]; }).join(',') + nl + '}';
        }), properties = propertyExprs.length === 1 ? propertyExprs[0] :
            "Object.assign(" + propertyExprs.join(', ') + ")";
        // main call to sub-component
        var expr = sub.name + "(" + properties + ")";
        // ref assignments
        if (sub.refs.length > 0) {
            expr = sub.refs.map(function (r) { return r + " = "; }).join("") + expr;
        }
        // build computations for fns
        if (sub.fns.length > 0) {
            var comps = sub.fns.map(function (fn) { return new Computation(["(" + fn + ")(__, __state);"], sub.loc, '__state', null); });
            expr = "(function (__) {" + nli + "var __ = " + expr + ";" + nli + comps.map(function (comp) { return emitComputation(comp, indent) + nli; }) + nli + "return __;" + nl + "})()";
        }
        return expr;
    }, buildDOMExpression = function (top) {
        var ids = [], statements = [], computations = [];
        var buildHtmlElement = function (node, parent, n, svg) {
            var tag = node.tag, properties = node.properties, references = node.references, functions = node.functions, content = node.content, loc = node.loc;
            svg = svg || SvgOnlyTagRx.test(tag);
            if (!node.isHTML) {
                buildInsertedSubComponent(node, parent, n);
            }
            else {
                var id_1 = addId(parent, tag, n), propExprs_1 = properties.map(function (p) { return p instanceof JSXStaticProperty ? '' : compileSegments(p.code); }), spreads_1 = properties.filter(function (p) { return p instanceof JSXSpreadProperty || p instanceof JSXStyleProperty; }), classProp_1 = spreads_1.length === 0 && properties.filter(function (p) { return p instanceof JSXStaticProperty && p.name === 'className'; })[0] || null, propsDynamic_1 = propExprs_1.some(function (e) { return !noApparentSignals(e); }), propStmts = properties.map(function (p, i) {
                    return p === classProp_1 ? '' :
                        p instanceof JSXStaticProperty ? buildProperty(id_1, p.name, p.value, svg) :
                            p instanceof JSXDynamicProperty ? buildProperty(id_1, p.name, propExprs_1[i], svg) :
                                p instanceof JSXStyleProperty ? buildStyle(p, id_1, propExprs_1[i], propsDynamic_1, spreads_1) :
                                    buildSpread(id_1, propExprs_1[i], svg);
                }).filter(function (s) { return s !== ''; }), refStmts = references.map(function (r) { return compileSegments(r.code) + ' = '; }).join(''), childSvg_1 = svg && tag !== SvgForeignTag;
                addStatement(id_1 + " = " + refStmts + "Surplus.create" + (svg ? 'Svg' : '') + "Element('" + tag + "', " + (classProp_1 && classProp_1.value) + ", " + (parent || null) + ");");
                if (!propsDynamic_1) {
                    propStmts.forEach(addStatement);
                }
                if (content.length === 1 && content[0] instanceof JSXInsert) {
                    buildJSXContent(content[0], id_1);
                }
                else {
                    content.forEach(function (c, i) { return buildChild(c, id_1, i, childSvg_1); });
                }
                if (propsDynamic_1) {
                    addComputation(propStmts, null, null, loc);
                }
                functions.forEach(function (f) { return buildNodeFn(f, id_1); });
            }
        }, buildProperty = function (id, prop, expr, svg) {
            return svg || IsAttribute(prop)
                ? id + ".setAttribute(" + codeStr(prop) + ", " + expr + ");"
                : id + "." + prop + " = " + expr + ";";
        }, buildSpread = function (id, expr, svg) {
            return "Surplus.spread(" + id + ", " + expr + ", " + svg + ");";
        }, buildNodeFn = function (node, id) {
            var expr = compileSegments(node.code);
            addComputation(["(" + expr + ")(" + id + ", __state);"], '__state', null, node.loc);
        }, buildStyle = function (node, id, expr, dynamic, spreads) {
            return "Surplus.assign(" + id + ".style, " + expr + ");";
        }, buildChild = function (node, parent, n, svg) {
            return node instanceof JSXElement ? buildHtmlElement(node, parent, n, svg) :
                node instanceof JSXComment ? buildHtmlComment(node, parent) :
                    node instanceof JSXText ? buildJSXText(node, parent, n) :
                        buildJSXInsert(node, parent, n);
        }, buildInsertedSubComponent = function (node, parent, n) {
            return buildJSXInsert(new JSXInsert(new EmbeddedCode([node]), node.loc), parent, n);
        }, buildHtmlComment = function (node, parent) {
            return addStatement("Surplus.createComment(" + codeStr(node.text) + ", " + parent + ")");
        }, buildJSXText = function (node, parent, n) {
            return addStatement("Surplus.createTextNode(" + codeStr(node.text) + ", " + parent + ")");
        }, buildJSXInsert = function (node, parent, n) {
            var id = addId(parent, 'insert', n), ins = compileSegments(node.code), range = "{ start: " + id + ", end: " + id + " }";
            addStatement(id + " = Surplus.createTextNode('', " + parent + ")");
            addComputation(["Surplus.insert(__range, " + ins + ");"], "__range", range, node.loc);
        }, buildJSXContent = function (node, parent) {
            var content = compileSegments(node.code), dynamic = !noApparentSignals(content);
            if (dynamic)
                addComputation(["Surplus.content(" + parent + ", " + content + ", __current);"], '__current', "''", node.loc);
            else
                addStatement("Surplus.content(" + parent + ", " + content + ", \"\");");
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
        buildHtmlElement(top, '', 0, false);
        return new DOMExpression(ids, statements, computations);
    }, emitDOMExpression = function (code, indent) {
        var nl = indent.nl, nli = indent.nli, nlii = indent.nlii;
        return '(function () {' + nli
            + 'var ' + code.ids.join(', ') + ';' + nli
            + code.statements.join(nli) + nli
            + code.computations.map(function (comp) { return emitComputation(comp, indent); })
                .join(nli) + (code.computations.length === 0 ? '' : nli)
            + 'return __;' + nl
            + '})()';
    }, emitComputation = function (comp, _a) {
        var nli = _a.nli, nlii = _a.nlii;
        var statements = comp.statements, loc = comp.loc, stateVar = comp.stateVar, seed = comp.seed;
        if (stateVar)
            statements[statements.length - 1] = 'return ' + statements[statements.length - 1];
        var body = statements.length === 1 ? (' ' + statements[0] + ' ') : (nlii + statements.join(nlii) + nli), code = "Surplus.S(function (" + (stateVar || '') + ") {" + body + "}" + (seed !== null ? ", " + seed : '') + ");";
        return markLoc(code, loc, opts);
    };
    return compileSegments(ctl);
};
var noApparentSignals = function (code) {
    return !rx.hasParen.test(code) || (rx.loneFunction.test(code) && !rx.endsInParen.test(code));
}, indent = function (previousCode) {
    var m = rx.indent.exec(previousCode), pad = m ? m[1] : '', nl = "\r\n" + pad, nli = nl + '    ', nlii = nli + '    ';
    return { nl: nl, nli: nli, nlii: nlii };
}, codeStr = function (str) {
    return '"' +
        str.replace(rx.backslashes, "\\\\")
            .replace(rx.doubleQuotes, "\\\"")
            .replace(rx.newlines, "\\n") +
        '"';
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
