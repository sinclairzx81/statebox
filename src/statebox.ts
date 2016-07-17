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
 * utilities:
 * common utilities for manipulating with
 * objects and keys.
 */
export module util {

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
 * Observable:
 * provides state observation services.
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
  public data<T>(func: (data: T) => void) : Observer {
    this.data_cb.push(func)
    return this
  }

  /**
   * subscribes to this states end event.
   * @param {Function} a function to receive the event.
   * @returns {Observer}
   */
  public end<T>(func: (data: T) => void) : Observer {
    this.end_cb.push(func)
    return this
  }

  /**
   * dispatches this observer event to listeners.
   * @param {ObserverDispatchEvent} the event.
   * @returns {void}
   */
  public sendNext(next: ObserverNextObject) : void {
    this.data_cb.forEach(callback => callback(next.data))
    this.sync_cb.forEach(callback => callback(next.sync))
  }

  /**
   * dispatches this observer event to listeners.
   * @param {ObserverDispatchEvent} the event.
   * @returns {void}
   */
  public sendEnd(object: ObserverEndObject) : void {
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
 * Box: 
 * 
 * Encapsulates immutable state and provides
 * state synchronization.
 */
export class Box {
  private observers   : Array<Observer>
  private parent      : Box
  private typeid      : string
  private key         : string
  private state       : any | Array<Box>

  /**
   * creates a new box with the given state.
   * @param {any} the initial state for this box.
   * @returns {Box}
   */
  constructor(initial?: any) {
    this.observers   = new Array()
    this.parent      = undefined
    this.key         = undefined
    this.typeid      = undefined
    this.state       = undefined
    this.set(initial)
  }

  /**
   * returns the type of this box.
   * @returns {string}
   */
  public type() : string {
    return this.typeid
  }

  /**
   * returns an iterator for each inner box. 
   * @returns {Array<string>}
   */
  public iter(): Array<string> {
    switch(this.typeid) {
      case "object":
      case "array":
        return this.state.map(box => box.key).filter(key => key !== undefined).filter(key => key.length > 0)
      default: 
        return []
    }
  }

  /**
   * returns the boxes under this box.
   * @returns {Array<Box>}
   */
  public inner(): Array<Box> {
    if(this.typeid === "object" || this.typeid === "array") {
       return (this.state === undefined) ? [] : this.state as Array<Box>
    } return []
  }

  /**
   * returns the path of this box in respect to the root. 
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
   * moves into a inner box with the given key.
   * @param {string} the inner box's key.
   * @returns {Box}
   */
  public into(indexer: string | number) : Box {
    let key = indexer.toString()
    if(this.state === undefined) {
      this.typeid  = isNaN(<any>indexer) ? "object" : "array"
      this.state = []
    }
    switch(this.typeid) {
      case "array": 
        if(isNaN(<any>key)) 
          throw Error("cannot move into an array with a string.")
        if(this.state[key] === undefined) {
          let box = new Box()
          box.parent = this
          box.key    = key
          this.state[key] = box
        } 
        return this.state[key]
      case "object":
        let box = this.state.reduce((acc, box) => {
          if(box.key === key) acc = box
          return acc
        }, undefined)
        if(box === undefined) {
          box    = new Box()
          box.key    = key
          box.parent = this
          this.state.push(box)
        } 
        return box
      default: throw Error("cannot move a value.")
    }
  }

  /**
   * moves into the box that matches the given path.
   * @returns {IBox}
   */
  public with(path: string): Box {
      if(path.length === 0) return this
      let current = <Box>this
      let keys    = path.split("/").filter(key => key.length > 0)
      while (keys.length > 0) {
          current = current.into(keys.shift())
      } return current      
  }

  /**
   * gets the value stored in this box.
   * @returns {any}
   */
  public get<T>() : T {
    switch(this.typeid) {
        case "object":
          return this.state.reduce((acc, box) => {
            acc[box.key] = box.get()
            return acc
          }, {})
        case "array": 
          return this.state.map(value => value.get())
        default:
          return util.copy(this.state) 
    }
  }
  /**
   * mix the value in this box with the given value.
   * @param {any} the value to mix
   * @returns {void}
   */
  public mix<T>(value: T) : Box {
      let mixed = util.merge(this.get(), value)
      this.set(mixed)
      return this
  }

  /**
   * sets the value in this box.
   * @param {any} the value to set.
   * @param {boolean} flag indicating if a notification is raised.
   * @returns {Box}
   */
  public set<T>(value: T, notify?: boolean): Box {
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
     this.typeid = util.reflect(value)

    /**
     * set the state.
     * 
     * Here, we set the state for this box. 
     * All state is encoded into a tree of 
     * boxes, with the leaf nodes containing
     * actual values. Otherwise, the box is
     * a container (object or array).
     */
     switch(this.typeid) {
        case "box":
          this.set((<any>value).get())
          break
        case "object":
          this.state = Object.keys(value).map(key => {
            let box    = new Box()
            box.key    = key
            box.parent = this
            box.set(util.copy(value[key]), false)
            return box
          })
          break
        case "array":  
          this.state = (<any[]><any>value).map<Box>((value, key) => {
              let box    = new Box()
              box.key    = key.toString()
              box.parent = this
              box.set(util.copy(value), false)
              return box
          })
          break
        default:
          this.state = util.copy(value);
          break;
    }
    if(notify) this.publish()
    return this
  }

  /**
   * synchronizes this object with the given sync object.
   * @param {Sync} the sync object emitted from a box observer.
   * @return {void}
   */
  public sync(sync: SynchronizationObject) : void {
      this.with(sync.path).set(sync.data)
  }

  /**
   * returns a observable that a caller can use to observe state 
   * and synchronization events.
   * @returns {Observable}
   */
  public observe() : Observer {
    let observer = new Observer()
    this.observers.push(observer)
    return observer
  }

  /**
   * publishes the state of this box to all observers.
   * @returns {void}
   */
  public publish() : void {
    let current = <Box>this        
    while(current !== undefined) {
      current.observers.forEach(observer => {
        let next = {
          data: current.get(),
          sync: {
              path: this.path(),
              data: this.get()
          }
        }
        observer.sendNext(next)
      }) 
      current = current.parent
    }
  }

  /**
   * disposes of this box.
   * @returns {void}
   */
  public dispose() : void {
    this.inner().forEach(box => box.dispose())
    this.observers.forEach(observer => {
      observer.sendEnd({data: this.get()})
    })
  }
}