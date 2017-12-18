import * as AST from './AST';
import { Params } from './compile';
export declare const transform: (node: AST.Program, opt: Params) => {
    type: "Program";
    segments: AST.CodeSegment[];
};
