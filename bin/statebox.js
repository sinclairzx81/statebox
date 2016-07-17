/*--------------------------------------------------------------------------

statebox - It's a box with some state inside.

The MIT License (MIT)

Copyright (c) 2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/
"use strict";
/**
 * utilities:
 * common utilities for manipulating with
 * objects and keys.
 */
var util;
(function (util) {
    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
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
    /**
     * returns a deep copy of the given object.
     * @params {any} the value to clone.
     * @params {string} a reflected typename if known.
     * @returns {any} a clone of the given object.
     */
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
    /**
     * tests the left and right object for equality.
     * @param {any} the left object.
     * @param {any} the right object.
     * @returns {boolean}
     */
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
    /**
     * merges the right object on the left object. The right
     * object is treated as the dominate object, overwritting
     * conflicting state on the left.
     * Objects will only merge if both left and right are either
     * objects or arrays. In all other cases, the right object
     * return be returned.
     * @param {any} the left object
     * @param {any} the right object.
     */
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
})(util = exports.util || (exports.util = {}));
/**
 * Observable:
 * provides state observation services.
 */
var Observer = (function () {
    /**
     * creates a new observer.
     * @returns {Observer}
     */
    function Observer() {
        this.data_cb = new Array();
        this.sync_cb = new Array();
        this.end_cb = new Array();
    }
    /**
     * subscribes to synchronization events.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    Observer.prototype.sync = function (func) {
        this.sync_cb.push(func);
        return this;
    };
    /**
     * subscribes to state changes events.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    Observer.prototype.data = function (func) {
        this.data_cb.push(func);
        return this;
    };
    /**
     * subscribes to this states end event.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    Observer.prototype.end = function (func) {
        this.end_cb.push(func);
        return this;
    };
    /**
     * dispatches this observer event to listeners.
     * @param {ObserverDispatchEvent} the event.
     * @returns {void}
     */
    Observer.prototype.sendNext = function (next) {
        this.data_cb.forEach(function (callback) { return callback(next.data); });
        this.sync_cb.forEach(function (callback) { return callback(next.sync); });
    };
    /**
     * dispatches this observer event to listeners.
     * @param {ObserverDispatchEvent} the event.
     * @returns {void}
     */
    Observer.prototype.sendEnd = function (object) {
        this.end_cb.forEach(function (callback) { return callback(object.data); });
    };
    /**
     * disposes of this observer.
     * @returns {void}
     */
    Observer.prototype.dispose = function () {
        this.data_cb = new Array();
        this.sync_cb = new Array();
        this.end_cb = new Array();
    };
    return Observer;
}());
exports.Observer = Observer;
/**
 * Box:
 *
 * Encapsulates immutable state and provides
 * state synchronization.
 */
