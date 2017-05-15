var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ASTCodeNode = (function () {
    function ASTCodeNode() {
    }
    ASTCodeNode.prototype.shim = function (ctx) { };
    ASTCodeNode.prototype.genCode = function (params, prior) { return ""; };
    ;
    return ASTCodeNode;
}());
export { ASTCodeNode };
var ASTStatementNode = (function () {
    function ASTStatementNode() {
    }
    ASTStatementNode.prototype.shim = function (ctx) { };
    ASTStatementNode.prototype.genDOMStatements = function (opts, code, parent, n) { };
    return ASTStatementNode;
}());
export { ASTStatementNode };
var CodeTopLevel = (function (_super) {
    __extends(CodeTopLevel, _super);
    function CodeTopLevel(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return CodeTopLevel;
}(ASTCodeNode));
export { CodeTopLevel };
var CodeText = (function (_super) {
    __extends(CodeText, _super);
    function CodeText(text, loc) {
        var _this = _super.call(this) || this;
        _this.text = text;
        _this.loc = loc;
        return _this;
    }
    return CodeText;
}(ASTCodeNode));
export { CodeText };
var EmbeddedCode = (function (_super) {
    __extends(EmbeddedCode, _super);
    function EmbeddedCode(segments) {
        var _this = _super.call(this) || this;
        _this.segments = segments;
        return _this;
    }
    return EmbeddedCode;
}(ASTCodeNode));
export { EmbeddedCode };
var HtmlElement = (function (_super) {
    __extends(HtmlElement, _super);
    function HtmlElement(tag, properties, content) {
        var _this = _super.call(this) || this;
        _this.tag = tag;
        _this.properties = properties;
        _this.content = content;
        return _this;
    }
    HtmlElement.prototype.genDOMStatements = function (opts, code, parent, n) { };
    return HtmlElement;
}(ASTCodeNode));
export { HtmlElement };
var HtmlText = (function (_super) {
    __extends(HtmlText, _super);
    function HtmlText(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlText;
}(ASTStatementNode));
export { HtmlText };
var HtmlComment = (function (_super) {
    __extends(HtmlComment, _super);
    function HtmlComment(text) {
        var _this = _super.call(this) || this;
        _this.text = text;
        return _this;
    }
    return HtmlComment;
}(ASTStatementNode));
export { HtmlComment };
var HtmlInsert = (function (_super) {
    __extends(HtmlInsert, _super);
    function HtmlInsert(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return HtmlInsert;
}(ASTStatementNode));
export { HtmlInsert };
var StaticProperty = (function (_super) {
    __extends(StaticProperty, _super);
    function StaticProperty(name, value) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.value = value;
        return _this;
    }
    return StaticProperty;
}(ASTStatementNode));
export { StaticProperty };
var DynamicProperty = (function (_super) {
    __extends(DynamicProperty, _super);
    function DynamicProperty(name, code) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.code = code;
        return _this;
    }
    return DynamicProperty;
}(ASTStatementNode));
export { DynamicProperty };
var Mixin = (function (_super) {
    __extends(Mixin, _super);
    function Mixin(code) {
        var _this = _super.call(this) || this;
        _this.code = code;
        return _this;
    }
    return Mixin;
}(ASTStatementNode));
export { Mixin };
