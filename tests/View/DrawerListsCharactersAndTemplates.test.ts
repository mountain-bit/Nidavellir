// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import {
    getCharactersSectionCollapsed,
    getTemplatesSectionCollapsed,
    renderCharactersList,
    setCharactersSectionCollapsed,
    setTemplatesSectionCollapsed,
} from '../../View/ui/drawerLists.js'
import { setupNpcModal } from '../../View/ui/npcModal.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('DrawerLists - Characters and Templates Independent Collapsible Sections', () => {
    let vm: MainWindowViewModel
    let ctx: any

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="left-content-characters">
                <div class="flex items-center gap-1.5">
                    <button id="btn-add-character" data-action="open-npc-modal" title="Dodaj nową postać">
                        <span>+ Postać</span>
                    </button>
                    <button id="btn-add-template" data-action="open-npc-template-modal" title="Dodaj nowy szablon">
                        <span>+ Szablon</span>
                    </button>
                </div>
                <input type="text" id="character-search-input" />
                <div id="characters-list-container"></div>
            </div>

            <div id="npc-create-modal" class="hidden">
                <div id="npc-create-modal-header">
                    <h2 id="npc-create-modal-title">
                        <span>Karta Postaci NPC</span>
                        <span>Folio</span>
                    </h2>
                    <p>Opis</p>
                    <button id="btn-close-npc-modal">Zamknij</button>
                </div>
                <div id="npc-window-content-row">
                    <div id="npc-form-column">
                        <div id="npc-create-modal-body">
                            <form id="npc-create-modal-form">
                                <button id="btn-npc-avatar-trigger" type="button">
                                    <div id="npc-selected-avatar-preview"></div>
                                </button>
                                <input type="text" id="npc-name-input" />
                                <div id="npc-avatar-picker-popover" class="hidden">
                                    <div id="npc-avatar-grid"></div>
                                </div>
                                <textarea id="npc-summary-input"></textarea>
                                <div id="npc-custom-attributes-section">
                                    <button id="btn-add-custom-attribute" type="button">Dodaj</button>
                                    <div id="npc-custom-attributes-list"></div>
                                </div>
                                <div id="npc-tags-section">
                                    <button id="btn-add-npc-tag" type="button">Dodaj</button>
                                    <div id="npc-tags-list"></div>
                                </div>
                                <div id="npc-stats-section">
                                    <button id="btn-add-npc-stat" type="button">Dodaj</button>
                                    <div id="npc-stats-list"></div>
                                </div>
                                <div id="npc-skills-section">
                                    <button id="btn-add-npc-skill" type="button">Dodaj</button>
                                    <div id="npc-skills-list"></div>
                                </div>
                                <div id="npc-vitals-section">
                                    <button id="btn-add-npc-vital" type="button">Dodaj</button>
                                    <div id="npc-vitals-list"></div>
                                </div>
                                <div id="npc-create-modal-footer">
                                    <button type="submit" id="btn-save-npc-modal">
                                        <span>Zapisz</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `

        vm = new MainWindowViewModel()

        setCharactersSectionCollapsed(false)
        setTemplatesSectionCollapsed(false)

        ctx = {
            vm,
            projectCharacters: [new NPC('char-1', 'Bohater Jan'), new NPC('char-2', 'Karczmarz')],
            projectTemplates: [new NPC_Template('tpl-1', 'Szablon Bandyty')],
            selectEntity: vi.fn(),
            openContextMenu: vi.fn(),
        }
    })

    it('renderuje obie odseparowane sekcje: Postacie i Szablony z licznikami', () => {
        renderCharactersList(ctx)

        const btnToggleChars = document.getElementById('btn-toggle-characters-section')
        const btnToggleTpls = document.getElementById('btn-toggle-templates-section')

        expect(btnToggleChars).toBeTruthy()
        expect(btnToggleTpls).toBeTruthy()

        // Licznik postaci = 2, szablonów = 1
        expect(btnToggleChars?.textContent).toContain('2')
        expect(btnToggleTpls?.textContent).toContain('1')

        const charsBody = document.getElementById('characters-section-body')
        const tplsBody = document.getElementById('templates-section-body')

        expect(charsBody?.textContent).toContain('Bohater Jan')
        expect(charsBody?.textContent).toContain('Karczmarz')
        expect(tplsBody?.textContent).toContain('Szablon Bandyty')
    })

    it('pozwala na niezależne zwijanie i rozwijanie sekcji Postacie bez wpływu na Szablony', () => {
        renderCharactersList(ctx)

        let charsBody = document.getElementById('characters-section-body')
        let tplsBody = document.getElementById('templates-section-body')

        expect(charsBody?.classList.contains('hidden')).toBe(false)
        expect(tplsBody?.classList.contains('hidden')).toBe(false)

        // Kliknięcie w zwijanie Postaci
        const btnToggleChars = document.getElementById('btn-toggle-characters-section')
        btnToggleChars?.click()

        expect(getCharactersSectionCollapsed()).toBe(true)
        expect(getTemplatesSectionCollapsed()).toBe(false)

        charsBody = document.getElementById('characters-section-body')
        tplsBody = document.getElementById('templates-section-body')

        // Sekcja postaci jest zwinięta (hidden), a szablony nadal rozwinięte
        expect(charsBody?.classList.contains('hidden')).toBe(true)
        expect(tplsBody?.classList.contains('hidden')).toBe(false)

        // Ponowne kliknięcie rozwija sekcję Postacie
        const btnToggleCharsAgain = document.getElementById('btn-toggle-characters-section')
        btnToggleCharsAgain?.click()

        charsBody = document.getElementById('characters-section-body')
        expect(charsBody?.classList.contains('hidden')).toBe(false)
        expect(getCharactersSectionCollapsed()).toBe(false)
    })

    it('pozwala na niezależne zwijanie i rozwijanie sekcji Szablony bez wpływu na Postacie', () => {
        renderCharactersList(ctx)

        // Kliknięcie w zwijanie Szablonów
        const btnToggleTpls = document.getElementById('btn-toggle-templates-section')
        btnToggleTpls?.click()

        expect(getTemplatesSectionCollapsed()).toBe(true)
        expect(getCharactersSectionCollapsed()).toBe(false)

        const charsBody = document.getElementById('characters-section-body')
        const tplsBody = document.getElementById('templates-section-body')

        // Sekcja szablonów jest zwinięta, a postacie nadal rozwinięte
        expect(tplsBody?.classList.contains('hidden')).toBe(true)
        expect(charsBody?.classList.contains('hidden')).toBe(false)
    })

    it('dedykowany przycisk #btn-add-character otwiera modal postaci, a #btn-add-template otwiera modal szablonu', () => {
        setupNpcModal(ctx)

        const btnAddCharacter = document.getElementById('btn-add-character')
        const btnAddTemplate = document.getElementById('btn-add-template')
        const modal = document.getElementById('npc-create-modal')
        const modalTitle = document.getElementById('npc-create-modal-title')

        // 1. Kliknięcie w + Postać
        btnAddCharacter?.click()
        expect(modal?.classList.contains('hidden')).toBe(false)
        expect(modalTitle?.textContent?.toLowerCase()).toContain('postaci')

        // Zamknięcie
        modal?.classList.add('hidden')

        // 2. Kliknięcie w + Szablon
        btnAddTemplate?.click()
        expect(modal?.classList.contains('hidden')).toBe(false)
        expect(modalTitle?.textContent?.toLowerCase()).toContain('szablon')
    })
})
