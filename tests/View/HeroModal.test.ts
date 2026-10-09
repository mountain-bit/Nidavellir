// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Parameter } from '../../Model/Parameter'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { renderMainCharacter } from '../../View/ui/drawerLists.js'
import { closeHeroModal, openHeroModal, setupHeroModal } from '../../View/ui/heroModal.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('HeroModal and renderMainCharacter', () => {
    let vm: MainWindowViewModel
    let ctx: any

    beforeEach(() => {
        document.body.innerHTML = `
            <!-- Left drawer main character container -->
            <div id="left-content-main-character">
                <div id="main-character-container"></div>
            </div>

            <!-- Hero modal DOM -->
            <div id="hero-create-modal" class="hidden" style="top: 0px; left: 0px; width: 850px; height: 600px;">
                <div id="hero-create-modal-header">
                    <h2 id="hero-create-modal-title">
                        <span>Karta Bohatera Gracza</span>
                        <span>Protagonista</span>
                    </h2>
                    <button id="btn-close-hero-modal" type="button">X</button>
                </div>
                <div id="hero-window-content-row">
                    <div id="hero-form-column">
                        <div id="hero-create-modal-body">
                            <form id="hero-create-modal-form">
                                <button id="btn-hero-avatar-trigger" type="button">
                                    <div id="hero-selected-avatar-preview"></div>
                                </button>
                                <input type="text" id="hero-name-input" value="" />
                                <div id="hero-avatar-picker-popover" class="hidden">
                                    <input type="text" id="hero-avatar-search-input" />
                                    <div id="hero-avatar-grid"></div>
                                </div>
                                <textarea id="hero-summary-input"></textarea>

                                <div id="hero-custom-attributes-section">
                                    <button id="btn-add-hero-custom-attribute" type="button">+ Atrybut</button>
                                    <div id="hero-custom-attributes-list"></div>
                                    <div id="hero-suggested-attributes-chips"></div>
                                </div>

                                <div id="hero-tags-section">
                                    <div id="hero-tags-chips-container"></div>
                                    <button id="btn-hero-add-tag-trigger" type="button">+ Tag</button>
                                    <div id="hero-tag-picker-popover" class="hidden">
                                        <div id="hero-tag-picker-list"></div>
                                    </div>
                                </div>

                                <div id="hero-stats-section">
                                    <button id="btn-add-hero-stat" type="button">+ Cecha</button>
                                    <div id="hero-stats-list"></div>
                                    <div id="hero-suggested-stats-chips"></div>
                                </div>

                                <div id="hero-vitals-section">
                                    <button id="btn-add-hero-vital" type="button">+ Parametr</button>
                                    <div id="hero-vitals-list"></div>
                                    <div id="hero-suggested-vitals-chips"></div>
                                </div>

                                <div id="hero-skills-section">
                                    <button id="btn-add-hero-skill" type="button">+ Umiejętność</button>
                                    <div id="hero-skills-list"></div>
                                    <div id="hero-suggested-skills-chips"></div>
                                </div>

                                <button id="btn-toggle-hero-description" type="button">
                                    <span id="hero-desc-toggle-arrow">‹</span>
                                </button>
                                <button id="btn-cancel-hero-modal" type="button">Anuluj</button>
                                <button id="btn-save-hero-modal" type="button">Zapisz</button>
                            </form>
                        </div>
                    </div>
                    <div id="hero-description-drawer" class="hidden">
                        <div id="hero-editor-container"></div>
                        <textarea id="hero-description-textarea" class="hidden"></textarea>
                    </div>
                </div>
                <div id="hero-modal-resizer"></div>
            </div>
        `

        vm = new MainWindowViewModel()

        ctx = {
            vm,
            projectData: {
                playerCharacter: null,
                projectTags: [new Tag('tag1', 'Główny', '#ef4444')],
                projectStats: [new Stat('stat1', 'Siła', new Description('', ''), 12)],
                projectParameters: [
                    new Parameter('param1', 'Zdrowie', new Description('', ''), 'direct', 100),
                ],
                projectSkills: [
                    new Skill('skill1', 'Szermierka', new Description('', ''), 'direct', '+2'),
                ],
                projectFeatures: [],
            },
            getProjectPath: () => '/mock/project',
            renderMainCharacter: vi.fn(),
            refreshActiveSection: vi.fn(),
        }
    })

    it('verifies that NO templates section or template dropdown exists in the hero modal', () => {
        setupHeroModal(ctx)
        const modal = document.getElementById('hero-create-modal')
        expect(modal).not.toBeNull()

        // Explicit user requirement: "Ale nie będzie tem szablonów" & "usuń klasy postaci"
        expect(modal?.querySelector('#hero-template-select')).toBeNull()
        expect(modal?.querySelector('#hero-template-chips')).toBeNull()
        expect(modal?.querySelector('#hero-templates-section')).toBeNull()
        expect(modal?.querySelector('[data-action="apply-template"]')).toBeNull()
        expect(modal?.querySelector('#hero-class-select')).toBeNull()
        expect(modal?.querySelector('[data-i18n="hero.class_label"]')).toBeNull()
    })

    it('renders empty state in left drawer when no player character exists', () => {
        renderMainCharacter(ctx)
        const container = document.getElementById('main-character-container')
        expect(container?.innerHTML).toContain('Karta Postaci Gracza')
        expect(container?.querySelector('#btn-drawer-create-hero')).not.toBeNull()
    })

    it('opens hero modal when clicking create button in empty state', () => {
        setupHeroModal(ctx)
        renderMainCharacter(ctx)

        const btnCreate = document.getElementById('btn-drawer-create-hero')
        expect(btnCreate).not.toBeNull()
        btnCreate?.click()

        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)
    })

    it('renders populated hero card in left drawer when player character exists', () => {
        const hero = new PlayerCharacter(
            'hero1',
            'Eldrin',
            new Description('Kronika maga', 'Potężny mag z wieży.'),
            [],
            [],
            [],
            [],
            null,
            'wizard'
        )
        ctx.projectData.playerCharacter = hero

        renderMainCharacter(ctx)
        const container = document.getElementById('main-character-container')
        expect(container?.textContent).toContain('Eldrin')
        expect(container?.textContent).toContain('Potężny mag z wieży.')
        expect(container?.querySelector('#btn-drawer-edit-hero')).not.toBeNull()
    })

    it('opens hero modal and populates form when editing existing hero', () => {
        setupHeroModal(ctx)
        const hero = new PlayerCharacter(
            'hero1',
            'Eldrin',
            new Description('Kronika', 'Potężny mag z wieży.'),
            [],
            [],
            [],
            [],
            null,
            'wizard',
            [],
            [],
            [{ name: 'Rasa', value: 'Elf' }]
        )

        openHeroModal({ ctx, editEntity: hero })

        const nameInput = document.getElementById('hero-name-input') as HTMLInputElement
        const summaryInput = document.getElementById('hero-summary-input') as HTMLTextAreaElement
        const modal = document.getElementById('hero-create-modal')

        expect(modal?.classList.contains('hidden')).toBe(false)
        expect(nameInput?.value).toBe('Eldrin')
        expect(summaryInput?.value).toBe('Potężny mag z wieży.')

        const attrList = document.getElementById('hero-custom-attributes-list')
        expect(attrList?.innerHTML).toContain('Rasa')
        expect(attrList?.innerHTML).toContain('Elf')
    })

    it('validates empty name and prevents saving', async () => {
        setupHeroModal(ctx)
        openHeroModal({ ctx })

        const nameInput = document.getElementById('hero-name-input') as HTMLInputElement
        nameInput.value = '   ' // empty/whitespace

        const btnSave = document.getElementById('btn-save-hero-modal') as HTMLButtonElement
        btnSave.click()

        // Player character should still be null
        expect(ctx.projectData.playerCharacter).toBeNull()
    })

    it('successfully saves valid hero and updates ctx.projectData', async () => {
        setupHeroModal(ctx)
        openHeroModal({ ctx })

        const nameInput = document.getElementById('hero-name-input') as HTMLInputElement
        const summaryInput = document.getElementById('hero-summary-input') as HTMLTextAreaElement
        nameInput.value = 'Geralt z Rivii'
        summaryInput.value = 'Biały Wilk.'

        const btnSave = document.getElementById('btn-save-hero-modal') as HTMLButtonElement
        btnSave.click()

        expect(ctx.projectData.playerCharacter).not.toBeNull()
        expect(ctx.projectData.playerCharacter.getName()).toBe('Geralt z Rivii')
        expect(ctx.projectData.playerCharacter.getSummary()).toBe('Biały Wilk.')

        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(true)
    })

    it('initializes a new hero with clean empty stats, vitals, and skills', () => {
        setupHeroModal(ctx)
        openHeroModal({ ctx })

        const statsList = document.getElementById('hero-stats-list')
        const vitalsList = document.getElementById('hero-vitals-list')
        const skillsList = document.getElementById('hero-skills-list')
        const attrsList = document.getElementById('hero-custom-attributes-list')

        expect(statsList?.children.length).toBe(0)
        expect(vitalsList?.children.length).toBe(0)
        expect(skillsList?.children.length).toBe(0)
        expect(attrsList?.children.length).toBe(0)
    })

    it('closes the modal immediately when unsaved changes confirmation resolves to dont_save', async () => {
        const confirmModalModule = await import('../../View/ui/confirmModal.js')
        const showUnsavedSpy = vi
            .spyOn(confirmModalModule, 'showUnsavedChangesModal')
            .mockResolvedValue('dont_save')

        setupHeroModal(ctx)
        openHeroModal({ ctx })

        const nameInput = document.getElementById('hero-name-input') as HTMLInputElement
        nameInput.value = 'Modified Name That Triggers Unsaved'

        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)

        await closeHeroModal()

        expect(showUnsavedSpy).toHaveBeenCalled()
        expect(modal?.classList.contains('hidden')).toBe(true)

        showUnsavedSpy.mockRestore()
    })

    it('can close the modal via close button and via closeHeroModal()', async () => {
        setupHeroModal(ctx)
        openHeroModal({ ctx })
        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)

        await closeHeroModal()
        expect(modal?.classList.contains('hidden')).toBe(true)
    })

    it('opens hero modal when clicking any element with data-action="open-hero-modal"', () => {
        setupHeroModal(ctx)
        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(true)

        // Create a ribbon / header button dynamically or statically
        const ribbonBtn = document.createElement('button')
        ribbonBtn.setAttribute('data-action', 'open-hero-modal')
        document.body.appendChild(ribbonBtn)

        ribbonBtn.click()

        expect(modal?.classList.contains('hidden')).toBe(false)
        expect(document.getElementById('hero-name-input')).not.toBeNull()

        closeHeroModal(true)
        expect(modal?.classList.contains('hidden')).toBe(true)
        ribbonBtn.remove()
    })

    it('avatar is empty by default and allows setting custom photo', async () => {
        setupHeroModal(ctx)
        openHeroModal({ ctx })

        const preview = document.getElementById('hero-selected-avatar-preview')
        expect(preview?.innerHTML).toContain('Brak zdjęcia')

        const controllers = await import('../../View/ui/heroModal/heroSectionControllers.js')
        controllers.updateHeroSelectedAvatarPreview('assets/custom_hero.png')
        expect(preview?.innerHTML).toContain('<img')
        expect(preview?.innerHTML).toContain('custom_hero.png')

        controllers.updateHeroSelectedAvatarPreview('')
        expect(preview?.innerHTML).toContain('Brak zdjęcia')
    })

    it('works with the actual MainWindow.html DOM structure', async () => {
        const fs = await import('fs')
        const path = await import('path')
        const html = fs.readFileSync(path.resolve(__dirname, '../../View/MainWindow.html'), 'utf-8')
        document.body.innerHTML = html

        expect(() => {
            setupHeroModal(ctx)
            openHeroModal({ ctx })
        }).not.toThrow()

        const modal = document.getElementById('hero-create-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)

        closeHeroModal(true)
        expect(modal?.classList.contains('hidden')).toBe(true)

        // Test clicking header button #btn-add-main-character
        const btnAdd = document.getElementById('btn-add-main-character') as HTMLButtonElement
        expect(btnAdd).not.toBeNull()
        btnAdd.click()
        expect(modal?.classList.contains('hidden')).toBe(false)

        closeHeroModal(true)
        expect(modal?.classList.contains('hidden')).toBe(true)

        // Test clicking drawer create button #btn-drawer-create-hero
        renderMainCharacter(ctx)
        const btnDrawerCreate = document.getElementById(
            'btn-drawer-create-hero'
        ) as HTMLButtonElement
        expect(btnDrawerCreate).not.toBeNull()
        btnDrawerCreate.click()
        expect(modal?.classList.contains('hidden')).toBe(false)
    })
})
