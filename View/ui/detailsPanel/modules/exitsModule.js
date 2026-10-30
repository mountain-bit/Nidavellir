import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    CombatSyncService,
    Paragraph,
    TextCondition,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Pure template for paragraph exits module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderExitsModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide truncate">${t('details.paragraph_exits')}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
            </div>
            <button id="btn-toggle-add-exit" type="button" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                <span>${t('details.add_exit')}</span>
            </button>
        </div>
    `
}

/**
 * Pure template for empty exits state.
 *
 * @returns {string}
 */
export function renderEmptyExitsHtml() {
    return `
        <div class="text-xs text-gray-500 italic py-2 text-center bg-[#18181b]/50 rounded border border-[#27272a] border-dashed" data-i18n="details.no_exits">
            ${t('details.no_exits')}
        </div>
    `
}

/**
 * Pure template for exit badges (combat outcome, condition, costs, rewards, dice check).
 *
 * @param {object} choice
 * @param {string} [choiceCondText='']
 * @returns {string}
 */
export function renderExitBadgesHtml(choice, choiceCondText = '') {
    if (!choice) return ''
    const badges = []

    const isCombat = Boolean(
        (typeof choice.getIsCombatOutcome === 'function' && choice.getIsCombatOutcome()) ||
        choice.isCombatOutcome
    )
    if (isCombat) {
        badges.push(
            `<span class="px-1.5 py-0.2 rounded text-[9px] bg-rose-950/60 text-rose-300 border border-rose-800/40 font-mono inline-flex items-center gap-1">${getIconSvg('swords', 'w-2.5 h-2.5')} ${t('details.combat_outcome')}</span>`
        )
    }

    if (choiceCondText) {
        badges.push(
            `<span class="px-1.5 py-0.2 rounded text-[9px] bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono truncate max-w-full">${t('details.exit_badge_condition')}: ${escapeHtml(choiceCondText)}</span>`
        )
    }

    if (typeof choice.hasCosts === 'function' && choice.hasCosts()) {
        const costs = choice.getCosts ? choice.getCosts() : []
        const costsStr = (costs || []).map(c => `-${c.value || 1} ${c.name}`).join(', ')
        badges.push(
            `<span class="px-1.5 py-0.2 rounded text-[9px] bg-red-950/60 text-red-300 border border-red-800/40 font-mono">${t('details.exit_badge_cost')}: ${escapeHtml(costsStr)}</span>`
        )
    }

    if (typeof choice.hasRewards === 'function' && choice.hasRewards()) {
        const rewards = choice.getRewards ? choice.getRewards() : []
        const rewardsStr = (rewards || []).map(r => `+${r.value || 1} ${r.name}`).join(', ')
        badges.push(
            `<span class="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono">${t('details.exit_badge_reward')}: ${escapeHtml(rewardsStr)}</span>`
        )
    }

    if (typeof choice.hasDiceCheck === 'function' && choice.hasDiceCheck()) {
        const dc = choice.getDiceCheck ? choice.getDiceCheck() : null
        const diceName = dc?.dice || 'd20'
        const branchesCount = dc?.branches?.length || 0
        badges.push(
            `<span class="px-1.5 py-0.2 rounded text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">${t('details.exit_badge_dice')}: ${escapeHtml(diceName)} (${branchesCount} ${t('details.exit_badge_targets')})</span>`
        )
    }

    if (badges.length === 0) return ''
    return `<div class="flex flex-wrap gap-1">${badges.join('')}</div>`
}

/**
 * Pure template for target paragraph options in select dropdowns.
 *
 * @param {Array<object>} [paragraphs=[]]
 * @param {string} [currentTargetId='']
 * @param {string} [selfId='']
 * @returns {string}
 */
export function renderTargetParagraphOptionsHtml(
    paragraphs = [],
    currentTargetId = '',
    selfId = ''
) {
    return (paragraphs || [])
        .map(p => {
            const pId = typeof p.getId === 'function' ? p.getId() : p.id || ''
            const pTitle = typeof p.getTitle === 'function' ? p.getTitle() : p.title || pId
            const isSelected = pId === currentTargetId
            const isSelf = Boolean(selfId && pId === selfId)
            const selfSuffix = isSelf ? ` ${t('details.this_paragraph')}` : ''
            return `<option value="${escapeHtml(pId)}" ${isSelected ? 'selected' : ''}>§ ${escapeHtml(pTitle)}${selfSuffix}</option>`
        })
        .join('')
}

/**
 * Pure template for add exit form block.
 *
 * @param {string} [targetOptionsHtml='']
 * @returns {string}
 */
export function renderAddExitFormHtml(targetOptionsHtml = '') {
    return `
        <div id="details-add-exit-form" class="hidden bg-[#18181b] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.target_node')}</label>
                <select id="details-add-exit-target" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                    ${targetOptionsHtml}
                </select>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.choice_name')}</label>
                <input id="details-add-exit-name" type="text" placeholder="${t('details.choice_name_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.condition_text')} (${t('left_panel.condition_text_optional')})</label>
                <input id="details-add-exit-condition" type="text" placeholder="${t('details.condition_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-exit" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">${t('buttons.cancel')}</button>
                <button id="btn-submit-add-exit" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">${t('buttons.add')}</button>
            </div>
        </div>
    `
}

/**
 * Pure template for a single exit card.
 *
 * @param {object} choice
 * @param {string} toTitle
 * @param {string} targetOptionsHtml
 * @param {string} exitBadgesHtml
 * @returns {string}
 */
export function renderExitCardHtml(choice, toTitle, targetOptionsHtml, exitBadgesHtml) {
    if (!choice) return ''
    const choiceName = typeof choice.getName === 'function' ? choice.getName() : choice.name || ''

    return `
        <div class="flex items-center justify-between gap-1">
            <span class="text-xs text-emerald-400 font-medium truncate flex items-center gap-1 min-w-0" title="${escapeHtml(toTitle)}">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                <span class="truncate">§ ${escapeHtml(toTitle)}</span>
            </span>
            <div class="flex items-center gap-1 shrink-0">
                <button type="button" class="btn-inspect-exit p-1 text-gray-400 hover:text-blue-400 rounded cursor-pointer transition-colors" title="${t('details.open_choice_details')}">
                    ${getIconSvg('arrow-right', 'w-3 h-3')}
                </button>
                <button type="button" class="btn-delete-exit p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('buttons.delete')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        </div>

        ${exitBadgesHtml}

        <div class="space-y-1">
            <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.choice_name')}</label>
            <input type="text" class="exit-name-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choiceName)}" placeholder="${t('details.choice_name_placeholder')}" />
        </div>

        <div class="space-y-1">
            <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.target_node')}</label>
            <select class="exit-target-select w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                ${targetOptionsHtml}
            </select>
        </div>
    `
}

/**
 * Pure template for the entire exits module layout.
 *
 * @param {number} [count=0]
 * @param {string} [addExitFormHtml='']
 * @returns {string}
 */
export function renderExitsModuleHtml(count = 0, addExitFormHtml = '') {
    return `
        ${renderExitsModuleHeaderHtml(count)}
        ${addExitFormHtml}
        <div id="details-exits-list" class="space-y-2"></div>
    `
}

/**
 * Renders paragraph exits module (connections originating from this paragraph).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderExitsModule(container, entity, type, ctx, onRefreshDetails) {
    if (!container || !entity) return
    const isParagraph =
        type === 'paragraph' &&
        (entity instanceof Paragraph || typeof entity.getChoices === 'function')
    if (!isParagraph) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (ctx && typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    if (CombatSyncService && typeof CombatSyncService.syncParagraphCombatChoices === 'function') {
        CombatSyncService.syncParagraphCombatChoices(entity, ctx?.vm)
    }

    const choices = (typeof entity.getChoices === 'function' ? entity.getChoices() : []) || []
    const projectParagraphs = (ctx && ctx.projectParagraphs) || []

    const addExitFormHtml = renderAddExitFormHtml(
        renderTargetParagraphOptionsHtml(projectParagraphs, '', entity.getId ? entity.getId() : '')
    )

    const exitsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderExitsModuleHtml(choices.length, addExitFormHtml)
    )

    const addExitForm = exitsMod.querySelector('#details-add-exit-form')
    const toggleAddBtn = exitsMod.querySelector('#btn-toggle-add-exit')
    const targetSelect = exitsMod.querySelector('#details-add-exit-target')
    const nameInput = exitsMod.querySelector('#details-add-exit-name')
    const condInput = exitsMod.querySelector('#details-add-exit-condition')
    const cancelBtn = exitsMod.querySelector('#btn-cancel-add-exit')
    const submitBtn = exitsMod.querySelector('#btn-submit-add-exit')

    const populateTargets = () => {
        if (!targetSelect) return
        const selfId = typeof entity.getId === 'function' ? entity.getId() : ''
        targetSelect.innerHTML = renderTargetParagraphOptionsHtml(projectParagraphs, '', selfId)
        const otherP = projectParagraphs.find(p => (p.getId ? p.getId() : p.id) !== selfId)
        if (otherP) {
            targetSelect.value = otherP.getId ? otherP.getId() : otherP.id
        }
    }

    if (toggleAddBtn && addExitForm) {
        toggleAddBtn.addEventListener('click', () => {
            addExitForm.classList.toggle('hidden')
            if (!addExitForm.classList.contains('hidden')) {
                populateTargets()
                if (nameInput) {
                    nameInput.value = ''
                    nameInput.focus()
                }
                if (condInput) condInput.value = ''
            }
        })
    }

    if (cancelBtn && addExitForm) {
        cancelBtn.addEventListener('click', () => {
            addExitForm.classList.add('hidden')
        })
    }

    const handleAddExit = () => {
        if (!targetSelect) return
        const targetId = targetSelect.value
        if (!targetId) return
        const targetP = projectParagraphs.find(p => (p.getId ? p.getId() : p.id) === targetId)
        if (!targetP) return

        const choiceName = (nameInput?.value || '').trim() || t('details.default_jump_name')
        const condTextVal = (condInput?.value || '').trim()

        if (ctx?.vm && typeof ctx.vm.createChoice === 'function') {
            ctx.vm.createChoice(
                entity,
                targetP,
                choiceName,
                t('details.default_jump_name'),
                condTextVal
            )
        }
        refreshDetails()
        if (ctx && typeof ctx.renderConnectionsList === 'function') ctx.renderConnectionsList()
        if (ctx && typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
        if (ctx && ctx.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
            ctx.storyGraphInstance.render(true)
        }
        const entityTitle = (entity.getTitle ? entity.getTitle() : '') || entity.getId?.() || ''
        const targetTitle = (targetP.getTitle ? targetP.getTitle() : '') || targetP.getId?.() || ''
        toast.success(
            t('toast.connection_created', {
                from: entityTitle,
                to: targetTitle,
            }),
            t('toast.element_created_title')
        )
    }

    if (submitBtn) submitBtn.addEventListener('click', handleAddExit)
    if (nameInput) {
        nameInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleAddExit()
        })
    }
    if (condInput) {
        condInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleAddExit()
        })
    }

    const exitsListContainer = exitsMod.querySelector('#details-exits-list')

    if (exitsListContainer) {
        if (choices.length === 0) {
            exitsListContainer.innerHTML = renderEmptyExitsHtml()
        } else {
            choices.forEach(choice => {
                const toId =
                    typeof choice.getToParagraphId === 'function'
                        ? choice.getToParagraphId()
                        : choice.toParagraphId
                const toP = projectParagraphs.find(p => (p.getId ? p.getId() : p.id) === toId)
                const toTitle = toP
                    ? (toP.getTitle ? toP.getTitle() : toP.title) || toP.getId?.()
                    : toId || '?'
                const cond =
                    typeof choice.getCondition === 'function'
                        ? choice.getCondition()
                        : choice.condition
                const choiceCondText =
                    cond instanceof TextCondition
                        ? cond.getText()
                        : cond
                          ? cond.getSummary
                              ? cond.getSummary()
                              : ''
                          : ''

                const targetOptionsHtml = renderTargetParagraphOptionsHtml(projectParagraphs, toId)
                const exitBadgesHtml = renderExitBadgesHtml(choice, choiceCondText)

                const card = document.createElement('div')
                card.className =
                    'bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded p-2.5 space-y-2 transition-colors'
                card.innerHTML = renderExitCardHtml(
                    choice,
                    toTitle,
                    targetOptionsHtml,
                    exitBadgesHtml
                )

                const exitNameInput = card.querySelector('.exit-name-input')
                const exitTargetSelect = card.querySelector('.exit-target-select')
                const inspectBtn = card.querySelector('.btn-inspect-exit')
                const deleteBtn = card.querySelector('.btn-delete-exit')

                const isCombat = Boolean(
                    (typeof choice.getIsCombatOutcome === 'function' &&
                        choice.getIsCombatOutcome()) ||
                    choice.isCombatOutcome
                )

                if (exitNameInput) {
                    const handleNameUpdate = () => {
                        const newName = exitNameInput.value.trim()
                        if (
                            newName &&
                            ctx?.vm &&
                            typeof ctx.vm.updateChoiceDetails === 'function'
                        ) {
                            ctx.vm.updateChoiceDetails(choice, newName)
                            if (
                                isCombat &&
                                CombatSyncService &&
                                typeof CombatSyncService.updateOutcomeChoiceName === 'function'
                            ) {
                                CombatSyncService.updateOutcomeChoiceName(
                                    entity,
                                    choice.getId ? choice.getId() : choice.id,
                                    newName
                                )
                            }
                            if (ctx && typeof ctx.renderConnectionsList === 'function')
                                ctx.renderConnectionsList()
                            if (
                                ctx &&
                                ctx.storyGraphInstance &&
                                typeof ctx.storyGraphInstance.render === 'function'
                            ) {
                                ctx.storyGraphInstance.render(true)
                            }
                        } else if (!newName) {
                            exitNameInput.value =
                                (choice.getName ? choice.getName() : choice.name) || ''
                        }
                    }

                    exitNameInput.addEventListener('input', () => {
                        const newName = exitNameInput.value.trim()
                        if (
                            newName &&
                            ctx?.vm &&
                            typeof ctx.vm.updateChoiceDetails === 'function'
                        ) {
                            ctx.vm.updateChoiceDetails(choice, newName)
                            if (
                                isCombat &&
                                CombatSyncService &&
                                typeof CombatSyncService.updateOutcomeChoiceName === 'function'
                            ) {
                                CombatSyncService.updateOutcomeChoiceName(
                                    entity,
                                    choice.getId ? choice.getId() : choice.id,
                                    newName
                                )
                            }
                            if (ctx && typeof ctx.renderConnectionsList === 'function')
                                ctx.renderConnectionsList()
                            if (
                                ctx &&
                                ctx.storyGraphInstance &&
                                typeof ctx.storyGraphInstance.render === 'function'
                            ) {
                                ctx.storyGraphInstance.render(true)
                            }
                        }
                    })
                    exitNameInput.addEventListener('blur', handleNameUpdate)
                }

                if (exitTargetSelect) {
                    exitTargetSelect.addEventListener('change', () => {
                        const newTargetId = exitTargetSelect.value
                        const currentToId = choice.getToParagraphId
                            ? choice.getToParagraphId()
                            : choice.toParagraphId
                        if (newTargetId && newTargetId !== currentToId) {
                            if (typeof choice.setToParagraphId === 'function') {
                                choice.setToParagraphId(newTargetId)
                            }
                            if (isCombat && entity.getHasCombat && entity.getHasCombat()) {
                                const combat = entity.getCombat ? entity.getCombat() : null
                                if (combat && typeof combat.updateOutcome === 'function') {
                                    combat.updateOutcome(
                                        choice.getId ? choice.getId() : choice.id,
                                        { targetParagraphId: newTargetId }
                                    )
                                }
                            }
                            refreshDetails()
                            if (ctx && typeof ctx.renderConnectionsList === 'function')
                                ctx.renderConnectionsList()
                            if (
                                ctx &&
                                ctx.storyGraphInstance &&
                                typeof ctx.storyGraphInstance.render === 'function'
                            ) {
                                ctx.storyGraphInstance.render(true)
                            }
                            toast.success(t('toast.target_updated'))
                        }
                    })
                }

                if (inspectBtn) {
                    inspectBtn.addEventListener('click', () => {
                        if (ctx && typeof ctx.selectEntity === 'function') {
                            ctx.selectEntity(choice, 'choice', entity)
                        }
                    })
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        const choiceDisplayName =
                            (choice.getName ? choice.getName() : choice.name) ||
                            choice.getId?.() ||
                            ''
                        if (
                            confirm(
                                t('context_menu.confirm_delete', {
                                    name: choiceDisplayName,
                                })
                            )
                        ) {
                            const choiceId = choice.getId ? choice.getId() : choice.id
                            if (ctx?.vm && typeof ctx.vm.deleteChoice === 'function') {
                                ctx.vm.deleteChoice(choiceId, projectParagraphs)
                            }
                            refreshDetails()
                            if (ctx && typeof ctx.renderConnectionsList === 'function')
                                ctx.renderConnectionsList()
                            if (ctx && typeof ctx.renderParagraphsList === 'function')
                                ctx.renderParagraphsList()
                            renderHistoryBar(ctx, onRefreshDetails)
                            if (
                                ctx &&
                                ctx.storyGraphInstance &&
                                typeof ctx.storyGraphInstance.render === 'function'
                            ) {
                                ctx.storyGraphInstance.render(true)
                            }
                            toast.success(t('toast.connection_deleted'))
                        }
                    })
                }

                exitsListContainer.appendChild(card)
            })
        }
    }

    container.appendChild(exitsMod)
}
