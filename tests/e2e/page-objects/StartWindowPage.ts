import { ElectronApplication, expect, Locator, Page } from '@playwright/test'

import { mockChooseFolderInMain } from '../helpers/electronApp'

export class StartWindowPage {
    readonly page: Page
    readonly app?: ElectronApplication

    constructor(page: Page, app?: ElectronApplication) {
        this.page = page
        this.app = app
    }

    // Locators
    readonly createProjectBtn = (): Locator => this.page.locator('#btn-create-project')
    readonly openProjectBtn = (): Locator => this.page.locator('#btn-open-project')
    readonly restoreProjectBtn = (): Locator => this.page.locator('#btn-restore-project')
    readonly closeAppBtn = (): Locator => this.page.locator('#btn-close-app')

    readonly newProjectModal = (): Locator => this.page.locator('#new-project-modal')
    readonly projectNameInput = (): Locator => this.page.locator('#np-name')
    readonly browseFolderBtn = (): Locator => this.page.locator('#btn-browse-folder')
    readonly folderDisplay = (): Locator => this.page.locator('#np-folder-display')
    readonly submitNewProjectBtn = (): Locator => this.page.locator('#btn-submit-new-project')
    readonly closeNewProjectModalBtn = (): Locator =>
        this.page.locator('#btn-close-new-project-modal')

    readonly settingsBtn = (): Locator => this.page.locator('#btn-settings')
    readonly settingsDropdown = (): Locator => this.page.locator('#settings-dropdown')
    readonly langPlBtn = (): Locator => this.page.locator('#btn-lang-pl')
    readonly langEnBtn = (): Locator => this.page.locator('#btn-lang-en')

    readonly recentProjectsList = (): Locator => this.page.locator('#recent-projects-list')
    readonly recentProjectItems = (): Locator => this.page.locator('#recent-projects-list button')
    readonly recentProjectItem = (name: string): Locator =>
        this.page.locator('#recent-projects-list button', { hasText: name })

    /**
     * Otwiera projekt z listy ostatnich projektów.
     */
    async openRecentProject(name: string): Promise<void> {
        const item = this.recentProjectItem(name)
        await expect(item).toBeVisible({ timeout: 5000 })
        await item.click()
    }

    /**
     * Wypełnia formularz i tworzy nowy projekt.
     */
    async createNewProject(name: string, folderPath: string): Promise<void> {
        if (this.app) {
            await mockChooseFolderInMain(this.app, folderPath)
        }
        await this.createProjectBtn().click()
        await expect(this.newProjectModal()).toBeVisible()

        await this.projectNameInput().fill(name)
        await this.browseFolderBtn().click()

        await expect(this.submitNewProjectBtn()).toBeEnabled()
        await this.submitNewProjectBtn().click()
    }
}
