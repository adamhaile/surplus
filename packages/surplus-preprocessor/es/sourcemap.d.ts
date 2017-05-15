import { Params } from './preprocess';
import { LOC } from './parse';
export declare function segmentStart(loc: LOC): string;
export declare function segmentEnd(): string;
export declare function extractMap(src: string, original: string, opts: Params): {
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
export declare function appendMap(src: string, original: string, opts: Params): string;
