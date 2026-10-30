import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Renders the HTML template string for Item Description & Markdown File Section.
 *
 * @param {string} [summary='']
 * @returns {string}
 */
export function renderItemDescriptionHtml(summary = '') {
    return `
        <label for="details-item-summary-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.item_summary_label', 'Streszczenie fabularne')}</label>
        <textarea
            id="details-item-summary-input"
            rows="2"
            placeholder="${tr('details.item_summary_placeholder', 'Krótki opis przedmiotu widoczny dla gracza...')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-normal leading-relaxed"
        >${escapeHtml(summary || '')}</textarea>

        <div class="pt-1">
            <button id="btn-open-item-markdown" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] active:scale-[0.99] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer transition-colors">
                <span class="flex items-center gap-2">
                    <span class="text-amber-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${tr('details.open_description_markdown', 'Otwórz plik opisu (Markdown)')}</span>
                </span>
                <span class="text-zinc-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `
}

/**
 * Creates the Summary & Narrative File Section for the Item Details Panel.
 *
 * @param {object} [descObj] Description instance or object
 * @param {string} [summary]
 * @param {object} [ctx] Application UI Context
 * @returns {HTMLElement}
 */
export function createItemDescriptionSection(descObj, summary, ctx) {
    const safeDescObj = descObj || {}
    const safeSummary =
        summary !== undefined
            ? summary
            : (typeof safeDescObj.getSummary === 'function' && safeDescObj.getSummary()) ||
              safeDescObj.summary ||
              (typeof safeDescObj.getText === 'function' && safeDescObj.getText()) ||
              safeDescObj.text ||
              ''

    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderItemDescriptionHtml(safeSummary)
    )

    const summaryInput = descMod.querySelector('#details-item-summary-input')
    const openMdBtn = descMod.querySelector('#btn-open-item-markdown')

    if (summaryInput) {
        summaryInput.value = safeSummary
        summaryInput.addEventListener('input', () => {
            const val = summaryInput.value
            if (typeof safeDescObj.setSummary === 'function') {
                safeDescObj.setSummary(val)
            } else {
                safeDescObj.summary = val
            }
            if (typeof safeDescObj.setText === 'function') {
                safeDescObj.setText(val)
            } else if (safeDescObj.text !== undefined) {
                safeDescObj.text = val
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        })
    }

    if (openMdBtn) {
        openMdBtn.addEventListener('click', () => {
            if (ctx?.vm && typeof ctx.vm?.files?.openOrCreateDescriptionFile === 'function') {
                const res = ctx.vm.files.openOrCreateDescriptionFile(safeDescObj)
                if (res && res.fileName && ctx.files) {
                    ctx.files[res.fileName] = res.content
                    if (typeof ctx.updateMainWorkspaceUI === 'function') {
                        ctx.updateMainWorkspaceUI()
                    }
                }
            }
        })
    }

    return descMod
}
