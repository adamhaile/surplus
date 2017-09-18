import { Program } from './AST';
import { Params } from './compile';
export { codeGen, codeStr };
declare const codeGen: (ctl: Program, opts: Params) => string;
declare const codeStr: (str: string) => string;
