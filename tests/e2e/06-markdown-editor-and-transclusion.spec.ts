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

test.describe('E2E: Edytor tekstu Markdown i przełączanie widoków', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-editor-')
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

    test('otwiera opis paragrafu w edytorze tekstu, modyfikuje treść, oznacza projekt jako dirty i zapisuje na dysk', async () => {
        const projectName = 'Kroniki Cieni'
        const narrativeText =
            'Stoisz w cieniu starych ruin zamku. W powietrzu unosi sie zapach ozonu.'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Zaznaczenie początkowego węzła na grafie i otwarcie pliku opisu z panelu właściwości
        await mainPage.selectParagraphNode(mainPage.firstParagraphNode())
        await expect(mainPage.openPlayerTextBtn()).toBeVisible()
        await mainPage.openActiveParagraphDescription()

        // 2. Przełączenie widoku na edytor Markdown
        await mainPage.switchToMarkdownView()
        await expect(mainPage.markdownContainer()).toBeVisible()
        await expect(mainPage.editorEmptyState()).toBeHidden()
        await expect(mainPage.activeFileLabel()).not.toHaveText('')

        // 3. Wprowadzenie nowej treści do edytora ProseMirror
        await mainPage.typeIntoEditor(narrativeText)

        // 4. Weryfikacja stanu projektu jako niezapisany (dirty)
        await expect(mainPage.dirtyIndicator()).toBeVisible()

        // 5. Zapisanie projektu i weryfikacja zresetowania flagi dirty
        await mainPage.saveProject()
        await expect(mainPage.dirtyIndicator()).toBeHidden()

        // 6. Weryfikacja zapisu pliku projektu oraz katalogu paragrafów na dysku
        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        const paragraphsDir = path.join(tempDir, 'Paragraphs')
        expect(fs.existsSync(paragraphsDir)).toBe(true)

        // 7. Płynny powrót do widoku grafu
        await mainPage.switchToGraphView()
        await expect(mainPage.graphContainer()).toBeVisible()
        await expect(mainPage.markdownContainer()).toBeHidden()
    })
})
