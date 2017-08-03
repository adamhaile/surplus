var extend = 'assign' in Object ? Object.assign :
    function (a, b) {
        for (var p in b)
            if (b.hasOwnProperty(p))
                a[p] = b[p];
    };
export function subcomponent(cmp, params, fns) {
    var props = params[0], // compiler guarantees that first item is a property object, not a mixin
    result, i;
    for (i = 1; i < params.length; i++) {
        extend(props, params[i]);
    }
    result = cmp(props);
    if (fns) {
        for (i = 0; i < fns.length; i++) {
            fns[i](result);
        }
    }
    return result;
}
