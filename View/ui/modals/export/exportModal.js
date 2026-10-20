/**
 * Export Modal Controller
 * Modern export orchestrator supporting ZIP backup, print-ready PDF, and Word DOCX,
 * with customizable typography and content composition.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { openStyleEditorModal } from '../styleEditor/styleEditorModal.js'
import { getAllStyles, getStyleById } from './exportStyleService.js'
import {
    compileGamebook,
    extractText,
    generatePrintHtml,
    getAvailablePlayerCharacters,
} from './gamebookCompiler.js'

let activeContext = null
let selectedFormat = 'pdf'
let selectedStyleId = 'classic-fantasy'
let eventsBound = false

/**
 * Opens the main Export Modal.
 *
 * @param {object} ctx - Application context
 */
/**
 * Ensures all entity markdown files from disk are loaded into ctx.files
 * prior to generating book exports.
 *
 * @param {object} ctx
 */
async function loadAllProjectMarkdownFiles(ctx) {
    if (!ctx) return
    const projectPath =
        (typeof ctx.getProjectPath === 'function' ? ctx.getProjectPath() : null) ||
        ctx.projectPath ||
        (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
        ''

    const rawParagraphs =
        ctx?.projectData?.projectParagraphs ||
        ctx?.projectParagraphs ||
        ctx?.vm?.project?.paragraphs ||
        []
    const rawLocations =
        ctx?.projectData?.projectLocations ||
        ctx?.projectData?.locations ||
        ctx?.projectLocations ||
        ctx?.vm?.project?.locations ||
        []
    const rawNpcs =
        ctx?.projectData?.projectCharacters ||
        ctx?.projectData?.npcs ||
        ctx?.projectCharacters ||
        ctx?.vm?.project?.characters ||
        []
    const rawItems =
        ctx?.projectData?.projectItems ||
        ctx?.projectData?.items ||
        ctx?.projectItems ||
        ctx?.vm?.project?.items ||
        []

    const allEntities = [...rawParagraphs, ...rawLocations, ...rawNpcs, ...rawItems]

    if (!ctx.files) {
        if (!ctx.projectData) ctx.projectData = {}
        if (!ctx.projectData.files) ctx.projectData.files = {}
        ctx.files = ctx.projectData.files
    }

    if (
        !projectPath ||
        !window.electronAPI ||
        typeof window.electronAPI.readMarkdownFile !== 'function'
    ) {
        return
    }

    for (const ent of allEntities) {
        const desc =
            typeof ent.getContent === 'function'
                ? ent.getContent()
                : typeof ent.getDescription === 'function'
                  ? ent.getDescription()
                  : ent.content || ent.description
        const filePath =
            (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
            desc?.filePath ||
            desc?.textPath ||
            ent?.filePath

        if (filePath && !ctx.files[filePath]) {
            try {
                const res = await window.electronAPI.readMarkdownFile(projectPath, filePath)
                if (res && res.success && typeof res.content === 'string') {
                    ctx.files[filePath] = res.content
                    const base = filePath.replace(/\\/g, '/').split('/').pop()
                    if (base) ctx.files[base] = res.content
                }
            } catch (err) {
                console.warn(`[ExportModal] Could not read markdown file ${filePath}:`, err)
            }
        }
    }
}

export function openExportModal(ctx) {
    try {
        activeContext = ctx
        const modal = document.getElementById('modal-export-project')
        if (!modal) {
            console.error('[ExportModal] Element #modal-export-project not found in DOM')
            return
        }

        // Show modal immediately so it is guaranteed visible
        modal.classList.remove('hidden')

        initFormatSelection()
        populateStylesDropdown()
        setupCharacterSheetUI(ctx)
        updateProjectStatistics()
        updateMiniPreview()
        bindModalEvents()

        // Asynchronously load all markdown files from disk in background to refresh preview
        loadAllProjectMarkdownFiles(ctx)
            .then(() => {
                updateMiniPreview()
            })
            .catch(() => {})
    } catch (err) {
        console.error('[ExportModal] Error opening export modal:', err)
        const modal = document.getElementById('modal-export-project')
        if (modal) modal.classList.remove('hidden')
    }
}

/**
 * Closes the main Export Modal.
 */
export function closeExportModal() {
    const modal = document.getElementById('modal-export-project')
    if (modal) {
        modal.classList.add('hidden')
    }
}

function bindModalEvents() {
    if (eventsBound) return
    eventsBound = true

    const modal = document.getElementById('modal-export-project')
    if (!modal) return

    // Close buttons
    const btnClose = document.getElementById('btn-close-export-modal')
    const btnCancel = document.getElementById('btn-cancel-export')
    if (btnClose) btnClose.onclick = closeExportModal
    if (btnCancel) btnCancel.onclick = closeExportModal

    // Open Style Editor button
    const btnManageStyles = document.getElementById('btn-manage-export-styles')
    if (btnManageStyles) {
        btnManageStyles.onclick = () => {
            openStyleEditorModal(selectedStyleId, newStyle => {
                selectedStyleId = newStyle.id
                populateStylesDropdown()
                updateMiniPreview()
            })
        }
    }

    // Style dropdown change
    const styleSelect = document.getElementById('export-style-select')
    if (styleSelect) {
        styleSelect.addEventListener('change', e => {
            selectedStyleId = e.target.value
            updateMiniPreview()
        })
    }

    // Interactive option inputs refresh preview
    const reactiveInputs = modal.querySelectorAll('.export-reactive-input')
    reactiveInputs.forEach(input => {
        input.addEventListener('change', () => {
            updateMiniPreview()
        })
    })

    // Confirm button
    const btnConfirm = document.getElementById('btn-confirm-export')
    if (btnConfirm) {
        btnConfirm.onclick = () => {
            executeExport()
        }
    }
}

/**
 * Configures the Character Sheet export section based on active PlayerCharacter(s).
 * Hides option entirely if no hero exists.
 * Displays multi-select options if multiple heroes are defined.
 *
 * @param {object} ctx
 */
export function setupCharacterSheetUI(ctx) {
    const container = document.getElementById('export-container-character-sheet')
    const sheetCheckbox = document.getElementById('export-opt-character-sheet')
    const indicator = document.getElementById('export-single-hero-indicator')
    const heroesPanel = document.getElementById('export-heroes-selection-panel')
    const heroesList = document.getElementById('export-heroes-list')
    const btnToggleAll = document.getElementById('btn-export-toggle-all-heroes')

    if (!container || !sheetCheckbox) return

    const availableHeroes = getAvailablePlayerCharacters(ctx)

    if (availableHeroes.length === 0) {
        // "Jeżeli nie będzie bohatera gracza nie dawaj takiej opcji"
        container.classList.add('hidden')
        sheetCheckbox.checked = false
        if (heroesPanel) heroesPanel.classList.add('hidden')
        if (indicator) indicator.textContent = ''
        return
    }

    // Is at least 1 hero
    container.classList.remove('hidden')
    sheetCheckbox.checked = true

    if (availableHeroes.length === 1) {
        const singleHero = availableHeroes[0]
        const heroName =
            (typeof singleHero.getName === 'function' ? singleHero.getName() : singleHero.name) ||
            'Bohater'
        const charClassObj =
            typeof singleHero.getCharacterClass === 'function'
                ? singleHero.getCharacterClass()
                : singleHero.characterClass
        const className =
            (charClassObj && typeof charClassObj.getName === 'function'
                ? charClassObj.getName()
                : charClassObj?.name || (typeof charClassObj === 'string' ? charClassObj : '')) ||
            ''

        if (indicator) {
            indicator.textContent = `(${heroName}${className ? ` - ${className}` : ''})`
        }
        if (heroesPanel) {
            heroesPanel.classList.add('hidden')
        }
    } else {
        // "a jeżeli jest więcej Bohaterów to daj opcje jakiego wybrać w tym daj opcje wyboru wielu"
        if (indicator) {
            indicator.textContent = `(Dostępnych: ${availableHeroes.length})`
        }

        if (heroesList) {
            heroesList.innerHTML = ''
            availableHeroes.forEach(h => {
                const hName = (typeof h.getName === 'function' ? h.getName() : h.name) || 'Bohater'
                const hId = (typeof h.getId === 'function' ? h.getId() : h.id) || hName
                const charClassObj =
                    typeof h.getCharacterClass === 'function'
                        ? h.getCharacterClass()
                        : h.characterClass
                const className =
                    (charClassObj && typeof charClassObj.getName === 'function'
                        ? charClassObj.getName()
                        : charClassObj?.name ||
                          (typeof charClassObj === 'string' ? charClassObj : '')) || ''

                const label = document.createElement('label')
                label.className =
                    'flex items-center gap-2 text-zinc-300 text-xs cursor-pointer py-1 px-1.5 rounded hover:bg-[#202227] transition-colors'
                label.innerHTML = `
                    <input type="checkbox" class="export-hero-checkbox rounded accent-blue-600 export-reactive-input" value="${escapeHtml(hId)}" checked />
                    <span class="font-medium text-zinc-200">${escapeHtml(hName)}</span>
                    ${className ? `<span class="text-zinc-400 text-[11px]">(${escapeHtml(className)})</span>` : ''}
                `
                heroesList.appendChild(label)
            })

            // Bind change on hero checkboxes to refresh preview
            heroesList.querySelectorAll('.export-hero-checkbox').forEach(cb => {
                cb.addEventListener('change', () => {
                    updateMiniPreview()
                })
            })
        }

        if (heroesPanel) {
            heroesPanel.classList.toggle('hidden', !sheetCheckbox.checked)
        }

        if (btnToggleAll) {
            btnToggleAll.onclick = () => {
                if (!heroesList) return
                const allCheckboxes = heroesList.querySelectorAll('.export-hero-checkbox')
                const allChecked = Array.from(allCheckboxes).every(cb => cb.checked)
                allCheckboxes.forEach(cb => {
                    cb.checked = !allChecked
                })
                updateMiniPreview()
            }
        }
    }

    // Toggle panel visibility when main sheet checkbox changes
    sheetCheckbox.onchange = () => {
        if (availableHeroes.length > 1 && heroesPanel) {
            heroesPanel.classList.toggle('hidden', !sheetCheckbox.checked)
        }
        updateMiniPreview()
    }
}

function initFormatSelection() {
    const modal = document.getElementById('modal-export-project')
    if (!modal) return

    const formatCards = modal.querySelectorAll('.export-format-card')
    formatCards.forEach(card => {
        card.onclick = () => {
            const format = card.getAttribute('data-format')
            if (!format) return
            selectedFormat = format

            formatCards.forEach(c => {
                c.classList.remove('border-blue-500', 'bg-blue-950/25', 'ring-1', 'ring-blue-500')
                c.classList.add('border-[#2e3037]', 'bg-[#18191c]')
            })
            card.classList.remove('border-[#2e3037]', 'bg-[#18191c]')
            card.classList.add('border-blue-500', 'bg-blue-950/25', 'ring-1', 'ring-blue-500')

            toggleFormatSections(selectedFormat)
            updateMiniPreview()
        }
    })

    toggleFormatSections(selectedFormat)
}

function toggleFormatSections(format) {
    const zipSection = document.getElementById('export-section-zip-options')
    const bookSection = document.getElementById('export-section-book-options')

    if (zipSection) zipSection.classList.toggle('hidden', format !== 'zip')
    if (bookSection) bookSection.classList.toggle('hidden', format !== 'pdf' && format !== 'docx')
}

export function populateStylesDropdown() {
    const select = document.getElementById('export-style-select')
    if (!select) return

    const all = getAllStyles()
    select.innerHTML = ''

    all.forEach(s => {
        const opt = document.createElement('option')
        opt.value = s.id
        opt.textContent = `${s.name} ${s.isBuiltIn ? '(Domyślny)' : '(Własny)'}`
        if (s.id === selectedStyleId) {
            opt.selected = true
        }
        select.appendChild(opt)
    })
}

function updateProjectStatistics() {
    try {
        const rawParagraphs =
            activeContext?.projectData?.projectParagraphs ||
            activeContext?.vm?.project?.paragraphs ||
            []
        const count = rawParagraphs.length
        let totalWords = 0

        rawParagraphs.forEach(p => {
            const text = extractText(p)
            if (text) {
                totalWords += text.trim().split(/\s+/).filter(Boolean).length
            }
        })

        // Rough A5 estimation: ~220 words per page
        const estimatedPages = Math.max(
            1,
            Math.ceil(totalWords / 220) + (count > 0 ? Math.ceil(count * 0.15) : 0)
        )

        const statCountEl = document.getElementById('export-stat-count')
        const statWordsEl = document.getElementById('export-stat-words')
        const statPagesEl = document.getElementById('export-stat-pages')

        if (statCountEl) statCountEl.textContent = `${count} paragrafów`
        if (statWordsEl) statWordsEl.textContent = `~${totalWords} słów`
        if (statPagesEl) statPagesEl.textContent = `~${estimatedPages} str. (A5)`
    } catch (err) {
        console.warn('[ExportModal] Failed to calculate statistics:', err)
    }
}

function updateMiniPreview() {
    try {
        const previewBox = document.getElementById('export-mini-preview-content')
        if (!previewBox) return

        const style = getStyleById(selectedStyleId)
        const sepSelect = document.getElementById('export-opt-separator')
        const sepType = sepSelect ? sepSelect.value : style.separatorType || 'ornament'

        let sepSnippet = ''
        if (sepType === 'line') {
            sepSnippet = `<hr style="border:0; border-top:1px solid #ccc; margin:8px auto; width:50%;" />`
        } else if (sepType === 'page-break') {
            sepSnippet = `<div style="text-align:center; color:#999; font-size:9px; margin:6px 0; border-top:1px dashed #ccc; padding-top:4px;">[ Podział strony ]</div>`
        } else if (sepType === 'ornament') {
            sepSnippet = `<div style="text-align:center; color:#666; font-size:11px; margin:8px 0;">${escapeHtml(style.customSeparator || '❖ ❖ ❖')}</div>`
        } else {
            sepSnippet = `<div style="height:10px;"></div>`
        }

        const rawParagraphs =
            activeContext?.projectData?.projectParagraphs ||
            activeContext?.projectParagraphs ||
            activeContext?.vm?.project?.paragraphs ||
            []
        const firstP = rawParagraphs[0]
        const p1Num = firstP ? (firstP.getDisplayNumber ? firstP.getDisplayNumber() : 1) : 1
        const p1RawText = extractText(firstP, activeContext)
        const p1Text = p1RawText
            ? p1RawText.slice(0, 140) + '...'
            : 'Stoisz przed prastarymi ruinami twierdzy. Zimny wiatr smaga twoją twarz...'

        previewBox.style.backgroundColor = style.backgroundColor || '#ffffff'
        previewBox.style.color = style.textColor || '#1a1a1a'
        previewBox.style.fontFamily = style.fontFamily || 'Georgia, serif'

        previewBox.innerHTML = `
            <div style="font-family: ${style.headerFontFamily || 'Cinzel, serif'}; font-size: 13px; font-weight: bold; color: ${style.accentColor || '#8b1e1e'}; margin-bottom: 4px;">
                § ${p1Num}
            </div>
            <p style="font-size: 11px; line-height: 1.4; margin-bottom: 6px; text-align: justify;">
                ${escapeHtml(p1Text)}
            </p>
            <div style="font-size: 10px; font-style: italic; margin-bottom: 4px; padding-left: 6px;">
                ${escapeHtml(style.choicePrefix || '→ ')}Jeśli wchodzisz do środka, <strong style="color: ${style.accentColor || '#8b1e1e'};">idź do 2</strong>.
            </div>
            ${sepSnippet}
            <div style="font-family: ${style.headerFontFamily || 'Cinzel, serif'}; font-size: 13px; font-weight: bold; color: ${style.accentColor || '#8b1e1e'}; margin-bottom: 4px;">
                § ${p1Num + 1}
            </div>
            <p style="font-size: 11px; line-height: 1.4; margin-bottom: 4px; text-align: justify;">
                Przekraczasz próg. Mrok spowija wysokie kolumny...
            </p>
        `
    } catch (err) {
        console.warn('[ExportModal] Failed to update mini preview:', err)
    }
}

/**

 * Main execution dispatcher based on selected format.
 */
async function executeExport() {
    const rawDisplayName = document.getElementById('project-name-display')?.textContent?.trim()
    const projectName =
        (rawDisplayName && rawDisplayName !== 'Moja Gra' && rawDisplayName !== 'Brak projektu'
            ? rawDisplayName
            : '') ||
        activeContext?.vm?.project?.getName?.() ||
        'Moja_Gra'

    const btnConfirm = document.getElementById('btn-confirm-export')
    const originalBtnText = btnConfirm ? btnConfirm.innerHTML : ''

    try {
        if (btnConfirm) {
            btnConfirm.disabled = true
            btnConfirm.innerHTML = `
                <span class="inline-block animate-spin mr-1.5">⏳</span>
                <span>Eksportowanie...</span>
            `
        }

        // Gather options
        const style = getStyleById(selectedStyleId)
        const sepSelect = document.getElementById('export-opt-separator')
        const chosenSep = sepSelect ? sepSelect.value : style.separatorType || 'ornament'

        const availableHeroes = getAvailablePlayerCharacters(activeContext)
        const hasHero = availableHeroes.length > 0
        const wantCharacterSheet = hasHero && isChecked('export-opt-character-sheet')

        let selectedHeroIds = []
        if (wantCharacterSheet) {
            if (availableHeroes.length > 1) {
                const heroBoxes = document.querySelectorAll(
                    '#export-heroes-list .export-hero-checkbox:checked'
                )
                selectedHeroIds = Array.from(heroBoxes).map(cb => cb.value)
                if (selectedHeroIds.length === 0) {
                    selectedHeroIds = availableHeroes.map(
                        h =>
                            (typeof h.getId === 'function' ? h.getId() : h.id) ||
                            (typeof h.getName === 'function' ? h.getName() : h.name)
                    )
                }
            } else if (availableHeroes.length === 1) {
                const single = availableHeroes[0]
                selectedHeroIds = [
                    (typeof single.getId === 'function' ? single.getId() : single.id) ||
                        (typeof single.getName === 'function' ? single.getName() : single.name),
                ]
            }
        }

        const options = {
            format: selectedFormat,
            styleId: selectedStyleId,
            includeLocations: isChecked('export-opt-locations'),
            locationsPlacement: getRadioVal('export-opt-locations-place') || 'start',
            includeNPCs: isChecked('export-opt-npcs'),
            npcsPlacement: getRadioVal('export-opt-npcs-place') || 'end',
            includeItems: isChecked('export-opt-items'),
            itemsPlacement: getRadioVal('export-opt-items-place') || 'end',
            includeGlossary: isChecked('export-opt-glossary'),
            glossaryPlacement: getRadioVal('export-opt-glossary-place') || 'end',
            separatorType: chosenSep,
            shuffleParagraphs: isChecked('export-opt-shuffle'),
            includeCharacterSheet: wantCharacterSheet,
            selectedHeroIds,
            includeRules: isChecked('export-opt-rules'),
            includeCoverPage: isChecked('export-opt-cover'),
            includeAssetsInZip: isChecked('export-opt-zip-images'),
        }

        const effectiveStyleConfig = {
            ...style,
            separatorType: chosenSep,
        }

        if (selectedFormat === 'zip') {
            await handleZipExport(projectName, options)
        } else if (selectedFormat === 'pdf') {
            await handlePdfExport(projectName, options, effectiveStyleConfig)
        } else if (selectedFormat === 'docx') {
            await handleDocxExport(projectName, options, effectiveStyleConfig)
        }

        closeExportModal()
    } catch (err) {
        toast.error(`Błąd podczas eksportu: ${err.message || String(err)}`, 'Eksport')
    } finally {
        if (btnConfirm) {
            btnConfirm.disabled = false
            btnConfirm.innerHTML = originalBtnText
        }
    }
}

async function handleZipExport(projectName, options) {
    let projectDir = null
    if (window.electronAPI && typeof window.electronAPI.getCurrentProject === 'function') {
        projectDir = await window.electronAPI.getCurrentProject()
    }

    if (!projectDir) {
        toast.error('Nie wykryto aktywnego folderu projektu do spakowania.', 'Eksport ZIP')
        return
    }

    const res = await window.electronAPI.exportProjectZip({
        projectPath: projectDir,
        includeImages: options.includeAssetsInZip !== false,
        defaultName: projectName,
    })

    if (res?.canceled) return

    if (res?.success) {
        const sizeMb = res.bytes ? ` (${(res.bytes / 1024 / 1024).toFixed(2)} MB)` : ''
        toast.success(
            `Projekt został pomyślnie spakowany do pliku ZIP${sizeMb}!`,
            'Kopia zapasowa ZIP'
        )
    } else {
        toast.error(
            `Nie udało się utworzyć archiwum ZIP: ${res?.error || 'Nieznany błąd'}`,
            'Błąd ZIP'
        )
    }
}

async function handlePdfExport(projectName, options, styleConfig) {
    await loadAllProjectMarkdownFiles(activeContext)
    const bookData = compileGamebook(activeContext, options, styleConfig)
    const htmlContent = generatePrintHtml(bookData, styleConfig)

    if (window.electronAPI && typeof window.electronAPI.exportProjectPdf === 'function') {
        const res = await window.electronAPI.exportProjectPdf({
            defaultName: projectName,
            htmlContent,
            styleConfig,
        })

        if (res?.canceled) return

        if (res?.success) {
            toast.success(`Książka PDF została pomyślnie wygenerowana!`, 'Eksport PDF')
        } else {
            toast.error(`Błąd generowania PDF: ${res?.error || 'Nieznany błąd'}`, 'Błąd PDF')
        }
    } else {
        toast.error(
            'Funkcja eksportu PDF wymaga środowiska aplikacji desktopowej.',
            'Brak wsparcia'
        )
    }
}

async function handleDocxExport(projectName, options, styleConfig) {
    await loadAllProjectMarkdownFiles(activeContext)
    const bookData = compileGamebook(activeContext, options, styleConfig)

    if (window.electronAPI && typeof window.electronAPI.exportProjectDocx === 'function') {
        const res = await window.electronAPI.exportProjectDocx({
            defaultName: projectName,
            projectPath:
                (typeof activeContext?.getProjectPath === 'function'
                    ? activeContext.getProjectPath()
                    : null) ||
                activeContext?.projectPath ||
                (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
                '',
            bookData,
            styleConfig,
        })

        if (res?.canceled) return

        if (res?.success) {
            toast.success(`Dokument Word (.docx) został pomyślnie wygenerowany!`, 'Eksport DOCX')
        } else {
            toast.error(`Błąd generowania DOCX: ${res?.error || 'Nieznany błąd'}`, 'Błąd DOCX')
        }
    } else {
        toast.error(
            'Funkcja eksportu DOCX wymaga środowiska aplikacji desktopowej.',
            'Brak wsparcia'
        )
    }
}

function isChecked(id) {
    const el = document.getElementById(id)
    return el ? !!el.checked : false
}

function getRadioVal(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`)
    return el ? el.value : null
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
