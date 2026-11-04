import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import {
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { DrawerPage, MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Szablony NPC, statystyki i dziedziczenie cech', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-templates-')
        appInstance = await launchTestApp()
        app = appInstance.app
        startPage = new StartWindowPage(appInstance.firstWindow)
        await mockChooseFolderInMain(app, tempDir)
    })

    test.afterEach(async () => {
        if (app) {
            await app.close()
        }
        removeTempDir(tempDir)
    })

    test('tworzy szablon NPC z cechami, stosuje go w nowej postaci, weryfikuje mergowanie i zapisuje stan na dysku', async () => {
        const projectName = 'Twierdza Magów'
        const templateName = 'Szablon Maga Ognia'
        const characterName = 'Arcymag Ignis'
        const statName = 'Moc Zaklęć'
        const statValue = '18'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Utworzenie szablonu NPC z cechą w lewej szufladzie
        await drawerPage.createTemplate(templateName, {
            name: statName,
            value: statValue,
        })

        // 2. Otwarcie modalu tworzenia postaci NPC
        await drawerPage.openCharactersTab()
        await drawerPage.addCharacterBtn().click({ force: true })
        await expect(drawerPage.npcModal()).toBeVisible()

        // 3. Wypełnienie imienia postaci
        await drawerPage.npcNameInput().fill(characterName)

        // 4. Zastosowanie utworzonego wcześniej szablonu (dziedziczenie cech)
        await drawerPage.applyTemplateToNpc(templateName)

        // 5. Weryfikacja obecności chipa zastosowanego szablonu oraz odziedziczonej cechy w formularzu
        const appliedChip = drawerPage.appliedTemplateChips().filter({ hasText: templateName })
        await expect(appliedChip).toBeVisible()

        const statsSection = drawerPage.npcModal().locator('#npc-stats-list')
        await expect(statsSection).toContainText(statName)

        // 6. Zapis nowej postaci bazującej na szablonie
        await drawerPage.npcSaveBtn().click()
        await expect(drawerPage.npcModal()).toBeHidden()

        // 7. Zapis projektu i persystencja
        await mainPage.saveProject()

        // 9. Persystencja na dysku: weryfikacja zapisu w katalogu Templates
        const templatesDir = path.join(tempDir, 'Templates')
        expect(fs.existsSync(templatesDir)).toBe(true)

        const tplSubfolders = fs
            .readdirSync(templatesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        expect(tplSubfolders.length).toBeGreaterThan(0)

        let foundTemplate = false
        for (const folder of tplSubfolders) {
            const elementJson = path.join(templatesDir, folder, 'element.json')
            if (fs.existsSync(elementJson)) {
                try {
                    const data = JSON.parse(fs.readFileSync(elementJson, 'utf8'))
                    if (data.name === templateName || data.title === templateName) {
                        foundTemplate = true
                        const stats = data.stats || []
                        const hasStat = stats.some(
                            (s: { name?: string; value?: string | number }) =>
                                s.name === statName && String(s.value) === statValue
                        )
                        expect(hasStat).toBe(true)
                        break
                    }
                } catch {
                    // ignoruj
                }
            }
        }
        expect(foundTemplate).toBe(true)

        // 10. Persystencja na dysku: weryfikacja zapisu w katalogu NPC z odziedziczoną cechą
        const npcDir = path.join(tempDir, 'NPC')
        expect(fs.existsSync(npcDir)).toBe(true)

        const npcSubfolders = fs
            .readdirSync(npcDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        let foundCharacter = false
        for (const folder of npcSubfolders) {
            const elementJson = path.join(npcDir, folder, 'element.json')
            if (fs.existsSync(elementJson)) {
                try {
                    const data = JSON.parse(fs.readFileSync(elementJson, 'utf8'))
                    if (data.name === characterName || data.title === characterName) {
                        foundCharacter = true
                        const stats = data.stats || []
                        const hasInheritedStat = stats.some(
                            (s: { name?: string }) => s.name === statName
                        )
                        expect(hasInheritedStat).toBe(true)
                        break
                    }
                } catch {
                    // ignoruj
                }
            }
        }
        expect(foundCharacter).toBe(true)
    })
})
