import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Renders the HTML template string for Item Modifiers Section.
 *
 * @param {number} [modifiersCount=0]
 * @returns {string}
 */
export function renderItemModifiersHtml(modifiersCount = 0) {
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_modifiers', 'Modyfikatory RPG')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono" id="details-item-mod-count">${modifiersCount}</span>
        </div>

        <div id="details-item-modifiers-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>

        <!-- Add Modifier Form -->
        <div class="bg-[#141416] p-2.5 rounded border border-zinc-800/80 space-y-2">
            <div class="text-[11px] font-medium text-zinc-300">${tr('details.item_mod_add_title', 'Dodaj nowy modyfikator:')}</div>
            <div class="grid grid-cols-2 gap-1.5">
                <div>
                    <label for="details-mod-type" class="block text-[10px] text-zinc-400 mb-0.5">${tr('details.item_mod_target_type', 'Typ celu:')}</label>
                    <select id="details-mod-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                        <option value="stat">${tr('details.item_mod_type_stat', 'Statystyka (Cecha)')}</option>
                        <option value="parameter">${tr('details.item_mod_type_parameter', 'Parametr (Witalność)')}</option>
                        <option value="skill">${tr('details.item_mod_type_skill', 'Umiejętność')}</option>
                        <option value="feature">${tr('details.item_mod_type_feature', 'Cecha specjalna')}</option>
                        <option value="custom">${tr('details.item_mod_type_custom', 'Własny atrybut')}</option>
                    </select>
                </div>
                <div>
                    <label for="details-mod-target" class="block text-[10px] text-zinc-400 mb-0.5">${tr('details.item_mod_target_name', 'Nazwa celu:')}</label>
                    <input id="details-mod-target" type="text" placeholder="${tr('details.item_mod_target_placeholder', 'np. Siła, Zdrowie...')}" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
            </div>

            <div class="flex gap-1.5 items-end">
                <div class="w-20 shrink-0">
                    <label for="details-mod-operator" class="block text-[10px] text-zinc-400 mb-0.5">${tr('details.item_mod_operator', 'Operator:')}</label>
                    <select id="details-mod-operator" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center">
                        <option value="+">+ (${tr('details.item_mod_op_add', 'dodaj')})</option>
                        <option value="-">- (${tr('details.item_mod_op_sub', 'odejmij')})</option>
                        <option value="=">= (${tr('details.item_mod_op_set', 'ustaw')})</option>
                    </select>
                </div>
                <div class="flex-1 min-w-0">
                    <label for="details-mod-value" class="block text-[10px] text-zinc-400 mb-0.5">${tr('details.item_mod_value', 'Wartość:')}</label>
                    <input id="details-mod-value" type="text" placeholder="${tr('details.item_mod_value_placeholder', 'np. 4 lub +10%')}" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono" />
                </div>
                <button id="btn-add-item-modifier" type="button" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm shrink-0">
                    + ${tr('details.add', 'Dodaj')}
                </button>
            </div>
        </div>
    `
}

/**
 * Renders HTML for a single modifier item card.
 *
 * @param {object} mod Modifier object
 * @returns {string}
 */
export function renderModifierCardHtml(mod = {}) {
    const targetType = mod?.targetType || 'stat'
    const targetName = mod?.targetName || ''
    const operator = mod?.operator || '+'
    const rawVal = mod?.value ?? ''

    const sign =
        operator === '+' && typeof rawVal === 'number' && rawVal > 0
            ? '+'
            : operator === '='
              ? '='
              : ''

    const removeTitle = tr('details.remove_modifier', 'Usuń modyfikator')

    return `
        <div class="flex items-center gap-1.5 min-w-0">
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">${escapeHtml(targetType)}</span>
            <span class="font-medium text-white truncate">${escapeHtml(targetName)}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-700/50">${sign}${escapeHtml(String(rawVal))}</span>
            <button type="button" class="btn-remove-mod text-zinc-400 hover:text-red-400 cursor-pointer transition-colors p-0.5" title="${escapeHtml(removeTitle)}">
                ${getIconSvg('close', 'w-3 h-3')}
            </button>
        </div>
    `
}

/**
 * Creates a DOM element representing a modifier card.
 *
 * @param {object} mod Modifier object
 * @param {Function} [onRemove] Callback when modifier is removed
 * @returns {HTMLDivElement}
 */
export function createModifierCard(mod, onRemove) {
    const card = document.createElement('div')
    card.className =
        'flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
    card.innerHTML = renderModifierCardHtml(mod)

    const removeBtn = card.querySelector('.btn-remove-mod')
    if (removeBtn && typeof onRemove === 'function') {
        removeBtn.addEventListener('click', () => onRemove(mod?.id))
    }

    return card
}

/**
 * Creates the RPG Modifiers Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {Array} [currentModifiers]
 * @param {object} [ctx] Application UI Context
 * @returns {HTMLElement}
 */
export function createItemModifiersSection(entity, currentModifiers, ctx) {
    const safeModifiers = Array.isArray(currentModifiers)
        ? currentModifiers
        : (typeof entity?.getModifiers === 'function'
              ? entity.getModifiers()
              : entity?.modifiers) || []

    const modifiersMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        renderItemModifiersHtml(safeModifiers.length)
    )

    const modifiersListEl = modifiersMod.querySelector('#details-item-modifiers-list')
    const modCountEl = modifiersMod.querySelector('#details-item-mod-count')
    const selModType = modifiersMod.querySelector('#details-mod-type')
    const inpModTarget = modifiersMod.querySelector('#details-mod-target')
    const selModOp = modifiersMod.querySelector('#details-mod-operator')
    const inpModValue = modifiersMod.querySelector('#details-mod-value')
    const btnAddMod = modifiersMod.querySelector('#btn-add-item-modifier')

    if (
        !modifiersListEl ||
        !selModType ||
        !inpModTarget ||
        !selModOp ||
        !inpModValue ||
        !btnAddMod
    ) {
        return modifiersMod
    }

    const renderModifiersList = () => {
        modifiersListEl.innerHTML = ''
        const mods =
            (typeof entity?.getModifiers === 'function'
                ? entity.getModifiers()
                : entity?.modifiers) || []

        if (modCountEl) {
            modCountEl.textContent = String(mods.length)
        }

        if (mods.length === 0) {
            modifiersListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_modifiers', 'Brak modyfikatorów RPG')}</span>`
            return
        }

        mods.forEach(mod => {
            if (!mod) return
            const card = createModifierCard(mod, modId => {
                if (entity) {
                    if (typeof entity.removeModifier === 'function') {
                        entity.removeModifier(modId)
                    } else if (Array.isArray(entity.modifiers)) {
                        entity.modifiers = entity.modifiers.filter(m => m?.id !== modId)
                    }
                }
                if (typeof ctx?.markDirty === 'function') ctx.markDirty()
                renderModifiersList()
            })
            modifiersListEl.appendChild(card)
        })
    }

    btnAddMod.addEventListener('click', () => {
        const targetName = inpModTarget.value.trim()
        const rawVal = inpModValue.value.trim()
        if (!targetName || !rawVal) return

        const numVal = Number(rawVal)
        const finalVal = isNaN(numVal) ? rawVal : numVal

        const newMod = {
            id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            targetType: selModType.value,
            targetName,
            operator: selModOp.value,
            value: finalVal,
        }

        if (entity) {
            if (typeof entity.addModifier === 'function') {
                entity.addModifier(newMod)
            } else if (Array.isArray(entity.modifiers)) {
                entity.modifiers.push(newMod)
            }
        }

        inpModTarget.value = ''
        inpModValue.value = ''
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        renderModifiersList()
    })

    renderModifiersList()
    return modifiersMod
}
