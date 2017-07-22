export function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (parent)
        parent.appendChild(el);
    return el;
}
export function createComment(text, parent) {
    var comment = document.createComment(text);
    parent.appendChild(comment);
    return comment;
}
export function createTextNode(text, parent) {
    var node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
}
