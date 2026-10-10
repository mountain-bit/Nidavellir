// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTopBar, updateTopBarUI } from '../../View/ui/topBar.js'

describe('TopBar UI Controller (View/ui/topBar.js)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <header id="main-topbar">
                <button data-action="save">Zapisz</button>
                <button data-action="open-project">Otwórz</button>
                <button data-action="close-project">Zamknij</button>
                <button data-action="undo">Cofnij</button>
                <button data-action="redo">Ponów</button>
                <button data-action="quick-search">Szukaj</button>
                <button data-action="show-graph" class="topbar-segmented-btn active">Graf</button>
                <button data-action="switch-markdown" class="topbar-segmented-btn">Edytor</button>
                <button data-action="validate-graph">Waliduj</button>
                <button data-action="zoom-fit">Dopasuj</button>
                <button data-action="run-game">Testuj</button>
                <button data-action="toggle-left-drawer" class="active">Panel L</button>
                <button data-action="toggle-right-sidebar" class="active">Panel P</button>
                <button data-action="export-game">Eksport</button>
                <button data-action="open-assets">Zasoby</button>
                <button data-action="open-settings">Ustawienia</button>
                <button data-action="open-help">Pomoc</button>
            </header>
            <input id="search-input" type="text" />
            <button id="btn-zoom-reset"></button>
        `
    })

    it('updates view segmented buttons based on active main view', () => {
        const mockCtx = {
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('markdown'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
            },
        }

        updateTopBarUI(mockCtx)

        const btnGraph = document.querySelector('[data-action="show-graph"]')
        const btnEditor = document.querySelector('[data-action="switch-markdown"]')

        expect(btnEditor?.classList.contains('active')).toBe(true)
        expect(btnGraph?.classList.contains('active')).toBe(false)
    })

    it('updates sidebar buttons active classes based on drawer and sidebar state', () => {
        const mockCtx = {
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('graph'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(false),
            },
        }

        updateTopBarUI(mockCtx)

        const btnLeft = document.querySelector('[data-action="toggle-left-drawer"]')
        const btnRight = document.querySelector('[data-action="toggle-right-sidebar"]')

        expect(btnLeft?.classList.contains('active')).toBe(false)
        expect(btnRight?.classList.contains('active')).toBe(false)
    })

    it('registers event listeners on top bar buttons', () => {
        const mockCtx = {
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('graph'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
                toggleLeftTab: vi.fn(),
            },
            updateLeftDrawerUI: vi.fn(),
        }

        initTopBar(mockCtx)

        const searchBtn = document.querySelector(
            '[data-action="quick-search"]'
        ) as HTMLButtonElement
        const searchInput = document.getElementById('search-input') as HTMLInputElement
        const focusSpy = vi.spyOn(searchInput, 'focus')

        searchBtn?.click()
        expect(mockCtx.vm.toggleLeftTab).toHaveBeenCalledWith('paragraphs')
        expect(focusSpy).toHaveBeenCalled()

        const zoomFitBtn = document.querySelector('[data-action="zoom-fit"]') as HTMLButtonElement
        const zoomResetBtn = document.getElementById('btn-zoom-reset') as HTMLButtonElement
        const clickSpy = vi.spyOn(zoomResetBtn, 'click')

        zoomFitBtn?.click()
        expect(clickSpy).toHaveBeenCalled()
    })

    it('triggers undo and redo commands when undo/redo buttons are clicked', () => {
        if (!document.execCommand) {
            document.execCommand = vi.fn()
        }
        const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true)
        const mockCtx = {
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('graph'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
            },
        }

        initTopBar(mockCtx)

        const undoBtn = document.querySelector('[data-action="undo"]') as HTMLButtonElement
        const redoBtn = document.querySelector('[data-action="redo"]') as HTMLButtonElement

        undoBtn?.click()
        expect(execSpy).toHaveBeenCalledWith('undo')

        redoBtn?.click()
        expect(execSpy).toHaveBeenCalledWith('redo')

        execSpy.mockRestore()
    })

    it('handles graph validation and updates badge and report modal', async () => {
        const { runGraphValidation } = await import('../../View/ui/topBar.js')

        document.body.innerHTML += `
            <span id="topbar-validation-badge"></span>
            <div id="modal-validation-report" class="hidden">
                <div id="validation-summary-text"></div>
                <div id="validation-issues-container"></div>
            </div>
        `

        const mockParagraph = {
            getId: () => 'p1',
            getTitle: () => 'Start',
            getIsStart: () => true,
            getChoices: () => [],
        }

        const mockCtx = {
            projectData: {
                projectParagraphs: [mockParagraph],
            },
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('graph'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
            },
        }

        const report = runGraphValidation(mockCtx)
        expect(report).toBeDefined()

        const badge = document.getElementById('topbar-validation-badge')
        expect(badge?.textContent).toContain('uwag')

        const modal = document.getElementById('modal-validation-report')
        expect(modal?.classList.contains('hidden')).toBe(false)
    })

    it('handles interactive playtest simulator modal and step choices', async () => {
        const { openPlaytestSimulator } = await import('../../View/ui/topBar.js')

        document.body.innerHTML += `
            <div id="modal-playtest" class="hidden">
                <span id="playtest-paragraph-badge"></span>
                <button id="btn-playtest-restart"></button>
                <div id="playtest-content"></div>
                <div id="playtest-choices-container"></div>
            </div>
        `

        const p2 = {
            getId: () => 'p2',
            getNumber: () => 2,
            getTitle: () => 'Mroczny Las',
            getIsStart: () => false,
            getContent: () => ({ getSummary: () => 'Dotarłeś do mrocznego lasu.' }),
            getChoices: () => [],
        }

        const p1 = {
            getId: () => 'p1',
            getNumber: () => 1,
            getTitle: () => 'Rozstaje Dróg',
            getIsStart: () => true,
            getContent: () => ({ getSummary: () => 'Stoisz na rozstajach.' }),
            getChoices: () => [
                {
                    getTitle: () => 'Idź do lasu',
                    getTargetParagraphId: () => 'p2',
                },
            ],
        }

        const mockCtx = {
            projectData: {
                projectParagraphs: [p1, p2],
            },
            vm: {
                getSelectedItem: vi.fn().mockReturnValue(null),
                getActiveMainView: vi.fn().mockReturnValue('graph'),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
            },
        }

        openPlaytestSimulator(mockCtx)

        const modal = document.getElementById('modal-playtest')
        const content = document.getElementById('playtest-content')
        const badge = document.getElementById('playtest-paragraph-badge')
        const choices = document.getElementById('playtest-choices-container')

        expect(modal?.classList.contains('hidden')).toBe(false)
        expect(badge?.textContent).toContain('§ 1: Rozstaje Dróg')
        expect(content?.textContent).toContain('Stoisz na rozstajach.')

        const choiceBtn = choices?.querySelector('.btn-playtest-choice') as HTMLButtonElement
        expect(choiceBtn).toBeDefined()
        choiceBtn?.click()

        expect(badge?.textContent).toContain('§ 2: Mroczny Las')
        expect(content?.textContent).toContain('Dotarłeś do mrocznego lasu.')
    })

    it('centers the graph and switches to graph view when "zoom-fit" (Dopasuj widok grafu) is clicked', async () => {
        const { centerGraphView } = await import('../../View/ui/topBar.js')

        const centerSpy = vi.fn()
        const showGraphSpy = vi.fn()
        const updateMainWorkspaceSpy = vi.fn()
        const updateZoomSpy = vi.fn()

        const mockCtx = {
            storyGraphInstance: {
                center: centerSpy,
                getZoom: vi.fn().mockReturnValue(1),
            },
            showGraph: showGraphSpy,
            updateMainWorkspaceUI: updateMainWorkspaceSpy,
            updateZoomToolbarUI: updateZoomSpy,
            vm: {
                getActiveMainView: vi.fn().mockReturnValue('markdown'),
                setActiveMainView: vi.fn(),
                isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                isRightSidebarOpen: vi.fn().mockReturnValue(true),
            },
        }

        centerGraphView(mockCtx)

        expect(showGraphSpy).toHaveBeenCalledWith(true)
        expect(centerSpy).toHaveBeenCalledWith(true)
        expect(updateZoomSpy).toHaveBeenCalledWith(mockCtx.storyGraphInstance)
    })
})
