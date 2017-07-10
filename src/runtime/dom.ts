export function createRootElement(tag : string) {
    return document.createElement(tag);
}

export function createElement(tag : string, parent : HTMLElement) {
    var el = document.createElement(tag);
    parent.appendChild(el);
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
