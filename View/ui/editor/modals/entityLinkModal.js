import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getProjectEntityList } from '../utils/editorEntityHelpers.js'
import { positionFloatingPopover } from '../utils/editorPopoverUtils.js'

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

    // 1. Characters / NPCs
    const characters = getProjectEntityList(
        source,
        'characters',
        'projectCharacters',
        'getCharacters',
        'npcs'
    )
    characters.forEach(c => {
        const id = typeof c.getId === 'function' ? c.getId() : c.id
        const name = typeof c.getName === 'function' ? c.getName() : c.name
        if (id && name && !list.some(e => e.id === id)) {
            list.push({ id, name, type: 'character', description: c.description || '' })
        }
    })

    // 2. Locations
    const locations = getProjectEntityList(
        source,
        'locations',
        'projectLocations',
        'getLocations',
        'places'
    )
    locations.forEach(l => {
        const id = typeof l.getId === 'function' ? l.getId() : l.id
        const name = typeof l.getName === 'function' ? l.getName() : l.name
        if (id && name && !list.some(e => e.id === id)) {
            list.push({ id, name, type: 'location', description: l.description || '' })
        }
    })

    // 3. Tags / Traits
    const tags = getProjectEntityList(source, 'tags', 'projectTags', 'getTags', 'traits')
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
    const items = getProjectEntityList(source, 'items', 'projectItems', 'getItems', 'inventory')
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
    const templates = getProjectEntityList(source, 'templates', 'projectTemplates', 'getTemplates')
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
    positionFloatingPopover(popover, targetRectOrPoint, {
        width: 320,
        height: 390,
        margin: 12,
    })
}

/**
 * Opens the Entity Link / Alias Modal dialog.
 *
 * @param {object} editor Active MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {object} [options] Options payload
 * @param {string} [options.initialLabel] Text to display on badge (alias)
 * @param {string} [options.initialEntityId] Entity ID to link with
 * @param {string} [options.initialType] Initial category filter ('all'|'character'|'location'|'tag'|'item')
 * @param {number|null} [options.badgePos] Document position of badge if editing existing
 * @param {DOMRect} [options.targetRect] Element bounding rectangle for relative placement
 * @param {{ x: number, y: number }} [options.point] Mouse coordinates for relative placement
 */
