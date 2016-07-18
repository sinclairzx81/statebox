define("statebox", ["require", "exports"], function (require, exports) {
    "use strict";
    var util;
    (function (util) {
        function uuid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        util.uuid = uuid;
        function reflect(obj) {
            if (obj === undefined)
                return "undefined";
            if (obj === null)
                return "null";
            if (typeof obj === "function")
                return "function";
            if (typeof obj === "string")
                return "string";
            if (typeof obj === "number")
                return "number";
            if (typeof obj === "boolean")
                return "boolean";
            if (typeof obj === "object") {
                if (obj instanceof Box)
                    return "box";
                if (obj instanceof Array)
                    return "array";
                if (obj instanceof Date)
                    return "date";
            }
            return "object";
        }
        util.reflect = reflect;
        function copy(value) {
            switch (reflect(value)) {
                case "undefined": return undefined;
                case "null": return null;
                case "string": return value.slice(0);
                case "number": return (value + 0);
                case "boolean": return (!!value);
                case "date": return new Date(value.getTime());
                case "box": return value.get();
                case "object":
                    return Object.keys(value).reduce(function (obj, key) {
                        obj[key] = copy(value[key]);
                        return obj;
                    }, {});
                case "array":
                    return value.map(function (value) { return copy(value); });
                default:
                    throw Error("unable to copy value " + value.toString());
            }
        }
        util.copy = copy;
        function equals(left, right) {
            var type_left = util.reflect(left);
            var type_right = util.reflect(right);
            if (type_left !== type_right)
                return false;
            switch (type_left) {
                case "undefined": return true;
                case "null": return true;
                case "string": return left === right;
                case "number": return left === right;
                case "boolean": return left === right;
                case "date": return left.getTime() === right.getTime();
                case "object":
                    var keys_left = Object.keys(left);
                    var keys_right = Object.keys(right);
                    if (util.equals(keys_left, keys_right) === false)
                        return false;
                    var values_left = keys_left.map(function (key) { return left[key]; });
                    var values_right = keys_right.map(function (key) { return right[key]; });
                    return util.equals(values_left, values_right);
                case "array":
                    if (left.length !== right.length)
                        return false;
                    for (var i = 0; i < left.length; i++) {
                        if (util.equals(left[i], right[i]) === false)
                            return false;
                    }
                    return true;
                default: throw Error("unable to compare types");
            }
        }
        util.equals = equals;
        function merge(left, right) {
            var left_type = util.reflect(left);
            var right_type = util.reflect(right);
            if (left_type !== right_type)
                return util.copy(right);
            switch (left_type) {
                case "object":
                    return Object.keys(right).reduce(function (left, key) {
                        left[key] = util.copy(right[key]);
                        return left;
                    }, left);
                case "array":
                    return [].concat(util.copy(left), util.copy(right));
                default:
                    return right;
            }
        }
        util.merge = merge;
    })(util || (util = {}));
    var Observer = (function () {
        function Observer() {
            this.data_cb = new Array();
            this.sync_cb = new Array();
            this.end_cb = new Array();
        }
        Observer.prototype.sync = function (func) {
            this.sync_cb.push(func);
            return this;
        };
        Observer.prototype.data = function (func) {
            this.data_cb.push(func);
            return this;
        };
        Observer.prototype.end = function (func) {
            this.end_cb.push(func);
            return this;
        };
        Observer.prototype.send_next = function (next) {
            this.data_cb.forEach(function (callback) { return callback(next.data); });
            this.sync_cb.forEach(function (callback) { return callback(next.sync); });
        };
        Observer.prototype.send_end = function (object) {
            this.end_cb.forEach(function (callback) { return callback(object.data); });
        };
        Observer.prototype.dispose = function () {
            this.data_cb = new Array();
            this.sync_cb = new Array();
            this.end_cb = new Array();
        };
        return Observer;
    }());
    exports.Observer = Observer;
    var Box = (function () {
        function Box(initial) {
            this._observers = new Array();
            this._id = util.uuid();
            this._parent = undefined;
            this._name = undefined;
            this._type = undefined;
            this._state = undefined;
            this.set(initial);
        }
        Box.prototype.id = function () {
            return this._id;
        };
        Box.prototype.name = function () {
            return this._name;
        };
        Box.prototype.type = function () {
            return this._type;
        };
        Box.prototype.iter = function () {
            switch (this._type) {
                case "object":
                case "array":
                    return this._state.map(function (box) { return box.key; }).filter(function (key) { return key !== undefined; }).filter(function (key) { return key.length > 0; });
                default:
                    return [];
            }
        };
        Box.prototype.inner = function () {
            if (this._type === "object" || this._type === "array") {
                return (this._state === undefined) ? [] : this._state;
            }
            return [];
        };
        Box.prototype.path = function () {
            var current = this;
            var buffer = [];
            while (current.parent !== undefined) {
                var iter = current.parent.iter();
                for (var i = 0; i < iter.length; i++) {
                    if (current.key === iter[i]) {
                        buffer.unshift(current.key);
                        break;
                    }
                }
                current = current.parent;
            }
            return buffer.join("/");
        };
        Box.prototype.into = function (name) {
            var _name = name.toString();
            if (this._state === undefined) {
                this._type = isNaN(_name) ? "object" : "array";
                this._state = [];
            }
            switch (this._type) {
                case "array":
                    if (isNaN(_name))
                        throw Error("cannot move into an array with a string.");
                    if (this._state[_name] === undefined) {
                        var box_1 = new Box();
                        box_1._parent = this;
                        box_1._name = _name;
                        this._state[_name] = box_1;
                    }
                    return this._state[_name];
                case "object":
                    var box = this._state.reduce(function (acc, box) {
                        if (box._name === _name)
                            acc = box;
                        return acc;
                    }, undefined);
                    if (box === undefined) {
                        box = new Box();
                        box._name = _name;
                        box._parent = this;
                        this._state.push(box);
                    }
                    return box;
                default: throw Error("cannot move a value.");
            }
        };
        Box.prototype.with = function (path) {
            if (path.length === 0)
                return this;
            var current = this;
            var names = path.split("/").filter(function (name) { return name.length > 0; });
            while (names.length > 0) {
                current = current.into(names.shift());
            }
            return current;
        };
        Box.prototype.get = function () {
            switch (this._type) {
                case "object":
                    return this._state.reduce(function (acc, box) {
                        acc[box.key] = box.get();
                        return acc;
                    }, {});
                case "array":
                    return this._state.map(function (value) { return value.get(); });
                default:
                    return util.copy(this._state);
            }
        };
        Box.prototype.set = function (value, notify) {
            var _this = this;
            if (util.equals(this.get(), value))
                return;
            if (notify === undefined)
                notify = true;
            this.inner().forEach(function (box) { return box.dispose(); });
            this._type = util.reflect(value);
            switch (this._type) {
                case "box":
                    this.set(value.get());
                    break;
                case "object":
                    this._state = Object.keys(value).map(function (key) {
                        var box = new Box();
                        box._name = key;
                        box._parent = _this;
                        box.set(util.copy(value[key]), false);
                        return box;
                    });
                    break;
                case "array":
                    this._state = value.map(function (value, key) {
                        var box = new Box();
                        box._name = key.toString();
                        box._parent = _this;
                        box.set(util.copy(value), false);
                        return box;
                    });
                    break;
                default:
                    this._state = util.copy(value);
                    break;
            }
            if (notify)
                this.publish();
            return this;
        };
        Box.prototype.mix = function (value) {
            var mixed = util.merge(this.get(), value);
            this.set(mixed);
            return this;
        };
        Box.prototype.default = function (value) {
            if (this.get() === undefined) {
                this.set(value);
            }
            return this;
        };
        Box.prototype.sync = function (sync) {
            this.with(sync.path).set(sync.data);
            return this;
        };
        Box.prototype.observe = function () {
            var observer = new Observer();
            this._observers.push(observer);
            return observer;
        };
        Box.prototype.publish = function () {
            var _this = this;
            var current = this;
            while (current !== undefined) {
                current._observers.forEach(function (observer) {
                    var next = {
                        data: current.get(),
                        sync: {
                            path: _this.path(),
                            data: _this.get()
                        }
                    };
                    observer.send_next(next);
                });
                current = current._parent;
            }
            return this;
        };
        Box.prototype.dispose = function () {
            var _this = this;
            this.inner().forEach(function (box) { return box.dispose(); });
            this._observers.forEach(function (observer) {
                observer.send_end({ data: _this.get() });
            });
            this._parent = undefined;
        };
        return Box;
    }());
    exports.Box = Box;
});
