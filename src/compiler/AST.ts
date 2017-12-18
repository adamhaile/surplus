import { LOC } from './parse';

// ESTree compliant

export const Program = 'Program' as 'Program';
export interface Program {
    type : typeof Program;
    segments : CodeSegment[];
}

export type CodeSegment = CodeText | JSXElement;

export const CodeText = 'CodeText' as 'CodeText';
export interface CodeText { 
    type : typeof CodeText;
    text : string; 
    loc : LOC;
}

export const EmbeddedCode = 'EmbeddedCode' as 'EmbeddedCode';
export interface EmbeddedCode {
    type : typeof EmbeddedCode;
    segments : CodeSegment[];
}

export type JSXProperty = JSXStaticProperty | JSXDynamicProperty | JSXStyleProperty | JSXSpreadProperty;
export type JSXContent = JSXElement | JSXComment | JSXText | JSXInsert;

export enum JSXElementKind {
    HTML,
    SVG,
    SubComponent
}

export const JSXElement = 'JSXElement' as 'JSXElement';
export interface JSXElement {
    type : typeof JSXElement;
    tag : string;
    properties : JSXProperty[];
    references : JSXReference[];
    functions : JSXFunction[];
    content : JSXContent[];
    kind : JSXElementKind;
    loc : LOC;
}

export const JSXText = 'JSXText' as 'JSXText';
export interface JSXText {
    type : typeof JSXText;
    text : string;
}

export const JSXComment = 'JSXComment' as 'JSXComment';
export interface JSXComment {
    type : typeof JSXComment;
    text : string;
}

export const JSXInsert = 'JSXInsert' as 'JSXInsert';
export interface JSXInsert {
    type : typeof JSXInsert;
    code : EmbeddedCode;
    loc : LOC;
}

export const JSXStaticProperty = 'JSXStaticProperty' as 'JSXStaticProperty';
export interface JSXStaticProperty {
    type : typeof JSXStaticProperty;
    name : string;
    value : string;
}

export const JSXDynamicProperty = 'JSXDynamicProperty' as 'JSXDynamicProperty';
export interface JSXDynamicProperty {
    type : typeof JSXDynamicProperty;
    name : string;
    code : EmbeddedCode;
    loc : LOC;
}

export const JSXSpreadProperty = 'JSXSpreadProperty' as 'JSXSpreadProperty';
export interface JSXSpreadProperty {
    type : typeof JSXSpreadProperty;
    code : EmbeddedCode;
    loc : LOC;
}

export const JSXStyleProperty = 'JSXStyleProperty' as 'JSXStyleProperty';
export interface JSXStyleProperty {
    type : typeof JSXStyleProperty;
    name : string,
    code : EmbeddedCode;
    loc : LOC;
}

export const JSXReference = 'JSXReference' as 'JSXReference';
export interface JSXReference {
    type : typeof JSXReference;
    code : EmbeddedCode;
    loc : LOC;
}

export const JSXFunction = 'JSXFunction' as 'JSXFunction';
export interface JSXFunction {
    type : typeof JSXFunction;
    code : EmbeddedCode;
    loc : LOC;
}

