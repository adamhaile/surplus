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
