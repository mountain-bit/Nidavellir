import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { extractEntityDescription, getProjectEntityList } from '../utils/editorEntityHelpers.js'
import { positionFloatingPopover } from '../utils/editorPopoverUtils.js'

let isInitialized = false
let activeEditor = null
let activeCtx = null
let currentEntities = []
let selectedEntity = null
let currentFilterType = 'all'
let currentEmbedPos = null
let currentVariant = 'text'

/**
 * Extracts entities that have narrative descriptions (items, characters, locations).
 *
 * @param {object} source Application context or projectData
 * @returns {Array<{ id: string, name: string, type: 'item'|'character'|'location', descriptionText: string, summaryText: string }>}
 */
export function extractEmbeddableEntities(source) {
    const list = []
    if (!source) return list

    const data = source.projectData || source

    // 1. Items
    const items = getProjectEntityList(source, 'items', 'projectItems', 'getItems')
    items.forEach(it => {
        const id = typeof it.getId === 'function' ? it.getId() : it.id || it.name
        const name = typeof it.getName === 'function' ? it.getName() : it.name || it.id
        if (id && name && !list.some(e => e.id === id && e.type === 'item')) {
            const { text, summary } = extractEntityDescription(it)
            list.push({
                id,
                name,
                type: 'item',
                descriptionText: text,
                summaryText: summary,
            })
        }
    })

    // 2. Characters / NPCs
    const characters = getProjectEntityList(
        source,
        'characters',
        'projectCharacters',
        'getCharacters',
        'npcs'
    )
    characters.forEach(c => {
        const id = typeof c.getId === 'function' ? c.getId() : c.id || c.name
        const name = typeof c.getName === 'function' ? c.getName() : c.name || c.id
        if (id && name && !list.some(e => e.id === id && e.type === 'character')) {
            const { text, summary } = extractEntityDescription(c)
            list.push({
                id,
                name,
                type: 'character',
                descriptionText: text,
                summaryText: summary,
            })
        }
    })

    // 3. Locations
    const locations = getProjectEntityList(
        source,
        'locations',
        'projectLocations',
        'getLocations',
        'places'
    )
    locations.forEach(l => {
        const id = typeof l.getId === 'function' ? l.getId() : l.id || l.name
        const name = typeof l.getName === 'function' ? l.getName() : l.name || l.id
        if (id && name && !list.some(e => e.id === id && e.type === 'location')) {
            const { text, summary } = extractEntityDescription(l)
            list.push({
                id,
                name,
                type: 'location',
                descriptionText: text,
                summaryText: summary,
            })
        }
    })

    // 4. Player character
    const player = data.playerCharacter || source.playerCharacter
    if (player) {
        const id = typeof player.getId === 'function' ? player.getId() : player.id || 'hero_player'
        const name =
            typeof player.getName === 'function'
                ? player.getName()
                : player.name || 'Główny bohater'
        if (id && name && !list.some(e => e.id === id && e.type === 'character')) {
            const { text, summary } = extractEntityDescription(player)
            list.push({
                id,
                name: `${name} (Główny bohater)`,
                type: 'character',
                descriptionText: text,
                summaryText: summary,
            })
        }
    }

    return list
}

/**
 * Positions the floating embed modal adjacent to the clicked badge or center of window.
 *
 * @param {DOMRect | { x: number, y: number } | null} [targetRectOrPoint]
 */
export function positionDescriptionEmbedPopover(targetRectOrPoint) {
    const popover = document.getElementById('description-embed-modal')
    positionFloatingPopover(popover, targetRectOrPoint, { width: 380, height: 520, margin: 16 })
}

/**
 * Opens Description Embed Modal for inserting or editing an embedded description.
 *
 * @param {object} editor Active MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {object} [options]
 * @param {string} [options.initialEntityId] Entity ID to preselect
 * @param {string} [options.initialType] Initial category filter ('all'|'item'|'character'|'location')
 * @param {'text'|'summary'} [options.initialVariant] Initial variant ('text'|'summary')
 * @param {number|null} [options.embedPos] Position of node if editing existing
 * @param {DOMRect} [options.targetRect] Target element bounding rect
 * @param {{ x: number, y: number }} [options.point] Coordinates
 */
