import { expect, test } from '@playwright/test'
import { ElectronApplication } from '@playwright/test'

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
        startPage = new StartWindowPage(instance.firstWindow)
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
        await expect(mainPage.zoomLevelBadge()).toHaveText('100%')

        // Przybliżenie
        await mainPage.zoomInBtn().click()
        await expect(mainPage.zoomLevelBadge()).not.toHaveText('100%')

        // Reset skali widoku
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
