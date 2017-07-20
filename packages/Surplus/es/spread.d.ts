export declare function spread<T>(spread: ((node: Element, state: T) => T | T), node: Element, state: T, activeProps: {
    [name: string]: number;
}): T;
