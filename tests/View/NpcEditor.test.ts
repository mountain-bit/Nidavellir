// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    destroyNpcEditor,
    getNpcEditorInstance,
    getOrCreateNpcEditor,
    updateNpcEditorStats,
} from '../../View/ui/editor/npcEditor.js'
import {
    getNpcDescription,
    resetNpcModalForm,
    setNpcDescription,
    setupNpcModal,
    toggleDescriptionDrawer,
} from '../../View/ui/modals/npc/npcModal.js'

describe('NpcEditor in NPC Modal', () => {
    let container: HTMLElement

    beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = `
            <div id="npc-create-modal" class="hidden" style="width: 860px; left: 100px; top: 100px;">
                <div id="npc-create-modal-header"></div>
                <div id="btn-toggle-npc-description">
                    <span id="npc-desc-toggle-arrow">›</span>
                </div>
                <input id="npc-name-input" type="text" />
                <textarea id="npc-summary-input"></textarea>

                <div id="npc-description-drawer" class="hidden" style="width: 460px;">
                    <div id="npc-editor-stats">0 słów · 0 znaków</div>

                    <div id="npc-editor-toolbar">
                        <button type="button" id="npc-btn-editor-p">P</button>
                        <button type="button" id="npc-btn-editor-h1">H1</button>
                        <button type="button" id="npc-btn-editor-h2">H2</button>
                        <button type="button" id="npc-btn-editor-h3">H3</button>
                        <button type="button" id="npc-btn-editor-h4">H4</button>
                        <button type="button" id="npc-btn-editor-h5">H5</button>
                        <button type="button" id="npc-btn-editor-bold">B</button>
                        <button type="button" id="npc-btn-editor-italic">I</button>
                        <button type="button" id="npc-btn-editor-underline">U</button>
                        <button type="button" id="npc-btn-editor-strike">S</button>
                        <button type="button" id="npc-btn-editor-bullet-list">Lista</button>
                        <button type="button" id="npc-btn-editor-ordered-list">Lista num</button>
                        <button type="button" id="npc-btn-editor-quote">Cytat</button>
                        <button type="button" id="npc-btn-editor-dialog">Dialog</button>
                        <button type="button" id="npc-btn-editor-image">Grafika</button>

                        <div id="npc-editor-custom-styles-wrapper">
                            <button type="button" id="npc-btn-editor-custom-styles-dropdown">
                                <span id="npc-label-active-custom-style">Style tekstu</span>
                            </button>
                            <div id="npc-editor-custom-styles-dropdown-menu" class="hidden">
                                <div id="npc-custom-styles-list-container"></div>
                                <button type="button" id="npc-btn-clear-custom-style">Wyczyść</button>
                                <button type="button" id="npc-btn-open-custom-style-modal">Nowy</button>
                            </div>
                        </div>

                        <div id="npc-editor-entity-picker-wrapper">
                            <button type="button" id="npc-btn-insert-entity-dropdown">@ Wstaw</button>
                            <div id="npc-editor-entity-dropdown-menu" class="hidden">
                                <button type="button" id="npc-btn-open-entity-link-modal">Połącz</button>
                                <button type="button" data-entity-type="character">Postać</button>
                                <button type="button" data-entity-type="location">Lokacja</button>
                                <button type="button" data-entity-type="tag">Tag</button>
                                <button type="button" data-entity-type="item">Przedmiot</button>
                            </div>
                        </div>
                    </div>

                    <div id="npc-description-editor-slot">
                        <div id="npc-rich-editor-mount"></div>
                        <textarea id="npc-description-textarea" class="hidden"></textarea>
                    </div>
                </div>
            </div>

            <div id="editor-context-menu" class="hidden">
                <button id="ctx-editor-link-selection"><span id="ctx-editor-link-selection-label"></span></button>
                <button id="ctx-editor-edit-badge"></button>
                <button id="ctx-editor-unlink-badge"></button>
            </div>

            <div id="entity-link-modal" class="hidden">
                <input id="entity-link-label-input" type="text" />
                <input id="entity-link-search-input" type="text" />
                <div id="entity-link-type-filters"></div>
                <div id="entity-link-items-list"></div>
                <span id="entity-link-selected-name"></span>
                <button id="btn-cancel-entity-link">Anuluj</button>
                <button id="btn-confirm-entity-link">Zastosuj</button>
                <button id="btn-close-entity-link-modal">Zamknij</button>
            </div>
        `
        document.body.appendChild(container)
    })

    afterEach(() => {
        destroyNpcEditor()
        if (container && container.parentNode) {
            container.parentNode.removeChild(container)
        }
    })

    it('initializes MarkdownEditor instance when getOrCreateNpcEditor is called', () => {
        const ctx = {
            projectData: {
                customStyles: [{ id: 'style_bold_gold', name: 'Złota mowa', color: '#ffd700' }],
            },
        }
        const editor = getOrCreateNpcEditor(ctx) as any

        expect(editor).not.toBeNull()
        expect(getNpcEditorInstance()).toBe(editor)
        expect(typeof editor.getMarkdown).toBe('function')
        expect(typeof editor.setMarkdown).toBe('function')
    })

    it('synchronizes content two-ways between editor and hidden textarea', () => {
        setupNpcModal()

        setNpcDescription('# Bohater Niezależny\nSpotykasz wędrowca.')

        expect(getNpcDescription()).toBe('# Bohater Niezależny\n\nSpotykasz wędrowca.')

        const textarea = document.getElementById('npc-description-textarea') as HTMLTextAreaElement
        expect(textarea.value).toBe('# Bohater Niezależny\nSpotykasz wędrowca.')

        const statsEl = document.getElementById('npc-editor-stats')
        expect(statsEl?.textContent).toContain('słów')
        expect(statsEl?.textContent).toContain('znaków')
    })

    it('resets editor content when resetNpcModalForm is invoked', () => {
        setupNpcModal()

        setNpcDescription('Pewien tekst fabularny')
        expect(getNpcDescription()).toBe('Pewien tekst fabularny')

        resetNpcModalForm()
        expect(getNpcDescription()).toBe('')

        const textarea = document.getElementById('npc-description-textarea') as HTMLTextAreaElement
        expect(textarea.value).toBe('')
    })

    it('triggers formatting commands when toolbar buttons are clicked', () => {
        setupNpcModal()
        const editor = getNpcEditorInstance() as any

        const pSpy = vi.spyOn(editor, 'setParagraph')
        const h1Spy = vi.spyOn(editor, 'toggleHeading')
        const boldSpy = vi.spyOn(editor, 'toggleBold')
        const italicSpy = vi.spyOn(editor, 'toggleItalic')
        const underlineSpy = vi.spyOn(editor, 'toggleUnderline')
        const strikeSpy = vi.spyOn(editor, 'toggleStrike')
        const bulletSpy = vi.spyOn(editor, 'toggleBulletList')
        const orderedSpy = vi.spyOn(editor, 'toggleOrderedList')
        const quoteSpy = vi.spyOn(editor, 'toggleBlockquote')
        const dialogSpy = vi.spyOn(editor, 'toggleDialog')

        document.getElementById('npc-btn-editor-p')?.click()
        expect(pSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-h1')?.click()
        expect(h1Spy).toHaveBeenCalledWith(1)

        document.getElementById('npc-btn-editor-bold')?.click()
        expect(boldSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-italic')?.click()
        expect(italicSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-underline')?.click()
        expect(underlineSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-strike')?.click()
        expect(strikeSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-bullet-list')?.click()
        expect(bulletSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-ordered-list')?.click()
        expect(orderedSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-quote')?.click()
        expect(quoteSpy).toHaveBeenCalledTimes(1)

        document.getElementById('npc-btn-editor-dialog')?.click()
        expect(dialogSpy).toHaveBeenCalledTimes(1)
    })

    it('renders custom styles list in NPC toolbar dropdown and applies style on click', () => {
        const ctx = {
            projectData: {
                customStyles: [{ id: 'style_elvish', name: 'Mowa Elfów', color: '#10b981' }],
            },
        }
        setupNpcModal(ctx)
        const editor = getNpcEditorInstance() as any
        const styleSpy = vi.spyOn(editor, 'toggleCustomStyle')

        const dropdownBtn = document.getElementById('npc-btn-editor-custom-styles-dropdown')
        const dropdownMenu = document.getElementById('npc-editor-custom-styles-dropdown-menu')
        const listContainer = document.getElementById('npc-custom-styles-list-container')

        expect(dropdownMenu?.classList.contains('hidden')).toBe(true)

        dropdownBtn?.click()
        expect(dropdownMenu?.classList.contains('hidden')).toBe(false)

        const styleBtn = listContainer?.querySelector('button')
        expect(styleBtn).not.toBeNull()
        expect(styleBtn?.textContent).toContain('Mowa Elfów')

        styleBtn?.click()
        expect(styleSpy).toHaveBeenCalledWith('style_elvish')
    })

    it('opens entity mention dropdown and entity link modal from NPC toolbar', () => {
        setupNpcModal()
        const dropdownBtn = document.getElementById('npc-btn-insert-entity-dropdown')
        const dropdownMenu = document.getElementById('npc-editor-entity-dropdown-menu')
        const linkBtn = document.getElementById('npc-btn-open-entity-link-modal')

        dropdownBtn?.click()
        expect(dropdownMenu?.classList.contains('hidden')).toBe(false)

        linkBtn?.click()
        const modal = document.getElementById('entity-link-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)
    })

    it('expands modal width when narrative description drawer is opened', () => {
        setupNpcModal()
        const modal = document.getElementById('npc-create-modal')!
        const drawer = document.getElementById('npc-description-drawer')!

        expect(drawer.classList.contains('hidden')).toBe(true)
        const initialWidth = parseInt(modal.style.width, 10)

        toggleDescriptionDrawer(true)

        expect(drawer.classList.contains('hidden')).toBe(false)
        const expandedWidth = parseInt(modal.style.width, 10)
        expect(expandedWidth).toBeGreaterThan(initialWidth)

        // Close drawer
        toggleDescriptionDrawer(false)
        expect(drawer.classList.contains('hidden')).toBe(true)
    })

    it('calculates and updates words and characters stats accurately', () => {
        setupNpcModal()
        const editor = getNpcEditorInstance() as any

        setNpcDescription('Raz dwa trzy cztery')
        updateNpcEditorStats(editor)

        const statsEl = document.getElementById('npc-editor-stats')
        expect(statsEl?.textContent).toContain('4 słów')
    })
})
