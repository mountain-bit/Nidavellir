import { t } from '../../../Utils/i18n/translate'
import { showToast as showToastUtil, type ToastType } from '../../../Utils/ui/toast'
import type {
    IStartWindowEvents,
    StartWindowViewModel,
} from '../../../ViewModel/StartWindowViewModel'

export class StartWindowView implements IStartWindowEvents {
    private vm: StartWindowViewModel

    private btnCreateProject: HTMLElement | null = null
    private btnOpenProject: HTMLElement | null = null
    private btnRestoreProject: HTMLElement | null = null
    private btnCloseApp: HTMLElement | null = null
    private btnSettings: HTMLElement | null = null
    private btnLangPl: HTMLElement | null = null
    private btnLangEn: HTMLElement | null = null
    private btnLangDe: HTMLElement | null = null
    private settingsDropdown: HTMLElement | null = null
    private recentProjectsList: HTMLElement | null = null

    private newProjectModal: HTMLElement | null = null
    private btnCancelNewProject: HTMLElement | null = null
    private btnCloseNewProjectModal: HTMLElement | null = null
    private btnSubmitNewProject: HTMLButtonElement | null = null
    private btnBrowseFolder: HTMLElement | null = null
    private npNameInput: HTMLInputElement | null = null
    private npFolderDisplay: HTMLElement | null = null

    private unsubscribeVm: (() => void) | null = null
    private onDocumentClickBound: (() => void) | null = null
    private onDocumentKeydownBound: ((e: KeyboardEvent) => void) | null = null

    constructor(vm: StartWindowViewModel) {
        this.vm = vm
        this.cacheDOMElements()
        this.attachEventListeners()
        this.unsubscribeVm = this.vm.subscribe(this)
    }

