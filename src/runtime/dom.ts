export function createElement(tag : string, className : string | null, parent : HTMLElement | null) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (parent) parent.appendChild(el);
    return el;
}

export function createComment(text : string, parent : HTMLElement) {
    var comment = document.createComment(text);
    parent.appendChild(comment);
    return comment;
}

export function createTextNode(text : string, parent : HTMLElement) {
    var node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
}
