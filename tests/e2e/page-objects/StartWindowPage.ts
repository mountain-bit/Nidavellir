import { expect, Locator, Page } from '@playwright/test'

export class StartWindowPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
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

    /**
     * Mockuje wybór folderu w API electronAPI.chooseFolder.
     */
    async mockChooseFolder(targetFolder: string): Promise<void> {
        await this.page.evaluate((folder: string): void => {
            const api = (
                window as unknown as { electronAPI: { chooseFolder: () => Promise<unknown> } }
            ).electronAPI
            if (api) {
                api.chooseFolder = async (): Promise<unknown> => ({
                    canceled: false,
                    path: folder,
                })
            }
        }, targetFolder)
    }

    /**
     * Wypełnia formularz i tworzy nowy projekt.
     */
    async createNewProject(name: string, folderPath: string): Promise<void> {
        await this.mockChooseFolder(folderPath)
        await this.createProjectBtn().click()
        await expect(this.newProjectModal()).not.toHaveClass(/hidden/)

        await this.projectNameInput().fill(name)
        await this.browseFolderBtn().click()

        await expect(this.submitNewProjectBtn()).toBeEnabled()
        await this.submitNewProjectBtn().click()
    }
}
