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
var Path = (function () {
    function Path(node, parent) {
        this.node = node;
        this.parent = parent;
    }
    Path.prototype.child = function (node) { return new Path(node, this); };
    Path.prototype.sibling = function (node, i, siblings) { return new SiblingPath(node, i, siblings, this); };
    Path.prototype.swap = function (node) { return new Path(node, this.parent); };
    return Path;
}());
export { Path };
var SiblingPath = (function (_super) {
    __extends(SiblingPath, _super);
    function SiblingPath(node, index, siblings, parent) {
        var _this = _super.call(this, node, parent) || this;
        _this.index = index;
        _this.siblings = siblings;
        return _this;
    }
    SiblingPath.prototype.swap = function (node) { return new SiblingPath(node, this.index, this.siblings, this.parent); };
    return SiblingPath;
}(Path));
export { SiblingPath };
