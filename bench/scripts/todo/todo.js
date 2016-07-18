var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define("todo", ["require", "exports"], function (require, exports) {
    "use strict";
    var TodoList = (function (_super) {
        __extends(TodoList, _super);
        function TodoList() {
            _super.apply(this, arguments);
        }
        TodoList.prototype.componentDidMount = function () {
            var _this = this;
            this.props.box.observe().data(function () { return _this.forceUpdate(); });
        };
        TodoList.prototype.render = function () {
            var items = this.props.box.inner().map(function (box) { return React.createElement("li", {key: box.id()}, box.get()); });
            return React.createElement("div", {className: "list"}, React.createElement("ul", null, items));
        };
        return TodoList;
    }(React.Component));
    exports.TodoList = TodoList;
    var TodoControls = (function (_super) {
        __extends(TodoControls, _super);
        function TodoControls() {
            _super.apply(this, arguments);
        }
        TodoControls.prototype.handleAdd = function () {
            var input = this.refs["input"];
            if (input.value.length > 0) {
                var items = this.props.box.get();
                items.push(input.value);
                this.props.box.set(items);
                input.value = '';
            }
        };
        TodoControls.prototype.handleClear = function () {
            this.props.box.set([]);
        };
        TodoControls.prototype.keyPress = function (e) {
            if (e.key === "Enter")
                this.handleAdd();
        };
        TodoControls.prototype.render = function () {
            return React.createElement("div", {className: "controls"}, React.createElement("input", {ref: "input", type: "text", onKeyPress: this.keyPress.bind(this), placeholder: "enter todo here"}), React.createElement("input", {type: "button", value: "+", onClick: this.handleAdd.bind(this)}), React.createElement("input", {type: "button", value: "0", onClick: this.handleClear.bind(this)}));
        };
        return TodoControls;
    }(React.Component));
    exports.TodoControls = TodoControls;
    var Todo = (function (_super) {
        __extends(Todo, _super);
        function Todo() {
            _super.apply(this, arguments);
        }
        Todo.prototype.render = function () {
            this.props.box.default([]);
            return React.createElement("div", {className: "todos"}, React.createElement("div", {className: "header"}, React.createElement("h2", null, "todo list")), React.createElement("div", {className: "content"}, React.createElement(TodoControls, {box: this.props.box}), React.createElement(TodoList, {box: this.props.box})));
        };
        return Todo;
    }(React.Component));
    exports.Todo = Todo;
    exports.start = function (element, box) {
        return ReactDOM.render(React.createElement(Todo, {box: box}), element);
    };
});
