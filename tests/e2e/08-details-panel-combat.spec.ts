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

test.describe('E2E: Panel właściwości, moduł walki i przeciwnicy', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-combat-')
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

    test('tworzy postać NPC, aktywuje walkę w paragrafie, dodaje przeciwnika i rezultat starcia oraz zapisuje stan na dysku', async () => {
        const projectName = 'Koloseum Cieni'
        const npcName = 'Ogr Bojowy'
        const outcomeName = 'Zwycięstwo nad Ogrem'
        const outcomeParagraphTitle = 'Komnata Nagród'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Utworzenie postaci NPC w lewej szufladzie
        await drawerPage.createNpc(npcName)

        // 2. Dodanie połączonego węzła paragrafu na grafie i jego zaznaczenie
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        const combatParagraphTitle = 'Arena Walki'
        await mainPage.addNewConnectedParagraph(startNode, combatParagraphTitle)

        const combatNode = mainPage.page.locator('paragraph-node', {
            hasText: combatParagraphTitle,
        })
        await expect(combatNode).toBeVisible()
        await mainPage.selectParagraphNode(combatNode)

        // 3. Aktywacja modułu walki w prawym panelu właściwości
        await mainPage.toggleCombat()
        await expect(mainPage.combatToggleBtn()).toHaveAttribute('aria-pressed', 'true')

        // 4. Dodanie przeciwnika (stworzonego NPC) do listy wrogów w starciu
        await mainPage.addCombatOpponent(npcName)
        await expect(mainPage.combatOpponentsList()).toContainText(npcName)

        // 5. Dodanie rezultatu walki tworzącego nowy paragraf na grafie
        await mainPage.addCombatOutcome(outcomeName, outcomeParagraphTitle)
        await expect(mainPage.combatOutcomesList()).toContainText(outcomeParagraphTitle)

        // Weryfikacja pojawienia się nowego węzła na grafie
        const newParagraphNode = mainPage.page.locator('paragraph-node', {
            hasText: outcomeParagraphTitle,
        })
        await expect(newParagraphNode).toBeVisible()

        // 6. Weryfikacja flagi niespójności projektu (dirty)
        await expect(mainPage.dirtyIndicator()).toBeVisible()

        // 7. Zapis projektu i weryfikacja zresetowania flagi dirty
        await mainPage.saveProject()
        await expect(mainPage.dirtyIndicator()).toBeHidden()

        // 8. Weryfikacja persystencji na dysku: katalog NPC
        const npcDir = path.join(tempDir, 'NPC')
        expect(fs.existsSync(npcDir)).toBe(true)

        const npcSubfolders = fs
            .readdirSync(npcDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        expect(npcSubfolders.length).toBeGreaterThan(0)

        let foundNpc = false
        for (const folder of npcSubfolders) {
            const elementJson = path.join(npcDir, folder, 'element.json')
            if (fs.existsSync(elementJson)) {
                try {
                    const data = JSON.parse(fs.readFileSync(elementJson, 'utf8'))
                    if (data.name === npcName || data.title === npcName) {
                        foundNpc = true
                        break
                    }
                } catch {
                    // ignoruj
                }
            }
        }
        expect(foundNpc).toBe(true)

        // 9. Weryfikacja persystencji na dysku: walka i przeciwnicy w paragrafie
        const paragraphsDir = path.join(tempDir, 'Paragraphs')
        expect(fs.existsSync(paragraphsDir)).toBe(true)

        const paragraphSubfolders = fs
            .readdirSync(paragraphsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        let foundCombatParagraph = false
        for (const folder of paragraphSubfolders) {
            const elementJson = path.join(paragraphsDir, folder, 'element.json')
            if (fs.existsSync(elementJson)) {
                try {
                    const data = JSON.parse(fs.readFileSync(elementJson, 'utf8'))
                    if (data.hasCombat === true && data.combat) {
                        foundCombatParagraph = true
                        const opps = data.combat.opponents || []
                        const outcomes = data.combat.outcomes || []
                        expect(opps.length).toBeGreaterThan(0)
                        expect(
                            outcomes.some((o: { name?: string }) => o.name === outcomeName)
                        ).toBe(true)
                        break
                    }
                } catch {
                    // ignoruj
                }
            }
        }
        expect(foundCombatParagraph).toBe(true)
    })
})
