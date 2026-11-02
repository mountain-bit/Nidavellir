// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { extractAvailableProjectEntities } from '../../View/ui/editor/modals/entityLinkModal.js'
import {
    TOOLBAR_BUTTON_STATE_MAP,
    updateToolbarActiveStates,
} from '../../View/ui/editor/toolbar/editorToolbar.js'

describe('EditorToolbar', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="editor-toolbar">
                <button id="btn-editor-p">P</button>
                <button id="btn-editor-h1">H1</button>
                <button id="btn-editor-h2">H2</button>
                <button id="btn-editor-h3">H3</button>
                <button id="btn-editor-h4">H4</button>
                <button id="btn-editor-h5">H5</button>
                <button id="btn-editor-bold">B</button>
                <button id="btn-editor-italic">I</button>
                <button id="btn-editor-underline">U</button>
                <button id="btn-editor-strike">S</button>
                <button id="btn-editor-bullet-list">UL</button>
                <button id="btn-editor-ordered-list">OL</button>
                <button id="btn-editor-quote">Q</button>
                <button id="btn-editor-dialog">D</button>
                <button id="btn-editor-custom-styles-dropdown">
                    <span id="label-active-custom-style">Style tekstu</span>
                </button>
            </div>
        `
    })

    it('contains all essential toolbar button mappings', () => {
        expect(TOOLBAR_BUTTON_STATE_MAP.length).toBe(14)
        expect(
            TOOLBAR_BUTTON_STATE_MAP.some(
                (b: { id: string; key: string }) => b.id === 'btn-editor-bold'
            )
        ).toBe(true)
        expect(
            TOOLBAR_BUTTON_STATE_MAP.some(
                (b: { id: string; key: string }) => b.id === 'btn-editor-dialog'
            )
        ).toBe(true)
    })

    it('updates aria-pressed and classes when formatting becomes active', () => {
        const btnBold = document.getElementById('btn-editor-bold')
        const btnItalic = document.getElementById('btn-editor-italic')

        updateToolbarActiveStates({ bold: true, italic: false }, {})

        expect(btnBold?.getAttribute('aria-pressed')).toBe('true')
        expect(btnBold?.classList.contains('text-blue-300')).toBe(true)

        expect(btnItalic?.getAttribute('aria-pressed')).toBe('false')
        expect(btnItalic?.classList.contains('text-blue-300')).toBe(false)
    })

    it('updates custom styles button and active label according to activeCustomStyleId', () => {
        const customBtn = document.getElementById('btn-editor-custom-styles-dropdown')
        const label = document.getElementById('label-active-custom-style')

        const ctx = {
            projectData: {
                customStyles: [{ id: 'style_magic', name: 'Magiczna mowa' }],
            },
        }

        updateToolbarActiveStates({ customStyle: true, activeCustomStyleId: 'style_magic' }, ctx)

        expect(customBtn?.getAttribute('aria-pressed')).toBe('true')
        expect(label?.textContent).toBe('Magiczna mowa')

        // Deactivated
        updateToolbarActiveStates({ customStyle: false, activeCustomStyleId: null }, ctx)

        expect(customBtn?.getAttribute('aria-pressed')).toBe('false')
        expect(label?.textContent).toBe('Style tekstu')
    })

    it('extractAvailableProjectEntities extracts characters, locations, tags, and items', () => {
        const projectData = {
            characters: [{ id: 'c1', name: 'Jan Kowalski' }],
            locations: [{ id: 'l1', name: 'Stary Młyn' }],
            tags: [{ id: 't1', name: 'Tajemnica' }],
            items: [{ id: 'i1', name: 'Złoty klucz' }],
        }
        const entities = extractAvailableProjectEntities(projectData)
        expect(entities.length).toBe(4)
        expect(entities.find((e: { type: string }) => e.type === 'character')?.name).toBe(
            'Jan Kowalski'
        )
        expect(entities.find((e: { type: string }) => e.type === 'location')?.name).toBe(
            'Stary Młyn'
        )
        expect(entities.find((e: { type: string }) => e.type === 'tag')?.name).toBe('Tajemnica')
        expect(entities.find((e: { type: string }) => e.type === 'item')?.name).toBe('Złoty klucz')
    })

    it('extractAvailableProjectEntities extracts from appContext with projectCharacters and projectLocations', () => {
        const ctx = {
            projectData: {
                projectCharacters: [{ id: 'npc_guard', name: 'Strażnik' }],
                projectLocations: [{ id: 'loc_inn', name: 'Karczma' }],
                projectTags: [{ id: 'tag_magic', name: 'Magia' }],
            },
        }
        const entities = extractAvailableProjectEntities(ctx)
        expect(entities.length).toBe(3)
        expect(entities.find((e: { type: string }) => e.type === 'character')?.name).toBe(
            'Strażnik'
        )
        expect(entities.find((e: { type: string }) => e.type === 'location')?.name).toBe('Karczma')
        expect(entities.find((e: { type: string }) => e.type === 'tag')?.name).toBe('Magia')
    })
})
