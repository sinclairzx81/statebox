/*--------------------------------------------------------------------------

statebox-ts - observable javascript state container.

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

import {uuid}              from "./common/uuid"
import {reflect}           from "./common/reflect"
import {signature}         from "./common/signature"
import {keys}              from "./common/keys"

export type Key = string | number

interface Cell {
    /**
     * the name of the type within the cell.
     * @returns {string}
     */
    type () : string
    /**
     * the inner boxes for this cell if its a container type (array / object)
     * @returns {Array<U>} an array of boxes.
     */
    inner() : Array<Box>
    /**
     * moves into the box with the given key.
     * @param {Key} A key or indexer.
     * @returns {Box<U>}
     */
    into(key: Key) : Box
    /**
     * drops a inner box with the given key.
     * @param {Key} A key or indexer.
     * @returns {Box<U>} the dropped box.
     */
    drop(key: Key) : Box
    /**
     * gets the value contained within this cell.
     * @returns {T}
     */
    get<T>() : T
}

/**
 * creates a new object cell.
 * @param {Box<T>} the box that owns this cell.
 * @param {T} the object to store.
 * @returns {Cell<T>}
 */
function CellObject(owner: Box, object: any) : Cell {
    const type = reflect.type(object)
    if(type !== "object") throw Error("attempted to store a " + type + " in a object cell.")
    const value  = Object.keys(object).reduce((acc, name) => {
        acc[name] = Box(owner, name, object[name])
        return acc
    }, {})
    function inner(): Array<Box> {
        return Object.keys(value).map(key => value[key])
    }
    function into(key: Key) : Box {
        let type = keys.type(key)
        if(type === "invalid") throw Error("the given key is invalid")
        if(type === "index")   key = key.toString()
        let index = <string>key
        if(value[index] === undefined) {
            value[index] = Box(owner, index, undefined)
        } return value[index]
    }
    function drop(key: Key) : Box {
        let type = keys.type(key)
        if(type === "invalid") throw Error("the given key is invalid")
        if(type === "index")   key = key.toString()
        let index = <string>key
        let box   = value[index]
        delete value[index]
        return box
    }
    function get <T>(): T {
        return <any>Object.keys(value).reduce((acc, name) => {
            acc[name] = value[name].get()
            return acc
        }, {})
    }
    return { type: () => type, inner, into, drop, get }
}

/**
 * creates a new array cell.
 * @param {Box<T>} the box that owns this cell.
 * @param {Array<T>} the array to cell.
 * @returns {Cell<T>}
 */
function CellArray(owner: Box, array: Array<any>) : Cell {
    const type = reflect.type(array)
    if(type !== "array") throw Error("attempted to store a " + type + " in a object cell.")
    const value = array.reduce((acc, value, key) => {
        acc[key] = Box(owner, key.toString(), value)
        return acc
    }, {})
    function inner(): Array<Box> {
        return Object.keys(value).map(key => value[key])
    }
    function into(key: Key): Box {
        let type = keys.type(key)
        if(type === "invalid")    throw Error("the given key is invalid")
        if(type === "key")        throw Error("cannot index into an array with a key.")
        let index = key.toString()
        if(value[index] === undefined)
            value[index] = Box(owner, index, undefined)
        return <Box><any>value[index.toString()]
    }
    function drop(key: Key) : Box {
        let type = keys.type(key)
        if(type === "invalid") throw Error("the given key is invalid")
        if(type === "key")     throw Error("cannot index into an array with a key.")
        let index = key.toString()
        let box   = value[index]
        delete value[index]
        return box
    }
    function get<T>(): T {
        return <T><any>Object.keys(value).reduce((acc, key) => {
            acc[parseInt(key)] = value[key].get()
            return acc 
        }, [])
    }
    return { type: () => type, inner, into, drop, get }
}

/**
 * creates a new value cell.
 * @param {Box<T>} the owner of this cell.
 * @param {T} the value to store.
 * @returns {Cell<T>}
 */
function CellValue(owner: Box, object: any) : Cell {
    const type  = reflect.type(object)
    if(type === "object") throw Error("attempted to store a object type in a value cell.")
    if(type === "array")  throw Error("attempted to store a array  type in a value cell.")
    const value = reflect.copy(object)
    function inner() : Array<Box> { return [] }
    function into (key: Key): Box { throw Error("cannot move into a boxed value.")  }
    function drop (key: Key): Box { throw Error("cannot call drop on a boxed value.")  }
    function get  ()              { return value }
    return { type: () => type, inner, into, drop, get }
}

/**
 * converts the given value into a cell.
 * @param {Box<any>} the owner of this cell.
 * @param {T} the value for the cell.
 * @returns {Cell<any>}
 */
function to_cell(owner: Box, value: any) : Cell {
    let v:any = value
    switch(reflect.type(v)) {
        case "object":    return CellObject (owner, v) 
        case "array" :    return CellArray  (owner, <Array<any>>v)        
        default:          return CellValue  (owner, v)
    }
}

