import { LOC } from './parse';

export class Program {
    constructor(
        public segments : CodeSegment[]
    ) { }
}

export type CodeSegment = CodeText | JSXElement;

export class CodeText { 
    constructor(
        public readonly text : string, 
        public readonly loc : LOC
    ) { }
}

export class EmbeddedCode {
    constructor(
        public readonly segments : CodeSegment[]
    ) { }
}

export type JSXProperty = JSXStaticProperty | JSXDynamicProperty | JSXSpreadProperty;
export type JSXContent = JSXElement | JSXComment | JSXText | JSXInsert;

export class JSXElement {
    constructor(
        public readonly tag : string, 
        public readonly properties : JSXProperty[], 
        public readonly content : JSXContent[],
        public readonly loc : LOC
    ) { }    

    private static domTag = /^[a-z][^\.]*$/;
    isHTML = JSXElement.domTag.test(this.tag);
}

export class JSXText {
    constructor(
        public readonly text : string
    ) { }
}

export class JSXComment {
    constructor(
        public readonly text : string
    ) { }
}

export class JSXInsert {
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

export class JSXStaticProperty {
    constructor(
        public readonly name : string, 
        public readonly value : string
    ) { }
}

export class JSXDynamicProperty {
    constructor(
        public readonly name : string, 
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }

    private static RefName = "ref\\d*";
    private static RefNameRx = new RegExp('^' + JSXDynamicProperty.RefName + "$");
    isRef = JSXDynamicProperty.RefNameRx.test(this.name);
    private static FnName = "fn\\d*";
    private static FnNameRx = new RegExp('^' + JSXDynamicProperty.FnName + "$");
    isFn = JSXDynamicProperty.FnNameRx.test(this.name);
    private static StyleName = "style";
    isStyle = this.name === JSXDynamicProperty.StyleName;
    static SpecialPropNames = [ JSXDynamicProperty.RefName, JSXDynamicProperty.FnName, JSXDynamicProperty.StyleName ];
    static SpecialPropNameRx = new RegExp(`^(${JSXDynamicProperty.SpecialPropNames.join('|')})$`);
}

export class JSXSpreadProperty {
    constructor(
        public readonly code : EmbeddedCode,
        public readonly loc : LOC
    ) { }
}

// a Copy transform, for building non-identity transforms on top of
export const Copy = {
    Program(node : Program) {
        return new Program(this.CodeSegments(node.segments));
    },
    CodeSegments(segments : CodeSegment[]) {
        return segments.map(node => 
            node instanceof CodeText ? this.CodeText(node) : 
            this.JSXElement(node));
    },
    EmbeddedCode(node : EmbeddedCode) {
        return new EmbeddedCode(this.CodeSegments(node.segments));
    },
    JSXElement(node : JSXElement) : JSXElement {
        return new JSXElement(node.tag, 
            node.properties.map(p => this.JSXProperty(p)),
            node.content.map(c => this.JSXContent(c)),
            node.loc
        );
    },
    JSXProperty(node : JSXProperty) {
        return node instanceof JSXStaticProperty  ? this.JSXStaticProperty(node) :
               node instanceof JSXDynamicProperty ? this.JSXDynamicProperty(node) :
               this.JSXSpreadProperty(node);
    },
    JSXContent(node : JSXContent) {
        return node instanceof JSXComment ? this.JSXComment(node) :
               node instanceof JSXText    ? this.JSXText(node) :
               node instanceof JSXInsert  ? this.JSXInsert(node) :
               this.JSXElement(node);
    },
    JSXInsert(node : JSXInsert) {
        return new JSXInsert(this.EmbeddedCode(node.code), node.loc);
    },
    CodeText(node : CodeText) { return node; },
    JSXText(node : JSXText) { return node; },
    JSXComment(node : JSXComment) { return node; },
    JSXStaticProperty(node : JSXStaticProperty) { return node; },
    JSXDynamicProperty(node : JSXDynamicProperty) {
        return new JSXDynamicProperty(node.name, this.EmbeddedCode(node.code), node.loc);
    },
    JSXSpreadProperty(node : JSXSpreadProperty) {
        return new JSXSpreadProperty(this.EmbeddedCode(node.code), node.loc);
    }
};

export type Copy = typeof Copy;
