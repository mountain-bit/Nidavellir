import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Renders custom attributes key-value editing module.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderCustomAttributesModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getCustomAttributes || !entity.setCustomAttributes) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const customAttrs = entity.getCustomAttributes() || []

    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.custom_attributes')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${customAttrs.length}</span>
        </div>
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${customAttrs.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_custom_attributes')}</span>` : ''}
        </div>
        <div class="flex gap-1.5 pt-1 items-center">
            <input type="text" id="details-add-attr-name" placeholder="${t('details.attr_name_placeholder')}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <input type="text" id="details-add-attr-val" placeholder="${t('details.attr_value_placeholder')}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <button id="btn-details-add-attr" type="button" class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white font-medium cursor-pointer shrink-0">
                ${t('buttons.add')}
            </button>
        </div>
    `
    )

    const attrsListEl = customMod.querySelector('#details-custom-attrs-list')
    customAttrs.forEach((attr, idx) => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <input type="text" class="attr-name-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${escapeHtml(attr.name)}" />
            <span class="text-gray-500 font-mono">:</span>
            <input type="text" class="attr-val-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${escapeHtml(String(attr.value))}" />
            <button type="button" class="btn-remove-attr text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        `

        const nameInput = row.querySelector('.attr-name-input')
        const valInput = row.querySelector('.attr-val-input')
        const saveAttr = () => {
            attr.name = nameInput.value.trim()
            attr.value = valInput.value.trim()
            entity.setCustomAttributes(customAttrs)
            ctx.refreshActiveSection(type)
        }
        nameInput.addEventListener('change', saveAttr)
        valInput.addEventListener('change', saveAttr)

        row.querySelector('.btn-remove-attr').addEventListener('click', () => {
            customAttrs.splice(idx, 1)
            entity.setCustomAttributes(customAttrs)
            refreshDetails()
            ctx.refreshActiveSection(type)
        })

        attrsListEl.appendChild(row)
    })

    const newNameInput = customMod.querySelector('#details-add-attr-name')
    const newValInput = customMod.querySelector('#details-add-attr-val')
    const addBtn = customMod.querySelector('#btn-details-add-attr')

    const handleAddAttr = () => {
        const aName = newNameInput.value.trim()
        const aVal = newValInput.value.trim()
        if (!aName) return
        entity.setCustomAttributes([...customAttrs, { name: aName, value: aVal }])
        refreshDetails()
        ctx.refreshActiveSection(type)
    }

    addBtn.addEventListener('click', handleAddAttr)
    newNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })
    newValInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })

    container.appendChild(customMod)
}
