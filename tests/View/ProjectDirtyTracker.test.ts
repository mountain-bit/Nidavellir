// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { confirmApplicationClose, markFileDirty } from '../../View/ui/modals/confirmModal.js'
import { saveFullProject } from '../../View/ui/project/projectSaver.js'
import {
    isProjectDirty,
    markProjectClean,
    markProjectDirty,
    setProjectSaved,
    setProjectSaving,
    updateProjectNameUI,
    updateProjectSaveIndicatorUI,
} from '../../View/ui/project/projectStateTracker.js'

describe('Project Dirty State and Indicator System', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="project-header">
                <span id="project-name-display">Przygoda w Dolinie</span>
                <span id="project-dirty-indicator" class="hidden"></span>
                <button data-action="save">Zapisz</button>
            </div>
            <div id="unsaved-changes-modal" class="hidden">
                <div id="unsaved-changes-title"></div>
                <div id="unsaved-changes-subtitle"></div>
                <div id="unsaved-changes-message"></div>
                <button id="btn-unsaved-save">Zapisz</button>
                <button id="btn-unsaved-dont-save">Nie zapisuj</button>
                <button id="btn-unsaved-cancel">Anuluj</button>
                <button id="btn-unsaved-close">X</button>
            </div>
        `
        document.title = 'Nidavelir'
        markProjectClean()
    })

    afterEach(() => {
        markProjectClean()
        vi.restoreAllMocks()
    })

    it('domyślnie projekt jest oznaczony jako czysty (clean)', () => {
        expect(isProjectDirty()).toBe(false)
        const indicator = document.getElementById('project-dirty-indicator')
        expect(indicator?.classList.contains('hidden')).toBe(true)
    })

    it('markProjectDirty ustawia flagę isDirty, aktualizuje badge UI, tytuł okna i przycisk zapisu', () => {
        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const indicator = document.getElementById('project-dirty-indicator')
        expect(indicator?.classList.contains('hidden')).toBe(false)
        expect(indicator?.textContent).toContain('Niezapisane zmiany')
        expect(indicator?.className).toContain('text-amber-400')

        expect(document.title).toContain('• Przygoda w Dolinie')
        expect(document.title).toContain('Niezapisane zmiany')

        const saveBtn = document.querySelector('[data-action="save"]')
        expect(saveBtn?.classList.contains('ring-1')).toBe(true)
    })

    it('setProjectSaving ustawia stan zapisywania i aktualizuje tekst wskaźnika', () => {
        setProjectSaving()
        const indicator = document.getElementById('project-dirty-indicator')
        expect(indicator?.textContent).toContain('Zapisywanie')
        expect(document.title).toContain('Zapisywanie')
    })

    it('setProjectSaved resetuje flagę isDirty i wyświetla wskaźnik sukcesu', () => {
        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        setProjectSaved()
        expect(isProjectDirty()).toBe(false)

        const indicator = document.getElementById('project-dirty-indicator')
        expect(indicator?.textContent).toContain('Zapisano')
        expect(indicator?.className).toContain('text-emerald-400')

        const saveBtn = document.querySelector('[data-action="save"]')
        expect(saveBtn?.classList.contains('ring-1')).toBe(false)
        expect(document.title).toBe('Przygoda w Dolinie - Nidavelir')
    })

    it('markFileDirty automatycznie wywołuje markProjectDirty', () => {
        expect(isProjectDirty()).toBe(false)
        markFileDirty('Wprowadzenie.md')
        expect(isProjectDirty()).toBe(true)
    })

    it('updateProjectSaveIndicatorUI aktualizuje UI bezpośrednio', () => {
        updateProjectSaveIndicatorUI('dirty', 'Niestandardowy Projekt')
        const indicator = document.getElementById('project-dirty-indicator')
        expect(indicator?.classList.contains('hidden')).toBe(false)
        expect(document.title).toContain('Niestandardowy Projekt')

        updateProjectSaveIndicatorUI('clean', 'Niestandardowy Projekt')
        expect(indicator?.classList.contains('hidden')).toBe(true)
    })

    it('saveFullProject koordynuje zbieranie danych, wywołanie API i ustawienie stanu zapisanego', async () => {
        const mockSaveFullProject = vi.fn().mockResolvedValue({ success: true })
        window.electronAPI = {
            saveFullProject: mockSaveFullProject,
        } as any

        const ctx = {
            projectPath: 'C:/Test/Project',
            projectParagraphs: [
                {
                    toJSON: () => ({ id: 'p1', title: 'Start' }),
                },
            ],
            projectScenes: [],
            projectCharacters: [],
            projectLocations: [],
            projectItems: [],
            projectTemplates: [],
            projectStats: [],
            files: { 'Wprowadzenie.md': '# Intro' },
            vm: {
                project: {
                    getId: () => 'proj1',
                    getName: () => 'Przygoda w Dolinie',
                    getAuthor: () => 'Kamil',
                    getVersion: () => '1.0.0',
                },
            },
        }

        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const result = await saveFullProject(ctx)
        expect(result.success).toBe(true)
        expect(mockSaveFullProject).toHaveBeenCalledWith(
            'C:/Test/Project',
            expect.objectContaining({
                project: expect.objectContaining({ name: 'Przygoda w Dolinie' }),
                paragraphs: [expect.objectContaining({ id: 'p1' })],
                files: { 'Wprowadzenie.md': '# Intro' },
            })
        )
        expect(isProjectDirty()).toBe(false)
    })

    it('confirmApplicationClose pyta o zapis i wywołuje saveFullProject gdy projekt jest dirty', async () => {
        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const saveProjectSpy = vi.fn().mockResolvedValue({ success: true })
        const ctx = {}

        // Start confirmation dialog
        const closePromise = confirmApplicationClose('project', ctx, {
            isProjectDirty: () => isProjectDirty(),
            saveFullProject: saveProjectSpy,
            markProjectClean: () => markProjectClean(),
        })

        // Simulate user clicking save in modal
        const saveModalBtn = document.getElementById('btn-unsaved-save')
        saveModalBtn?.click()

        const canClose = await closePromise
        expect(canClose).toBe(true)
        expect(saveProjectSpy).toHaveBeenCalledWith(ctx)
        expect(isProjectDirty()).toBe(false)
    })

    it('confirmApplicationClose pozwala zamknąć projekt bez zapisu i czyści dirty state', async () => {
        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const saveProjectSpy = vi.fn()
        const ctx = {}

        const closePromise = confirmApplicationClose('project', ctx, {
            isProjectDirty: () => isProjectDirty(),
            saveFullProject: saveProjectSpy,
            markProjectClean: () => markProjectClean(),
        })

        // Simulate user clicking "Nie zapisuj"
        const dontSaveBtn = document.getElementById('btn-unsaved-dont-save')
        dontSaveBtn?.click()

        const canClose = await closePromise
        expect(canClose).toBe(true)
        expect(saveProjectSpy).not.toHaveBeenCalled()
        expect(isProjectDirty()).toBe(false)
    })

    it('updateProjectNameUI ustawia nazwę projektu, usuwa data-i18n i synchronizuje tytuł okna', () => {
        const titleEl = document.getElementById('project-name-display')
        titleEl?.setAttribute('data-i18n', 'topbar.project_placeholder')

        updateProjectNameUI('Wrota Baldura')

        expect(titleEl?.textContent).toBe('Wrota Baldura')
        expect(titleEl?.getAttribute('title')).toBe('Wrota Baldura')
        expect(titleEl?.hasAttribute('data-i18n')).toBe(false)
        expect(document.title).toContain('Wrota Baldura')
    })

    it('updateProjectNameUI przy pustej nazwie ustawia data-i18n oraz localized placeholder', () => {
        const titleEl = document.getElementById('project-name-display')

        updateProjectNameUI('')

        expect(titleEl?.hasAttribute('data-i18n')).toBe(true)
        expect(titleEl?.getAttribute('data-i18n')).toBe('topbar.project_placeholder')
        expect(titleEl?.textContent).toBe('Brak projektu')
    })
})
