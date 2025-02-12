const esbuild = require('esbuild');
const { nodeModulesPolyfillPlugin } = require('esbuild-plugins-node-modules-polyfill');

esbuild.build({
    entryPoints: ['./index.ts'],
    bundle: true,
    outfile: './dist/index.js',
    globalName: 'Internxt',
    platform: 'browser',
    format: 'iife',
    define: {
        'import.meta.url': '"https://drive.internxt.com/login"',
        'global': 'window'
    },
    plugins: [
        nodeModulesPolyfillPlugin({ fallback: 'none', globals: { Buffer: true, process: true }, modules: { crypto: false, fs: true, path: true } })
    ],
    alias: {
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        'node:buffer': 'buffer',
        'node:process': 'process'
    },
    inject: [],
    minify: true
}).catch(() => process.exit(1));
