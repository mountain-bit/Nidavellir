import { ElectronApplication, expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import { createTempProjectDir, launchTestApp, removeTempDir } from './helpers/electronApp'
import { DrawerPage, HeroModalPage, MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Zarządzanie światem RPG (Szuflada, Tagi, Karta Bohatera)', () => {
    let app: ElectronApplication
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-rpg-')
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

    test('dodaje tag fabularny oraz tworzy kartę głównego bohatera i zapisuje je w projekcie', async () => {
        const projectName = 'Kroniki Miradoru'
        const tagName = 'Klatwa Zamku'
        const heroName = 'Alrik z Miradoru'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)
        const heroModalPage = new HeroModalPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Dodanie tagu fabularnego w szufladzie
        await drawerPage.createTag(tagName)

        // 2. Otwarcie kreatora Bohatera i zapisanie karty postaci
        await drawerPage.openHeroModal()
        await heroModalPage.configureAndSaveHero(heroName)

        // Sprawdzamy podgląd karty bohatera w szufladzie
        await expect(drawerPage.heroCardPreview()).toContainText(heroName)

        // 3. Zapisanie projektu i asercja danych na fizycznym dysku
        await mainPage.saveProject()

        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        const raw = fs.readFileSync(projectJsonPath, 'utf-8')
        const data = JSON.parse(raw)

        // Weryfikacja taga w danych projektu
        const tagExists = data.tags?.some((t: { name?: string }) => t.name === tagName)
        expect(tagExists).toBe(true)

        // Weryfikacja bohatera gracza w danych projektu
        expect(data.playerCharacter).toBeDefined()
        expect(data.playerCharacter.name).toBe(heroName)
    })
})
