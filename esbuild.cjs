const esbuild = require('esbuild');
const {polyfillNode} = require('esbuild-plugin-polyfill-node');

esbuild.build({
  entryPoints: ['./index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  globalName: 'Internxt',
  plugins: [polyfillNode()],
  platform: 'browser',
  format: 'iife',
  define: {}
}).catch(() => process.exit(1));
