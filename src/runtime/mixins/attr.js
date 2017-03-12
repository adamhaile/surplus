define('Html.attr', ['Html'], function (Html) {
    Html.attr = function attr(name, value) {
        return function attr(node) {
            node.setAttribute(name, value);
        };
    };
});
