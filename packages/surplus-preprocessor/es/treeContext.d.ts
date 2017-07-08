export declare abstract class Context<T> {
    readonly node: T;
    constructor(node: T);
    child<C>(node: C): Child<C, T>;
    sibling<C, S>(node: C, i: number, siblings: S[]): Sibling<C, S, T>;
}
export declare class Root<T> extends Context<T> {
}
export declare class Child<T, P = any> extends Context<T> {
    readonly parent: Context<P>;
    constructor(node: T, parent: Context<P>);
    swap<U>(node: U): Child<U, P>;
}
export declare class Sibling<T, S = any, P = any> extends Context<T> {
    readonly index: number;
    readonly siblings: S[];
    readonly parent: Context<P>;
    constructor(node: T, index: number, siblings: S[], parent: Context<P>);
    swap<U>(node: U): Sibling<U, S, P>;
}
