/**
 * @fileoverview Header, name editor, and endpoint selector components for Choice entities.
 * Manages the choice breadcrumb title, live inline renaming with graph edge syncing,
 * and source-to-target paragraph dropdown selectors and badges.
 *
 * @module choiceHeader
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml, getTypeBadgeColor } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Resolves source/target paragraphs and combat flag from choice and context.
 *
 * @param {object} [choice]
 * @param {object} [ctx]
 * @returns {{
 *   fromId: string,
 *   toId: string,
 *   fromP: object | null,
 *   toP: object | null,
 *   fromTitle: string,
 *   toTitle: string,
 *   isCombat: boolean
 * }}
 */
export function resolveChoiceEndpoints(choice, ctx) {
    const fromId =
        (typeof choice?.getFromParagraphId === 'function'
            ? choice.getFromParagraphId()
            : choice?.fromParagraphId) || ''
    const toId =
        (typeof choice?.getToParagraphId === 'function'
            ? choice.getToParagraphId()
            : choice?.toParagraphId) || ''

    const paragraphs = ctx?.projectParagraphs || ctx?.projectData?.projectParagraphs || []
    const fromP =
        paragraphs.find(p => (typeof p.getId === 'function' ? p.getId() : p.id) === fromId) || null
    const toP =
        paragraphs.find(p => (typeof p.getId === 'function' ? p.getId() : p.id) === toId) || null

    const fromTitle = fromP
        ? (typeof fromP.getTitle === 'function' ? fromP.getTitle() : fromP.title) ||
          (typeof fromP.getId === 'function' ? fromP.getId() : fromP.id) ||
          fromId ||
          '?'
        : fromId || '?'
    const toTitle = toP
        ? (typeof toP.getTitle === 'function' ? toP.getTitle() : toP.title) ||
          (typeof toP.getId === 'function' ? toP.getId() : toP.id) ||
          toId ||
          '?'
        : toId || '?'

    const isCombat = Boolean(
        (typeof choice?.getIsCombatOutcome === 'function' && choice.getIsCombatOutcome()) ||
        choice?.isCombatOutcome
    )

    return {
        fromId,
        toId,
        fromP,
        toP,
        fromTitle,
        toTitle,
        isCombat,
    }
}

/**
 * Renders the HTML badge for choice type (combat outcome vs normal choice).
 *
 * @param {boolean} isCombat
 * @returns {string}
 */
export function renderChoiceTypeBadgeHtml(isCombat) {
    if (isCombat) {
        return `<span class="px-2 py-0.5 text-[11px] rounded border border-rose-800/60 bg-rose-950/60 text-rose-300 font-medium inline-flex items-center gap-1"><span aria-hidden="true">${getIconSvg('swords', 'w-3 h-3')}</span> ${escapeHtml(t('details.choice_combat_badge'))}</span>`
    }
    return `<span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor('choice')} font-medium">${escapeHtml(t('details.type_choice'))}</span>`
}

/**
 * Renders the HTML content of the Type & ID header section.
 *
 * @param {object} [item]
 * @param {boolean} [isCombat]
 * @returns {string}
 */
export function renderChoiceHeaderSectionHtml(item, isCombat = false) {
    const itemId = item?.id || ''
    return `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${escapeHtml(t('details.type'))}</span>
            <div class="flex items-center gap-1.5">
                ${renderChoiceTypeBadgeHtml(isCombat)}
            </div>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(itemId)}</div>
    `.trim()
}

/**
 * Renders the HTML content for the Choice name input section.
 *
 * @param {string} [choiceName]
 * @returns {string}
 */
export function renderChoiceNameSectionHtml(choiceName = '') {
    const label = escapeHtml(t('details.choice_name'))
    const placeholder = escapeHtml(t('details.choice_name_placeholder'))
    return `
        <label for="details-choice-name-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${label}</label>
        <input id="details-choice-name-input" type="text" value="${escapeHtml(choiceName)}" placeholder="${placeholder}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            aria-label="${label}" />
        <div id="details-choice-name-error" class="hidden text-[11px] text-red-400" role="alert"></div>
    `.trim()
}

/**
 * Renders the HTML content for source and target node navigation buttons.
 *
 * @param {string} fromTitle
 * @param {string} toTitle
 * @param {boolean} [hasFromP]
 * @param {boolean} [hasToP]
 * @returns {string}
 */