    private cacheDOMElements(): void {
        if (typeof document === 'undefined') return

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
        ) as HTMLButtonElement | null
        this.btnBrowseFolder = document.getElementById('btn-browse-folder')
        this.npNameInput = document.getElementById('np-name') as HTMLInputElement | null
        this.npFolderDisplay = document.getElementById('np-folder-display')
    }

    public applyTranslations(): void {
        if (typeof document === 'undefined') return

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n')
            if (key) el.textContent = t(key as Parameters<typeof t>[0])
        })
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder')
            if (key) (el as HTMLInputElement).placeholder = t(key as Parameters<typeof t>[0])
        })
    }

    public onToast(message: string, type: ToastType = 'info'): void {
        showToastUtil({ message, type, duration: 3000 })
    }

    public onLocaleChanged(locale: string): void {
        this.applyTranslations()
        this.updateActiveLocaleUI(locale)
    }

    public onDropdownStateChanged(isOpen: boolean): void {
        if (!this.settingsDropdown) return
        this.settingsDropdown.classList.toggle('hidden', !isOpen)
    }

    public onModalStateChanged(isOpen: boolean): void {
        if (!this.newProjectModal) return
        if (isOpen) {
            this.newProjectModal.classList.remove('hidden')
            if (this.npNameInput) {
                this.npNameInput.value = ''
                this.npNameInput.focus()
            }
            if (this.npFolderDisplay) {
                this.npFolderDisplay.textContent = t('start_window.np_folder_placeholder')
                this.npFolderDisplay.classList.remove('text-zinc-200')
                this.npFolderDisplay.classList.add('text-zinc-500')
            }
            if (this.btnSubmitNewProject) {
                this.btnSubmitNewProject.disabled = true
            }
        } else {
            this.newProjectModal.classList.add('hidden')
        }
    }

    public onSelectedFolderChanged(path: string | null): void {
        if (!this.npFolderDisplay) return
        if (path) {
            this.npFolderDisplay.textContent = path
            this.npFolderDisplay.classList.remove('text-zinc-500')
            this.npFolderDisplay.classList.add('text-zinc-200')
            if (this.btnSubmitNewProject) {
                this.btnSubmitNewProject.disabled = false
            }
        } else {
            this.npFolderDisplay.textContent = t('start_window.np_folder_placeholder')
            this.npFolderDisplay.classList.remove('text-zinc-200')
            this.npFolderDisplay.classList.add('text-zinc-500')
            if (this.btnSubmitNewProject) {
                this.btnSubmitNewProject.disabled = true
            }
        }
    }

    public onRecentProjectsLoaded(projects: IRecentProject[]): void {
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
            const projectItem = this.createRecentProjectItem(project)
            this.recentProjectsList.appendChild(projectItem)
        }
    }

    private updateActiveLocaleUI(locale: string): void {
        const activeClass = 'text-blue-400'
        this.btnLangPl?.classList.toggle(activeClass, locale === 'pl')
        this.btnLangEn?.classList.toggle(activeClass, locale === 'en')
        this.btnLangDe?.classList.toggle(activeClass, locale === 'de')
    }

    private createRecentProjectItem(project: IRecentProject): HTMLElement {
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
            await this.vm.openProject(project.path)
        })

        return btn
    }

    private attachEventListeners(): void {
        if (typeof document === 'undefined') return

        this.btnCloseApp?.addEventListener('click', () => {
            this.vm.closeApp()
        })

        this.btnCreateProject?.addEventListener('click', () => {
            this.vm.openNewProjectModal()
        })

        this.btnCancelNewProject?.addEventListener('click', () => {
            this.vm.closeNewProjectModal()
        })

        this.btnCloseNewProjectModal?.addEventListener('click', () => {
            this.vm.closeNewProjectModal()
        })

        this.newProjectModal?.addEventListener('click', e => {
            if (e.target === this.newProjectModal) {
                this.vm.closeNewProjectModal()
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
            await this.vm.chooseFolder()
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
            const name = this.npNameInput?.value ?? ''
            await this.vm.submitNewProject(name)
        })

        this.btnOpenProject?.addEventListener('click', async () => {
            await this.vm.openProject()
        })

        this.btnRestoreProject?.addEventListener('click', async () => {
            await this.vm.restoreProjectZip()
        })

        this.btnSettings?.addEventListener('click', e => {
            e.stopPropagation()
            this.vm.toggleSettingsDropdown()
        })

        this.onDocumentClickBound = (): void => {
            this.vm.closeSettingsDropdown()
        }
        document.addEventListener('click', this.onDocumentClickBound)

        this.onDocumentKeydownBound = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                this.vm.closeNewProjectModal()
                this.vm.closeSettingsDropdown()
            }
        }
        document.addEventListener('keydown', this.onDocumentKeydownBound)

        this.settingsDropdown?.addEventListener('click', e => e.stopPropagation())

        this.btnLangPl?.addEventListener('click', () => this.vm.changeLocale('pl'))
        this.btnLangEn?.addEventListener('click', () => this.vm.changeLocale('en'))
        this.btnLangDe?.addEventListener('click', () => this.vm.changeLocale('de'))
    }

    /**
     * Cleans up all subscriptions, event listeners, and DOM references.
     */
    public destroy(): void {
        if (this.unsubscribeVm) {
            this.unsubscribeVm()
            this.unsubscribeVm = null
        }

        if (typeof document !== 'undefined') {
            if (this.onDocumentClickBound) {
                document.removeEventListener('click', this.onDocumentClickBound)
                this.onDocumentClickBound = null
            }
            if (this.onDocumentKeydownBound) {
                document.removeEventListener('keydown', this.onDocumentKeydownBound)
                this.onDocumentKeydownBound = null
            }
        }

        this.btnCreateProject = null
        this.btnOpenProject = null
        this.btnRestoreProject = null
        this.btnCloseApp = null
        this.btnSettings = null
        this.btnLangPl = null
        this.btnLangEn = null
        this.btnLangDe = null
        this.settingsDropdown = null
        this.recentProjectsList = null
        this.newProjectModal = null
        this.btnCancelNewProject = null
        this.btnCloseNewProjectModal = null
        this.btnSubmitNewProject = null
        this.btnBrowseFolder = null
        this.npNameInput = null
        this.npFolderDisplay = null
    }
}
