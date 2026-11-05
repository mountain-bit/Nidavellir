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

test.describe('E2E: Graf fabuły, węzły paragrafów i sceny', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-graph-')
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

    test('tworzy połączony paragraf na grafie, nową scenę w szufladzie i zapisuje relacje na dysku', async () => {
        const projectName = 'Wrota Przeznaczenia'
        const connectedParagraphTitle = 'Mroczna Pieczara'
        const sceneName = 'Podziemia Zamku'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Weryfikacja obecności początkowego węzła START na płótnie
        await expect(mainPage.storyGraphCanvas()).toBeVisible()
        await expect(mainPage.firstParagraphNode()).toBeVisible()
        const initialNodesCount = await mainPage.paragraphNodes().count()
        expect(initialNodesCount).toBeGreaterThanOrEqual(1)

        // 2. Dodanie nowego paragrafu połączonego wyborem z węzła początkowego
        const startNode = mainPage.firstParagraphNode()
        await mainPage.addNewConnectedParagraph(startNode, connectedParagraphTitle)

        // Weryfikacja obecności 2 węzłów na grafie
        await expect(mainPage.paragraphNodes()).toHaveCount(initialNodesCount + 1)
        const newNode = rawWindow.locator('paragraph-node', {
            hasText: connectedParagraphTitle,
        })
        await expect(newNode).toBeVisible()

        // 3. Zaznaczenie nowego węzła i weryfikacja otwarcia panelu właściwości
        await mainPage.selectParagraphNode(newNode)
        await expect(mainPage.rightSidebar()).toBeVisible()
        await expect(mainPage.detailsContent()).toBeVisible()

        // 4. Utworzenie nowej sceny w lewej szufladzie
        await drawerPage.createScene(sceneName)
        await expect(drawerPage.scenesListContainer()).toContainText(sceneName)

        // 5. Zapisanie projektu i asercja persystencji grafu i scen na dysku
        await mainPage.saveProject()

        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        const raw = fs.readFileSync(projectJsonPath, 'utf-8')
        const data = JSON.parse(raw)

        expect(data.name).toBe(projectName)
        expect(data.graph).toBeDefined()
        expect(Array.isArray(data.graph.scenes)).toBe(true)

        // Weryfikacja obecności nowej sceny w danych projektu
        const sceneExists = data.graph.scenes.some(
            (s: { name?: string; title?: string }) => s.name === sceneName || s.title === sceneName
        )
        expect(sceneExists).toBe(true)
    })
})
