import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { openAssetManager } from '../assets/assetManagerModal.js'
import { validateStoryGraph } from '../common/graphValidator.js'
import { openExportModal as openAdvancedExportModal } from '../modals/export/exportModal.js'
import { openPlaytestSimulator as openAdvancedPlaytestSimulator } from '../modals/playtest/playtestModal.js'
import { saveFullProject } from '../project/projectSaver.js'
import { openQuickSearch } from './quickSearch.js'
import { updateZoomToolbarUI } from './workspace.js'

/**
 * Updates active visual indicators on top bar buttons
 * (e.g. view segmented toggle, sidebar open state, validation badge).
 *
 * @param {object} ctx - Application context
 */
export function updateTopBarUI(ctx) {
    if (!ctx || !ctx.vm) return

    const activeView =
        typeof ctx.vm.getActiveMainView === 'function' ? ctx.vm.getActiveMainView() : 'graph'
    const isLeftOpen =
        typeof ctx.vm.isLeftDrawerOpen === 'function' ? ctx.vm.isLeftDrawerOpen() : false
    const isRightOpen =
        typeof ctx.vm.isRightSidebarOpen === 'function' ? ctx.vm.isRightSidebarOpen() : true

    // Update segmented view buttons
    const btnGraph = document.querySelector('[data-action="show-graph"]')
    const btnEditor = document.querySelector('[data-action="switch-markdown"]')

    if (btnGraph && btnEditor) {
        if (activeView === 'graph') {
            btnGraph.classList.add('active')
            btnEditor.classList.remove('active')
        } else {
            btnEditor.classList.add('active')
            btnGraph.classList.remove('active')
        }
    }

    // Update sidebar toggle button active states
    const btnToggleLeft = document.querySelector('[data-action="toggle-left-drawer"]')
    if (btnToggleLeft) {
        if (isLeftOpen) {
            btnToggleLeft.classList.add('active')
        } else {
            btnToggleLeft.classList.remove('active')
        }
    }

    const btnToggleRight = document.querySelector('[data-action="toggle-right-sidebar"]')
    if (btnToggleRight) {
        if (isRightOpen) {
            btnToggleRight.classList.add('active')
        } else {
            btnToggleRight.classList.remove('active')
        }
    }

    // Update game rules button active state
    const activeFile = typeof ctx.vm.getActiveFile === 'function' ? ctx.vm.getActiveFile() : null
    const isRulesActive =
        activeView === 'markdown' &&
        activeFile &&
        (activeFile === 'Rules/GameRules.md' ||
            activeFile === 'GameRules.md' ||
            activeFile.endsWith('GameRules.md'))
    const btnRules = document.querySelector('[data-action="open-game-rules"]')
    if (btnRules) {
        if (isRulesActive) {
            btnRules.classList.add('active')
        } else {
            btnRules.classList.remove('active')
        }
    }
}

/**
 * Handles running graph validation and rendering the validation report modal.
 *
 * @param {object} ctx - Application context
 */
