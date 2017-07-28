import { Program } from './AST';
import { Params } from './preprocess';
export { compile, codeStr };
declare const compile: (ctl: Program, opts: Params) => string;
declare const codeStr: (str: string) => string;
