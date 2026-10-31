/**
 * Shared Helper Functions for Read-Only Details Panels
 */

import { DEFAULT_TAG_COLOR } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Safely reads a string or value property from an entity that might be an instance or plain object.
 *
 * @param {object} entity
 * @param {string} getterName
 * @param {string} fieldName
 * @param {any} [defaultValue='']
 * @returns {any}
 */
export function getEntityProp(entity, getterName, fieldName, defaultValue = '') {
    if (!entity) return defaultValue
    if (typeof entity[getterName] === 'function') {
        const val = entity[getterName]()
        return val !== undefined && val !== null ? val : defaultValue
    }
    return entity[fieldName] !== undefined && entity[fieldName] !== null
        ? entity[fieldName]
        : defaultValue
}

/**
 * Safely reads an array collection from an entity.
 *
 * @param {object} entity
 * @param {string} getterName
 * @param {string} fieldName
 * @returns {Array<any>}
 */
export function getEntityList(entity, getterName, fieldName) {
    if (!entity) return []
    if (typeof entity[getterName] === 'function') {
        const list = entity[getterName]()
        return Array.isArray(list) ? list : []
    }
    return Array.isArray(entity[fieldName]) ? entity[fieldName] : []
}

/**
 * Extracts summary and narrative text from an entity's description/content.
 *
 * @param {object} entity
 * @returns {{ currentSummary: string, currentNarrative: string }}
 */
export function getEntityDescription(entity) {
    if (!entity) return { currentSummary: '', currentNarrative: '' }

    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : entity.description

    const currentSummary =
        (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : desc?.summary) ||
        entity.summary ||
        ''
    const currentNarrative =
        (desc && typeof desc.getText === 'function' ? desc.getText() : desc?.text) || ''

    return { currentSummary, currentNarrative }
}

/**
 * Generates HTML chips for a list of tags.
 *
 * @param {Array<object>} tagsList
 * @returns {string}
 */
export function renderTagChips(tagsList = []) {
    return tagsList
        .map(tObj => {
            const tagName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || tObj
            const tagColor =
                (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) ||
                DEFAULT_TAG_COLOR
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm" style="background-color: ${escapeHtml(tagColor)}">#${escapeHtml(tagName)}</span>`
        })
        .join('')
}

/**
 * Generates HTML rows for key-value custom attributes.
 *
 * @param {Array<{ name: string, value: any }>} customAttrs
 * @returns {string}
 */
export function renderCustomAttributeRows(customAttrs = []) {
    return customAttrs
        .map(
            attr => `
        <div class="flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="font-medium text-[#d4d4d8] truncate">${escapeHtml(attr.name)}</span>
            <span class="text-gray-500 font-mono">:</span>
            <span class="font-mono text-white text-right truncate">${escapeHtml(String(attr.value))}</span>
        </div>
    `
        )
        .join('')
}

/**
 * Handles selecting an item entity in the UI or ViewModel.
 *
 * @param {object} ctx
 * @param {object} item
 */
export function selectItemEntity(ctx, item) {
    if (!item) return
    const itId = typeof item.getId === 'function' ? item.getId() : item.id || item.name
    const projectItem =
        (ctx?.projectItems || []).find(
            p =>
                (typeof p.getId === 'function' ? p.getId() : p.id) === itId ||
                (typeof p.getName === 'function' ? p.getName() : p.name) === itId
        ) || item

    if (typeof ctx?.selectEntity === 'function') {
        ctx.selectEntity(projectItem, 'item')
    } else if (ctx?.vm) {
        const selection = ctx?.vm?.selection
        if (typeof selection?.selectElement === 'function') {
            selection.selectElement(projectItem, 'item')
        }
    }
}
