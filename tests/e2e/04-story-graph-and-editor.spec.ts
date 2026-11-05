import { ElectronApplication, expect, test } from '@playwright/test'

import { createTempProjectDir, launchTestApp, removeTempDir } from './helpers/electronApp'
import { MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Graf fabuły i narzędzia obszaru roboczego (Cytoscape, Zoom, QuickSearch)', () => {
    let app: ElectronApplication
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-workspace-')
        const instance = await launchTestApp()
        app = instance.app
        startPage = new StartWindowPage(instance.firstWindow, instance.app)
    })

    test.afterEach(async () => {
        if (app) {
            await app.close()
        }
        removeTempDir(tempDir)
    })

    test('weryfikuje kontrolki grafu Cytoscape oraz globalną wyszukiwarkę', async () => {
        const projectName = 'Labirynt Cieni'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Sprawdzenie obecności płótna grafu fabuły
        await expect(mainPage.storyGraphCanvas()).toBeVisible()

        // 2. Kontrolki powiększenia (Zoom)
        // Początkowa skala jest dopasowana do kontenera grafu
        await expect(mainPage.zoomLevelBadge()).toHaveText(/\d+%/)
        const initialZoom = await mainPage.zoomLevelBadge().innerText()

        // Przybliżenie
        await mainPage.zoomInBtn().click()
        await expect(mainPage.zoomLevelBadge()).not.toHaveText(initialZoom)

        // Reset skali widoku (ustawia dokładnie 100%)
        await mainPage.zoomResetBtn().click()
        await expect(mainPage.zoomLevelBadge()).toHaveText('100%')

        // 3. Szybkie szukanie (QuickSearch)
        await mainPage.openQuickSearch()
        await mainPage.quickSearchInput().fill('Start')
        await expect(mainPage.quickSearchResults()).toBeVisible()

        // Zamknięcie wyszukiwarki klawiszem Escape
        await mainPage.closeQuickSearch()
    })
})
