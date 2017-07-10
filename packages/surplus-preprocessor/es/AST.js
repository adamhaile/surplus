var CodeTopLevel = (function () {
    function CodeTopLevel(segments) {
        this.segments = segments;
    }
    return CodeTopLevel;
}());
export { CodeTopLevel };
var CodeText = (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
    }
    return CodeText;
}());
export { CodeText };
var EmbeddedCode = (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
    }
    return EmbeddedCode;
}());
export { EmbeddedCode };
var HtmlElement = (function () {
    function HtmlElement(tag, properties, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.content = content;
        this.loc = loc;
    }
    return HtmlElement;
}());
export { HtmlElement };
var HtmlText = (function () {
    function HtmlText(text) {
        this.text = text;
    }
    return HtmlText;
}());
export { HtmlText };
var HtmlComment = (function () {
    function HtmlComment(text) {
        this.text = text;
    }
    return HtmlComment;
}());
export { HtmlComment };
var HtmlInsert = (function () {
    function HtmlInsert(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return HtmlInsert;
}());
export { HtmlInsert };
var StaticProperty = (function () {
    function StaticProperty(name, value) {
        this.name = name;
        this.value = value;
    }
    return StaticProperty;
}());
export { StaticProperty };
var DynamicProperty = (function () {
    function DynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
    }
    return DynamicProperty;
}());
export { DynamicProperty };
var Mixin = (function () {
    function Mixin(code, loc) {
        this.code = code;
        this.loc = loc;
    }
    return Mixin;
}());
export { Mixin };
// treeContext type declarations and a Copy transform, for building non-identity transforms on top of
export var Copy = {
    CodeTopLevel: function (node) {
        return new CodeTopLevel(this.CodeSegments(node.segments));
    },
    CodeSegments: function (segments) {
        var _this = this;
        return segments.map(function (node) { return node instanceof CodeText ? _this.CodeText(node) : _this.HtmlElement(node); });
    },
    EmbeddedCode: function (node) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    HtmlElement: function (node) {
        var _this = this;
        return new HtmlElement(node.tag, node.properties.map(function (p) {
            return p instanceof StaticProperty ? _this.StaticProperty(p) :
                p instanceof DynamicProperty ? _this.DynamicProperty(p) :
                    _this.Mixin(p);
        }), node.content.map(function (c) {
            return c instanceof HtmlComment ? _this.HtmlComment(c) :
                c instanceof HtmlText ? _this.HtmlText(c) :
                    c instanceof HtmlInsert ? _this.HtmlInsert(c) :
                        _this.HtmlElement(c);
        }), node.loc);
    },
    HtmlInsert: function (node) {
        return new HtmlInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText: function (node) { return node; },
    HtmlText: function (node) { return node; },
    HtmlComment: function (node) { return node; },
    StaticProperty: function (node) { return node; },
    DynamicProperty: function (node) {
        return new DynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    Mixin: function (node) {
        return new Mixin(this.EmbeddedCode(node.code), node.loc);
    }
};
