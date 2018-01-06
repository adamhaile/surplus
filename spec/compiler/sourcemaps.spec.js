describe("sourcemaps", function () {
    it("can be returned", function () {
        var code = window.SurplusCompiler.compile(`
            var div = <div className={"foo"}></div>,
                h1 = <h1>{"title"}</h1>,
                ul  = <ul>
                        {<li>one</li>}
                        <li>two</li>
                      </ul>,
                a   = <a href="#">link</a>;
        `, { sourcemap: 'extract' });

        expect(code.map).not.toBeUndefined();
    });

    it("can be appended", function () {
        var code = window.SurplusCompiler.compile(`
            //debugger;
            var div = <div className={"foo"}></div>,
                h1 = <h1>{"title"}</h1>,
                ul  = <ul>
                        {<li>one</li>}
                        <li>two</li>
                      </ul>,
                a   = <a href="#">link</a>;
        `, { sourcemap: 'append' });

        eval(code);
    });

    it("handle complex jsx", function () {
        var code = window.SurplusCompiler.compile(`
//debugger;
var data = () => () => null,
    onkey = () => () => null,
    focus = () => () => null,
    mapSample = (a, fn) => a().map(fn),
    cx = () => "",
    ctrl = {
        newTitle: () => "",
        filter: () => null,
        all: () => [],
        remaining: () => [],
        displayed: () => [{ title: () => "", completed: () => false, editing: () => false }],
        completed: () => [],
        allCompleted: () => true,
    }
var todos =
    <section>
        <section className="todoapp">
            <header className="header">
                <h1>todos</h1>
                <input className="new-todo" placeholder="What needs to be done?" autoFocus={true}
                    fn={data(ctrl.newTitle, "keydown")}
                    fn={onkey("enter", ctrl.create)}
					fn={onkey("esc", () => ctrl.newTitle(""))} />
            </header>
            <section className="main" hidden={ctrl.all().length === 0}>
                <input className="toggle-all" type="checkbox"
                    checked={ctrl.allCompleted()} />
                <label htmlFor="toggle-all" onClick={() => ctrl.setAll(!ctrl.allCompleted())}>Mark all as complete</label>
                <ul className="todo-list">
                    {mapSample(ctrl.displayed, todo =>
                        <li className={cx({ completed: todo.completed(), editing: todo.editing() })}>
                            <div className="view">
                                <input className="toggle" type="checkbox" fn={data(todo.completed)} />
                                <label onDoubleClick={todo.startEditing}>{todo.title()}</label>
                                <button className="destroy" onClick={todo.remove}></button>
                            </div>
                            <input className="edit"
                                fn={data(todo.title, "keyup")}
                                onBlur={() => todo.endEditing(true)}
							    fn={onkey("enter", () => todo.endEditing(true))}
							    fn={onkey("esc", () => todo.endEditing(false))}
							    fn={focus(todo.editing())} />
                        </li>
                    )}
                </ul>
            </section>
            <footer className="footer" hidden={ctrl.all().length === 0}>
                <span className="todo-count"><strong>{ctrl.remaining().length}</strong> item{ctrl.remaining().length === 1 ? "" : "s"} left</span>
                <ul className="filters">
                    <li>
                        <a className={cx({ selected: ctrl.filter() === null })} href="#/">All</a>
                    </li>
                    <li>
                        <a className={cx({ selected: ctrl.filter() === false })} href="#/active">Active</a>
                    </li>
                    <li>
                        <a className={cx({ selected: ctrl.filter() === true })} href="#/completed">Completed</a>
                    </li>
                </ul>
                <button className="clear-completed" onClick={ctrl.clearCompleted} hidden={ctrl.completed().length === 0}>Clear completed</button>
            </footer>
        </section>
        <footer className="info">
            <p>Double-click to edit a todo</p>
            <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>
            <p>Created by <a href="https://github.com/adamhaile">Adam Haile</a></p>
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
    </section>
`, { sourcemap: 'append', sourcefile: 'complex.ts', targetfile: 'complex.js' });

        eval(code);
    });
});