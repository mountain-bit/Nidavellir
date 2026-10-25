import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

export const ITEM_CATEGORIES = [
    { id: 'weapon', label: 'Broń (weapon)' },
    { id: 'armor', label: 'Pancerz / Tarcza (armor)' },
    { id: 'consumable', label: 'Mikstura / Prowiant (consumable)' },
    { id: 'quest', label: 'Klucz / Fabularny (quest)' },
    { id: 'scroll', label: 'Zwój / Księga (scroll)' },
    { id: 'artifact', label: 'Artefakt / Magiczny (artifact)' },
    { id: 'misc', label: 'Inne / Drobiazg (misc)' },
]

/**
 * Creates the Category & Consumable Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {object} config Inventory configuration object
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemCategorySection(entity, config, ctx) {
    const categoryMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.item_type_category', 'Kategoria i Typ')}</div>
        <div class="flex flex-col gap-2">
            <div>
                <label for="details-item-category-select" class="block text-[11px] text-zinc-400 mb-1">Kategoria przedmiotu:</label>
                <select id="details-item-category-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500">
                    ${ITEM_CATEGORIES.map(
                        cat =>
                            `<option value="${cat.id}" ${config.category === cat.id ? 'selected' : ''}>${escapeHtml(cat.label)}</option>`
                    ).join('')}
                    ${!ITEM_CATEGORIES.some(c => c.id === config.category) ? `<option value="${escapeHtml(config.category)}" selected>${escapeHtml(config.category)} (własna)</option>` : ''}
                </select>
            </div>
            <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5 select-none">
                <input id="details-item-is-consumable" type="checkbox" ${config.isConsumable ? 'checked' : ''} class="rounded accent-amber-500 cursor-pointer" />
                <span>${tr('details.item_consumable_label', 'Przedmiot jednorazowy (zużywa się / znika po użyciu)')}</span>
            </label>
        </div>
    `
    )

    const selCategory = categoryMod.querySelector('#details-item-category-select')
    const chkConsumable = categoryMod.querySelector('#details-item-is-consumable')

    selCategory.addEventListener('change', () => {
        const newCat = selCategory.value
        if (typeof entity.setCategory === 'function') {
            entity.setCategory(newCat)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.category = newCat
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    chkConsumable.addEventListener('change', () => {
        const val = chkConsumable.checked
        if (typeof entity.setIsConsumable === 'function') {
            entity.setIsConsumable(val)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.isConsumable = val
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    return categoryMod
}
