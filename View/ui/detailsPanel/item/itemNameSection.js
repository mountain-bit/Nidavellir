import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback, params) {
    const val = t(key, params)
    if (val && val !== key) return val
    if (typeof fallback === 'string' && params) {
        return fallback.replace(/\{\{(\w+)\}\}/g, (_, k) =>
            params[k] !== undefined ? params[k] : `{{${k}}}`
        )
    }
    return fallback
}

/**
 * Checks whether an item name conflicts with another item in the project.
 *
 * @param {string} val Name to check
 * @param {string} currentItemId ID of current item being edited
 * @param {Array<object>} allItems List of all project items
 * @returns {boolean} True if collision detected, false otherwise
 */
export function checkItemNameCollision(val, currentItemId, allItems = []) {
    if (!val || typeof val !== 'string') return false
    const trimmedLower = val.trim().toLowerCase()
    if (!trimmedLower) return false

    return (allItems || []).some(it => {
        if (!it) return false
        const itId = typeof it.getId === 'function' ? it.getId() : it.id
        if (itId === currentItemId) return false
        const rawName = typeof it.getName === 'function' ? it.getName() : it.name
        const itName = typeof rawName === 'string' ? rawName.trim().toLowerCase() : ''
        return itName === trimmedLower
    })
}

/**
 * Renders the HTML template string for Item Name section.
 *
 * @param {string} itemName
 * @returns {string}
 */
export function renderItemNameHtml(itemName = '') {
    return `
        <label for="details-item-name-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.name', 'Nazwa')}</label>
        <input
            id="details-item-name-input"
            type="text"
            value="${escapeHtml(itemName || '')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            placeholder="${tr('details.item_name_placeholder', 'Wpisz nazwę przedmiotu...')}"
        />
        <div id="details-item-name-error" class="hidden text-[11px] text-red-400 pt-0.5"></div>
    `
}

/**
 * Creates the Name & Collision Validation Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} itemId
 * @param {string} itemName
 * @param {object} item The history item wrapper { id, name, type, entity }
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemNameSection(entity, itemId, itemName, item, ctx) {
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderItemNameHtml(itemName)
    )

    const nameInput = nameMod.querySelector('#details-item-name-input')
    const nameError = nameMod.querySelector('#details-item-name-error')

    if (!nameInput || !nameError) {
        return nameMod
    }

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = tr(
                'details.item_name_required',
                'Nazwa przedmiotu nie może być pusta'
            )
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        // Collision check across other project items
        const allItems = ctx?.projectItems || []
        const collision = checkItemNameCollision(val, itemId, allItems)

        if (collision) {
            nameError.textContent = tr(
                'details.item_name_collision',
                'Przedmiot o nazwie "{{name}}" już istnieje w projekcie',
                { name: val }
            )
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')

        if (entity) {
            if (typeof entity.setName === 'function') {
                entity.setName(val)
            } else {
                entity.name = val
            }
        }
        if (item) {
            item.name = val
        }

        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        if (typeof ctx?.refreshActiveSection === 'function') ctx.refreshActiveSection('item')
        return true
    }

    nameInput.addEventListener('input', validateAndSaveName)

    return nameMod
}
