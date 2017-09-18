export default {
	entry: 'es/index.js',
	dest: 'index.js',
	format: 'umd',
    moduleName: 'Surplus',
    exports: 'named',
    external: ['s-js'],
    globals: { 's-js': "S"}
}