export function openDescriptionEmbedModal(editor, ctx, options = {}) {
    activeEditor = editor
    activeCtx = ctx || null

    const modal = document.getElementById('description-embed-modal')
    if (!modal) return

    setupDescriptionEmbedModalEvents(ctx)

    const searchInput = document.getElementById('description-embed-search-input')
    const labelInput = document.getElementById('description-embed-label-input')
    const removeBtn = document.getElementById('btn-remove-description-embed')
    const variantRadios = document.querySelectorAll('input[name="embed-variant"]')

    currentEmbedPos = typeof options.embedPos === 'number' ? options.embedPos : null
    currentFilterType = options.initialType || 'all'
    currentVariant = options.initialVariant || 'text'
    selectedEntity = null

    if (searchInput) searchInput.value = ''

    const selectedText =
        typeof editor?.getSelectedText === 'function' ? editor.getSelectedText().trim() : ''
    const initialLabel = options.initialLabel || (selectedText ? selectedText : '')
    if (labelInput) {
        labelInput.value = initialLabel
    }

    if (removeBtn) {
        if (currentEmbedPos !== null) {
            removeBtn.classList.remove('hidden')
        } else {
            removeBtn.classList.add('hidden')
        }
    }

    variantRadios.forEach(radio => {
        radio.checked = radio.value === currentVariant
    })

    currentEntities = extractEmbeddableEntities(ctx)

    if (options.initialEntityId) {
        selectedEntity = currentEntities.find(e => e.id === options.initialEntityId) || null
    }

    updateTypeFilterPills()
    renderEntitiesList()
    updateSelectedPreview()

    modal.classList.remove('hidden')

    const target = options.targetRect || options.point || null
    positionDescriptionEmbedPopover(target)

    setTimeout(() => {
        searchInput?.focus()
    }, 50)
}

/**
 * Closes the description embed modal.
 */
export function closeDescriptionEmbedModal() {
    const modal = document.getElementById('description-embed-modal')
    if (modal) {
        modal.classList.add('hidden')
    }
    selectedEntity = null
    currentEmbedPos = null
    currentVariant = 'text'
}

function updateTypeFilterPills() {
    const pills = document.querySelectorAll('#description-embed-type-filters .embed-type-pill')
    pills.forEach(btn => {
        const type = btn.getAttribute('data-filter-type')
        if (type === currentFilterType) {
            btn.classList.add('active', 'bg-emerald-600', 'text-white')
            btn.classList.remove('bg-zinc-800')
        } else {
            btn.classList.remove('active', 'bg-emerald-600', 'text-white')
            btn.classList.add('bg-zinc-800')
        }
    })
}