var Box = (function () {
    /**
     * creates a new box with the given state.
     * @param {any} the initial state for this box.
     * @returns {Box}
     */
    function Box(initial) {
        this.observers = new Array();
        this.parent = undefined;
        this.key = undefined;
        this.typeid = undefined;
        this.state = undefined;
        this.set(initial);
    }
    /**
     * returns the type of this box.
     * @returns {string}
     */
    Box.prototype.type = function () {
        return this.typeid;
    };
    /**
     * returns an iterator for each inner box.
     * @returns {Array<string>}
     */
    Box.prototype.iter = function () {
        switch (this.typeid) {
            case "object":
            case "array":
                return this.state.map(function (box) { return box.key; }).filter(function (key) { return key !== undefined; }).filter(function (key) { return key.length > 0; });
            default:
                return [];
        }
    };
    /**
     * returns the boxes under this box.
     * @returns {Array<Box>}
     */
    Box.prototype.inner = function () {
        if (this.typeid === "object" || this.typeid === "array") {
            return (this.state === undefined) ? [] : this.state;
        }
        return [];
    };
    /**
     * returns the path of this box in respect to the root.
     * @returns {string}
     */
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
    /**
     * moves into a inner box with the given key.
     * @param {string} the inner box's key.
     * @returns {Box}
     */
    Box.prototype.into = function (indexer) {
        var key = indexer.toString();
        if (this.state === undefined) {
            this.typeid = isNaN(indexer) ? "object" : "array";
            this.state = [];
        }
        switch (this.typeid) {
            case "array":
                if (isNaN(key))
                    throw Error("cannot move into an array with a string.");
                if (this.state[key] === undefined) {
                    var box_1 = new Box();
                    box_1.parent = this;
                    box_1.key = key;
                    this.state[key] = box_1;
                }
                return this.state[key];
            case "object":
                var box = this.state.reduce(function (acc, box) {
                    if (box.key === key)
                        acc = box;
                    return acc;
                }, undefined);
                if (box === undefined) {
                    box = new Box();
                    box.key = key;
                    box.parent = this;
                    this.state.push(box);
                }
                return box;
            default: throw Error("cannot move a value.");
        }
    };
    /**
     * moves into the box that matches the given path.
     * @returns {IBox}
     */
    Box.prototype.with = function (path) {
        if (path.length === 0)
            return this;
        var current = this;
        var keys = path.split("/").filter(function (key) { return key.length > 0; });
        while (keys.length > 0) {
            current = current.into(keys.shift());
        }
        return current;
    };
    /**
     * gets the value stored in this box.
     * @returns {any}
     */
    Box.prototype.get = function () {
        switch (this.typeid) {
            case "object":
                return this.state.reduce(function (acc, box) {
                    acc[box.key] = box.get();
                    return acc;
                }, {});
            case "array":
                return this.state.map(function (value) { return value.get(); });
            default:
                return util.copy(this.state);
        }
    };
    /**
     * mix the value in this box with the given value.
     * @param {any} the value to mix
     * @returns {void}
     */
    Box.prototype.mix = function (value) {
        var mixed = util.merge(this.get(), value);
        this.set(mixed);
        return this;
    };
    /**
     * sets the value in this box.
     * @param {any} the value to set.
     * @param {boolean} flag indicating if a notification is raised.
     * @returns {Box}
     */
    Box.prototype.set = function (value, notify) {
        var _this = this;
        if (util.equals(this.get(), value))
            return;
        if (notify === undefined)
            notify = true;
        /**
         * dispose of inner boxes.
         *
         * Because a set will cause this boxes,
         * internals to be written, that is liable
         * to leave a lot of dangling observers.
         *
         * Below, we iterate through any inner
         * boxes, and dispose of them. Dispose
         * is a recursive down dispose, signalling
         * that all objects down from this are
         * gone.
         */
        this.inner().forEach(function (box) { return box.dispose(); });
        /**
         * update the typeid of this box.
         */
        this.typeid = util.reflect(value);
        /**
         * set the state.
         *
         * Here, we set the state for this box.
         * All state is encoded into a tree of
         * boxes, with the leaf nodes containing
         * actual values. Otherwise, the box is
         * a container (object or array).
         */
        switch (this.typeid) {
            case "box":
                this.set(value.get());
                break;
            case "object":
                this.state = Object.keys(value).map(function (key) {
                    var box = new Box();
                    box.key = key;
                    box.parent = _this;
                    box.set(util.copy(value[key]), false);
                    return box;
                });
                break;
            case "array":
                this.state = value.map(function (value, key) {
                    var box = new Box();
                    box.key = key.toString();
                    box.parent = _this;
                    box.set(util.copy(value), false);
                    return box;
                });
                break;
            default:
                this.state = util.copy(value);
                break;
        }
        if (notify)
            this.publish();
        return this;
    };
    /**
     * synchronizes this object with the given sync object.
     * @param {Sync} the sync object emitted from a box observer.
     * @return {void}
     */
    Box.prototype.sync = function (sync) {
        this.with(sync.path).set(sync.data);
    };
    /**
     * returns a observable that a caller can use to observe state
     * and synchronization events.
     * @returns {Observable}
     */
    Box.prototype.observe = function () {
        var observer = new Observer();
        this.observers.push(observer);
        return observer;
    };
    /**
     * publishes the state of this box to all observers.
     * @returns {void}
     */
    Box.prototype.publish = function () {
        var _this = this;
        var current = this;
        while (current !== undefined) {
            current.observers.forEach(function (observer) {
                var next = {
                    data: current.get(),
                    sync: {
                        path: _this.path(),
                        data: _this.get()
                    }
                };
                observer.sendNext(next);
            });
            current = current.parent;
        }
    };
    /**
     * disposes of this box.
     * @returns {void}
     */
    Box.prototype.dispose = function () {
        var _this = this;
        this.inner().forEach(function (box) { return box.dispose(); });
        this.observers.forEach(function (observer) {
            observer.sendEnd({ data: _this.get() });
        });
    };
    return Box;
}());
exports.Box = Box;
