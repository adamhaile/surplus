// 'kind' properties are to make sure that Typescript treats each of these as distinct classes
// otherwise, two classes with same props, like the 4 with just code / loc, are treated
// as interchangeable
var Program = /** @class */ (function () {
    function Program(segments) {
        this.segments = segments;
        this.kind = 'program';
    }
    return Program;
}());
export { Program };
var CodeText = /** @class */ (function () {
    function CodeText(text, loc) {
        this.text = text;
        this.loc = loc;
        this.kind = 'code';
    }
    return CodeText;
}());
export { CodeText };
var EmbeddedCode = /** @class */ (function () {
    function EmbeddedCode(segments) {
        this.segments = segments;
        this.kind = 'embeddedcode';
    }
    return EmbeddedCode;
}());
export { EmbeddedCode };
var JSXElement = /** @class */ (function () {
    function JSXElement(tag, properties, references, functions, content, loc) {
        this.tag = tag;
        this.properties = properties;
        this.references = references;
        this.functions = functions;
        this.content = content;
        this.loc = loc;
        this.kind = 'element';
        this.isHTML = JSXElement.domTag.test(this.tag);
    }
    JSXElement.domTag = /^[a-z][^\.]*$/;
    return JSXElement;
}());
export { JSXElement };
var JSXText = /** @class */ (function () {
    function JSXText(text) {
        this.text = text;
        this.kind = 'text';
    }
    return JSXText;
}());
export { JSXText };
var JSXComment = /** @class */ (function () {
    function JSXComment(text) {
        this.text = text;
        this.kind = 'comment';
    }
    return JSXComment;
}());
export { JSXComment };
var JSXInsert = /** @class */ (function () {
    function JSXInsert(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'insert';
    }
    return JSXInsert;
}());
export { JSXInsert };
var JSXStaticProperty = /** @class */ (function () {
    function JSXStaticProperty(name, value) {
        this.name = name;
        this.value = value;
        this.kind = 'staticprop';
    }
    return JSXStaticProperty;
}());
export { JSXStaticProperty };
var JSXDynamicProperty = /** @class */ (function () {
    function JSXDynamicProperty(name, code, loc) {
        this.name = name;
        this.code = code;
        this.loc = loc;
        this.kind = 'dynamicprop';
    }
    return JSXDynamicProperty;
}());
export { JSXDynamicProperty };
var JSXSpreadProperty = /** @class */ (function () {
    function JSXSpreadProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'spread';
    }
    return JSXSpreadProperty;
}());
export { JSXSpreadProperty };
var JSXStyleProperty = /** @class */ (function () {
    function JSXStyleProperty(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'style';
        this.name = "style";
    }
    return JSXStyleProperty;
}());
export { JSXStyleProperty };
var JSXReference = /** @class */ (function () {
    function JSXReference(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'reference';
    }
    return JSXReference;
}());
export { JSXReference };
var JSXFunction = /** @class */ (function () {
    function JSXFunction(code, loc) {
        this.code = code;
        this.loc = loc;
        this.kind = 'function';
    }
    return JSXFunction;
}());
export { JSXFunction };
