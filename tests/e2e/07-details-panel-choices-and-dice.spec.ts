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
import { MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Panel właściwości, wybory paragrafów i testy kości', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-choices-')
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

    test('dodaje połączenie, modyfikuje nazwę wyboru, konfiguruje warunek oraz test rzutu kością i zapisuje stan na dysku', async () => {
        const projectName = 'Labirynt Przeznaczenia'
        const connectedParagraphTitle = 'Komnata Wyboru'
        const updatedChoiceName = 'Przejdź przez runiczne wrota'
        const conditionText = 'Wymaga znajomości pradawnego języka run'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Dodanie nowego paragrafu połączonego z paragrafem startowym
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(startNode, connectedParagraphTitle)

        // 2. Wybór węzła startowego i weryfikacja modułu wyjść w prawym panelu
        await mainPage.selectParagraphNode(startNode)
        await expect(mainPage.detailsExitsList()).toBeVisible()
        await expect(mainPage.firstInspectExitBtn()).toBeVisible()

        // 3. Przejście do szczegółowej edycji wyboru
        await mainPage.inspectFirstExit()
        await expect(mainPage.choiceNameInput()).toBeVisible()

        // 4. Modyfikacja nazwy wyboru
        await mainPage.renameChoice(updatedChoiceName)
        await expect(mainPage.choiceNameInput()).toHaveValue(updatedChoiceName)

        // 5. Dodanie warunku tekstowego
        await mainPage.addTextConditionToChoice(conditionText)
        await expect(mainPage.choiceConditionTextInput()).toHaveValue(conditionText)

        // 6. Dodanie i konfiguracja testu rzutu kością
        await mainPage.addDiceCheckToChoice({
            dice: '1k20',
            stat: 'Mądrość',
            desc: 'Test odczytania inskrypcji',
        })
        await expect(mainPage.choiceDiceTypeSelect()).toHaveValue('1k20')
        await expect(mainPage.choiceDiceStatInput()).toHaveValue('Mądrość')
        await expect(mainPage.choiceDiceDescInput()).toHaveValue('Test odczytania inskrypcji')
        await expect(mainPage.choiceDiceBranchesList()).toBeVisible()

        // 7. Weryfikacja flagi niespójności / zmian (dirty)
        await expect(mainPage.dirtyIndicator()).toBeVisible()

        // 8. Zapis projektu i weryfikacja zresetowania flagi dirty
        await mainPage.saveProject()
        await expect(mainPage.dirtyIndicator()).toBeHidden()

        // 9. Persystencja na dysku: weryfikacja zapisu w katalogu Paragraphs
        const paragraphsDir = path.join(tempDir, 'Paragraphs')
        expect(fs.existsSync(paragraphsDir)).toBe(true)

        const subfolders = fs
            .readdirSync(paragraphsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        expect(subfolders.length).toBeGreaterThan(0)

        let foundPersistedChoice = false
        for (const folder of subfolders) {
            const elementJsonPath = path.join(paragraphsDir, folder, 'element.json')
            if (fs.existsSync(elementJsonPath)) {
                try {
                    const rawData = fs.readFileSync(elementJsonPath, 'utf8')
                    const data = JSON.parse(rawData)
                    if (Array.isArray(data.choices)) {
                        const matching = data.choices.find(
                            (c: {
                                name?: string
                                condition?: { text?: string }
                                diceCheck?: { dice?: string; stat?: string }
                            }) =>
                                c.name === updatedChoiceName ||
                                c.condition?.text === conditionText ||
                                c.diceCheck?.stat === 'Mądrość'
                        )
                        if (matching) {
                            foundPersistedChoice = true
                            expect(matching.name).toBe(updatedChoiceName)
                            expect(matching.diceCheck?.dice).toBe('1k20')
                            expect(matching.diceCheck?.stat).toBe('Mądrość')
                            break
                        }
                    }
                } catch {
                    // ignoruj pojedyncze parsowanie
                }
            }
        }

        expect(foundPersistedChoice).toBe(true)
    })
})
