const extend =
    'assign' in Object ? (Object as any).assign :
    function (a : { [prop : string] : any }, b : { [prop : string] : any }) {
        for (var p in b) if (b.hasOwnProperty(p)) a[p] = b[p];
    };

export function subcomponent<T, U>(fn : (props : T) => U, params : (Partial<T> | ((res : U) => void))[]) : U {
    var props = params[0] as T, // compiler guarantees that first item is a property object, not a mixin
        param : Partial<T> | ((res : U) => void),
        result : U,
        i : number;

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

