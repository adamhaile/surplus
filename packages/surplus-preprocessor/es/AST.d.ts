import { LOC } from './parse';
import { Context, Child, Sibling } from './treeContext';
export declare class CodeTopLevel {
    segments: (CodeText | HtmlElement)[];
    constructor(segments: (CodeText | HtmlElement)[]);
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
export declare type CodeSegmentContext = Context<CodeTopLevel | EmbeddedCode>;
export declare type EmbeddedCodeContext = Child<EmbeddedCode, DynamicProperty | Mixin | HtmlInsert>;
export declare type HtmlElementContext = Sibling<HtmlElement, CodeText | HtmlContent, CodeTopLevel | EmbeddedCode | HtmlElement>;
export declare type HtmlInsertContext = Sibling<HtmlInsert, HtmlContent, HtmlElement>;
export declare type CodeTextContext = Sibling<CodeText, CodeSegment, CodeTopLevel | EmbeddedCode>;
export declare type HtmlTextContext = Sibling<HtmlText, HtmlContent, HtmlElement>;
export declare type HtmlCommentContext = Sibling<HtmlComment, HtmlContent, HtmlElement>;
export declare type StaticPropertyContext = Sibling<StaticProperty, HtmlProperty, HtmlElement>;
export declare type DynamicPropertyContext = Sibling<DynamicProperty, HtmlProperty, HtmlElement>;
export declare type MixinContext = Sibling<Mixin, HtmlProperty, HtmlElement>;
export declare const Copy: {
    CodeTopLevel(node: CodeTopLevel): CodeTopLevel;
    CodeSegment(ctx: Context<CodeTopLevel | EmbeddedCode>): (n: CodeText | HtmlElement, i: number, a: (CodeText | HtmlElement)[]) => (CodeText | HtmlElement)[];
    EmbeddedCode(ctx: Child<EmbeddedCode, DynamicProperty | Mixin | HtmlInsert>): EmbeddedCode;
    HtmlElement(ctx: Sibling<HtmlElement, CodeText | HtmlElement | HtmlInsert | HtmlComment | HtmlText, CodeTopLevel | HtmlElement | EmbeddedCode>): HtmlElement[];
    HtmlProperty(ctx: Sibling<HtmlElement, CodeText | HtmlElement | HtmlInsert | HtmlComment | HtmlText, CodeTopLevel | HtmlElement | EmbeddedCode>): (n: StaticProperty | DynamicProperty | Mixin, i: number, a: (StaticProperty | DynamicProperty | Mixin)[]) => (StaticProperty | DynamicProperty | Mixin)[];
    HtmlContent(ctx: Sibling<HtmlElement, CodeText | HtmlElement | HtmlInsert | HtmlComment | HtmlText, CodeTopLevel | HtmlElement | EmbeddedCode>): (n: HtmlElement | HtmlInsert | HtmlComment | HtmlText, i: number, a: (HtmlElement | HtmlInsert | HtmlComment | HtmlText)[]) => (HtmlElement | HtmlInsert | HtmlComment | HtmlText)[];
    HtmlInsert(ctx: Sibling<HtmlInsert, HtmlElement | HtmlInsert | HtmlComment | HtmlText, HtmlElement>): HtmlInsert[];
    CodeText(ctx: Sibling<CodeText, CodeText | HtmlElement, CodeTopLevel | EmbeddedCode>): CodeText[];
    HtmlText(ctx: Sibling<HtmlText, HtmlElement | HtmlInsert | HtmlComment | HtmlText, HtmlElement>): HtmlText[];
    HtmlComment(ctx: Sibling<HtmlComment, HtmlElement | HtmlInsert | HtmlComment | HtmlText, HtmlElement>): HtmlComment[];
    StaticProperty(ctx: Sibling<StaticProperty, StaticProperty | DynamicProperty | Mixin, HtmlElement>): StaticProperty[];
    DynamicProperty(ctx: Sibling<DynamicProperty, StaticProperty | DynamicProperty | Mixin, HtmlElement>): DynamicProperty[];
    Mixin(ctx: Sibling<Mixin, StaticProperty | DynamicProperty | Mixin, HtmlElement>): Mixin[];
};
export declare type Copy = typeof Copy;
