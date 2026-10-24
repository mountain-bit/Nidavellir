import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Creates the Tags Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {Array} currentTags
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemTagsSection(entity, currentTags, ctx) {
    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('tag', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.tags', 'Tagi')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentTags.length}</span>
        </div>
        <div id="details-item-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-item-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                <option value="">-- ${tr('details.select_tag', 'Wybierz tag z projektu...')} --</option>
            </select>
            <button id="btn-details-add-item-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm">
                + Tag
            </button>
        </div>
    `
    )

    const tagsListEl = tagsMod.querySelector('#details-item-tags-list')
    const selTag = tagsMod.querySelector('#details-add-item-tag-select')
    const btnAddTag = tagsMod.querySelector('#btn-details-add-item-tag')

    const renderTagsList = () => {
        tagsListEl.innerHTML = ''
        const tags = typeof entity.getTags === 'function' ? entity.getTags() : entity.tags || []
        if (tags.length === 0) {
            tagsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_tags', 'Brak przypisanych tagów')}</span>`
            return
        }

        tags.forEach(tObj => {
            const tId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id
            const tName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name
            const tColor =
                (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) || '#3b82f6'

            const chip = document.createElement('span')
            chip.className =
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm'
            chip.style.backgroundColor = tColor
            chip.innerHTML = `
                <span>#${escapeHtml(tName)}</span>
                <button type="button" class="btn-remove-tag hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="Usuń tag">
                    ${getIconSvg('close', 'w-2.5 h-2.5')}
                </button>
            `
            chip.querySelector('.btn-remove-tag').addEventListener('click', () => {
                if (typeof entity.removeTag === 'function') {
                    entity.removeTag(tId)
                } else if (Array.isArray(entity.tags)) {
                    entity.tags = entity.tags.filter(t => t.id !== tId && t.name !== tName)
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
        const tId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id
        const tName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name
        const opt = document.createElement('option')
        opt.value = tId
        opt.textContent = `#${tName}`
        selTag.appendChild(opt)
    })

    btnAddTag.addEventListener('click', () => {
        const selectedId = selTag.value
        if (!selectedId) return
        const found = projectTags.find(
            t => (typeof t.getId === 'function' ? t.getId() : t.id) === selectedId
        )
        if (found) {
            if (typeof entity.addTag === 'function') {
                entity.addTag(found)
            } else if (Array.isArray(entity.tags)) {
                if (!entity.tags.some(t => t.id === selectedId)) entity.tags.push(found)
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
            selTag.value = ''
            renderTagsList()
        }
    })

    renderTagsList()
    return tagsMod
}
