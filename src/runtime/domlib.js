// internal cross-browser library of required DOM functions
define('domlib', [], function () {
    // default (conformant) implementations
    var domlib = {
        addEventListener: function addEventListener(node, event, fn) {
            node.addEventListener(event, fn, false);
        },

        removeEventListener: function removeEventListener(node, event, fn) {
            node.removeEventListener(event, fn);
        },

        classListContains: function (el, name) {
            return el.classList.contains(name);
        },

        classListAdd: function (el, name) {
            return el.classList.add(name);
        },

        classListRemove: function (el, name) {
            return el.classList.remove(name);
        },
        
        isContentEditable: function (el) {
            return el.isContentEditable;
        },
        
        isAttachedToDocument: function (el) {
            return (document.compareDocumentPosition(el) & 1) === 0;
        }
    };
    
    // shims for broken and/or older browsers
    if (!browserSetsIsContentEditablePropertyReliably())
        useContentEditableAttribute();
    
    return domlib;
    
    // Element.isContentEditable is currently broken on Chrome.  It returns false for non-displayed elements. See https://code.google.com/p/chromium/issues/detail?id=313082 .
    function browserSetsIsContentEditablePropertyReliably() {
        var div = document.createElement("div");
        div.innerHTML = '<div contentEditable="true"></div>';
        return div.children[0].isContentEditable === true;
    }
    
    function useContentEditableAttribute() {
        domlib.isContentEditable = function (el) {
            var contentEditable = el.getAttribute("contentEditable");
            return contentEditable === "true" || contentEditable === "";
        }
    }
});
