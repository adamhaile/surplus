define('preprocess', ['tokenize', 'parse', 'shims', 'sourcemap'], function (tokenize, parse, shimmed, sourcemap) {
    return function preprocess(str, opts) {
        opts = opts || {};
        opts.symbol = opts.symbol || 'Html';
        opts.sourcemap = opts.sourcemap || null;
        opts.jsx = opts.jsx || false;

        var toks = tokenize(str, opts),
            ast = parse(toks, opts);

        if (shimmed) ast.shim();

        var code = ast.genCode(opts),
            out;

        if (opts.sourcemap === 'extract') out = sourcemap.extractMap(code, str, opts);
        else if (opts.sourcemap === 'append') out = sourcemap.appendMap(code, str, opts);
        else out = code;

        return out;
    }
});
