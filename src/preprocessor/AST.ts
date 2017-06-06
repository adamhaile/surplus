import { Params } from './preprocess';
import { IShimmable, Context } from './shims';
import { ICodeGenerator, IStatementGenerator, CodeBlock } from './genCode';
import { LOC } from './parse';

export abstract class ASTCodeNode implements ICodeGenerator, IShimmable {
    shim(ctx? : Context) { }
    genCode(params : Params, prior? : string) { return ""; };
}

export abstract class ASTStatementNode implements IStatementGenerator, IShimmable {
    shim(ctx? : Context) { }    
    genDOMStatements(opts : Params, code : CodeBlock, parent : string | null, n : number) : string | void { }
}

export class CodeTopLevel extends ASTCodeNode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { super(); }
}

export class CodeText extends ASTCodeNode {
    constructor(
        public text : string, 
        public loc : LOC
    ) { super(); }
}

export class EmbeddedCode extends ASTCodeNode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { super(); }
}

export class HtmlElement extends ASTCodeNode implements IStatementGenerator {
    constructor(
        public tag : string, 
        public properties : (StaticProperty | DynamicProperty | Mixin)[], 
        public content : (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[],
        public loc : LOC
    ) { super(); }    
    genDOMStatements(opts : Params, code : CodeBlock, parent : string | null, n : number) : string | void { }
}

export class HtmlText extends ASTStatementNode {
    constructor(
        public text : string
    ) { super(); }
}

export class HtmlComment extends ASTStatementNode {
    constructor(
        public text : string
    ) { super(); }
}

export class HtmlInsert extends ASTStatementNode {
    constructor(
        public code : EmbeddedCode,
        public loc : LOC
    ) { super(); }
}

export class StaticProperty extends ASTStatementNode {
    constructor(
        public name : string, 
        public value : string
    ) { super(); }
}

export class DynamicProperty extends ASTStatementNode {
    constructor(
        public name : string, 
        public code : EmbeddedCode,
        public loc : LOC
    ) { super(); }
}

export class Mixin extends ASTStatementNode {
    constructor(
        public code : EmbeddedCode,
        public loc : LOC
    ) { super(); }
}
