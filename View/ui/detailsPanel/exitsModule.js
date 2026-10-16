import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { Paragraph, TextCondition } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { createSection } from './common/domHelpers.js'
import { renderHistoryBar } from './historyBar.js'

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
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const exitsMod = createSection('border-b border-[#333338] p-3 space-y-2')
    const choices = entity.getChoices() || []

    exitsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide truncate">${t('details.paragraph_exits')}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${choices.length}</span>
            </div>
            <button id="btn-toggle-add-exit" type="button" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                <span>${t('details.add_exit')}</span>
            </button>
        </div>

        <div id="details-add-exit-form" class="hidden bg-[#18181b] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.target_node')}</label>
                <select id="details-add-exit-target" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
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

        <div id="details-exits-list" class="space-y-2"></div>
    `

    const addExitForm = exitsMod.querySelector('#details-add-exit-form')
    const toggleAddBtn = exitsMod.querySelector('#btn-toggle-add-exit')
    const targetSelect = exitsMod.querySelector('#details-add-exit-target')
    const nameInput = exitsMod.querySelector('#details-add-exit-name')
    const condInput = exitsMod.querySelector('#details-add-exit-condition')
    const cancelBtn = exitsMod.querySelector('#btn-cancel-add-exit')
    const submitBtn = exitsMod.querySelector('#btn-submit-add-exit')

    const populateTargets = () => {
        const options = ctx.projectParagraphs
            .map(p => {
                const isSelf = p.getId() === entity.getId()
                const title = p.getTitle() || p.getId()
                return `<option value="${escapeHtml(p.getId())}">§ ${escapeHtml(title)}${isSelf ? ` ${t('details.this_paragraph')}` : ''}</option>`
            })
            .join('')
        targetSelect.innerHTML = options
        const otherP = ctx.projectParagraphs.find(p => p.getId() !== entity.getId())
        if (otherP) {
            targetSelect.value = otherP.getId()
        }
    }

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

    cancelBtn.addEventListener('click', () => {
        addExitForm.classList.add('hidden')
    })

    const handleAddExit = () => {
        const targetId = targetSelect.value
        if (!targetId) return
        const targetP = ctx.projectParagraphs.find(p => p.getId() === targetId)
        if (!targetP) return

        const choiceName = nameInput.value.trim() || t('details.default_jump_name')
        const condTextVal = condInput.value.trim()

        ctx.vm.createChoice(
            entity,
            targetP,
            choiceName,
            t('details.default_jump_name'),
            condTextVal
        )
        refreshDetails()
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        toast.success(
            t('toast.connection_created', {
                from: entity.getTitle() || entity.getId(),
                to: targetP.getTitle() || targetP.getId(),
            }),
            t('toast.element_created_title')
        )
    }

    submitBtn.addEventListener('click', handleAddExit)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })
    condInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })

    const exitsListContainer = exitsMod.querySelector('#details-exits-list')

    if (choices.length === 0) {
        exitsListContainer.innerHTML = `
            <div class="text-xs text-gray-500 italic py-2 text-center bg-[#18181b]/50 rounded border border-[#27272a] border-dashed" data-i18n="details.no_exits">
                ${t('details.no_exits')}
            </div>
        `
    } else {
        choices.forEach(choice => {
            const toId = choice.getToParagraphId()
            const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
            const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
            const cond = choice.getCondition()
            const choiceCondText =
                cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

            const card = document.createElement('div')
            card.className =
                'bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded p-2.5 space-y-2 transition-colors'

            const targetOptionsHtml = ctx.projectParagraphs
                .map(p => {
                    const isSelected = p.getId() === toId
                    const title = p.getTitle() || p.getId()
                    return `<option value="${escapeHtml(p.getId())}" ${isSelected ? 'selected' : ''}>§ ${escapeHtml(title)}</option>`
                })
                .join('')

            card.innerHTML = `
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

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.choice_name')}</label>
                    <input type="text" class="exit-name-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}" />
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.target_node')}</label>
                    <select class="exit-target-select w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                        ${targetOptionsHtml}
                    </select>
                </div>

                <div class="space-y-1">
                    <div class="flex items-center justify-between">
                        <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.condition_section')}</label>
                        <span class="text-[9px] text-amber-400 font-mono">${t('condition.type_text')}</span>
                    </div>
                    <input type="text" class="exit-condition-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choiceCondText)}" placeholder="${t('details.condition_placeholder')}" />
                </div>
            `

            const exitNameInput = card.querySelector('.exit-name-input')
            const exitTargetSelect = card.querySelector('.exit-target-select')
            const exitCondInput = card.querySelector('.exit-condition-input')
            const inspectBtn = card.querySelector('.btn-inspect-exit')
            const deleteBtn = card.querySelector('.btn-delete-exit')

            exitNameInput.addEventListener('input', () => {
                const newName = exitNameInput.value.trim()
                if (newName) {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })
            exitNameInput.addEventListener('blur', () => {
                const newName = exitNameInput.value.trim()
                if (!newName) {
                    exitNameInput.value = choice.getName()
                } else {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })

            exitTargetSelect.addEventListener('change', () => {
                const newTargetId = exitTargetSelect.value
                if (newTargetId && newTargetId !== choice.getToParagraphId()) {
                    choice.setToParagraphId(newTargetId)
                    refreshDetails()
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.target_updated'))
                }
            })

            exitCondInput.addEventListener('input', () => {
                ctx.vm.updateChoiceDetails(choice, choice.getName(), exitCondInput.value)
                ctx.renderConnectionsList()
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })

            inspectBtn.addEventListener('click', () => {
                ctx.selectEntity(choice, 'choice', entity)
            })

            deleteBtn.addEventListener('click', () => {
                if (
                    confirm(
                        t('context_menu.confirm_delete', {
                            name: choice.getName() || choice.getId(),
                        })
                    )
                ) {
                    ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
                    refreshDetails()
                    ctx.renderConnectionsList()
                    ctx.renderParagraphsList()
                    renderHistoryBar(ctx, onRefreshDetails)
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.connection_deleted'))
                }
            })

            exitsListContainer.appendChild(card)
        })
    }

    container.appendChild(exitsMod)
}
