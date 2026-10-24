import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml, getTypeBadgeColor } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Renders choice header: Type & ID, editable choice name, and source/target nodes.
 *
 * @param {object} choice
 * @param {object} item
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 * @returns {{ headerMod: HTMLElement, nameMod: HTMLElement, nodesMod: HTMLElement, getNameInput: () => HTMLInputElement }}
 */
export function createChoiceHeader(choice, item, ctx, onRefreshDetails) {
    const fromId = choice.getFromParagraphId()
    const toId = choice.getToParagraphId()
    const fromP = ctx.projectParagraphs.find(p => p.getId() === fromId)
    const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
    const fromTitle = fromP ? fromP.getTitle() || fromP.getId() : fromId || '?'
    const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'

    const isCombat = Boolean(
        (typeof choice.getIsCombatOutcome === 'function' && choice.getIsCombatOutcome()) ||
        choice.isCombatOutcome
    )

    // 1. Typ & ID
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <div class="flex items-center gap-1.5">
                ${
                    isCombat
                        ? `<span class="px-2 py-0.5 text-[11px] rounded border border-rose-800/60 bg-rose-950/60 text-rose-300 font-medium inline-flex items-center gap-1">${getIconSvg('swords', 'w-3 h-3')} ${t('details.choice_combat_badge') || 'Przeskok (Po walce)'}</span>`
                        : `<span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor('choice')} font-medium">${t('details.type_choice')}</span>`
                }
            </div>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    )

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
        if (isCombat && fromP && fromP.getHasCombat && fromP.getHasCombat()) {
            const combat = fromP.getCombat ? fromP.getCombat() : null
            if (combat && typeof combat.updateOutcome === 'function') {
                combat.updateOutcome(choice.getId(), { name: val })
            }
        }
        ctx.vm.updateChoiceDetails(
            choice,
            val,
            choice.getCondition(),
            choice.getCosts(),
            choice.getRewards(),
            choice.getDiceCheck()
        )
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
                <div class="text-xs text-emerald-400 font-medium truncate mt-1 w-full flex items-center gap-1" title="${escapeHtml(fromTitle)}">
                    <span class="shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3 h-3 text-emerald-400')}</span>
                    <span class="truncate">${escapeHtml(fromTitle)}</span>
                </div>
            </button>
            <button type="button" id="btn-node-target" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-blue-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${toP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.target_node')}</span>
                    <span class="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-blue-400 font-medium truncate mt-1 w-full flex items-center gap-1" title="${escapeHtml(toTitle)}">
                    <span class="shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3 h-3 text-blue-400')}</span>
                    <span class="truncate">${escapeHtml(toTitle)}</span>
                </div>
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

    return {
        headerMod,
        nameMod,
        nodesMod,
        getNameInput: () => nameInput,
    }
}
