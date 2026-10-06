import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../htmlTemplates.js'

let isInitialized = false
let activeEditor = null
let currentEntities = []
let selectedEntity = null
let currentFilterType = 'all'
let currentBadgePos = null
let currentBadgeLabel = ''

/**
 * Extracts all project entities (locations, characters, tags, items) from projectData or app context.
 *
 * @param {object} source Application context or projectData
 * @returns {Array<{ id: string, name: string, type: string, description?: string }>}
 */
export function extractAvailableProjectEntities(source) {
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

    // 1. Characters / NPCs
    const characters = getRawList('characters', 'projectCharacters', 'getCharacters', 'npcs')
    characters.forEach(c => {
        const id = typeof c.getId === 'function' ? c.getId() : c.id
        const name = typeof c.getName === 'function' ? c.getName() : c.name
        if (id && name && !list.some(e => e.id === id)) {
            list.push({ id, name, type: 'character', description: c.description || '' })
        }
    })

    // 2. Locations
    const locations = getRawList('locations', 'projectLocations', 'getLocations', 'places')
    locations.forEach(l => {
        const id = typeof l.getId === 'function' ? l.getId() : l.id
        const name = typeof l.getName === 'function' ? l.getName() : l.name
        if (id && name && !list.some(e => e.id === id)) {
            list.push({ id, name, type: 'location', description: l.description || '' })
        }
    })

    // 3. Tags / Traits
    const tags = getRawList('tags', 'projectTags', 'getTags', 'traits')
    tags.forEach(tg => {
        const id = typeof tg.getId === 'function' ? tg.getId() : tg.id
        const name = typeof tg.getName === 'function' ? tg.getName() : tg.name
        if (name && !list.some(e => e.id === (id || name))) {
            list.push({
                id: id || name,
                name,
                type: 'tag',
                description: tg.description || '',
            })
        }
    })

    // 4. Items
    const items = getRawList('items', 'projectItems', 'getItems', 'inventory')
    items.forEach(it => {
        const id = typeof it.getId === 'function' ? it.getId() : it.id
        const name = typeof it.getName === 'function' ? it.getName() : it.name
        if (name && !list.some(e => e.id === (id || name))) {
            list.push({
                id: id || name,
                name,
                type: 'item',
                description: it.description || '',
            })
        }
    })

    // 5. Templates (character archetypes)
    const templates = getRawList('templates', 'projectTemplates', 'getTemplates')
    templates.forEach(t => {
        const id = typeof t.getId === 'function' ? t.getId() : t.id
        const name = typeof t.getName === 'function' ? t.getName() : t.name
        if (id && name && !list.some(e => e.id === id)) {
            list.push({
                id,
                name,
                type: 'character',
                description: t.description || 'Szablon postaci',
            })
        }
    })

    return list
}

/**
 * Checks whether an item's type matches the current category filter.
 *
 * @param {string} itemType
 * @param {string} filterType
 * @returns {boolean}
 */
function matchesFilterType(itemType, filterType) {
    if (!filterType || filterType === 'all') return true
    const it = String(itemType || '')
        .toLowerCase()
        .trim()
    const ft = String(filterType || '')
        .toLowerCase()
        .trim()
    if (ft === 'character') return it === 'character' || it === 'npc'
    if (ft === 'tag') return it === 'tag' || it === 'trait'
    if (ft === 'location') return it === 'location'
    if (ft === 'item') return it === 'item'
    return it === ft
}

/**
 * Positions the floating popover adjacent to the clicked badge, mouse coordinate, or element rect.
 *
 * @param {DOMRect | { x: number, y: number } | null} [targetRectOrPoint]
 */
export function positionPopover(targetRectOrPoint) {
    const popover = document.getElementById('entity-link-modal')
    if (!popover) return

    const popoverWidth = 320
    const popoverHeight = 390
    const margin = 12

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

    // Horizontal bounds
    if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin
    }
    if (left < margin) {
        left = margin
    }

    // Vertical bounds - check if overflowing bottom, flip above target if possible
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
 * Opens the Entity Link / Alias Modal dialog.
 *
 * @param {object} editor Active MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {object} [options]
 * @param {string} [options.initialLabel] Pre-filled text/alias for the link
 * @param {string} [options.initialEntityId] Entity ID to preselect
 * @param {string} [options.initialType] Initial category filter ('all'|'character'|'location'|'tag'|'item')
 * @param {number|null} [options.badgePos] Position of existing badge if editing
 * @param {DOMRect} [options.targetRect] Target element bounding client rect
 * @param {{ x: number, y: number }} [options.point] Coordinates to anchor to
 */
