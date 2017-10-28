import { LOC } from './parse';
export declare class Program {
    segments: CodeSegment[];
    constructor(segments: CodeSegment[]);
}
export declare type CodeSegment = CodeText | JSXElement;
export declare class CodeText {
    readonly text: string;
    readonly loc: LOC;
    constructor(text: string, loc: LOC);
}
export declare class EmbeddedCode {
    readonly segments: CodeSegment[];
    constructor(segments: CodeSegment[]);
}
export declare type JSXProperty = JSXStaticProperty | JSXDynamicProperty | JSXSpreadProperty;
export declare type JSXContent = JSXElement | JSXComment | JSXText | JSXInsert;
export declare class JSXElement {
    readonly tag: string;
    readonly properties: JSXProperty[];
    readonly content: JSXContent[];
    readonly loc: LOC;
    constructor(tag: string, properties: JSXProperty[], content: JSXContent[], loc: LOC);
    private static domTag;
    isHTML: boolean;
}
export declare class JSXText {
    readonly text: string;
    constructor(text: string);
}
export declare class JSXComment {
    readonly text: string;
    constructor(text: string);
}
export declare class JSXInsert {
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare class JSXStaticProperty {
    readonly name: string;
    readonly value: string;
    constructor(name: string, value: string);
}
export declare class JSXDynamicProperty {
    readonly name: string;
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(name: string, code: EmbeddedCode, loc: LOC);
    private static RefName;
    private static RefNameRx;
    isRef: boolean;
    private static FnName;
    private static FnNameRx;
    isFn: boolean;
    private static StyleName;
    isStyle: boolean;
    static SpecialPropNames: string[];
    static SpecialPropNameRx: RegExp;
}
export declare class JSXSpreadProperty {
    readonly code: EmbeddedCode;
    readonly loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare const Copy: {
    Program(node: Program): Program;
    CodeSegments(segments: CodeSegment[]): CodeSegment[];
    EmbeddedCode(node: EmbeddedCode): EmbeddedCode;
    JSXElement(node: JSXElement): JSXElement;
    JSXProperty(node: JSXProperty): JSXStaticProperty | JSXSpreadProperty;
    JSXContent(node: JSXContent): JSXElement | JSXText | JSXInsert;
    JSXInsert(node: JSXInsert): JSXInsert;
    CodeText(node: CodeText): CodeText;
    JSXText(node: JSXText): JSXText;
    JSXComment(node: JSXComment): JSXComment;
    JSXStaticProperty(node: JSXStaticProperty): JSXStaticProperty;
    JSXDynamicProperty(node: JSXDynamicProperty): JSXDynamicProperty;
    JSXSpreadProperty(node: JSXSpreadProperty): JSXSpreadProperty;
};
export declare type Copy = typeof Copy;
