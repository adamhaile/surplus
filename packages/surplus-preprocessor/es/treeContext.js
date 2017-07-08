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
var Context = (function () {
    function Context(node) {
        this.node = node;
    }
    Context.prototype.child = function (node) { return new Child(node, this); };
    Context.prototype.sibling = function (node, i, siblings) { return new Sibling(node, i, siblings, this); };
    return Context;
}());
export { Context };
var Root = (function (_super) {
    __extends(Root, _super);
    function Root() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Root;
}(Context));
export { Root };
var Child = (function (_super) {
    __extends(Child, _super);
    function Child(node, parent) {
        var _this = _super.call(this, node) || this;
        _this.parent = parent;
        return _this;
    }
    Child.prototype.swap = function (node) { return new Child(node, this.parent); };
    return Child;
}(Context));
export { Child };
var Sibling = (function (_super) {
    __extends(Sibling, _super);
    function Sibling(node, index, siblings, parent) {
        var _this = _super.call(this, node) || this;
        _this.index = index;
        _this.siblings = siblings;
        _this.parent = parent;
        return _this;
    }
    Sibling.prototype.swap = function (node) { return new Sibling(node, this.index, this.siblings, this.parent); };
    return Sibling;
}(Context));
export { Sibling };
