export default {
	entry: 'packages/Surplus/es/Surplus.js',
	dest: 'packages/Surplus/index.js',
	format: 'umd',
    moduleName: 'Surplus',
    exports: 'named',
    external: ['s-js'],
    globals: { 's-js': "S"}
}