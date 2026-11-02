// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectManager } from '../../Services/project/ProjectManager'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import { type IStartWindowEvents, StartWindowViewModel } from '../../ViewModel/StartWindowViewModel'

describe('StartWindowViewModel (Pure Unit Tests - No DOM)', () => {
    let vm: StartWindowViewModel
    let mockEvents: {
        onToast: ReturnType<typeof vi.fn>
        onLocaleChanged: ReturnType<typeof vi.fn>
        onDropdownStateChanged: ReturnType<typeof vi.fn>
        onModalStateChanged: ReturnType<typeof vi.fn>
        onSelectedFolderChanged: ReturnType<typeof vi.fn>
        onRecentProjectsLoaded: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        ProjectManager.getInstance().clear()
        await initTranslationsWithLocale('pl')

        const electronAPIMock = {
            getRecentProjects: vi
                .fn()
                .mockResolvedValue([{ name: 'Gra 1', path: '/path/1', lastOpened: '2026-01-01' }]),
            getTranslations: vi.fn().mockResolvedValue({}),
            getLocale: vi.fn().mockResolvedValue('pl'),
            setLocale: vi.fn().mockResolvedValue(true),
            chooseFolder: vi.fn().mockResolvedValue({ canceled: false, path: '/path/to/project' }),
            createProject: vi.fn().mockResolvedValue({ success: true, path: '/path/to/project' }),
            openProject: vi.fn().mockResolvedValue({
                success: true,
                project: {
                    id: 'p1',
                    name: 'Projekt 1',
                    start: { sceneId: 's1', paragraphId: 'p1' },
                },
                entities: {},
                path: '/path/to/project',
            }),
            closeApp: vi.fn().mockResolvedValue(undefined),
            loadMainWindow: vi.fn().mockResolvedValue(undefined),
            getSystemUsername: vi.fn().mockResolvedValue('test_user'),
        }

        // Definiujemy window w czystym środowisku Node bez drzewa DOM
        ;(globalThis as unknown as { window: unknown }).window = {
            electronAPI: electronAPIMock,
            currentProjectPath: '',
        }

        mockEvents = {
            onToast: vi.fn(),
            onLocaleChanged: vi.fn(),
            onDropdownStateChanged: vi.fn(),
            onModalStateChanged: vi.fn(),
            onSelectedFolderChanged: vi.fn(),
            onRecentProjectsLoaded: vi.fn(),
        }

        vm = new StartWindowViewModel({ autoAttachView: false })
        vm.subscribe(mockEvents as IStartWindowEvents)
        await vm.init()
    })

    it('inicjalizuje stan i powiadamia subskrybentów o projektach i języku', () => {
        expect(vm.getCurrentLocale()).toBe('pl')
        expect(mockEvents.onLocaleChanged).toHaveBeenCalledWith('pl')
        expect(mockEvents.onRecentProjectsLoaded).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ name: 'Gra 1' })])
        )
    })

    it('otwiera i zamyka modal nowego projektu ze zresetowanym stanem', () => {
        vm.openNewProjectModal()
        expect(vm.isModalOpen()).toBe(true)
        expect(vm.getSelectedProjectPath()).toBeNull()
        expect(mockEvents.onModalStateChanged).toHaveBeenCalledWith(true)
        expect(mockEvents.onSelectedFolderChanged).toHaveBeenCalledWith(null)

        vm.closeNewProjectModal()
        expect(vm.isModalOpen()).toBe(false)
        expect(mockEvents.onModalStateChanged).toHaveBeenCalledWith(false)
    })

    it('przełącza stan dropdowna ustawień', () => {
        expect(vm.isDropdownOpen()).toBe(false)

        vm.toggleSettingsDropdown()
        expect(vm.isDropdownOpen()).toBe(true)
        expect(mockEvents.onDropdownStateChanged).toHaveBeenCalledWith(true)

        vm.closeSettingsDropdown()
        expect(vm.isDropdownOpen()).toBe(false)
        expect(mockEvents.onDropdownStateChanged).toHaveBeenCalledWith(false)
    })

    it('obsługuje wybór folderu', async () => {
        const path = await vm.chooseFolder()
        expect(path).toBe('/path/to/project')
        expect(vm.getSelectedProjectPath()).toBe('/path/to/project')
        expect(mockEvents.onSelectedFolderChanged).toHaveBeenCalledWith('/path/to/project')
    })

    it('tworzy projekt i powiadamia o sukcesie', async () => {
        await vm.chooseFolder()
        const res = await vm.submitNewProject('Moja Gra')

        expect(res.success).toBe(true)
        expect(window.electronAPI.createProject).toHaveBeenCalledWith({
            id: 'moja_gra',
            name: 'Moja Gra',
            author: 'test_user',
            projectPath: '/path/to/project',
        })
        expect(mockEvents.onToast).toHaveBeenCalledWith(expect.any(String), 'success')
    })

    it('zwraca błąd gdy brak wybranego folderu przy submitNewProject', async () => {
        const res = await vm.submitNewProject('Moja Gra')

        expect(res.success).toBe(false)
        expect(res.error).toBe('folder_required')
        expect(mockEvents.onToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })

    it('zmienia język i odświeża projekty', async () => {
        const changed = await vm.changeLocale('en')

        expect(changed).toBe(true)
        expect(vm.getCurrentLocale()).toBe('en')
        expect(mockEvents.onLocaleChanged).toHaveBeenCalledWith('en')
    })

    it('zamyka aplikację', () => {
        vm.closeApp()
        expect(window.electronAPI.closeApp).toHaveBeenCalled()
    })
})
