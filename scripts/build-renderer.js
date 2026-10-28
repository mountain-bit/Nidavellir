/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const rootDir = path.resolve(__dirname, '..')

function getEntryPoints(baseDir = rootDir) {
    return {
        'ViewModel/StartWindowViewModel': path.join(
            baseDir,
            'ViewModel',
            'StartWindowViewModel.ts'
        ),
        'ViewModel/MainWindowViewModel': path.join(baseDir, 'ViewModel', 'MainWindowViewModel.ts'),
        'Utils/translate': path.join(baseDir, 'Utils', 'i18n', 'translate.ts'),
        'Utils/toast': path.join(baseDir, 'Utils', 'ui', 'toast.ts'),
        'Utils/pathSanitizer': path.join(baseDir, 'Utils', 'fs', 'pathSanitizer.ts'),
        'Utils/icons': path.join(baseDir, 'Utils', 'ui', 'icons.ts'),
        'Utils/assetUtils': path.join(baseDir, 'Utils', 'assets', 'assetUtils.ts'),
        'Utils/assetUsageTracker': path.join(baseDir, 'Utils', 'assets', 'assetUsageTracker.ts'),
        'Services/ParagraphNumberingService': path.join(
            baseDir,
            'Services',
            'graph',
            'ParagraphNumberingService.ts'
        ),
        'Services/GraphValidationService': path.join(
            baseDir,
            'Services',
            'graph',
            'GraphValidationService.ts'
        ),
        'Services/CombatMarkdownService': path.join(
            baseDir,
            'Services',
            'combat',
            'CombatMarkdownService.ts'
        ),
        'Services/CombatSyncService': path.join(
            baseDir,
            'Services',
            'combat',
            'CombatSyncService.ts'
        ),
        'Services/DescriptionTransclusionService': path.join(
            baseDir,
            'Services',
            'markdown',
            'DescriptionTransclusionService.ts'
        ),
        'Services/EntityLinkUpdateService': path.join(
            baseDir,
            'Services',
            'markdown',
            'EntityLinkUpdateService.ts'
        ),
        'Services/ItemExportService': path.join(
            baseDir,
            'Services',
            'export',
            'ItemExportService.ts'
        ),
        'Services/RulesExportService': path.join(
            baseDir,
            'Services',
            'export',
            'RulesExportService.ts'
        ),
        'Modules/Graph/index': path.join(baseDir, 'Modules', 'Graph', 'index.ts'),
        'Modules/Editor/index': path.join(baseDir, 'Modules', 'Editor', 'index.ts'),
        'Modules/ImageEditor/index': path.join(baseDir, 'Modules', 'ImageEditor', 'index.ts'),
    }
}

function validateEntryPoints(entryPoints) {
    const missing = []
    for (const [name, targetPath] of Object.entries(entryPoints)) {
        if (!fs.existsSync(targetPath)) {
            missing.push({ name, path: targetPath })
        }
    }
    return missing
}

function createBuildConfig(overrides = {}) {
    const entryPoints = overrides.entryPoints || getEntryPoints()
    return {
        entryPoints,
        bundle: true,
        outdir: path.join(rootDir, 'dist'),
        platform: 'browser',
        format: 'esm',
        target: 'es2020',
        sourcemap: true,
        external: [],
        loader: { '.json': 'json', '.html': 'text' },
        logLevel: 'info',
        ...overrides,
    }
}

const config = createBuildConfig()

async function buildRenderer(options = {}) {
    const watch = options.watch ?? process.argv.includes('--watch')
    const buildConfig = options.config ?? createBuildConfig(options.overrides)

    const missing = validateEntryPoints(buildConfig.entryPoints)
    if (missing.length > 0) {
        const errorMsg =
            'Brakujące pliki punktów wejściowych (entry points):\n' +
            missing.map(m => ` - ${m.name}: ${m.path}`).join('\n')
        throw new Error(errorMsg)
    }

    if (watch) {
        const ctx = await esbuild.context(buildConfig)
        await ctx.watch()
        console.log('[esbuild] Watching for changes...')
        return ctx
    }

    return await esbuild.build(buildConfig)
}

if (require.main === module) {
    buildRenderer().catch(err => {
        console.error(err)
        process.exit(1)
    })
}

module.exports = {
    rootDir,
    getEntryPoints,
    validateEntryPoints,
    createBuildConfig,
    buildRenderer,
    config,
}
