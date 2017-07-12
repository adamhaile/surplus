var extend = 'assign' in Object ? Object.assign :
    function (a, b) {
        for (var p in b)
            if (b.hasOwnProperty(p))
                a[p] = b[p];
    };
export function subcomponent(fn, params) {
    var props = params[0], // compiler guarantees that first item is a property object, not a mixin
    param, result, i;
    for (i = 1; i < params.length; i++) {
        param = params[i];
        if (typeof param !== 'function') {
            extend(props, param);
        }
    }
    result = fn(props);
    for (i = 0; i < params.length; i++) {
        param = params[i];
        if (typeof param === 'function') {
            param(result);
        }
    }
    return result;
}
