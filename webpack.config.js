var webpack = require('webpack');

module.exports = {
    entry: {
        Surplus: "./src/runtime/Surplus.ts",
        "surplus-preprocessor": "./src/preprocessor/preprocessor.ts"
    },

    output: {
        path: "./packages",
        filename: "[name]/index.js",
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