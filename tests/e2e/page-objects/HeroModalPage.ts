import { expect, Locator, Page } from '@playwright/test'

export class HeroModalPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }

    readonly modal = (): Locator => this.page.locator('#hero-create-modal')
    readonly nameInput = (): Locator => this.page.locator('#hero-name-input')
    readonly saveBtn = (): Locator => this.page.locator('#btn-save-hero-modal')
    readonly closeBtn = (): Locator => this.page.locator('#btn-close-hero-modal')

    /**
     * Weryfikuje widoczność modala bohatera.
     */
    async waitForOpen(): Promise<void> {
        await expect(this.modal()).toBeVisible()
    }

    /**
     * Wpisuje imię bohatera i zapisuje kartę postaci.
     */
    async configureAndSaveHero(name: string): Promise<void> {
        await this.waitForOpen()
        await this.nameInput().fill(name)
        await this.saveBtn().click()
        await expect(this.modal()).toBeHidden()
    }
}
