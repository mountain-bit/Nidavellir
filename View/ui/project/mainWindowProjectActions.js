import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { ProjectManager } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { extractProjectData } from '../../projectData.js'
import { confirmApplicationClose } from '../modals/confirm/confirmModal.js'
import { executeNpcModalSave, hasUnsavedNpcChanges } from '../modals/npc/npcModal.js'
import { saveAllUnsavedFiles } from '../workspace/workspace.js'
import { saveFullProject } from './projectSaver.js'
import { isProjectDirty, markProjectClean, updateProjectNameUI } from './projectStateTracker.js'

/**
 * Applies a newly loaded project instance to the application state, updates UI lists,
 * resets dirty trackers, and redraws the story graph canvas.
 *
 * @param {object} appContext - Shared application context
 * @param {object} projectInstance - Project model instance
 * @param {string} [projectPath=''] - File system path of the project
 */
export function applyLoadedProject(appContext, projectInstance, projectPath = '') {
    if (!projectInstance || !appContext) return

    const vm = appContext.vm
    if (vm) {
        vm.project = projectInstance
    }
    appContext.project = projectInstance

    const realData = extractProjectData(projectInstance, {})
    if (vm?.factory?.ensureStartParagraph) {
        vm.factory.ensureStartParagraph(realData.projectParagraphs)
    }
    appContext.setProjectData(realData)
    appContext.projectPath = projectPath || ''
    if (typeof window !== 'undefined') {
        window.currentProjectPath = projectPath || ''
    }

    markProjectClean()
    const projName =
        (typeof projectInstance.getName === 'function' ? projectInstance.getName() : '') ||
        (projectPath ? projectPath.split(/[\\/]/).filter(Boolean).pop() : '') ||
        'Projekt'
    updateProjectNameUI(projName)

    if (typeof vm?.selection?.clearSelection === 'function') {
        vm.selection.clearSelection()
    }

    if (typeof appContext.renderParagraphsList === 'function') appContext.renderParagraphsList()
    if (typeof appContext.renderScenesList === 'function') appContext.renderScenesList()
    if (typeof appContext.renderConnectionsList === 'function') appContext.renderConnectionsList()
    if (typeof appContext.renderCharactersList === 'function') appContext.renderCharactersList()
    if (typeof appContext.renderMainCharacter === 'function') appContext.renderMainCharacter()
    if (typeof appContext.renderLocationsList === 'function') appContext.renderLocationsList()
    if (typeof appContext.renderTraitsList === 'function') appContext.renderTraitsList()
    if (typeof appContext.renderTagsList === 'function') appContext.renderTagsList()
    if (typeof appContext.renderFilterTags === 'function') appContext.renderFilterTags()
    if (typeof appContext.populateFilterSelects === 'function') appContext.populateFilterSelects()
    if (typeof appContext.renderHistoryBar === 'function') appContext.renderHistoryBar()
    if (typeof appContext.renderDetailsPanel === 'function') appContext.renderDetailsPanel()
    if (typeof appContext.updateMainWorkspaceUI === 'function') appContext.updateMainWorkspaceUI()

    const sg = appContext.storyGraphInstance
    if (sg && typeof sg.render === 'function') {
        sg.render(true)
    }
}

/**
 * Registers project-level action listeners for opening, restoring from ZIP,
 * closing project, and handling window close requests from Electron main process.
 *
 * @param {object} appContext - Shared application context
 */
export function setupProjectIpcActions(appContext) {
    document.querySelectorAll('[data-action="open-project"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (window.electronAPI && typeof window.electronAPI.openProject === 'function') {
                try {
                    const res = await window.electronAPI.openProject()
                    if (res && res.success && res.project) {
                        const projectDir = res.path
                            ? res.path.endsWith('project.json')
                                ? res.path.replace(/[\\/]project\.json$/i, '')
                                : res.path
                            : ''
                        const projectInstance = ProjectManager.getInstance().load(
                            res.project,
                            res.entities || {},
                            res.path || projectDir
                        )
                        applyLoadedProject(appContext, projectInstance, projectDir || res.path)
                        toast.success(t('project.opened') || 'Projekt został pomyślnie otwarty')
                    } else if (res && !res.success && res.error) {
                        toast.error(res.error)
                    }
                } catch (err) {
                    console.error('Error opening project:', err)
                    toast.error(t('error.open_project_failed') || 'Nie udało się otworzyć projektu')
                }
            }
        })
    })

    document.querySelectorAll('[data-action="restore-project"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (window.electronAPI && typeof window.electronAPI.restoreProjectZip === 'function') {
                const canProceed = await confirmApplicationClose('project', appContext, {
                    hasUnsavedNpc: hasUnsavedNpcChanges,
                    saveNpc: () => executeNpcModalSave(appContext),
                    saveFiles: ctx => saveAllUnsavedFiles(ctx),
                    isProjectDirty: () => isProjectDirty(),
                    saveFullProject: ctx => saveFullProject(ctx),
                    markProjectClean: () => markProjectClean(),
                })
                if (!canProceed) return

                try {
                    const res = await window.electronAPI.restoreProjectZip()
                    if (res && res.success && res.project) {
                        const projectDir = res.path
                            ? res.path.endsWith('project.json')
                                ? res.path.replace(/[\\/]project\.json$/i, '')
                                : res.path
                            : ''
                        const projectInstance = ProjectManager.getInstance().load(
                            res.project,
                            res.entities || {},
                            res.path || projectDir
                        )
                        applyLoadedProject(appContext, projectInstance, projectDir || res.path)
                        toast.success(
                            t('start_window.restore_project_success') ||
                                'Projekt został pomyślnie przywrócony z archiwum ZIP!'
                        )
                    } else if (res && !res.success && !res.canceled && res.error) {
                        toast.error(res.error)
                    }
                } catch (err) {
                    console.error('Error restoring project from zip:', err)
                    toast.error(
                        t('start_window.restore_project_error') ||
                            'Nie udało się przywrócić projektu z pliku ZIP'
                    )
                }
            }
        })
    })

    document.querySelectorAll('[data-action="close-project"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const canClose = await confirmApplicationClose('project', appContext, {
                hasUnsavedNpc: hasUnsavedNpcChanges,
                saveNpc: () => executeNpcModalSave(appContext),
                saveFiles: ctx => saveAllUnsavedFiles(ctx),
                isProjectDirty: () => isProjectDirty(),
                saveFullProject: ctx => saveFullProject(ctx),
                markProjectClean: () => markProjectClean(),
            })
            if (
                canClose &&
                window.electronAPI &&
                typeof window.electronAPI.loadStartWindow === 'function'
            ) {
                window.electronAPI.loadStartWindow()
            }
        })
    })

    if (window.electronAPI && typeof window.electronAPI.onAppCloseRequested === 'function') {
        window.electronAPI.onAppCloseRequested(async () => {
            const canClose = await confirmApplicationClose('app', appContext, {
                hasUnsavedNpc: hasUnsavedNpcChanges,
                saveNpc: () => executeNpcModalSave(appContext),
                saveFiles: ctx => saveAllUnsavedFiles(ctx),
                isProjectDirty: () => isProjectDirty(),
                saveFullProject: ctx => saveFullProject(ctx),
                markProjectClean: () => markProjectClean(),
            })
            if (canClose && typeof window.electronAPI.forceCloseApp === 'function') {
                window.electronAPI.forceCloseApp()
            }
        })
    }
}
