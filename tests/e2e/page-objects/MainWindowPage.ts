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
    readonly paragraphNodes = (): Locator => this.page.locator('paragraph-node')
    readonly firstParagraphNode = (): Locator => this.page.locator('paragraph-node').first()

    // Right Details Panel
    readonly rightSidebar = (): Locator => this.page.locator('#right-sidebar')
    readonly detailsContent = (): Locator => this.page.locator('#details-content')

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
        await this.saveBtn().dispatchEvent('click')
    }

    /**
     * Otwiera modal szybkiego wyszukiwania.
     */
    async openQuickSearch(): Promise<void> {
        await this.quickSearchBtn().dispatchEvent('click')
        if (!(await this.quickSearchModal().isVisible())) {
            await this.page.keyboard.press('Control+p')
        }
        await expect(this.quickSearchModal()).toBeVisible()
    }

    /**
     * Zamyka modal szybkiego wyszukiwania klawiszem Escape.
     */
    async closeQuickSearch(): Promise<void> {
        await this.page.keyboard.press('Escape')
        await expect(this.quickSearchModal()).toBeHidden()
    }

    /**
     * Tworzy nowy paragraf połączony wyborem z wybranego węzła źródłowego.
     */
    async addNewConnectedParagraph(sourceNode: Locator, title: string): Promise<void> {
        const addBtn = sourceNode.locator('.paragraph-node-add-btn')
        await addBtn.click()
        const addInput = sourceNode.locator('.paragraph-node-add-input')
        await expect(addInput).toBeVisible()
        await addInput.fill(title)
        const addSubmit = sourceNode.locator('.paragraph-node-add-submit')
        await addSubmit.click()
        await expect(this.page.locator('paragraph-node', { hasText: title })).toBeVisible()
    }

    /**
     * Zaznacza węzeł paragrafu na płótnie, otwierając prawy panel właściwości.
     */
    async selectParagraphNode(nodeLocator: Locator): Promise<void> {
        await nodeLocator.locator('.paragraph-node-header').click()
        await expect(this.rightSidebar()).toBeVisible()
    }
}
