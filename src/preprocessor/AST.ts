import { Params } from './preprocess';
import { Context } from './shims';

export abstract class ASTNode {
    shim(ctx? : Context) { }
    genCode(params : Params) { return ""; };
}

export class CodeTopLevel extends ASTNode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { super(); }
}

export class CodeText extends ASTNode {
    constructor(
        public text : string, 
        public loc : { line: number, col : number }
    ) { super(); }
}

export class EmbeddedCode extends ASTNode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { super(); }
}

export class HtmlElement extends ASTNode {
    constructor(
        public tag : string, 
        public properties : (StaticProperty | DynamicProperty | Mixin)[], 
        public content : (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[]
    ) { super(); }
}

export class HtmlText extends ASTNode {
    constructor(
        public text : string
    ) { super(); }
}

export class HtmlComment extends ASTNode {
    constructor(
        public text : string
    ) { super(); }
}

export class HtmlInsert extends ASTNode {
    constructor(
        public code : EmbeddedCode
    ) { super(); }
}

export class StaticProperty extends ASTNode {
    constructor(
        public name : string, 
        public value : string
    ) { super(); }
}

export class DynamicProperty extends ASTNode {
    constructor(
        public name : string, 
        public code : EmbeddedCode
    ) { super(); }
}

export class Mixin extends ASTNode {
    constructor(
        public code : EmbeddedCode
    ) { super(); }
}
