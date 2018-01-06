import { Params } from './compile';
import { LOC } from './parse';

const rx = {
        locs: /(\n)|(\u0000(\d+),(\d+)\u0000)/g
    },
    vlqFinalDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef",
    vlqContinuationDigits = "ghijklmnopqrstuvwxyz0123456789+/";

export function locationMark(loc : LOC) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}

function extractMappings(embedded : string) {
    let line = [] as string[],
        lines = [] as string[][],
        lastGeneratedCol = 0,
        lastSourceLine = 0,
        lastSourceCol = 0,
        lineStartPos = 0,
        lineMarksLength = 0;

    const src = embedded.replace(rx.locs, function (_, nl : string, mark : string, sourceLine : string, sourceCol : string, offset : number) {
        if (nl) {
            lines.push(line);
            line = [];

            lineStartPos = offset + 1;
            lineMarksLength = 0;
            lastGeneratedCol = 0;

            return nl;
        } else {
            const generatedCol = offset - lineStartPos - lineMarksLength,
                sourceLineNum = parseInt(sourceLine, 10),
                sourceColNum = parseInt(sourceCol, 10);

            line.push(vlq(generatedCol - lastGeneratedCol)
                      + "A" // only one file
                      + vlq(sourceLineNum - lastSourceLine)
                      + vlq(sourceColNum - lastSourceCol));

            lineMarksLength += mark.length;

            lastGeneratedCol = generatedCol;
            lastSourceLine = sourceLineNum;
            lastSourceCol = sourceColNum;

            return "";
        }
    });

    lines.push(line);

    var mappings = lines.map(l => l.join(',')).join(';');

    return {
        src,
        mappings
    };
}

export function extractMap(src : string, original : string, opts : Params) {
    var extract = extractMappings(src),
        map = createMap(extract.mappings, original, opts);

    return {
        src: extract.src,
        map: map
    };
}

function createMap(mappings : string, original : string, opts : Params) {
    return {
        version       : 3,
        file          : opts.targetfile,
        sources       : [ opts.sourcefile ],
        sourcesContent: [ original ],
        names         : [],
        mappings      : mappings
    };
}

export function appendMap(src : string, original : string, opts : Params) {
    var extract = extractMap(src, original, opts),
        appended = extract.src
            + "\n//# sourceMappingURL=data:application/json,"
            + encodeURIComponent(JSON.stringify(extract.map));

    return appended;
}

function vlq(num : number) {
    var str = "", i;

    // convert num sign representation from 2s complement to sign bit in lsd
    num = num < 0 ? (-num << 1) + 1 : num << 1 + 0;
    
    // convert num to base 32 number
    var numstr = num.toString(32);

    // convert base32 digits of num to vlq continuation digits in reverse order
    for (i = numstr.length - 1; i > 0; i--)
        str += vlqContinuationDigits[parseInt(numstr[i], 32)];

    // add final vlq digit
    str += vlqFinalDigits[parseInt(numstr[0], 32)];

    return str;
}
