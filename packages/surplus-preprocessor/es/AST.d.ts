import { LOC } from './parse';
export declare class CodeTopLevel {
    segments: (CodeText | HtmlElement)[];
    constructor(segments: (CodeText | HtmlElement)[]);
}
export declare class CodeText {
    text: string;
    loc: LOC;
    constructor(text: string, loc: LOC);
}
export declare class EmbeddedCode {
    segments: (CodeText | HtmlElement)[];
    constructor(segments: (CodeText | HtmlElement)[]);
}
export declare class HtmlElement {
    tag: string;
    properties: (StaticProperty | DynamicProperty | Mixin)[];
    content: (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[];
    loc: LOC;
    constructor(tag: string, properties: (StaticProperty | DynamicProperty | Mixin)[], content: (HtmlElement | HtmlComment | HtmlText | HtmlInsert)[], loc: LOC);
}
export declare class HtmlText {
    text: string;
    constructor(text: string);
}
export declare class HtmlComment {
    text: string;
    constructor(text: string);
}
export declare class HtmlInsert {
    code: EmbeddedCode;
    loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare class StaticProperty {
    name: string;
    value: string;
    constructor(name: string, value: string);
}
export declare class DynamicProperty {
    name: string;
    code: EmbeddedCode;
    loc: LOC;
    constructor(name: string, code: EmbeddedCode, loc: LOC);
}
export declare class Mixin {
    code: EmbeddedCode;
    loc: LOC;
    constructor(code: EmbeddedCode, loc: LOC);
}
export declare type Node = CodeTopLevel | CodeText | EmbeddedCode | HtmlElement | HtmlText | HtmlComment | HtmlInsert | StaticProperty | DynamicProperty | Mixin;
