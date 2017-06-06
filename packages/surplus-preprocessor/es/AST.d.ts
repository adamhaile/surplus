import { Params } from './preprocess';
import { IShimmable, Context } from './shims';
import { ICodeGenerator, IStatementGenerator, CodeBlock } from './genCode';
import { LOC } from './parse';
export declare abstract class ASTCodeNode implements ICodeGenerator, IShimmable {
    shim(ctx?: Context): void;
    genCode(params: Params, prior?: string): string;
}
export declare abstract class ASTStatementNode implements IStatementGenerator, IShimmable {
    shim(ctx?: Context): void;
    genDOMStatements(opts: Params, code: CodeBlock, parent: string | null, n: number): string | void;
}
export declare class CodeTopLevel extends ASTCodeNode {
    segments: (CodeText | HtmlElement)[];
    constructor(segments: (CodeText | HtmlElement)[]);
}
export declare class CodeText extends ASTCodeNode {
    text: string;
    loc: LOC;
    constructor(text: string, loc: LOC);
}
export declare class EmbeddedCode extends ASTCodeNode {
    segments: (CodeText | HtmlElement)[];
    constructor(segments: (CodeText | HtmlElement)[]);
}
export declare class HtmlElement extends ASTCodeNode implements IStatementGenerator {
    tag: string;
    properties: (StaticProperty | DynamicProperty | Mixin)[];
    content: (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[];
    loc: LOC;
    constructor(tag: string, properties: (StaticProperty | DynamicProperty | Mixin)[], content: (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[], loc: LOC);
    genDOMStatements(opts: Params, code: CodeBlock, parent: string | null, n: number): string | void;
}
export declare class HtmlText extends ASTStatementNode {
    text: string;
    constructor(text: string);
}
export declare class HtmlComment extends ASTStatementNode {
    text: string;
    constructor(text: string);
}
export declare class HtmlInsert extends ASTStatementNode {
    code: EmbeddedCode;
    loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare class StaticProperty extends ASTStatementNode {
    name: string;
    value: string;
    constructor(name: string, value: string);
}
export declare class DynamicProperty extends ASTStatementNode {
    name: string;
    code: EmbeddedCode;
    loc: LOC;
    constructor(name: string, code: EmbeddedCode, loc: LOC);
}
export declare class Mixin extends ASTStatementNode {
    code: EmbeddedCode;
    loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
