// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import {
    hideEditorContextMenu,
    openEditorContextMenu,
    setEditorActiveState,
    setupEditorContextMenu,
} from '../../View/ui/editor/instances/mainEditor.js'
import {
    closeEntityLinkModal,
    openEntityLinkModal,
    positionPopover,
} from '../../View/ui/editor/modals/entityLinkModal.js'

describe('EditorContextMenuAndPopover', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="editor-context-menu" class="hidden fixed bg-[#1f1f23] border border-[#3f3f46] shadow-2xl rounded-md py-1 text-xs text-white z-50 min-w-[210px]">
                <button id="ctx-editor-link-selection" class="hidden">
                    <span id="ctx-editor-link-selection-label">Połącz z encją projektu...</span>
                </button>
                <button id="ctx-editor-edit-badge" class="hidden">
                    <span>Edytuj powiązanie...</span>
                </button>
                <button id="ctx-editor-unlink-badge" class="hidden">
                    <span>Usuń powiązanie</span>
                </button>
            </div>

            <div id="entity-link-modal" class="hidden fixed z-50 w-80 max-h-[440px] bg-[#1c1c21]" style="top: 0; left: 0;">
                <input id="entity-link-label-input" type="text" />
                <input id="entity-link-search-input" type="text" />
                <div id="entity-link-type-filters">
                    <button class="entity-type-pill active" data-filter-type="all">Wszystkie</button>
                    <button class="entity-type-pill" data-filter-type="character">Postacie</button>
                </div>
                <div id="entity-link-items-list"></div>
                <span id="entity-link-selected-name"></span>
                <button id="btn-unlink-entity" class="hidden">Usuń</button>
                <button id="btn-cancel-entity-link">Anuluj</button>
                <button id="btn-confirm-entity-link" disabled>Zastosuj</button>
                <button id="btn-close-entity-link-modal">X</button>
            </div>

            <div id="editor-toolbar"></div>
            <div id="rich-editor-mount"></div>
            <div id="editor-empty-state" class="hidden"></div>
            <div id="editor-stats"></div>
            <div id="active-file-label"></div>
        `
        window.innerWidth = 1280
        window.innerHeight = 800
    })

    describe('positionPopover', () => {
        it('positions popover adjacent to point coordinates', () => {
            positionPopover({ x: 150, y: 200 })
            const popover = document.getElementById('entity-link-modal')
            expect(popover?.style.left).toBe('150px')
            expect(popover?.style.top).toBe('208px')
        })

        it('positions popover adjacent to targetRect', () => {
            positionPopover({ left: 300, bottom: 250, top: 220 } as DOMRect)
            const popover = document.getElementById('entity-link-modal')
            expect(popover?.style.left).toBe('300px')
            expect(popover?.style.top).toBe('256px')
        })

        it('clamps within viewport margins horizontally', () => {
            positionPopover({ x: 1250, y: 100 })
            const popover = document.getElementById('entity-link-modal')
            // window.innerWidth (1280) - popoverWidth (320) - margin (12) = 948px
            expect(popover?.style.left).toBe('948px')
        })

        it('flips above if overflowing bottom viewport', () => {
            positionPopover({ left: 100, bottom: 750, top: 720 } as DOMRect)
            const popover = document.getElementById('entity-link-modal')
            // 720 - 390 - 6 = 324px
            expect(popover?.style.top).toBe('324px')
        })
    })

    describe('openEditorContextMenu', () => {
        it('displays link option when selected text is present', () => {
            openEditorContextMenu(100, 150, {
                selectedText: 'Jasiek',
            })

            const menu = document.getElementById('editor-context-menu')
            const linkBtn = document.getElementById('ctx-editor-link-selection')
            const editBtn = document.getElementById('ctx-editor-edit-badge')

            expect(menu?.classList.contains('hidden')).toBe(false)
            expect(linkBtn?.classList.contains('hidden')).toBe(false)
            expect(editBtn?.classList.contains('hidden')).toBe(true)
        })

        it('displays edit and unlink options when right clicking an entity badge', () => {
            const fakeBadge = document.createElement('span')
            fakeBadge.className = 'entity-mention-badge'
            fakeBadge.setAttribute('data-entity-id', 'npc_1')
            fakeBadge.setAttribute('data-label', 'Jan')

            openEditorContextMenu(200, 250, {
                badge: fakeBadge,
                badgePos: 15,
            })

            const menu = document.getElementById('editor-context-menu')
            const linkBtn = document.getElementById('ctx-editor-link-selection')
            const editBtn = document.getElementById('ctx-editor-edit-badge')
            const unlinkBtn = document.getElementById('ctx-editor-unlink-badge')

            expect(menu?.classList.contains('hidden')).toBe(false)
            expect(linkBtn?.classList.contains('hidden')).toBe(true)
            expect(editBtn?.classList.contains('hidden')).toBe(false)
            expect(unlinkBtn?.classList.contains('hidden')).toBe(false)
        })

        it('hides menu if no valid actions are available', () => {
            openEditorContextMenu(100, 100, {
                selectedText: '',
            })
            const menu = document.getElementById('editor-context-menu')
            expect(menu?.classList.contains('hidden')).toBe(true)
        })

        it('hideEditorContextMenu closes the context menu', () => {
            openEditorContextMenu(100, 150, { selectedText: 'Tekst' })
            const menu = document.getElementById('editor-context-menu')
            expect(menu?.classList.contains('hidden')).toBe(false)

            hideEditorContextMenu()
            expect(menu?.classList.contains('hidden')).toBe(true)
        })

        it('setupEditorContextMenu wires click listeners', () => {
            const fakeEditor = {
                unlinkEntityMention: (): boolean => true,
            }
            setupEditorContextMenu(fakeEditor, {})

            const menu = document.getElementById('editor-context-menu')
            menu?.classList.remove('hidden')

            document.body.click()
            expect(menu?.classList.contains('hidden')).toBe(true)
        })
    })

    describe('openEntityLinkModal and closeEntityLinkModal', () => {
        it('opens popover with initial label pre-filled and focused', () => {
            const fakeEditor = {
                getProjectEntities: (): { id: string; name: string; type: string }[] => [
                    { id: 'hero', name: 'Bohater', type: 'character' },
                ],
            }
            openEntityLinkModal(
                fakeEditor,
                {},
                {
                    initialLabel: 'Bohatera',
                    point: { x: 100, y: 100 },
                }
            )

            const modal = document.getElementById('entity-link-modal')
            const labelInput = document.getElementById(
                'entity-link-label-input'
            ) as HTMLInputElement

            expect(modal?.classList.contains('hidden')).toBe(false)
            expect(labelInput.value).toBe('Bohatera')

            closeEntityLinkModal()
            expect(modal?.classList.contains('hidden')).toBe(true)
        })

        it('clicking outside closes the popover', () => {
            const fakeEditor = {
                getProjectEntities: (): { id: string; name: string; type: string }[] => [],
            }
            openEntityLinkModal(fakeEditor, {}, {})
            const modal = document.getElementById('entity-link-modal')
            expect(modal?.classList.contains('hidden')).toBe(false)

            // Dispatch mousedown outside
            document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
            expect(modal?.classList.contains('hidden')).toBe(true)
        })
    })

    describe('setEditorActiveState', () => {
        it('deactivates editor and shows empty state when isActive is false', () => {
            const fakeEditor = {
                setEditable: (editable: boolean): void => {
                    fakeEditor.editable = editable
                },
                setMarkdown: (md: string): void => {
                    fakeEditor.content = md
                },
                editable: true,
                content: 'some text',
            }

            setEditorActiveState(false, fakeEditor)

            const emptyState = document.getElementById('editor-empty-state')
            const mount = document.getElementById('rich-editor-mount')
            const toolbar = document.getElementById('editor-toolbar')
            const stats = document.getElementById('editor-stats')
            const activeLabel = document.getElementById('active-file-label')

            expect(emptyState?.classList.contains('hidden')).toBe(false)
            expect(mount?.classList.contains('hidden')).toBe(true)
            expect(toolbar?.classList.contains('hidden')).toBe(true)
            expect(stats?.classList.contains('hidden')).toBe(true)
            expect(stats?.textContent).toBe('')
            expect(activeLabel?.textContent).toBeTruthy()
            expect(fakeEditor.editable).toBe(false)
            expect(fakeEditor.content).toBe('')
        })

        it('activates editor and hides empty state when isActive is true', () => {
            const fakeEditor = {
                setEditable: (editable: boolean): void => {
                    fakeEditor.editable = editable
                },
                editable: false,
            }

            // Initially inactive
            document.getElementById('editor-empty-state')?.classList.remove('hidden')
            document.getElementById('rich-editor-mount')?.classList.add('hidden')
            document.getElementById('editor-toolbar')?.classList.add('hidden')

            setEditorActiveState(true, fakeEditor)

            const emptyState = document.getElementById('editor-empty-state')
            const mount = document.getElementById('rich-editor-mount')
            const toolbar = document.getElementById('editor-toolbar')
            const stats = document.getElementById('editor-stats')

            expect(emptyState?.classList.contains('hidden')).toBe(true)
            expect(mount?.classList.contains('hidden')).toBe(false)
            expect(toolbar?.classList.contains('hidden')).toBe(false)
            expect(stats?.classList.contains('hidden')).toBe(false)
            expect(fakeEditor.editable).toBe(true)
        })
    })
})
