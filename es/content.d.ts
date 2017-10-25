import { InsertValue } from './insert';
export declare class Content {
    readonly parent: Element;
    private current;
    constructor(parent: Element);
    update(value: InsertValue): this;
}
