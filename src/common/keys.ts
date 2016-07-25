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

import {reflect} from "./reflect"

export module keys {
    
    /**
     * for the given string value, detemine if the 
     * value is a indexer. A indexer is any string
     * that is a numeric value AND is not 0 padded.
     * @param {KeyType} the key to test.
     * @returns {boolean}
     */
    function indexer (key: string) : boolean {
        return (key.length > 1 && key.indexOf("0") === 0) ? false : !isNaN(<any>key)  
    }
    
    export type Key     = string | number

    export type KeyType = "key" | "index" | "path" | "invalid"

    /**
     * returns the type of key for this string or number.
     * @param {KeyType} the key to parse.
     * @returns {Key} the parsed key.
     */
    export function type(key: Key) : KeyType {
        let type = reflect.type(key)
        if(type === "number") {
            return "index"
        } else if(type === "string") {
            let str = <string>key
            if(str.indexOf("/") !== -1) return "path"
            if(indexer(str))           return "index"
            return                             "key"
        } else {
            return "invalid"
        }
    }
}