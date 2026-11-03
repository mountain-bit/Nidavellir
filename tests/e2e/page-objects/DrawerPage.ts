import { expect, Locator, Page } from '@playwright/test'

export class DrawerPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    // Tab Buttons
    readonly paragraphsTabBtn = (): Locator =>
        this.page.locator('button[data-left-tab="paragraphs"]')
    readonly scenesTabBtn = (): Locator => this.page.locator('button[data-left-tab="scenes"]')
    readonly tagsTabBtn = (): Locator => this.page.locator('button[data-left-tab="tags"]')
    readonly charactersTabBtn = (): Locator =>
        this.page.locator('button[data-left-tab="characters"]')
    readonly itemsTabBtn = (): Locator => this.page.locator('button[data-left-tab="items"]')
    readonly traitsTabBtn = (): Locator => this.page.locator('button[data-left-tab="traits"]')
    readonly heroTabBtn = (): Locator => this.page.locator('button[data-left-tab="main-character"]')

    // Scenes Section Locators
    readonly scenesContent = (): Locator => this.page.locator('#left-content-scenes')
    readonly addSceneBtn = (): Locator => this.page.locator('#btn-add-scene')
    readonly sceneCreateForm = (): Locator => this.page.locator('#scene-create-form')
    readonly sceneCreateNameInput = (): Locator => this.page.locator('#scene-create-name')
    readonly sceneCreateSubmitBtn = (): Locator => this.page.locator('#scene-create-submit')
    readonly scenesListContainer = (): Locator => this.page.locator('#scenes-list-container')

    // Tags Section Locators
    readonly tagsContent = (): Locator => this.page.locator('#left-content-tags')
    readonly addTagBtn = (): Locator => this.page.locator('#btn-add-tag')
    readonly tagCreateForm = (): Locator => this.page.locator('#tag-create-form')
    readonly tagCreateNameInput = (): Locator => this.page.locator('#tag-create-name')
    readonly tagCreateSubmitBtn = (): Locator => this.page.locator('#tag-create-submit')
    readonly tagsListContainer = (): Locator => this.page.locator('#tags-list-container')

    // Hero Section Locators
    readonly heroContent = (): Locator => this.page.locator('#left-content-main-character')
    readonly openHeroModalBtn = (): Locator => this.page.locator('#btn-add-main-character')
    readonly heroCardPreview = (): Locator => this.page.locator('#main-character-container')

    // Characters / NPC Section Locators
    readonly charactersContent = (): Locator => this.page.locator('#left-content-characters')
    readonly addCharacterBtn = (): Locator => this.page.locator('#btn-add-character')
    readonly addTemplateBtn = (): Locator => this.page.locator('#btn-add-template')

    /**
     * Przełącza na zakładkę Tagów i tworzy nowy tag.
     */
    async createTag(name: string): Promise<void> {
        await this.tagsTabBtn().click()
        await expect(this.tagsContent()).toBeVisible()

        await this.addTagBtn().click()
        await expect(this.tagCreateForm()).toBeVisible()

        await this.tagCreateNameInput().fill(name)
        await this.tagCreateSubmitBtn().click()

        // Sprawdzamy czy tag pojawił się na liście
        await expect(this.tagsListContainer()).toContainText(name)
    }

    /**
     * Przełącza na zakładkę Scen i tworzy nową scenę.
     */
    async createScene(name: string): Promise<void> {
        await this.scenesTabBtn().click()
        await expect(this.scenesContent()).toBeVisible()

        await this.addSceneBtn().click()
        await expect(this.sceneCreateForm()).toBeVisible()

        await this.sceneCreateNameInput().fill(name)
        await this.sceneCreateSubmitBtn().click()

        // Sprawdzamy czy scena pojawiła się na liście
        await expect(this.scenesListContainer()).toContainText(name)
    }

    /**
     * Otwiera modal Bohatera z poziomu zakładki Bohatera w szufladzie.
     */
    async openHeroModal(): Promise<void> {
        await this.heroTabBtn().click()
        await expect(this.heroContent()).toBeVisible()
        await this.openHeroModalBtn().click()
    }
}
