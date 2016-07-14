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

export type TypeName = "undefined"
    | "function"
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "box"
    | "array"
    | "object"

/**
 * reflects the given type, returning its simple typename.
 * @param {any} the object to reflect.
 * @returns {TypeName}
 */
function reflect(obj: any): TypeName {
    if (obj === null || obj === undefined) return "undefined"
    if (typeof obj === "function") return "function"
    if (typeof obj === "string") return "string"
    if (typeof obj === "number") return "number"
    if (typeof obj === "boolean") return "boolean"
    if (typeof obj === "object") {
        if (obj instanceof Box) return "box"
        if (obj instanceof Array) return "array"
        if (obj instanceof Date) return "date"
    } return "object"
}

function clone(value: any, typename: TypeName) : any {
    switch(typename) {
        case "undefined": return undefined;
        case "function":  return eval("(function() {return "+value.toString()+"})()")
        case "string":    return value.slice(0)
        case "number":    return value + 0
        case "boolean":   return !!value
        case "date":      return new Date(value.getTime())
        case "object":    throw Error("attempted to clone an object.")
        case "array":     throw Error("attempted to clone an array.")
    }
} 

/**
 * returns true if the given string is a numeric value. Used
 * for array indexing on the into() and addr() functions.
 * @param {string} the string to test.
 * @returns {boolean} true if the string is numeric.
 */
function isNumericString(value: string): boolean {
    return !isNaN(<any>value)
}

/**
 * Disposable interface.
 */
export interface Disposable {
    dispose()
}
/**
 * Box interface.
 */
export interface IBox {
    type       (): TypeName
    drop       () : IBox
    into       (path: string): IBox
    keys       () : Array<number | string>
    get    <T> () : T
    set    <T> (value: T,     notify? : boolean)      : void
    observe<T> (func: (data: T) => void): Disposable
}

/**
 * Box:
 * A container type for unit of state. A box can be viewed
 * as a node within a large state graph, providing get / set
 * operations on the state, as well as allowing
 * observation on the state.
 */
export class Box implements IBox {
    private parent     : Box
    private typename   : TypeName
    private value      : any
    private subscribers: Array<(data: any) => void>

    /**
     * creates a new box.
     * @param {any?} optional value to initialize this box with.
     * @returns {Box}
     */
    constructor(initial?: any) {
        this.subscribers = new Array<(data: any) => void>()
        this.set(initial)
    }

   /**
     * returns keys or indices to child boxes. Only valid for
     * object and array types. All other types return an empty 
     * array. Callers can use this to recursively traverse the 
     * state graph.
     * @returns {Array<string>|Array<number>}
     */
    public keys(): Array<string | number> {
        switch (this.typename) {
            case "undefined":
            case "function":
            case "string":
            case "number":
            case "boolean":
            case "date":
                return []
            case "array":
                return this.value.map((_, index) => index)
            case "object":
                return Object.keys(this.value)
            default: break;
        }
    }
    /**
     * returns the simple typename of the object inside this box.
     * @returns {string}
     */
    public type(): TypeName {
        return this.typename
    }

    /**
     * Returns the box at the given path. If no box exists at the 
     * given path, the box is contructed with a undefined value.
     * @param {string | number} the path into this box.
     * @returns {IBox}
     */
    public into(path: string): IBox {
        let box  : Box     = this
        let parts: string[] = path.split("/")
        while (parts.length > 0) {
            let part = parts.shift()
            box = box.use(part)
        } return box
    }

    /**
     * The use function returns or creates a inner box for under this box.
     * If this box is uninitialized, it will be initialized as a object and 
     * populated with a new box with the given key. valid for object and 
     * array box types.
     * @param {string | number} a key or array index of the box to use.
     * @returns {State}
     */
    private use(key: string | number): Box {

        /**
         * validate key:
         * here we validate the key, we only accept
         * strings and numbers.
         */
        let key_type = reflect(key)
        if (key_type !== "number" && key_type !== "string") {
            throw Error("invalid key type, expected number or string.")
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
                this.typename = "array"
                this.value = []
            }
            else if (key_type === "string") {
                if (isNumericString(<string>key)) {
                    this.typename = "array"
                    this.value = []
                } else {
                    this.typename = "object"
                    this.value = {}
                }
            }
        }

