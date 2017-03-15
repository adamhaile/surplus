define('Surplus.attr', ['Surplus'], function (Surplus) {
    Surplus.attr = function attr(name, value) {
        return function attr(node) {
            node.setAttribute(name, value);
        };
    };
});