function renderEntitiesList() {
    const itemsList = document.getElementById('description-embed-items-list')
    const searchInput = document.getElementById('description-embed-search-input')
    if (!itemsList) return

    const query = searchInput?.value?.toLowerCase().trim() || ''

    const filtered = currentEntities.filter(item => {
        if (currentFilterType !== 'all' && item.type !== currentFilterType) {
            return false
        }
        if (query) {
            const matchName = item.name ? item.name.toLowerCase().includes(query) : false
            const matchId = item.id ? item.id.toLowerCase().includes(query) : false
            const matchText = item.descriptionText
                ? item.descriptionText.toLowerCase().includes(query)
                : false
            const matchSummary = item.summaryText
                ? item.summaryText.toLowerCase().includes(query)
                : false
            return matchName || matchId || matchText || matchSummary
        }
        return true
    })

    if (filtered.length === 0) {
        itemsList.innerHTML = `
            <div class="p-6 text-center text-xs text-zinc-500">
                ${escapeHtml(t('editor.embed_modal.empty_list') || 'Brak obiektów z opisem w wybranej kategorii.')}
            </div>
        `
        return
    }

    const typeConfig = {
        item: {
            icon: 'box',
            label: t('details.item') || 'Przedmiot',
            color: 'text-amber-400',
            bg: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
        },
        character: {
            icon: 'user',
            label: t('details.character') || 'Postać',
            color: 'text-purple-400',
            bg: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
        },
        location: {
            icon: 'map-pin',
            label: t('details.location') || 'Lokacja',
            color: 'text-rose-400',
            bg: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
        },
    }

    itemsList.innerHTML = filtered
        .map(item => {
            const isSelected =
                selectedEntity && selectedEntity.id === item.id && selectedEntity.type === item.type
            const cfg = typeConfig[item.type] || typeConfig.item
            const iconSvg = getIconSvg(cfg.icon, 'w-3.5 h-3.5 ' + cfg.color)
            const snippet =
                item.summaryText || item.descriptionText || '(Brak wprowadzonego tekstu opisu)'

            return `
                <div
                    class="embed-item-row px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isSelected
                            ? 'bg-emerald-600/20 border-l-2 border-emerald-500 text-white'
                            : 'hover:bg-zinc-800/70 text-zinc-200'
                    }"
                    data-entity-id="${escapeHtml(item.id)}"
                    data-entity-type="${escapeHtml(item.type)}"
                >
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <span class="p-1 rounded-md bg-zinc-800 border border-zinc-700/60 shrink-0">
                            ${iconSvg}
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="text-xs font-medium truncate flex items-center gap-2">
                                <span>${escapeHtml(item.name)}</span>
                                <span class="text-[9px] px-1.5 py-0.2 rounded border font-mono ${cfg.bg} ${cfg.color}">
                                    ${escapeHtml(cfg.label)}
                                </span>
                            </div>
                            <div class="text-[10px] text-zinc-400 truncate italic">
                                ${escapeHtml(snippet)}
                            </div>
                        </div>
                    </div>
                    ${
                        isSelected
                            ? `<span class="text-emerald-400 shrink-0">${getIconSvg('check', 'w-4 h-4')}</span>`
                            : ''
                    }
                </div>
            `
        })
        .join('')

    itemsList.querySelectorAll('.embed-item-row').forEach(row => {
        const id = row.getAttribute('data-entity-id')
        const type = row.getAttribute('data-entity-type')
        row.addEventListener('click', () => {
            selectedEntity = currentEntities.find(e => e.id === id && e.type === type) || null
            const labelInput = document.getElementById('description-embed-label-input')
            if (
                selectedEntity &&
                labelInput &&
                (!labelInput.value || labelInput.value.startsWith('Opis: '))
            ) {
                labelInput.value = `Opis: ${selectedEntity.name}`
            }
            renderEntitiesList()
            updateSelectedPreview()
        })
        row.addEventListener('dblclick', () => {
            selectedEntity = currentEntities.find(e => e.id === id && e.type === type) || null
            const labelInput = document.getElementById('description-embed-label-input')
            if (
                selectedEntity &&
                labelInput &&
                (!labelInput.value || labelInput.value.startsWith('Opis: '))
            ) {
                labelInput.value = `Opis: ${selectedEntity.name}`
            }
            updateSelectedPreview()
            applyEmbed()
        })
    })
}

function updateSelectedPreview() {
    const selectedName = document.getElementById('description-embed-selected-name')
    const previewContent = document.getElementById('description-embed-preview-content')
    const confirmBtn = document.getElementById('btn-confirm-description-embed')

    if (!selectedName || !confirmBtn) return

    const variantRadio = document.querySelector('input[name="embed-variant"]:checked')
    currentVariant = variantRadio?.value === 'summary' ? 'summary' : 'text'

    if (selectedEntity) {
        selectedName.textContent = `${selectedEntity.name} (${selectedEntity.type})`
        selectedName.className = 'font-semibold text-emerald-300'
        confirmBtn.removeAttribute('disabled')

        const textToPreview =
            currentVariant === 'summary'
                ? selectedEntity.summaryText || selectedEntity.descriptionText
                : selectedEntity.descriptionText || selectedEntity.summaryText

        if (previewContent) {
            if (textToPreview) {
                previewContent.textContent = textToPreview
                previewContent.classList.remove('italic', 'text-zinc-500')
                previewContent.classList.add('text-zinc-300')
            } else {
                previewContent.textContent =
                    t('editor.embed_modal.no_desc_placeholder') ||
                    '(Brak tekstu opisu dla tego obiektu. Wstawka wyświetli pusty opis do momentu uzupełnienia danych obiektu.)'
                previewContent.classList.add('italic', 'text-zinc-500')
                previewContent.classList.remove('text-zinc-300')
            }
        }
    } else {
        selectedName.textContent = t('editor.embed_modal.none_selected') || 'Nie wybrano obiektu'
        selectedName.className = 'italic text-zinc-500 font-normal'
        confirmBtn.setAttribute('disabled', 'true')
        if (previewContent) {
            previewContent.textContent =
                t('editor.embed_modal.preview_placeholder') ||
                'Wybierz obiekt z listy po lewej stronie, aby podejrzeć jego opis...'
            previewContent.classList.add('italic', 'text-zinc-500')
            previewContent.classList.remove('text-zinc-300')
        }
    }
}

