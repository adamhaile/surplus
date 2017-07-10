import { LOC } from './parse';
import { Path, SiblingPath } from './path';
export declare class CodeTopLevel {
    segments: CodeSegment[];
    constructor(segments: CodeSegment[]);
}
export declare class CodeText {
    readonly text: string;
    readonly loc: LOC;
    constructor(text: string, loc: LOC);
}
export declare type CodeSegment = CodeText | HtmlElement;
export declare class EmbeddedCode {
    readonly segments: CodeSegment[];
    constructor(segments: CodeSegment[]);
}
export declare type HtmlProperty = StaticProperty | DynamicProperty | Mixin;
export declare type HtmlContent = HtmlElement | HtmlComment | HtmlText | HtmlInsert;
export declare class HtmlElement {
    readonly tag: string;
    readonly properties: HtmlProperty[];
    readonly content: HtmlContent[];
    readonly loc: LOC;
    constructor(tag: string, properties: HtmlProperty[], content: HtmlContent[], loc: LOC);
}
export declare class HtmlText {
    readonly text: string;
    constructor(text: string);
}
export declare class HtmlComment {
    readonly text: string;
    constructor(text: string);
}
export declare class HtmlInsert {
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare class StaticProperty {
    readonly name: string;
    readonly value: string;
    constructor(name: string, value: string);
}
export declare class DynamicProperty {
    readonly name: string;
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(name: string, code: EmbeddedCode, loc: LOC);
}
export declare class Mixin {
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare type Node = CodeTopLevel | CodeText | EmbeddedCode | HtmlElement | HtmlText | HtmlComment | HtmlInsert | StaticProperty | DynamicProperty | Mixin;
export interface CodeTopLevelPath extends Path<CodeTopLevel, null> {
}
export interface EmbeddedCodePath extends Path<EmbeddedCode, DynamicPropertyPath | MixinPath | HtmlInsertPath> {
}
export interface HtmlElementPath extends SiblingPath<HtmlElement, CodeText | HtmlContent, CodeTopLevelPath | EmbeddedCodePath | HtmlElementPath> {
}
export interface HtmlInsertPath extends SiblingPath<HtmlInsert, HtmlContent, HtmlElementPath> {
}
export interface CodeTextPath extends SiblingPath<CodeText, CodeSegment, CodeTopLevelPath | EmbeddedCodePath> {
}
export interface HtmlTextPath extends SiblingPath<HtmlText, HtmlContent, HtmlElementPath> {
}
export interface HtmlCommentPath extends SiblingPath<HtmlComment, HtmlContent, HtmlElementPath> {
}
export interface StaticPropertyPath extends SiblingPath<StaticProperty, HtmlProperty, HtmlElementPath> {
}
export interface DynamicPropertyPath extends SiblingPath<DynamicProperty, HtmlProperty, HtmlElementPath> {
}
export interface MixinPath extends SiblingPath<Mixin, HtmlProperty, HtmlElementPath> {
}
export declare const Copy: {
    CodeTopLevel(node: CodeTopLevel): CodeTopLevel;
    CodeSegment(ctx: Path<CodeTopLevel | EmbeddedCode, any>): (n: CodeSegment, i: number, a: CodeSegment[]) => CodeSegment;
    EmbeddedCode(ctx: EmbeddedCodePath): EmbeddedCode;
    HtmlElement(ctx: HtmlElementPath): HtmlElement;
    HtmlProperty(ctx: HtmlElementPath): (n: StaticProperty | DynamicProperty | Mixin, i: number, a: (StaticProperty | DynamicProperty | Mixin)[]) => StaticProperty | DynamicProperty | Mixin;
    HtmlContent(ctx: HtmlElementPath): (n: HtmlElement | HtmlInsert | HtmlComment | HtmlText, i: number, a: (HtmlElement | HtmlInsert | HtmlComment | HtmlText)[]) => HtmlElement | HtmlInsert | HtmlComment | HtmlText;
    HtmlInsert(ctx: HtmlInsertPath): HtmlInsert;
    CodeText(ctx: CodeTextPath): CodeText;
    HtmlText(ctx: HtmlTextPath): HtmlText;
    HtmlComment(ctx: HtmlCommentPath): HtmlComment;
    StaticProperty(ctx: StaticPropertyPath): StaticProperty;
    DynamicProperty(ctx: DynamicPropertyPath): DynamicProperty;
    Mixin(ctx: MixinPath): Mixin;
};
export declare type Copy = typeof Copy;
