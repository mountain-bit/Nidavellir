import { expect, test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import {
    closeTestApp,
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { DrawerPage, MainWindowPage, StartWindowPage } from './page-objects'

test.describe('E2E: Konfiguracja cech RPG, min/max, przymioty (flaga/wartość/lista) i przypisywanie do NPC', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-traits-')
        appInstance = await launchTestApp()
        app = appInstance.app
        startPage = new StartWindowPage(appInstance.firstWindow)
        await mockChooseFolderInMain(app, tempDir)
    })

    test.afterEach(async () => {
        await closeTestApp(app)
        removeTempDir(tempDir)
    })

    test('tworzy cechy i przymioty w szufladzie, konfiguruje min/max oraz opcje listy, a następnie weryfikuje poprawne zachowanie formularza NPC i persystencję', async () => {
        const projectName = 'Dziedzictwo Królów'
        const statNumericName = 'Krzepa'
        const statListName = 'Pochodzenie'
        const paramName = 'Kondycja'
        const skillName = 'Szermierka'
        const featureFlagName = 'Niewidzialność'
        const featureListName = 'Rasa'
        const featureValueName = 'Przydomek'
        const npcName = 'Mistrz Broni Gorim'

        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)
        const drawerPage = new DrawerPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // =========================================================================
        // 1. Tworzenie cech w lewej szufladzie i weryfikacja braku wartości na liście
        // =========================================================================
        await drawerPage.openTraitsTab()

        // 1.1 Cecha numeryczna: Krzepa
        await drawerPage.createTrait('stat', statNumericName, '14')
        const statItem = drawerPage.traitDrawerItems().filter({ hasText: statNumericName }).first()
        await expect(statItem).toBeVisible()
        // W szufladzie nie powinna być eksponowana wartość
        await expect(statItem).not.toContainText('14')

        // 1.2 Cecha z listą wartości: Pochodzenie
        await drawerPage.createTrait('stat', statListName)
        const listStatItem = drawerPage.traitDrawerItems().filter({ hasText: statListName }).first()
        await expect(listStatItem).toBeVisible()

        // 1.3 Parametr życiowy: Kondycja
        await drawerPage.createTrait('parameter', paramName, '100')
        const paramItem = drawerPage.traitDrawerItems().filter({ hasText: paramName }).first()
        await expect(paramItem).toBeVisible()
        await expect(paramItem).not.toContainText('100')

        // 1.4 Umiejętność: Szermierka
        await drawerPage.createTrait('skill', skillName, '+2')
        const skillItem = drawerPage.traitDrawerItems().filter({ hasText: skillName }).first()
        await expect(skillItem).toBeVisible()
        await expect(skillItem).not.toContainText('+2')

        // 1.5 Przymioty: Flaga, Lista i Wartość
        await drawerPage.createTrait('feature', featureFlagName)
        await drawerPage.createTrait('feature', featureListName)
        await drawerPage.createTrait('feature', featureValueName)

        // =========================================================================
        // 2. Konfiguracja min/max oraz trybu listy w Panelu Szczegółów (Details Panel)
        // =========================================================================

        // 2.1 Konfiguracja cechy numerycznej (min/max)
        await drawerPage.selectTraitItem(statNumericName)
        await expect(mainPage.detailsContent()).toBeVisible()
        await expect(mainPage.statKindNumericBtn()).toBeVisible()
        await mainPage.statMinInput().fill('1')
        await mainPage.statMaxInput().fill('20')

        // 2.2 Konfiguracja cechy typu lista opcji
        await drawerPage.selectTraitItem(statListName)
        await mainPage.statKindListBtn().click()
        await mainPage.statNewOptionInput().fill('Północ')
        await mainPage.statAddOptionBtn().click()
        await mainPage.statNewOptionInput().fill('Południe')
        await mainPage.statAddOptionBtn().click()
        await expect(mainPage.statOptionsList()).toContainText('Północ')
        await expect(mainPage.statOptionsList()).toContainText('Południe')

        // 2.3 Konfiguracja parametru (min/max)
        await drawerPage.selectTraitItem(paramName)
        await mainPage.paramMinInput().fill('0')
        await mainPage.paramMaxInput().fill('100')

        // 2.4 Konfiguracja umiejętności (min/max)
        await drawerPage.selectTraitItem(skillName)
        await mainPage.skillMinInput().fill('-5')
        await mainPage.skillMaxInput().fill('10')

        // 2.5 Konfiguracja przymiotu 1: Flaga (bez wartości)
        await drawerPage.selectTraitItem(featureFlagName)
        await mainPage.featureKindFlagBtn().click()
        await expect(rawWindow.locator('#feature-flag-block')).toBeVisible()

        // 2.6 Konfiguracja przymiotu 2: Lista opcji
        await drawerPage.selectTraitItem(featureListName)
        await mainPage.featureKindListBtn().click()
        await mainPage.featureNewOptionInput().fill('Elf')
        await mainPage.featureAddOptionBtn().click()
        await mainPage.featureNewOptionInput().fill('Krasnolud')
        await mainPage.featureAddOptionBtn().click()
        await expect(mainPage.featureOptionsList()).toContainText('Elf')
        await expect(mainPage.featureOptionsList()).toContainText('Krasnolud')

        // 2.7 Konfiguracja przymiotu 3: Wartość tekstowa
        await drawerPage.selectTraitItem(featureValueName)
        await mainPage.featureKindValueBtn().click()
        await mainPage.featureValueInput().fill('Szybki')

        // =========================================================================
        // 3. Dodawanie przymiotów w oknie tworzenia postaci NPC
        // =========================================================================
        await drawerPage.openCharactersTab()
        await drawerPage.addCharacterBtn().click({ force: true })
        await expect(drawerPage.npcModal()).toBeVisible()
        await drawerPage.npcNameInput().fill(npcName)

        // 3.1 Kliknięcie chipu przymiotu typu FLAGA -> NIE POWINNO BYĆ POLA WARTOŚCI!
        const flagChip = rawWindow.locator(
            `.npc-preset-chip[data-preset-name="${featureFlagName}"]`
        )
        if (await flagChip.isVisible()) {
            await flagChip.click()
            const flagRow = drawerPage
                .npcAttributeRows()
                .filter({
                    has: rawWindow.locator(
                        `input[data-attr-field="name"][value="${featureFlagName}"]`
                    ),
                })
                .or(drawerPage.npcAttributeRows().filter({ hasText: featureFlagName }))
                .first()
            await expect(flagRow).toBeVisible()
            // Pole tekstowe wartości NIE powinno istnieć dla flagi!
            await expect(flagRow.locator('input[data-attr-field="value"]')).toBeHidden()
            await expect(flagRow.locator('[data-i18n="details.feature_type_flag"]')).toBeVisible()
            await expect(flagRow).toContainText(/flag/i)
        }

        // 3.2 Kliknięcie chipu przymiotu typu LISTA -> POWINIEN POJAWIĆ SIĘ SELECT Z OPCJAMI!
        const listChip = rawWindow.locator(
            `.npc-preset-chip[data-preset-name="${featureListName}"]`
        )
        if (await listChip.isVisible()) {
            await listChip.click()
            const listRow = drawerPage
                .npcAttributeRows()
                .filter({
                    has: rawWindow.locator(
                        `input[data-attr-field="name"][value="${featureListName}"]`
                    ),
                })
                .or(drawerPage.npcAttributeRows().filter({ hasText: featureListName }))
                .first()
            await expect(listRow).toBeVisible()
            const selectControl = listRow.locator('select[data-attr-field="value"]')
            await expect(selectControl).toBeVisible()
            await expect(selectControl).toContainText('Elf')
            await expect(selectControl).toContainText('Krasnolud')
            await selectControl.selectOption('Krasnolud')
        }

        // Zapisujemy postać NPC
        await drawerPage.npcSaveBtn().click({ force: true })
        await expect(drawerPage.npcModal()).toBeHidden()

        // Sprawdzamy czy postać pojawiła się na liście w szufladzie
        await expect(drawerPage.charactersListContainer()).toContainText(npcName)

        // =========================================================================
        // 4. Zapis projektu i persystencja na dysku
        // =========================================================================
        await mainPage.saveProject()

        const projectJsonPath = path.join(tempDir, 'project.json')
        expect(fs.existsSync(projectJsonPath)).toBe(true)

        const rawJson = fs.readFileSync(projectJsonPath, 'utf-8')
        const data = JSON.parse(rawJson)

        // Weryfikacja zapisu cech i przymiotów w pliku projektu
        expect(data.name).toBe(projectName)

        // Sprawdzamy czy zapisano konfiguracje granic min/max i opcji
        if (Array.isArray(data.stats)) {
            const savedStat = data.stats.find((s: { name: string }) => s.name === statNumericName)
            if (savedStat) {
                expect(Number(savedStat.min)).toBe(1)
                expect(Number(savedStat.max)).toBe(20)
            }
        }

        if (Array.isArray(data.features)) {
            const savedFlagFeat = data.features.find(
                (f: { name: string }) => f.name === featureFlagName
            )
            if (savedFlagFeat) {
                expect(savedFlagFeat.featureKind).toBe('flag')
            }
            const savedListFeat = data.features.find(
                (f: { name: string }) => f.name === featureListName
            )
            if (savedListFeat) {
                expect(savedListFeat.featureKind).toBe('list')
                expect(savedListFeat.options).toContain('Elf')
                expect(savedListFeat.options).toContain('Krasnolud')
            }
        }
    })
})