function applyEmbed() {
    if (!selectedEntity || !activeEditor) return

    const variantRadio = document.querySelector('input[name="embed-variant"]:checked')
    const variant = variantRadio?.value === 'summary' ? 'summary' : 'text'
    const labelInput = document.getElementById('description-embed-label-input')
    const customLabel = labelInput?.value?.trim()
    const cleanName = selectedEntity.name
    const finalLabel = customLabel || `Opis: ${cleanName}`

    const embedAttrs = {
        id: selectedEntity.id,
        type: selectedEntity.type,
        variant,
        name: cleanName,
        label: finalLabel,
    }
    const entityName = selectedEntity.name
    const entityType = selectedEntity.type

    if (currentEmbedPos !== null && typeof activeEditor.updateDescriptionEmbed === 'function') {
        activeEditor.updateDescriptionEmbed(currentEmbedPos, embedAttrs)
    } else if (typeof activeEditor.insertDescriptionEmbed === 'function') {
        activeEditor.insertDescriptionEmbed(embedAttrs)
    }

    closeDescriptionEmbedModal()

    if (activeCtx) {
        if (typeof activeCtx.saveActiveFile === 'function') {
            activeCtx.saveActiveFile()
        } else {
            const saveBtn = document.querySelector('[data-action="save"]')
            if (saveBtn) {
                saveBtn.click()
            }
        }
    }

    toast.success(
        t('editor.embed_modal.toast_inserted', { name: entityName }) ||
            `Wstawiono opis ${entityType}: „${entityName}”`,
        t('editor.sync_title')
    )
}

function applyRemoveEmbed() {
    if (!activeEditor || currentEmbedPos === null) return

    if (typeof activeEditor.removeDescriptionEmbed === 'function') {
        activeEditor.removeDescriptionEmbed(currentEmbedPos)
    }

    closeDescriptionEmbedModal()

    if (activeCtx) {
        if (typeof activeCtx.saveActiveFile === 'function') {
            activeCtx.saveActiveFile()
        } else {
            const saveBtn = document.querySelector('[data-action="save"]')
            if (saveBtn) {
                saveBtn.click()
            }
        }
    }

    toast.info(
        t('editor.embed_modal.toast_removed') || 'Usunięto wstawkę opisu.',
        t('editor.sync_title')
    )
}

/**
 * Initializes listeners for Description Embed Modal once.
 *
 * @param {object} ctx
 */
export function setupDescriptionEmbedModalEvents(ctx) {
    if (ctx) {
        activeCtx = ctx
    }
    if (!isInitialized) {
        isInitialized = true

        document.addEventListener('mousedown', e => {
            const activeModal = document.getElementById('description-embed-modal')
            if (!activeModal || activeModal.classList.contains('hidden')) return
            if (
                !activeModal.contains(e.target) &&
                !e.target?.closest?.('.description-embed-card') &&
                !e.target?.closest?.('#btn-insert-description-embed') &&
                !e.target?.closest?.('#btn-menu-insert-description-embed')
            ) {
                closeDescriptionEmbedModal()
            }
        })

        document.addEventListener('keydown', e => {
            const activeModal = document.getElementById('description-embed-modal')
            if (e.key === 'Escape' && activeModal && !activeModal.classList.contains('hidden')) {
                closeDescriptionEmbedModal()
            }
        })
    }

    const modal = document.getElementById('description-embed-modal')
    if (!modal || modal._eventsBound) return
    modal._eventsBound = true

    const closeBtn = document.getElementById('btn-close-description-embed-modal')
    const cancelBtn = document.getElementById('btn-cancel-description-embed')
    const confirmBtn = document.getElementById('btn-confirm-description-embed')
    const removeBtn = document.getElementById('btn-remove-description-embed')
    const searchInput = document.getElementById('description-embed-search-input')
    const filterPills = document.querySelectorAll(
        '#description-embed-type-filters .embed-type-pill'
    )
    const variantRadios = document.querySelectorAll('input[name="embed-variant"]')

    closeBtn?.addEventListener('click', closeDescriptionEmbedModal)
    cancelBtn?.addEventListener('click', closeDescriptionEmbedModal)
    confirmBtn?.addEventListener('click', applyEmbed)
    removeBtn?.addEventListener('click', applyRemoveEmbed)

    searchInput?.addEventListener('input', () => {
        renderEntitiesList()
    })

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            currentFilterType = pill.getAttribute('data-filter-type') || 'all'
            updateTypeFilterPills()
            renderEntitiesList()
        })
    })

    variantRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateSelectedPreview()
        })
    })
}
