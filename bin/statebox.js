/*--------------------------------------------------------------------------

statebox - uri addressable observable state.

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
define("statebox", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    function reflect(obj) {
        if (obj === null || obj === undefined)
            return "undefined";
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
    /**
     * returns of the given string is a numeric value.
     * @param {string} the string to test.
     * @returns {boolean} true if the string is numeric.
     */
    function isNumericString(value) {
        return !isNaN(value);
    }
    /**
     * Box:
     * A container type for state. A box can be viewed
     * as a node in a state graph, providing get / set
     * operations on the state, as well as allowing
     * observation on the state.
     */
    var Box = (function () {
        /**
         * creates a new box.
         * @param {any?} the value to initialize this box with.
         * @returns {Box}
         */
        function Box(value) {
            this.subscribers = new Array();
            this.type = "undefined";
            this.value = undefined;
            this.set(value);
        }
        /**
         * returns the simple typename of the object inside this box.
         * @returns {string}
         */
        Box.prototype.typename = function () {
            return this.type;
        };
        /**
         * returns keys or indices to child boxes. Only valid for
         * object and array types. All other types return an empty
         * array.
         * @returns {Array<string>|Array<number>}
         */
        Box.prototype.keys = function () {
            switch (this.type) {
                case "undefined":
                case "function":
                case "string":
                case "number":
                case "boolean":
                case "date":
                    return [];
                case "array":
                    return this.value.map(function (_, index) { return index; });
                case "object":
                    return Object.keys(this.value);
                default: break;
            }
        };
        /**
         * observes state changes on this box.
         * @param {(data: any) => void} a callback containing the new value.
         * @returns {void}
         */
        Box.prototype.observe = function (func) {
            this.subscribers.push(func);
        };
        /**
         * The addr function returns the box by path.
         * @param {string | number} a key or array index of the box to use.
         * @returns {State}
         */
        Box.prototype.addr = function (path) {
            var parts = path.split("/");
            var box = this;
            while (parts.length > 0) {
                var part = parts.shift();
                box = box.use(part);
            }
            return box;
        };
        /**
         * The use function returns or creates a inner box for under this box.
         * If this box is uninitialized, it will be initialized as a object and
         * populated with a new box with the given key. valid for object and
         * array box types.
         * @param {string | number} a key or array index of the box to use.
         * @returns {State}
         */
        Box.prototype.use = function (key) {
            /**
             * validate key:
             * here we validate the key, we only accept
             * strings and numbers.
             */
            var key_type = reflect(key);
            if (key_type !== "number" && key_type !== "string") {
                throw Error("use: invalid key type, expected number or string.");
            }
            /**
             * conditional initialization:
             * if this box is uninitialized, we initialize it
             * in preparation for the new inner box with the
             * given key. To do this, we need to check the
             * type of the key. Users passing Restful URI's
             * with numeric values are likely expecting the
             * object to be initialized as an array. The
             * code below preforms these tests and initializes
             * the object accordingly.
             */
            if (this.value === undefined) {
                if (key_type === "number") {
                    this.type = "array";
                    this.value = [];
                }
                else if (key_type === "string") {
                    if (isNumericString(key)) {
                        this.type = "array";
                        this.value = [];
                    }
                    else {
                        this.type = "object";
                        this.value = {};
                    }
                }
            }
            /**
             * validate this type.
             * use is only valid for objects and arrays. We
             * check here that is the case and throw if not.
             */
            if (this.type === "object" || this.type == "array") {
                if (this.value[key] === undefined) {
                    this.value[key] = new Box();
                    this.value[key].parent = this;
                }
                return this.value[key];
            }
            else {
                throw Error("the use() function cannot be called on object and array types.");
            }
        };
        /**
         * The drop function will drop a objects inner box if it exists. Valid
         * for object and array box types.
         * @param {string|number} the key or index to drop.
         * @returns {}
         */
        Box.prototype.drop = function (key, notify) {
            if (notify === undefined)
                notify = true;
            if (this.value === undefined)
                return;
            if (this.value[key] !== undefined) {
                delete this.value[key];
                if (notify === true)
                    this.dispatch();
            }
        };
        /**
         * sets the value of this state object.
         * @param {string} the value to set this state to.
         * @param {boolean?} should this change cause a notification?
         * @returns {State}
         */
        Box.prototype.set = function (value, nofify) {
            var _this = this;
            if (nofify === undefined)
                nofify = true;
            var typename = reflect(value);
            switch (typename) {
                case "undefined":
                case "function":
                case "string":
                case "number":
                case "boolean":
                case "date":
                    this.type = typename;
                    this.value = value;
                    if (nofify === true)
                        this.dispatch();
                    break;
                case "box":
                    this.type = value.type;
                    this.value = value.value;
                    this.subscribers = [].concat(this.subscribers, value.subscribers);
                    this.subscribers.reduce(function (acc, subscriber) {
                        if (acc.indexOf(subscriber) === -1)
                            acc.push(subscriber);
                        return acc;
                    }, []);
                    if (nofify === true)
                        this.dispatch();
                    break;
                case "array":
                    this.type = typename;
                    this.value = value.map(function (value) {
                        var box = new Box();
                        box.parent = _this;
                        box.set(value, false);
                        return box;
                    });
                    if (nofify === true)
                        this.dispatch();
                    break;
                case "object":
                    this.type = typename;
                    this.value = Object.keys(value).reduce(function (acc, key) {
                        acc[key] = new Box();
                        acc[key].parent = _this;
                        acc[key].set(value[key], false);
                        return acc;
                    }, {});
                    if (nofify === true)
                        this.dispatch();
                    break;
                default: break;
            }
        };
        /**
         * returns the javascript state housed by this box. The
         * state is recursively gather from this and inner boxes
         * to build up the resulting object.
         * @returns {any}
         */
        Box.prototype.get = function () {
            var _this = this;
            switch (this.type) {
                case "undefined":
                case "function":
                case "string":
                case "number":
                case "boolean":
                case "date":
                    return this.value;
                case "array":
                    return this.value.map(function (state) { return state.get(); });
                case "object":
                    return Object.keys(this.value).reduce(function (acc, key) { acc[key] = _this.value[key].get(); return acc; }, {});
            }
        };
        /**
         * (internal) dispatches the a change event to observers.
         * @returns {void}
         */
        Box.prototype.dispatch = function () {
            var _this = this;
            this.subscribers.forEach(function (subscriber) { return subscriber(_this.get()); });
            if (this.parent !== undefined) {
                this.parent.dispatch();
            }
        };
        return Box;
    }());
    exports.Box = Box;
});
