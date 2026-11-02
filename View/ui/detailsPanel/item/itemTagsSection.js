import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Renders the HTML template string for Item Tags Section.
 *
 * @param {number} [tagCount=0]
 * @returns {string}
 */
export function renderItemTagsHtml(tagCount = 0) {
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('tag', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.tags', 'Tagi')}</span>
            </span>
            <span id="details-item-tags-count" class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${tagCount}</span>
        </div>
        <div id="details-item-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-item-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                <option value="">-- ${tr('details.select_tag', 'Wybierz tag z projektu...')} --</option>
            </select>
            <button id="btn-details-add-item-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm">
                ${tr('details.add_tag', '+ Tag')}
            </button>
        </div>
    `
}

/**
 * Renders HTML for a single tag chip inside the tags list.
 *
 * @param {string} [name='']
 * @param {string} [removeTitle='']
 * @returns {string}
 */
export function renderTagChipHtml(name = '', removeTitle = '') {
    const titleAttr = removeTitle || tr('details.remove_tag', 'Usuń tag')
    return `
        <span>#${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-tag hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="${escapeHtml(titleAttr)}">
            ${getIconSvg('close', 'w-2.5 h-2.5')}
        </button>
    `
}

/**
 * Creates a DOM element representing a tag chip.
 *
 * @param {object} tObj Tag entity or object
 * @param {Function} [onRemove] Callback when tag is removed
 * @returns {HTMLSpanElement}
 */
export function createTagChip(tObj, onRemove) {
    const tId = typeof tObj?.getId === 'function' ? tObj.getId() : tObj?.id || ''
    const tName = typeof tObj?.getName === 'function' ? tObj.getName() : tObj?.name || tId
    const tColor =
        (typeof tObj?.getColor === 'function' ? tObj.getColor() : tObj?.color) || '#3b82f6'

    const chip = document.createElement('span')
    chip.className =
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm'
    chip.style.backgroundColor = tColor
    chip.innerHTML = renderTagChipHtml(tName)

    const removeBtn = chip.querySelector('.btn-remove-tag')
    if (removeBtn && typeof onRemove === 'function') {
        removeBtn.addEventListener('click', () => onRemove(tId, tName))
    }

    return chip
}

/**
 * Creates the Tags Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {Array} [currentTags]
 * @param {object} [ctx] Application UI Context
 * @returns {HTMLElement}
 */
export function createItemTagsSection(entity, currentTags, ctx) {
    const safeTags = Array.isArray(currentTags)
        ? currentTags
        : (typeof entity?.getTags === 'function' ? entity.getTags() : entity?.tags) || []

    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderItemTagsHtml(safeTags.length)
    )

    const tagsListEl = tagsMod.querySelector('#details-item-tags-list')
    const countBadgeEl = tagsMod.querySelector('#details-item-tags-count')
    const selTag = tagsMod.querySelector('#details-add-item-tag-select')
    const btnAddTag = tagsMod.querySelector('#btn-details-add-item-tag')

    if (!tagsListEl || !selTag || !btnAddTag) {
        return tagsMod
    }

    const renderTagsList = () => {
        tagsListEl.innerHTML = ''
        const tags = (typeof entity?.getTags === 'function' ? entity.getTags() : entity?.tags) || []

        if (countBadgeEl) {
            countBadgeEl.textContent = String(tags.length)
        }

        if (tags.length === 0) {
            tagsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_tags', 'Brak przypisanych tagów')}</span>`
            return
        }

        tags.forEach(tObj => {
            if (!tObj) return
            const chip = createTagChip(tObj, (tId, tName) => {
                if (entity) {
                    if (typeof entity.removeTag === 'function') {
                        entity.removeTag(tId)
                    } else if (Array.isArray(entity.tags)) {
                        entity.tags = entity.tags.filter(
                            t =>
                                (t?.id || t?.getId?.()) !== tId &&
                                (t?.name || t?.getName?.()) !== tName
                        )
                    }
                }
                if (typeof ctx?.markDirty === 'function') ctx.markDirty()
                renderTagsList()
            })
            tagsListEl.appendChild(chip)
        })
    }

    // Populate project tags select
    const projectTags = ctx?.projectTags || []
    projectTags.forEach(tObj => {
        if (!tObj) return
        const tId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id || ''
        const tName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || tId
        const opt = document.createElement('option')
        opt.value = tId
        opt.textContent = `#${tName}`
        selTag.appendChild(opt)
    })

    btnAddTag.addEventListener('click', () => {
        const selectedId = selTag.value
        if (!selectedId) return
        const found = projectTags.find(
            t => (typeof t?.getId === 'function' ? t.getId() : t?.id) === selectedId
        )
        if (found) {
            if (entity) {
                if (typeof entity.addTag === 'function') {
                    entity.addTag(found)
                } else if (Array.isArray(entity.tags)) {
                    if (!entity.tags.some(t => (t?.id || t?.getId?.()) === selectedId)) {
                        entity.tags.push(found)
                    }
                }
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
            selTag.value = ''
            renderTagsList()
        }
    })

    renderTagsList()
    return tagsMod
}