export function openEntityLinkModal(editor, ctx, options = {}) {
    activeEditor = editor
    const modal = document.getElementById('entity-link-modal')
    if (!modal) return

    setupModalEvents()

    const labelInput = document.getElementById('entity-link-label-input')
    const searchInput = document.getElementById('entity-link-search-input')
    const unlinkBtn = document.getElementById('btn-unlink-entity-mention')

    currentBadgePos = typeof options.badgePos === 'number' ? options.badgePos : null
    currentBadgeLabel = options.initialLabel || ''
    currentFilterType = options.initialType || 'all'
    selectedEntity = null

    if (labelInput) {
        labelInput.value = currentBadgeLabel
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

    currentEntities = extractAvailableProjectEntities(ctx)

    if (options.initialEntityId) {
        selectedEntity = currentEntities.find(e => e.id === options.initialEntityId) || null
    }

    updateFilterTabsUI()
    renderEntityList()

    modal.classList.remove('hidden')

    const target = options.targetRect || options.point || null
    positionPopover(target)

    setTimeout(() => {
        if (currentBadgeLabel && !selectedEntity) {
            searchInput?.focus()
        } else if (!currentBadgeLabel) {
            labelInput?.focus()
        } else {
            searchInput?.focus()
        }
    }, 50)
}

/**
 * Closes the Entity Link dialog and resets active state.
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

function updateFilterTabsUI() {
    const tabBtns = document.querySelectorAll('#entity-link-tabs [data-type]')
    tabBtns.forEach(btn => {
        const btnType = btn.getAttribute('data-type')
        if (btnType === currentFilterType) {
            btn.classList.add('bg-blue-600', 'text-white')
            btn.classList.remove('bg-zinc-800', 'text-zinc-400')
        } else {
            btn.classList.remove('bg-blue-600', 'text-white')
            btn.classList.add('bg-zinc-800', 'text-zinc-400')
        }
    })
}

function renderEntityList() {
    const listContainer = document.getElementById('entity-link-list')
    const searchInput = document.getElementById('entity-link-search-input')
    if (!listContainer) return

    const query = searchInput?.value?.toLowerCase().trim() || ''

    const filtered = currentEntities.filter(ent => {
        const matchesType = matchesFilterType(ent.type, currentFilterType)
        const matchesQuery = !query || ent.name.toLowerCase().includes(query)
        return matchesType && matchesQuery
    })

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="p-4 text-center text-zinc-500 text-xs italic">
                ${t('editor.entity_modal.empty_list')}
            </div>
        `
        return
    }

    listContainer.innerHTML = ''
    filtered.forEach(ent => {
        const itemBtn = document.createElement('button')
        itemBtn.type = 'button'
        const isSelected = selectedEntity && selectedEntity.id === ent.id

        const colorClasses =
            ent.type === 'location'
                ? 'border-rose-500/50 text-rose-300'
                : ent.type === 'character'
                  ? 'border-purple-500/50 text-purple-300'
                  : ent.type === 'tag'
                    ? 'border-blue-500/50 text-blue-300'
                    : 'border-amber-500/50 text-amber-300'

        const iconName =
            ent.type === 'location'
                ? 'map-pin'
                : ent.type === 'character'
                  ? 'user'
                  : ent.type === 'tag'
                    ? 'tag'
                    : 'box'

        itemBtn.className = `w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-2 cursor-pointer ${
            isSelected
                ? 'bg-blue-600/30 border-blue-500 ring-1 ring-blue-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`

        itemBtn.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <span class="p-1 rounded bg-zinc-800/80 border ${colorClasses} shrink-0">
                    ${getIconSvg(iconName, 'w-3 h-3')}
                </span>
                <span class="font-medium text-xs text-zinc-200 truncate">${escapeHtml(ent.name)}</span>
            </div>
            <span class="text-[9px] uppercase font-mono px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">${escapeHtml(ent.type)}</span>
        `

        itemBtn.addEventListener('click', () => {
            selectedEntity = ent
            const labelInput = document.getElementById('entity-link-label-input')
            if (labelInput && (!labelInput.value || !labelInput.value.trim())) {
                labelInput.value = ent.name
            }
            renderEntityList()
        })

        listContainer.appendChild(itemBtn)
    })
}

function handleConfirm() {
    if (!selectedEntity || !activeEditor) return

    const labelInput = document.getElementById('entity-link-label-input')
    const finalLabel = labelInput?.value?.trim() || selectedEntity.name

    if (typeof activeEditor.insertEntityMention === 'function') {
        activeEditor.insertEntityMention({
            id: selectedEntity.id,
            name: selectedEntity.name,
            type: selectedEntity.type,
            label: finalLabel,
            pos: currentBadgePos,
        })
    }

    closeEntityLinkModal()
}

function handleUnlink() {
    if (!activeEditor || typeof activeEditor.unlinkEntityMention !== 'function') return
    if (currentBadgePos !== null) {
        activeEditor.unlinkEntityMention(currentBadgePos, currentBadgeLabel)
        toast.info(t('editor.entity_modal.toast_unlinked'), t('editor.sync_title'))
    }
    closeEntityLinkModal()
}

function setupModalEvents() {
    if (isInitialized) return
    isInitialized = true

    const closeBtn = document.getElementById('btn-close-entity-link')
    const cancelBtn = document.getElementById('btn-cancel-entity-link')
    const confirmBtn = document.getElementById('btn-confirm-entity-link')
    const unlinkBtn = document.getElementById('btn-unlink-entity-mention')
    const searchInput = document.getElementById('entity-link-search-input')
    const labelInput = document.getElementById('entity-link-label-input')
    const tabBtns = document.querySelectorAll('#entity-link-tabs [data-type]')

    closeBtn?.addEventListener('click', closeEntityLinkModal)
    cancelBtn?.addEventListener('click', closeEntityLinkModal)
    confirmBtn?.addEventListener('click', handleConfirm)
    unlinkBtn?.addEventListener('click', handleUnlink)

    searchInput?.addEventListener('input', () => {
        renderEntityList()
    })

    labelInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedEntity) {
                handleConfirm()
            } else {
                searchInput?.focus()
            }
        }
    })

    searchInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const listContainer = document.getElementById('entity-link-list')
            const firstBtn = listContainer?.querySelector('button')
            if (firstBtn) {
                firstBtn.click()
                handleConfirm()
            }
        }
    })

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilterType = btn.getAttribute('data-type') || 'all'
            updateFilterTabsUI()
            renderEntityList()
        })
    })

    document.addEventListener('mousedown', e => {
        const activeModal = document.getElementById('entity-link-modal')
        if (!activeModal || activeModal.classList.contains('hidden')) return
        if (
            !activeModal.contains(e.target) &&
            !e.target?.closest?.('.entity-mention-badge') &&
            !e.target?.closest?.('#ctx-editor-link-selection') &&
            !e.target?.closest?.('#ctx-editor-edit-badge') &&
            !e.target?.closest?.('#btn-open-entity-link-modal') &&
            !e.target?.closest?.('[data-entity-type]')
        ) {
            closeEntityLinkModal()
        }
    })

    document.addEventListener('keydown', e => {
        const modal = document.getElementById('entity-link-modal')
        if (modal && !modal.classList.contains('hidden') && e.key === 'Escape') {
            closeEntityLinkModal()
        }
    })
}
