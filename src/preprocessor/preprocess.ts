import { tokenize } from './tokenize';
import { parse } from './parse';
import { shimmed } from './shims';
import './genCode';
import * as sourcemap from './sourcemap';

export interface Options {
    exec?      : string,
    sourcemap? : 'extract' | 'append' | null,
    jsx?       : boolean
}

export interface Params {
    exec : string;
    sourcemap: 'extract' | 'append' | null,
    jsx: boolean;
}

export function preprocess(str : string, opts : Options) {
    opts = opts || {};
    var params = {
        exec:      opts.exec    || '',
        sourcemap: opts.sourcemap || null,
        jsx:       opts.jsx       || false
    } as Params;

    var toks = tokenize(str, params),
        ast = parse(toks, params);

    if (shimmed) ast.shim();

    var code = ast.genCode(params),
        out;

    if (params.sourcemap === 'extract') out = sourcemap.extractMap(code, str, params);
    else if (params.sourcemap === 'append') out = sourcemap.appendMap(code, str, params);
    else out = code;

    return out;
}
