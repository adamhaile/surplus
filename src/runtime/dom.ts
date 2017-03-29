export function createElement(tag : string) {
    return document.createElement(tag);
}

export function createComment(text : string) {
    return document.createComment(text);
}

export function createText(text : string) {
    return document.createTextNode(text);
}

export function appendNode(parent : Node, child : Node) {
    parent.appendChild(child);
}
