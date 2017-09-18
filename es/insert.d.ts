export interface Range {
    start: Node;
    end: Node;
}
export declare type InsertScalar = string | number | boolean | null | undefined | Node;
export declare type InsertScalarOrArray = InsertScalar | InsertScalar[] | (InsertScalar | InsertScalar[])[] | (InsertScalar | (InsertScalar | InsertScalar[])[])[];
export declare type InsertValue = InsertScalarOrArray | (() => InsertValue);
export declare function insert(range: Range, value: InsertValue): Range;
