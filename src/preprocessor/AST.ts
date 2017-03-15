import { Params } from './preprocess';
import { IShimmable, Context } from './shims';
import { ICodeGenerator, IStatementGenerator } from './genCode';

export abstract class ASTCodeNode implements ICodeGenerator, IShimmable {
    shim(ctx? : Context) { }
    genCode(params : Params, prior? : string) { return ""; };
}

export abstract class ASTStatementNode implements IStatementGenerator, IShimmable {
    shim(ctx? : Context) { }    
    genDOMStatements(opts : Params, ids : string[], inits : string[], exes : string[], parent : string, n : number) { }
}

export class CodeTopLevel extends ASTCodeNode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { super(); }
}

export class CodeText extends ASTCodeNode {
    constructor(
        public text : string, 
        public loc : { line: number, col : number }
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
        public content : (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[]
    ) { super(); }    
    genDOMStatements(opts : Params, ids : string[], inits : string[], exes : string[], parent : string, n : number) { }
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
        public code : EmbeddedCode
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
        public code : EmbeddedCode
    ) { super(); }
}

export class Mixin extends ASTStatementNode {
    constructor(
        public code : EmbeddedCode
    ) { super(); }
}
