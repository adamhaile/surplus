import { CodeTopLevel } from './AST';
import { Params } from './preprocess';
export { compile, codeStr };
declare const compile: (node: CodeTopLevel, opts: Params) => string;
declare const codeStr: (str: string) => string;
