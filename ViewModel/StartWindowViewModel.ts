import { ProjectManager } from '../Services/project/ProjectManager'
import {
    getLanguage,
    initTranslations,
    setLanguage,
    type SupportedLanguage,
    t,
} from '../Utils/i18n/translate'
import type { ToastType } from '../Utils/ui/toast'
import { StartWindowView } from '../View/ui/startWindow/StartWindowView'

export interface IStartWindowEvents {
    onToast?(message: string, type?: ToastType): void
    onLocaleChanged?(locale: SupportedLanguage): void
    onDropdownStateChanged?(isOpen: boolean): void
    onModalStateChanged?(isOpen: boolean): void
    onSelectedFolderChanged?(path: string | null): void
    onRecentProjectsLoaded?(projects: IRecentProject[]): void
}

export interface IStartWindowViewModelOptions {
    autoAttachView?: boolean
}

export class StartWindowViewModel {
    private subscribers: Set<IStartWindowEvents> = new Set()

    private recentProjects: IRecentProject[] = []
    private currentLocale: SupportedLanguage = 'pl'
    private isNewProjectModalOpen: boolean = false
    private isSettingsDropdownOpen: boolean = false
    private selectedProjectPath: string | null = null
    private projectName: string = ''

    private view: StartWindowView | null = null

    constructor(options: IStartWindowViewModelOptions = {}) {
        const shouldAttachView = options.autoAttachView ?? typeof document !== 'undefined'
        if (shouldAttachView) {
            this.view = new StartWindowView(this)
        }

        this.init()
    }

    public async init(): Promise<void> {
        await initTranslations()
        this.currentLocale = getLanguage()
        for (const subscriber of this.subscribers) {
            subscriber.onLocaleChanged?.(this.currentLocale)
        }
        await this.loadRecentProjects()
    }

    public subscribe(subscriber: IStartWindowEvents): () => void {
        this.subscribers.add(subscriber)
        return () => {
            this.subscribers.delete(subscriber)
        }
    }

    public async loadRecentProjects(): Promise<IRecentProject[]> {
        const projects: IRecentProject[] = await window.electronAPI.getRecentProjects()
        this.recentProjects = projects || []
        for (const subscriber of this.subscribers) {
            subscriber.onRecentProjectsLoaded?.(this.recentProjects)
        }
        return this.recentProjects
    }

    public openNewProjectModal(): void {
        this.isNewProjectModalOpen = true
        this.selectedProjectPath = null
        this.projectName = ''
        for (const subscriber of this.subscribers) {
            subscriber.onModalStateChanged?.(true)
            subscriber.onSelectedFolderChanged?.(null)
        }
    }

    public closeNewProjectModal(): void {
        this.isNewProjectModalOpen = false
        for (const subscriber of this.subscribers) {
            subscriber.onModalStateChanged?.(false)
        }
    }

    public toggleSettingsDropdown(force?: boolean): void {
        const nextState = force !== undefined ? force : !this.isSettingsDropdownOpen
        this.isSettingsDropdownOpen = nextState
        for (const subscriber of this.subscribers) {
            subscriber.onDropdownStateChanged?.(this.isSettingsDropdownOpen)
        }
    }

    public closeSettingsDropdown(): void {
        this.toggleSettingsDropdown(false)
    }

    public setProjectName(name: string): void {
        this.projectName = name
    }

    public async chooseFolder(): Promise<string | null> {
        const result = await window.electronAPI.chooseFolder()
        if (!result?.canceled && result?.path) {
            this.selectedProjectPath = result.path
            for (const subscriber of this.subscribers) {
                subscriber.onSelectedFolderChanged?.(this.selectedProjectPath)
            }
            return result.path
        }
        return null
    }

