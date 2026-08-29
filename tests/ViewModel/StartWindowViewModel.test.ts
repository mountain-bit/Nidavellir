// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectManager } from '../../Services/ProjectManager'
import { initTranslationsWithLocale, t } from '../../Utils/translate'
import { StartWindowViewModel } from '../../ViewModel/StartWindowViewModel'

const mockHTML = `
<!DOCTYPE html>
<html>
<head></head>
<body>
    <button id="btn-close-app"></button>
    <h1 data-i18n="app.title">Tytuł</h1>
    
    <button id="btn-create-project">
        <span data-i18n="start_window.create_project">Stwórz nowy projekt</span>
    </button>
    <button id="btn-open-project">
        <span data-i18n="start_window.open_project">Otwórz projekt</span>
    </button>

    <button id="btn-settings" data-i18n="start_window.settings">Ustawienia</button>
    <div id="settings-dropdown" class="hidden">
        <button id="btn-lang-pl">Polski</button>
        <button id="btn-lang-en">English</button>
        <button id="btn-lang-de">Deutsch</button>
    </div>

    <div id="recent-projects-list"></div>

    <div id="new-project-modal" class="hidden">
        <button id="btn-close-new-project-modal"></button>
        <input type="text" id="np-nazwa" data-i18n-placeholder="start_window.np_name_placeholder" />
        <div id="np-folder-display" data-i18n="start_window.np_folder_placeholder">Nie wybrano folderu...</div>
        <button id="btn-browse-folder">Przeglądaj</button>
        <button id="btn-cancel-new-project">Anuluj</button>
        <button id="btn-submit-new-project" disabled>Utwórz projekt</button>
    </div>

    <div id="toast-container"></div>
</body>
</html>
`

const sampleValidProjectData = {
    id: 'test_proj',
    name: 'Testowy Projekt',
    author: 'Jan Kowalski',
    version: '1.0',
    engineVersion: '1.0',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    start: { sceneId: 'scena_1', paragraphId: 'par_1' },
}

