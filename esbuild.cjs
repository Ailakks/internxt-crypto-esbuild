const esbuild = require('esbuild');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');

esbuild.build({
  entryPoints: ['./index.ts'],
  bundle: true,
  outfile: './dist/index.js',
  globalName: 'Internxt',
  plugins: [polyfillNode()],
  platform: 'browser',
  format: 'iife',
  define: {
    'import.meta.url': '"https://drive.internxt.com/login"'
  }
}).catch(() => process.exit(1));
