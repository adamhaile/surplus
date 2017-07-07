import { tokenize } from './tokenize';
import { parse } from './parse';
import { transform } from './transform';
import { compile } from './compile';
import * as sourcemap from './sourcemap';

export interface Options {
    sourcemap?  : 'extract' | 'append' | null,
    sourcefile? : string,
    targetfile? : string,
    jsx?        : boolean
}

export interface Params {
    sourcemap  : 'extract' | 'append' | null,
    sourcefile : string,
    targetfile : string,
    jsx        : boolean;
}

export function preprocess(str : string, opts : Options) {
    opts = opts || {};
    const params = {
        sourcemap:  opts.sourcemap || null,
        sourcefile: opts.sourcefile || 'in.js',
        targetfile: opts.targetfile || 'out.js',
        jsx:        'jsx' in opts ? opts.jsx : true
    } as Params;

    const toks = tokenize(str, params),
        ast = parse(toks, params),
        ast2 = transform(ast, params),
        code = compile(ast2, params),
        out = params.sourcemap === 'extract' ? sourcemap.extractMap(code, str, params) :
              params.sourcemap === 'append'  ? sourcemap.appendMap(code, str, params) :
              code;

    return out;
}