export function runGraphValidation(ctx) {
    const report = validateStoryGraph(ctx)

    // Update badge on top bar
    const badge = document.getElementById('topbar-validation-badge')
    if (badge) {
        if (report.isValid && report.issuesCount === 0) {
            badge.className = 'topbar-badge topbar-badge-ok ml-0.5'
            badge.textContent = t('topbar.buttons.validation_clean') || '0 błędów'
        } else {
            badge.className = 'topbar-badge topbar-badge-warning ml-0.5'
            badge.textContent = `${report.issuesCount} uwag`
        }
    }

    // Render report inside modal
    const modal = document.getElementById('modal-validation-report')
    const container = document.getElementById('validation-issues-container')
    const summaryText = document.getElementById('validation-summary-text')

    if (!modal || !container) {
        if (report.isValid) {
            toast.success('Graf jest w pełni spójny — brak wykrytych problemów!', 'Walidacja grafu')
        } else {
            toast.warning(
                `Wykryto ${report.issuesCount} uwag w strukturze grafu.`,
                'Walidacja grafu'
            )
        }
        return report
    }

    if (summaryText) {
        const infoPart = report.infoCount ? ` · Informacje: ${report.infoCount}` : ''
        summaryText.textContent = `Błędy: ${report.errorCount} · Ostrzeżenia: ${report.warningCount}${infoPart}`
    }

    if (report.issuesCount === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center gap-3">
                <div class="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    ${getIconSvg('check', 'w-6 h-6')}
                </div>
                <h4 class="font-bold text-base text-zinc-100">Graf jest w 100% poprawny!</h4>
                <p class="text-xs text-zinc-400 max-w-sm">Wszystkie paragrafy posiadają prawidłowe przeskoki, węzeł startowy oraz zakończenia są wyznaczone, a w fabule nie występują martwe zakończenia ani błędne linki.</p>
            </div>
        `
    } else {
        container.innerHTML = report.issues
            .map(issue => {
                const isError = issue.type === 'error'
                const isInfo = issue.type === 'info'
                const borderClass = isError
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : isInfo
                      ? 'border-sky-500/40 bg-sky-950/20'
                      : 'border-amber-500/40 bg-amber-950/20'
                const textClass = isError
                    ? 'text-rose-400'
                    : isInfo
                      ? 'text-sky-400'
                      : 'text-amber-400'
                const iconName = isError ? 'alert-triangle' : isInfo ? 'info' : 'alert-triangle'

                const paragraphsList =
                    ctx.projectData?.projectParagraphs || ctx.projectParagraphs || []

                const cycleTrace =
                    issue.cycleIds && issue.cycleIds.length > 0
                        ? `
                        <div class="flex items-center flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-zinc-800/80">
                            <span class="text-[10px] text-zinc-500 mr-1 font-medium">Ścieżka pętli:</span>
                            ${issue.cycleIds
                                .map((cId, idx) => {
                                    const node = paragraphsList.find(
                                        p =>
                                            (typeof p.getId === 'function' ? p.getId() : p.id) ===
                                            cId
                                    )
                                    const title = node
                                        ? (typeof node.getTitle === 'function'
                                              ? node.getTitle()
                                              : node.title) || cId
                                        : cId
                                    return `
                                <button type="button" class="btn-goto-paragraph text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors border border-zinc-700 cursor-pointer" data-paragraph-id="${cId}" title="Pokaż ${escapeHtml(title)} na grafie">
                                    ${escapeHtml(title)}
                                </button>
                                ${idx < issue.cycleIds.length - 1 ? '<span class="text-zinc-600 text-[10px]">→</span>' : ''}
                            `
                                })
                                .join('')}
                        </div>
                    `
                        : ''

                const targetEntityId = issue.paragraphId || issue.sceneId || ''

                return `
                <div class="p-3.5 rounded-lg border ${borderClass} flex items-start justify-between gap-3">
                    <div class="flex items-start gap-2.5 min-w-0 flex-1">
                        <span class="${textClass} shrink-0 mt-0.5">${getIconSvg(iconName, 'w-4 h-4')}</span>
                        <div class="min-w-0 flex-1">
                            <div class="font-semibold text-zinc-100 text-xs">${escapeHtml(issue.title)}</div>
                            <div class="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">${escapeHtml(issue.description)}</div>
                            ${cycleTrace}
                        </div>
                    </div>
                    ${
                        targetEntityId
                            ? `
                        <button
                            type="button"
                            class="btn-goto-paragraph shrink-0 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors border border-zinc-700 cursor-pointer"
                            data-paragraph-id="${issue.paragraphId || ''}"
                            data-scene-id="${issue.sceneId || ''}"
                            title="Przejdź do źródła błędu"
                        >
                            Pokaż
                        </button>
                    `
                            : ''
                    }
                </div>
            `
            })
            .join('')

        container.querySelectorAll('.btn-goto-paragraph').forEach(btn => {
            btn.addEventListener('click', () => {
                const pId = btn.dataset.paragraphId || ''
                const sId = btn.dataset.sceneId || ''
                modal.classList.add('hidden')

                if (ctx.vm) {
                    ctx.vm.setActiveMainView('graph')
                    if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
                    updateTopBarUI(ctx)

                    const paragraphs =
                        ctx.projectData?.projectParagraphs ||
                        ctx.projectParagraphs ||
                        (typeof ctx.getParagraphs === 'function' ? ctx.getParagraphs() : []) ||
                        []
                    const scenes =
                        ctx.projectData?.projectScenes ||
                        ctx.projectScenes ||
                        (typeof ctx.getScenes === 'function' ? ctx.getScenes() : []) ||
                        []

                    if (pId) {
                        const targetParagraph = paragraphs.find(
                            p => (typeof p.getId === 'function' ? p.getId() : p.id) === pId
                        )
                        const parentScene = scenes.find(s => {
                            const sParagraphs =
                                typeof s.getParagraphs === 'function'
                                    ? s.getParagraphs()
                                    : s.paragraphs || []
                            return sParagraphs.some(
                                p => (typeof p.getId === 'function' ? p.getId() : p.id) === pId
                            )
                        })

                        // Upewnij się, że prawy panel właściwości jest rozwinięty
                        if (ctx.vm.isRightSidebarCollapsed && ctx.vm.isRightSidebarCollapsed()) {
                            ctx.vm.setRightSidebarCollapsed(false)
                        }

                        if (targetParagraph && typeof ctx.selectEntity === 'function') {
                            ctx.selectEntity(targetParagraph, 'paragraph', parentScene)
                        } else if (typeof ctx.selectEntity === 'function') {
                            ctx.selectEntity(
                                {
                                    getId: () => pId,
                                    getTitle: () => pId,
                                    getName: () => pId,
                                    id: pId,
                                },
                                'paragraph',
                                parentScene
                            )
                        }

                        // Wycentruj i zaznacz węzeł na kanwie grafu
                        const graph =
                            ctx.storyGraphInstance ||
                            (typeof window !== 'undefined' ? window.storyGraphInstance : null)
                        if (graph && typeof graph.focusOnElement === 'function') {
                            graph.focusOnElement(pId, true)
                        }
                    } else if (sId) {
                        const targetScene = scenes.find(
                            s => (typeof s.getId === 'function' ? s.getId() : s.id) === sId
                        )
                        if (ctx.vm.isRightSidebarCollapsed && ctx.vm.isRightSidebarCollapsed()) {
                            ctx.vm.setRightSidebarCollapsed(false)
                        }
                        if (targetScene && typeof ctx.selectEntity === 'function') {
                            ctx.selectEntity(targetScene, 'scene')
                        }
                        const graph =
                            ctx.storyGraphInstance ||
                            (typeof window !== 'undefined' ? window.storyGraphInstance : null)
                        if (graph && typeof graph.focusOnElement === 'function') {
                            graph.focusOnElement(sId, true)
                        }
                    }
                }
            })
        })
    }

    modal.classList.remove('hidden')
    return report
}

/**
 * Handles running Playtest simulator for gamebook narrative.
 *
 * @param {object} ctx - Application context
 */
export function openPlaytestSimulator(ctx) {
    openAdvancedPlaytestSimulator(ctx)
}

/**
 * Handles Project Export modal logic (delegates to exportModal module).
 *
 * @param {object} ctx - Application context
 */
export function openExportModal(ctx) {
    openAdvancedExportModal(ctx)
}

/**
 * Handles opening or creating the Game Rules markdown file (Rules/GameRules.md).
 *
 * @param {object} ctx - Application context
 */
export async function openGameRules(ctx) {
    if (!ctx || !ctx.vm) return

    const rulesPath = 'Rules/GameRules.md'
    const fallbackPath = 'GameRules.md'

    if (!ctx.files) {
        ctx.files = {}
    }

    // 1. Check if already loaded in memory
    let content = ctx.files[rulesPath] || ctx.files[fallbackPath]

    // 2. If not in memory, try reading from disk via Electron API
    if (typeof content !== 'string') {
        const projectPath =
            ctx.projectPath ||
            (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
            (typeof window !== 'undefined' &&
            window.electronAPI &&
            typeof window.electronAPI.getCurrentProject === 'function'
                ? await window.electronAPI.getCurrentProject()
                : '')

        if (
            projectPath &&
            typeof window !== 'undefined' &&
            window.electronAPI &&
            typeof window.electronAPI.readMarkdownFile === 'function'
        ) {
            try {
                let res = await window.electronAPI.readMarkdownFile(projectPath, rulesPath)
                if (
                    res &&
                    res.success &&
                    typeof res.content === 'string' &&
                    res.content.length > 0
                ) {
                    content = res.content
                } else {
                    res = await window.electronAPI.readMarkdownFile(projectPath, fallbackPath)
                    if (
                        res &&
                        res.success &&
                        typeof res.content === 'string' &&
                        res.content.length > 0
                    ) {
                        content = res.content
                    }
                }
            } catch (err) {
                console.warn('[TopBar] Error reading game rules from disk:', err)
            }
        }
    }

    // 3. If still empty, initialize with default starter template
    if (typeof content !== 'string' || content.trim().length === 0) {
        const defaultTemplate =
            typeof t === 'function' && t('rules.template') !== 'rules.template'
                ? t('rules.template')
                : '# Zasady Gry\n\n## Wprowadzenie\nWitaj w grze paragrafowej!\n'
        content = defaultTemplate
    }

    ctx.files[rulesPath] = content
    ctx.files[fallbackPath] = content

    const displayName =
        (typeof t === 'function' ? t('topbar.buttons.game_rules') : '') || 'Zasady gry'

    if (typeof ctx.vm.setFileDisplayName === 'function') {
        ctx.vm.setFileDisplayName(rulesPath, displayName)
        ctx.vm.setFileDisplayName(fallbackPath, displayName)
    }

    if (typeof ctx.vm.setActiveFile === 'function') {
        ctx.vm.setActiveFile(rulesPath)
    }

    if (typeof ctx.vm.setActiveMainView === 'function') {
        ctx.vm.setActiveMainView('markdown')
    }

    if (typeof ctx.updateMainWorkspaceUI === 'function') {
        ctx.updateMainWorkspaceUI(ctx)
    }

    updateTopBarUI(ctx)

    const openedToast =
        (typeof t === 'function' ? t('rules.opened_toast') : '') || 'Otwarto plik zasad gry'
    toast.info(openedToast, displayName)
}

/**
 * Escapes HTML characters for safe rendering.
 */
function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
/**
 * Registers global keyboard shortcuts for the entire top bar ecosystem.
 *
 * @param {object} ctx Application context
 */
function registerGlobalShortcuts(ctx) {
    window.addEventListener('keydown', e => {
        const target = e.target
        const isInput =
            target &&
            (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable)

        // Ctrl + S: Zapisz projekt
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault()
            saveFullProject(ctx)
            return
        }

        // F5: Playtest (nie odświeżaj Electrona)
        if (e.key === 'F5') {
            e.preventDefault()
            openPlaytestSimulator(ctx)
            return
        }

        // F3: Zasady gry
        if (e.key === 'F3') {
            e.preventDefault()
            openGameRules(ctx)
            return
        }

        // F7: Walidacja grafu
        if (e.key === 'F7') {
            e.preventDefault()
            runGraphValidation(ctx)
            return
        }

        // F1: Pomoc i skróty
        if (e.key === 'F1') {
            e.preventDefault()
            const modal = document.getElementById('modal-help-shortcuts')
            if (modal) modal.classList.toggle('hidden')
            return
        }

        // Ctrl + P / Ctrl + K: Szybkie wyszukiwanie (Quick Search)
        if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === 'p' || e.key === 'P' || e.key === 'k' || e.key === 'K')
        ) {
            e.preventDefault()
            openQuickSearch(ctx)
            return
        }

        if (isInput) return

        // Ctrl + O: Otwórz projekt
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'o' || e.key === 'O')) {
            e.preventDefault()
            const openBtn = document.querySelector('[data-action="open-project"]')
            if (openBtn) openBtn.click()
            return
        }

        // Ctrl + E: Eksportuj projekt
        if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
            e.preventDefault()
            openExportModal(ctx)
            return
        }

        // Ctrl + , : Otwórz ustawienia (Opcje w panelu bocznym)
        if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.code === 'Comma')) {
            e.preventDefault()
            openSettingsView(ctx)
            return
        }

        // Ctrl + Shift + I : Menadżer zasobów
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
            e.preventDefault()
            const assetBtn = document.querySelector('[data-action="open-assets"]')
            if (assetBtn) assetBtn.click()
            return
        }

        // Ctrl + 0 : Dopasuj widok grafu (Fit to view)
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault()
            const zoomFitBtn = document.querySelector('[data-action="zoom-fit"]')
            if (zoomFitBtn) zoomFitBtn.click()
            return
        }

        // Ctrl + 1: Graf historii
        if ((e.ctrlKey || e.metaKey) && e.key === '1') {
            e.preventDefault()
            ctx.vm.setActiveMainView('graph')
            if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
            updateTopBarUI(ctx)
            return
        }

        // Ctrl + 2: Edytor tekstu
        if ((e.ctrlKey || e.metaKey) && e.key === '2') {
            e.preventDefault()
            ctx.vm.setActiveMainView('markdown')
            if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
            updateTopBarUI(ctx)
            return
        }

        // Ctrl + B: Panel lewy
        if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault()
            if (ctx.vm.isLeftDrawerOpen()) {
                ctx.vm.closeLeftDrawer()
            } else {
                ctx.vm.toggleLeftTab(ctx.vm.getActiveLeftTab() || 'paragraphs')
            }
            if (ctx.updateLeftDrawerUI) ctx.updateLeftDrawerUI()
            updateTopBarUI(ctx)
            return
        }

        // Ctrl + Alt + B: Panel prawy
        if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault()
            ctx.vm.toggleRightSidebar()
            const rightSidebar = document.getElementById('right-sidebar')
            const toggleBtn = document.getElementById('toggle-right-sidebar-btn')
            const reopenBtn = document.getElementById('reopen-right-sidebar-btn')
            if (ctx.updateRightSidebarUI) {
                ctx.updateRightSidebarUI(ctx.vm, rightSidebar, toggleBtn, reopenBtn)
            }
            updateTopBarUI(ctx)
            return
        }
    })
}

/**
 * Centers the story graph in the workspace and ensures the graph view is active.
 *
 * @param {object} ctx - Application context
 */
export function centerGraphView(ctx) {
    if (!ctx) return

    // 1. Switch to graph view if not active
    if (typeof ctx.showGraph === 'function') {
        ctx.showGraph(true)
    } else if (ctx.vm && typeof ctx.vm.setActiveMainView === 'function') {
        ctx.vm.setActiveMainView('graph')
    }
    if (typeof ctx.updateMainWorkspaceUI === 'function') {
        ctx.updateMainWorkspaceUI(ctx)
    }
    if (typeof updateTopBarUI === 'function') {
        updateTopBarUI(ctx)
    }

    // 2. Center the graph on all elements
    if (typeof ctx.centerGraph === 'function') {
        ctx.centerGraph(true)
    } else {
        const graphInstance =
            ctx.storyGraphInstance ||
            (typeof window !== 'undefined' ? window.storyGraphInstance : null)

        if (graphInstance && typeof graphInstance.center === 'function') {
            graphInstance.center(true)
            if (typeof ctx.updateZoomToolbarUI === 'function') {
                ctx.updateZoomToolbarUI(graphInstance)
            } else if (typeof updateZoomToolbarUI === 'function') {
                updateZoomToolbarUI(graphInstance)
            }
        } else if (graphInstance && typeof graphInstance.fit === 'function') {
            graphInstance.fit(40)
            if (typeof ctx.updateZoomToolbarUI === 'function') {
                ctx.updateZoomToolbarUI(graphInstance)
            } else if (typeof updateZoomToolbarUI === 'function') {
                updateZoomToolbarUI(graphInstance)
            }
        } else {
            const fitBtn = document.getElementById('btn-graph-zoom-fit')
            if (fitBtn) {
                fitBtn.click()
            }
        }
    }

    // Support legacy test mock if #btn-zoom-reset exists
    const legacyResetBtn = document.getElementById('btn-zoom-reset')
    if (legacyResetBtn) {
        legacyResetBtn.click()
    }
}

/**
 * Opens the options/settings tab in the left side panel drawer.
 *
 * @param {object} ctx - Application context
 */
export function openSettingsView(ctx) {
    if (!ctx) return

    if (typeof ctx.openSettings === 'function') {
        ctx.openSettings()
        return
    }

    if (ctx.vm) {
        if (typeof ctx.vm.setActiveLeftTab === 'function') {
            ctx.vm.setActiveLeftTab('settings')
        } else if (typeof ctx.vm.toggleLeftTab === 'function') {
            if (
                typeof ctx.vm.getActiveLeftTab === 'function' &&
                ctx.vm.getActiveLeftTab() !== 'settings'
            ) {
                ctx.vm.toggleLeftTab('settings')
            } else if (
                typeof ctx.vm.isLeftDrawerOpen === 'function' &&
                !ctx.vm.isLeftDrawerOpen()
            ) {
                ctx.vm.toggleLeftTab('settings')
            }
        }
    }

    if (typeof ctx.updateLeftDrawerUI === 'function') {
        ctx.updateLeftDrawerUI()
    } else {
        const settingsTabBtn = document.querySelector('[data-left-tab="settings"]')
        if (settingsTabBtn && typeof settingsTabBtn.click === 'function') {
            settingsTabBtn.click()
        }
    }

    if (typeof updateTopBarUI === 'function') {
        updateTopBarUI(ctx)
    }
}

/**
 * Initializes click handlers, modals and keyboard shortcuts for Top Bar buttons.
 *
 * @param {object} ctx - Application context
 */
export function initTopBar(ctx) {
    if (!ctx) return

    // Undo button
    document.querySelectorAll('[data-action="undo"]').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                if (typeof document.execCommand === 'function') {
                    document.execCommand('undo')
                }
            } catch {
                // fallback
            }
        })
    })

    // Redo button
    document.querySelectorAll('[data-action="redo"]').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                if (typeof document.execCommand === 'function') {
                    document.execCommand('redo')
                }
            } catch {
                // fallback
            }
        })
    })

    // Quick search button
    document.querySelectorAll('[data-action="quick-search"]').forEach(btn => {
        btn.addEventListener('click', () => {
            openQuickSearch(ctx)
        })
    })

    // Graph Validation button
    document.querySelectorAll('[data-action="validate-graph"]').forEach(btn => {
        btn.addEventListener('click', () => {
            runGraphValidation(ctx)
        })
    })

    // Validation modal close buttons
    const btnCloseVal = document.getElementById('btn-close-validation-modal')
    const btnOkVal = document.getElementById('btn-validation-ok')
    const valModal = document.getElementById('modal-validation-report')
    if (btnCloseVal && valModal) btnCloseVal.onclick = () => valModal.classList.add('hidden')
    if (btnOkVal && valModal) btnOkVal.onclick = () => valModal.classList.add('hidden')

    // Export button & modal
    document.querySelectorAll('[data-action="export-game"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            openExportModal(ctx)
        })
    })

    document.addEventListener('click', e => {
        const btn =
            e.target && e.target.closest ? e.target.closest('[data-action="export-game"]') : null
        if (btn) {
            e.preventDefault()
            openExportModal(ctx)
        }
    })

    window.openExportModal = () => openExportModal(ctx)

    const btnCloseExport = document.getElementById('btn-close-export-modal')
    const btnCancelExport = document.getElementById('btn-cancel-export')
    const exportModal = document.getElementById('modal-export-project')
    if (btnCloseExport && exportModal)
        btnCloseExport.onclick = () => exportModal.classList.add('hidden')
    if (btnCancelExport && exportModal)
        btnCancelExport.onclick = () => exportModal.classList.add('hidden')

    // Playtest button
    document.querySelectorAll('[data-action="run-game"]').forEach(btn => {
        btn.addEventListener('click', () => {
            openPlaytestSimulator(ctx)
        })
    })

    // Game rules button
    document.querySelectorAll('[data-action="open-game-rules"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            openGameRules(ctx)
        })
    })
    const btnClosePlaytest = document.getElementById('btn-close-playtest-modal')
    const playtestModal = document.getElementById('modal-playtest')
    if (btnClosePlaytest && playtestModal) {
        btnClosePlaytest.onclick = () => playtestModal.classList.add('hidden')
    }

    // Fit / Center Graph to View button ("Dopasuj widok grafu" -> wyśrodkowanie grafu)
    document.querySelectorAll('[data-action="zoom-fit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            centerGraphView(ctx)
        })
    })

    // Settings / Options button -> Opens options in the side panel
    document.querySelectorAll('[data-action="open-settings"]').forEach(btn => {
        btn.addEventListener('click', () => {
            openSettingsView(ctx)
        })
    })

    // Assets button -> Launches Asset Manager
    document.querySelectorAll('[data-action="open-assets"]').forEach(btn => {
        btn.addEventListener('click', () => {
            openAssetManager(ctx)
        })
    })

    // Help button & modal
    document.querySelectorAll('[data-action="open-help"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('modal-help-shortcuts')
            if (modal) modal.classList.remove('hidden')
        })
    })
    const btnCloseHelp = document.getElementById('btn-close-help-modal')
    const btnOkHelp = document.getElementById('btn-help-ok')
    const helpModal = document.getElementById('modal-help-shortcuts')
    if (btnCloseHelp && helpModal) btnCloseHelp.onclick = () => helpModal.classList.add('hidden')
    if (btnOkHelp && helpModal) btnOkHelp.onclick = () => helpModal.classList.add('hidden')

    // Register global shortcuts
    registerGlobalShortcuts(ctx)

    // Initial update of states
    updateTopBarUI(ctx)
}