describe('StartWindowViewModel', () => {
    beforeEach(async () => {
        document.body.innerHTML = mockHTML
        ProjectManager.getInstance().clear()
        await initTranslationsWithLocale('pl')

        // Mock requestAnimationFrame
        window.requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        }

        // Mock window.electronAPI
        window.electronAPI = {
            getRecentProjects: vi.fn().mockResolvedValue([]),
            getTranslations: vi.fn().mockResolvedValue({}),
            getLocale: vi.fn().mockResolvedValue('pl'),
            setLocale: vi.fn().mockResolvedValue(true),
            chooseFolder: vi.fn().mockResolvedValue({ canceled: false, path: 'C:/Projekty/Gra1' }),
            createProject: vi.fn().mockResolvedValue({ success: true }),
            openProject: vi.fn().mockResolvedValue({
                success: true,
                project: sampleValidProjectData,
                entities: {},
            }),
            closeApp: vi.fn().mockResolvedValue(undefined),
            loadMainWindow: vi.fn().mockResolvedValue(undefined),
            getSystemUsername: vi.fn().mockResolvedValue('jan_user'),
        } as any
    })

    async function createViewModel(): Promise<StartWindowViewModel> {
        const vm = new StartWindowViewModel()
        await vi.waitFor(() => {
            const recentList = document.getElementById('recent-projects-list')
            expect(recentList?.children.length).toBeGreaterThan(0)
        })
        return vm
    }

    it('poprawnie inicjalizuje tłumaczenia oraz podmienia teksty i placeholdery w DOM', async () => {
        await createViewModel()

        const titleEl = document.querySelector('[data-i18n="app.title"]')
        expect(titleEl?.textContent).toBe(t('app.title'))

        const inputEl = document.getElementById('np-nazwa') as HTMLInputElement
        expect(inputEl.placeholder).toBe(t('start_window.np_name_placeholder'))
    })

    it('wywołuje window.electronAPI.closeApp po kliknięciu btn-close-app', async () => {
        await createViewModel()

        const btnClose = document.getElementById('btn-close-app')
        btnClose?.click()

        expect(window.electronAPI.closeApp).toHaveBeenCalledTimes(1)
    })

    describe('Ustawienia i Zmiana Języka', () => {
        it('otwiera i zamyka dropdown ustawień po kliknięciu btn-settings oraz dokumentu', async () => {
            await createViewModel()

            const btnSettings = document.getElementById('btn-settings')
            const dropdown = document.getElementById('settings-dropdown')

            expect(dropdown?.classList.contains('hidden')).toBe(true)

            btnSettings?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            expect(dropdown?.classList.contains('hidden')).toBe(false)

            document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            expect(dropdown?.classList.contains('hidden')).toBe(true)
        })

        it('zmienia język na EN po kliknięciu btn-lang-en i aktualizuje UI oraz uaktualnia ostatnie projekty', async () => {
            await createViewModel()

            const btnLangEn = document.getElementById('btn-lang-en')
            btnLangEn?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.setLocale).toHaveBeenCalledWith('en')
            })

            const btnLangPl = document.getElementById('btn-lang-pl')
            expect(btnLangEn?.classList.contains('text-blue-400')).toBe(true)
            expect(btnLangPl?.classList.contains('text-blue-400')).toBe(false)
        })

        it('zmienia język na PL po kliknięciu btn-lang-pl', async () => {
            await createViewModel()

            const btnLangPl = document.getElementById('btn-lang-pl')
            btnLangPl?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.setLocale).toHaveBeenCalledWith('pl')
            })
            expect(btnLangPl?.classList.contains('text-blue-400')).toBe(true)
        })

        it('zmienia język na DE po kliknięciu btn-lang-de', async () => {
            await createViewModel()

            const btnLangDe = document.getElementById('btn-lang-de')
            btnLangDe?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.setLocale).toHaveBeenCalledWith('de')
            })
            expect(btnLangDe?.classList.contains('text-blue-400')).toBe(true)
        })

        it('zamyka dropdown klawiszem Escape', async () => {
            await createViewModel()

            const btnSettings = document.getElementById('btn-settings')
            const dropdown = document.getElementById('settings-dropdown')

            btnSettings?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            expect(dropdown?.classList.contains('hidden')).toBe(false)

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            expect(dropdown?.classList.contains('hidden')).toBe(true)
        })
    })

    describe('Modal Nowego Projektu', () => {
        it('otwiera modal i resetuje formularz po kliknięciu btn-create-project', async () => {
            await createViewModel()

            const btnCreate = document.getElementById('btn-create-project')
            const modal = document.getElementById('new-project-modal')
            const inputNazwa = document.getElementById('np-nazwa') as HTMLInputElement
            const btnSubmit = document.getElementById('btn-submit-new-project') as HTMLButtonElement

            inputNazwa.value = 'Stara wartość'
            btnSubmit.disabled = false

            btnCreate?.click()

            expect(modal?.classList.contains('hidden')).toBe(false)
            expect(inputNazwa.value).toBe('')
            expect(btnSubmit.disabled).toBe(true)
        })

        it('zamyka modal po kliknięciu Anuluj, ikony zamknij lub klawisza Escape', async () => {
            await createViewModel()

            const modal = document.getElementById('new-project-modal')
            modal?.classList.remove('hidden')

            const btnCancel = document.getElementById('btn-cancel-new-project')
            btnCancel?.click()
            expect(modal?.classList.contains('hidden')).toBe(true)

            modal?.classList.remove('hidden')
            const btnCloseModal = document.getElementById('btn-close-new-project-modal')
            btnCloseModal?.click()
            expect(modal?.classList.contains('hidden')).toBe(true)

            modal?.classList.remove('hidden')
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            expect(modal?.classList.contains('hidden')).toBe(true)
        })

        it('zatwierdza modal naciśnięciem klawisza Enter w polu nazwy projektu, jeśli przycisk nie jest zablokowany', async () => {
            await createViewModel()

            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project') as HTMLButtonElement
            const inputNazwa = document.getElementById('np-nazwa') as HTMLInputElement

            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(btnSubmit.disabled).toBe(false)
            })

            const submitSpy = vi.spyOn(btnSubmit, 'click')
            inputNazwa.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

            expect(submitSpy).toHaveBeenCalled()
        })

        it('obsługuje wybór folderu (wybór poprawny vs anulowany)', async () => {
            await createViewModel()

            const btnBrowse = document.getElementById('btn-browse-folder')
            const display = document.getElementById('np-folder-display')
            const btnSubmit = document.getElementById('btn-submit-new-project') as HTMLButtonElement

            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.chooseFolder).toHaveBeenCalled()
                expect(display?.textContent).toBe('C:/Projekty/Gra1')
                expect(btnSubmit.disabled).toBe(false)
            })

            ;(window.electronAPI.chooseFolder as any).mockResolvedValueOnce({ canceled: true })
            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.chooseFolder).toHaveBeenCalledTimes(2)
            })
            expect(display?.textContent).toBe('C:/Projekty/Gra1')
        })

        it('tworzy nowy projekt z sukcesem i ładuje główne okno', async () => {
            vi.useFakeTimers()
            new StartWindowViewModel()

            await vi.runAllTimersAsync()

            const btnCreate = document.getElementById('btn-create-project')
            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project')
            const inputNazwa = document.getElementById('np-nazwa') as HTMLInputElement

            btnCreate?.click()
            inputNazwa.value = 'Mój Nowy Projekt!'

            btnBrowse?.click()
            await vi.runAllTimersAsync()

            btnSubmit?.click()
            await vi.runAllTimersAsync()

            expect(window.electronAPI.createProject).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'mj_nowy_projekt',
                    name: 'Mój Nowy Projekt!',
                    author: 'jan_user',
                    projectPath: 'C:/Projekty/Gra1',
                })
            )

            expect(window.electronAPI.loadMainWindow).toHaveBeenCalled()
            vi.useRealTimers()
        })

        it('używa "nowy_projekt" jako fallback ID gdy nazwa jest pusta', async () => {
            await createViewModel()

            const btnCreate = document.getElementById('btn-create-project')
            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project')
            const inputNazwa = document.getElementById('np-nazwa') as HTMLInputElement

            btnCreate?.click()
            inputNazwa.value = '   '
            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(btnSubmit?.hasAttribute('disabled')).toBe(false)
            })

            btnSubmit?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.createProject).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: 'nowy_projekt',
                        nazwa: '',
                    })
                )
            })
        })

        it('obsługuje błąd pobierania nazwy użytkownika systemu', async () => {
            ;(window.electronAPI.getSystemUsername as any).mockRejectedValueOnce(
                new Error('IPC Error')
            )
            await createViewModel()

            const btnCreate = document.getElementById('btn-create-project')
            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project')

            btnCreate?.click()
            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(btnSubmit?.hasAttribute('disabled')).toBe(false)
            })

            btnSubmit?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.createProject).toHaveBeenCalledWith(
                    expect.objectContaining({
                        autor: '',
                    })
                )
            })
        })

        it('wyświetla błąd Toast gdy brakuje ścieżki projektu', async () => {
            await createViewModel()

            const btnSubmit = document.getElementById('btn-submit-new-project') as HTMLButtonElement
            btnSubmit.disabled = false
            btnSubmit.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain(t('start_window.np_folder_required'))
            })
        })

        it('wyświetla błąd Toast gdy createProject zwróci error', async () => {
            ;(window.electronAPI.createProject as any).mockResolvedValueOnce({
                success: false,
                error: 'Folder już istnieje',
            })

            await createViewModel()

            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project')

            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(btnSubmit?.hasAttribute('disabled')).toBe(false)
            })

            btnSubmit?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain('Folder już istnieje')
            })
        })

        it('wyświetla błąd Toast gdy createProject rzuci wyjątek', async () => {
            ;(window.electronAPI.createProject as any).mockRejectedValueOnce(
                new Error('Brak uprawnień')
            )

            await createViewModel()

            const btnBrowse = document.getElementById('btn-browse-folder')
            const btnSubmit = document.getElementById('btn-submit-new-project')

            btnBrowse?.click()

            await vi.waitFor(() => {
                expect(btnSubmit?.hasAttribute('disabled')).toBe(false)
            })

            btnSubmit?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain('Brak uprawnień')
            })
        })
    })

    describe('Otwieranie Projektu', () => {
        it('otwiera projekt z sukcesem i przekazuje dane do ProjectManager', async () => {
            await createViewModel()

            const btnOpen = document.getElementById('btn-open-project')
            btnOpen?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.openProject).toHaveBeenCalled()
                expect(ProjectManager.getInstance().getProject()?.getName()).toBe('Testowy Projekt')
                expect(window.electronAPI.loadMainWindow).toHaveBeenCalled()
            })
        })

        it('wyświetla Toast błędu gdy openProject zwróci success = false', async () => {
            ;(window.electronAPI.openProject as any).mockResolvedValueOnce({
                success: false,
                error: 'Nieprawidłowy plik manifestu',
            })

            await createViewModel()

            const btnOpen = document.getElementById('btn-open-project')
            btnOpen?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain('Nieprawidłowy plik manifestu')
            })
        })

        it('wyświetla Toast błędu gdy ProjectManager rzuci wyjątek podczas ładowania', async () => {
            vi.spyOn(ProjectManager.getInstance(), 'load').mockImplementationOnce(() => {
                throw new Error('Błąd odczytu struktury')
            })

            await createViewModel()

            const btnOpen = document.getElementById('btn-open-project')
            btnOpen?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain(
                    t('start_window.open_project_load_error')
                )
            })
        })
    })

    describe('Lista Ostatnich Projektów', () => {
        it('wyświetla informację o braku projektów gdy lista jest pusta', async () => {
            ;(window.electronAPI.getRecentProjects as any).mockResolvedValueOnce([])

            await createViewModel()

            const recentList = document.getElementById('recent-projects-list')
            expect(recentList?.textContent).toContain(t('start_window.no_recent_projects'))
        })

        it('renderuje przyciski dla ostatnich projektów i umożliwia ich otwarcie', async () => {
            const recentProjectsMock = [
                {
                    name: 'Super Gra',
                    path: 'C:/Gry/SuperGra',
                    lastOpened: '2026-02-01T12:00:00.000Z',
                },
            ]
            ;(window.electronAPI.getRecentProjects as any).mockResolvedValueOnce(recentProjectsMock)

            await createViewModel()

            const recentList = document.getElementById('recent-projects-list')
            const projButton = recentList?.querySelector('button')
            expect(projButton).not.toBeNull()
            expect(projButton?.textContent).toContain('Super Gra')
            expect(projButton?.textContent).toContain('C:/Gry/SuperGra')

            projButton?.click()

            await vi.waitFor(() => {
                expect(window.electronAPI.openProject).toHaveBeenCalledWith('C:/Gry/SuperGra')
                expect(ProjectManager.getInstance().getProject()?.getName()).toBe('Testowy Projekt')
                expect(window.electronAPI.loadMainWindow).toHaveBeenCalled()
            })
        })

        it('wyświetla błąd Toast gdy otwarcie z listy ostatnich projektów się nie powiedzie', async () => {
            const recentProjectsMock = [
                {
                    name: 'Super Gra',
                    path: 'C:/Gry/SuperGra',
                    lastOpened: '2026-02-01T12:00:00.000Z',
                },
            ]
            ;(window.electronAPI.getRecentProjects as any).mockResolvedValueOnce(recentProjectsMock)
            ;(window.electronAPI.openProject as any).mockResolvedValueOnce({
                success: false,
                error: 'Plik nie istnieje',
            })

            await createViewModel()

            const recentList = document.getElementById('recent-projects-list')
            const projButton = recentList?.querySelector('button')
            projButton?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain('Plik nie istnieje')
            })
        })

        it('wyświetla błąd Toast gdy ProjectManager rzuci błąd przy otwieraniu z listy', async () => {
            const recentProjectsMock = [
                {
                    name: 'Błędny Projekt',
                    path: 'C:/Gry/Bledny',
                    lastOpened: '2026-02-01T12:00:00.000Z',
                },
            ]
            ;(window.electronAPI.getRecentProjects as any).mockResolvedValueOnce(recentProjectsMock)
            vi.spyOn(ProjectManager.getInstance(), 'load').mockImplementationOnce(() => {
                throw new Error('Uszkodzony plik')
            })

            await createViewModel()

            const recentList = document.getElementById('recent-projects-list')
            const projButton = recentList?.querySelector('button')
            projButton?.click()

            const toastContainer = document.getElementById('toast-container')
            await vi.waitFor(() => {
                expect(toastContainer?.textContent).toContain('Błąd podczas ładowania projektu')
            })
        })
    })

    describe('Powiadomienia Toast', () => {
        it('automatycznie usuwa powiadomienie Toast po upływie czasu', async () => {
            vi.useFakeTimers()
            new StartWindowViewModel()
            await vi.advanceTimersByTimeAsync(10)

            const btnSubmit = document.getElementById('btn-submit-new-project') as HTMLButtonElement
            btnSubmit.disabled = false
            btnSubmit.click()

            await vi.advanceTimersByTimeAsync(10)

            const container = document.getElementById('toast-container')
            expect(container?.children.length).toBe(1)

            await vi.advanceTimersByTimeAsync(3500)

            expect(container?.children.length).toBe(0)
            vi.useRealTimers()
        })
    })

    describe('Brakujące elementy DOM (Guard Tests)', () => {
        it('nie zgłasza błędów gdy w drzewie DOM brakuje niektórych elementów', async () => {
            document.body.innerHTML = '<div>Wydmuszka</div>'
            expect(() => {
                new StartWindowViewModel()
            }).not.toThrow()
        })
    })
})
