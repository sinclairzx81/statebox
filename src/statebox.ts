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

/**
 * utility:
 * common utilities for manipulating with
 * objects and keys.
 */
module util {

    export type TypeId = 
          "undefined" 
        | "null"
        | "function"
        | "string"
        | "number"
        | "boolean"
        | "date"
        | "array"
        | "object"
        | "box"
    
    /**
     * generates a random uuid.
     * @returns {string}
     */
    export function uuid(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
      });
    }

    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    export function reflect(obj: any): TypeId {
        if (obj === undefined)         return "undefined"
        if (obj === null)              return "null"
        if (typeof obj === "function") return "function"
        if (typeof obj === "string")   return "string"
        if (typeof obj === "number")   return "number"
        if (typeof obj === "boolean")  return "boolean"
        if (typeof obj === "object") {
          if (obj instanceof Box)    return "box"
          if (obj instanceof Array)  return "array"
          if (obj instanceof Date)   return "date"
        } return "object"
    }

    /**
     * returns a deep copy of the given object.
     * @params {any} the value to clone.
     * @params {string} a reflected typename if known.
     * @returns {any} a clone of the given object.
     */
    export function copy(value: any) : any {
        switch(reflect(value)) {
            case "undefined": return undefined;
            case "null":      return null;
            case "string":    return value.slice(0)
            case "number":    return (value + 0)
            case "boolean":   return (!!value)
            case "date":      return new Date(value.getTime())
            case "box":       return value.get()
            case "object":    
              return Object.keys(value).reduce((obj, key) => {
                  obj[key] = copy(value[key])
                  return obj
              }, {})
            case "array": 
              return value.map(value => copy(value))
            default: 
              throw Error("unable to copy value " + value.toString())
        }
    }
    /**
     * tests the left and right object for equality. 
     * @param {any} the left object.
     * @param {any} the right object.
     * @returns {boolean}
     */
    export function equals (left: any, right: any) : boolean {
        let type_left  = util.reflect(left)
        let type_right = util.reflect(right)
        if(type_left !== type_right) return false
        switch(type_left) {
            case "undefined": return true;
            case "null":      return true;
            case "string":    return left === right
            case "number":    return left === right
            case "boolean":   return left === right
            case "date":      return left.getTime() === right.getTime()
            case "object":
                let keys_left  = Object.keys(left)
                let keys_right = Object.keys(right)
                if(util.equals(keys_left, keys_right) === false) return false
                let values_left  = keys_left.map(key => left[key])
                let values_right = keys_right.map(key => right[key])
                return util.equals(values_left, values_right)
            case "array":
                if(left.length !== right.length) return false
                for(let i = 0; i < left.length; i++) {
                    if(util.equals(left[i], right[i]) === false) return false
                } return true
            default: throw Error("unable to compare types")
        }
    }
    /**
     * merges the right object on the left object. The right
     * object is treated as the dominate object, overwritting
     * conflicting state on the left.
     * Objects will only merge if both left and right are either
     * objects or arrays. In all other cases, the right object
     * return be returned.
     * @param {any} the left object
     * @param {any} the right object.
     * @returns {any}
     */
    export function merge(left: any, right: any) : any {
        let left_type  = util.reflect(left)
        let right_type = util.reflect(right)
        if(left_type !== right_type) return util.copy(right)
        switch(left_type) {
            case "object": 
              return Object.keys(right).reduce((left, key) => {
                left[key] = util.copy(right[key])
                return left
              }, left)
            case "array":
              return [].concat(util.copy(left), util.copy(right)) 
            default:       
              return right
        }
        
    }
}

/**
 * A synchronization object passed by
 * observers. Can be passed into other
 * box's to synchronize their state 
 * with the sender.
 */
export interface SynchronizationObject {
  path: string
  data: any
}

export interface ObserverNextObject {
  data: any
  sync: SynchronizationObject
}
export interface ObserverEndObject {
  data: any
}

/**
 * Observer<T>: provides a interface for observing boxes.
 */
export class Observer {
  private sync_cb: Array<(SyncObject) => void>
  private data_cb: Array<(any) => void>
  private end_cb:  Array<(any) => void>

  /**
   * creates a new observer.
   * @returns {Observer}
   */
  constructor() {
    this.data_cb = new Array()
    this.sync_cb = new Array()
    this.end_cb  = new Array()
  }

