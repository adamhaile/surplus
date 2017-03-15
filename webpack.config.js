var webpack = require('webpack');

module.exports = {
    entry: {
        Surplus: "./src/runtime/Surplus.ts",
        preprocessor: "./src/preprocessor/preprocessor.ts"
    },

    output: {
        path: ".",
        filename: "[name].js",
        library: "[name]",
        libraryTarget: "umd"
    },

    resolve: {
        extensions: [".ts", ".js"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
};