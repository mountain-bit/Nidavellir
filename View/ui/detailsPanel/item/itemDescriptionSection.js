import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Creates the Summary & Narrative File Section for the Item Details Panel.
 *
 * @param {object} descObj Description instance or object
 * @param {string} summary
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemDescriptionSection(descObj, summary, ctx) {
    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <label for="details-item-summary-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.summary', 'Streszczenie fabularne')}</label>
        <textarea
            id="details-item-summary-input"
            rows="2"
            placeholder="${tr('details.item_summary_placeholder', 'Krótki opis przedmiotu widoczny dla gracza...')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-normal leading-relaxed"
        >${escapeHtml(summary)}</textarea>

        <div class="pt-1">
            <button id="btn-open-item-markdown" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] active:scale-[0.99] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer transition-colors">
                <span class="flex items-center gap-2">
                    <span class="text-amber-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${tr('details.open_description_file', 'Otwórz plik opisu (Markdown)')}</span>
                </span>
                <span class="text-zinc-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `
    )

    const summaryInput = descMod.querySelector('#details-item-summary-input')
    summaryInput.addEventListener('input', () => {
        if (typeof descObj.setSummary === 'function') {
            descObj.setSummary(summaryInput.value)
        } else {
            descObj.summary = summaryInput.value
        }
        if (typeof descObj.setText === 'function') {
            descObj.setText(summaryInput.value)
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    descMod.querySelector('#btn-open-item-markdown').addEventListener('click', () => {
        if (ctx?.vm && typeof ctx.vm.openOrCreateDescriptionFile === 'function') {
            const res = ctx.vm.openOrCreateDescriptionFile()
            if (res && res.fileName && ctx.files) {
                ctx.files[res.fileName] = res.content
                if (typeof ctx.updateMainWorkspaceUI === 'function') {
                    ctx.updateMainWorkspaceUI()
                }
            }
        }
    })

    return descMod
}
