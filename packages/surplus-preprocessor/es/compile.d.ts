import { CodeTopLevel } from './AST';
import { Params } from './preprocess';
export { compile };
declare const compile: (node: CodeTopLevel, opts: Params) => string;
