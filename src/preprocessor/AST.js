define('AST', [], function () {
    return {
        CodeTopLevel: function (segments) {
            this.segments = segments; // [ CodeText | HtmlElement ]
        },
        CodeText: function (text, loc) {
            this.text = text; // string
            this.loc = loc; // { line: int, col: int }
        },
        EmbeddedCode: function (segments) {
            this.segments = segments; // [ CodeText | HtmlElement ]
        },
        HtmlElement: function(tag, properties, content) {
            this.tag = tag; // string
            this.properties = properties; // [ StaticProperty | DynamicProperty | Mixin ]
            this.content = content; // [ HtmlElement | HtmlComment | HtmlText | HtmlInsert ]
        },
        HtmlText: function (text) {
            this.text = text; // string
        },
        HtmlComment: function (text) {
            this.text = text; // string
        },
        HtmlInsert: function (code) {
            this.code = code; // EmbeddedCode
        },
        StaticProperty: function (name, value) {
            this.name = name; // string
            this.value = value; // string
        },
        DynamicProperty: function (name, code) {
            this.name = name; // string
            this.code = code; // EmbeddedCode
        },
        Mixin: function (code) {
            this.code = code; // EmbeddedCode
        }
    };
});
