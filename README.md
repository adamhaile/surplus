# Surplus

Surplus is a preprocessor and library to allow [S.js](https://github.com/curveship/S) applications to create web views using JSX syntax.  It converts JSX to inline DOM statements, with S computations for the dynamic parts.

```javascript
// JSX syntax ...
var td = <td></td>,
    a = <a href="http://foo">link</a>;

// translates to ...
var td = document.createElement("td"),
    a = (function () {
        var __, __text1;
        __ = document.createElement("a");
        __.href = "http://foo";
        __text1 = document.createTextNode("link");
        __.appendChild(__text1);
        return __;
    })();

// let's say the url for the <a> was dynamic
var url = S.data("http://foo"),
    a = <a href={url()}>link</a>;

// translation now has an S computation to set and update the href
var a = (function () {
        var __, __text1;
        __ = document.createElement("a");
        __text1 = document.createTextNode("link");
        __.appendChild(__text1);
        S(function () { __.href = url(); });
        return __;
    })();

// changing the signal ...
url("http://bar");
//  ... changes the DOM node
a.href === "http://bar";
```

Supported JSX features
- creation of DOM elements (lower-cased): `<a></a>`
- creation of sub-components (upper-cased): `<Foo bar="1"/>`
- static properties on DOM elements: `<a href="http://foo"><a/>`
- JSX expressions setting properties: `<a href={url()}></a>`
- JSX expressions inserting children: `<a>{link()}</a>`

Extensions to JSX
- 'ref' properties take a variable to assign the node to, not a function: `<a ref={a_node}></a>`

Planned but currently unsupported JSX features
- spread properties: `<a {... props}></a>`

Planned but currently unimplemented extensions to JSX syntax
- setting deep properties: `<a style-width="100%"></a>`
- spread functions: `<a {... func}></a>`

JSX features with no planned support
- non-functional components, or any of the React stack. Surplus is just JSX.  S apps use simple functions, signals and values instead of React components.

-----
&copy; Adam Haile, 2017.  MIT License.
