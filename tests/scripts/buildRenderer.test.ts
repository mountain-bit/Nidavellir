import path from 'path'
import { describe, expect, it } from 'vitest'

// @ts-expect-error CommonJS script import in test suite
import buildRendererModule from '../../scripts/build-renderer.js'

const { rootDir, getEntryPoints, validateEntryPoints, createBuildConfig, buildRenderer, config } =
    buildRendererModule

describe('build-renderer.js', () => {
    describe('getEntryPoints', () => {
        it('powinien zwrócić obiekt ze wszystkimi wymaganymi punktami wejściowymi', () => {
            const entryPoints = getEntryPoints()
            expect(entryPoints).toBeDefined()
            expect(typeof entryPoints).toBe('object')

            // Główne ViewModel
            expect(entryPoints['ViewModel/MainWindowViewModel']).toBeDefined()
            expect(entryPoints['ViewModel/StartWindowViewModel']).toBeDefined()

            // Moduły
            expect(entryPoints['Modules/Graph/index']).toBeDefined()
            expect(entryPoints['Modules/Editor/index']).toBeDefined()
            expect(entryPoints['Modules/ImageEditor/index']).toBeDefined()

            // Kluczowe Serwisy
            expect(entryPoints['Services/ParagraphNumberingService']).toBeDefined()
            expect(entryPoints['Services/GraphValidationService']).toBeDefined()
            expect(entryPoints['Services/CombatMarkdownService']).toBeDefined()
            expect(entryPoints['Services/CombatSyncService']).toBeDefined()
            expect(entryPoints['Services/DescriptionTransclusionService']).toBeDefined()
            expect(entryPoints['Services/ItemExportService']).toBeDefined()
            expect(entryPoints['Services/RulesExportService']).toBeDefined()

            // Narzędzia Utils
            expect(entryPoints['Utils/translate']).toBeDefined()
            expect(entryPoints['Utils/toast']).toBeDefined()
            expect(entryPoints['Utils/pathSanitizer']).toBeDefined()
            expect(entryPoints['Utils/icons']).toBeDefined()
            expect(entryPoints['Utils/assetUtils']).toBeDefined()
        })

        it('wszystkie punkty wejściowe powinny wskazywać na pliki .ts', () => {
            const entryPoints = getEntryPoints()
            for (const targetPath of Object.values(entryPoints)) {
                expect((targetPath as string).endsWith('.ts')).toBe(true)
            }
        })
    })

    describe('validateEntryPoints', () => {
        it('wszystkie zadeklarowane punkty wejściowe w projekcie powinny istnieć na dysku', () => {
            const entryPoints = getEntryPoints()
            const missing = validateEntryPoints(entryPoints)
            expect(missing).toEqual([])
        })

        it('powinien wykryć nieistniejące punkty wejściowe i zwrócić ich listę', () => {
            const fakeEntries = {
                'Fake/Service': path.join(rootDir, 'Services', 'NonExistentService123.ts'),
            }
            const missing = validateEntryPoints(fakeEntries)
            expect(missing.length).toBe(1)
            expect(missing[0].name).toBe('Fake/Service')
            expect(missing[0].path).toContain('NonExistentService123.ts')
        })
    })

    describe('createBuildConfig', () => {
        it('powinien utworzyć domyślną konfigurację esbuild o wymaganych parametrach', () => {
            const generatedConfig = createBuildConfig()
            expect(generatedConfig.bundle).toBe(true)
            expect(generatedConfig.platform).toBe('browser')
            expect(generatedConfig.format).toBe('esm')
            expect(generatedConfig.target).toBe('es2020')
            expect(generatedConfig.sourcemap).toBe(true)
            expect(generatedConfig.outdir).toBe(path.join(rootDir, 'dist'))
        })

        it('powinien pozwalać na nadpisanie opcji konfiguracyjnych', () => {
            const customConfig = createBuildConfig({
                logLevel: 'silent',
                sourcemap: false,
            })
            expect(customConfig.logLevel).toBe('silent')
            expect(customConfig.sourcemap).toBe(false)
        })

        it('wyeksportowana stała config powinna być zgodna z createBuildConfig', () => {
            expect(config.platform).toBe('browser')
            expect(config.format).toBe('esm')
        })
    })

    describe('buildRenderer', () => {
        it('powinien rzucić błąd, gdy podano brakujący punkt wejściowy', async () => {
            const badConfig = createBuildConfig({
                entryPoints: {
                    'Broken/Entry': path.join(rootDir, 'does_not_exist_file.ts'),
                },
            })

            await expect(buildRenderer({ config: badConfig })).rejects.toThrow(
                /Brakujące pliki punktów wejściowych/
            )
        })
    })
})
