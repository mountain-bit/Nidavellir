import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
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
        `
        <label for="details-item-name-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.name', 'Nazwa')}</label>
        <input
            id="details-item-name-input"
            type="text"
            value="${escapeHtml(itemName)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            placeholder="${tr('details.item_name_placeholder', 'Wpisz nazwę przedmiotu...')}"
        />
        <div id="details-item-name-error" class="hidden text-[11px] text-red-400 pt-0.5"></div>
    `
    )

    const nameInput = nameMod.querySelector('#details-item-name-input')
    const nameError = nameMod.querySelector('#details-item-name-error')

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = 'Nazwa przedmiotu nie może być pusta'
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        // Collision check across other project items
        const allItems = ctx?.projectItems || []
        const collision = allItems.some(
            it =>
                (typeof it.getId === 'function' ? it.getId() : it.id) !== itemId &&
                (typeof it.getName === 'function' ? it.getName() : it.name).toLowerCase() ===
                    val.toLowerCase()
        )

        if (collision) {
            nameError.textContent = `Przedmiot o nazwie "${val}" już istnieje w projekcie`
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')

        if (typeof entity.setName === 'function') {
            entity.setName(val)
        } else {
            entity.name = val
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
