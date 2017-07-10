import { LOC } from './parse';
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
export declare const Copy: {
    CodeTopLevel(node: CodeTopLevel): CodeTopLevel;
    CodeSegments(segments: CodeSegment[]): CodeSegment[];
    EmbeddedCode(node: EmbeddedCode): EmbeddedCode;
    HtmlElement(node: HtmlElement): HtmlElement;
    HtmlInsert(node: HtmlInsert): HtmlInsert;
    CodeText(node: CodeText): CodeText;
    HtmlText(node: HtmlText): HtmlText;
    HtmlComment(node: HtmlComment): HtmlComment;
    StaticProperty(node: StaticProperty): StaticProperty;
    DynamicProperty(node: DynamicProperty): DynamicProperty;
    Mixin(node: Mixin): Mixin;
};
export declare type Copy = typeof Copy;
