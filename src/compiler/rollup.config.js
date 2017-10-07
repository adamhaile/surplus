export default {
	input: 'compiler/es/index.js',
	output: {
        file: 'compiler/index.js',
        format: 'umd'
    },
    name: 'SurplusCompiler',
    exports: 'named',
    onwarn: function (warning) {
        // TS emits some helpers with code that causes rollup to carp.  This disables that error.
        if (warning.code !== 'THIS_IS_UNDEFINED') console.error(warning.message);
    }
}