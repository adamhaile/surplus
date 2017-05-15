import { Params } from './preprocess';
export interface ICodeGenerator {
    genCode(opts: Params, prior?: string): string;
}
export interface IStatementGenerator {
    genDOMStatements(opts: Params, code: CodeBlock, parent: string, n: number): string | void;
}
export declare class CodeBlock {
    ids: string[];
    inits: string[];
    exes: string[];
    id(id: string): string;
    init(stmt: string): string;
    exe(stmt: string): string;
    toCode(expr: string, indent: string): string;
}
