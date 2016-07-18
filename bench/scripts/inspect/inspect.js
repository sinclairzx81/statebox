var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define("inspect", ["require", "exports"], function (require, exports) {
    "use strict";
    var Inspector = (function (_super) {
        __extends(Inspector, _super);
        function Inspector() {
            _super.apply(this, arguments);
        }
        Inspector.prototype.componentDidMount = function () {
            var _this = this;
            this.props.box.observe().data(function () { return _this.forceUpdate(); });
        };
        Inspector.prototype.render = function () {
            var mapbox = function (box) {
                var value = (box.type() !== "array" &&
                    box.type() !== "object" &&
                    box.get() !== undefined)
                    ? box.get().toString() : "";
                return React.createElement("li", {key: box.id()}, React.createElement("span", null, "[", box.name() || "root", ": ", box.type() || "undefined", "] ", value), React.createElement("ul", null, box.inner().map(function (box) { return mapbox(box); })));
            };
            return React.createElement("div", {className: "inspect"}, React.createElement("div", {className: "header"}, React.createElement("h2", null, "box inspector")), React.createElement("div", {className: "content"}, React.createElement("ul", null, mapbox(this.props.box))));
        };
        return Inspector;
    }(React.Component));
    exports.Inspector = Inspector;
    exports.start = function (element, box) {
        return ReactDOM.render(React.createElement(Inspector, {box: box}), element);
    };
});
