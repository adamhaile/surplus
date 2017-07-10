export function createRootElement(tag) {
    return document.createElement(tag);
}
export function createElement(tag, parent) {
    var el = document.createElement(tag);
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
