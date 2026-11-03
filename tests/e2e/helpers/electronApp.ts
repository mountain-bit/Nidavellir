import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'

export interface ITestAppInstance {
    app: ElectronApplication
    firstWindow: Page
}

/**
 * Uruchamia aplikację Electron w środowisku testowym Playwright.
 */
export async function launchTestApp(): Promise<ITestAppInstance> {
    const mainPath = path.resolve(__dirname, '../../../main.js')

    const cleanEnv: { [key: string]: string } = {}
    for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE') {
            cleanEnv[key] = value
        }
    }
    cleanEnv.NODE_ENV = 'test'

    const app = await electron.launch({
        args: [mainPath, '--no-sandbox', '--disable-gpu', '--window-size=1600,1000'],
        env: cleanEnv,
    })

    const firstWindow = await app.firstWindow()
    await firstWindow.waitForLoadState('domcontentloaded')

    return { app, firstWindow }
}

/**
 * Tworzy bezpieczny katalog tymczasowy na potrzeby testów projektu.
 */
export function createTempProjectDir(prefix = 'nidavelir-e2e-'): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/**
 * Usuwa katalog tymczasowy po teście.
 */
export function removeTempDir(dirPath: string): void {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true })
        }
    } catch {
        // Ignorujemy błędy usuwania plików tymczasowych
    }
}

/**
 * Mockuje handler 'choose-folder' w procesie głównym Electrona (ipcMain).
 */
export async function mockChooseFolderInMain(
    app: ElectronApplication,
    targetFolder: string
): Promise<void> {
    await app.evaluate(({ ipcMain }, folder) => {
        ipcMain.removeHandler('choose-folder')
        ipcMain.handle('choose-folder', async () => ({
            canceled: false,
            path: folder,
        }))
    }, targetFolder)
}
