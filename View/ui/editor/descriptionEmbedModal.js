import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'

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

    const getRawList = (...propNames) => {
        for (const p of propNames) {
            if (Array.isArray(data[p])) return data[p]
            if (Array.isArray(source[p])) return source[p]
            if (typeof data[p] === 'function') {
                try {
                    const res = data[p]()
                    if (Array.isArray(res)) return res
                } catch {
                    // Ignore error in accessor
                }
            }
            if (typeof source[p] === 'function') {
                try {
                    const res = source[p]()
                    if (Array.isArray(res)) return res
                } catch {
                    // Ignore error in accessor
                }
            }
        }
        return []
    }

    const extractDesc = obj => {
        const descObj =
            typeof obj.getDescription === 'function'
                ? obj.getDescription()
                : obj.description ||
                  (typeof obj.getContent === 'function' ? obj.getContent() : obj.content)

        if (!descObj) return { text: '', summary: '' }
        if (typeof descObj === 'string') return { text: descObj, summary: '' }

        const text = typeof descObj.getText === 'function' ? descObj.getText() : descObj.text || ''
        const summary =
            typeof descObj.getSummary === 'function' ? descObj.getSummary() : descObj.summary || ''

        return { text: String(text).trim(), summary: String(summary).trim() }
    }

    // 1. Items
    const items = getRawList('items', 'projectItems', 'getItems')
    items.forEach(it => {
        const id = typeof it.getId === 'function' ? it.getId() : it.id || it.name
        const name = typeof it.getName === 'function' ? it.getName() : it.name || it.id
        if (id && name && !list.some(e => e.id === id && e.type === 'item')) {
            const { text, summary } = extractDesc(it)
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
    const characters = getRawList('characters', 'projectCharacters', 'getCharacters', 'npcs')
    characters.forEach(c => {
        const id = typeof c.getId === 'function' ? c.getId() : c.id || c.name
        const name = typeof c.getName === 'function' ? c.getName() : c.name || c.id
        if (id && name && !list.some(e => e.id === id && e.type === 'character')) {
            const { text, summary } = extractDesc(c)
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
    const locations = getRawList('locations', 'projectLocations', 'getLocations', 'places')
    locations.forEach(l => {
        const id = typeof l.getId === 'function' ? l.getId() : l.id || l.name
        const name = typeof l.getName === 'function' ? l.getName() : l.name || l.id
        if (id && name && !list.some(e => e.id === id && e.type === 'location')) {
            const { text, summary } = extractDesc(l)
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
            const { text, summary } = extractDesc(player)
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
    if (!popover) return

    const popoverWidth = 380
    const popoverHeight = 520
    const margin = 16

    let left = 0
    let top = 0

    if (
        targetRectOrPoint &&
        typeof targetRectOrPoint.x === 'number' &&
        typeof targetRectOrPoint.y === 'number'
    ) {
        left = targetRectOrPoint.x
        top = targetRectOrPoint.y + 8
    } else if (
        targetRectOrPoint &&
        typeof targetRectOrPoint.left === 'number' &&
        typeof targetRectOrPoint.bottom === 'number'
    ) {
        left = targetRectOrPoint.left
        top = targetRectOrPoint.bottom + 6
    } else {
        left = (window.innerWidth - popoverWidth) / 2
        top = (window.innerHeight - popoverHeight) / 3
    }

    if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin
    }
    if (left < margin) {
        left = margin
    }

    if (top + popoverHeight > window.innerHeight - margin) {
        if (
            targetRectOrPoint &&
            typeof targetRectOrPoint.top === 'number' &&
            targetRectOrPoint.top - popoverHeight - margin > 0
        ) {
            top = targetRectOrPoint.top - popoverHeight - 6
        } else {
            top = Math.max(margin, window.innerHeight - popoverHeight - margin)
        }
    }
    if (top < margin) {
        top = margin
    }

    popover.style.left = `${Math.round(left)}px`
    popover.style.top = `${Math.round(top)}px`
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
        if (radio.value === currentVariant) {
            radio.checked = true
        }
    })

    currentEntities = extractEmbeddableEntities(ctx)

    if (options.initialEntityId) {
        selectedEntity =
            currentEntities.find(
                e =>
                    e.id === options.initialEntityId &&
                    (!options.initialType ||
                        options.initialType === 'all' ||
                        e.type === options.initialType)
            ) || null

        if (selectedEntity && labelInput && !labelInput.value) {
            labelInput.value = `Opis: ${selectedEntity.name}`
        }
    }

    updateTypeFilterPills()
    renderEntitiesList()
    updateSelectedPreview()

    positionDescriptionEmbedPopover(options.targetRect || options.point || null)

    modal.classList.remove('hidden')
    if (searchInput) {
        searchInput.focus()
    }
}

/**
 * Closes the Description Embed Modal.
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
            icon: 'item',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/30',
            label: t('editor.toolbar.entity_item') || 'Przedmiot',
        },
        character: {
            icon: 'character',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/30',
            label: t('editor.toolbar.entity_character') || 'Postać',
        },
        location: {
            icon: 'location',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/30',
            label: t('editor.toolbar.entity_location') || 'Lokacja',
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
                ? selectedEntity.summaryText ||
                  selectedEntity.descriptionText ||
                  '(Brak tekstu podsumowania)'
                : selectedEntity.descriptionText ||
                  selectedEntity.summaryText ||
                  '(Brak pełnego tekstu narracyjnego)'

        if (previewContent) {
            previewContent.textContent = textToPreview
            previewContent.classList.remove('italic', 'text-zinc-600')
            previewContent.classList.add('text-zinc-300')
        }
    } else {
        selectedName.textContent = t('editor.embed_modal.no_selection') || '(brak wyboru)'
        selectedName.className = 'font-semibold text-zinc-500'
        confirmBtn.setAttribute('disabled', 'true')
        if (previewContent) {
            previewContent.textContent = 'Wybierz obiekt z listy powyżej, aby podejrzeć jego opis.'
            previewContent.classList.add('italic', 'text-zinc-600')
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
