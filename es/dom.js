var svgNS = "http://www.w3.org/2000/svg";
export function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (parent)
        parent.appendChild(el);
    return el;
}
export function createSvgElement(tag, className, parent) {
    var el = document.createElementNS(svgNS, tag);
    if (className)
        el.setAttribute("class", className);
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
export function setAttribute(node, name, value) {
    if (value === false || value === null || value === undefined)
        node.removeAttribute(name);
    else
        node.setAttribute(name, value);
}
export function setAttributeNS(node, namespace, name, value) {
    if (value === false || value === null || value === undefined)
        node.removeAttributeNS(namespace, name);
    else
        node.setAttributeNS(namespace, name, value);
}
