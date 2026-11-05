import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

import {
    createTempProjectDir,
    ITestAppInstance,
    launchTestApp,
    mockChooseFolderInMain,
    removeTempDir,
} from './helpers/electronApp'
import { MainWindowPage, StartWindowPage } from './page-objects'

// Valid minimal 1x1 PNG & JPEG sample buffers
const SAMPLE_PNG_BUFFER = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
)
const SAMPLE_JPG_BUFFER = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
)

test.describe('E2E: Menedżer zasobów graficznych (Asset Manager)', () => {
    let appInstance: ITestAppInstance
    let app: ITestAppInstance['app']
    let startPage: StartWindowPage
    let tempDir: string

    test.beforeEach(async () => {
        tempDir = createTempProjectDir('nidavelir-e2e-assets-')
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

    test('obsługuje pustą galerię, wykrywa grafiki, filtruje, wyświetla szczegóły, zmienia nazwę i usuwa plik z dysku', async () => {
        const projectName = 'Kroniki Grafik'
        const mainWindowPromise = app.waitForEvent('window')
        await startPage.createNewProject(projectName, tempDir)

        const rawWindow = await mainWindowPromise
        const mainPage = new MainWindowPage(rawWindow)

        await mainPage.waitForReady(projectName)

        // 1. Otwarcie pustego Menedżera Zasobów i weryfikacja stanu początkowego
        await mainPage.openAssetManager()
        await expect(mainPage.assetManagerModal()).toBeVisible()
        await expect(mainPage.assetManagerEmpty()).toBeVisible()
        await expect(mainPage.assetDetailPlaceholder()).toBeVisible()
        await expect(mainPage.assetDetailContent()).toBeHidden()

        // 2. Zamknięcie menedżera
        await mainPage.closeAssetManager()
        await expect(mainPage.assetManagerModal()).toBeHidden()

        // 3. Dodanie plików graficznych bezpośrednio do katalogu projektu Assets/Images/
        const imagesDir = path.join(tempDir, 'Assets', 'Images')
        fs.mkdirSync(imagesDir, { recursive: true })

        const mapFile = 'ancient-map.png'
        const potionFile = 'magic-potion.jpg'
        const emblemFile = 'dragon-emblem.png'

        fs.writeFileSync(path.join(imagesDir, mapFile), SAMPLE_PNG_BUFFER)
        fs.writeFileSync(path.join(imagesDir, potionFile), SAMPLE_JPG_BUFFER)
        fs.writeFileSync(path.join(imagesDir, emblemFile), SAMPLE_PNG_BUFFER)

        // 4. Ponowne otwarcie Menedżera Zasobów — pliki powinny zostać automatycznie wykryte
        await mainPage.openAssetManager()
        await expect(mainPage.assetManagerModal()).toBeVisible()
        await expect(mainPage.assetManagerEmpty()).toBeHidden()
        await expect(mainPage.assetCards()).toHaveCount(3)

        // 5. Wyszukiwanie grafiki po nazwie
        await mainPage.assetSearchInput().fill('potion')
        await expect(mainPage.assetCards()).toHaveCount(1)
        await expect(mainPage.assetCardByPath(`Assets/Images/${potionFile}`)).toBeVisible()

        // Wyczyszczenie wyszukiwarki
        await mainPage.assetSearchInput().fill('')
        await expect(mainPage.assetCards()).toHaveCount(3)

        // 6. Filtrowanie formatów po rozszerzeniu (png)
        await mainPage.assetFilterTypeSelect().selectOption('png')
        await expect(mainPage.assetCards()).toHaveCount(2)
        await expect(mainPage.assetCardByPath(`Assets/Images/${mapFile}`)).toBeVisible()
        await expect(mainPage.assetCardByPath(`Assets/Images/${emblemFile}`)).toBeVisible()

        // Przywrócenie filtra "all"
        await mainPage.assetFilterTypeSelect().selectOption('all')
        await expect(mainPage.assetCards()).toHaveCount(3)

        // 7. Zaznaczenie karty zasobu i weryfikacja panelu szczegółów
        const mapRelativePath = `Assets/Images/${mapFile}`
        await mainPage.selectAssetCard(mapRelativePath)

        await expect(mainPage.assetDetailPlaceholder()).toBeHidden()
        await expect(mainPage.assetDetailContent()).toBeVisible()
        await expect(mainPage.assetDetailName()).toHaveText(mapFile)
        await expect(mainPage.assetDetailPath()).toContainText(mapRelativePath)

        // 8. Zmiana nazwy zasobu (Rename dialog)
        const newMapBaseName = 'legendary_map'
        const newMapFileName = `${newMapBaseName}.png`
        const newMapRelativePath = `Assets/Images/${newMapFileName}`

        await mainPage.renameSelectedAsset(newMapBaseName)

        // Asercja w UI
        await expect(mainPage.assetDetailName()).toHaveText(newMapFileName)
        await expect(mainPage.assetCardByPath(newMapRelativePath)).toBeVisible()

        // Asercja na dysku
        expect(fs.existsSync(path.join(imagesDir, mapFile))).toBe(false)
        expect(fs.existsSync(path.join(imagesDir, newMapFileName))).toBe(true)

        // 9. Usunięcie zasobu z projektu (Delete dialog)
        const potionRelativePath = `Assets/Images/${potionFile}`
        await mainPage.selectAssetCard(potionRelativePath)
        await expect(mainPage.assetDetailName()).toHaveText(potionFile)

        await mainPage.deleteSelectedAsset()

        // Asercja w UI (pozostały 2 assety)
        await expect(mainPage.assetCards()).toHaveCount(2)
        await expect(mainPage.assetCardByPath(potionRelativePath)).toHaveCount(0)

        // Asercja na dysku
        expect(fs.existsSync(path.join(imagesDir, potionFile))).toBe(false)

        // 10. Zamknięcie Menedżera Zasobów
        await mainPage.closeAssetManager()
        await expect(mainPage.assetManagerModal()).toBeHidden()
    })
})
