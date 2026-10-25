import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { ItemExportService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the Quick Export & Actions Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} itemName
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemExportSection(entity, itemName, ctx) {
    const exportMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">Eksport i Narzędzia</div>
        <div class="grid grid-cols-2 gap-1.5">
            <button id="btn-copy-item-json" type="button" class="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Kopiuj JSON tego przedmiotu do schowka">
                ${getIconSvg('copy', 'w-3 h-3')}
                <span>Kopiuj JSON</span>
            </button>
            <button id="btn-download-item-json" type="button" class="px-2 py-1.5 rounded bg-amber-600/30 hover:bg-amber-600/50 active:scale-[0.98] border border-amber-500/40 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Pobierz ten przedmiot jako plik JSON">
                ${getIconSvg('export', 'w-3 h-3')}
                <span>Zapisz JSON</span>
            </button>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button id="btn-export-all-csv" type="button" class="px-2 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-[0.98] border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Eksportuj wszystkie przedmioty projektu do pliku arkusza CSV">
                <span>📊</span>
                <span>Katalog (CSV)</span>
            </button>
            <button id="btn-export-all-md" type="button" class="px-2 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 active:scale-[0.98] border border-amber-700/60 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Eksportuj katalog wszystkich przedmiotów do pliku Markdown">
                <span>📝</span>
                <span>Katalog (MD)</span>
            </button>
        </div>
    `
    )

    const getProjectName = () => {
        return (
            ctx?.projectName ||
            (typeof ctx?.getProjectName === 'function' ? ctx.getProjectName() : null) ||
            ctx?.vm?.project?.getName?.() ||
            'projekt'
        )
    }

    // 1. Single Item JSON Copy
    exportMod.querySelector('#btn-copy-item-json').addEventListener('click', () => {
        const jsonStr = ItemExportService
            ? ItemExportService.exportToJSON([entity], {
                  includeParagraphUsages: true,
                  paragraphs: ctx?.projectParagraphs || [],
              })
            : JSON.stringify(
                  typeof entity.toJSON === 'function' ? entity.toJSON() : entity,
                  null,
                  2
              )
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(jsonStr)
        }
    })

    // 2. Single Item JSON Download
    exportMod.querySelector('#btn-download-item-json').addEventListener('click', () => {
        const jsonStr = ItemExportService
            ? ItemExportService.exportToJSON([entity], {
                  includeParagraphUsages: true,
                  paragraphs: ctx?.projectParagraphs || [],
              })
            : JSON.stringify(
                  typeof entity.toJSON === 'function' ? entity.toJSON() : entity,
                  null,
                  2
              )
        const filename = `item_${(itemName || 'item').toLowerCase().replace(/\s+/g, '_')}.json`
        if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
            ItemExportService.downloadFile(jsonStr, filename, 'application/json')
        } else {
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

    // 3. All Items CSV Catalog
    exportMod.querySelector('#btn-export-all-csv').addEventListener('click', () => {
        const items = ctx?.projectItems || []
        const csvStr = ItemExportService ? ItemExportService.exportToCSV(items) : ''
        const projName = getProjectName().toLowerCase().replace(/\s+/g, '_')
        if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
            ItemExportService.downloadFile(
                csvStr,
                `${projName}_przedmioty.csv`,
                'text/csv;charset=utf-8'
            )
        }
    })

    // 4. All Items Markdown Catalog
    exportMod.querySelector('#btn-export-all-md').addEventListener('click', () => {
        const items = ctx?.projectItems || []
        const projName = getProjectName()
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

    return exportMod
}