        /**
         * validate this type.
         * use is only valid for objects and arrays. We 
         * check here that is the case and throw if not.
         */
        if (this.typename === "object" || this.typename == "array") {
            if (this.value[key] === undefined) {
                this.value[key] = new Box()
                this.value[key].parent = this
            }
            return this.value[key]
        } else {
            throw Error("use() and addr() functions can only be called on object and array box types.")
        }
    }

    /**
     * drops this box from its parent, removing
     * it from the state graph. If this box has no 
     * parent, no action is taken.
     * @returns {IBox}
     */
    public drop(): IBox {
        if(this.parent !== undefined) {
            switch(this.parent.typename) {
                case "undefined":
                case "function":
                case "string":
                case "number":
                case "boolean":
                case "date":
                    throw Error("attempted to drop a box with invalid parent.")
                case "array":
                    this.parent.value = this.parent.value.filter(box => box !== this)
                    this.parent.dispatch()
                    this.parent = undefined
                    break;
                case "object":
                    let key = Object.keys(this.parent.value).reduce((acc, key) => {
                        if(this.parent.value[key] === this) acc = key
                        return acc
                    }, undefined)
                    if(key === undefined) throw Error("unable to this box within its parent.")
                    delete this.parent.value[key]
                    this.parent.dispatch()
                    this.parent = undefined
                    break;
            }
        } return this
    }

    /**
     * sets the value managed by this box. this function
     * will wrap each value, object and array as a box
     * and merge it within the state graph.
     * @param {T} The value to set this box to.
     * @param {boolean?} should this change cause a notification?
     * @returns {void}
     */
    public set<T>(value: T, nofify?: boolean): void {
        if (nofify === undefined) nofify = true
        let typename = reflect(value)
        switch (typename) {
            case "undefined":
            case "function":
            case "string":
            case "number":
            case "boolean":
            case "date":
                this.typename = typename
                this.value    = clone(value, typename)
                if (nofify === true) this.dispatch()
                break
            case "box":
                let box = <Box><any>value
                this.set(box.value)
                this.subscribers = box.subscribers.reduce((acc, subscriber) => {
                    if(acc.indexOf(subscriber) === -1) acc.push(subscriber)
                    return acc
                }, this.subscribers)
                if (nofify === true) this.dispatch()
                break;
            case "array":
                let array     = <Array<any>><any>value
                this.typename = typename
                this.value    = array.map(value => {
                    let box    = new Box()
                    box.parent = this
                    box.set(value, false)
                    return box
                })
                if (nofify === true) this.dispatch()
                break
            case "object":
                let obj       = <any>value
                this.typename = typename
                this.value    = Object.keys(obj).reduce((acc, key) => {
                    acc[key] = new Box()
                    acc[key].parent = this
                    acc[key].set(obj[key], false)
                    return acc
                }, {}) as any
                if (nofify === true) this.dispatch()
                break
            default: break;
        }
    }

    /**
     * returns the state managed by this box. The state
     * returned is a typical javascript object, and is 
     * resolved by traversing the state graph, gathering
     * values along the way.
     * @returns {T}
     */
    public get<T>(): T {
        switch (this.typename) {
            case "undefined":
            case "function":
            case "string":
            case "number":
            case "boolean":
            case "date":
                return this.value
            case "array":
                return <T>this.value.map(state => state.get())
            case "object":
                return <T>Object.keys(this.value).reduce((acc, key) => { acc[key] = this.value[key].get(); return acc }, {}) as T
        }
    }

    /**
     * observes state changes on this box. The given callback is
     * invoked immediately with the current state of this box and 
     * then added to a observer subscription list, in which any 
     * modifications of this box's state will have the callback
     * invoked with the 'updated' state. Callers can unsubscribe 
     * by calling dispose() on the returned object.
     * @param   {(data: T) => void} a callback that will be passed the 'current' state of this box.
     * @returns {Disposable}
     */
    public observe<T>(func: (data: T) => void): Disposable {
        func(this.get<T>())
        this.subscribers.push(func)
        return {
            dispose: () => {
                let index = this.subscribers.indexOf(func)
                this.subscribers.splice(index, 1)
            }
        }
    }

    /**
     * (internal) dispatches the current state to each
     * subscriber of this box. This function will traverse
     * the state graph from this box back to the parent,
     * notifying each box along the way of state changes.
     * @returns {void}
     */
    private dispatch(): void {
        this.subscribers.forEach(subscriber => subscriber(this.get()))
        if (this.parent !== undefined) {
            this.parent.dispatch()
        }
    }
}
