/**
 * @fileoverview Custom attributes module for editing dynamic key-value properties of entities.
 * Provides pure HTML template renderers and DOM interaction handlers with full i18n and XSS safety.
 *
 * @module customAttributesModule
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Renders the header for custom attributes section with count badge.
 *
 * @param {number} [count=0]
 * @returns {string} HTML string
 */
export function renderCustomAttributesHeaderHtml(count = 0) {
    const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.custom_attributes')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${safeCount}</span>
        </div>`
}

/**
 * Renders the empty state message when no custom attributes exist.
 *
 * @returns {string} HTML string
 */
export function renderEmptyCustomAttributesHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_custom_attributes')}</span>`
}

/**
 * Renders a single custom attribute row with editable name and value inputs and a remove button.
 *
 * @param {{ name?: string, value?: string | number }} [attr]
 * @param {number} [index=0]
 * @returns {string} HTML string
 */
export function renderCustomAttributeRowHtml(attr, index = 0) {
    const safeName = escapeHtml(attr?.name ?? '')
    const safeValue = escapeHtml(String(attr?.value ?? ''))
    const safeIndex = Number.isFinite(index) ? index : 0
    const namePlaceholder = escapeHtml(t('details.attr_name_placeholder'))
    const valPlaceholder = escapeHtml(t('details.attr_value_placeholder'))
    const deleteLabel = escapeHtml(t('buttons.delete'))

    return `
        <div class="flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs" data-attr-index="${safeIndex}">
            <input type="text" class="attr-name-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${safeName}" placeholder="${namePlaceholder}" aria-label="${namePlaceholder}" />
            <span class="text-gray-500 font-mono">:</span>
            <input type="text" class="attr-val-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${safeValue}" placeholder="${valPlaceholder}" aria-label="${valPlaceholder}" />
            <button type="button" class="btn-remove-attr text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center shrink-0" title="${deleteLabel}" aria-label="${deleteLabel}">${getIconSvg('close', 'w-3 h-3')}</button>
        </div>`
}

/**
 * Renders the input bar for adding a new custom attribute.
 *
 * @returns {string} HTML string
 */
export function renderAddCustomAttributeBarHtml() {
    const namePlaceholder = escapeHtml(t('details.attr_name_placeholder'))
    const valPlaceholder = escapeHtml(t('details.attr_value_placeholder'))
    const addLabel = escapeHtml(t('buttons.add'))

    return `
        <div class="flex gap-1.5 pt-1 items-center">
            <input type="text" id="details-add-attr-name" placeholder="${namePlaceholder}" aria-label="${namePlaceholder}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <input type="text" id="details-add-attr-val" placeholder="${valPlaceholder}" aria-label="${valPlaceholder}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <button id="btn-details-add-attr" type="button" class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white font-medium cursor-pointer shrink-0">
                ${addLabel}
            </button>
        </div>`
}

/**
 * Renders the full inner HTML of the custom attributes section.
 *
 * @param {Array<{ name?: string, value?: string | number }>} [customAttrs=[]]
 * @returns {string} HTML string
 */
export function renderCustomAttributesSectionHtml(customAttrs = []) {
    const attrs = Array.isArray(customAttrs) ? customAttrs : []
    const rowsHtml =
        attrs.length === 0
            ? renderEmptyCustomAttributesHtml()
            : attrs.map((attr, idx) => renderCustomAttributeRowHtml(attr, idx)).join('')

    return `
        ${renderCustomAttributesHeaderHtml(attrs.length)}
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${rowsHtml}
        </div>
        ${renderAddCustomAttributeBarHtml()}
    `
}

/**
 * Renders custom attributes key-value editing module in the details panel.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} [type='']
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null if invalid inputs
 */
export function renderCustomAttributesModule(
    container,
    entity,
    type = '',
    ctx = {},
    onRefreshDetails = null
) {
    if (!container || !entity) return null
    if (
        typeof entity.getCustomAttributes !== 'function' ||
        typeof entity.setCustomAttributes !== 'function'
    ) {
        return null
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const rawAttrs = entity.getCustomAttributes()
    const customAttrs = Array.isArray(rawAttrs) ? [...rawAttrs] : []

    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderCustomAttributesSectionHtml(customAttrs)
    )

    const rows = customMod.querySelectorAll('[data-attr-index]')
    rows.forEach(row => {
        const idx = Number(row.getAttribute('data-attr-index'))
        const targetAttr = customAttrs[idx]
        if (!targetAttr) return

        const nameInput = row.querySelector('.attr-name-input')
        const valInput = row.querySelector('.attr-val-input')
        const removeBtn = row.querySelector('.btn-remove-attr')

        const saveAttr = () => {
            if (nameInput) targetAttr.name = nameInput.value.trim()
            if (valInput) targetAttr.value = valInput.value.trim()
            entity.setCustomAttributes(customAttrs)
            ctx?.refreshActiveSection?.(type)
        }

        nameInput?.addEventListener('change', saveAttr)
        valInput?.addEventListener('change', saveAttr)

        removeBtn?.addEventListener('click', () => {
            const updated = customAttrs.filter((_, i) => i !== idx)
            entity.setCustomAttributes(updated)
            refreshDetails()
            ctx?.refreshActiveSection?.(type)
        })
    })

    const newNameInput = customMod.querySelector('#details-add-attr-name')
    const newValInput = customMod.querySelector('#details-add-attr-val')
    const addBtn = customMod.querySelector('#btn-details-add-attr')

    const handleAddAttr = () => {
        const aName = newNameInput?.value?.trim() ?? ''
        const aVal = newValInput?.value?.trim() ?? ''
        if (!aName) return

        entity.setCustomAttributes([...customAttrs, { name: aName, value: aVal }])
        if (newNameInput) newNameInput.value = ''
        if (newValInput) newValInput.value = ''
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    }

    addBtn?.addEventListener('click', handleAddAttr)
    newNameInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })
    newValInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })

    container.appendChild(customMod)
    return customMod
}
