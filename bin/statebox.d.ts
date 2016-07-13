declare module "statebox" {
    export type TypeName = "undefined" | "function" | "string" | "number" | "boolean" | "date" | "box" | "array" | "object";
    /**
     * Box:
     * A container type for state. A box can be viewed
     * as a node in a state graph, providing get / set
     * operations on the state, as well as allowing
     * observation on the state.
     */
    export class Box {
        private parent;
        private type;
        private value;
        private subscribers;
        /**
         * creates a new box.
         * @param {any?} the value to initialize this box with.
         * @returns {Box}
         */
        constructor(value?: any);
        /**
         * returns the simple typename of the object inside this box.
         * @returns {string}
         */
        typename(): TypeName;
        /**
         * returns keys or indices to child boxes. Only valid for
         * object and array types. All other types return an empty
         * array.
         * @returns {Array<string>|Array<number>}
         */
        keys(): Array<string | number>;
        /**
         * observes state changes on this box.
         * @param {(data: any) => void} a callback containing the new value.
         * @returns {void}
         */
        observe(func: (data: any) => void): void;
        /**
         * The addr function returns the box by path.
         * @param {string | number} a key or array index of the box to use.
         * @returns {State}
         */
        addr(path: string): Box;
        /**
         * The use function returns or creates a inner box for under this box.
         * If this box is uninitialized, it will be initialized as a object and
         * populated with a new box with the given key. valid for object and
         * array box types.
         * @param {string | number} a key or array index of the box to use.
         * @returns {State}
         */
        use(key: string | number): Box;
        /**
         * The drop function will drop a objects inner box if it exists. Valid
         * for object and array box types.
         * @param {string|number} the key or index to drop.
         * @returns {}
         */
        drop(key: number | string, notify?: boolean): void;
        /**
         * sets the value of this state object.
         * @param {string} the value to set this state to.
         * @param {boolean?} should this change cause a notification?
         * @returns {State}
         */
        set<T>(value: any, nofify?: boolean): void;
        /**
         * returns the javascript state housed by this box. The
         * state is recursively gather from this and inner boxes
         * to build up the resulting object.
         * @returns {any}
         */
        get<T>(): T;
        /**
         * (internal) dispatches the a change event to observers.
         * @returns {void}
         */
        private dispatch();
    }
}
