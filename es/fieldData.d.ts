export declare const enum FieldFlags {
    Type = 3,
    Property = 0,
    Attribute = 1,
    Ignore = 2,
    Assign = 3,
}
export declare type FieldData = [string, string | null, FieldFlags];
export declare const getFieldData: (field: string, svg: boolean) => [string, string | null, FieldFlags];
