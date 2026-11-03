import { expect, Locator, Page } from '@playwright/test'

export class MainWindowPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    // Top Bar Locators
    readonly projectNameDisplay = (): Locator => this.page.locator('#project-name-display')
    readonly dirtyIndicator = (): Locator => this.page.locator('#project-dirty-indicator')
    readonly saveBtn = (): Locator => this.page.locator('button[data-action="save"]')
    readonly quickSearchBtn = (): Locator => this.page.locator('button[data-action="quick-search"]')
    readonly validationBadge = (): Locator => this.page.locator('#topbar-validation-badge')

    // Quick Search Modal
    readonly quickSearchModal = (): Locator => this.page.locator('#modal-quick-search')
    readonly quickSearchInput = (): Locator => this.page.locator('#quick-search-input')
    readonly quickSearchResults = (): Locator => this.page.locator('#quick-search-results')

    // Unsaved Changes Modal
    readonly unsavedChangesModal = (): Locator => this.page.locator('#unsaved-changes-modal')
    readonly unsavedSaveBtn = (): Locator => this.page.locator('#btn-unsaved-save')
    readonly unsavedDontSaveBtn = (): Locator => this.page.locator('#btn-unsaved-dont-save')
    readonly unsavedCancelBtn = (): Locator => this.page.locator('#btn-unsaved-cancel')

    // Story Graph Canvas & Controls
    readonly storyGraphCanvas = (): Locator => this.page.locator('#story-graph')
    readonly zoomInBtn = (): Locator => this.page.locator('#btn-graph-zoom-in')
    readonly zoomOutBtn = (): Locator => this.page.locator('#btn-graph-zoom-out')
    readonly zoomResetBtn = (): Locator => this.page.locator('#btn-graph-zoom-reset')
    readonly zoomFitBtn = (): Locator => this.page.locator('#btn-graph-zoom-fit')
    readonly zoomLevelBadge = (): Locator => this.page.locator('#graph-zoom-level-badge')

    /**
     * Oczekuje na pełne załadowanie okna głównego i widoczność projektu.
     */
    async waitForReady(expectedProjectName?: string): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded')
        await this.page.setViewportSize({ width: 1400, height: 900 }).catch(() => {})
        await expect(this.projectNameDisplay()).toBeVisible({ timeout: 15000 })
        if (expectedProjectName) {
            await expect(this.projectNameDisplay()).toContainText(expectedProjectName)
        }
    }

    /**
     * Klika przycisk Zapisz w górnym pasku.
     */
    async saveProject(): Promise<void> {
        await this.saveBtn().click({ force: true })
    }

    /**
     * Otwiera modal szybkiego wyszukiwania.
     */
    async openQuickSearch(): Promise<void> {
        await this.quickSearchBtn().click()
        await expect(this.quickSearchModal()).toBeVisible()
    }

    /**
     * Zamyka modal szybkiego wyszukiwania klawiszem Escape.
     */
    async closeQuickSearch(): Promise<void> {
        await this.page.keyboard.press('Escape')
        await expect(this.quickSearchModal()).toBeHidden()
    }
}
