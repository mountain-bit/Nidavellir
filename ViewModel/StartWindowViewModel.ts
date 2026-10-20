import { ProjectManager } from '../Services/ProjectManager'
import { showToast as showToastUtil, type ToastType } from '../Utils/toast'
import {
    getLanguage,
    initTranslations,
    setLanguage,
    type SupportedLanguage,
    t,
} from '../Utils/translate'

export class StartWindowViewModel {
    private btnCreateProject: HTMLElement | null
    private btnOpenProject: HTMLElement | null
    private btnRestoreProject: HTMLElement | null
    private btnCloseApp: HTMLElement | null
    private btnSettings: HTMLElement | null
    private btnLangPl: HTMLElement | null
    private btnLangEn: HTMLElement | null
    private btnLangDe: HTMLElement | null
    private settingsDropdown: HTMLElement | null
    private recentProjectsList: HTMLElement | null

    private newProjectModal: HTMLElement | null
    private btnCancelNewProject: HTMLElement | null
    private btnCloseNewProjectModal: HTMLElement | null
    private btnSubmitNewProject: HTMLButtonElement | null
    private btnBrowseFolder: HTMLElement | null
    private npNameInput: HTMLInputElement | null
    private npFolderDisplay: HTMLElement | null
    private selectedProjectPath: string | null = null

    constructor() {
        this.btnCreateProject = document.getElementById('btn-create-project')
        this.btnOpenProject = document.getElementById('btn-open-project')
        this.btnRestoreProject = document.getElementById('btn-restore-project')
        this.btnCloseApp = document.getElementById('btn-close-app')
        this.btnSettings = document.getElementById('btn-settings')
        this.btnLangPl = document.getElementById('btn-lang-pl')
        this.btnLangEn = document.getElementById('btn-lang-en')
        this.btnLangDe = document.getElementById('btn-lang-de')
        this.settingsDropdown = document.getElementById('settings-dropdown')
        this.recentProjectsList = document.getElementById('recent-projects-list')

        this.newProjectModal = document.getElementById('new-project-modal')
        this.btnCancelNewProject = document.getElementById('btn-cancel-new-project')
        this.btnCloseNewProjectModal = document.getElementById('btn-close-new-project-modal')
        this.btnSubmitNewProject = document.getElementById(
            'btn-submit-new-project'
        ) as HTMLButtonElement
        this.btnBrowseFolder = document.getElementById('btn-browse-folder')
        this.npNameInput = document.getElementById('np-name') as HTMLInputElement
        this.npFolderDisplay = document.getElementById('np-folder-display')

        this.init()
    }

    private async init(): Promise<void> {
        await initTranslations()
        this.applyTranslations()
        this.updateActiveLocaleUI(getLanguage())
        this.attachEventListeners()
        await this.loadRecentProjects()
    }

