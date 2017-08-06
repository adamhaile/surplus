export declare type PropObj = {
    [name: string]: any;
};
export declare function staticSpread(node: HTMLElement, obj: PropObj): void;
export declare function staticStyle(node: HTMLElement, style: PropObj): void;
export declare class SingleSpreadState {
    namedProps: {
        [name: string]: boolean;
    };
    oldProps: string[] | null;
    oldStyles: string | string[] | null;
    constructor(namedProps: {
        [name: string]: boolean;
    });
    apply(node: Element, props: PropObj): void;
    applyStyle(node: Element, style: PropObj): void;
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
    styleAges: {
        [name: string]: number;
    };
    oldStyles: (string[] | undefined)[] | null;
    checkStyles: string[] | null;
    constructor(namedProps: {
        [name: string]: boolean;
    });
    apply(node: Element, props: PropObj, n: number, last: boolean): void;
    applyStyle(node: Element, style: PropObj, n: number, last: boolean): void;
    private check(rawName, props);
    private setField(node, rawName, props, n, last);
}
