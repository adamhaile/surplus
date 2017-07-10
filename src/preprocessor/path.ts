export class Path<T, P> {
    constructor(
        public readonly node : T,
        public readonly parent : P
    ) { }

    child<C>(node : C) { return new Path<C, this>(node, this); }
    sibling<C, S>(node : C, i : number, siblings : S[]) { return new SiblingPath<C, S, this>(node, i, siblings, this); }
    swap<U>(node : U) { return new Path(node, this.parent); }
}

export class SiblingPath<T, S, P> extends Path<T, P> {
    constructor(
        node : T,
        public readonly index : number,
        public readonly siblings : S[],
        parent : P
    ) { super(node, parent); }
    swap<U>(node : U) { return new SiblingPath(node, this.index, this.siblings, this.parent!); }
}