  /**
   * subscribes to synchronization events.
   * @param {Function} a function to receive the event.
   * @returns {Observer}
   */
  public sync(func: (sync:SynchronizationObject) => void) : Observer {
    this.sync_cb.push(func)
    return this
  }

  /**
   * subscribes to state changes events.
   * @param {Function} a function to receive the event.
   * @returns {Observer}
   */
  public data(func: (data: any) => void) : Observer {
    this.data_cb.push(func)
    return this
  }

  /**
   * subscribes to this box's end event.
   * @param {Function} a function to receive the event.
   * @returns {Observer}
   */
  public end(func: (data: any) => void) : Observer {
    this.end_cb.push(func)
    return this
  }

  /**
   * dispatches this observer event to listeners.
   * @param {ObserverDispatchEvent} the event.
   * @returns {void}
   */
  public send_next(next: ObserverNextObject) : void {
    this.data_cb.forEach(callback => callback(next.data))
    this.sync_cb.forEach(callback => callback(next.sync))
  }

  /**
   * dispatches this observer event to listeners.
   * @param {ObserverDispatchEvent} the event.
   * @returns {void}
   */
  public send_end(object: ObserverEndObject) : void {
    this.end_cb.forEach(callback => callback(object.data))
  }

  /**
   * disposes of this observer.
   * @returns {void}
   */
  public dispose() : void {
    this.data_cb = new Array()
    this.sync_cb = new Array()
    this.end_cb  = new Array()
  }
}

/**
 * Box: A state container.
 */
export class Box {
  private _observers : Array<Observer>
  private _parent    : Box
  private _id        : string
  private _type      : string
  private _name      : string
  private _state     : any | Array<Box>

  /**
   * creates a new box with the given state.
   * @param {any} the initial state for this box.
   * @returns {Box}
   */
  constructor(initial?: any) {
    this._observers  = new Array()
    this._id         = util.uuid()
    this._parent     = undefined
    this._name       = undefined
    this._type       = undefined
    this._state      = undefined
    this.set(initial)
  }

  /**
   * returns this box's unique identifer.
   * @returns {string}
   */
  public id(): string {
    return this._id
  }

  /**
   * returns the name of this box. This name
   * correlates to a key or index depending
   * on the parent box.
   * @returns {string}
   */
  public name(): string {
    return this._name 
  }

  /**
   * returns the type of this box.
   * @returns {string}
   */
  public type() : string {
    return this._type
  }

  /**
   * returns a iterator for this box's inner boxes.
   * @returns {Array<string>}
   */
  public iter(): Array<string> {
    switch(this._type) {
      case "object":
      case "array":
        return this._state.map(box => box.key).filter(key => key !== undefined).filter(key => key.length > 0)
      default: 
        return []
    }
  }

  /**
   * returns this box's inner boxes. If the box
   * contains a value type, this function returns
   * an empty array.
   * @returns {Array<Box<any>>}
   */
  public inner(): Array<Box> {
    if(this._type === "object" || this._type === "array") {
       return (this._state === undefined) ? [] : this._state as Array<Box>
    } return []
  }

  /**
   * returns the fully qualified path of this box.
   * The qualified path is in respect to the top
   * most parent box.
   * @returns {string}
   */
  public path(): string {
    let current = <any>this
    let buffer  = []
    while (current.parent !== undefined) {
        let iter = current.parent.iter()
        for(let i = 0; i < iter.length; i++) {
            if(current.key === iter[i]) {
                buffer.unshift(current.key)
                break
            }
        } current = current.parent   
    } return buffer.join("/")
  }

  /**
   * moves into a inner box directly under this 
   * box. If the inner box does not exist, it is
   * created and initialized as undefined.
   * @param {string | number} the key or index of the inner box.
   * @returns {Box<U>}
   */
  public into(name: string | number) : Box {
    let _name = name.toString()
    if(this._state === undefined) {
      this._type  = isNaN(<any>_name) ? "object" : "array"
      this._state = []
    }
    switch(this._type) {
      case "array": 
        if(isNaN(<any>_name)) 
          throw Error("cannot move into an array with a string.")
        if(this._state[_name] === undefined) {
          let box      = new Box()
          box._parent  = this
          box._name    = _name
          this._state[_name] = box
        } 
        return this._state[_name]
      case "object":
        let box = this._state.reduce((acc, box) => {
          if(box._name === _name) acc = box
          return acc
        }, undefined)
        if(box === undefined) {
          box         = new Box()
          box._name   = _name
          box._parent = this
          this._state.push(box)
        } 
        return box
      default: throw Error("cannot move a value.")
    }
  }

