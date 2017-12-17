import { LOC } from './parse';

// 'kind' properties are to make sure that Typescript treats each of these as distinct classes
// otherwise, two classes with same props, like the 4 with just code / loc, are treated
// as interchangeable

export class Program {
    kind = 'program' as 'program';
    constructor(
        public segments : CodeSegment[]
    ) { }
}

export type CodeSegment = CodeText | JSXElement;

export class CodeText { 
    kind = 'code' as 'code';
    constructor(
        public readonly text : string, 
        public readonly loc : LOC
    ) { }
}

export class EmbeddedCode {
    kind = 'embeddedcode' as 'embeddedcode';
    constructor(
        public readonly segments : CodeSegment[]
    ) { }
}

export type JSXProperty = JSXStaticProperty | JSXDynamicProperty | JSXStyleProperty | JSXSpreadProperty;
export type JSXContent = JSXElement | JSXComment | JSXText | JSXInsert;

export enum JSXElementRole {
    HTML,
    SVG,
    SubComponent
}

export class JSXElement {
    kind = 'element' as 'element';
    constructor(
        public readonly tag : string, 
        public readonly properties : JSXProperty[], 
        public readonly references : JSXReference[],
        public readonly functions : JSXFunction[],
        public readonly content : JSXContent[],
        public readonly role : JSXElementRole,
        public readonly loc : LOC
    ) { }
}

export class JSXText {
    kind = 'text' as 'text';
    constructor(
        public readonly text : string
    ) { }
}

export class JSXComment {
    kind = 'comment' as 'comment';
    constructor(
        public readonly text : string
    ) { }
}

export class JSXInsert {
    kind = 'insert' as 'insert';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXStaticProperty {
    kind = 'staticprop' as 'staticprop';
    constructor(
        public readonly name : string, 
        public readonly value : string
    ) { }
}

export class JSXDynamicProperty {
    kind = 'dynamicprop' as 'dynamicprop';
    constructor(
        public readonly name : string, 
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXSpreadProperty {
    kind = 'spread' as 'spread';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXStyleProperty {
    kind = 'style' as 'style';
    name = "style";
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXReference {
    kind = 'reference' as 'reference';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXFunction {
    kind = 'function' as 'function';
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