    private applyTranslations(): void {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n')
            if (key) el.textContent = t(key as Parameters<typeof t>[0])
        })
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder')
            if (key) (el as HTMLInputElement).placeholder = t(key as Parameters<typeof t>[0])
        })
    }

    private updateActiveLocaleUI(locale: string): void {
        const activeClass = 'text-blue-400'
        this.btnLangPl?.classList.toggle(activeClass, locale === 'pl')
        this.btnLangEn?.classList.toggle(activeClass, locale === 'en')
        this.btnLangDe?.classList.toggle(activeClass, locale === 'de')
    }

    private toggleDropdown(force?: boolean): void {
        if (!this.settingsDropdown) return
        const isHidden = this.settingsDropdown.classList.contains('hidden')
        const show = force !== undefined ? force : isHidden
        this.settingsDropdown.classList.toggle('hidden', !show)
    }

    private showToast(message: string, type: ToastType = 'info'): void {
        showToastUtil({ message, type, duration: 3000 })
    }

    private attachEventListeners(): void {
        this.btnCloseApp?.addEventListener('click', () => {
            window.electronAPI.closeApp()
        })

        this.btnCreateProject?.addEventListener('click', () => {
            if (this.newProjectModal) {
                this.newProjectModal.classList.remove('hidden')
                if (this.npNameInput) {
                    this.npNameInput.value = ''
                    this.npNameInput.focus()
                }
                this.selectedProjectPath = null
                if (this.npFolderDisplay) {
                    this.npFolderDisplay.textContent = t('start_window.np_folder_placeholder')
                    this.npFolderDisplay.classList.remove('text-zinc-200')
                    this.npFolderDisplay.classList.add('text-zinc-500')
                }
                if (this.btnSubmitNewProject) this.btnSubmitNewProject.disabled = true
            }
        })

        this.btnCancelNewProject?.addEventListener('click', () => {
            this.newProjectModal?.classList.add('hidden')
        })

        this.btnCloseNewProjectModal?.addEventListener('click', () => {
            this.newProjectModal?.classList.add('hidden')
        })

        this.newProjectModal?.addEventListener('click', e => {
            if (e.target === this.newProjectModal) {
                this.newProjectModal?.classList.add('hidden')
            }
        })

        this.npNameInput?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (
                e.key === 'Enter' &&
                this.btnSubmitNewProject &&
                !this.btnSubmitNewProject.disabled
            ) {
                this.btnSubmitNewProject.click()
            }
        })

        this.btnBrowseFolder?.addEventListener('click', async () => {
            const result = await window.electronAPI.chooseFolder()
            if (!result?.canceled && result?.path) {
                this.selectedProjectPath = result.path
                if (this.npFolderDisplay) {
                    this.npFolderDisplay.textContent = result.path
                    this.npFolderDisplay.classList.remove('text-zinc-500')
                    this.npFolderDisplay.classList.add('text-zinc-200')
                }
                if (this.btnSubmitNewProject) this.btnSubmitNewProject.disabled = false
            }
        })

        this.btnSubmitNewProject?.addEventListener('keydown', e => {
            if (
                e.key === ' ' ||
                e.key === 'Spacebar' ||
                e.key === 'Enter' ||
                e.keyCode === 32 ||
                e.keyCode === 13
            ) {
                this.btnSubmitNewProject?.click()
            }
        })

        this.btnSubmitNewProject?.addEventListener('click', async () => {
            const name = this.npNameInput?.value.trim() || ''
            let author = ''
            try {
                author = (await window.electronAPI.getSystemUsername()) || ''
            } catch {
                author = ''
            }
            const projectPath = this.selectedProjectPath

            if (!projectPath) {
                this.showToast(t('start_window.np_folder_required'), 'error')
                return
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
                    this.newProjectModal?.classList.add('hidden')
                    this.showToast(t('start_window.np_create_success'), 'success')
                    setTimeout(() => {
                        window.electronAPI.loadMainWindow()
                    }, 1000)
                } else if (result?.error) {
                    this.showToast(`${t('start_window.np_create_error')} ${result.error}`, 'error')
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                this.showToast(`${t('start_window.np_unexpected_error')} ${msg}`, 'error')
            }
        })

        this.btnOpenProject?.addEventListener('click', async () => {
            const result = await window.electronAPI.openProject()
            if (result?.success && result.project && result.entities) {
                try {
                    window.currentProjectPath = result.path || ''
                    ProjectManager.getInstance().load(
                        result.project,
                        result.entities,
                        result.path || ''
                    )
                    window.electronAPI.loadMainWindow()
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    this.showToast(`${t('start_window.open_project_load_error')} ${msg}`, 'error')
                }
            } else if (result && !result.success) {
                this.showToast(
                    `${t('start_window.open_project_error')} ${result.error || ''}`,
                    'error'
                )
            }
        })

        this.btnRestoreProject?.addEventListener('click', async () => {
            if (!window.electronAPI || typeof window.electronAPI.restoreProjectZip !== 'function') {
                return
            }

            const result = await window.electronAPI.restoreProjectZip()
            if (result?.success && result.project && result.entities) {
                try {
                    window.currentProjectPath = result.path || ''
                    ProjectManager.getInstance().load(
                        result.project,
                        result.entities,
                        result.path || ''
                    )
                    this.showToast(t('start_window.restore_project_success'), 'success')
                    setTimeout(() => {
                        window.electronAPI.loadMainWindow()
                    }, 800)
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    this.showToast(`${t('start_window.open_project_load_error')} ${msg}`, 'error')
                }
            } else if (result && !result.success && !result.canceled) {
                this.showToast(
                    `${t('start_window.restore_project_error')} ${result.error || ''}`,
                    'error'
                )
            }
        })

        this.btnSettings?.addEventListener('click', e => {
            e.stopPropagation()
            this.toggleDropdown()
        })

        document.addEventListener('click', () => {
            this.toggleDropdown(false)
        })

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.newProjectModal?.classList.add('hidden')
                this.toggleDropdown(false)
            }
        })

        this.settingsDropdown?.addEventListener('click', e => e.stopPropagation())

        this.btnLangPl?.addEventListener('click', () => this.changeLocale('pl'))
        this.btnLangEn?.addEventListener('click', () => this.changeLocale('en'))
        this.btnLangDe?.addEventListener('click', () => this.changeLocale('de'))
    }

    private async changeLocale(locale: SupportedLanguage): Promise<void> {
        const success = await setLanguage(locale)
        if (success) {
            this.applyTranslations()
            this.updateActiveLocaleUI(locale)
            this.toggleDropdown(false)
            await this.loadRecentProjects()
        }
    }

    private async loadRecentProjects(): Promise<void> {
        const projects: IRecentProject[] = await window.electronAPI.getRecentProjects()

        if (!this.recentProjectsList) return

        this.recentProjectsList.innerHTML = ''

        if (projects.length === 0) {
            const msg = document.createElement('span')
            msg.className = 'text-sm text-zinc-500'
            msg.textContent = t('start_window.no_recent_projects')
            this.recentProjectsList.appendChild(msg)
            return
        }

        for (const project of projects) {
            const dateStr = new Date(project.lastOpened).toLocaleString()

            const btn = document.createElement('button')
            btn.className =
                'group flex flex-col items-start gap-1.5 rounded-lg border border-transparent p-3 text-left transition-all hover:bg-zinc-800/60 hover:border-zinc-700/50'

            const row = document.createElement('div')
            row.className = 'flex items-center gap-2 w-full'

            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            icon.setAttribute('width', '14')
            icon.setAttribute('height', '14')
            icon.setAttribute('viewBox', '0 0 24 24')
            icon.setAttribute('fill', 'none')
            icon.setAttribute('stroke', 'currentColor')
            icon.setAttribute('stroke-width', '2')
            icon.setAttribute('stroke-linecap', 'round')
            icon.setAttribute('stroke-linejoin', 'round')
            icon.setAttribute('class', 'text-zinc-500 group-hover:text-blue-400 transition-colors')
            const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            iconPath.setAttribute(
                'd',
                'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
            )
            icon.appendChild(iconPath)

            const nameSpan = document.createElement('span')
            nameSpan.className = 'text-sm font-medium text-zinc-300 group-hover:text-zinc-100'
            nameSpan.textContent = project.name

            row.appendChild(icon)
            row.appendChild(nameSpan)

            const pathSpan = document.createElement('span')
            pathSpan.className = 'text-xs text-zinc-500 truncate w-full pl-6'
            pathSpan.textContent = project.path

            const dateSpan = document.createElement('span')
            dateSpan.className = 'text-[10px] text-zinc-600 mt-0.5 pl-6'
            dateSpan.textContent = `${t('start_window.last_opened')} ${dateStr}`

            btn.appendChild(row)
            btn.appendChild(pathSpan)
            btn.appendChild(dateSpan)

            btn.addEventListener('click', async () => {
                const result = await window.electronAPI.openProject(project.path)
                if (result?.success && result.project && result.entities) {
                    try {
                        window.currentProjectPath = result.path || project.path
                        ProjectManager.getInstance().load(
                            result.project,
                            result.entities,
                            result.path || project.path
                        )
                        window.electronAPI.loadMainWindow()
                    } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : String(err)
                        this.showToast(
                            `${t('start_window.open_project_load_error')} ${msg}`,
                            'error'
                        )
                    }
                } else if (result && !result.success) {
                    this.showToast(
                        `${t('start_window.open_project_error')} ${result.error ?? ''}`,
                        'error'
                    )
                }
            })

            this.recentProjectsList.appendChild(btn)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StartWindowViewModel()
})
