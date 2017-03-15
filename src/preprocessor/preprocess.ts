import { tokenize } from './tokenize';
import { parse } from './parse';
import { shimmed } from './shims';
import * as sourcemap from './sourcemap';

export interface Options {
    symbol? : string,
    sourcemap? : 'extract' | 'append' | null,
    jsx? : boolean
}

export interface Params {
    symbol : string;
    sourcemap: 'extra' | 'append' | null,
    jsx: boolean;
}

export function preprocess(str : string, opts : Options) {
    opts = opts || {};
    var params = {
        symbol:    opts.symbol    || 'Surplus',
        sourcemap: opts.sourcemap || null,
        jsx:       opts.jsx       || false
    } as Params;

    var toks = tokenize(str, params),
        ast = parse(toks, params);

    if (shimmed) ast.shim();

    var code = ast.genCode(params),
        out;

    if (opts.sourcemap === 'extract') out = sourcemap.extractMap(code, str, params);
    else if (opts.sourcemap === 'append') out = sourcemap.appendMap(code, str, params);
    else out = code;

    return out;
}
