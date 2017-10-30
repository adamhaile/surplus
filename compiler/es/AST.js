// 'kind' properties are to make sure that Typescript treats each of these as distinct classes
// otherwise, two classes with same props, like the 4 with just code / loc, are treated
// as interchangeable
var Program = /** @class */ (function () {
    function Program(segments) {
        this.segments = segments;
        this.kind = 'program';
    }
    return Program;
}());
export { Program };
var CodeText = /** @class */ (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
        this.kind = 'code';
    }
    return CodeText;
}());
export { CodeText };
var EmbeddedCode = /** @class */ (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
        this.kind = 'embeddedcode';
    }
    return EmbeddedCode;
}());
export { EmbeddedCode };
var JSXElement = /** @class */ (function () {
    function JSXElement(tag, properties, references, functions, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.references = references;
        this.functions = functions;
        this.content = content;
        this.loc = loc;
        this.kind = 'element';
        this.isHTML = JSXElement.domTag.test(this.tag);
    }
    JSXElement.domTag = /^[a-z][^\.]*$/;
    return JSXElement;
}());
export { JSXElement };
var JSXText = /** @class */ (function () {
    function JSXText(text) {
        this.text = text;
        this.kind = 'text';
    }
    return JSXText;
}());
export { JSXText };
var JSXComment = /** @class */ (function () {
    function JSXComment(text) {
        this.text = text;
        this.kind = 'comment';
    }
    return JSXComment;
}());
export { JSXComment };
var JSXInsert = /** @class */ (function () {
    function JSXInsert(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'insert';
    }
    return JSXInsert;
}());
export { JSXInsert };
var JSXStaticProperty = /** @class */ (function () {
    function JSXStaticProperty(name, value) {
        this.name = name;
        this.value = value;
        this.kind = 'staticprop';
    }
    return JSXStaticProperty;
}());
export { JSXStaticProperty };
var JSXDynamicProperty = /** @class */ (function () {
    function JSXDynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
        this.kind = 'dynamicprop';
    }
    return JSXDynamicProperty;
}());
export { JSXDynamicProperty };
var JSXSpreadProperty = /** @class */ (function () {
    function JSXSpreadProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'spread';
    }
    return JSXSpreadProperty;
}());
export { JSXSpreadProperty };
var JSXStyleProperty = /** @class */ (function () {
    function JSXStyleProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'style';
        this.name = "style";
    }
    return JSXStyleProperty;
}());
export { JSXStyleProperty };
var JSXReference = /** @class */ (function () {
    function JSXReference(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'reference';
    }
    return JSXReference;
}());
export { JSXReference };
var JSXFunction = /** @class */ (function () {
    function JSXFunction(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'function';
    }
    return JSXFunction;
}());
export { JSXFunction };
// a Copy transform, for building non-identity transforms on top of
export var Copy = {
    Program: function (node) {
        return new Program(this.CodeSegments(node.segments));
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) {
            return node instanceof CodeText ? _this.CodeText(node) :
                _this.JSXElement(node);
        });
    },
    EmbeddedCode: function (node) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement: function (node) {
        var _this = this;
        return new JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p); }), node.references.map(function (r) { return _this.JSXReference(r); }), node.functions.map(function (f) { return _this.JSXFunction(f); }), node.content.map(function (c) { return _this.JSXContent(c); }), node.loc);
    },
    JSXProperty: function (node) {
        return node instanceof JSXStaticProperty ? this.JSXStaticProperty(node) :
            node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
                node instanceof JSXStyleProperty ? this.JSXStyleProperty(node) :
                    this.JSXSpreadProperty(node);
    },
    JSXContent: function (node) {
        return node instanceof JSXComment ? this.JSXComment(node) :
            node instanceof JSXText ? this.JSXText(node) :
                node instanceof JSXInsert ? this.JSXInsert(node) :
                    this.JSXElement(node);
    },
    JSXInsert: function (node) {
        return new JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText: function (node) { return node; },
    JSXText: function (node) { return node; },
    JSXComment: function (node) { return node; },
    JSXStaticProperty: function (node) { return node; },
    JSXDynamicProperty: function (node) {
        return new JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty: function (node) {
        return new JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXStyleProperty: function (node) {
        return new JSXStyleProperty(this.EmbeddedCode(node.code), node.loc);
    },
    JSXReference: function (node) {
        return new JSXReference(this.EmbeddedCode(node.code), node.loc);
    },
    JSXFunction: function (node) {
        return new JSXFunction(this.EmbeddedCode(node.code), node.loc);
    }
};
