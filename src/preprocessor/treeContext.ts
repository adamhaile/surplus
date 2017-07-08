
export abstract class Context<T> {
    constructor(
        public readonly node : T
    ) { }

    child<C>(node : C) { return new Child<C, T>(node, this); }
    sibling<C, S>(node : C, i : number, siblings : S[]) { return new Sibling<C, S, T>(node, i, siblings, this); }
}

export class Root<T> extends Context<T> { }

export class Child<T, P = any> extends Context<T> {
    constructor(
        node : T,
        public readonly parent : Context<P>
    ) { super(node); }
    swap<U>(node : U) { return new Child(node, this.parent); }
}

export class Sibling<T, S = any, P = any> extends Context<T> {
    constructor(
        node : T,
        public readonly index : number,
        public readonly siblings : S[],
        public readonly parent : Context<P>
    ) { super(node); }
    swap<U>(node : U) { return new Sibling(node, this.index, this.siblings, this.parent); }
}
    
    

