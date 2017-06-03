var rx = {
    locs: /(\r?\n)|(\u0000(\d+),(\d+)\u0000)|(\u0000\u0000)/g
}, vlqFinalDigits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef", vlqContinuationDigits = "ghijklmnopqrstuvwxyz0123456789+/";
export function segmentStart(loc) {
    return "\u0000" + loc.line + "," + loc.col + "\u0000";
}
export function segmentEnd() {
    return "\u0000\u0000";
}
function extractMappings(embedded) {
    var mappings = "", lastGeneratedCol = 0, lastSourceLine = 0, lastSourceCol = 0, isInSegment = false, lineStartPos = 0, lineTagLength = 0, isLineContinuation = false;
    var src = embedded.replace(rx.locs, function (_, nl, start, sourceLine, sourceCol, end, offset) {
        if (nl) {
            mappings += ";";
            if (isInSegment) {
                mappings += "AA" + vlq(1) + vlq(0 - lastSourceCol);
                lastSourceLine++;
                lastSourceCol = 0;
                isLineContinuation = true;
            }
            else {
                isLineContinuation = false;
            }
            lineStartPos = offset + nl.length;
            lineTagLength = 0;
            lastGeneratedCol = 0;
            return nl;
        }
        else if (start) {
            var generatedCol = offset - lineStartPos - lineTagLength;
            sourceLine = parseInt(sourceLine);
            sourceCol = parseInt(sourceCol);
            mappings += (isLineContinuation ? "," : "")
                + vlq(generatedCol - lastGeneratedCol)
                + "A" // only one file
                + vlq(sourceLine - lastSourceLine)
                + vlq(sourceCol - lastSourceCol);
            isInSegment = true;
            isLineContinuation = true;
            lineTagLength += start.length;
            lastGeneratedCol = generatedCol;
            lastSourceLine = sourceLine;
            lastSourceCol = sourceCol;
            return "";
        }
        else if (end) {
            isInSegment = false;
            lineTagLength += end.length;
            return "";
        }
    });
    return {
        src: src,
        mappings: mappings
    };
}
export function extractMap(src, original, opts) {
    var extract = extractMappings(src), map = createMap(extract.mappings, original, opts);
    return {
        src: extract.src,
        map: map
    };
}
function createMap(mappings, original, opts) {
    return {
        version: 3,
        file: opts.targetfile,
        sources: [opts.sourcefile],
        sourcesContent: [original],
        names: [],
        mappings: mappings
    };
}
export function appendMap(src, original, opts) {
    var extract = extractMap(src, original, opts), appended = extract.src
        + "\n//# sourceMappingURL=data:application/json,"
        + encodeURIComponent(JSON.stringify(extract.map));
    return appended;
}
function vlq(num) {
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
