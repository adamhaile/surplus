export declare class Path<T, P> {
    readonly node: T;
    readonly parent: P;
    constructor(node: T, parent: P);
    child<C>(node: C): Path<C, this>;
    sibling<C, S>(node: C, i: number, siblings: S[]): SiblingPath<C, S, this>;
    swap<U>(node: U): Path<U, P>;
}
export declare class SiblingPath<T, S, P> extends Path<T, P> {
    readonly index: number;
    readonly siblings: S[];
    constructor(node: T, index: number, siblings: S[], parent: P);
    swap<U>(node: U): SiblingPath<U, S, P>;
}
