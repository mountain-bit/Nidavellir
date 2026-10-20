import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import {
    ItemCondition,
    StatCondition,
    TextCondition,
} from '../../../dist/ViewModel/MainWindowViewModel.js'
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
    // 4. Datalists do podpowiedzi
    let datalistsEl = container.querySelector('#choice-datalists-container')
    if (!datalistsEl) {
        datalistsEl = document.createElement('div')
        datalistsEl.id = 'choice-datalists-container'
        const itemsList = (ctx.projectItems || [])
            .map(i => escapeHtml((typeof i.getName === 'function' ? i.getName() : i.name) || ''))
            .filter(Boolean)
        const statsList = [
            ...(ctx.projectStats || []),
            ...(ctx.projectParameters || []),
            ...(ctx.projectSkills || []),
        ]
            .map(s => escapeHtml((typeof s.getName === 'function' ? s.getName() : s.name) || ''))
            .filter(Boolean)

        datalistsEl.innerHTML = `
            <datalist id="choice-items-datalist">
                ${itemsList.map(name => `<option value="${name}"></option>`).join('')}
            </datalist>
            <datalist id="choice-stats-datalist">
                ${statsList.map(name => `<option value="${name}"></option>`).join('')}
            </datalist>
        `
        container.appendChild(datalistsEl)
    }

    const saveAllChoiceData = () => {
        const nameVal = nameInput.value.trim() || choice.getName()
        const condType = condTypeSelect.value
        let conditionObj = null
        if (condType === 'item') {
            const itemName = condMod.querySelector('#choice-cond-item-name')?.value.trim() || ''
            const qty = parseInt(condMod.querySelector('#choice-cond-item-qty')?.value, 10) || 1
            if (itemName) {
                conditionObj = new ItemCondition(
                    `cond_${Date.now()}`,
                    'Wymagany przedmiot',
                    itemName,
                    qty
                )
            }
        } else if (condType === 'stat') {
            const statName = condMod.querySelector('#choice-cond-stat-name')?.value.trim() || ''
            const op = condMod.querySelector('#choice-cond-stat-op')?.value || '>='
            const val = parseFloat(condMod.querySelector('#choice-cond-stat-val')?.value) || 0
            if (statName) {
                conditionObj = new StatCondition(
                    `cond_${Date.now()}`,
                    'Wymagana cecha',
                    statName,
                    op,
                    val
                )
            }
        } else if (condType === 'text') {
            const textVal = condMod.querySelector('#details-condition-text')?.value.trim() || ''
            if (textVal) {
                conditionObj = new TextCondition(`cond_${Date.now()}`, 'Warunek', textVal)
            }
        }

        ctx.vm.updateChoiceDetails(
            choice,
            nameVal,
            conditionObj,
            choice.getCosts(),
            choice.getRewards(),
            choice.getDiceCheck()
        )
        ctx.renderConnectionsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
    }

    // 4. Warunek Polimorficzny (Jeżeli posiadasz... to możesz iść tam)
    let currentCondType = 'none'
    if (cond instanceof ItemCondition || cond?.getType?.() === 'item') currentCondType = 'item'
    else if (cond instanceof StatCondition || cond?.getType?.() === 'stat') currentCondType = 'stat'
    else if (cond) currentCondType = 'text'

    const condMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.condition_title')}</span>
            <select id="choice-condition-type-select" class="bg-[#18181b] border border-[#3f3f46] text-white text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500">
                <option value="none" ${currentCondType === 'none' ? 'selected' : ''}>${t('details.condition_type_none')}</option>
                <option value="item" ${currentCondType === 'item' ? 'selected' : ''}>${t('details.condition_type_item')}</option>
                <option value="stat" ${currentCondType === 'stat' ? 'selected' : ''}>${t('details.condition_type_stat')}</option>
                <option value="text" ${currentCondType === 'text' ? 'selected' : ''}>${t('condition.type_text')}</option>
            </select>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.condition_help')}</p>
        <div id="choice-condition-body" class="space-y-2"></div>
    `
    )

    const condTypeSelect = condMod.querySelector('#choice-condition-type-select')
    const condBody = condMod.querySelector('#choice-condition-body')

    const renderCondBody = () => {
        const type = condTypeSelect.value
        if (type === 'none') {
            condBody.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">Wybór jest dostępny bez ograniczeń.</div>`
        } else if (type === 'item') {
            const currentItemName =
                cond instanceof ItemCondition ? cond.getItemName() : cond?.itemName || ''
            const currentQty =
                cond instanceof ItemCondition ? cond.getQuantity() : cond?.quantity || 1
            condBody.innerHTML = `
                <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2">
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_item_name')}</label>
                        <input id="choice-cond-item-name" type="text" list="choice-items-datalist" value="${escapeHtml(currentItemName)}" placeholder="np. Złoty klucz"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_quantity')}</label>
                        <input id="choice-cond-item-qty" type="number" min="1" value="${currentQty}"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            `
            condBody
                .querySelector('#choice-cond-item-name')
                .addEventListener('input', saveAllChoiceData)
            condBody
                .querySelector('#choice-cond-item-qty')
                .addEventListener('input', saveAllChoiceData)
        } else if (type === 'stat') {
            const currentStatName =
                cond instanceof StatCondition ? cond.getStatName() : cond?.statName || ''
            const currentOp =
                cond instanceof StatCondition ? cond.getOperator() : cond?.operator || '>='
            const currentVal = cond instanceof StatCondition ? cond.getValue() : (cond?.value ?? 10)
            condBody.innerHTML = `
                <div class="grid grid-cols-4 gap-1.5">
                    <div class="col-span-2">
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_stat_name')}</label>
                        <input id="choice-cond-stat-name" type="text" list="choice-stats-datalist" value="${escapeHtml(currentStatName)}" placeholder="np. Siła"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_operator')}</label>
                        <select id="choice-cond-stat-op" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                            <option value=">=" ${currentOp === '>=' ? 'selected' : ''}>&ge;</option>
                            <option value=">" ${currentOp === '>' ? 'selected' : ''}>&gt;</option>
                            <option value="==" ${currentOp === '==' ? 'selected' : ''}>=</option>
                            <option value="<=" ${currentOp === '<=' ? 'selected' : ''}>&le;</option>
                            <option value="<" ${currentOp === '<' ? 'selected' : ''}>&lt;</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_value')}</label>
                        <input id="choice-cond-stat-val" type="number" value="${currentVal}"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            `
            condBody
                .querySelector('#choice-cond-stat-name')
                .addEventListener('input', saveAllChoiceData)
            condBody
                .querySelector('#choice-cond-stat-op')
                .addEventListener('change', saveAllChoiceData)
            condBody
                .querySelector('#choice-cond-stat-val')
                .addEventListener('input', saveAllChoiceData)
        } else if (type === 'text') {
            const textVal =
                cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''
            condBody.innerHTML = `
                <textarea id="details-condition-text" rows="2" placeholder="${t('details.condition_placeholder')}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(textVal)}</textarea>
            `
            condBody
                .querySelector('#details-condition-text')
                .addEventListener('input', saveAllChoiceData)
        }
    }
    renderCondBody()

    condTypeSelect.addEventListener('change', () => {
        renderCondBody()
        saveAllChoiceData()
    })
    container.appendChild(condMod)

    // 5. Koszty i Utrata ("Stracić tyle...")
    const costsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-red-400">${getIconSvg('close', 'w-3 h-3')}</span>
                ${t('details.costs_title')}
            </span>
            <button type="button" id="btn-add-choice-cost" class="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                ${t('details.add_cost')}
            </button>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.costs_help')}</p>
        <div id="choice-costs-list" class="space-y-1.5"></div>
    `
    )
    const costsList = costsMod.querySelector('#choice-costs-list')
    const renderCosts = () => {
        const costs = choice.getCosts()
        if (costs.length === 0) {
            costsList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">${t('details.no_costs')}</div>`
            return
        }
        costsList.innerHTML = costs
            .map(
                (c, idx) => `
            <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[10px] ${c.type === 'item' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-red-950/60 text-red-300 border border-red-800/40'} font-medium">
                        ${c.type === 'item' ? t('details.modifier_item') : t('details.modifier_param')}
                    </span>
                    <span class="text-white font-medium truncate">${escapeHtml(c.name)}</span>
                    <span class="text-red-400 font-mono">-${c.value || 1}</span>
                </div>
                <button type="button" data-cost-idx="${idx}" class="btn-remove-cost text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="Usuń">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        `
            )
            .join('')

        costsList.querySelectorAll('.btn-remove-cost').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-cost-idx'), 10)
                const arr = choice.getCosts()
                arr.splice(idx, 1)
                choice.setCosts(arr)
                renderCosts()
                saveAllChoiceData()
            })
        })
    }
    renderCosts()

    costsMod.querySelector('#btn-add-choice-cost').addEventListener('click', () => {
        const name = prompt(
            'Podaj nazwę przedmiotu lub parametru do utraty (np. Złoto, Pochodnia):'
        )
        if (!name || !name.trim()) return
        const valStr = prompt('Podaj ilość do utraty (np. 5 lub 1):', '1')
        const val = parseInt(valStr, 10) || 1
        const type = confirm(
            'Czy to jest przedmiot? (Kliknij OK dla przedmiotu, Anuluj dla parametru/złota)'
        )
            ? 'item'
            : 'parameter'
        choice.addCost({
            id: `cost_${Date.now()}`,
            type,
            name: name.trim(),
            value: val,
        })
        renderCosts()
        saveAllChoiceData()
    })
    container.appendChild(costsMod)

    // 6. Nagrody i Zysk ("Zyskaj coś...")
    const rewardsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                ${t('details.rewards_title')}
            </span>
            <button type="button" id="btn-add-choice-reward" class="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
                ${t('details.add_reward')}
            </button>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.rewards_help')}</p>
        <div id="choice-rewards-list" class="space-y-1.5"></div>
    `
    )
    const rewardsList = rewardsMod.querySelector('#choice-rewards-list')
    const renderRewards = () => {
        const rewards = choice.getRewards()
        if (rewards.length === 0) {
            rewardsList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">${t('details.no_rewards')}</div>`
            return
        }
        rewardsList.innerHTML = rewards
            .map(
                (r, idx) => `
            <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[10px] ${r.type === 'item' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'} font-medium">
                        ${r.type === 'item' ? t('details.modifier_item') : t('details.modifier_param')}
                    </span>
                    <span class="text-white font-medium truncate">${escapeHtml(r.name)}</span>
                    <span class="text-emerald-400 font-mono">+${r.value || 1}</span>
                </div>
                <button type="button" data-reward-idx="${idx}" class="btn-remove-reward text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="Usuń">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        `
            )
            .join('')

        rewardsList.querySelectorAll('.btn-remove-reward').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-reward-idx'), 10)
                const arr = choice.getRewards()
                arr.splice(idx, 1)
                choice.setRewards(arr)
                renderRewards()
                saveAllChoiceData()
            })
        })
    }
    renderRewards()

    rewardsMod.querySelector('#btn-add-choice-reward').addEventListener('click', () => {
        const name = prompt(
            'Podaj nazwę przedmiotu lub parametru do zyskania (np. Złoty klucz, Złoto):'
        )
        if (!name || !name.trim()) return
        const valStr = prompt('Podaj ilość (np. 1 lub 20):', '1')
        const val = parseInt(valStr, 10) || 1
        const type = confirm(
            'Czy to jest przedmiot? (Kliknij OK dla przedmiotu, Anuluj dla parametru/złota)'
        )
            ? 'item'
            : 'parameter'
        choice.addReward({
            id: `reward_${Date.now()}`,
            type,
            name: name.trim(),
            value: val,
        })
        renderRewards()
        saveAllChoiceData()
    })
    container.appendChild(rewardsMod)

    // 7. Test Rzutu Kością ("Rzuć kością: jak wyniki takie to to jak takie to tam")
    const diceCheck = choice.getDiceCheck()
    const diceMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400">${getIconSvg('combat', 'w-3.5 h-3.5')}</span>
                ${t('details.dice_check_title')}
            </span>
            <label class="flex items-center gap-2 cursor-pointer">
                <input id="choice-enable-dice" type="checkbox" ${diceCheck ? 'checked' : ''} class="rounded bg-[#18181b] border-[#3f3f46] text-purple-600 focus:ring-0 cursor-pointer" />
                <span class="text-[11px] text-gray-300 font-medium">${t('details.dice_check_enable')}</span>
            </label>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.dice_check_help')}</p>
        <div id="choice-dice-config-body" class="${diceCheck ? '' : 'hidden'} space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_type')}</label>
                    <select id="choice-dice-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500">
                        <option value="1k6" ${diceCheck?.dice === '1k6' ? 'selected' : ''}>1k6 (1-6)</option>
                        <option value="2k6" ${diceCheck?.dice === '2k6' ? 'selected' : ''}>2k6 (2-12)</option>
                        <option value="1k20" ${diceCheck?.dice === '1k20' ? 'selected' : ''}>1k20 (1-20)</option>
                        <option value="1k100" ${diceCheck?.dice === '1k100' ? 'selected' : ''}>1k100 (1-100)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_stat')}</label>
                    <input id="choice-dice-stat" type="text" list="choice-stats-datalist" value="${escapeHtml(diceCheck?.stat || '')}" placeholder="np. Zręczność"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_desc')}</label>
                <input id="choice-dice-desc" type="text" value="${escapeHtml(diceCheck?.description || '')}" placeholder="np. Test zręczności przy skoku"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] text-gray-400 uppercase font-semibold">${t('details.dice_branches_title')}</span>
                    <button type="button" id="btn-add-dice-branch" class="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer">
                        ${t('details.add_dice_branch')}
                    </button>
                </div>
                <div id="choice-dice-branches-list" class="space-y-1.5"></div>
            </div>
        </div>
    `
    )

    const enableDiceCheck = diceMod.querySelector('#choice-enable-dice')
    const diceBody = diceMod.querySelector('#choice-dice-config-body')
    const diceTypeSelect = diceMod.querySelector('#choice-dice-type')
    const diceStatInput = diceMod.querySelector('#choice-dice-stat')
    const diceDescInput = diceMod.querySelector('#choice-dice-desc')
    const branchesList = diceMod.querySelector('#choice-dice-branches-list')

    const renderBranches = () => {
        const dc = choice.getDiceCheck()
        const branches = dc?.branches || []
        if (branches.length === 0) {
            branchesList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">Brak zdefiniowanych przedziałów. Dodaj przynajmniej jeden przedział wyniku.</div>`
            return
        }

        branchesList.innerHTML = branches
            .map(
                (b, idx) => `
            <div class="bg-[#18181b] border border-[#27272a] rounded p-2 space-y-1.5 text-xs">
                <div class="flex items-center justify-between gap-1">
                    <div class="flex items-center gap-1.5 text-[11px] text-gray-300 font-mono">
                        <span>Wynik:</span>
                        <input type="number" data-branch-field="min" data-idx="${idx}" value="${b.min}" class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white" />
                        <span>–</span>
                        <input type="number" data-branch-field="max" data-idx="${idx}" value="${b.max}" class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white" />
                    </div>
                    <button type="button" data-branch-remove="${idx}" class="text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="Usuń">
                        ${getIconSvg('close', 'w-3 h-3')}
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                    <div>
                        <input type="text" data-branch-field="desc" data-idx="${idx}" value="${escapeHtml(b.description || '')}" placeholder="Etykieta (np. Sukces)"
                            class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-[11px] text-white focus:outline-none" />
                    </div>
                    <div>
                        <select data-branch-field="target" data-idx="${idx}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-1.5 py-1 text-[11px] text-white focus:outline-none">
                            <option value="">-- Wybierz cel --</option>
                            ${ctx.projectParagraphs
                                .map(p => {
                                    const isSel = p.getId() === b.targetParagraphId
                                    return `<option value="${escapeHtml(p.getId())}" ${isSel ? 'selected' : ''}>§ ${escapeHtml(p.getTitle() || p.getId())}</option>`
                                })
                                .join('')}
                        </select>
                    </div>
                </div>
            </div>
        `
            )
            .join('')

        branchesList.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => {
                const idx = parseInt(el.getAttribute('data-idx'), 10)
                const field = el.getAttribute('data-branch-field')
                const dc = choice.getDiceCheck()
                if (!dc || !dc.branches[idx]) return
                if (field === 'min') dc.branches[idx].min = parseInt(el.value, 10) || 1
                if (field === 'max') dc.branches[idx].max = parseInt(el.value, 10) || 6
                if (field === 'desc') dc.branches[idx].description = el.value.trim()
                if (field === 'target') dc.branches[idx].targetParagraphId = el.value
                saveAllChoiceData()
            })
        })

        branchesList.querySelectorAll('[data-branch-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-branch-remove'), 10)
                const dc = choice.getDiceCheck()
                if (!dc) return
                dc.branches.splice(idx, 1)
                renderBranches()
                saveAllChoiceData()
            })
        })
    }
    renderBranches()

    const updateDiceCheckState = () => {
        if (enableDiceCheck.checked) {
            diceBody.classList.remove('hidden')
            if (!choice.getDiceCheck()) {
                choice.setDiceCheck({
                    dice: diceTypeSelect.value || '1k6',
                    stat: diceStatInput.value.trim() || undefined,
                    description: diceDescInput.value.trim() || undefined,
                    branches: [
                        {
                            min: 1,
                            max: 3,
                            targetParagraphId: choice.getToParagraphId(),
                            description: 'Porażka',
                        },
                        {
                            min: 4,
                            max: 6,
                            targetParagraphId: choice.getToParagraphId(),
                            description: 'Sukces',
                        },
                    ],
                })
                renderBranches()
            }
        } else {
            diceBody.classList.add('hidden')
            choice.setDiceCheck(null)
        }
        saveAllChoiceData()
    }

    enableDiceCheck.addEventListener('change', updateDiceCheckState)
    diceTypeSelect.addEventListener('change', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.dice = diceTypeSelect.value
            saveAllChoiceData()
        }
    })
    diceStatInput.addEventListener('input', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.stat = diceStatInput.value.trim() || undefined
            saveAllChoiceData()
        }
    })
    diceDescInput.addEventListener('input', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.description = diceDescInput.value.trim() || undefined
            saveAllChoiceData()
        }
    })

    diceMod.querySelector('#btn-add-dice-branch').addEventListener('click', () => {
        const dc = choice.getDiceCheck()
        if (!dc) return
        dc.branches.push({
            min: 1,
            max: 6,
            targetParagraphId: choice.getToParagraphId(),
            description: 'Nowy wynik',
        })
        renderBranches()
        saveAllChoiceData()
    })
    container.appendChild(diceMod)

    // 8. Szybkie akcje / Usuń
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
