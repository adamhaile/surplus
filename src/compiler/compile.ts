import { tokenize } from './tokenize';
import { parse } from './parse';
import { transform } from './transform';
import { codeGen } from './codeGen';
import * as sourcemap from './sourcemap';

export interface Options {
    sourcemap?  : 'extract' | 'append' | null,
    sourcefile? : string,
    targetfile? : string
}

export interface Params {
    sourcemap  : 'extract' | 'append' | null,
    sourcefile : string,
    targetfile : string
}

export function compile(str : string, opts? : Options) {
    opts = opts || {};
    const params = {
        sourcemap:  opts.sourcemap || null,
        sourcefile: opts.sourcefile || 'in.js',
        targetfile: opts.targetfile || 'out.js'
    } as Params;

    const toks = tokenize(str, params),
        ast = parse(toks, params),
        ast2 = transform(ast, params),
        code = codeGen(ast2, params),
        out = params.sourcemap === 'extract' ? sourcemap.extractMap(code, str, params) :
              params.sourcemap === 'append'  ? sourcemap.appendMap(code, str, params) :
              code;

    return out;
}
