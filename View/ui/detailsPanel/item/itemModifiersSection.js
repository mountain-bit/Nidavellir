import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Creates the RPG Modifiers Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {Array} currentModifiers
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemModifiersSection(entity, currentModifiers, ctx) {
    const modifiersMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400 shrink-0 inline-flex items-center">${getIconSvg('stats', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_modifiers', 'Modyfikatory RPG')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono" id="details-item-mod-count">${currentModifiers.length}</span>
        </div>

        <div id="details-item-modifiers-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>

        <!-- Add Modifier Form -->
        <div class="bg-[#141416] p-2.5 rounded border border-zinc-800/80 space-y-2">
            <div class="text-[11px] font-medium text-zinc-300">Dodaj nowy modyfikator:</div>
            <div class="grid grid-cols-2 gap-1.5">
                <div>
                    <label for="details-mod-type" class="block text-[10px] text-zinc-400 mb-0.5">Typ celu:</label>
                    <select id="details-mod-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                        <option value="stat">Statystyka (Cecha)</option>
                        <option value="parameter">Parametr (Witalność)</option>
                        <option value="skill">Umiejętność</option>
                        <option value="feature">Cecha specjalna</option>
                        <option value="custom">Własny atrybut</option>
                    </select>
                </div>
                <div>
                    <label for="details-mod-target" class="block text-[10px] text-zinc-400 mb-0.5">Nazwa celu:</label>
                    <input id="details-mod-target" type="text" placeholder="np. Siła, Zdrowie..." class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
            </div>

            <div class="flex gap-1.5 items-end">
                <div class="w-20 shrink-0">
                    <label for="details-mod-operator" class="block text-[10px] text-zinc-400 mb-0.5">Operator:</label>
                    <select id="details-mod-operator" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center">
                        <option value="+">+ (dodaj)</option>
                        <option value="-">- (odejmij)</option>
                        <option value="=">= (ustaw)</option>
                    </select>
                </div>
                <div class="flex-1 min-w-0">
                    <label for="details-mod-value" class="block text-[10px] text-zinc-400 mb-0.5">Wartość:</label>
                    <input id="details-mod-value" type="text" placeholder="np. 4 lub +10%" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono" />
                </div>
                <button id="btn-add-item-modifier" type="button" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm shrink-0">
                    + Dodaj
                </button>
            </div>
        </div>
    `
    )

    const modifiersListEl = modifiersMod.querySelector('#details-item-modifiers-list')
    const modCountEl = modifiersMod.querySelector('#details-item-mod-count')
    const selModType = modifiersMod.querySelector('#details-mod-type')
    const inpModTarget = modifiersMod.querySelector('#details-mod-target')
    const selModOp = modifiersMod.querySelector('#details-mod-operator')
    const inpModValue = modifiersMod.querySelector('#details-mod-value')
    const btnAddMod = modifiersMod.querySelector('#btn-add-item-modifier')

    const renderModifiersList = () => {
        modifiersListEl.innerHTML = ''
        const mods =
            typeof entity.getModifiers === 'function'
                ? entity.getModifiers()
                : entity.modifiers || []
        modCountEl.textContent = String(mods.length)

        if (mods.length === 0) {
            modifiersListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_modifiers', 'Brak modyfikatorów RPG')}</span>`
            return
        }

        mods.forEach(mod => {
            const card = document.createElement('div')
            card.className =
                'flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'

            const sign =
                mod.operator === '+' && typeof mod.value === 'number' && mod.value > 0
                    ? '+'
                    : mod.operator === '='
                      ? '='
                      : ''

            card.innerHTML = `
                <div class="flex items-center gap-1.5 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">${escapeHtml(mod.targetType || 'stat')}</span>
                    <span class="font-medium text-white truncate">${escapeHtml(mod.targetName)}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-700/50">${sign}${escapeHtml(String(mod.value))}</span>
                    <button type="button" class="btn-remove-mod text-zinc-400 hover:text-red-400 cursor-pointer transition-colors p-0.5" title="Usuń modyfikator">
                        ${getIconSvg('close', 'w-3 h-3')}
                    </button>
                </div>
            `

            card.querySelector('.btn-remove-mod').addEventListener('click', () => {
                if (typeof entity.removeModifier === 'function') {
                    entity.removeModifier(mod.id)
                } else if (Array.isArray(entity.modifiers)) {
                    entity.modifiers = entity.modifiers.filter(m => m.id !== mod.id)
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

        if (typeof entity.addModifier === 'function') {
            entity.addModifier(newMod)
        } else if (Array.isArray(entity.modifiers)) {
            entity.modifiers.push(newMod)
        }

        inpModTarget.value = ''
        inpModValue.value = ''
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        renderModifiersList()
    })

    renderModifiersList()
    return modifiersMod
}
