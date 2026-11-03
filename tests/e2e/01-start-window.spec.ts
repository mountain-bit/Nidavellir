import { ElectronApplication, expect, test } from '@playwright/test'

import { launchTestApp } from './helpers/electronApp'
import { StartWindowPage } from './page-objects'

test.describe('E2E: Ekran startowy (StartWindow)', () => {
    let app: ElectronApplication
    let startPage: StartWindowPage

    test.beforeEach(async () => {
        const instance = await launchTestApp()
        app = instance.app
        startPage = new StartWindowPage(instance.firstWindow, instance.app)
    })

    test.afterEach(async () => {
        if (app) {
            await app.close()
        }
    })

    test('uruchamia aplikację i wyświetla główne przyciski startowe', async () => {
        const title = await startPage.page.title()
        expect(title).toContain('Nidavelir')

        await expect(startPage.createProjectBtn()).toBeVisible()
        await expect(startPage.openProjectBtn()).toBeVisible()
        await expect(startPage.restoreProjectBtn()).toBeVisible()
        await expect(startPage.closeAppBtn()).toBeVisible()
    })

    test('otwiera i zamyka modal tworzenia nowego projektu', async () => {
        // Początkowo modal jest ukryty
        await expect(startPage.newProjectModal()).toBeHidden()

        // Kliknięcie "Stwórz nowy projekt" otwiera modal
        await startPage.createProjectBtn().click()
        await expect(startPage.newProjectModal()).toBeVisible()

        // Przycisk "Utwórz projekt" jest zablokowany bez danych
        await expect(startPage.submitNewProjectBtn()).toBeDisabled()

        // Wpisanie nazwy
        await startPage.projectNameInput().fill('Przygoda Testowa')
        await expect(startPage.projectNameInput()).toHaveValue('Przygoda Testowa')

        // Zamknięcie modala krzyżykiem
        await startPage.closeNewProjectModalBtn().click()
        await expect(startPage.newProjectModal()).toBeHidden()
    })

    test('otwiera menu ustawień i pozwala na zmianę języka', async () => {
        await expect(startPage.settingsDropdown()).toBeHidden()

        await startPage.settingsBtn().click()
        await expect(startPage.settingsDropdown()).toBeVisible()

        await expect(startPage.langPlBtn()).toBeVisible()
        await expect(startPage.langEnBtn()).toBeVisible()
    })
})
