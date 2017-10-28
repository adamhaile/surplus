var Program = /** @class */ (function () {
    function Program(segments) {
        this.segments = segments;
    }
    return Program;
}());
export { Program };
var CodeText = /** @class */ (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
    }
    return CodeText;
}());
export { CodeText };
var EmbeddedCode = /** @class */ (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
    }
    return EmbeddedCode;
}());
export { EmbeddedCode };
var JSXElement = /** @class */ (function () {
    function JSXElement(tag, properties, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.content = content;
        this.loc = loc;
        this.isHTML = JSXElement.domTag.test(this.tag);
    }
    JSXElement.domTag = /^[a-z][^\.]*$/;
    return JSXElement;
}());
export { JSXElement };
var JSXText = /** @class */ (function () {
    function JSXText(text) {
        this.text = text;
    }
    return JSXText;
}());
export { JSXText };
var JSXComment = /** @class */ (function () {
    function JSXComment(text) {
        this.text = text;
    }
    return JSXComment;
}());
export { JSXComment };
var JSXInsert = /** @class */ (function () {
    function JSXInsert(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return JSXInsert;
}());
export { JSXInsert };
var JSXStaticProperty = /** @class */ (function () {
    function JSXStaticProperty(name, value) {
        this.name = name;
        this.value = value;
    }
    return JSXStaticProperty;
}());
export { JSXStaticProperty };
var JSXDynamicProperty = /** @class */ (function () {
    function JSXDynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
        this.isRef = JSXDynamicProperty.RefNameRx.test(this.name);
        this.isFn = JSXDynamicProperty.FnNameRx.test(this.name);
        this.isStyle = this.name === JSXDynamicProperty.StyleName;
    }
    JSXDynamicProperty.RefName = "ref\\d*";
    JSXDynamicProperty.RefNameRx = new RegExp('^' + JSXDynamicProperty.RefName + "$");
    JSXDynamicProperty.FnName = "fn\\d*";
    JSXDynamicProperty.FnNameRx = new RegExp('^' + JSXDynamicProperty.FnName + "$");
    JSXDynamicProperty.StyleName = "style";
    JSXDynamicProperty.SpecialPropNames = [JSXDynamicProperty.RefName, JSXDynamicProperty.FnName, JSXDynamicProperty.StyleName];
    JSXDynamicProperty.SpecialPropNameRx = new RegExp("^(" + JSXDynamicProperty.SpecialPropNames.join('|') + ")$");
    return JSXDynamicProperty;
}());
export { JSXDynamicProperty };
var JSXSpreadProperty = /** @class */ (function () {
    function JSXSpreadProperty(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return JSXSpreadProperty;
}());
export { JSXSpreadProperty };
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
        return new JSXElement(node.tag, node.properties.map(function (p) { return _this.JSXProperty(p); }), node.content.map(function (c) { return _this.JSXContent(c); }), node.loc);
    },
    JSXProperty: function (node) {
        return node instanceof JSXStaticProperty ? this.JSXStaticProperty(node) :
            node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
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
    }
};
