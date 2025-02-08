const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  globalName: 'Internxt',
  plugins: [],
  platform: 'browser',
  format: 'iife',
  define: {
    'import.meta.url': '"https://drive.internxt.com/login"',
    'global': 'window'
  },
  alias: {
    crypto: 'crypto-browserify',
    stream: 'stream-browserify'
  },
  external: ['events', 'fs', 'path'],
  inject: [require.resolve('buffer')],
  minify: true
}).catch(() => process.exit(1));