export function openEntityLinkModal(editor, ctx, options = {}) {
    activeEditor = editor

    const modal = document.getElementById('entity-link-modal')
    if (!modal) return

    setupEntityLinkModalEvents()

    const labelInput = document.getElementById('entity-link-label-input')
    const searchInput = document.getElementById('entity-link-search-input')
    const unlinkBtn = document.getElementById('btn-unlink-entity')

    // Reset or populate inputs
    currentBadgePos = typeof options.badgePos === 'number' ? options.badgePos : null
    currentBadgeLabel = options.initialLabel || ''
    selectedEntity = null
    currentFilterType = options.initialType || 'all'

    if (labelInput) {
        labelInput.value = options.initialLabel || ''
    }
    if (searchInput) {
        searchInput.value = ''
    }

    if (unlinkBtn) {
        if (currentBadgePos !== null) {
            unlinkBtn.classList.remove('hidden')
        } else {
            unlinkBtn.classList.add('hidden')
        }
    }

    // Refresh entities: try editor first, then ctx / ctx.projectData
    let entities = []
    if (typeof editor?.getProjectEntities === 'function') {
        try {
            entities = editor.getProjectEntities() || []
        } catch {
            entities = []
        }
    }
    if (!entities || entities.length === 0) {
        entities = extractAvailableProjectEntities(ctx?.projectData)
    }
    if (!entities || entities.length === 0) {
        entities = extractAvailableProjectEntities(ctx)
    }
    currentEntities = entities

    // Preselect entity if provided
    if (options.initialEntityId) {
        selectedEntity = currentEntities.find(e => e.id === options.initialEntityId) || null
    }

    updateTypeFilterPills()
    renderEntitiesList()
    updateSelectedPreview()

    positionPopover(options.targetRect || options.point || null)

    modal.classList.remove('hidden')
    if (labelInput) {
        labelInput.focus()
        labelInput.select()
    }
}

/**
 * Closes the Entity Link Modal.
 */
export function closeEntityLinkModal() {
    const modal = document.getElementById('entity-link-modal')
    if (modal) {
        modal.classList.add('hidden')
    }
    selectedEntity = null
    currentBadgePos = null
    currentBadgeLabel = ''
}

function updateTypeFilterPills() {
    const pills = document.querySelectorAll('#entity-link-type-filters .entity-type-pill')
    pills.forEach(btn => {
        const type = btn.getAttribute('data-filter-type')
        if (type === currentFilterType) {
            btn.classList.add('active', 'bg-blue-600', 'text-white')
            btn.classList.remove('bg-zinc-800')
        } else {
            btn.classList.remove('active', 'bg-blue-600', 'text-white')
            btn.classList.add('bg-zinc-800')
        }
    })
}

function renderEntitiesList() {
    const itemsList = document.getElementById('entity-link-items-list')
    const searchInput = document.getElementById('entity-link-search-input')
    if (!itemsList) return

    const query = searchInput?.value?.toLowerCase().trim() || ''

    const filtered = currentEntities.filter(item => {
        if (!matchesFilterType(item.type, currentFilterType)) {
            return false
        }
        if (query) {
            const matchName = item.name ? item.name.toLowerCase().includes(query) : false
            const matchId = item.id ? item.id.toLowerCase().includes(query) : false
            const matchDesc = item.description
                ? item.description.toLowerCase().includes(query)
                : false
            return matchName || matchId || matchDesc
        }
        return true
    })

    if (filtered.length === 0) {
        itemsList.innerHTML = `
            <div class="p-6 text-center text-xs text-zinc-500">
                ${escapeHtml(t('editor.entity_modal.empty_list'))}
            </div>
        `
        return
    }

    const typeConfig = {
        character: {
            icon: 'character',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/30',
            label: t('editor.toolbar.entity_character'),
        },
        location: {
            icon: 'location',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/30',
            label: t('editor.toolbar.entity_location'),
        },
        tag: {
            icon: 'tag',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/30',
            label: t('editor.toolbar.entity_tag'),
        },
        item: {
            icon: 'item',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/30',
            label: t('editor.entity_modal.items'),
        },
    }

    itemsList.innerHTML = filtered
        .map(item => {
            const isSelected = selectedEntity && selectedEntity.id === item.id
            const cfg =
                typeConfig[item.type] ||
                (item.type === 'trait' ? typeConfig.tag : null) ||
                (item.type === 'npc' ? typeConfig.character : null) ||
                typeConfig.location
            const iconSvg = getIconSvg(cfg.icon, 'w-3.5 h-3.5 ' + cfg.color)

            return `
                <div
                    class="entity-item-row px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isSelected
                            ? 'bg-blue-600/20 border-l-2 border-blue-500 text-white'
                            : 'hover:bg-zinc-800/70 text-zinc-200'
                    }"
                    data-entity-id="${escapeHtml(item.id)}"
                >
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="p-1 rounded-md bg-zinc-800 border border-zinc-700/60 shrink-0">
                            ${iconSvg}
                        </span>
                        <div class="min-w-0">
                            <div class="text-xs font-medium truncate flex items-center gap-2">
                                <span>${escapeHtml(item.name)}</span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded border font-mono ${cfg.bg} ${cfg.color}">
                                    ${escapeHtml(cfg.label)}
                                </span>
                            </div>
                            <div class="text-[10px] text-zinc-500 font-mono truncate">
                                ${escapeHtml(item.id)}
                            </div>
                        </div>
                    </div>
                    ${
                        isSelected
                            ? `<span class="text-blue-400 shrink-0">${getIconSvg('check', 'w-4 h-4')}</span>`
                            : ''
                    }
                </div>
            `
        })
        .join('')

    // Row click and double-click listeners
    itemsList.querySelectorAll('.entity-item-row').forEach(row => {
        const id = row.getAttribute('data-entity-id')
        row.addEventListener('click', () => {
            selectedEntity = currentEntities.find(e => e.id === id) || null
            renderEntitiesList()
            updateSelectedPreview()
        })
        row.addEventListener('dblclick', () => {
            selectedEntity = currentEntities.find(e => e.id === id) || null
            updateSelectedPreview()
            applyLink()
        })
    })
}

