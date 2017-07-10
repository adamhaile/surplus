import { Path } from './path';
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
;
;
;
;
;
;
;
;
;
;
export var Copy = {
    CodeTopLevel: function (node) {
        return new CodeTopLevel(node.segments.map(this.CodeSegment(new Path(node, null))));
    },
    CodeSegment: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof CodeText ? _this.CodeText(ctx.sibling(n, i, a)) :
                _this.HtmlElement(ctx.sibling(n, i, a));
        };
    },
    EmbeddedCode: function (ctx) {
        return new EmbeddedCode(ctx.node.segments.map(this.CodeSegment(ctx)));
    },
    HtmlElement: function (ctx) {
        return new HtmlElement(ctx.node.tag, ctx.node.properties.map(this.HtmlProperty(ctx)), ctx.node.content.map(this.HtmlContent(ctx)), ctx.node.loc);
    },
    HtmlProperty: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof StaticProperty ? _this.StaticProperty(ctx.sibling(n, i, a)) :
                n instanceof DynamicProperty ? _this.DynamicProperty(ctx.sibling(n, i, a)) :
                    _this.Mixin(ctx.sibling(n, i, a));
        };
    },
    HtmlContent: function (ctx) {
        var _this = this;
        return function (n, i, a) {
            return n instanceof HtmlComment ? _this.HtmlComment(ctx.sibling(n, i, a)) :
                n instanceof HtmlText ? _this.HtmlText(ctx.sibling(n, i, a)) :
                    n instanceof HtmlInsert ? _this.HtmlInsert(ctx.sibling(n, i, a)) :
                        _this.HtmlElement(ctx.sibling(n, i, a));
        };
    },
    HtmlInsert: function (ctx) {
        return new HtmlInsert(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    },
    CodeText: function (ctx) { return ctx.node; },
    HtmlText: function (ctx) { return ctx.node; },
    HtmlComment: function (ctx) { return ctx.node; },
    StaticProperty: function (ctx) { return ctx.node; },
    DynamicProperty: function (ctx) {
        return new DynamicProperty(ctx.node.name, this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    },
    Mixin: function (ctx) {
        return new Mixin(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    }
};
