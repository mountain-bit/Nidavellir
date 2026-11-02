import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { ItemExportService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Resolves project name from application UI context with safe fallbacks.
 *
 * @param {object} [ctx]
 * @returns {string}
 */
export function getProjectName(ctx) {
    return (
        ctx?.projectName ||
        (typeof ctx?.getProjectName === 'function' ? ctx.getProjectName() : null) ||
        ctx?.vm?.project?.getName?.() ||
        'projekt'
    )
}

/**
 * Renders the HTML template string for Item Export Section.
 *
 * @returns {string}
 */
export function renderItemExportHtml() {
    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.item_export_title', 'Eksport i Narzędzia')}</div>
        <div class="grid grid-cols-2 gap-1.5">
            <button id="btn-copy-item-json" type="button" class="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="${escapeHtml(tr('details.item_export_copy_json_title', 'Kopiuj JSON tego przedmiotu do schowka'))}">
                ${getIconSvg('copy', 'w-3 h-3')}
                <span>${tr('details.item_export_copy_json', 'Kopiuj JSON')}</span>
            </button>
            <button id="btn-download-item-json" type="button" class="px-2 py-1.5 rounded bg-amber-600/30 hover:bg-amber-600/50 active:scale-[0.98] border border-amber-500/40 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="${escapeHtml(tr('details.item_export_save_json_title', 'Pobierz ten przedmiot jako plik JSON'))}">
                ${getIconSvg('export', 'w-3 h-3')}
                <span>${tr('details.item_export_save_json', 'Zapisz JSON')}</span>
            </button>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button id="btn-export-all-csv" type="button" class="px-2 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-[0.98] border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="${escapeHtml(tr('details.item_export_catalog_csv_title', 'Eksportuj wszystkie przedmioty projektu do pliku arkusza CSV'))}">
                ${getIconSvg('table', 'w-3.5 h-3.5')}
                <span>${tr('details.item_export_catalog_csv', 'Katalog (CSV)')}</span>
            </button>
            <button id="btn-export-all-md" type="button" class="px-2 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 active:scale-[0.98] border border-amber-700/60 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="${escapeHtml(tr('details.item_export_catalog_md_title', 'Eksportuj katalog wszystkich przedmiotów do pliku Markdown'))}">
                ${getIconSvg('markdown', 'w-3.5 h-3.5')}
                <span>${tr('details.item_export_catalog_md', 'Katalog (MD)')}</span>
            </button>
        </div>
    `
}

/**
 * Creates the Quick Export & Actions Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} [itemName='']
 * @param {object} [ctx] Application UI Context
 * @returns {HTMLElement}
 */
export function createItemExportSection(entity, itemName = '', ctx = {}) {
    const exportMod = createSection('p-3 space-y-2', renderItemExportHtml())

    const btnCopyJson = exportMod.querySelector('#btn-copy-item-json')
    const btnDownloadJson = exportMod.querySelector('#btn-download-item-json')
    const btnExportCsv = exportMod.querySelector('#btn-export-all-csv')
    const btnExportMd = exportMod.querySelector('#btn-export-all-md')

    const getSafeItemName = () =>
        itemName ||
        (typeof entity?.getName === 'function' ? entity.getName() : entity?.name) ||
        'item'

    // 1. Single Item JSON Copy
    if (btnCopyJson) {
        btnCopyJson.addEventListener('click', () => {
            const jsonStr = ItemExportService
                ? ItemExportService.exportToJSON([entity], {
                      includeParagraphUsages: true,
                      paragraphs: ctx?.projectParagraphs || [],
                  })
                : JSON.stringify(
                      typeof entity?.toJSON === 'function' ? entity.toJSON() : entity || {},
                      null,
                      2
                  )
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(jsonStr)
            }
        })
    }

    // 2. Single Item JSON Download
    if (btnDownloadJson) {
        btnDownloadJson.addEventListener('click', () => {
            const jsonStr = ItemExportService
                ? ItemExportService.exportToJSON([entity], {
                      includeParagraphUsages: true,
                      paragraphs: ctx?.projectParagraphs || [],
                  })
                : JSON.stringify(
                      typeof entity?.toJSON === 'function' ? entity.toJSON() : entity || {},
                      null,
                      2
                  )
            const safeName = getSafeItemName()
            const filename = `item_${safeName.toLowerCase().replace(/\s+/g, '_')}.json`
            if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
                ItemExportService.downloadFile(jsonStr, filename, 'application/json')
            } else if (typeof document !== 'undefined') {
                const blob = new Blob([jsonStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        })
    }

    // 3. All Items CSV Catalog
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const items = ctx?.projectItems || []
            const csvStr = ItemExportService ? ItemExportService.exportToCSV(items) : ''
            const projName = getProjectName(ctx).toLowerCase().replace(/\s+/g, '_')
            if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
                ItemExportService.downloadFile(
                    csvStr,
                    `${projName}_przedmioty.csv`,
                    'text/csv;charset=utf-8'
                )
            }
        })
    }

    // 4. All Items Markdown Catalog
    if (btnExportMd) {
        btnExportMd.addEventListener('click', () => {
            const items = ctx?.projectItems || []
            const projName = getProjectName(ctx)
            const mdStr = ItemExportService
                ? ItemExportService.exportToMarkdown(items, {
                      projectTitle: `Katalog Przedmiotów — ${projName}`,
                      includeParagraphUsages: true,
                      paragraphs: ctx?.projectParagraphs || [],
                  })
                : ''
            if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
                ItemExportService.downloadFile(
                    mdStr,
                    `${projName.toLowerCase().replace(/\s+/g, '_')}_katalog_przedmiotow.md`,
                    'text/markdown;charset=utf-8'
                )
            }
        })
    }

    return exportMod
}
