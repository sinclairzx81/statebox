/**
 * utilities:
 * common utilities for manipulating with
 * objects and keys.
 */
export declare module util {
    type TypeId = "undefined" | "null" | "function" | "string" | "number" | "boolean" | "date" | "array" | "object" | "box";
    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    function reflect(obj: any): TypeId;
    /**
     * returns a deep copy of the given object.
     * @params {any} the value to clone.
     * @params {string} a reflected typename if known.
     * @returns {any} a clone of the given object.
     */
    function copy(value: any): any;
    /**
     * tests the left and right object for equality.
     * @param {any} the left object.
     * @param {any} the right object.
     * @returns {boolean}
     */
    function equals(left: any, right: any): boolean;
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
    function merge(left: any, right: any): any;
}
export interface SynchronizationObject {
    path: string;
    data: any;
}
export interface ObserverNextObject {
    data: any;
    sync: SynchronizationObject;
}
export interface ObserverEndObject {
    data: any;
}
/**
 * Observable:
 * provides state observation services.
 */
export declare class Observer {
    private sync_cb;
    private data_cb;
    private end_cb;
    /**
     * creates a new observer.
     * @returns {Observer}
     */
    constructor();
    /**
     * subscribes to synchronization events.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    sync(func: (sync: SynchronizationObject) => void): Observer;
    /**
     * subscribes to state changes events.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    data<T>(func: (data: T) => void): Observer;
    /**
     * subscribes to this states end event.
     * @param {Function} a function to receive the event.
     * @returns {Observer}
     */
    end<T>(func: (data: T) => void): Observer;
    /**
     * dispatches this observer event to listeners.
     * @param {ObserverDispatchEvent} the event.
     * @returns {void}
     */
    sendNext(next: ObserverNextObject): void;
    /**
     * dispatches this observer event to listeners.
     * @param {ObserverDispatchEvent} the event.
     * @returns {void}
     */
    sendEnd(object: ObserverEndObject): void;
    /**
     * disposes of this observer.
     * @returns {void}
     */
    dispose(): void;
}
/**
 * Box:
 *
 * Encapsulates immutable state and provides
 * state synchronization.
 */
export declare class Box {
    private observers;
    private parent;
    private typeid;
    private key;
    private state;
    /**
     * creates a new box with the given state.
     * @param {any} the initial state for this box.
     * @returns {Box}
     */
    constructor(initial?: any);
    /**
     * returns the type of this box.
     * @returns {string}
     */
    type(): string;
    /**
     * returns an iterator for each inner box.
     * @returns {Array<string>}
     */
    iter(): Array<string>;
    /**
     * returns the boxes under this box.
     * @returns {Array<Box>}
     */
    inner(): Array<Box>;
    /**
     * returns the path of this box in respect to the root.
     * @returns {string}
     */
    path(): string;
    /**
     * moves into a inner box with the given key.
     * @param {string} the inner box's key.
     * @returns {Box}
     */
    into(indexer: string | number): Box;
    /**
     * moves into the box that matches the given path.
     * @returns {IBox}
     */
    with(path: string): Box;
    /**
     * gets the value stored in this box.
     * @returns {any}
     */
    get<T>(): T;
    /**
     * mix the value in this box with the given value.
     * @param {any} the value to mix
     * @returns {void}
     */
    mix<T>(value: T): Box;
    /**
     * sets the value in this box.
     * @param {any} the value to set.
     * @param {boolean} flag indicating if a notification is raised.
     * @returns {Box}
     */
    set<T>(value: T, notify?: boolean): Box;
    /**
     * synchronizes this object with the given sync object.
     * @param {Sync} the sync object emitted from a box observer.
     * @return {void}
     */
    sync(sync: SynchronizationObject): void;
    /**
     * returns a observable that a caller can use to observe state
     * and synchronization events.
     * @returns {Observable}
     */
    observe(): Observer;
    /**
     * publishes the state of this box to all observers.
     * @returns {void}
     */
    publish(): void;
    /**
     * disposes of this box.
     * @returns {void}
     */
    dispose(): void;
}