    public async submitNewProject(
        nameInput?: string
    ): Promise<{ success: boolean; error?: string }> {
        const name = (nameInput !== undefined ? nameInput : this.projectName).trim()
        let author = ''
        try {
            author = (await window.electronAPI.getSystemUsername()) || ''
        } catch {
            author = ''
        }
        const projectPath = this.selectedProjectPath

        if (!projectPath) {
            this.notifyToast(t('start_window.np_folder_required'), 'error')
            return { success: false, error: 'folder_required' }
        }

        const id = name
            ? name
                  .toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-z0-9_]/g, '')
            : 'new_project'

        try {
            const result = await window.electronAPI.createProject({
                id,
                name,
                author,
                projectPath,
            })
            if (result?.success) {
                window.currentProjectPath = result.path || projectPath
                this.closeNewProjectModal()
                this.notifyToast(t('start_window.np_create_success'), 'success')
                setTimeout(() => {
                    window.electronAPI.loadMainWindow()
                }, 1000)
                return { success: true }
            } else if (result?.error) {
                this.notifyToast(`${t('start_window.np_create_error')} ${result.error}`, 'error')
                return { success: false, error: result.error }
            }
            return { success: false }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            this.notifyToast(`${t('start_window.np_unexpected_error')} ${msg}`, 'error')
            return { success: false, error: msg }
        }
    }

    public async openProject(projectPath?: string): Promise<{ success: boolean; error?: string }> {
        const result = await window.electronAPI.openProject(projectPath)
        if (result?.success && result.project && result.entities) {
            try {
                window.currentProjectPath = result.path || projectPath || ''
                ProjectManager.getInstance().load(
                    result.project,
                    result.entities,
                    window.currentProjectPath
                )
                window.electronAPI.loadMainWindow()
                return { success: true }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                this.notifyToast(`${t('start_window.open_project_load_error')} ${msg}`, 'error')
                return { success: false, error: msg }
            }
        } else if (result && !result.success) {
            this.notifyToast(
                `${t('start_window.open_project_error')} ${result.error ?? ''}`,
                'error'
            )
            return { success: false, error: result.error }
        }
        return { success: false }
    }

    public async restoreProjectZip(): Promise<{ success: boolean; error?: string }> {
        if (!window.electronAPI || typeof window.electronAPI.restoreProjectZip !== 'function') {
            return { success: false }
        }

        const result = await window.electronAPI.restoreProjectZip()
        if (result?.success && result.project && result.entities) {
            try {
                window.currentProjectPath = result.path || ''
                ProjectManager.getInstance().load(
                    result.project,
                    result.entities,
                    window.currentProjectPath
                )
                this.notifyToast(t('start_window.restore_project_success'), 'success')
                setTimeout(() => {
                    window.electronAPI.loadMainWindow()
                }, 800)
                return { success: true }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                this.notifyToast(`${t('start_window.open_project_load_error')} ${msg}`, 'error')
                return { success: false, error: msg }
            }
        } else if (result && !result.success && !result.canceled) {
            this.notifyToast(
                `${t('start_window.restore_project_error')} ${result.error || ''}`,
                'error'
            )
            return { success: false, error: result.error }
        }
        return { success: false }
    }

    public async changeLocale(locale: SupportedLanguage): Promise<boolean> {
        const success = await setLanguage(locale)
        if (success) {
            this.currentLocale = locale
            this.closeSettingsDropdown()
            for (const subscriber of this.subscribers) {
                subscriber.onLocaleChanged?.(locale)
            }
            await this.loadRecentProjects()
            return true
        }
        return false
    }

    public closeApp(): void {
        window.electronAPI.closeApp()
    }

    public getSelectedProjectPath(): string | null {
        return this.selectedProjectPath
    }

    public getRecentProjectsList(): IRecentProject[] {
        return [...this.recentProjects]
    }

    public getCurrentLocale(): SupportedLanguage {
        return this.currentLocale
    }

    public isModalOpen(): boolean {
        return this.isNewProjectModalOpen
    }

    public isDropdownOpen(): boolean {
        return this.isSettingsDropdownOpen
    }

    public getView(): StartWindowView | null {
        return this.view
    }

    private notifyToast(message: string, type: ToastType = 'info'): void {
        for (const subscriber of this.subscribers) {
            subscriber.onToast?.(message, type)
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new StartWindowViewModel()
    })
}
