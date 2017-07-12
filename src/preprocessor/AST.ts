import { LOC } from './parse';

export class CodeTopLevel {
    constructor(
        public segments : CodeSegment[]
    ) { }
}

export class CodeText { 
    constructor(
        public readonly text : string, 
        public readonly loc : LOC
    ) { }
}

export type CodeSegment = CodeText | HtmlElement;

export class EmbeddedCode {
    constructor(
        public readonly segments : CodeSegment[]
    ) { }
}

export type HtmlProperty = StaticProperty | DynamicProperty | Mixin;
export type HtmlContent = HtmlElement | HtmlComment | HtmlText | HtmlInsert;

export class HtmlElement {
    constructor(
        public readonly tag : string, 
        public readonly properties : HtmlProperty[], 
        public readonly content : HtmlContent[],
        public readonly loc : LOC
    ) { }    
}

export class HtmlText {
    constructor(
        public readonly text : string
    ) { }
}

export class HtmlComment {
    constructor(
        public readonly text : string
    ) { }
}

export class HtmlInsert {
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class StaticProperty {
    constructor(
        public readonly name : string, 
        public readonly value : string
    ) { }
}

export class DynamicProperty {
    constructor(
        public readonly name : string, 
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class Mixin {
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export type Node = CodeTopLevel | CodeText | EmbeddedCode | HtmlElement | HtmlText | HtmlComment | HtmlInsert | StaticProperty | DynamicProperty | Mixin;

// a Copy transform, for building non-identity transforms on top of
export const Copy = {
    CodeTopLevel(node : CodeTopLevel) {
        return new CodeTopLevel(this.CodeSegments(node.segments));
    },
    CodeSegments(segments : CodeSegment[]) {
        return segments.map(node => node instanceof CodeText ? this.CodeText(node) : this.HtmlElement(node));
    },
    EmbeddedCode(node : EmbeddedCode) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    HtmlElement(node : HtmlElement) : HtmlElement {
        return new HtmlElement(node.tag, 
            node.properties.map(p => 
                p instanceof StaticProperty  ? this.StaticProperty(p) :
                p instanceof DynamicProperty ? this.DynamicProperty(p) :
                this.Mixin(p)), 
            node.content.map(c => 
                c instanceof HtmlComment ? this.HtmlComment(c) :
                c instanceof HtmlText    ? this.HtmlText(c) :
                c instanceof HtmlInsert  ? this.HtmlInsert(c) :
                this.HtmlElement(c)), 
            node.loc
        );
    },
    HtmlInsert(node : HtmlInsert) {
        return new HtmlInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText(node : CodeText) { return node; },
    HtmlText(node : HtmlText) { return node; },
    HtmlComment(node : HtmlComment) { return node; },
    StaticProperty(node : StaticProperty) { return node; },
    DynamicProperty(node : DynamicProperty) {
        return new DynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    Mixin(node : Mixin) {
        return new Mixin(this.EmbeddedCode(node.code), node.loc);
    }
};

export type Copy = typeof Copy;
