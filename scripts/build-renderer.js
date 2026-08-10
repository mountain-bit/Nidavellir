/**
 * Buduje bundle renderera (ViewModel + Utils + i18next) do jednego pliku JS.
 * Używany przez npm scripts: build, start.
 */

const esbuild = require('esbuild');
const path = require('path');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: {
    'StartWindowViewModel': path.join(__dirname, '..', 'ViewModel', 'StartWindowViewModel.ts'),
  },
  bundle: true,
  outdir: path.join(__dirname, '..', 'dist', 'ViewModel'),
  platform: 'browser',
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  // Nie bundlujemy electronAPI — jest wstrzykiwane przez preload jako window.electronAPI
  external: [],
  // Loader dla JSON (i18next potrzebuje translation.json)
  loader: { '.json': 'json' },
  logLevel: 'info',
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('[esbuild] Watching for changes...');
  } else {
    await esbuild.build(config);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
