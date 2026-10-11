/* eslint-disable no-console */
const esbuild = require('esbuild')
const path = require('path')

const watch = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const config = {
    entryPoints: {
        'ViewModel/StartWindowViewModel': path.join(
            __dirname,
            '..',
            'ViewModel',
            'StartWindowViewModel.ts'
        ),
        'ViewModel/MainWindowViewModel': path.join(
            __dirname,
            '..',
            'ViewModel',
            'MainWindowViewModel.ts'
        ),
        'Utils/translate': path.join(__dirname, '..', 'Utils', 'translate.ts'),
        'Utils/toast': path.join(__dirname, '..', 'Utils', 'toast.ts'),
        'Utils/pathSanitizer': path.join(__dirname, '..', 'Utils', 'pathSanitizer.ts'),
        'Utils/icons': path.join(__dirname, '..', 'Utils', 'icons.ts'),
        'Utils/assetUtils': path.join(__dirname, '..', 'Utils', 'assetUtils.ts'),
        'Utils/assetUsageTracker': path.join(__dirname, '..', 'Utils', 'assetUsageTracker.ts'),
        'Services/ParagraphNumberingService': path.join(
            __dirname,
            '..',
            'Services',
            'ParagraphNumberingService.ts'
        ),
        'Modules/Graph/index': path.join(__dirname, '..', 'Modules', 'Graph', 'index.ts'),
        'Modules/Editor/index': path.join(__dirname, '..', 'Modules', 'Editor', 'index.ts'),
        'Modules/ImageEditor/index': path.join(
            __dirname,
            '..',
            'Modules',
            'ImageEditor',
            'index.ts'
        ),
    },
    bundle: true,
    outdir: path.join(__dirname, '..', 'dist'),
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    external: [],
    loader: { '.json': 'json', '.html': 'text' },
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
