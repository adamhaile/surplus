import { Params } from './preprocess';
import { LOC } from './parse';
import { Context, Root, Child, Sibling } from './treeContext';

export class CodeTopLevel {
    constructor(
        public segments : (CodeText | HtmlElement)[]
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

// treeContext type declarations and a Copy transform, for building non-identity transforms on top of

export type CodeSegmentContext     = Context<CodeTopLevel | EmbeddedCode>;
export type EmbeddedCodeContext    = Child<EmbeddedCode, DynamicProperty | Mixin | HtmlInsert>;
export type HtmlElementContext     = Sibling<HtmlElement, CodeText | HtmlContent, CodeTopLevel | EmbeddedCode | HtmlElement>;
export type HtmlInsertContext      = Sibling<HtmlInsert, HtmlContent, HtmlElement>;
export type CodeTextContext        = Sibling<CodeText, CodeSegment, CodeTopLevel | EmbeddedCode>;
export type HtmlTextContext        = Sibling<HtmlText, HtmlContent, HtmlElement>;
export type HtmlCommentContext     = Sibling<HtmlComment, HtmlContent, HtmlElement>;
export type StaticPropertyContext  = Sibling<StaticProperty, HtmlProperty, HtmlElement>;
export type DynamicPropertyContext = Sibling<DynamicProperty, HtmlProperty, HtmlElement>;
export type MixinContext           = Sibling<Mixin, HtmlProperty, HtmlElement>;

export const Copy = {
    CodeTopLevel(node : CodeTopLevel) {
        return new CodeTopLevel(flatten(node.segments.map(this.CodeSegment(new Root(node)))));
    },
    CodeSegment(ctx : CodeSegmentContext) {
        return (n : CodeSegment, i : number, a : CodeSegment[]) : CodeSegment[] => 
            n instanceof CodeText ? this.CodeText(ctx.sibling(n, i, a)) : 
            this.HtmlElement(ctx.sibling(n, i, a));
    },
    EmbeddedCode(ctx : EmbeddedCodeContext) {
        return new EmbeddedCode(flatten(ctx.node.segments.map(this.CodeSegment(ctx))));
    },
    HtmlElement(ctx : HtmlElementContext) : HtmlElement[] {
        return [new HtmlElement(ctx.node.tag, 
            flatten(ctx.node.properties.map(this.HtmlProperty(ctx))), 
            flatten(ctx.node.content.map(this.HtmlContent(ctx))), 
            ctx.node.loc
        )];
    },
    HtmlProperty(ctx : HtmlElementContext) {
        return (n : HtmlProperty, i : number, a : HtmlProperty[]) : HtmlProperty[] =>
            n instanceof StaticProperty ? this.StaticProperty(ctx.sibling(n, i, a)) :
            n instanceof DynamicProperty ? this.DynamicProperty(ctx.sibling(n, i, a)) :
            this.Mixin(ctx.sibling(n, i, a));
    },
    HtmlContent(ctx : HtmlElementContext) {
        return (n : HtmlContent, i : number, a : HtmlContent[]) : HtmlContent[] =>
            n instanceof HtmlComment ? this.HtmlComment(ctx.sibling(n, i, a)) :
            n instanceof HtmlText ? this.HtmlText(ctx.sibling(n, i, a)) :
            n instanceof HtmlInsert ? this.HtmlInsert(ctx.sibling(n, i, a)) :
            this.HtmlElement(ctx.sibling(n, i, a));
    },
    HtmlInsert(ctx : HtmlInsertContext) {
        return [new HtmlInsert(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    },
    CodeText(ctx : CodeTextContext) { return [ctx.node]; },
    HtmlText(ctx : HtmlTextContext) { return [ctx.node]; },
    HtmlComment(ctx : HtmlCommentContext) { return [ctx.node]; },
    StaticProperty(ctx : StaticPropertyContext) { return [ctx.node]; },
    DynamicProperty(ctx : DynamicPropertyContext) {
        return [new DynamicProperty(ctx.node.name, this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    },
    Mixin(ctx : MixinContext) {
        return [new Mixin(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc)];
    }
};

export type Copy = typeof Copy;

const flatten = <T>(aas : T[][]) => aas.reduce((as, a) => as.concat(a), []);

