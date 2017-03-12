define('Html.insert', ['Html'], function (Html) {
    var DOCUMENT_FRAGMENT_NODE = 11,
        TEXT_NODE = 3;
        
    Html.insert = function insert(range, value) {
        var parent = range.start.parentNode, 
            test = range.start,
            good = null,
            t = typeof value;

        //if (parent === null) {
        //    throw new Error("Html.insert() can only be used on a node that has a parent node. \n"
        //        + "Node ``" + range.start + "'' is currently unattached to a parent.");
        //}

        //if (range.end.parentNode !== parent) {
        //    throw new Error("Html.insert() requires that the inserted nodes remain sibilings \n"
        //        + "of the original node.  The DOM has been modified such that this is \n"
        //        + "no longer the case.");
        //}

        if (t === 'string' || t === 'number' || t === 'boolean') {
            if (test.nodeType === TEXT_NODE) {
                test.data = value;
                good = test;
            } else {
                value = document.createTextNode(value);
                parent.replaceChild(value, test);
                if (range.end === test) range.end = value;
                range.start = good = value;
            }
        } else if (value instanceof Node) {
            if (test !== value) {
                parent.replaceChild(value, test);
                if (range.end === test) range.end = value;
                range.start = value;
            }
            good = value;
        } else if (value instanceof Array) {
            insertArray(value);
        } else if (value instanceof Function) {
            Html.exec(function () {
                insert(range, value());
            });
            good = range.end;
        } else if (value !== null && value !== undefined) {
            value = value.toString();

            if (test.nodeType === TEXT_NODE) {
                test.data = value;
                good = test;
            } else {
                value = document.createTextNode(value);
                parent.replaceChild(value, test);
                if (range.end === test) range.end = value;
                range.start = good = value;
            }
        }

        if (good === null) {
            if (range.start === parent.firstChild && range.end === parent.lastChild && range.start !== range.end) {
                // fast delete entire contents
                parent.textContent = "";
                value = document.createTextNode("");
                parent.appendChild(value);
                good = range.start = range.end = value;
            } else if (test.nodeType === TEXT_NODE) {
                test.data = "";
                good = test;
            } else {
                value = document.createTextNode("");
                parent.replaceChild(value, test);
                if (range.end === test) range.end = value;
                range.start = good = value;
            }
        }

        // remove anything left after the good cursor from the insert range
        while (good !== range.end) {
            test = range.end;
            range.end = test.previousSibling;
            parent.removeChild(test);
        }

        return range;

        function insertArray(array) {
            for (var i = 0, len = array.length; i < len; i++) {
                var value = array[i];
                if (good === range.end) {
                    if (value instanceof Node) {
                        good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                    } else if (value instanceof Array) {
                        insertArray(value);
                    } else if (value !== null && value !== undefined) {
                        value = document.createTextNode(value.toString());
                        good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                    }
                } else {
                    if (value instanceof Node) {
                        if (test !== value) {
                            if (good === null) {
                                parent.replaceChild(value, test);
                                range.start = value;
                                if (range.end === test) range.end = value;
                                test = value.nextSibling;
                            } else {
                                if (test.nextSibling === value && test !== value.nextSibling && test !== range.end) {
                                    parent.removeChild(test);
                                    test = value.nextSibling;
                                } else {
                                    parent.insertBefore(value, test);
                                }
                            }
                        } else {
                            test = test.nextSibling;
                        }
                        good = value;
                    } else if (value instanceof Array) {
                        insertArray(value);
                    } else if (value !== null && value !== undefined) {
                        value = value.toString();

                        if (test.nodeType === TEXT_NODE) {
                            test.data = value;
                            if (good === null) range.start = test;
                            good = test, test = good.nextSibling;;
                        } else {
                            value = document.createTextNode(value);
                            parent.insertBefore(value, test);
                            if (good === null) range.start = value;
                            good = value;
                        }
                    }
                }
            }
        }
    };
});