function updateSelectedPreview() {
    const selectedName = document.getElementById('entity-link-selected-name')
    const confirmBtn = document.getElementById('btn-confirm-entity-link')

    if (!selectedName || !confirmBtn) return

    if (selectedEntity) {
        selectedName.textContent = `${selectedEntity.name} (${selectedEntity.type})`
        selectedName.className = 'font-semibold text-blue-300'
        confirmBtn.removeAttribute('disabled')
    } else {
        selectedName.textContent = t('editor.entity_modal.no_selection')
        selectedName.className = 'font-semibold text-zinc-500'
        confirmBtn.setAttribute('disabled', 'true')
    }
}

function applyLink() {
    if (!selectedEntity || !activeEditor) return

    const labelInput = document.getElementById('entity-link-label-input')
    const alias = labelInput?.value?.trim() || selectedEntity.name

    if (currentBadgePos !== null && typeof activeEditor.updateEntityMention === 'function') {
        activeEditor.updateEntityMention(currentBadgePos, selectedEntity, alias)
    } else if (typeof activeEditor.linkSelectionToEntity === 'function') {
        activeEditor.linkSelectionToEntity(selectedEntity, alias)
    } else if (typeof activeEditor.insertEntity === 'function') {
        activeEditor.insertEntity(selectedEntity, alias)
    }

    closeEntityLinkModal()
    toast.success(
        t('editor.entity_modal.toast_linked', { label: alias, name: selectedEntity.name }),
        t('editor.sync_title')
    )
}

function applyUnlink() {
    if (!activeEditor || currentBadgePos === null) return

    const labelInput = document.getElementById('entity-link-label-input')
    const fallbackText = labelInput?.value?.trim() || currentBadgeLabel

    if (typeof activeEditor.unlinkEntityMention === 'function') {
        activeEditor.unlinkEntityMention(currentBadgePos, fallbackText)
    }

    closeEntityLinkModal()
    toast.info(t('editor.entity_modal.toast_unlinked'), t('editor.sync_title'))
}

/**
 * Initializes events for the Entity Link Modal once.
 */
function setupEntityLinkModalEvents() {
    // Setup global listeners once
    if (!isInitialized) {
        isInitialized = true

        document.addEventListener('mousedown', e => {
            const activeModal = document.getElementById('entity-link-modal')
            if (!activeModal || activeModal.classList.contains('hidden')) return
            if (
                !activeModal.contains(e.target) &&
                !e.target?.closest?.('.entity-mention-badge') &&
                !e.target?.closest?.('#editor-context-menu') &&
                !e.target?.closest?.('#btn-open-entity-link-modal')
            ) {
                closeEntityLinkModal()
            }
        })

        document.addEventListener('keydown', e => {
            const activeModal = document.getElementById('entity-link-modal')
            if (e.key === 'Escape' && activeModal && !activeModal.classList.contains('hidden')) {
                closeEntityLinkModal()
            }
        })
    }

    const modal = document.getElementById('entity-link-modal')
    if (!modal || modal._eventsBound) return
    modal._eventsBound = true

    const closeBtn = document.getElementById('btn-close-entity-link-modal')
    const cancelBtn = document.getElementById('btn-cancel-entity-link')
    const confirmBtn = document.getElementById('btn-confirm-entity-link')
    const unlinkBtn = document.getElementById('btn-unlink-entity')
    const searchInput = document.getElementById('entity-link-search-input')
    const filterPills = document.querySelectorAll('#entity-link-type-filters .entity-type-pill')

    closeBtn?.addEventListener('click', closeEntityLinkModal)
    cancelBtn?.addEventListener('click', closeEntityLinkModal)
    confirmBtn?.addEventListener('click', applyLink)
    unlinkBtn?.addEventListener('click', applyUnlink)

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

    // Press Enter in label input to trigger confirm if an entity is already selected
    const labelInput = document.getElementById('entity-link-label-input')
    labelInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedEntity) {
                applyLink()
            }
        }
    })
}
