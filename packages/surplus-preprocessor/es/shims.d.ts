export interface IShimmable {
    shim(ctx?: Context): void;
}
export declare let shimmed: boolean;
export declare type Context = {
    index: number;
    parent: IShimmable;
    siblings: IShimmable[];
    prune: boolean;
};
