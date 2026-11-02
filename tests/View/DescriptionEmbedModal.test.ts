// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MarkdownEditor } from '../../Modules/Editor/core/MarkdownEditor'
import {
    closeDescriptionEmbedModal,
    extractEmbeddableEntities,
    openDescriptionEmbedModal,
} from '../../View/ui/editor/modals/descriptionEmbedModal.js'

interface IMockDescriptionContext {
    vm: {
        files: {
            getActiveFile: () => string
        }
    }
    files: Record<string, string>
    projectData: {
        characters: Array<{
            getId: () => string
            getName: () => string
            getDescription: () => {
                getText: () => string
                getSummary: () => string
            }
        }>
        locations: Array<{
            id: string
            name: string
            description: {
                text: string
                summary: string
            }
        }>
        items: Array<{
            id: string
            name: string
            description: string
        }>
    }
    saveActiveFile?: () => void
}

describe('DescriptionEmbedModal Integration', () => {
    let container: HTMLElement
    let editor: MarkdownEditor
    let ctx: IMockDescriptionContext

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="description-embed-modal" class="hidden">
                <input id="description-embed-label-input" />
                <input id="description-embed-search-input" />
                <div id="description-embed-type-filters">
                    <button class="embed-type-pill active" data-filter-type="all">Wszystkie</button>
                    <button class="embed-type-pill" data-filter-type="item">Przedmioty</button>
                    <button class="embed-type-pill" data-filter-type="character">Postacie</button>
                    <button class="embed-type-pill" data-filter-type="location">Lokacje</button>
                </div>
                <div id="description-embed-items-list"></div>
                <input type="radio" name="embed-variant" value="text" checked />
                <input type="radio" name="embed-variant" value="summary" />
                <span id="description-embed-selected-name"></span>
                <div id="description-embed-preview-content"></div>
                <button id="btn-close-description-embed-modal"></button>
                <button id="btn-cancel-description-embed"></button>
                <button id="btn-remove-description-embed" class="hidden"></button>
                <button id="btn-confirm-description-embed" disabled>Wstaw opis</button>
            </div>
            <div id="rich-editor-mount"></div>
            <textarea id="file-editor"></textarea>
            <span id="save-status"></span>
        `

        container = document.getElementById('rich-editor-mount')!

        ctx = {
            vm: {
                files: {
                    getActiveFile: vi.fn().mockReturnValue('paragraph_1.md'),
                },
            },
            files: {
                'paragraph_1.md': 'Początek rozdziału.',
            },
            projectData: {
                characters: [
                    {
                        getId: (): string => 'npc_elrond',
                        getName: (): string => 'Elrond',
                        getDescription: (): {
                            getText: () => string
                            getSummary: () => string
                        } => ({
                            getText: (): string => 'Pan Rivendell o wielkiej mądrości.',
                            getSummary: (): string => 'Władca elfów.',
                        }),
                    },
                ],
                locations: [
                    {
                        id: 'loc_rivendell',
                        name: 'Rivendell',
                        description: {
                            text: 'Ostatni Przyjazny Dom na zachód od Gór.',
                            summary: 'Dolina elfów.',
                        },
                    },
                ],
                items: [
                    {
                        id: 'item_ring',
                        name: 'Pierścień',
                        description: 'Złoty pierścień o niezwykłej mocy.',
                    },
                ],
            },
        }

        editor = new MarkdownEditor({
            element: container,
            initialContent: 'Początek rozdziału.',
            onUpdate: (markdown: string): void => {
                const active = ctx.vm.files.getActiveFile()
                if (active) {
                    ctx.files[active] = markdown
                }
            },
        })
    })

    it('extracts entities correctly including text and summary', () => {
        const entities = extractEmbeddableEntities(ctx)
        expect(entities.length).toBe(3)
        expect(entities.find(e => e.id === 'npc_elrond')?.descriptionText).toBe(
            'Pan Rivendell o wielkiej mądrości.'
        )
        expect(entities.find(e => e.id === 'item_ring')?.descriptionText).toBe(
            'Złoty pierścień o niezwykłej mocy.'
        )
    })

    it('opens modal, selects entity, confirms and updates markdown content in file', () => {
        openDescriptionEmbedModal(editor, ctx)

        const modal = document.getElementById('description-embed-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)

        const rows = document.querySelectorAll('.embed-item-row')
        expect(rows.length).toBe(3)

        // Select Elrond
        const elrondRow = Array.from(rows).find(
            r => r.getAttribute('data-entity-id') === 'npc_elrond'
        ) as HTMLElement
        elrondRow.click()

        const confirmBtn = document.getElementById(
            'btn-confirm-description-embed'
        ) as HTMLButtonElement
        expect(confirmBtn.hasAttribute('disabled')).toBe(false)

        ctx.saveActiveFile = vi.fn()

        // Click confirm
        confirmBtn.click()

        expect(modal?.classList.contains('hidden')).toBe(true)

        // Check editor content, ctx.files and saveActiveFile invocation
        const md = editor.getMarkdown()
        expect(md).toContain('[Opis: Elrond](embed://character/npc_elrond)')
        expect(ctx.files['paragraph_1.md']).toContain(
            '[Opis: Elrond](embed://character/npc_elrond)'
        )
        expect(ctx.saveActiveFile).toHaveBeenCalled()
    })

    it('closes modal when closeDescriptionEmbedModal is called', () => {
        openDescriptionEmbedModal(editor, ctx)
        const modal = document.getElementById('description-embed-modal')
        expect(modal?.classList.contains('hidden')).toBe(false)

        closeDescriptionEmbedModal()
        expect(modal?.classList.contains('hidden')).toBe(true)
    })
})
