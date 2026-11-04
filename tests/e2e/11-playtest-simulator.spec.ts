import { expect, test } from '@playwright/test'

import {
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Symulator rozgrywki (Playtest)', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-playtest-')
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

    test('uruchamia symulator, nawiguje po wyborach, cofa krok, restartuje i wykonuje teleportację', async () => {
        const projectName = 'Wyprawa do Podziemi'
        const middleNodeTitle = 'Pieczara Goblinów'
        const finaleNodeTitle = 'Skarbiec Krasnoludów'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Zbudowanie ścieżki fabularnej: Start -> Pieczara Goblinów -> Skarbiec Krasnoludów (Finał)
        const startNode = mainPage.firstParagraphNode()
        await expect(startNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(startNode, middleNodeTitle)

        const middleNode = mainPage.page.locator('paragraph-node', {
            hasText: middleNodeTitle,
        })
        await expect(middleNode).toBeVisible()
        await mainPage.addNewConnectedParagraph(middleNode, finaleNodeTitle)

        const finaleNode = mainPage.page.locator('paragraph-node', {
            hasText: finaleNodeTitle,
        })
        await expect(finaleNode).toBeVisible()
        await mainPage.selectParagraphNode(finaleNode)
        await mainPage.setParagraphAsEndNode()

        // 2. Wybór węzła początkowego i uruchomienie symulatora Playtest
        await mainPage.selectParagraphNode(startNode)
        await mainPage.openPlaytest()
        await expect(mainPage.playtestModal()).toBeVisible()
        await expect(mainPage.playtestParagraphBadge()).toBeVisible()

        // 3. Wykonanie pierwszego wyboru prowadzącego do Pieczary Goblinów
        await mainPage.choosePlaytestOption(0)
        await expect(mainPage.playtestParagraphBadge()).toContainText(middleNodeTitle)

        // 4. Test cofnięcia kroku (Step Back)
        await mainPage.stepBackPlaytest()
        await expect(mainPage.playtestParagraphBadge()).not.toContainText(middleNodeTitle)

        // 5. Ponowne przejście w głąb podziemi do finału
        await mainPage.choosePlaytestOption(0)
        await expect(mainPage.playtestParagraphBadge()).toContainText(middleNodeTitle)

        await mainPage.choosePlaytestOption(0)
        await expect(mainPage.playtestParagraphBadge()).toContainText(finaleNodeTitle)
        await expect(mainPage.playtestChoicesContainer()).toContainText('Koniec ścieżki fabularnej')

        // 6. Test restartu rozgrywki
        await mainPage.restartPlaytest()
        await expect(mainPage.playtestParagraphBadge()).not.toContainText(finaleNodeTitle)

        // 7. Test mechanizmu teleportacji do węzła finałowego
        await mainPage.teleportPlaytest(finaleNodeTitle)
        await expect(mainPage.playtestParagraphBadge()).toContainText(finaleNodeTitle)

        // 8. Zamknięcie symulatora rozgrywki
        await mainPage.closePlaytest()
        await expect(mainPage.playtestModal()).toBeHidden()
    })
})
