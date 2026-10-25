import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Ensures shared datalists for choice inputs (items and stats) exist in the container.
 *
 * @param {HTMLElement} container
 * @param {object} ctx
 */
export function ensureChoiceDatalists(container, ctx) {
    let datalistsEl = container.querySelector('#choice-datalists-container')
    if (!datalistsEl) {
        datalistsEl = document.createElement('div')
        datalistsEl.id = 'choice-datalists-container'
        const itemsList = (ctx.projectItems || [])
            .map(i => escapeHtml((typeof i.getName === 'function' ? i.getName() : i.name) || ''))
            .filter(Boolean)
        const statsList = [
            ...(ctx.projectStats || []),
            ...(ctx.projectParameters || []),
            ...(ctx.projectSkills || []),
        ]
            .map(s => escapeHtml((typeof s.getName === 'function' ? s.getName() : s.name) || ''))
            .filter(Boolean)

        const tagsSet = new Set()
        ;(ctx.projectTags || ctx.projectData?.projectTags || []).forEach(t => {
            const name = (typeof t.getName === 'function' ? t.getName() : t.name) || ''
            if (name) tagsSet.add(name)
        })
        ;(ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []).forEach(p => {
            const tags = (typeof p.getTags === 'function' ? p.getTags() : p.tags) || []
            tags.forEach(t => {
                const name = (typeof t.getName === 'function' ? t.getName() : t.name) || ''
                if (name) tagsSet.add(name)
            })
        })
        const tagsList = Array.from(tagsSet).map(escapeHtml)

        datalistsEl.innerHTML = `
            <datalist id="choice-items-datalist">
                ${itemsList.map(name => `<option value="${name}"></option>`).join('')}
            </datalist>
            <datalist id="choice-stats-datalist">
                ${statsList.map(name => `<option value="${name}"></option>`).join('')}
            </datalist>
            <datalist id="choice-tags-datalist">
                ${tagsList.map(name => `<option value="${name}"></option>`).join('')}
            </datalist>
        `
        container.appendChild(datalistsEl)
    }
}