  /**
   * moves into a inner box with a path. If the
   * inner box's along this path do not exists, the
   * boxes are created and initialized as undefined.
   */
  public with(path: string): Box {
      if(path.length === 0) return this
      let current = <Box>this
      let names   = path.split("/").filter(name => name.length > 0)
      while (names.length > 0) {
          current = current.into(names.shift())
      } return current      
  }

  /**
   * returns the value stored within this box.
   * @returns {T}
   */
  public get() : any {
    switch(this._type) {
        case "object":
          return this._state.reduce((acc, box) => {
            acc[box.key] = box.get()
            return acc
          }, {})
        case "array": 
          return this._state.map(value => value.get())
        default:
          return util.copy(this._state) 
    }
  }

  /**
   * sets the value stored in this box.
   * @param {T} the new value for this box.
   * @returns {Box<U>}
   */
  public set(value: any, notify?: boolean): Box {
    if(util.equals(this.get(), value)) return
    if(notify === undefined) notify = true

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
     this.inner().forEach(box => box.dispose())

     /**
      * update the typeid of this box.
      */
     this._type = util.reflect(value)

    /**
     * set the state.
     * 
     * Here, we set the state for this box. 
     * All state is encoded into a tree of 
     * boxes, with the leaf nodes containing
     * actual values. Otherwise, the box is
     * a container (object or array).
     */
     switch(this._type) {
        case "box":
          this.set((<any>value).get())
          break
        case "object":
          this._state = Object.keys(value).map(key => {
            let box     = new Box()
            box._name   = key
            box._parent = this
            box.set(util.copy(value[key]), false)
            return box
          })
          break
        case "array":  
          this._state = (<any[]><any>value).map<Box>((value, key) => {
              let box     = new Box()
              box._name   = key.toString()
              box._parent = this
              box.set(util.copy(value), false)
              return box
          })
          break
        default:
          this._state = util.copy(value);
          break;
    }
    if(notify) this.publish()
    return this
  }

  /**
   * attempts to mix the value stored in this
   * box with the given value. This is only 
   * possible for object and array boxes.
   * @param {any} the value to mix.
   * @returns {Box<any>}
   */
  public mix(value: any) : Box {
      let mixed = util.merge(this.get(), value)
      this.set(mixed)
      return this
  }

  /**
   * sets a default value for this box if the
   * box contains a undefined value. If the box
   * contains a value, no action is taken.
   * @param {T} the default value.
   * @returns {Box<T>}
   */
  public default(value: any) : Box {
    if(this.get() === undefined) {
      this.set(value)
    } return this
  }

  /**
   * accepts a synchronization object given 
   * from another box observer. The box will
   * attempt to set its state based on this 
   * object.
   * @param {SynchronizationObject} the sync object.
   * @returns {Box<T>}
   */
  public sync(sync: SynchronizationObject) : Box {
      this.with(sync.path).set(sync.data)
      return this
  }

  /**
   * returns a box observer.
   * @returns {Observer<T>}
   */
  public observe() : Observer {
    let observer = new Observer()
    this._observers.push(observer)
    return observer
  }

  /**
   * immediately publishes this box's state to 
   * all observers.
   * @returns {Box<T>}
   */
  public publish() : Box {
    let current = <Box>this        
    while(current !== undefined) {
      current._observers.forEach(observer => {
        let next = {
          data: current.get(),
          sync: {
              path: this.path(),
              data: this.get()
          }
        }
        observer.send_next(next)
      }) 
      current = current._parent
    } return this
  }

  /**
   * disposes of this box setting its 
   * parent as undefined and notifying
   * all observers with a end event.
   * @returns {void}
   */
  public dispose() : void {
    this.inner().forEach(box => box.dispose()) 
    this._observers.forEach(observer => {
      observer.send_end({data: this.get()})
    })
    this._parent = undefined
  }
}