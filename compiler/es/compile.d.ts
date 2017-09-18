export interface Options {
    sourcemap?: 'extract' | 'append' | null;
    sourcefile?: string;
    targetfile?: string;
}
export interface Params {
    sourcemap: 'extract' | 'append' | null;
    sourcefile: string;
    targetfile: string;
}
export declare function compile(str: string, opts?: Options): string | {
    src: string;
    map: {
        version: number;
        file: string;
        sources: string[];
        sourcesContent: string[];
        names: never[];
        mappings: string;
    };
};