export interface Box {
    /**
     * publishes the current state of this box 
     * to any subscribers.
     * @returns {Box<T>}
     */
    pub() : Box
    /**
     * subscribes state changes on this box.
     * @param {(T) => void} the subscriber function.
     * returns {Box<T>}
     */
    sub<T>(fn: (T) => void): Box
    /**
     * returns the unique identifier for this box.
     * @returns {string}
     */
    id () : string
    /**
     * returns the property name or indexer for this box.
     * @returns {string|undefined}
     */
    name () : string
    /**
     * returns the type managed by this box.
     * @returns {string}
     */
    type () : string
    /**
     * returns inner boxes parented by this box.
     * @returns {Array<Box<U>>}
     */
    inner() : Array<Box>
    /**
     * moves into an inner box.
     * @param {Key} the property name, indexer or path of the inner box.
     * @returns {Box<U>}
     */
    into (key: Key) : Box
    /**
     * drops a inner box.
     * @param {Key} the property name, indexer or path of the inner box.
     * @returns {Box<U>}
     */
    drop (key: Key) : Box
    /**
     * conditionally sets a value on this box
     * if its value is undefined.
     * @param {U} the value to set.
     * @returns {Box<U>}
     */
    ini<T>(value: T) : Box
    /**
     * maps the value of this box to another value.
     * @param {(T)=> U} the map function.
     * @returns {Box<U>}
     */
    map<T>(fn: (T) => any) : Box
    /**
     * sets the value of this box to the given value.
     * @param {U} the new value of this box.
     * @returns {Box<U>}
     */
    set<T> (value: T) : Box
    /**
     * returns the value managed by this box.
     * returns {T}
     */
    get<T>() : T
}

/**
 * creates a new box.
 */
export interface BoxFunction {
    /**
     * creates a new box with a undefined value.
     * @returns {Box}
     */
    <T>()          : Box

    /**
     * creates a new box with the given value.
     * @param {T} the value of this box.
     * @returns {Box}
     */
    <T>(value : T) : Box

    /**
     * 
     * (private) creates a new box with the given parent, name and value.
     * @param {Box} this box's parent.
     * @param {string} the name of this box (property or indexer)
     * @param {T} the value of this box.
     * @returns {Box}
     */
    <T>(parent: Box, name: string, value: T) : Box
}
const create = signature()
create.map([],      ()      => [undefined, undefined, undefined])
create.map(["any"], (value) => [undefined, undefined, value])
create.map(["object", "string", "any"])
create.into((parent: Box, _name: string, value: any) => {
    const parameter   = {  parent, name: _name, value }
    const identifier  = uuid.create()
    const subscribers = new Array<(T) => void>()
    const self        = { id, name, type, inner, pub, sub, into, drop, ini, set, map, get }
    let   cell        = to_cell(self, parameter.value)


    function id      () : string        { return identifier     }
    function name    () : string        { return parameter.name }
    function type    () : string        { return cell.type()    }
    function inner   () : Array<Box>    { return cell.inner()   }
    function sub  <T>(fn: (T) => void): Box {
        subscribers.push(fn)
        return self
    }
    function pub(): Box {
        subscribers.forEach(fn => fn(get()))
        if(parameter.parent !== undefined) 
            parameter.parent.pub()
        return self
    }
    function into(key: Key) : Box {
        let type = keys.type(key)
        switch(type) {
            case "index":
                cell = (cell.type() === "undefined") 
                     ? to_cell(self, <any>[]) 
                     : cell
                return cell.into(key)
            case "key":
                cell = (cell.type() === "undefined") 
                     ? to_cell(self, <any>{}) 
                     : cell
                return cell.into(key)
            case "path":
                let parts   = (<string>key).trim().split("/").filter(part => part.length > 0)
                let current = <Box><any>self
                while(parts.length > 0) current = current.into(parts.shift())
                return current
            default: throw Error("invalid key.")
        }    
    }
    function drop(key: Key) : Box {
        let type = keys.type(key)
        switch(type) {
            case "index": return cell.drop(key)
            case "key" :  return cell.drop(key)
            case "path": {
                let parts   = (<string>key).trim().split("/").filter(part => part.length > 0)
                let current = <Box><any>self
                while(parts.length > 1) current = current.into(parts.shift())
                return current.drop(parts[0])
            }
            default: throw Error("invalid key.")
        }
    }
    function ini<T>(value: T): Box {
        if(cell.type() === "undefined") {
            cell = to_cell(self, value)
        } return <Box><any>self
    }
    function set <T>(value: T): Box {
        cell = to_cell(self, value)
        return <Box><any>self
    }
    function map<T>(fn:(T) => any) : Box {
        let value = fn(cell.get())
        cell = to_cell(self, value)
        return <Box><any>self
    }
    function get<T>() : T {
        return cell.get<T>()
    }
    return self
})

//------------------------------------
// export
//------------------------------------
export const Box = create as BoxFunction

