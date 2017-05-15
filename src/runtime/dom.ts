export function createElement(tag : string) {
    return document.createElement(tag);
}

export function createComment(text : string) {
    return document.createComment(text);
}

export function createTextNode(text : string) {
    return document.createTextNode(text);
}

export function appendChild(parent : Node, child : Node) {
    parent.appendChild(child);
}
