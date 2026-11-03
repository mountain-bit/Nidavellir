import { expect, test } from '@playwright/test'
import { ElectronApplication } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import { createTempProjectDir, launchTestApp, removeTempDir } from './helpers/electronApp'
import { MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Cykl życia projektu i persystencja danych', () => {
    let app: ElectronApplication
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-lifecycle-')
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

    test('tworzy nowy projekt, otwiera okno główne i zapisuje stan na dysku', async () => {
        const projectName = 'Przygoda E2E'

        // Oczekujemy na zdarzenie otwarcia nowego okna MainWindow
        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const mainRawPage = await mainWindowPromise
        const mainPage = new MainWindowPage(mainRawPage)

        await mainPage.waitForReady(projectName)

        // Klikamy przycisk zapisu w pasku górnym
        await expect(mainPage.saveBtn()).toBeVisible()
        await mainPage.saveProject()

        // Sprawdzamy fizyczne istnienie pliku projektu na dysku
        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        const raw = fs.readFileSync(projectJsonPath, 'utf-8')
        const projectData = JSON.parse(raw)
        expect(projectData.name).toBe(projectName)
    })
})
