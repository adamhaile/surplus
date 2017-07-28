import * as AST from './AST';
import { Params } from './preprocess';
export interface LOC {
    line: number;
    col: number;
    pos: number;
}
export declare function parse(TOKS: string[], opts: Params): AST.Program;
