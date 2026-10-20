// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NPC } from '../../Model/NPC.js'
import {
    clearDirtyFiles,
    confirmApplicationClose,
    getUnsavedFiles,
    hasUnsavedFileChanges,
    markFileClean,
    markFileDirty,
    showUnsavedChangesModal,
} from '../../View/ui/modals/confirm/confirmModal.js'
import {
    addCustomAttribute,
    hasUnsavedNpcChanges,
    openNpcModal,
    requestCloseNpcModal,
    resetNpcModalForm,
    setNpcName,
    setupNpcModal,
} from '../../View/ui/modals/npc/npcModal.js'

describe('Unsaved Changes Protection Integration Tests', () => {
    function setupTestDOM(): void {
        document.body.innerHTML = `
            <!-- NPC Create Modal -->
            <div id="npc-create-modal" class="hidden">
                <div id="npc-create-modal-header">
                    <span id="npc-modal-badge"></span>
                    <h2 id="npc-create-modal-title"><span>Nowy</span></h2>
                    <p id="npc-modal-instruction-text"></p>
                    <button type="button" id="btn-close-npc-modal">X</button>
                </div>
                <div id="npc-create-modal-body">
                    <form id="npc-create-modal-form">
                        <button id="btn-npc-avatar-trigger" type="button">
                            <div id="npc-selected-avatar-preview"></div>
                        </button>
                        <div id="npc-avatar-picker-popover" class="hidden">
                            <div id="npc-avatar-grid"></div>
                        </div>

                        <input id="npc-name-input" type="text" value="" />
                        <div id="npc-name-suggestions"></div>
                        <div id="npc-create-error-message" class="hidden"></div>

                        <div id="npc-tags-container"></div>
                        <button id="btn-add-npc-tag" type="button">+</button>
                        <div id="npc-tag-picker-popover" class="hidden">
                            <input id="npc-tag-search-input" />
                            <div id="npc-tag-options-list"></div>
                        </div>

                        <button id="btn-toggle-npc-description" type="button">Opis</button>
                        <div id="npc-description-drawer" class="hidden">
                            <textarea id="npc-summary-input"></textarea>
                            <div id="npc-editor-word-count"></div>
                            <div id="npc-editor-read-time"></div>
                            <div id="npc-editor-container"></div>
                        </div>

                        <button id="btn-template-dropdown" type="button"></button>
                        <div id="npc-template-dropdown-menu" class="hidden">
                            <input id="npc-template-search-input" />
                            <div id="npc-template-list"></div>
                        </div>
                        <div id="npc-applied-templates-container"></div>

                        <div id="npc-stats-list"></div>
                        <button id="btn-add-npc-stat" type="button"></button>

                        <div id="npc-vitals-list"></div>
                        <button id="btn-add-npc-vital" type="button"></button>

                        <div id="npc-skills-list"></div>
                        <button id="btn-add-npc-skill" type="button"></button>

                        <div id="npc-custom-attributes-list"></div>
                        <button id="btn-add-custom-attribute" type="button"></button>

                        <span id="npc-traits-badge-stats">0</span>
                        <span id="npc-traits-badge-vitals">0</span>
                        <span id="npc-traits-badge-skills">0</span>
                        <span id="npc-traits-badge-attrs">0</span>

                        <button type="button" id="btn-cancel-npc-modal">Anuluj</button>
                        <button type="submit" id="btn-save-npc-modal">Zapisz</button>
                    </form>
                </div>
            </div>

            <!-- Unsaved Changes Confirmation Modal -->
            <div id="unsaved-changes-modal" class="hidden" role="dialog">
                <div>
                    <h3 id="unsaved-changes-title"></h3>
                    <p id="unsaved-changes-subtitle"></p>
                    <button type="button" id="btn-unsaved-close">X</button>
                    <p id="unsaved-changes-message"></p>
                    <button type="button" id="btn-unsaved-cancel">Anuluj</button>
                    <button type="button" id="btn-unsaved-dont-save">Nie zapisuj</button>
                    <button type="button" id="btn-unsaved-save">Zapisz</button>
                </div>
            </div>
        `
    }

    beforeEach(() => {
        clearDirtyFiles()
        setupTestDOM()
    })

    afterEach(() => {
        clearDirtyFiles()
        vi.restoreAllMocks()
    })

    describe('File Dirty Tracking State', () => {
        it('tracks dirty files and clears them appropriately', () => {
            expect(hasUnsavedFileChanges()).toBe(false)
            expect(getUnsavedFiles()).toEqual([])

            markFileDirty('scena1.md')
            expect(hasUnsavedFileChanges()).toBe(true)
            expect(getUnsavedFiles()).toEqual(['scena1.md'])

            markFileDirty('scena2.md')
            expect(getUnsavedFiles().sort()).toEqual(['scena1.md', 'scena2.md'])

            markFileClean('scena1.md')
            expect(hasUnsavedFileChanges()).toBe(true)
            expect(getUnsavedFiles()).toEqual(['scena2.md'])

            clearDirtyFiles()
            expect(hasUnsavedFileChanges()).toBe(false)
            expect(getUnsavedFiles()).toEqual([])
        })
    })

    describe('Unsaved Changes Modal Dialog UI', () => {
        it('resolves with "save" when Save button is clicked', async () => {
            const promise = showUnsavedChangesModal({
                title: 'Własny tytuł',
                message: 'Wiadomość testowa',
            })

            const modal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(modal.classList.contains('hidden')).toBe(false)
            expect(document.getElementById('unsaved-changes-title')?.textContent).toBe(
                'Własny tytuł'
            )
            expect(document.getElementById('unsaved-changes-message')?.textContent).toBe(
                'Wiadomość testowa'
            )

            const btnSave = document.getElementById('btn-unsaved-save') as HTMLButtonElement
            btnSave.click()

            const result = await promise
            expect(result).toBe('save')
            expect(modal.classList.contains('hidden')).toBe(true)
        })

        it('resolves with "dont_save" when Nie zapisuj button is clicked', async () => {
            const promise = showUnsavedChangesModal()

            const modal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(modal.classList.contains('hidden')).toBe(false)

            const btnDontSave = document.getElementById(
                'btn-unsaved-dont-save'
            ) as HTMLButtonElement
            btnDontSave.click()

            const result = await promise
            expect(result).toBe('dont_save')
            expect(modal.classList.contains('hidden')).toBe(true)
        })

        it('resolves with "cancel" when Anuluj button is clicked', async () => {
            const promise = showUnsavedChangesModal()

            const modal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(modal.classList.contains('hidden')).toBe(false)

            const btnCancel = document.getElementById('btn-unsaved-cancel') as HTMLButtonElement
            btnCancel.click()

            const result = await promise
            expect(result).toBe('cancel')
            expect(modal.classList.contains('hidden')).toBe(true)
        })

        it('resolves with "cancel" when Close X button is clicked', async () => {
            const promise = showUnsavedChangesModal()

            const btnClose = document.getElementById('btn-unsaved-close') as HTMLButtonElement
            btnClose.click()

            const result = await promise
            expect(result).toBe('cancel')
        })

        it('resolves with "cancel" when Escape key is pressed', async () => {
            const promise = showUnsavedChangesModal()

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

            const result = await promise
            expect(result).toBe('cancel')
        })

        it('falls back to "dont_save" if modal element is not in DOM', async () => {
            document.getElementById('unsaved-changes-modal')?.remove()

            const result = await showUnsavedChangesModal()
            expect(result).toBe('dont_save')
        })
    })

    describe('NPC Modal Unsaved Protection Flow', () => {
        it('detects changes when user types NPC name or attributes', () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()

            expect(hasUnsavedNpcChanges()).toBe(false)

            setNpcName('Nowy Bohater')
            expect(hasUnsavedNpcChanges()).toBe(true)

            setNpcName('')
            expect(hasUnsavedNpcChanges()).toBe(false)

            addCustomAttribute('Klasa', 'Mag')
            expect(hasUnsavedNpcChanges()).toBe(true)

            resetNpcModalForm()
            expect(hasUnsavedNpcChanges()).toBe(false)
        })

        it('closes NPC modal immediately when there are NO unsaved changes', async () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()

            const modal = document.getElementById('npc-create-modal') as HTMLElement
            expect(modal.classList.contains('hidden')).toBe(false)

            const closed = await requestCloseNpcModal()
            expect(closed).toBe(true)
            expect(modal.classList.contains('hidden')).toBe(true)

            const unsavedModal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(unsavedModal.classList.contains('hidden')).toBe(true)
        })

        it('prompts user and cancels closing when user clicks "Anuluj"', async () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()
            setNpcName('Strażnik Bramy')

            const modal = document.getElementById('npc-create-modal') as HTMLElement
            const closePromise = requestCloseNpcModal()

            const unsavedModal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(unsavedModal.classList.contains('hidden')).toBe(false)

            // Click Anuluj
            const btnCancel = document.getElementById('btn-unsaved-cancel') as HTMLButtonElement
            btnCancel.click()

            const result = await closePromise
            expect(result).toBe(false)
            expect(modal.classList.contains('hidden')).toBe(false) // stays open
            expect(unsavedModal.classList.contains('hidden')).toBe(true)
        })

        it('prompts user and discards changes when user clicks "Nie zapisuj"', async () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()
            setNpcName('Odrzucona Postać')

            const modal = document.getElementById('npc-create-modal') as HTMLElement
            const closePromise = requestCloseNpcModal()

            // Click Nie zapisuj
            const btnDontSave = document.getElementById(
                'btn-unsaved-dont-save'
            ) as HTMLButtonElement
            btnDontSave.click()

            const result = await closePromise
            expect(result).toBe(true)
            expect(modal.classList.contains('hidden')).toBe(true) // modal closed
            expect(ctx.projectCharacters.length).toBe(0) // not saved
        })

        it('prompts user and saves NPC character when user clicks "Zapisz"', async () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()
            setNpcName('Zapisany Rycerz')

            const modal = document.getElementById('npc-create-modal') as HTMLElement
            const closePromise = requestCloseNpcModal()

            // Click Zapisz
            const btnSave = document.getElementById('btn-unsaved-save') as HTMLButtonElement
            btnSave.click()

            const result = await closePromise
            expect(result).toBe(true)
            expect(modal.classList.contains('hidden')).toBe(true)
            expect(ctx.projectCharacters.length).toBe(1)
            expect(ctx.projectCharacters[0].getName()).toBe('Zapisany Rycerz')
        })
    })

    describe('Application & Project Exit Protection Flow', () => {
        it('allows immediate closing when there are no dirty files or NPC changes', async () => {
            const helpers = {
                saveFiles: vi.fn(),
                hasUnsavedNpc: (): boolean => false,
                saveNpc: vi.fn(),
            }

            const allowed = await confirmApplicationClose('project', {}, helpers)
            expect(allowed).toBe(true)
            expect(helpers.saveFiles).not.toHaveBeenCalled()
        })

        it('intercepts exit when dirty files exist and allows cancellation', async () => {
            markFileDirty('rozdział_1.md')

            const helpers = {
                saveFiles: vi.fn(),
                hasUnsavedNpc: (): boolean => false,
                saveNpc: vi.fn(),
            }

            const confirmPromise = confirmApplicationClose('project', {}, helpers)

            const unsavedModal = document.getElementById('unsaved-changes-modal') as HTMLElement
            expect(unsavedModal.classList.contains('hidden')).toBe(false)

            const btnCancel = document.getElementById('btn-unsaved-cancel') as HTMLButtonElement
            btnCancel.click()

            const allowed = await confirmPromise
            expect(allowed).toBe(false)
            expect(helpers.saveFiles).not.toHaveBeenCalled()
            expect(hasUnsavedFileChanges()).toBe(true)
        })

        it('saves all dirty files and closes when user clicks "Zapisz"', async () => {
            markFileDirty('scena_glowna.md')

            const saveFilesSpy = vi.fn().mockReturnValue(1)
            const helpers = {
                saveFiles: saveFilesSpy,
                hasUnsavedNpc: (): boolean => false,
                saveNpc: vi.fn(),
            }

            const confirmPromise = confirmApplicationClose('project', {}, helpers)

            const btnSave = document.getElementById('btn-unsaved-save') as HTMLButtonElement
            btnSave.click()

            const allowed = await confirmPromise
            expect(allowed).toBe(true)
            expect(saveFilesSpy).toHaveBeenCalledTimes(1)
            expect(hasUnsavedFileChanges()).toBe(false)
        })

        it('discards dirty changes on "Nie zapisuj"', async () => {
            markFileDirty('porzucony_plik.md')

            const helpers = {
                saveFiles: vi.fn(),
                hasUnsavedNpc: (): boolean => false,
                saveNpc: vi.fn(),
            }

            const confirmPromise = confirmApplicationClose('app', {}, helpers)

            const btnDontSave = document.getElementById(
                'btn-unsaved-dont-save'
            ) as HTMLButtonElement
            btnDontSave.click()

            const allowed = await confirmPromise
            expect(allowed).toBe(true)
            expect(helpers.saveFiles).not.toHaveBeenCalled()
            expect(hasUnsavedFileChanges()).toBe(false)
        })

        it('triggers window.electronAPI.forceCloseApp when user confirms app exit', async () => {
            markFileDirty('dokument.md')
            const forceCloseSpy = vi.fn<[], Promise<void>>().mockResolvedValue(undefined)
            window.electronAPI = {
                ...(window.electronAPI || {}),
                closeApp: vi.fn(),
                loadMainWindow: vi.fn(),
                loadStartWindow: vi.fn(),
                chooseFolder: vi.fn(),
                createProject: vi.fn(),
                openProject: vi.fn(),
                saveProject: vi.fn(),
                createEntity: vi.fn(),
                saveEntity: vi.fn(),
                readMarkdownFile: vi.fn(),
                saveMarkdownFile: vi.fn(),
                getRecentProjects: vi.fn(),
                getTranslations: vi.fn(),
                getLocale: vi.fn(),
                setLocale: vi.fn(),
                getSystemUsername: vi.fn(),
                getCurrentProject: vi.fn(),
                forceCloseApp: forceCloseSpy,
            }

            const helpers = {
                saveFiles: vi.fn(),
                hasUnsavedNpc: (): boolean => false,
                saveNpc: vi.fn(),
            }

            const confirmPromise = confirmApplicationClose('app', {}, helpers)

            const btnDontSave = document.getElementById(
                'btn-unsaved-dont-save'
            ) as HTMLButtonElement
            btnDontSave.click()

            const allowed = await confirmPromise
            if (allowed && window.electronAPI.forceCloseApp) {
                await window.electronAPI.forceCloseApp()
            }

            expect(allowed).toBe(true)
            expect(forceCloseSpy).toHaveBeenCalledTimes(1)
            expect(hasUnsavedFileChanges()).toBe(false)
        })
    })
})
