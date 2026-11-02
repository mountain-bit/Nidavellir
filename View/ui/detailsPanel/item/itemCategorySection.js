import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

export const ITEM_CATEGORIES = [
    {
        id: 'weapon',
        key: 'details.item_category_weapon',
        fallback: 'Broń (weapon)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'armor',
        key: 'details.item_category_armor',
        fallback: 'Pancerz / Tarcza (armor)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'consumable',
        key: 'details.item_category_consumable',
        fallback: 'Mikstura / Prowiant (consumable)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'quest',
        key: 'details.item_category_quest',
        fallback: 'Klucz / Fabularny (quest)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'scroll',
        key: 'details.item_category_scroll',
        fallback: 'Zwój / Księga (scroll)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'artifact',
        key: 'details.item_category_artifact',
        fallback: 'Artefakt / Magiczny (artifact)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
    {
        id: 'misc',
        key: 'details.item_category_misc',
        fallback: 'Inne / Drobiazg (misc)',
        get label() {
            return tr(this.key, this.fallback)
        },
    },
]

/**
 * Returns localized categories list.
 *
 * @returns {Array<{ id: string, label: string }>}
 */
export function getItemCategories() {
    return ITEM_CATEGORIES.map(cat => ({
        id: cat.id,
        label: tr(cat.key, cat.fallback),
    }))
}

/**
 * Renders the HTML template string for Item Category & Consumable section.
 *
 * @param {object} [config={}] Inventory configuration { category, isConsumable }
 * @returns {string}
 */
export function renderItemCategoryHtml(config = {}) {
    const currentCategory = config?.category || 'misc'
    const isConsumable = Boolean(config?.isConsumable)
    const categories = getItemCategories()
    const hasPredefined = categories.some(c => c.id === currentCategory)

    const customLabel = tr('details.item_category_custom', 'własna')

    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.item_type_category', 'Kategoria i Typ')}</div>
        <div class="flex flex-col gap-2">
            <div>
                <label for="details-item-category-select" class="block text-[11px] text-zinc-400 mb-1">${tr('details.item_category_label', 'Kategoria przedmiotu:')}</label>
                <select id="details-item-category-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500">
                    ${categories
                        .map(
                            cat =>
                                `<option value="${cat.id}" ${currentCategory === cat.id ? 'selected' : ''}>${escapeHtml(cat.label)}</option>`
                        )
                        .join('')}
                    ${!hasPredefined && currentCategory ? `<option value="${escapeHtml(currentCategory)}" selected>${escapeHtml(currentCategory)} (${escapeHtml(customLabel)})</option>` : ''}
                </select>
            </div>
            <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5 select-none">
                <input id="details-item-is-consumable" type="checkbox" ${isConsumable ? 'checked' : ''} class="rounded accent-amber-500 cursor-pointer" />
                <span>${tr('details.item_consumable_label', 'Przedmiot jednorazowy (zużywa się / znika po użyciu)')}</span>
            </label>
        </div>
    `
}

/**
 * Creates the Category & Consumable Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {object} [config] Inventory configuration object
 * @param {object} [ctx] Application UI Context
 * @returns {HTMLElement}
 */
export function createItemCategorySection(entity, config, ctx) {
    const safeConfig =
        config ||
        (typeof entity?.getInventoryConfig === 'function'
            ? entity.getInventoryConfig()
            : entity?.inventoryConfig) ||
        {}
    const categoryMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        renderItemCategoryHtml(safeConfig)
    )

    const selCategory = categoryMod.querySelector('#details-item-category-select')
    const chkConsumable = categoryMod.querySelector('#details-item-is-consumable')

    if (!selCategory || !chkConsumable) {
        return categoryMod
    }

    if (safeConfig?.category) {
        selCategory.value = safeConfig.category
    }

    selCategory.addEventListener('change', () => {
        const newCat = selCategory.value
        if (entity) {
            if (typeof entity.setCategory === 'function') {
                entity.setCategory(newCat)
            } else if (typeof entity.getInventoryConfig === 'function') {
                const conf = entity.getInventoryConfig()
                if (conf) conf.category = newCat
            } else if (entity.inventoryConfig) {
                entity.inventoryConfig.category = newCat
            }
        }
        if (safeConfig) {
            safeConfig.category = newCat
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    chkConsumable.addEventListener('change', () => {
        const val = chkConsumable.checked
        if (entity) {
            if (typeof entity.setIsConsumable === 'function') {
                entity.setIsConsumable(val)
            } else if (typeof entity.getInventoryConfig === 'function') {
                const conf = entity.getInventoryConfig()
                if (conf) conf.isConsumable = val
            } else if (entity.inventoryConfig) {
                entity.inventoryConfig.isConsumable = val
            }
        }
        if (safeConfig) {
            safeConfig.isConsumable = val
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    return categoryMod
}
