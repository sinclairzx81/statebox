//--------------------------------------------------
// statebox + react todo list example.
//--------------------------------------------------

/// <reference path="typings/react/react.d.ts" />
/// <reference path="typings/react/react-dom.d.ts" />
/// <reference path="typings/statebox/statebox.d.ts" />

import {Box} from "statebox"

export class TodoList extends React.Component<{ box: Box<string[]> }, {}> {
    public componentDidMount() {
        this.props.box.observe().data(() => this.forceUpdate())
    }
    public render() {
        let items = this.props.box.inner().map(box => <li key={box.id()}>{box.get()}</li>)
        return <div className="list"> 
            <ul>{items}</ul>
        </div>
    }
}

export class TodoControls extends React.Component<{ box: Box<string[]> }, {}> {
    private handleAdd() {
        let input = this.refs["input"] as HTMLInputElement
        if(input.value.length > 0) {
            let items = this.props.box.get()
            items.push(input.value)
            this.props.box.set(items)
            input.value = ''
        }
    }

    private handleClear() {
        this.props.box.set([])
    }
    
    private keyPress(e) {
        if(e.key === "Enter")
            this.handleAdd()
    }

    render() {
        return <div className="controls">
            <input ref="input" type="text" onKeyPress={this.keyPress.bind(this)} placeholder="enter todo here" />
            <input type="button" value="+" onClick={this.handleAdd.bind(this)} />
            <input type="button" value="0" onClick={this.handleClear.bind(this)} />
        </div>
    }
}

export class Todo extends React.Component<{ box: Box<string[]> }, {}> {
    public render() {
        this.props.box.default([])
        return <div className="todos">
            <div className="header">
                <h2>todo list</h2>
            </div>
            <div className="content">
                <TodoControls box={ this.props.box } />
                <TodoList     box={ this.props.box } />
            </div>
        </div>
    }
}

export const start = (element: HTMLElement, box: Box<any>) =>
    ReactDOM.render(<Todo box={box} />, element)