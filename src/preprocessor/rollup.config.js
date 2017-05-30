export default {
	entry: 'packages/surplus-preprocessor/es/preprocessor.js',
	dest: 'packages/surplus-preprocessor/index.js',
	format: 'umd',
    moduleName: 'SurplusPreprocessor',
    exports: 'named',
    onwarn: function (warning) {
        // TS emits some helpers with code that causes rollup to carp.  This disables that error.
        if (warning.code !== 'THIS_IS_UNDEFINED') console.error(warning.message);
    }
}