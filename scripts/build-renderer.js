/* eslint-disable no-console */
const esbuild = require('esbuild')
const path = require('path')

const watch = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const config = {
    entryPoints: {
        StartWindowViewModel: path.join(__dirname, '..', 'ViewModel', 'StartWindowViewModel.ts'),
    },
    bundle: true,
    outdir: path.join(__dirname, '..', 'dist', 'ViewModel'),
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    external: [],
    loader: { '.json': 'json' },
    logLevel: 'info',
}

async function main() {
    if (watch) {
        const ctx = await esbuild.context(config)
        await ctx.watch()
        console.log('[esbuild] Watching for changes...')
    } else {
        await esbuild.build(config)
    }
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
