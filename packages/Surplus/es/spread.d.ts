export declare function staticSpread(node: Element, props: {
    [name: string]: any;
}): void;
export declare class SingleSpreadState {
    namedProps: {
        [name: string]: boolean;
    };
    oldProps: string[] | null;
    constructor(namedProps: {
        [name: string]: boolean;
    });
    apply(node: Element, props: {
        [name: string]: any;
    }): void;
    private check(node, rawName, props);
    private setField(node, rawName, props);
}
export declare class MultiSpreadState {
    namedProps: {
        [name: string]: boolean;
    };
    current: number;
    propAges: {
        [name: string]: number;
    };
    oldProps: (string[] | undefined)[];
    checkProps: string[];
    constructor(namedProps: {
        [name: string]: boolean;
    });
    apply(node: Element, props: {
        [name: string]: any;
    }, n: number, last: boolean): void;
    private check(rawName, props);
    private setField(node, rawName, props);
}
