import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { clearDirtyFiles } from '../modals/confirm/confirmModal.js'
import { saveActiveFile } from '../workspace/workspace.js'
import { markProjectDirty, setProjectSaved, setProjectSaving } from './projectStateTracker.js'

let isSaving = false

/**
 * Saves the entire gamebook project state (paragraphs, scenes, entities, markdown prose, manifest).
 *
 * @param {object} ctx Application UI Context
 * @returns {Promise<{ success: boolean, canceled?: boolean, error?: string }>}
 */
export async function saveFullProject(ctx, options = {}) {
    if (isSaving) {
        return { success: false, error: 'Save already in progress' }
    }

    if (!ctx) return { success: false, error: 'Missing application context' }

    isSaving = true
    setProjectSaving()

    try {
        // Ensure any active file content in TipTap / textarea is flushed
        if (ctx?.vm && typeof ctx.vm?.files?.getActiveFile === 'function') {
            saveActiveFile(ctx, { silent: true })
        }

        let projectPath =
            (typeof ctx.getProjectPath === 'function' ? ctx.getProjectPath() : ctx.projectPath) ||
            (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
            ''

        // If no project folder selected yet, prompt user (unless it is a background auto-save)
        if (!projectPath && typeof window !== 'undefined' && window.electronAPI?.chooseFolder) {
            if (options.isAutoSave) {
                isSaving = false
                return { success: false, skipped: true, error: 'No project folder chosen yet' }
            }
            const folderResult = await window.electronAPI.chooseFolder()
            if (folderResult.canceled || !folderResult.path) {
                isSaving = false
                markProjectDirty()
                return { success: false, canceled: true }
            }
            projectPath = folderResult.path
            ctx.projectPath = projectPath
            window.currentProjectPath = projectPath
        }

        const projectParagraphs = (ctx.projectParagraphs || []).map(p =>
            p && typeof p.toJSON === 'function' ? p.toJSON() : p
        )
        const projectScenes = (ctx.projectScenes || []).map(s =>
            s && typeof s.toJSON === 'function' ? s.toJSON() : s
        )
        const projectCharacters = (ctx.projectCharacters || []).map(c =>
            c && typeof c.toJSON === 'function' ? c.toJSON() : c
        )
        const projectTemplates = (ctx.projectTemplates || []).map(t =>
            t && typeof t.toJSON === 'function' ? t.toJSON() : t
        )
        const projectLocations = (ctx.projectLocations || []).map(l =>
            l && typeof l.toJSON === 'function' ? l.toJSON() : l
        )
        const projectItems = (ctx.projectItems || []).map(i =>
            i && typeof i.toJSON === 'function' ? i.toJSON() : i
        )

        const rawPlayerCharacters =
            ctx.playerCharacters ||
            ctx.projectData?.playerCharacters ||
            (ctx.playerCharacter ? [ctx.playerCharacter] : []) ||
            (ctx.projectData?.playerCharacter ? [ctx.projectData.playerCharacter] : []) ||
            (typeof ctx.vm?.project?.getPlayerCharacters === 'function'
                ? ctx.vm.project.getPlayerCharacters()
                : [])
        const projectPlayerCharacters = (
            Array.isArray(rawPlayerCharacters) ? rawPlayerCharacters : [rawPlayerCharacters]
        )
            .filter(Boolean)
            .map(p => (p && typeof p.toJSON === 'function' ? p.toJSON() : p))

        const allRules = [
            ...(ctx.projectStats || []).map(r => ({
                ...(r && typeof r.toJSON === 'function' ? r.toJSON() : r),
                type: 'stat',
            })),
            ...(ctx.projectSkills || []).map(r => ({
                ...(r && typeof r.toJSON === 'function' ? r.toJSON() : r),
                type: 'skill',
            })),
            ...(ctx.projectParameters || []).map(r => ({
                ...(r && typeof r.toJSON === 'function' ? r.toJSON() : r),
                type: 'parameter',
            })),
            ...(ctx.projectFeatures || []).map(r => ({
                ...(r && typeof r.toJSON === 'function' ? r.toJSON() : r),
                type: 'feature',
            })),
        ]

        const rawDisplayName = document.getElementById('project-name-display')?.textContent?.trim()
        const placeholder =
            (typeof t === 'function' ? t('topbar.project_placeholder') : '') || 'Brak projektu'
        const projectName =
            (rawDisplayName &&
            rawDisplayName !== placeholder &&
            rawDisplayName !== 'No project' &&
            rawDisplayName !== 'Kein Projekt'
                ? rawDisplayName
                : '') ||
            ctx.vm?.project?.getName?.() ||
            'Projekt'

        const payload = {
            project: {
                id: ctx.vm?.project?.getId?.() || 'project',
                name: projectName,
                author: ctx.vm?.project?.getAuthor?.() || '',
                version: ctx.vm?.project?.getVersion?.() || '1.0.0',
                editor: {
                    customStyles: ctx.vm?.project?.getCustomStyles?.() || [],
                    customFonts: ctx.vm?.project?.getCustomFonts?.() || [],
                },
                graph: {
                    scenes: projectScenes,
                },
            },
            paragraphs: projectParagraphs,
            scenes: projectScenes,
            entities: {
                NPC: projectCharacters,
                Templates: projectTemplates,
                Locations: projectLocations,
                Items: projectItems,
                Rules: allRules,
                PlayerCharacter: projectPlayerCharacters,
            },
            files: ctx.files || {},
        }

        if (
            typeof window !== 'undefined' &&
            window.electronAPI &&
            typeof window.electronAPI.saveFullProject === 'function' &&
            projectPath
        ) {
            const res = await window.electronAPI.saveFullProject(projectPath, payload)
            if (res && res.success) {
                setProjectSaved()
                clearDirtyFiles()
                if (options.isAutoSave) {
                    const autoTitle =
                        typeof t === 'function' &&
                        t('toast.auto_save_title') !== 'toast.auto_save_title'
                            ? t('toast.auto_save_title')
                            : 'Auto-zapis'
                    const autoMsg =
                        typeof t === 'function' && t('toast.auto_saved') !== 'toast.auto_saved'
                            ? t('toast.auto_saved')
                            : 'Projekt został automatycznie zapisany'
                    toast.info(autoMsg, autoTitle)
                } else {
                    const successTitle =
                        typeof t === 'function' ? t('toast.success_title') : 'Sukces'
                    const successMsg =
                        typeof t === 'function'
                            ? t('toast.save_success') || 'Projekt został pomyślnie zapisany'
                            : 'Projekt został pomyślnie zapisany'
                    toast.success(successMsg, successTitle)
                }
                return { success: true }
            } else {
                markProjectDirty()
                const errorTitle = typeof t === 'function' ? t('toast.error_title') : 'Błąd'
                const errorMsg =
                    res?.error ||
                    (typeof t === 'function'
                        ? t('toast.save_error', { error: 'Unknown' })
                        : 'Błąd zapisu projektu')
                toast.error(errorMsg, errorTitle)
                return { success: false, error: res?.error }
            }
        } else {
            // In-memory fallback
            setProjectSaved()
            clearDirtyFiles()
            if (!options.isAutoSave) {
                const successTitle = typeof t === 'function' ? t('toast.success_title') : 'Sukces'
                const successMsg =
                    typeof t === 'function'
                        ? t('toast.save_success') || 'Projekt zapisany w pamięci'
                        : 'Projekt zapisany w pamięci'
                toast.success(successMsg, successTitle)
            }
            return { success: true }
        }
    } catch (err) {
        console.error('Error saving full project:', err)
        markProjectDirty()
        const errorTitle = typeof t === 'function' ? t('toast.error_title') : 'Błąd'
        toast.error(err.message || 'Błąd zapisu projektu', errorTitle)
        return { success: false, error: err.message }
    } finally {
        isSaving = false
    }
}

/**
 * Returns whether a save operation is currently in progress.
 *
 * @returns {boolean}
 */
export function isSavingStatus() {
    return isSaving
}

/**
 * Resets the internal save lock state (useful for test teardown).
 */
export function resetProjectSaverState() {
    isSaving = false
}
