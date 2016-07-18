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

declare module "statebox" {
    
    /**
     * A synchronization object passed by
     * observers. Can be passed into other
     * box's to synchronize their state 
     * with the sender.
     */
    export interface SynchronizationObject {
        /**
         * the qualified box path.
         */
        path: string;
        /**
         * the box's state.
         */
        data: any;
    }

    /**
     * Observer<T>: provides a interface for observing boxes.
     */
    export class Observer<T> {

        /**
         * subscribes to synchronization events.
         * @param {Function} a function to receive the event.
         * @returns {Observer<T>}
         */
        sync   (func: (sync: SynchronizationObject) => void): Observer<T>
        
        /**
         * subscribes to state changes events.
         * @param {Function} a function to receive the event.
         * @returns {Observer<T>}
         */       
        data   (func: (data: T) => void): Observer<T>

        /**
         * subscribes to this box's end event.
         * @param {Function} a function to receive the event.
         * @returns {Observer<T>}
         */        
        end    (func: (data: T) => void): Observer<T>

        /**
         * disposes of this observer.
         * @returns {void}
         */
        dispose(): void;
    }
    /**
     * Box: A state container.
     */
    export class Box<T> {
        /**
         * createa a new box with the given value.
         * @param {T?} the initial state.
         * @returns {Box<T>}
         */
        constructor(initial?: T)
        
        /**
         * returns this box's unique identifer.
         * @returns {string}
         */
        id     (): string

        /**
         * returns the type of this box.
         * @returns {string}
         */
        type    (): string

        /**
         * returns a iterator for this box's inner boxes.
         * @returns {Array<string>}
         */
        iter    (): Array<string>

        /**
         * returns this box's inner boxes. If the box
         * contains a value type, this function returns
         * an empty array.
         * @returns {Array<Box<any>>}
         */
        inner   (): Array<Box<any>>

        /**
         * returns the fully qualified path of this box.
         * The qualified path is in respect to the top
         * most parent box.
         * @returns {string}
         */
        path    (): string

        /**
         * moves into a inner box directly under this 
         * box. If the inner box does not exist, it is
         * created and initialized as undefined.
         * @param {string | number} the key or index of the inner box.
         * @returns {Box<U>}
         */
        into<U> (key: string | number): Box<U>

        /**
         * moves into a inner box with a path. If the
         * inner box's along this path do not exists, the
         * boxes are created and initialized as undefined.
         */
        with<U> (path: string): Box<U>

        /**
         * returns the value stored within this box.
         * @returns {T}
         */
        get     (): T

        /**
         * sets the value stored in this box.
         * @param {T} the new value for this box.
         * @returns {Box<U>}
         */
        set  <U>(value: U): Box<U>
        /**
         * attempts to mix the value stored in this
         * box with the given value. This is only 
         * possible for object and array boxes.
         * @param {any} the value to mix.
         * @returns {Box<any>}
         */
        mix     (value: any): Box<any>

        /**
         * sets a default value for this box if the
         * box contains a undefined value. If the box
         * contains a value, no action is taken.
         * @param {T} the default value.
         * @returns {Box<T>}
         */
        default (value: T): Box<T>

        /**
         * accepts a synchronization object given 
         * from another box observer. The box will
         * attempt to set its state based on this 
         * object.
         * @param {SynchronizationObject} the sync object.
         * @returns {Box<T>}
         */
        sync    (sync: SynchronizationObject): void

        /**
         * returns a box observer.
         * @returns {Observer<T>}
         */
        observe (): Observer<T>

        /**
         * immediately publishes this box's state to 
         * all observers.
         * @returns {Box<T>}
         */
        publish (): Box<T>

        /**
         * disposes of this box setting its 
         * parent as undefined and notifying
         * all observers with a end event.
         * @returns {void}
         */
        dispose (): void
    }
}