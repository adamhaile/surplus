# Surplus

```javascript
var name = S.data("world"),
    view = <h1>Hello {name()}!</h1>;
document.body.appendChild(view);
```
Surplus is a compiler and runtime to allow [S.js](https://github.com/adamhaile/S) applications to create high-performance web views using JSX.  Thanks to JSX, the views are simple, declarative definitions of your UI.  Thanks to S, they update automatically and efficiently as your data changes.

## Installation

```sh
> npm install --save surplus
```

Like React, Surplus has two parts, a compiler and a runtime.

### Runtime
The Surplus runtime must be imported as `Surplus` into any module using Surplus JSX views.

```javascript
import * as Surplus from 'surplus'; // ES2015 modules
var Surplus = require('surplus');   // CommonJS modules
```

### Compiler

The easiest way to run Surplus' compiler is via a plugin for your build tool:

- Webpack: [surplus-loader](https://github.com/adamhaile/surplus-loader)
- Rollup: [rollup-plugin-surplus](https://github.com/adamhaile/rollup-plugin-surplus)
- Gulp: [gulp-surplus](https://github.com/adamhaile/gulp-surplus)
- Browserify: [surplusify](https://github.com/adamhaile/surplusify)

If you aren't using one of these tools, or if you want to write your own plugin, see [invoking the surplus compiler](#invoking-the-surplus-compiler).

## Features

### Real DOM Values, not Virtual

Surplus JSX expressions create real DOM elements, not virtual elements like React or other vdom libraries.

```javascript
var node = <span>foo</span>;
// since node is a real HTMLSpanElement, we can use its properties
node.className = "bar";
```
For a longer discussion, see [why real DOM nodes?](#why-real-dom-nodes)

Creating real DOM nodes removes the entire "middle layer" from Surplus: there are no components, no "lifecycle," no mount or diff/patch.  DOM nodes are values like any other, "components" are plain old functions that return DOM nodes.

### Automatic Updates

If your Surplus JSX expression references any S signals, then Surplus creates an S computation to keep that part of the DOM up to date:

```javascript
var text = S.data("foo"),
    node = <span>{text()}</span>; 

// node starts out equal to <span>foo</span>

text("bar");

// now it's <span>bar</span>
```

### JSX

Surplus is not a React "work-alike," but it uses the JSX syntax popularized by React to define its views.  This has several advantages:

1. JSX is declarative.  In a reactive system, it's important that we only need to know *what* our data is, not *how* or *when* we got here.
2. JSX has well-established tooling: syntax highlighters, type checkers (Surplus has full Typescript support), linters, etc. all work with Surplus JSX.
3. JSX mitigates the risk of adopting (or abandoning) Surplus.  Much Surplus JSX code already works as a React stateless functional component, and vice versa.  Surplus avoids arbitrary differences with React as much as possible.

### Performance
Surplus apps generally rank at or near the top of most javascript benchmarks.  This has two reasons:

1. Surplus' compiler does as much work as it can at compile time, so that the runtime code has only the minimal, truly dynamic operations to perform.

1. Targetting real DOM nodes removes the cost of the vdom "middle layer."  For instance, Surplus can compile property assignments down to direct JIT-friendly statements like `node.type = "text"`.

## Documentation

### Creating HTML Elements

```javascript
var div       = <div></div>, // a HTMLDivElement
    input     = <input/>;    // a HTMLInputElement
    // ... etc
```

JSX expressions with *lower-cased* tags create elements.  These are HTML elements, unless their tag name or context is known to be SVG (see next entry).  

There are no unclosed tags in JSX: all elements must either have a closing tag `</...>` or end in `/>`,

### Creating SVG Elements

```javascript
var svg       = <svg></svg>, // SVGSVGElement
    svgCircle = <circle/>,   // SVGCircleElement
    svgLine   = <line/>;     // SVGLineElement
    // ... etc
```

If the tag name matches a known SVG element, Surplus will create an SVG element instead of an HTML one.  For the small set of tag names that belong to both -- `<font>`, `<title>`, `<script>` and `<style>` -- Surplus creates an HTML element.

```javascript
var title = <title></title>; // an HTMLTitleElement
```

Children of SVG elements are also SVG elements, unless their parent is the `<foreignObject>` element, in which case they are DOM elements again.

```javascript
var svg = 
        <svg>
            <text>an SVGTextElement</text>
            <foreignObject>
                <div>an HTMLDivElement</div>
            </foreignObject>
        </svg>;
```

To create the SVG version of an ambiguous tag name, put it under a known SVG tag and extract it.

```javascript
var svg      = <svg><title>an SVGTitleElement</title></svg>,
    svgTitle = svg.firstChild;
```

### Setting properties

**TODO**

#### Static properties

**TODO**

#### Dynamic properties

**TODO**

#### "Spread" properties

**TODO**

#### Property names

**TODO**

#### Property precedence

**TODO**

### Special `ref` property

**TODO**

### Special `fn` property

**TODO**

### Creating Child Elements

**TODO**

#### Static children

**TODO**

#### Dynamic children

**TODO**

### "Components" aka embedded function calls

**TODO**

### Misc

**TODO**

#### Invoking the surplus compiler

**TODO**

## FAQ

### Why real DOM nodes?

**TODO**

-----
&copy; Adam Haile, 2017.  MIT License.
