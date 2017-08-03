describe("sourcemaps", function () {
    it("can be returned", function () {
        var code = window.SurplusPreprocessor.preprocess('                     \n\
            var div = <div className={"foo"}></div>,                           \n\
                h1 = <h1>{"title"}</h1>,                                       \n\
                ul  = <ul>                                                     \n\
                        {<li>one</li>}                                         \n\
                        <li>two</li>                                           \n\
                      </ul>,                                                   \n\
                a   = <a href="#">link</a>;                                    \n\
        ', { sourcemap: 'extract' });

        expect(code.map).not.toBeUndefined();
    });

    it("can be appended", function () {
        var code = window.SurplusPreprocessor.preprocess('                     \n\
            //debugger;                                                          \n\
            var div = <div className={"foo"}></div>,                           \n\
                h1 = <h1>{"title"}</h1>,                                       \n\
                ul  = <ul>                                                     \n\
                        {<li>one</li>}                                         \n\
                        <li>two</li>                                           \n\
                      </ul>,                                                   \n\
                a   = <a href="#">link</a>;                                    \n\
        ', { sourcemap: 'append' });

        eval(code);
    });

    it("handle complex jsx", function () {
        var code = window.SurplusPreprocessor.preprocess('                     \n\
//debugger; \n\
var data = () => () => null,\n\
    onkey = () => () => null,\n\
    focus = () => () => null,\n\
    mapSample = (a, fn) => a().map(fn),\n\
    cx = () => "",\n\
    ctrl = {\n\
        newTitle: () => "",\n\
        filter: () => null,\n\
        all: () => [],\n\
        remaining: () => [],\n\
        displayed: () => [{ title: () => "", completed: () => false, editing: () => false }],\n\
        completed: () => [],\n\
        allCompleted: () => true,\n\
    }\n\
var todos = \n\
    <section> \n\
        <section className="todoapp"> \n\
            <header className="header"> \n\
                <h1>todos</h1>\n\
                <input className="new-todo" placeholder="What needs to be done?" autoFocus={true} \n\
                    {...data(ctrl.newTitle, "keydown")} \n\
                    {...onkey("enter", ctrl.create)}\n\
					{...onkey("esc", () => ctrl.newTitle(""))} />\n\
            </header>\n\
            <section className="main" hidden={ctrl.all().length === 0}>\n\
                <input className="toggle-all" type="checkbox" \n\
                    checked={ctrl.allCompleted()} />\n\
                <label htmlFor="toggle-all" onClick={() => ctrl.setAll(!ctrl.allCompleted())}>Mark all as complete</label>\n\
                <ul className="todo-list">\n\
                    {mapSample(ctrl.displayed, todo =>\n\
                        <li className={cx({ completed: todo.completed(), editing: todo.editing() })}>\n\
                            <div className="view">\n\
                                <input className="toggle" type="checkbox" {...data(todo.completed)} />\n\
                                <label onDoubleClick={todo.startEditing}>{todo.title()}</label>\n\
                                <button className="destroy" onClick={todo.remove}></button>\n\
                            </div>\n\
                            <input className="edit" \n\
                                {...data(todo.title, "keyup")}\n\
                                onBlur={() => todo.endEditing(true)}\n\
							    {...onkey("enter", () => todo.endEditing(true))}\n\
							    {...onkey("esc", () => todo.endEditing(false))}\n\
							    {...focus(todo.editing())} />\n\
                        </li>\n\
                    )}\n\
                </ul>\n\
            </section>\n\
            <footer className="footer" hidden={ctrl.all().length === 0}>\n\
                <span className="todo-count"><strong>{ctrl.remaining().length}</strong> item{ctrl.remaining().length === 1 ? "" : "s"} left</span>\n\
                <ul className="filters">\n\
                    <li>\n\
                        <a className={cx({ selected: ctrl.filter() === null })} href="#/">All</a>\n\
                    </li>\n\
                    <li>\n\
                        <a className={cx({ selected: ctrl.filter() === false })} href="#/active">Active</a>\n\
                    </li>\n\
                    <li>\n\
                        <a className={cx({ selected: ctrl.filter() === true })} href="#/completed">Completed</a>\n\
                    </li>\n\
                </ul>\n\
                <button className="clear-completed" onClick={ctrl.clearCompleted} hidden={ctrl.completed().length === 0}>Clear completed</button>\n\
            </footer>\n\
        </section>\n\
        <footer className="info">\n\
            <p>Double-click to edit a todo</p>\n\
            <p>Template by <a href="http://sindresorhus.com">Sindre Sorhus</a></p>\n\
            <p>Created by <a href="https://github.com/adamhaile">Adam Haile</a></p>\n\
            <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>\n\
        </footer>\n\
    </section>', { sourcemap: 'append', sourcefile: 'complex.ts', targetfile: 'complex.js' });

        eval(code);
    });
});