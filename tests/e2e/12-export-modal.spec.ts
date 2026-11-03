import { expect, test } from '@playwright/test'

import {
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { DrawerPage, HeroModalPage, MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Eksport gry paragrafowej (Export Modal)', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-export-')
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

    test('otwiera modal eksportu, weryfikuje statystyki, przełącza formaty, konfiguruje styl i opcje kompilatora', async () => {
        const projectName = 'Wrota Eksportu'
        const secondNodeTitle = 'Rozdroża Cieni'
        const heroName = 'Sir Roland'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)
        const heroModalPage = new HeroModalPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Utworzenie drugiego połączonego paragrafu w grafie (2 paragrafy w projekcie)
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(startNode, secondNodeTitle)

        const secondNode = mainPage.page.locator('paragraph-node', {
            hasText: secondNodeTitle,
        })
        await expect(secondNode).toBeVisible()

        // 2. Dodanie karty bohatera gracza
        await drawerPage.openHeroModal()
        await heroModalPage.configureAndSaveHero(heroName)
        await expect(drawerPage.heroCardPreview()).toContainText(heroName)

        // 3. Otwarcie modalu eksportu
        await mainPage.openExportModal()
        await expect(mainPage.exportModal()).toBeVisible()

        // 4. Weryfikacja statystyk publikacji
        await expect(mainPage.exportStatCount()).toHaveText('2')

        // 5. Weryfikacja sekcji Karty Postaci (obecny bohater Sir Roland)
        await expect(mainPage.exportCharacterSheetContainer()).toBeVisible()
        await expect(mainPage.exportCharacterSheetCheckbox()).toBeChecked()
        await expect(mainPage.exportSingleHeroIndicator()).toContainText(heroName)

        // 6. Weryfikacja i przełączanie formatów (PDF -> DOCX -> ZIP -> PDF)
        await expect(mainPage.exportFormatCard('pdf')).toHaveClass(/border-blue-500/)
        await expect(mainPage.exportBookSection()).toBeVisible()
        await expect(mainPage.exportZipSection()).toBeHidden()

        // Przełączenie na DOCX
        await mainPage.selectExportFormat('docx')
        await expect(mainPage.exportFormatCard('docx')).toHaveClass(/border-blue-500/)
        await expect(mainPage.exportBookSection()).toBeVisible()
        await expect(mainPage.exportZipSection()).toBeHidden()

        // Przełączenie na ZIP (backup projektu)
        await mainPage.selectExportFormat('zip')
        await expect(mainPage.exportFormatCard('zip')).toHaveClass(/border-blue-500/)
        await expect(mainPage.exportZipSection()).toBeVisible()
        await expect(mainPage.exportBookSection()).toBeHidden()

        // Powrót do PDF
        await mainPage.selectExportFormat('pdf')
        await expect(mainPage.exportFormatCard('pdf')).toHaveClass(/border-blue-500/)
        await expect(mainPage.exportBookSection()).toBeVisible()
        await expect(mainPage.exportZipSection()).toBeHidden()

        // 7. Weryfikacja stylów typograficznych
        const styleOptions = mainPage.exportStyleSelect().locator('option')
        const styleCount = await styleOptions.count()
        expect(styleCount).toBeGreaterThanOrEqual(2)

        await mainPage.exportStyleSelect().selectOption('dark-grimoire')
        await expect(mainPage.exportStyleSelect()).toHaveValue('dark-grimoire')

        // 8. Konfiguracja opcji wydania i kompilatora
        await expect(mainPage.exportShuffleCheckbox()).toBeChecked()
        await mainPage.exportShuffleCheckbox().uncheck()
        await expect(mainPage.exportShuffleCheckbox()).not.toBeChecked()
        await mainPage.exportShuffleCheckbox().check()
        await expect(mainPage.exportShuffleCheckbox()).toBeChecked()

        await mainPage.exportSeparatorSelect().selectOption('page-break')
        await expect(mainPage.exportSeparatorSelect()).toHaveValue('page-break')

        // 9. Weryfikacja minipodglądu live
        await expect(mainPage.exportMiniPreview()).toBeVisible()

        // 10. Zamknięcie modalu przyciskiem Anuluj
        await mainPage.closeExportModal(false)
        await expect(mainPage.exportModal()).toBeHidden()

        // 11. Ponowne otwarcie i zamknięcie przyciskiem krzyżyka
        await mainPage.openExportModal()
        await expect(mainPage.exportModal()).toBeVisible()
        await mainPage.closeExportModal(true)
        await expect(mainPage.exportModal()).toBeHidden()
    })
})
