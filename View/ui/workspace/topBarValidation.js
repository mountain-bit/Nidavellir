import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { validateStoryGraph } from '../common/graphValidator.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { updateTopBarUI } from './topBar.js'

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
                    ctx.vm.layout.setActiveMainView('graph')
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
                        if (
                            ctx.vm?.layout?.isRightSidebarCollapsed &&
                            ctx.vm.layout.isRightSidebarCollapsed()
                        ) {
                            ctx.vm.layout.setRightSidebarCollapsed(false)
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
                        if (
                            ctx.vm?.layout?.isRightSidebarCollapsed &&
                            ctx.vm.layout.isRightSidebarCollapsed()
                        ) {
                            ctx.vm.layout.setRightSidebarCollapsed(false)
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
