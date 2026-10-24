import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the Paragraph Usages Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} itemId
 * @param {string} itemName
 * @param {object} ctx Application UI Context
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement}
 */
export function createItemUsagesSection(entity, itemId, itemName, ctx, onRefreshDetails) {
    const paragraphs = ctx?.projectParagraphs || []
    const usages = []

    paragraphs.forEach(p => {
        const actions = typeof p.getItemActions === 'function' ? p.getItemActions() : p.itemActions
        if (Array.isArray(actions)) {
            actions.forEach(a => {
                if (a.itemId === itemId || a.itemName === itemName) {
                    usages.push({
                        paragraph: p,
                        action: a.action,
                        quantity: a.quantity || 1,
                    })
                }
            })
        }
    })

    const usagesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-indigo-400 shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                <span>Występowanie w paragrafach</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${usages.length}</span>
        </div>
        <div id="details-item-usages-list" class="flex flex-col gap-1 min-h-[20px]">
            ${
                usages.length === 0
                    ? `<span class="text-xs text-gray-500 italic py-0.5">Przedmiot nie jest jeszcze przypisany do żadnego paragrafu.</span>`
                    : ''
            }
        </div>
    `
    )

    const usagesListEl = usagesMod.querySelector('#details-item-usages-list')
    usages.forEach(u => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] text-xs hover:border-zinc-600 transition-colors cursor-pointer group'

        const pNum =
            typeof u.paragraph.getDisplayNumber === 'function'
                ? u.paragraph.getDisplayNumber()
                : u.paragraph.number || ''
        const pTitle =
            typeof u.paragraph.getName === 'function' ? u.paragraph.getName() : u.paragraph.name

        let badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50'
        let badgeLabel = 'Otrzymaj'
        if (u.action === 'require') {
            badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-600/50'
            badgeLabel = 'Wymagaj'
        } else if (u.action === 'remove') {
            badgeClass = 'bg-rose-950/70 text-rose-300 border-rose-600/50'
            badgeLabel = 'Utrata'
        }

        row.innerHTML = `
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="font-mono text-[10px] text-zinc-400 shrink-0">${pNum ? `#${pNum}` : '§'}</span>
                <span class="font-medium text-zinc-200 group-hover:text-white truncate">${escapeHtml(pTitle)}</span>
            </div>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold border ${badgeClass} shrink-0">
                ${badgeLabel} ${u.quantity > 1 ? `x${u.quantity}` : ''}
            </span>
        `

        row.addEventListener('click', () => {
            if (typeof ctx?.selectEntity === 'function') {
                ctx.selectEntity(u.paragraph, 'paragraph')
            } else if (ctx?.vm) {
                ctx.vm.selectElement(u.paragraph, 'paragraph')
                if (typeof onRefreshDetails === 'function') {
                    onRefreshDetails(ctx)
                } else if (typeof ctx.renderDetailsPanel === 'function') {
                    ctx.renderDetailsPanel(ctx)
                }
            }
            if (
                ctx?.storyGraphInstance &&
                typeof ctx.storyGraphInstance.focusOnElement === 'function'
            ) {
                ctx.storyGraphInstance.focusOnElement(
                    typeof u.paragraph.getId === 'function' ? u.paragraph.getId() : u.paragraph.id
                )
            }
        })

        usagesListEl.appendChild(row)
    })

    return usagesMod
}
