
export abstract class Context<T> {
    constructor(
        public readonly node : T
    ) { }

    child<C>(node : C) { return new ChildContext<C, T>(node, this); }
    sibling<C, S>(node : C, i : number, siblings : S[]) { return new SiblingContext<C, S, T>(node, i, siblings, this); }
}

export class RootContext<T> extends Context<T> { }

export class ChildContext<T, P = any> extends Context<T> {
    constructor(
        node : T,
        public readonly parent : Context<P>
    ) { super(node); }
    swap<U>(node : U) { return new ChildContext(node, this.parent); }
}

export class SiblingContext<T, S = any, P = any> extends ChildContext<T> {
    constructor(
        node : T,
        public readonly index : number,
        public readonly siblings : S[],
        parent : Context<P>
    ) { super(node, parent); }
    swap<U>(node : U) { return new SiblingContext(node, this.index, this.siblings, this.parent); }
}
    
    

