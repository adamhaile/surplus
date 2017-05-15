import * as AST from './AST';
import { Params } from './preprocess';
export declare type LOC = {
    line: number;
    col: number;
    pos: number;
};
export declare function parse(TOKS: string[], opts: Params): AST.CodeTopLevel;
