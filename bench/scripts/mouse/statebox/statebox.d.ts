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
export declare class Observer {
    private sync_cb;
    private data_cb;
    private end_cb;
    constructor();
    sync(func: (sync: SynchronizationObject) => void): Observer;
    data(func: (data: any) => void): Observer;
    end(func: (data: any) => void): Observer;
    send_next(next: ObserverNextObject): void;
    send_end(object: ObserverEndObject): void;
    dispose(): void;
}
export declare class Box {
    private observers;
    private parent;
    private typeid;
    private key;
    private state;
    constructor(initial?: any);
    type(): string;
    iter(): Array<string>;
    inner(): Array<Box>;
    path(): string;
    into(key: string | number): Box;
    with(path: string): Box;
    get(): any;
    set(value: any, notify?: boolean): Box;
    mix(value: any): Box;
    default(value: any): Box;
    sync(sync: SynchronizationObject): Box;
    observe(): Observer;
    publish(): Box;
    dispose(): void;
}
