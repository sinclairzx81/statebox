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

export module reflect {
    /**
     * TypeID:
     * known values that can be reflected.
     */
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
    
    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    export function type(obj: any): TypeId {
        if (obj === undefined)         return "undefined"
        if (obj === null)              return "null"
        if (typeof obj === "function") return "function"
        if (typeof obj === "string")   return "string"
        if (typeof obj === "number")   return "number"
        if (typeof obj === "boolean")  return "boolean"
        if (typeof obj === "object") {
            if (obj instanceof Array)  return "array"
            if (obj instanceof Date)   return "date"
        } return "object"
    }

    /**
     * preforms a deep copy on the given object.
     * @params {any} the object to copy.
     * @returns {any} a copy of the given object.
     */
    export function copy(value: any) : any {
        switch(type(value)) {
            case "undefined": return undefined;
            case "null":      return null;
            case "string":    return value.slice(0)
            case "number":    return (value + 0)
            case "boolean":   return (!!value)
            case "date":      return new Date(value.getTime())
            case "function":  throw Error("unable to copy function.")
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
     * preforms a deep equality check on the given objects.
     * @param {any} the left object.
     * @param {any} the right object.
     * @returns {boolean}
     */
    export function equals (left: any, right: any) : boolean {
        let types = { left : type(left), right: type(right) }
        if(types.left !== types.right) return false
        switch(types.left) {
            case "undefined": return true;
            case "null":      return true;
            case "string":    return left === right
            case "number":    return left === right
            case "boolean":   return left === right
            case "date":      return left.getTime() === right.getTime()
            case "object":
                let keys = { left : Object.keys(left), right: Object.keys(right) }
                return equals(keys.left, keys.right) 
                        ? equals(keys.left.map (key => left [key]), keys.right.map(key => right[key]))
                        : false  
            case "array":
                if(left.length === right.length) {
                    for(let i = 0; i < left.length; i++) {
                        if(equals(left[i], right[i]) === false) 
                        return false
                    } return true
                } else return false
            default: throw Error("unable to compare types")
        }
    }
}