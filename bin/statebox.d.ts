declare module "statebox" {
    export type TypeName = "undefined" | "function" | "string" | "number" | "boolean" | "date" | "box" | "array" | "object";
    /**
     * Disposable interface.
     */
    export interface Disposable {
        dispose(): any;
    }
    /**
     * Box interface.
     */
    export interface IBox {
        type(): TypeName;
        drop(): IBox;
        into(path: string): IBox;
        keys(): Array<number | string>;
        get<T>(): T;
        set<T>(value: T, notify?: boolean): void;
        observe<T>(func: (data: T) => void): Disposable;
    }
    /**
     * Box:
     * A container type for unit of state. A box can be viewed
     * as a node within a large state graph, providing get / set
     * operations on the state, as well as allowing
     * observation on the state.
     */
    export class Box implements IBox {
        private parent;
        private typename;
        private value;
        private subscribers;
        /**
         * creates a new box.
         * @param {any?} optional value to initialize this box with.
         * @returns {Box}
         */
        constructor(initial?: any);
        /**
          * returns keys or indices to child boxes. Only valid for
          * object and array types. All other types return an empty
          * array. Callers can use this to recursively traverse the
          * state graph.
          * @returns {Array<string>|Array<number>}
          */
        keys(): Array<string | number>;
        /**
         * returns the simple typename of the object inside this box.
         * @returns {string}
         */
        type(): TypeName;
        /**
         * Returns the box at the given path. If no box exists at the
         * given path, the box is contructed with a undefined value.
         * @param {string | number} the path into this box.
         * @returns {IBox}
         */
        into(path: string): IBox;
        /**
         * The use function returns or creates a inner box for under this box.
         * If this box is uninitialized, it will be initialized as a object and
         * populated with a new box with the given key. valid for object and
         * array box types.
         * @param {string | number} a key or array index of the box to use.
         * @returns {State}
         */
        private use(key);
        /**
         * drops this box from its parent, removing
         * it from the state graph. If this box has no
         * parent, no action is taken.
         * @returns {IBox}
         */
        drop(): IBox;
        /**
         * sets the value managed by this box. this function
         * will wrap each value, object and array as a box
         * and merge it within the state graph.
         * @param {T} The value to set this box to.
         * @param {boolean?} should this change cause a notification?
         * @returns {void}
         */
        set<T>(value: T, nofify?: boolean): void;
        /**
         * returns the state managed by this box. The state
         * returned is a typical javascript object, and is
         * resolved by traversing the state graph, gathering
         * values along the way.
         * @returns {T}
         */
        get<T>(): T;
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
        observe<T>(func: (data: T) => void): Disposable;
        /**
         * (internal) dispatches the current state to each
         * subscriber of this box. This function will traverse
         * the state graph from this box back to the parent,
         * notifying each box along the way of state changes.
         * @returns {void}
         */
        private dispatch();
    }
}
