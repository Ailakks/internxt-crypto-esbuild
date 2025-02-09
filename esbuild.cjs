const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  globalName: 'Internxt',
  platform: 'browser',
  format: 'iife',
  define: {
    'global': 'window'
  },
  plugins: [

  ],
  alias: {
    crypto: 'crypto-browserify',
    stream: 'stream-browserify',
    path: 'path-browserify'
  },
  inject: ['./shims.js'],
  external: ['fs', 'url', 'http', 'https', 'os', 'zlib', 'assert'],
  minify: true
}).catch(() => process.exit(1));
