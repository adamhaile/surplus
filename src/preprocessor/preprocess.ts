import { tokenize } from './tokenize';
import { parse } from './parse';
import { shimmed } from './shims';
import './genCode';
import * as sourcemap from './sourcemap';

export interface Options {
    sourcemap? : 'extract' | 'append' | null,
    sourcefile? : string,
    targetfile? : string,
    jsx?       : boolean
}

export interface Params {
    sourcemap: 'extract' | 'append' | null,
    sourcefile: string,
    targetfile: string,
    jsx: boolean;
}

export function preprocess(str : string, opts : Options) {
    opts = opts || {};
    var params = {
        sourcemap: opts.sourcemap || null,
        sourcefile: opts.sourcefile || 'in.js',
        targetfile: opts.targetfile || 'out.js',
        jsx:       'jsx' in opts ? opts.jsx : true
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
