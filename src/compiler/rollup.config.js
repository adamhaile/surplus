export default {
	entry: 'compiler/es/index.js',
	dest: 'compiler/index.js',
	format: 'umd',
    moduleName: 'SurplusCompiler',
    exports: 'named',
    onwarn: function (warning) {
        // TS emits some helpers with code that causes rollup to carp.  This disables that error.
        if (warning.code !== 'THIS_IS_UNDEFINED') console.error(warning.message);
    }
}