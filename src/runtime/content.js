define('Html.content', ['Html'], function (Html) {
    var TEXT_NODE = 3;
        
    // value : null | undefined | string | number | boolean | Node | (null | undefined | string | number | boolean | Node)[]
    Html.content = function content(container, value) {
        var t = typeof value;

        if (t === 'string' || t === 'number' || t === 'boolean') {
            node.textContent = value;
        } else if (value === null || value === undefined) {
            node.textContent = '';
        } else if (t === 'function') {
            // TODO: fast path for SArrays
            Html.exec(function () {
                content(container, value());
            });
        } else if (value instanceof Node) {
            insertArray(container, [value]); // TODO: fast path for single node?
        } else if (value instanceof Array) {
            if (value.length === 0) {
                container.textContent = '';
            } else {
                insertArray(container, value);
            }
        } else {
            throw new Error("content must be Node, stringable, or array of same");
        }
    };

    function insertArray(container, array) {
        var children = Array.prototype.slice.call(container.childNodes),
            i = 0, 
            ilen = array.length, 
            j = 0, 
            jlen = children.length, 
            child, 
            value;

        // reconcile common section of arrays
        while (i < ilen && j < jlen) {
            value = array[i];
            child = children[j];

            if (value === child) {
                i++, j++;
            } else if (j < jlen - 1 && value === children[j + 1]) {
                // single deletion
                container.removeChild(child);
                i++, j += 2;
            } else {
                container.insertBefore(value, child);
                i++;
            }
        }

        // delete extra children
        for (; j < jlen; j++) {
            container.removeChild(children[j]);
        }

        // append new children
        for (; i < len; i++) {
            container.appendChild(array[i]);
        }
    }
});
