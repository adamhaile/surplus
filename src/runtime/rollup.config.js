export default {
    input: 'es/index.js',
    output: {
        file: 'index.js',
        format: 'umd'
    },
    name: 'Surplus',
    exports: 'named',
    external: ['s-js'],
    globals: { 's-js': "S"}
}