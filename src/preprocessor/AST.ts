import { Params } from './preprocess';
import { LOC } from './parse';

export class CodeTopLevel {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { }
}

export class CodeText { 
    constructor(
        public text : string, 
        public loc : LOC
    ) { }
}

export class EmbeddedCode {
    constructor(
        public segments : (CodeText | HtmlElement)[]
    ) { }
}

export class HtmlElement {
    constructor(
        public tag : string, 
        public properties : (StaticProperty | DynamicProperty | Mixin)[], 
        public content : (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[],
        public loc : LOC
    ) { }    
}

export class HtmlText {
    constructor(
        public text : string
    ) { }
}

export class HtmlComment {
    constructor(
        public text : string
    ) { }
}

export class HtmlInsert {
    constructor(
        public code : EmbeddedCode,
        public loc : LOC
    ) { }
}

export class StaticProperty {
    constructor(
        public name : string, 
        public value : string
    ) { }
}

export class DynamicProperty {
    constructor(
        public name : string, 
        public code : EmbeddedCode,
        public loc : LOC
    ) { }
}

export class Mixin {
    constructor(
        public code : EmbeddedCode,
        public loc : LOC
    ) { }
}

export type  Node = CodeTopLevel | CodeText | EmbeddedCode | HtmlElement | HtmlText | HtmlComment | HtmlInsert | StaticProperty | DynamicProperty | Mixin;
