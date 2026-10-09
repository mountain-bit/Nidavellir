// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    DEFAULT_AUTOSAVE_INTERVAL_MS,
    isAutoSaveEnabled,
    isAutoSaveRunningStatus,
    setAutoSaveEnabled,
    startAutoSave,
    stopAutoSave,
    triggerAutoSaveCycle,
} from '../../View/ui/autoSaveService.js'
import * as projectSaverModule from '../../View/ui/projectSaver.js'
import {
    isProjectDirty,
    markProjectClean,
    markProjectDirty,
} from '../../View/ui/projectStateTracker.js'

describe('AutoSaveService (5-Minute Background Periodic Save)', () => {
    beforeEach(() => {
        localStorage.clear()
        stopAutoSave()
        markProjectClean()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        stopAutoSave()
        markProjectClean()
        vi.useRealTimers()
    })

    it('domyślny interwał wynosi dokładnie 5 minut (300 000 ms)', () => {
        expect(DEFAULT_AUTOSAVE_INTERVAL_MS).toBe(5 * 60 * 1000)
    })

    it('domyślnie auto-save jest włączony (true)', () => {
        expect(isAutoSaveEnabled()).toBe(true)
    })

    it('setAutoSaveEnabled aktualizuje localStorage i zatrzymuje/uruchamia timer', () => {
        const mockCtx = {
            projectPath: 'C:/Test/Project',
        }

        setAutoSaveEnabled(false)
        expect(isAutoSaveEnabled()).toBe(false)
        expect(localStorage.getItem('silnik_auto_save_enabled')).toBe('false')
        expect(isAutoSaveRunningStatus()).toBe(false)

        setAutoSaveEnabled(true, mockCtx)
        expect(isAutoSaveEnabled()).toBe(true)
        expect(localStorage.getItem('silnik_auto_save_enabled')).toBe('true')
        expect(isAutoSaveRunningStatus()).toBe(true)
    })

    it('triggerAutoSaveCycle pomija zapis gdy projekt jest czysty (isProjectDirty === false)', async () => {
        const saveSpy = vi.spyOn(projectSaverModule, 'saveFullProject')
        const mockCtx = { projectPath: 'C:/Test/Project' }

        expect(isProjectDirty()).toBe(false)
        const result = await triggerAutoSaveCycle(mockCtx)

        expect(result.skipped).toBe(true)
        expect(saveSpy).not.toHaveBeenCalled()
    })

    it('triggerAutoSaveCycle pomija zapis gdy brak ścieżki projektu (nie otwiera okna wyboru)', async () => {
        const saveSpy = vi.spyOn(projectSaverModule, 'saveFullProject')
        const mockCtx = { projectPath: '', getProjectPath: () => '' }

        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const result = await triggerAutoSaveCycle(mockCtx)
        expect(result.skipped).toBe(true)
        expect(saveSpy).not.toHaveBeenCalled()
    })

    it('triggerAutoSaveCycle wywołuje saveFullProject z isAutoSave gdy projekt jest dirty i ma ścieżkę', async () => {
        const saveSpy = vi
            .spyOn(projectSaverModule, 'saveFullProject')
            .mockResolvedValue({ success: true })
        const mockCtx = { projectPath: 'C:/Test/Gamebook' }

        markProjectDirty()
        expect(isProjectDirty()).toBe(true)

        const result = await triggerAutoSaveCycle(mockCtx)
        expect(result.success).toBe(true)
        expect(saveSpy).toHaveBeenCalledWith(mockCtx, { isAutoSave: true })
    })

    it('timer okresowy uruchamia triggerAutoSaveCycle co określony czas', async () => {
        vi.useFakeTimers()
        const saveSpy = vi
            .spyOn(projectSaverModule, 'saveFullProject')
            .mockResolvedValue({ success: true })
        const mockCtx = { projectPath: 'C:/Test/Gamebook' }

        markProjectDirty()
        startAutoSave(mockCtx, 1000)
        expect(isAutoSaveRunningStatus()).toBe(true)

        // Advance before interval -> not called yet
        vi.advanceTimersByTime(500)
        expect(saveSpy).not.toHaveBeenCalled()

        // Advance to interval -> auto save fires
        await vi.advanceTimersByTimeAsync(500)
        expect(saveSpy).toHaveBeenCalledWith(mockCtx, { isAutoSave: true })

        stopAutoSave()
        expect(isAutoSaveRunningStatus()).toBe(false)
    })
})
