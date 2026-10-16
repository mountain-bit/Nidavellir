import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { TextCondition } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeBadgeColor } from '../common/htmlTemplates.js'
import { createSection } from './common/domHelpers.js'
import { renderHistoryBar } from './historyBar.js'

/**
 * Renders details and editing controls for a selected Choice (connection).
 *
 * @param {HTMLElement} container
 * @param {object} choice
 * @param {object} item
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderChoiceDetails(container, choice, item, ctx, onRefreshDetails) {
    const fromId = choice.getFromParagraphId()
    const toId = choice.getToParagraphId()
    const fromP = ctx.projectParagraphs.find(p => p.getId() === fromId)
    const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
    const fromTitle = fromP ? fromP.getTitle() || fromP.getId() : fromId || '?'
    const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
    const cond = choice.getCondition()
    const condText = cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    // 1. Typ & ID
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor('choice')} font-medium">${t('details.type_choice')}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    )
    container.appendChild(headerMod)

    // 2. Nazwa / Etykieta przeskoku
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.choice_name')}</label>
        <input id="details-choice-name-input" type="text" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-choice-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    )
    const nameInput = nameMod.querySelector('#details-choice-name-input')
    const nameError = nameMod.querySelector('#details-choice-name-error')

    const saveChoiceName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }
        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        const currentCondEl = container.querySelector('#details-condition-text')
        const currentCondText = currentCondEl ? currentCondEl.value : condText
        ctx.vm.updateChoiceDetails(choice, val, currentCondText)
        renderHistoryBar(ctx, onRefreshDetails)
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        return true
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })
    nameInput.addEventListener('blur', saveChoiceName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (saveChoiceName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)

    // 3. Węzły źródłowy i docelowy
    const nodesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.nodes_section')}</div>
        <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-node-source" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-emerald-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${fromP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.source_node')}</span>
                    <span class="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-emerald-400 font-medium truncate mt-1 w-full" title="${escapeHtml(fromTitle)}">§ ${escapeHtml(fromTitle)}</div>
            </button>
            <button type="button" id="btn-node-target" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-blue-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${toP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.target_node')}</span>
                    <span class="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-blue-400 font-medium truncate mt-1 w-full" title="${escapeHtml(toTitle)}">§ ${escapeHtml(toTitle)}</div>
            </button>
        </div>
    `
    )

    const sourceBtn = nodesMod.querySelector('#btn-node-source')
    const targetBtn = nodesMod.querySelector('#btn-node-target')
    if (sourceBtn) {
        sourceBtn.addEventListener('click', () => {
            if (fromP) ctx.selectEntity(fromP, 'paragraph')
        })
    }
    if (targetBtn) {
        targetBtn.addEventListener('click', () => {
            if (toP) ctx.selectEntity(toP, 'paragraph')
        })
    }
    container.appendChild(nodesMod)

    // 4. Warunek Polimorficzny
    const condMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.condition_title')}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-amber-700/40 font-medium">${t('condition.type_text')}</span>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.condition_help')}</p>
        <textarea id="details-condition-text" rows="3" placeholder="${t('details.condition_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(condText)}</textarea>
    `
    )
    const condInput = condMod.querySelector('#details-condition-text')
    condInput.addEventListener('input', () => {
        ctx.vm.updateChoiceDetails(choice, choice.getName(), condInput.value)
        ctx.renderConnectionsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
    })
    container.appendChild(condMod)

    // 5. Szybkie akcje / Usuń
    const actionsMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        <button id="btn-details-delete-choice" class="w-full py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs text-left text-red-300 flex items-center justify-between cursor-pointer" type="button">
            <span>${t('details.delete_connection')}</span>
            <span class="text-red-400 shrink-0">${getIconSvg('close', 'w-3.5 h-3.5')}</span>
        </button>
    `
    )
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = choice.getFromParagraphId() || choice.getId()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
    })
    actionsMod.querySelector('#btn-details-delete-choice').addEventListener('click', () => {
        if (confirm(t('context_menu.confirm_delete', { name: choice.getName() }))) {
            ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
            ctx.renderConnectionsList()
            ctx.renderParagraphsList()
            renderHistoryBar(ctx, onRefreshDetails)
            refreshDetails()
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            toast.success(t('toast.connection_deleted'))
        }
    })
    container.appendChild(actionsMod)
}
