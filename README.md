# Surplus

```jsx
const name = S.data("world"),
      view = <h1>Hello {name()}!</h1>;
document.body.appendChild(view);
```

Surplus is a compiler and runtime to allow [S.js](https://github.com/adamhaile/S) applications to create high-performance web views using JSX.  Thanks to JSX, your views are clear, declarative definitions of your UI.  Thanks to Surplus' compiler, they are converted into direct DOM instructions that run fast.  Thanks to S, they react automatically and efficiently as your data changes.

## The Gist

Surplus treats JSX like a macro language for native DOM instructions.

```jsx
const div = <div/>;
// ... compiles to ...
const div = document.createElement("div");

// more complicated expressions are wrapped in a function
const input = <input type="text"/>;
// ... compiles to ...
const input = (() => {
    var __ = document.createElement("input");
    __.type = "text";
    return __;
})();
```

These DOM instructions create real DOM nodes that match your JSX.  There's no virtual DOM middle layer standing between your JSX and the DOM.

DOM updates are handled by [S computations](https://github.com/adamhaile/S#computations).

```jsx
const className = S.data("foo"),
      div = <div className={className()}/>;
// ... compiles to ...
const className = S.data("foo"),
      div = (() => {
          var __ = document.createElement("div");
          S(() => {
              __.className = className(); // re-runs if className() changes
          });
          return __;
      })();
```

The computations perform direct, fine-grained changes to the DOM nodes.  Updates run fast while keeping the DOM in sync with your JSX.

Finally, Surplus has a small runtime to help with more complex JSX features, like property spreads and variable children.

```jsx
import * as Surplus from 'surplus';

const div = <div {...props} />;
// ... compiles to ...
const div = (() => {
    var __ = document.createElement("div");
    Surplus.spread(__, props);
    return __;
})();
```

## Installation

```sh
> npm install --save surplus s-js
```

Like React, Surplus has two parts, a compiler and a runtime.

### Runtime
The Surplus runtime must be imported as `Surplus` into any module using Surplus JSX views.

```javascript
import * as Surplus from 'surplus'; // ES2015 modules
const Surplus = require('surplus');   // CommonJS modules
```

### Compiler

The easiest way to run the Surplus compiler is via a plugin for your build tool:

- Webpack: [surplus-loader](https://github.com/adamhaile/surplus-loader)
- Rollup: [rollup-plugin-surplus](https://github.com/adamhaile/rollup-plugin-surplus)
- Gulp: [gulp-surplus](https://github.com/adamhaile/gulp-surplus)
- Browserify: [surplusify](https://github.com/adamhaile/surplusify)
- Parcel: [parcel](https://github.com/tinchoz49/parcel-plugin-surplus)

If you aren't using one of these tools, or if you want to write your own plugin, see [Calling the surplus compiler](#calling-the-surplus-compiler).

## Example

Here is a minimalist ToDo application, with [a demo on CodePen](https://codepen.io/adamhaile/pen/ppvdGa?editors=0010):
```jsx
const
    Todo = t => ({               // our Todo constructor
       title: S.data(t.title),   // properties are S data signals
       done: S.data(t.done)
    }),
    todos = SArray([]),          // our todos, using SArray
    newTitle = S.data(""),       // title for new todos
    addTodo = () => {            // push new title onto list
       todos.push(Todo({ title: newTitle(), done: false }));
       newTitle("");             // clear new title
    };

const view =                     // declarative main view
    <div>
        <h2>Minimalist ToDos in Surplus</h2>
        <input type="text" fn={data(newTitle)}/>
        <a onClick={addTodo}> + </a>
        {todos.map(todo =>       // insert todo views
            <div>
                <input type="checkbox" fn={data(todo.done)}/>
                <input type="text" fn={data(todo.title)}/>
                <a onClick={() => todos.remove(todo)}>&times;</a>
            </div>
        )}
    </div>;

document.body.appendChild(view); // add view to document
```

Note that there is no `.mount()` or `.render()` command.  Since the JSX returns real nodes, we can attach them to the page with standard DOM commands, `document.body.appendChild(view)`.

Note also that there's no code to handle updating the application: no `.update()` command, no `.setState()`, no change event subscription.  Other than a liberal sprinkling of `()`'s, this could be static code.  

This is because S is designed to enable *declarative programming*, where we focus on defining how things should be and S handles updating the app from one state to the next as our data changes.  

Surplus lets us extend that model to the DOM.  We write JSX definitions of what the DOM should be, and Surplus generates runtime code to maintain those definitions.

Declarative programs aren't just clear, they're also flexible.  Because they aren't written with any specific changes in mind, they can often adapt easily to new behaviors.  For instance, we can add localStorage persistence with zero changes to the code above and only a handful of new lines:

```javascript
if (localStorage.todos) { // load stored todos on start
    todos(JSON.parse(localStorage.todos).map(Todo));
}

S(() => {                // store todos whenever they change
    localStorage.todos = JSON.stringify(todos().map(t => 
        ({ title: t.title(), done: t.done() })));
});
```

More examples of Surplus programs:
- The standard [TodoMVC in Surplus](https://github.com/adamhaile/surplus-todomvc), which you can run [here](https://adamhaile.github.io/surplus-todomvc)
- [Surplus Demos](https://github.com/adamhaile/surplus-demos), a collection of tiny Surplus example apps, from [Hello World](https://github.com/adamhaile/surplus-demos/helloworld.html) to [Asteroids](https://github.com/adamhaile/surplus-demos/asteroids.html).
- The [Realworld Demo in Surplus](https://github.com/adamhaile/surplus-realworld), a full-fledged Medium-like app demonstrating routing, authentication and server interaction, based on the [Realworld spec](https://github.com/gothinkster/realworld).

## Benchmarks

Direct DOM instructions plus S.js's highly optimized reactivity means that Surplus apps generally place at or near the top of various performance benchmarks.

For example, Surplus is currently the top framework in Stefan Krause's [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark):

![js-framework-benchmark results](benchmark2.png)

## Documentation

### Creating HTML Elements

```jsx
const div       = <div></div>, // an HTMLDivElement
      input     = <input/>;    // an HTMLInputElement
      // ... etc
```

JSX expressions with *lower-cased* tags create elements.  These are HTML elements, unless their tag name or context is known to be SVG (see next entry).

There are no unclosed tags in JSX: all elements must either have a closing tag `</...>` or end in `/>`,

### Creating SVG Elements

```jsx
const svg       = <svg></svg>, // SVGSVGElement
      svgCircle = <circle/>,   // SVGCircleElement
      svgLine   = <line/>;     // SVGLineElement
      // ... etc
```

If the tag name matches a known SVG element, Surplus will create an SVG element instead of an HTML one.  For the small set of tag names that belong to both -- `<a>`, `<font>`, `<title>`, `<script>` and `<style>` -- Surplus creates an HTML element.

```jsx
const title = <title></title>; // an HTMLTitleElement
```

Children of SVG elements are also SVG elements, unless their parent is the `<foreignObject>` element, in which case they are DOM elements again.

```jsx
const svg =
    <svg>
        <text>an SVGTextElement</text>
        <foreignObject>
            <div>an HTMLDivElement</div>
        </foreignObject>
    </svg>;
```

To create the SVG version of an ambiguous tag name, put it under a known SVG tag and extract it.

```jsx
const svg      = <svg><title>an SVGTitleElement</title></svg>,
      svgTitle = svg.firstChild;
```

### Setting properties

JSX allows static, dynamic and spread properties:

```jsx
// static
const input1 = <input type="text" />;

// dynamic
const text   = "text",
      input2 = <input type={text} />;

// spread
const props  = { type: "text" },
      input3 = <input {...props} />;
```

Since Surplus creates DOM elements, the property names generally refer to DOM element properties, although there are a few special cases:

1. If Surplus can tell that the given name belongs to an attribute not a property, it will set the attribute instead.  Currently, the heuristic used to distinguish attributes from properties is &ldquo;does it have a hyphen.&rdquo;  So `<div aria-hidden="true">` will set the `aria-hidden` attribute.
2. Some properties have aliases.  See below.
4. The properties `ref` and `fn` are special.  See below.

You can set a property with an unknown name, and it will be assigned to the node, but it will have no effect on the DOM:

```jsx
const input = <input myProperty={true} />;
input.myProperty === true;
```

### Property aliases

In order to provide greater source compatibility with React and HTML, Surplus allows some properties to be referenced via alternate names.

1. For compatibility with React, Surplus allows the React alternate property names as aliases for the corresponding DOM property.  So `onClick` is an alias for the native `onclick`.
2. For compatibility with HTML, Surplus allows `class` and `for` as aliases for the `className` and `htmlFor` properties.

For static and dynamic properties, aliases are normalized at compile time, for spread properties at runtime.

### Property precedence

If the same property is set multiple times on a node, the last one takes precedence:

```jsx
const props = { type: "radio" },
      input = <input {...props} type="text" />;
input.type === "text";
```

### Special `ref` property

A `ref` property specifies a variable to which the given node is assigned.  This makes it easy to get a reference to internal nodes.

```jsx
let input,
    div = <div>
            <input ref={input} type="text" />
          </div>;
input.type === "text";
```

The `ref` property fulfills a very similar role to the `ref` property in React, except that since nodes are created immediately in Surplus, it does not take a function but an assignable expression.

### Special `fn` property

A `fn` property specifies a function to be applied to a node.  It is useful for encapsulating a bit of reusable behavior or properties.

```jsx
import data from 'surplus-mixin-data'; // two-way data binding utility
const value = S.data("foo"),
      input = <input type="text" fn={data(value)} />;
input.value === "foo";
// user enters "bar" in input
input.value === "bar";
```

The function may take an optional second parameter, which will contain any value returned by the previous invocation, aka a &lsquo;reducing&rsquo; pattern.  In typescript, the full signature looks like:

```typescript
type SurplusFn = <N, T>(node : N, state : T | undefined) => T
```

The `fn` property may be specified multiple times for a node.  Surplus provides aliases `fn1`, `fn2`, etc., in case your linter complains about the repeated properties.

### Creating Child Elements

JSX defines two kinds of children, static and dynamic.

```jsx
// static, created in place, never change
const div =
    <div>
        <span>a static span created in the div</span>
        Some static text
    </div>;
```

```jsx
// { dynamic }, inserted into place, can change
const span = <span>a span to insert in the div</span>,
      text = S.data("some text that will change"),
      div =
        <div>
            {span}
            {text()}
        </div>;
text("the changed text");
```

With a dynamic child, the given expression is evaluated, and its result is inserted into the child nodes according to the following rules:

- `null`, `undefined` or a boolean -> nothing
- a DOM node -> the node
- an array -> all items in array
- a function -> the value from calling the function
- a string -> a text node
- anything else -> convert to string via .toString() and insert that

Like React, Surplus removes all-whitespace nodes, and text nodes are trimmed.

### Embedded function calls, aka &ldquo;Components&rdquo;

JSX expressions with *upper-cased* tag names are syntactic sugar for embedded function calls.

```jsx
<div>
    <Foo bar="1">baz</Foo>
</div>;

// ... is equivalent to ...
<div>
    {Foo({ bar: "1", children: "baz" })}
</div>
```

The function is called with an object of the given properties, including any children, and the return value is embedded in place.

Like with any programming, it is good practice to break a complex DOM view into smaller, re-usable functions.  Upper-cased JSX expressions provide a convenient way to embed these functions into their containing views.

The special `ref` and `fn` properties work with embedded function calls the same way they do with nodes.  They operate on the return value of the function.

### Update Granularity &mdash; S computations

Surplus detects which parts of your view may change and constructs S computations to keep them up-to-date.

1. Each element with dynamic properties or spreads gets a computation responsible for setting all properties for that node.

2. Each `fn={...}` declaration gets its own computation.  This allows the `fn` to have internal state, if appropriate.

3. Each dynamic children expression `{ ... }` gets a computation.  This includes embedded component calls, since they are an insert of the call's result.

### Surplus.* functions &mdash; not for public use

The surplus module has several functions which provide runtime support for the code emitted by the compiler.  These functions *can and will change*, even in minor point releases.  You have been warned :).

A corollary of this is that the runtime only supports code compiled by the same version of the compiler.  Switching to a new version of Surplus requires re-compiling your JSX code.

### Differences from React

Many React Stateless Functional Components can be dropped into Surplus with no or minimal changes.  Beyond that, here is a summary of the differences:

1. The two big differences already stated above: Surplus makes real DOM elements, not virtual, and they update automatically.  This removes most of the React API.  There are no components, no virtual elements, no lifecycle, no setState(), no componentWillReceiveProps(), no diff/patch, etc etc.

2. The `ref` property takes an assignable reference, not a function.

3. Events are native events, not React's synthetic events.

4. Surplus is a little more liberal in the property names it accepts, like `onClick`/`onclick`, `className`/`class`, etc.

5. If you set an unknown field with a name that doesn't contain a dash, like `<div mycustomfield="1" />`, React will set an attribute while Surplus will set a property.

### Calling the surplus compiler

If one of the build tools listed above doesn't work for you, you may need to work the surplus compiler into your build chain on your own.  The compiler has a very small API:

```javascript
import { compiler } from 'surplus/compiler';

// simple string -> string translation, no sourcemap
const out = compiler.compile(in);

// w/ appended sourcemap
const out = compiler.compile(in, { sourcemap: 'append' });

// w/ extracted sourcemap
// note that output is different, to return map and src
const { src, map } = compiler.compile(in, { sourcemap: 'extract' });
```

## FAQs

### Can I use the standard Babel or Typescript JSX compilers for Surplus?

No. Surplus isn't just the runtime library, it's the library+compiler, which are tightly coupled.  It's not just cosmetic differences.  The standard JSX compilation format was designed for virtual DOM and doesn't have the features Surplus needs.  In particular, Surplus wraps dynamic expressions -- `{ ... }` -- in lambdas, so that it can create S computations that detect when the expressions change and make targeted updates.  The usual format doesn't do that, since it relies on external notification of change (`.setState()`) followed by a diffing phase to detect what changed.

### Why real DOM nodes?

Virtual DOM is a powerful and proven approach to building a web framework.  However, Surplus elects to use real DOM elements for two reasons:

#### Virtual DOM solves a problem Surplus solves via [S.js](https://github.com/adamhaile/S)

Virtual DOM is sometimes described as a strategy to make the DOM reactive, but this isn't exactly true.  The DOM is already reactive: browsers have sophisticated dirty-marking and update-scheduling algorithms to propagate changes made via the DOM interface to the pixels on the screen.  That is what allows us to set a property like `input.value = "foo"` and maintain the abstraction that we're &ldquo;setting a value directly,&rdquo; when in fact there are many layers and much deferred execution before that change hits the screen.

What isn't reactive is Javascript, and virtual DOM is better understood as a strategy for making Javascript more reactive.  Javascript lacks the automatic, differential-update capabilities of a reactive system.  Instead, virtual DOM libraries have apps build and re-build a specification for what the DOM should be, then use diffing and reconciling algorithms to update the real DOM.  Virtual DOM libraries thus build on one of Javascript's strengths &mdash; powerful idioms for object creation &mdash; to address one of its weaknesses &mdash; reactivity.

Surplus is built on [S.js](https://github.com/adamhaile/S), and it takes advantage of S's fine-grained dependency tracking and deterministic update scheduling.  Adding a virtual DOM layer on top of S would stack two reactive strategies with no additional gain.  Ideally, Surplus provides an abstraction much like the DOM: we manipulate the data with the expectation that the downstream layers will update naturally and transparently.

#### Virtual DOM has a cost, in performance, complexity and interop

Performance: virtual DOM libraries throw away information about what has changed, then reconstruct it in the diff phase.  Some smart engineers have made diffing surprisingly fast, but the cost can never be zero.

Complexity: the separation between a virtual and a real layer brings with it a host of abstractions, such as component &lsquo;lifecycle&rsquo; and &lsquo;refs,&rsquo; which are essentially hooks into the reconciler's work.  The standard programming model of values and functions gets mirrored with a parallel layer of virtual values and function-like components.

Interop: communication between different virtual DOM libraries, or between virtual values and your own code, is complicated by the fact that the common layer upon which they operate, the DOM, is held within the library.  The library only allows access to the DOM at certain moments and through certain ports, like &lsquo;refs.&rsquo;

In comparison, S's automatic dependency graph tracks exactly which parts of the DOM need to be updated when data changes.  Surplus takes the React claim that it's &ldquo;just Javascript&rdquo; one step further, in that Surplus &ldquo;components&rdquo; are just functions, and its views just DOM nodes.  Interop with them is obvious.

Surplus does have its own tradeoffs, the largest of which is that automatic updates of the DOM require that the changing state be held in S data signals.  The second largest is that declarative reactive programming is unfamiliar to many programmers who are already well versed in a procedural &ldquo;this happens then this happens then ...&rdquo; model of program execution.  Finally, Surplus trades the performance cost of diffing with the performance cost of bookkeeping in the S dependency graph.

### If Surplus doesn't have components, how can views have state?

The same way functions usually have state, via closures:

```jsx
const Counter = init => {
    const count = S.data(init);
    return (
        <div>
            Count is: {count()}
            <button onClick={() => count(count() + 1)}>
                Increment
            </button>
        </div>
    );
};
```

### I'm using Surplus with TypeScript, and the compiler is choking

The Surplus compiler works on javascript, not TypeScript, so be sure to do the TypeScript compilation first, passing the JSX through via the `jsx: 'preserve'` option.  Then run Surplus on the output.

### I'm using Surplus with Typescript, and I'm getting a runtime error &lsquo;Surplus is not defined&rsquo; even though I imported it?

Typescript strips imports that aren't referenced in your code.  Since the references to Surplus haven't been made when Typescript runs (see question above) it removes the import.  The workaround is to tell Typescript that Surplus is your `jsxFactory` in your tsconfig.json:

```json
{
    "compilerOptions": {
        ...
        "jsx": "preserve",
        "jsxFactory": "Surplus",
    }
}
```
Technically, we're not asking Typescript to compile our JSX, so the `jsxFactory` setting shouldn't matter, but it has the useful side-effect of letting Typescript know not to strip Surplus from the compiled module.

### Why isn't the Surplus compiler built on Babel?

Mostly for historical reasons: Surplus was originally started about 4 years ago, before Babel had become the swiss army knife of JS extension.  Surplus therefore has its own hand-written compiler, a fairly classic tokenize-parse-transform-compile implementation.  Surplus may switch to Babel in the future.  The current compiler only parses the JSX expressions, not the JS code itself, which limits the optimizations available.

-----
&copy; Adam Haile, 2017.  MIT License.
