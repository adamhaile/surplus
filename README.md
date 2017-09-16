# Surplus

```javascript
var name = S.data("world"),
    view = <h1>Hello {name()}!</h1>;
document.body.appendChild(view);
```
Surplus is a compiler and runtime to allow [S.js](https://github.com/adamhaile/S) applications to create high-performance web views using JSX.  Thanks to JSX, the views are clear, declarative definitions of your UI.  Thanks to S, they update automatically and efficiently as your data changes.

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

If you aren't using one of these tools, or if you want to write your own plugin, see [Calling the surplus compiler](#calling-the-surplus-compiler).

## Features

### Real DOM Elements, not Virtual

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

1. Surplus' compiler does as much work as it can at compile time, so that the runtime code can focus on the truly dynamic operations.

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

JSX allows static, dynamic and spread properties:

```jsx
// static
var input1 = <input type="text" />;

// dynamic
var text = "text",
    input2 = <input type={text} />;

// spread
var props = { type: "text" },
    input3 = <input {...props} />;
```

Since Surplus creates DOM elements, the property names generally refer to DOM element properties, although there are a few special cases: 

1. If Surplus can tell that the given name belongs to an attribute not a property, it will set an attribute instead.  Currently, the heuristic used to distinguish attributes from properties is "does it have a hyphen '-'."
2. Some properties have aliases.  See below.
4. The properties `ref` and `fn` are special.  See below.

You can set a property with an unknown name, and it will be assigned to the node, but it will have no effect on the DOM:

```javascript
var input = <input myProperty={true} />;
input.myProperty === true;
```

### Property aliases

In order to provide greater source compatibility with React and HTML, Surplus allows some properties to be referenced via aliases.

1. For compatibility with React, Surplus allows the React alternate property names as aliases for the corresponding DOM property.  So `onClick` is an alias for the native `onclick`.
2. For compatibility with HTML, Surplus allows `class` and `for` as aliases for the `className` and `htmlFor` properties.

For static and dynamic properties, aliases are normalized at compile time, for spread properties at runtime.

### Property precedence

If the same property is set multiple times on a node, the last one takes precedence:

```javascript
var props = { type: "radio" },
    input = <input {...props} type="text" />;
input.type === "text";
```

### Special `ref` property

A `ref` property specifies a variable to which the given node is assigned.  It is primarily used for obtaining a reference to child nodes.

```javascript
var input,
    div = <div>
            <input ref={input} type="text" />
          </div>;
input.type === "text";
```

The `ref` property fulfills a very similar role to the `ref` property in React, except that since nodes are created immediately in Surplus, it does not take a function but a reference.

### Special `fn` property

A `fn` property specifies a function to be applied to a node.  It is useful for encapsulating a bit of reusable behavior or settings.

```javascript
import { data } from 'surplus-fn-data'; // two-way data binding utility
var value = S.data("foo"),
    input = <input type="text" fn={data(value)} />;
input.value === "foo";
// user enters "bar" in input
input.value === "bar";
```

The `fn` property may be specified multiple times for a node, and each will be applied in the given order.  Surplus provides aliases `fn1`, `fn2`, etc., in case your linter complains about the repeated properties.

### Creating Child Elements

JSX defines two kinds of children, static and dynamic.

```javascript
// static
var div = 
    <div>
        <span>a static child</span>
        Static child text
    </div>;

// { dynamic } 
var span = <span>a dynamic child</span>,
    div = 
        <div>
            {span}
        </div>;
```

With a dynamic child, the given expression is evaluated, and its result is inserted into the child nodes according to the following rules:

- `null` or `undefined` -> nothing
- a DOM node -> the node
- an array -> all items in array
- a function -> the value from calling the function
- anything else -> a text node containing the .toString() value of item

Like React, Surplus removes all-whitespace nodes, and text nodes are trimmed.

### "Components" aka embedded function calls

JSX expressions with *upper-cased* tag names are syntactic sugar for embedded function calls.  

```javascript
<div>
    <Foo bar="1">Bleck</Foo>
</div>;

// ... is equivalent to ...
<div>
    {Foo({ bar: "1", children: [ "Bleck" ] })}
</div>
```

The function is called with an object of the given properties, including any children, and the return value is embedded in place.

Like with any programming, it is good practice to break a complex DOM view into smaller, re-usable functions.  Upper-cased JSX expressions provide a convenient way to embed these functions into their containing views.

The special `ref` and `fn` properties work with "components" the same way they do with nodes.  They operate on the return values of the function.

### Differences from React

For those who are already familiar with React JSX, here is a summary of the differences:

1. The two big differences already stated above: Surplus makes real DOM elements, not virtual, and they update automatically.  This removes a huge swath of the React API: there are no components, no virtual elements, no lifecycle, no setState() and no diff/patch. 

2. The `ref` property takes a reference, not a function.

3. Events are native events, not React's synthetic events.

4. Surplus is more liberal in the property names it accepts, like `onclick`/`onClick`, `className`/`class`, etc.

### Calling the surplus compiler

If one of the build tools listed above doesn't work for you, you may need to work the surplus compiler into your build chain on your own.  The compiler has a very small API:

```javascript
import { compiler } from 'surplus/compiler';

// simple string -> string translation, no sourcemap
var out = compiler.compile(in); 

// w/ appended sourcemap
var out = compiler.compile(in, { sourcemap: 'append' });

// w/ extracted sourcemap
// note that output is different, to return map and src
var { out, map } = compiler.compile(in, { sourcemap: 'extract' });
```

## FAQs

### Why real DOM nodes?

Virtual DOM is a powerful and proven approach to building a web framework.  However, Surplus elects to use real DOM elements for two reasons:

#### Virtual DOM solves a problem Surplus solves via [S.js](https://github.com/adamhaile/S)

Virtual DOM is sometimes described as a strategy to make the DOM reactive, but this isn't exactly true.  The DOM is already reactive: browsers have sophisticated dirty marking and update scheduling algorithms to propagate changes made via the DOM IDL to the pixels on the screen.  That is what allows us to set a property like `input.value = "foo"` and maintain the abstraction that we're "setting a value directly," when in fact there are many layers and much deferred execution before that change hits the screen.

What isn't reactive is Javascript, and virtual DOM is better understood as a strategy for making Javascript more reactive.  Javascript lacks the automatic, differential-update capabilities of a reactive system.  Instead, virtual DOM libraries have apps build and re-build a specification for what the DOM should be, then use diffing and reconciling algorithms to update the real DOM.  Virtual DOM libraries thus build on one of Javascript's strengths -- powerful idioms for object creation -- to address one of its weaknesses -- reactivity.

Surplus is built on S, and it takes advantage of S's fine-grained dependency tracking and deterministic update scheduling.  Adding a virtual DOM layer on top of S would stack two reactive strategies with no additional gain.  Ideally, Surplus provides an abstraction much like the DOM: we manipulate the data with the expectation that the downstream layers will update naturally and transparently.

#### Virtual DOM has a cost, in performance, complexity and interop

Performance: virtual DOM libraries throw away information about what has changed, then reconstruct it in the diff phase.  Some smart engineers have made diffing surprisingly fast, but the cost can never be zero.

Complexity: the separation between a virtual and a real layer brings with it a host of abstractions, such as component 'lifecycle' and 'refs,' which are essentially hooks into the reconciler's work.  The standard programming model of values and functions gets mirrored with a whole layer of virtual values and function-like components.

Interop: interop between different virtual DOM libraries, or between virtual values and your own code, is complicated by the fact that the common layer upon which they could operate, the DOM, is held within the library.  The library only allows access to the DOM at certain moments and through certain ports, like 'refs.'

In comparison, S's automatic dependency graph tracks exactly which parts of the DOM need to be updated when data changes.  Surplus's "components" are just functions, and its values just DOM values.  Interop with them is obvious.

Surplus does have its own tradeoffs, the largest of which is that automatic updates of the DOM require that the changing state be held in S data signals.  The second largest is that declarative reactive programming is unfamiliar to many programmers who are already well versed in a procedural "this happens then this happens then ..." model of program execution.

### If Surplus doesn't have components, how can views have state?

The same way functions usually have state, via closures:

```javascript
const Counter = init => {
    const count = S.data(init);
    return (
        <div>
            Count is: {count()}
            <button onClick={() => count(count() + 1)}>Increment</button>
        </div>
    );
};
```

### I'm using Surplus with TypeScript, and the compiler is choking

The Surplus compiler works on javascript, not TypeScript, so be sure to do the TypeScript compilation first, passing the JSX through via the `jsx: 'preserve'` option.  Then run Surplus on the output.

### Why isn't the Surplus compiler built on Babel?

Mostly for historical reasons: Surplus was originally started about 4 years ago, before Babel had become the swiss army knife of JS extension.  Surplus therefore has its own hand-written compiler, a fairly classic tokenize-parse-transform-compile implementation.  Surplus may switch to Bable in the future.  The current compiler only parses the JSX expressions, not the JS code itself, which limits the optimizations available.  

-----
&copy; Adam Haile, 2017.  MIT License.
