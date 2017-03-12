define('sourcemap', [], function () {
    var rx = {
            locs: /(\n)|(\u0000(\d+),(\d+)\u0000)|(\u0000\u0000)/g
        },
        vlqlast = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef",
        vlqcont = "ghijklmnopqrstuvwxyz0123456789+/";

    return {
        segmentStart: segmentStart,
        segmentEnd:   segmentEnd,
        extractMap:   extractMap,
        appendMap:    appendMap
    };

    function segmentStart(loc) {
        return "\u0000" + loc.line + "," + loc.col + "\u0000";
    }

    function segmentEnd() {
        return "\u0000\u0000";
    }

    function extractMappings(embedded) {
        var mappings = "",
            pgcol = 0,
            psline = 0,
            pscol = 0,
            insegment = false,
            linestart = 0,
            linecont = false;

        var src = embedded.replace(rx.locs, function (_, nl, start, line, col, end, offset) {
            if (nl) {
                mappings += ";";

                if (insegment) {
                    mappings += "AA" + vlq(1) + vlq(0 - pscol);
                    psline++;
                    pscol = 0;
                    linecont = true;
                } else {
                    linecont = false;
                }

                linestart = offset + nl.length;

                pgcol = 0;

                return nl;
            } else if (start) {
                var gcol = offset - linestart;
                line = parseInt(line);
                col = parseInt(col);

                mappings += (linecont ? "," : "")
                          + vlq(gcol - pgcol)
                          + "A" // only one file
                          + vlq(line - psline)
                          + vlq(col - pscol);

                insegment = true;
                linecont = true;

                pgcol = gcol;
                psline = line;
                pscol = col;

                return "";
            } else if (end) {
                insegment = false;
                return "";
            }
        });

        return {
            src: src,
            mappings: mappings
        };
    }

    function extractMap(src, original, opts) {
        var extract = extractMappings(src),
            map = createMap(extract.mappings, original);

        return {
            src: extract.src,
            map: map
        };
    }

    function createMap(mappings, original) {
        return {
            version       : 3,
            file          : 'out.js',
            sources       : [ 'in.js' ],
            sourcesContent: [ original ],
            names         : [],
            mappings      : mappings
        };
    }

    function appendMap(src, original, opts) {
        var extract = extractMap(src, original),
            appended = extract.src
              + "\n//# sourceMappingURL=data:"
              + encodeURIComponent(JSON.stringify(extract.map));

        return appended;
    }

    function vlq(num) {
        var str = "", i;

        // convert num sign representation from 2s complement to sign bit in lsd
        num = num < 0 ? (-num << 1) + 1 : num << 1 + 0;
        // convert num to base 32 number
        num = num.toString(32);

        // convert base32 digits of num to vlq continuation digits in reverse order
        for (i = num.length - 1; i > 0; i--)
            str += vlqcont[parseInt(num[i], 32)];

        // add final vlqlast digit
        str += vlqlast[parseInt(num[0], 32)];

        return str;
    }
});
