import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

import {
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Cykl zamykania i ponownego otwierania projektu (Close & Reopen)', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-close-reopen-')
        appInstance = await launchTestApp()
        app = appInstance.app
        startPage = new StartWindowPage(appInstance.firstWindow, app)
        await mockChooseFolderInMain(app, tempDir)
    })

    test.afterEach(async () => {
        if (app) {
            await app.close().catch(() => {})
        }
        removeTempDir(tempDir)
    })

    test('zamyka projekt do ekranu startowego, wznawia go z listy ostatnich i chroni przed utratą niezapisanych zmian', async () => {
        const projectName = 'Wrota Czasu'
        const middleNodeTitle = 'Wieża Obserwacyjna'
        const extraNodeTitle = 'Zapomniany Loch'

        // 1. Utworzenie nowego projektu i otwarcie okna głównego
        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 2. Dodanie połączonego węzła i zapis projektu na dysku
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(startNode, middleNodeTitle)

        const middleNode = mainPage.page.locator('paragraph-node', {
            hasText: middleNodeTitle,
        })
        await expect(middleNode).toBeVisible()

        await mainPage.saveProject()
        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        // 3. Zamknięcie projektu czystego (bez zmian) powraca do okna startowego
        const startWindowPromise = app.waitForEvent('window')
        await mainPage.closeProject()

        if (
            await mainPage
                .unsavedChangesModal()
                .isVisible({ timeout: 1500 })
                .catch(() => false)
        ) {
            await mainPage.unsavedDontSaveBtn().click()
        }

        const startWinRaw = await startWindowPromise
        const secondStartPage = new StartWindowPage(startWinRaw, app)

        // 4. Weryfikacja obecności projektu na liście ostatnich projektów w StartWindow
        await expect(secondStartPage.createProjectBtn()).toBeVisible({ timeout: 10000 })
        const recentItem = secondStartPage.recentProjectItem(projectName)
        await expect(recentItem).toBeVisible()

        // 5. Otwarcie projektu z listy ostatnich
        const reloadedMainWindowPromise = app.waitForEvent('window')
        await secondStartPage.openRecentProject(projectName)

        const reloadedRawWindow = await reloadedMainWindowPromise
        const reloadedMainPage = new MainWindowPage(reloadedRawWindow)

        await reloadedMainPage.waitForReady(projectName)

        // Weryfikacja, że graf został poprawnie odtworzony
        const restoredMiddleNode = reloadedMainPage.page.locator('paragraph-node', {
            hasText: middleNodeTitle,
        })
        await expect(restoredMiddleNode).toBeVisible()

        // 6. Ochrona przed utratą niezapisanych zmian:
        // Wprowadzamy zmianę (nowy węzeł) powodującą stan "brudny" (dirty)
        await reloadedMainPage.addNewConnectedParagraph(restoredMiddleNode, extraNodeTitle)
        const extraNode = reloadedMainPage.page.locator('paragraph-node', {
            hasText: extraNodeTitle,
        })
        await expect(extraNode).toBeVisible()
        await expect(reloadedMainPage.dirtyIndicator()).toBeVisible()

        // 7. Próba zamknięcia projektu z niezapisanymi zmianami
        await reloadedMainPage.closeProject()

        // Oczekujemy na modal ostrzeżenia o niezapisanych zmianach
        await expect(reloadedMainPage.unsavedChangesModal()).toBeVisible()

        // Test Anuluj (Cancel) — użytkownik rezygnuje z wyjścia
        await reloadedMainPage.unsavedCancelBtn().click()
        await expect(reloadedMainPage.unsavedChangesModal()).toBeHidden()
        await expect(reloadedMainPage.projectNameDisplay()).toBeVisible()

        // 8. Ponowna próba zamknięcia i wybór Zapisz (Save & Close)
        const finalStartWindowPromise = app.waitForEvent('window')
        await reloadedMainPage.closeProject()
        await expect(reloadedMainPage.unsavedChangesModal()).toBeVisible()

        await reloadedMainPage.unsavedSaveBtn().click()

        // Oczekujemy na pomyślne zamknięcie okna głównego i ponowne otwarcie StartWindow
        const finalStartWinRaw = await finalStartWindowPromise
        const finalStartPage = new StartWindowPage(finalStartWinRaw, app)
        await expect(finalStartPage.createProjectBtn()).toBeVisible({ timeout: 10000 })

        // 9. Potwierdzenie persystencji zmian na dysku po wyborze "Zapisz"
        const savedProjectContent = fs.readFileSync(projectJsonPath, 'utf-8')
        expect(savedProjectContent).toContain(extraNodeTitle)
    })
})
