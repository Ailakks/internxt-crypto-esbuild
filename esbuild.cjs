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
    'import.meta.url': '"https://drive.internxt.com/login"'
  },
  alias: {
    crypto: 'crypto-browserify'
  },
  external: ['buffer', 'events', 'stream', 'fs', 'path']
}).catch(() => process.exit(1));
