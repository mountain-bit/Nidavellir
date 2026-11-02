/**
 * @fileoverview Datalists provider module for Choice input autocompletion.
 * Extracts unique, sorted item names, stats, parameters, and tags from the project context
 * and renders invisible HTML `<datalist>` elements for native browser suggestion popups.
 *
 * @module choiceDatalists
 */

import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Extracts a list of unique, sorted item names from the project context.
 *
 * @param {object} [ctx]
 * @returns {string[]}
 */
export function extractItemNames(ctx) {
    if (!ctx) return []
    const items = ctx.projectItems || ctx.projectData?.projectItems || []
    const namesSet = new Set()

    items.forEach(item => {
        if (!item) return
        const name = typeof item.getName === 'function' ? item.getName() : item.name
        if (typeof name === 'string' && name.trim()) {
            namesSet.add(name.trim())
        }
    })

    return Array.from(namesSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Extracts a list of unique, sorted stat/parameter/skill names from the project context.
 *
 * @param {object} [ctx]
 * @returns {string[]}
 */
export function extractStatNames(ctx) {
    if (!ctx) return []
    const stats = [
        ...(ctx.projectStats || ctx.projectData?.projectStats || []),
        ...(ctx.projectParameters || ctx.projectData?.projectParameters || []),
        ...(ctx.projectSkills || ctx.projectData?.projectSkills || []),
    ]
    const namesSet = new Set()

    stats.forEach(stat => {
        if (!stat) return
        const name = typeof stat.getName === 'function' ? stat.getName() : stat.name
        if (typeof name === 'string' && name.trim()) {
            namesSet.add(name.trim())
        }
    })

    return Array.from(namesSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Extracts a list of unique, sorted tag names from the project context and all project paragraphs.
 *
 * @param {object} [ctx]
 * @returns {string[]}
 */
export function extractTagNames(ctx) {
    if (!ctx) return []
    const tagsSet = new Set()

    const projectTags = ctx.projectTags || ctx.projectData?.projectTags || []
    projectTags.forEach(tag => {
        if (!tag) return
        const name =
            typeof tag === 'string'
                ? tag
                : typeof tag.getName === 'function'
                  ? tag.getName()
                  : tag.name
        if (typeof name === 'string' && name.trim()) {
            tagsSet.add(name.trim())
        }
    })

    const paragraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []
    paragraphs.forEach(paragraph => {
        if (!paragraph) return
        const paragraphTags =
            typeof paragraph.getTags === 'function' ? paragraph.getTags() : paragraph.tags || []
        if (Array.isArray(paragraphTags)) {
            paragraphTags.forEach(tag => {
                if (!tag) return
                const name =
                    typeof tag === 'string'
                        ? tag
                        : typeof tag.getName === 'function'
                          ? tag.getName()
                          : tag.name
                if (typeof name === 'string' && name.trim()) {
                    tagsSet.add(name.trim())
                }
            })
        }
    })

    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Renders HTML for a single datalist element with escaped options.
 *
 * @param {string} id
 * @param {string[]} [options]
 * @returns {string}
 */
export function renderDatalistHtml(id, options = []) {
    const safeOptions = Array.isArray(options) ? options : []
    const optionsHtml = safeOptions
        .map(name => `<option value="${escapeHtml(name)}"></option>`)
        .join('')
    return `<datalist id="${escapeHtml(id)}">${optionsHtml}</datalist>`
}

/**
 * Renders HTML markup for all choice datalists (items, stats, tags).
 *
 * @param {object} [options]
 * @param {string[]} [options.items]
 * @param {string[]} [options.stats]
 * @param {string[]} [options.tags]
 * @returns {string}
 */
export function renderChoiceDatalistsHtml({ items = [], stats = [], tags = [] } = {}) {
    return `
        ${renderDatalistHtml('choice-items-datalist', items)}
        ${renderDatalistHtml('choice-stats-datalist', stats)}
        ${renderDatalistHtml('choice-tags-datalist', tags)}
    `.trim()
}

/**
 * Ensures shared datalists for choice inputs (items, stats, tags) exist in the container.
 *
 * @param {HTMLElement} [container]
 * @param {object} [ctx]
 * @param {object} [options]
 * @param {boolean} [options.forceUpdate]
 * @returns {HTMLElement | null} The datalists container element or null
 */
export function ensureChoiceDatalists(container, ctx = {}, { forceUpdate = false } = {}) {
    if (!container || typeof container.querySelector !== 'function') {
        return null
    }

    let datalistsEl = container.querySelector('#choice-datalists-container')
    if (!datalistsEl) {
        datalistsEl = document.createElement('div')
        datalistsEl.id = 'choice-datalists-container'
        datalistsEl.setAttribute('aria-hidden', 'true')
        container.appendChild(datalistsEl)
    } else if (!forceUpdate) {
        return datalistsEl
    }

    const items = extractItemNames(ctx)
    const stats = extractStatNames(ctx)
    const tags = extractTagNames(ctx)

    datalistsEl.innerHTML = renderChoiceDatalistsHtml({ items, stats, tags })
    return datalistsEl
}
