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

    // Traits / Stats Section Locators
    readonly traitsContent = (): Locator => this.page.locator('#left-content-traits')
    readonly addTraitBtn = (): Locator => this.page.locator('#btn-add-trait')
    readonly traitCreateForm = (): Locator => this.page.locator('#trait-create-form')
    readonly traitCreateTypeSelect = (): Locator => this.page.locator('#trait-create-type')
    readonly traitCreateNameInput = (): Locator => this.page.locator('#trait-create-name')
    readonly traitCreateValueInput = (): Locator => this.page.locator('#trait-create-value')
    readonly traitCreateSubmitBtn = (): Locator => this.page.locator('#trait-create-submit')
    readonly traitsListContainer = (): Locator => this.page.locator('#traits-list-container')
    readonly traitDrawerItems = (): Locator =>
        this.page.locator('#traits-list-container .drawer-item')

    // Hero Section Locators
    readonly heroContent = (): Locator => this.page.locator('#left-content-main-character')
    readonly openHeroModalBtn = (): Locator => this.page.locator('#btn-add-main-character')
    readonly heroCardPreview = (): Locator => this.page.locator('#main-character-container')

    // Characters / NPC Section Locators
    readonly charactersContent = (): Locator => this.page.locator('#left-content-characters')
    readonly addCharacterBtn = (): Locator => this.page.locator('#btn-add-character')
    readonly addTemplateBtn = (): Locator => this.page.locator('#btn-add-template')
    readonly npcModal = (): Locator => this.page.locator('#npc-create-modal')
    readonly npcNameInput = (): Locator => this.page.locator('#npc-name-input')
    readonly npcSaveBtn = (): Locator => this.page.locator('#btn-save-npc-modal')
    readonly charactersListContainer = (): Locator =>
        this.page.locator('#characters-list-container')
    readonly addNpcStatBtn = (): Locator => this.page.locator('#btn-add-npc-stat')
    readonly npcStatNameInput = (): Locator =>
        this.page.locator('input[data-stat-field="name"]').last()
    readonly npcStatValueInput = (): Locator =>
        this.page.locator('input[data-stat-field="value"]').last()
    readonly confirmNpcStatBtn = (): Locator =>
        this.page.locator('button[data-action="confirm-stat"]').last()
    readonly addNpcAttributeBtn = (): Locator => this.page.locator('#btn-npc-add-custom-attribute')
    readonly npcAttributeRows = (): Locator => this.page.locator('.npc-attribute-row')
    readonly npcAttributeNameInputs = (): Locator =>
        this.page.locator('.npc-attribute-row input[data-attr-field="name"]')
    readonly npcAttributeValueInputs = (): Locator =>
        this.page.locator('.npc-attribute-row input[data-attr-field="value"]')
    readonly npcAttributeValueSelects = (): Locator =>
        this.page.locator('.npc-attribute-row select[data-attr-field="value"]')
    readonly npcPresetChips = (): Locator => this.page.locator('.npc-preset-chip')
    readonly templateDropdownBtn = (): Locator => this.page.locator('#btn-template-dropdown')
    readonly templateDropdownMenu = (): Locator => this.page.locator('#npc-template-dropdown-menu')
    readonly templateDropdownItems = (): Locator =>
        this.page.locator('#npc-template-dropdown-items .template-dropdown-item')
    readonly appliedTemplatesList = (): Locator => this.page.locator('#npc-applied-templates-list')
    readonly appliedTemplateChips = (): Locator => this.page.locator('.npc-applied-template-chip')

    /**
     * Zapewnia, że określona zakładka lewej szuflady jest aktywna.
     * Zapobiega zwijaniu szuflady przy ponownym kliknięciu w ten sam przycisk.
     */
    async ensureTabActive(tabBtn: Locator): Promise<void> {
        const isActive = await tabBtn.evaluate(el => el.classList.contains('active'))
        if (!isActive) {
            await tabBtn.click({ force: true })
        }
    }

    /**
     * Otwiera zakładkę postaci w lewej szufladzie.
     */
    async openCharactersTab(): Promise<void> {
        await this.ensureTabActive(this.charactersTabBtn())
        await expect(this.charactersContent()).toBeVisible()
    }

    /**
     * Przełącza na zakładkę Tagów i tworzy nowy tag.
     */
    async createTag(name: string): Promise<void> {
        await this.ensureTabActive(this.tagsTabBtn())
        await expect(this.tagsContent()).toBeVisible()

        await this.addTagBtn().click({ force: true })
        await expect(this.tagCreateForm()).toBeVisible()

        await this.tagCreateNameInput().fill(name)
        await this.tagCreateSubmitBtn().click({ force: true })

        // Sprawdzamy czy tag pojawił się na liście
        await expect(this.tagsListContainer()).toContainText(name)
    }

    /**
     * Przełącza na zakładkę Scen i tworzy nową scenę.
     */
    async createScene(name: string): Promise<void> {
        await this.ensureTabActive(this.scenesTabBtn())
        await expect(this.scenesContent()).toBeVisible()

        await this.addSceneBtn().click({ force: true })
        await expect(this.sceneCreateForm()).toBeVisible()

        await this.sceneCreateNameInput().fill(name)
        await this.sceneCreateSubmitBtn().click({ force: true })

        // Sprawdzamy czy scena pojawiła się na liście
        await expect(this.scenesListContainer()).toContainText(name)
    }

    /**
     * Otwiera modal Bohatera z poziomu zakładki Bohatera w szufladzie.
     */
    async openHeroModal(): Promise<void> {
        await this.ensureTabActive(this.heroTabBtn())
        await expect(this.heroContent()).toBeVisible()
        await this.openHeroModalBtn().click({ force: true })
    }

    /**
     * Przełącza na zakładkę Postaci i tworzy nowego NPC.
     */
    async createNpc(name: string): Promise<void> {
        await this.openCharactersTab()
        await this.addCharacterBtn().click({ force: true })
        await expect(this.npcModal()).toBeVisible()

        await this.npcNameInput().fill(name)
        await this.npcSaveBtn().click({ force: true })
        await expect(this.npcModal()).toBeHidden()
    }

    /**
     * Tworzy nowy szablon NPC z opcjonalną cechą.
     */
    async createTemplate(name: string, stat?: { name: string; value: string }): Promise<void> {
        await this.openCharactersTab()
        await this.addTemplateBtn().click({ force: true })
        await expect(this.npcModal()).toBeVisible()

        await this.npcNameInput().fill(name)

        if (stat) {
            await this.addNpcStatBtn().click({ force: true })
            await this.npcStatNameInput().fill(stat.name)
            await this.npcStatValueInput().fill(stat.value)
            await this.confirmNpcStatBtn().click({ force: true })
        }

        await this.npcSaveBtn().click({ force: true })
        await expect(this.npcModal()).toBeHidden()
    }

    /**
     * Stosuje szablon do aktualnie otwartego formularza NPC.
     */
    async applyTemplateToNpc(templateName: string): Promise<void> {
        await this.templateDropdownBtn().click()
        await expect(this.templateDropdownMenu()).toBeVisible()
        const targetTpl = this.templateDropdownItems().filter({ hasText: templateName }).first()
        await expect(targetTpl).toBeVisible()
        await targetTpl.click()
        await expect(this.appliedTemplateChips().filter({ hasText: templateName })).toBeVisible()
    }

    /**
     * Otwiera zakładkę cech i atrybutów w lewej szufladzie.
     */
    async openTraitsTab(): Promise<void> {
        await this.ensureTabActive(this.traitsTabBtn())
        await expect(this.traitsContent()).toBeVisible()
    }

    /**
     * Tworzy nową cechę, parametr, umiejętność lub przymiot w szufladzie.
     */
    async createTrait(
        type: 'stat' | 'parameter' | 'skill' | 'feature',
        name: string,
        value?: string
    ): Promise<void> {
        await this.openTraitsTab()
        await this.addTraitBtn().click({ force: true })
        await expect(this.traitCreateForm()).toBeVisible()

        await this.traitCreateTypeSelect().selectOption(type)
        await this.traitCreateNameInput().fill(name)

        if (value !== undefined) {
            await this.traitCreateValueInput().fill(value)
        }

        await this.traitCreateSubmitBtn().click({ force: true })
        await expect(this.traitCreateForm()).toBeHidden()
        await expect(this.traitsListContainer()).toContainText(name)
    }

    /**
     * Wybiera element cechy w szufladzie i klika go, aby otworzyć Panel Szczegółów.
     */
    async selectTraitItem(name: string): Promise<void> {
        await this.openTraitsTab()
        const item = this.traitDrawerItems().filter({ hasText: name }).first()
        await expect(item).toBeVisible()
        await item.click({ force: true })
        await item.dblclick({ force: true }).catch(() => {})
        await item
            .evaluate((el: HTMLElement) => {
                const id = el.dataset.itemId
                const type = el.dataset.itemType
                const win = window as unknown as {
                    appContext?: {
                        selectEntity?: (item: unknown, type: string) => void
                        projectStats?: Array<{ getId?: () => string; id?: string }>
                        projectParameters?: Array<{ getId?: () => string; id?: string }>
                        projectSkills?: Array<{ getId?: () => string; id?: string }>
                        projectFeatures?: Array<{ getId?: () => string; id?: string }>
                    }
                }
                const ctx = win.appContext
                if (ctx && id && type && typeof ctx.selectEntity === 'function') {
                    let targetArray: Array<{ getId?: () => string; id?: string }> = []
                    if (type === 'stat') targetArray = ctx.projectStats || []
                    else if (type === 'parameter') targetArray = ctx.projectParameters || []
                    else if (type === 'skill') targetArray = ctx.projectSkills || []
                    else if (type === 'feature') targetArray = ctx.projectFeatures || []
                    const found = targetArray.find(
                        x => (typeof x.getId === 'function' ? x.getId() : x.id) === id
                    )
                    if (found) {
                        ctx.selectEntity(found, type)
                    }
                }
            })
            .catch(() => {})
    }
}
