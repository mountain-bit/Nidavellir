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

test.describe('E2E: Walidacja grafu fabuły i rozwiązywanie niespójności', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-validation-')
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

    test('uruchamia walidację grafu, nawiguje do wykrytych uwag, naprawia strukturę przez dodanie zakończenia i weryfikuje pełną poprawność', async () => {
        const projectName = 'Ścieżki Przeznaczenia'
        const endingParagraphTitle = 'Wrota Przeznaczenia'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Otwarcie raportu walidacji w początkowym projekcie (brak wyznaczonego zakończenia/wyjść)
        await mainPage.openValidationReport()
        await expect(mainPage.validationSummaryText()).not.toHaveText('')
        await expect(mainPage.validationIssuesContainer()).toBeVisible()

        // 2. Weryfikacja przycisku nawigacji "Pokaż" i przejście do węzła źródłowego
        const gotoBtn = mainPage.validationGotoBtns().first()
        await expect(gotoBtn).toBeVisible()
        await gotoBtn.click()

        // Modal powinien się zamknąć, a węzeł i prawy panel właściwości powinny być aktywne
        await expect(mainPage.validationModal()).toBeHidden()
        await expect(mainPage.rightSidebar()).toBeVisible()

        // 3. Naprawa struktury: dodanie nowego paragrafu połączonego z węzłem startowym
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(startNode, endingParagraphTitle)

        // 4. Zaznaczenie nowego paragrafu i oznaczenie go jako węzeł finałowy (koniec)
        const endingNode = mainPage.page.locator('paragraph-node', {
            hasText: endingParagraphTitle,
        })
        await expect(endingNode).toBeVisible()
        await mainPage.selectParagraphNode(endingNode)

        await mainPage.setParagraphAsEndNode()
        await expect(mainPage.paragraphRoleBadge()).not.toHaveText('')

        // 5. Ponowne uruchomienie walidacji – graf powinien być teraz w 100% spójny
        await mainPage.openValidationReport()
        await expect(mainPage.validationIssuesContainer()).toContainText('w 100% poprawny')

        // 6. Zamknięcie raportu walidacji
        await mainPage.closeValidationReport()

        // 7. Zapis projektu
        await mainPage.saveProject()
        await expect(mainPage.dirtyIndicator()).toBeHidden()

        // 8. Weryfikacja persystencji na dysku: paragraf finałowy ma flagę isEnd w pliku element.json
        const paragraphsDir = path.join(tempDir, 'Paragraphs')
        expect(fs.existsSync(paragraphsDir)).toBe(true)

        const subfolders = fs
            .readdirSync(paragraphsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

        let foundEndParagraph = false
        for (const folder of subfolders) {
            const elementJson = path.join(paragraphsDir, folder, 'element.json')
            if (fs.existsSync(elementJson)) {
                try {
                    const data = JSON.parse(fs.readFileSync(elementJson, 'utf8'))
                    if (data.title === endingParagraphTitle || data.name === endingParagraphTitle) {
                        if (data.isEnd === true) {
                            foundEndParagraph = true
                            break
                        }
                    }
                } catch {
                    // ignoruj
                }
            }
        }
        expect(foundEndParagraph).toBe(true)
    })
})