export function renderChoiceNodesSectionHtml(fromTitle, toTitle, hasFromP = false, hasToP = false) {
    const openNodeDetailsTitle = escapeHtml(t('details.open_node_details'))
    const sourceTitleAttr = hasFromP ? openNodeDetailsTitle : ''
    const targetTitleAttr = hasToP ? openNodeDetailsTitle : ''

    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(t('details.nodes_section'))}</div>
        <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-node-source" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-emerald-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${sourceTitleAttr}" aria-label="${escapeHtml(t('details.source_node'))}: ${escapeHtml(fromTitle)}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${escapeHtml(t('details.source_node'))}</span>
                    <span class="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-emerald-400 font-medium truncate mt-1 w-full flex items-center gap-1" title="${escapeHtml(fromTitle)}">
                    <span class="shrink-0 inline-flex items-center" aria-hidden="true">${getIconSvg('paragraph', 'w-3 h-3 text-emerald-400')}</span>
                    <span class="truncate">${escapeHtml(fromTitle)}</span>
                </div>
            </button>
            <button type="button" id="btn-node-target" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-blue-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${targetTitleAttr}" aria-label="${escapeHtml(t('details.target_node'))}: ${escapeHtml(toTitle)}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${escapeHtml(t('details.target_node'))}</span>
                    <span class="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-blue-400 font-medium truncate mt-1 w-full flex items-center gap-1" title="${escapeHtml(toTitle)}">
                    <span class="shrink-0 inline-flex items-center" aria-hidden="true">${getIconSvg('paragraph', 'w-3 h-3 text-blue-400')}</span>
                    <span class="truncate">${escapeHtml(toTitle)}</span>
                </div>
            </button>
        </div>
    `.trim()
}

/**
 * Validates and saves the choice name to the view model and syncs related combat and UI state.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {HTMLInputElement} [params.nameInput]
 * @param {HTMLElement} [params.nameError]
 * @param {object} [params.fromP]
 * @param {boolean} [params.isCombat]
 * @param {object} [params.ctx]
 * @param {Function} [params.onRefreshDetails]
 * @returns {boolean} True if saved successfully, false if invalid
 */
export function handleSaveChoiceName({
    choice,
    nameInput,
    nameError,
    fromP,
    isCombat,
    ctx,
    onRefreshDetails,
}) {
    if (!nameInput) return false
    const val = nameInput.value.trim()

    if (!val) {
        if (nameError) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
        }
        nameInput.classList.add('border-red-500')
        return false
    }

    if (nameError) {
        nameError.classList.add('hidden')
    }
    nameInput.classList.remove('border-red-500')

    const choiceId = typeof choice?.getId === 'function' ? choice.getId() : choice?.id

    if (isCombat && fromP && typeof fromP.getHasCombat === 'function' && fromP.getHasCombat()) {
        const combat = typeof fromP.getCombat === 'function' ? fromP.getCombat() : fromP.combat
        if (combat && typeof combat.updateOutcome === 'function') {
            combat.updateOutcome(choiceId, { name: val })
        }
    }

    const graph = ctx?.vm?.graph
    if (graph && typeof graph.updateChoiceDetails === 'function') {
        const cond =
            typeof choice?.getCondition === 'function' ? choice.getCondition() : choice?.condition
        const costs = typeof choice?.getCosts === 'function' ? choice.getCosts() : choice?.costs
        const rewards =
            typeof choice?.getRewards === 'function' ? choice.getRewards() : choice?.rewards
        const diceCheck =
            typeof choice?.getDiceCheck === 'function' ? choice.getDiceCheck() : choice?.diceCheck

        graph.updateChoiceDetails(choice, val, cond, costs, rewards, diceCheck)
    } else if (choice) {
        if (typeof choice.setName === 'function') {
            choice.setName(val)
        } else {
            choice.name = val
        }
    }

    if (ctx) {
        renderHistoryBar(ctx, onRefreshDetails)
        if (typeof ctx.renderConnectionsList === 'function') {
            ctx.renderConnectionsList()
        }
        if (typeof ctx.renderParagraphsList === 'function') {
            ctx.renderParagraphsList()
        }
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
            ctx.storyGraphInstance.render(true)
        }
    }

    return true
}

/**
 * Handles selecting a paragraph entity in the main editor.
 *
 * @param {object} [node]
 * @param {object} [ctx]
 */
export function handleSelectNode(node, ctx) {
    if (node && ctx && typeof ctx.selectEntity === 'function') {
        ctx.selectEntity(node, 'paragraph')
    }
}

/**
 * Renders choice header: Type & ID, editable choice name, and source/target nodes.
 *
 * @param {object} choice
 * @param {object} [item]
 * @param {object} [ctx]
 * @param {Function} [onRefreshDetails]
 * @returns {{
 *   headerMod: HTMLElement,
 *   nameMod: HTMLElement,
 *   nodesMod: HTMLElement,
 *   getNameInput: () => HTMLInputElement | null
 * }}
 */
export function createChoiceHeader(choice, item = {}, ctx = {}, onRefreshDetails) {
    const { fromP, toP, fromTitle, toTitle, isCombat } = resolveChoiceEndpoints(choice, ctx)
    const effectiveItem = item?.id
        ? item
        : { id: (typeof choice?.getId === 'function' ? choice.getId() : choice?.id) || '' }

    // 1. Typ & ID
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderChoiceHeaderSectionHtml(effectiveItem, isCombat)
    )

    // 2. Nazwa / Etykieta przeskoku
    const choiceName =
        (typeof choice?.getName === 'function' ? choice.getName() : choice?.name) || ''
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderChoiceNameSectionHtml(choiceName)
    )
    const nameInput = nameMod.querySelector('#details-choice-name-input')
    const nameError = nameMod.querySelector('#details-choice-name-error')

    const triggerSave = () => {
        return handleSaveChoiceName({
            choice,
            nameInput,
            nameError,
            fromP,
            isCombat,
            ctx,
            onRefreshDetails,
        })
    }

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const val = nameInput.value.trim()
            if (!val) {
                if (nameError) {
                    nameError.textContent = t('details.name_required')
                    nameError.classList.remove('hidden')
                }
                nameInput.classList.add('border-red-500')
            } else {
                if (nameError) {
                    nameError.classList.add('hidden')
                }
                nameInput.classList.remove('border-red-500')
            }
        })

        nameInput.addEventListener('blur', triggerSave)
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (triggerSave()) {
                    nameInput.blur()
                }
            }
        })
    }

    // 3. Węzły źródłowy i docelowy
    const nodesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderChoiceNodesSectionHtml(fromTitle, toTitle, Boolean(fromP), Boolean(toP))
    )

    const sourceBtn = nodesMod.querySelector('#btn-node-source')
    const targetBtn = nodesMod.querySelector('#btn-node-target')

    if (sourceBtn) {
        sourceBtn.addEventListener('click', () => handleSelectNode(fromP, ctx))
    }
    if (targetBtn) {
        targetBtn.addEventListener('click', () => handleSelectNode(toP, ctx))
    }

    return {
        headerMod,
        nameMod,
        nodesMod,
        getNameInput: () => nameInput,
    }
}
