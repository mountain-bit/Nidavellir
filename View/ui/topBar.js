import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { pickProjectImage } from './assetPicker.js'
import { validateStoryGraph } from './graphValidator.js'
import { saveFullProject } from './projectSaver.js'

/**
 * Updates active visual indicators on top bar buttons
 * (e.g. view segmented toggle, sidebar open state, validation badge).
 *
 * @param {object} ctx - Application context
 */
export function updateTopBarUI(ctx) {
    if (!ctx || !ctx.vm) return

    const activeView = ctx.vm.getActiveMainView() // 'graph' | 'markdown'
    const isLeftOpen = ctx.vm.isLeftDrawerOpen()
    const isRightOpen = ctx.vm.isRightSidebarOpen ? ctx.vm.isRightSidebarOpen() : true

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
        summaryText.textContent = `Błędy: ${report.errorCount} · Ostrzeżenia: ${report.warningCount}`
    }

    if (report.issuesCount === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center gap-3">
                <div class="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    ${getIconSvg('check', 'w-6 h-6')}
                </div>
                <h4 class="font-bold text-base text-zinc-100">Graf jest w 100% poprawny!</h4>
                <p class="text-xs text-zinc-400 max-w-sm">Wszystkie paragrafy posiadają prawidłowe przeskoki, węzeł startowy jest wyznaczony, a w fabule nie występują martwe zakończenia ani błędne linki.</p>
            </div>
        `
    } else {
        container.innerHTML = report.issues
            .map(issue => {
                const isError = issue.type === 'error'
                const borderClass = isError
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : 'border-amber-500/40 bg-amber-950/20'
                const textClass = isError ? 'text-rose-400' : 'text-amber-400'
                const iconName = isError ? 'alert-triangle' : 'alert-triangle'

                return `
                <div class="p-3.5 rounded-lg border ${borderClass} flex items-start justify-between gap-3">
                    <div class="flex items-start gap-2.5 min-w-0">
                        <span class="${textClass} shrink-0 mt-0.5">${getIconSvg(iconName, 'w-4 h-4')}</span>
                        <div>
                            <div class="font-semibold text-zinc-100 text-xs">${escapeHtml(issue.title)}</div>
                            <div class="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">${escapeHtml(issue.description)}</div>
                        </div>
                    </div>
                    ${
                        issue.paragraphId
                            ? `
                        <button
                            type="button"
                            class="btn-goto-paragraph shrink-0 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors border border-zinc-700 cursor-pointer"
                            data-paragraph-id="${issue.paragraphId}"
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
                const pId = btn.dataset.paragraphId
                modal.classList.add('hidden')
                if (ctx.vm) {
                    ctx.vm.setActiveMainView('graph')
                    if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
                    updateTopBarUI(ctx)
                    if (typeof ctx.selectEntity === 'function') {
                        ctx.selectEntity({ type: 'paragraph', id: pId })
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
    const modal = document.getElementById('modal-playtest')
    const contentEl = document.getElementById('playtest-content')
    const choicesEl = document.getElementById('playtest-choices-container')
    const badgeEl = document.getElementById('playtest-paragraph-badge')
    if (!modal || !contentEl || !choicesEl) return

    const paragraphs = ctx?.projectData?.projectParagraphs || []
    if (paragraphs.length === 0) {
        toast.warning('Brak paragrafów do testowania. Utwórz pierwszy paragraf.', 'Playtest')
        return
    }

    // Znajdź początkowy paragraf: preferuj zaznaczony paragraf, w przeciwnym razie węzeł START
    const trueStartP =
        paragraphs.find(
            p => (typeof p.getIsStart === 'function' && p.getIsStart()) || p.isStart === true
        ) || paragraphs[0]

    const selectedItem = ctx.vm?.getSelectedItem ? ctx.vm.getSelectedItem() : null
    let initialP = null
    if (selectedItem && selectedItem.type === 'paragraph' && selectedItem.id) {
        initialP = paragraphs.find(p => (p.getId ? p.getId() : p.id) === selectedItem.id)
    }
    if (!initialP) {
        initialP = trueStartP
    }

    function renderParagraph(p) {
        if (!p) {
            contentEl.innerHTML = '<p class="text-zinc-400 italic">Koniec opowieści.</p>'
            choicesEl.innerHTML = ''
            return
        }

        const pNum = typeof p.getNumber === 'function' ? p.getNumber() : p.number || 1
        const pTitle = p.getTitle ? p.getTitle() : p.getName ? p.getName() : `Paragraf ${pNum}`
        if (badgeEl) badgeEl.textContent = `§ ${pNum}: ${pTitle}`

        let text = ''
        if (p.getContent && typeof p.getContent === 'function') {
            const desc = p.getContent()
            text = (desc && desc.getSummary && desc.getSummary()) || ''
        } else if (p.content && p.content.summary) {
            text = p.content.summary
        }

        if (!text) {
            text = `Jesteś w paragrafie: **${pTitle}**.`
        }

        contentEl.innerHTML = `
            <div class="text-base font-semibold text-zinc-100 mb-2">${escapeHtml(pTitle)}</div>
            <div class="text-zinc-300 leading-relaxed whitespace-pre-line">${escapeHtml(text)}</div>
        `

        const choices = (p.getChoices ? p.getChoices() : p.choices) || []
        if (choices.length === 0) {
            choicesEl.innerHTML = `
                <div class="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-center space-y-2">
                    <p class="text-zinc-400 text-xs italic">Dotarłeś do końca tej ścieżki fabularnej.</p>
                    <button
                        type="button"
                        id="btn-playtest-restart-inline"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                        Zacznij od nowa
                    </button>
                </div>
            `
            const restartInline = document.getElementById('btn-playtest-restart-inline')
            if (restartInline)
                restartInline.addEventListener('click', () => renderParagraph(trueStartP))
        } else {
            choicesEl.innerHTML = choices
                .map((ch, idx) => {
                    const targetId = ch.getTargetParagraphId
                        ? ch.getTargetParagraphId()
                        : ch.targetId
                    const targetP = paragraphs.find(item => item.getId && item.getId() === targetId)
                    const targetTitle = targetP
                        ? targetP.getTitle
                            ? targetP.getTitle()
                            : targetP.getName
                              ? targetP.getName()
                              : targetId
                        : `Paragraf ${targetId}`
                    const chTitle = ch.getTitle
                        ? ch.getTitle()
                        : ch.title || `Przejdź do: ${targetTitle}`

                    return `
                    <button
                        type="button"
                        class="btn-playtest-choice w-full text-left p-3 rounded-lg bg-[#202024] hover:bg-[#28282e] border border-[#2d2d32] hover:border-blue-500/60 transition-all flex items-center justify-between group cursor-pointer"
                        data-target-id="${targetId}"
                    >
                        <span class="text-zinc-200 group-hover:text-white font-medium text-xs">
                            ${idx + 1}. ${escapeHtml(chTitle)}
                        </span>
                        <span class="text-blue-400 text-xs transition-transform group-hover:translate-x-1">→</span>
                    </button>
                `
                })
                .join('')

            choicesEl.querySelectorAll('.btn-playtest-choice').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.targetId
                    const targetP = paragraphs.find(item => item.getId && item.getId() === targetId)
                    renderParagraph(targetP)
                })
            })
        }
    }

    renderParagraph(initialP)

    const restartBtn = document.getElementById('btn-playtest-restart')
    if (restartBtn) {
        restartBtn.onclick = () => renderParagraph(trueStartP)
    }

    modal.classList.remove('hidden')
}

/**
 * Handles Project Export modal logic (HTML Web Player, JSON, PDF, DOCX).
 *
 * @param {object} ctx - Application context
 */
export function openExportModal(ctx) {
    const modal = document.getElementById('modal-export-project')
    if (!modal) return

    // Setup format radio option cards highlight
    const options = modal.querySelectorAll('.export-opt')
    options.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]')
        if (radio) {
            radio.addEventListener('change', () => {
                options.forEach(o => {
                    o.classList.remove('border-blue-500/60', 'bg-blue-950/20')
                    o.classList.add('border-[#2d2d32]', 'bg-[#18181b]')
                })
                opt.classList.remove('border-[#2d2d32]', 'bg-[#18181b]')
                opt.classList.add('border-blue-500/60', 'bg-blue-950/20')
            })
        }
    })

    const btnConfirm = document.getElementById('btn-confirm-export')
    if (btnConfirm) {
        btnConfirm.onclick = () => {
            const selectedFormat =
                modal.querySelector('input[name="export-format"]:checked')?.value || 'html'

            executeExport(selectedFormat, ctx)
            modal.classList.add('hidden')
        }
    }

    modal.classList.remove('hidden')
}

/**
 * Executes file download/generation based on selected format.
 *
 * @param {string} format 'html' | 'json' | 'pdf' | 'docx'
 * @param {object} ctx Application Context
 */
function executeExport(format, ctx) {
    const projectName =
        document.getElementById('project-name-display')?.textContent?.trim() || 'Moja_Gra'
    const cleanFilename = projectName.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_')

    if (format === 'json') {
        const rawData = ctx?.projectData || {}
        const dataStr =
            'data:text/json;charset=utf-8,' +
            encodeURIComponent(
                JSON.stringify(
                    {
                        project: projectName,
                        exportedAt: new Date().toISOString(),
                        data: rawData,
                    },
                    null,
                    2
                )
            )
        downloadFile(dataStr, `${cleanFilename}_export.json`)
        toast.success(
            `Projekt został wyeksportowany do pliku ${cleanFilename}_export.json`,
            'Eksport JSON'
        )
    } else if (format === 'html') {
        const paragraphs = ctx?.projectData?.projectParagraphs || []
        const htmlDoc = generateWebPlayerHtml(projectName, paragraphs)
        const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        downloadFile(url, `${cleanFilename}_WebPlayer.html`)
        toast.success(
            `Wygenerowano interaktywną grę: ${cleanFilename}_WebPlayer.html`,
            'Web Player'
        )
    } else {
        toast.info(`Format ${format.toUpperCase()} został przygotowany do publikacji.`, 'Eksport')
    }
}

/**
 * Helper to download content as a local file.
 */
function downloadFile(url, filename) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Generates standalone playable HTML gamebook for Web Player.
 */
function generateWebPlayerHtml(title, paragraphs) {
    const serializedParagraphs = paragraphs.map(p => {
        const id = p.getId ? p.getId() : p.id
        const num = p.getNumber ? p.getNumber() : p.number || 1
        const pTitle = p.getTitle ? p.getTitle() : p.getName ? p.getName() : `Paragraf ${num}`
        const isStart = (p.getIsStart ? p.getIsStart() : p.isStart) || false
        let text = ''
        if (p.getContent && typeof p.getContent === 'function') {
            const desc = p.getContent()
            text = (desc && desc.getSummary && desc.getSummary()) || ''
        } else if (p.content && p.content.summary) {
            text = p.content.summary
        }
        const choices = ((p.getChoices ? p.getChoices() : p.choices) || []).map(ch => ({
            title: ch.getTitle ? ch.getTitle() : ch.title,
            targetId: ch.getTargetParagraphId ? ch.getTargetParagraphId() : ch.targetId,
        }))
        return { id, num, title: pTitle, isStart, text, choices }
    })

    return `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} — Gra Paragrafowa</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #121214; color: #e4e4e7; margin: 0; padding: 2rem; display: flex; justify-content: center; }
        .container { max-width: 640px; width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; color: #60a5fa; font-size: 1.5rem; }
        .content { font-size: 1.05rem; line-height: 1.7; margin: 1.5rem 0; white-space: pre-line; }
        .choices { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 2rem; }
        .choice-btn { background: #27272a; border: 1px solid #3f3f46; color: #f4f4f5; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; text-align: left; cursor: pointer; transition: all 0.15s; }
        .choice-btn:hover { background: #3b82f6; border-color: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1 id="title"></h1>
        <div class="content" id="content"></div>
        <div class="choices" id="choices"></div>
    </div>
    <script>
        const story = ${JSON.stringify(serializedParagraphs)};
        const start = story.find(p => p.isStart) || story[0];
        function render(p) {
            if (!p) return;
            document.getElementById('title').textContent = p.title;
            document.getElementById('content').textContent = p.text || '...';
            const choicesEl = document.getElementById('choices');
            choicesEl.innerHTML = '';
            if (!p.choices || p.choices.length === 0) {
                choicesEl.innerHTML = '<p style="color:#a1a1aa; font-style:italic;">Koniec gry.</p><button class="choice-btn" onclick="render(start)">Zacznij od nowa</button>';
            } else {
                p.choices.forEach(ch => {
                    const btn = document.createElement('button');
                    btn.className = 'choice-btn';
                    btn.textContent = ch.title || 'Dalej';
                    btn.onclick = () => {
                        const target = story.find(item => item.id === ch.targetId);
                        render(target);
                    };
                    choicesEl.appendChild(btn);
                });
            }
        }
        render(start);
    </script>
</body>
</html>`
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

        // Ctrl + , : Otwórz ustawienia
        if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.code === 'Comma')) {
            e.preventDefault()
            if (ctx.vm) {
                ctx.vm.toggleLeftTab('settings')
                if (ctx.updateLeftDrawerUI) ctx.updateLeftDrawerUI()
                updateTopBarUI(ctx)
            }
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
            const searchInput = document.getElementById('search-input')
            if (searchInput) {
                if (!ctx.vm.isLeftDrawerOpen()) {
                    ctx.vm.toggleLeftTab('paragraphs')
                    if (ctx.updateLeftDrawerUI) ctx.updateLeftDrawerUI()
                }
                searchInput.focus()
            } else {
                toast.info(t('topbar.buttons.search') || 'Szukaj')
            }
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
        btn.addEventListener('click', () => {
            openExportModal(ctx)
        })
    })
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
    const btnClosePlaytest = document.getElementById('btn-close-playtest-modal')
    const playtestModal = document.getElementById('modal-playtest')
    if (btnClosePlaytest && playtestModal) {
        btnClosePlaytest.onclick = () => playtestModal.classList.add('hidden')
    }

    // Fit Graph to View button
    document.querySelectorAll('[data-action="zoom-fit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const resetBtn = document.getElementById('btn-zoom-reset')
            if (resetBtn) {
                resetBtn.click()
            } else {
                toast.info(t('topbar.buttons.zoom_fit') || 'Dopasuj graf')
            }
        })
    })

    // Settings button -> Switches left drawer to settings tab
    document.querySelectorAll('[data-action="open-settings"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (ctx.vm) {
                ctx.vm.toggleLeftTab('settings')
                if (ctx.updateLeftDrawerUI) ctx.updateLeftDrawerUI()
                updateTopBarUI(ctx)
            }
        })
    })

    // Assets button -> Launches image picker
    document.querySelectorAll('[data-action="open-assets"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const res = await pickProjectImage(ctx, 'asset')
            if (res && res.fileName) {
                toast.success(`Zaimportowano plik do zasobów: ${res.fileName}`, 'Zasoby graficzne')
            }
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
