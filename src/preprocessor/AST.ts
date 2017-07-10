import { Params } from './preprocess';
import { LOC } from './parse';
import { Path, SiblingPath } from './path';

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

// treeContext type declarations and a Copy transform, for building non-identity transforms on top of

export interface CodeTopLevelPath    extends Path<CodeTopLevel, null> {};
export interface EmbeddedCodePath    extends Path<EmbeddedCode, DynamicPropertyPath | MixinPath | HtmlInsertPath> {};
export interface HtmlElementPath     extends SiblingPath<HtmlElement, CodeText | HtmlContent, CodeTopLevelPath | EmbeddedCodePath | HtmlElementPath> {};
export interface HtmlInsertPath      extends SiblingPath<HtmlInsert, HtmlContent, HtmlElementPath> {};
export interface CodeTextPath        extends SiblingPath<CodeText, CodeSegment, CodeTopLevelPath | EmbeddedCodePath> {};
export interface HtmlTextPath        extends SiblingPath<HtmlText, HtmlContent, HtmlElementPath> {};
export interface HtmlCommentPath     extends SiblingPath<HtmlComment, HtmlContent, HtmlElementPath> {};
export interface StaticPropertyPath  extends SiblingPath<StaticProperty, HtmlProperty, HtmlElementPath> {};
export interface DynamicPropertyPath extends SiblingPath<DynamicProperty, HtmlProperty, HtmlElementPath> {};
export interface MixinPath           extends SiblingPath<Mixin, HtmlProperty, HtmlElementPath> {};

export const Copy = {
    CodeTopLevel(node : CodeTopLevel) {
        return new CodeTopLevel(node.segments.map(this.CodeSegment(new Path(node, null))));
    },
    CodeSegment(ctx : Path<CodeTopLevel | EmbeddedCode, any>) {
        return (n : CodeSegment, i : number, a : CodeSegment[]) : CodeSegment => 
            n instanceof CodeText ? this.CodeText(ctx.sibling(n, i, a)) : 
            this.HtmlElement(ctx.sibling(n, i, a));
    },
    EmbeddedCode(ctx : EmbeddedCodePath) {
        return new EmbeddedCode(ctx.node.segments.map(this.CodeSegment(ctx)));
    },
    HtmlElement(ctx : HtmlElementPath) : HtmlElement {
        return new HtmlElement(ctx.node.tag, 
            ctx.node.properties.map(this.HtmlProperty(ctx)), 
            ctx.node.content.map(this.HtmlContent(ctx)), 
            ctx.node.loc
        );
    },
    HtmlProperty(ctx : HtmlElementPath) {
        return (n : HtmlProperty, i : number, a : HtmlProperty[]) : HtmlProperty =>
            n instanceof StaticProperty ? this.StaticProperty(ctx.sibling(n, i, a)) :
            n instanceof DynamicProperty ? this.DynamicProperty(ctx.sibling(n, i, a)) :
            this.Mixin(ctx.sibling(n, i, a));
    },
    HtmlContent(ctx : HtmlElementPath) {
        return (n : HtmlContent, i : number, a : HtmlContent[]) : HtmlContent =>
            n instanceof HtmlComment ? this.HtmlComment(ctx.sibling(n, i, a)) :
            n instanceof HtmlText ? this.HtmlText(ctx.sibling(n, i, a)) :
            n instanceof HtmlInsert ? this.HtmlInsert(ctx.sibling(n, i, a)) :
            this.HtmlElement(ctx.sibling(n, i, a));
    },
    HtmlInsert(ctx : HtmlInsertPath) {
        return new HtmlInsert(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    },
    CodeText(ctx : CodeTextPath) { return ctx.node; },
    HtmlText(ctx : HtmlTextPath) { return ctx.node; },
    HtmlComment(ctx : HtmlCommentPath) { return ctx.node; },
    StaticProperty(ctx : StaticPropertyPath) { return ctx.node; },
    DynamicProperty(ctx : DynamicPropertyPath) {
        return new DynamicProperty(ctx.node.name, this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    },
    Mixin(ctx : MixinPath) {
        return new Mixin(this.EmbeddedCode(ctx.child(ctx.node.code)), ctx.node.loc);
    }
};

export type Copy = typeof Copy;
