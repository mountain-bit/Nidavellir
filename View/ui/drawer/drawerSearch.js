import { getIconSvg } from '../../../dist/Utils/icons.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import {
    executeQuickSearchAction,
    highlightMatch,
    searchProjectObjects,
} from '../workspace/quickSearch.js'
import {
    renderCharactersList,
    renderConnectionsList,
    renderItemsList,
    renderLocationsList,
    renderScenesList,
    renderTagsList,
    renderTraitsList,
} from './drawerLists.js'

let activeDrawerCategory = 'all'
let currentDrawerQuery = ''

/**
 * Gets the current active category filter in the search drawer.
 *
 * @returns {string}
 */
export function getActiveDrawerCategory() {
    return activeDrawerCategory
}

/**
 * Sets the active category filter in the search drawer.
 *
 * @param {string} category
 */
export function setActiveDrawerCategory(category) {
    activeDrawerCategory = category || 'all'
}

/**
 * Renders category filter buttons in the Search tab of the Left Drawer.
 *
 * @param {object} ctx Application context
 */
function renderDrawerCategoryFilters(ctx) {
    const container = document.getElementById('drawer-search-category-filters')
    if (!container) return

    const categories = [
        { id: 'all', label: 'Wszystkie' },
        { id: 'paragraphs', label: 'Paragrafy' },
        { id: 'scenes', label: 'Sceny' },
        { id: 'characters', label: 'Postacie' },
        { id: 'locations', label: 'Lokacje' },
        { id: 'items', label: 'Przedmioty' },
        { id: 'rules', label: 'Cechy' },
        { id: 'tags', label: 'Tagi' },
    ]

    container.innerHTML = categories
        .map(cat => {
            const isActive = activeDrawerCategory === cat.id
            return `
                <button
                    type="button"
                    class="drawer-search-filter-btn px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                        isActive
                            ? 'bg-[#3d4e61] text-white border border-[#4a5e74] shadow-sm'
                            : 'bg-[#18181b] text-zinc-400 hover:text-zinc-200 hover:bg-[#222227] border border-[#2e3037]'
                    }"
                    data-filter="${cat.id}"
                >${cat.label}</button>
            `
        })
        .join('')

    container.querySelectorAll('.drawer-search-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeDrawerCategory = btn.dataset.filter || 'all'
            renderDrawerCategoryFilters(ctx)
            renderDrawerSearchResults(ctx, currentDrawerQuery)
        })
    })
}

/**
 * Renders the search results inside the Search tab container in the Left Drawer.
 *
 * @param {object} ctx Application context
 * @param {string} [query] Optional query (defaults to current input value)
 */
export function renderDrawerSearchResults(ctx, query = null) {
    const resultsContainer = document.getElementById('drawer-search-results')
    const statsEl = document.getElementById('drawer-search-stats')
    const clearBtn = document.getElementById('btn-drawer-search-clear')
    const inputEl = document.getElementById('drawer-search-input')

    if (!resultsContainer) return

    if (query !== null) {
        currentDrawerQuery = query
    } else if (inputEl) {
        currentDrawerQuery = inputEl.value || ''
    }

    if (clearBtn) {
        if (currentDrawerQuery.trim()) {
            clearBtn.classList.remove('hidden')
        } else {
            clearBtn.classList.add('hidden')
        }
    }

    const results = searchProjectObjects(ctx, currentDrawerQuery, activeDrawerCategory)

    if (statsEl) {
        if (currentDrawerQuery.trim()) {
            statsEl.textContent = `${results.length} wyników`
        } else {
            statsEl.textContent = `${results.length} obiektów`
        }
    }

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-1.5">
                <span class="opacity-40 text-zinc-400">${getIconSvg('search', 'w-6 h-6')}</span>
                <p class="text-xs font-medium text-zinc-300">Brak wyników</p>
                <p class="text-[10px] text-zinc-500">Nie znaleziono pasujących obiektów dla frazy "${escapeHtml(currentDrawerQuery)}".</p>
            </div>
        `
        return
    }

    resultsContainer.innerHTML = results
        .map((item, idx) => {
            const highlightedTitle = highlightMatch(item.title, currentDrawerQuery)
            const highlightedDesc = highlightMatch(
                item.description ? item.description.slice(0, 75) : '',
                currentDrawerQuery
            )
            const iconSvg = getIconSvg(item.icon, 'w-3.5 h-3.5')

            return `
                <div
                    class="drawer-search-result-item group p-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 hover:bg-[#1e1f24] transition-all cursor-pointer select-none mb-1"
                    data-index="${idx}"
                    data-item-id="${escapeHtml(item.id)}"
                    data-item-type="${escapeHtml(item.type)}"
                >
                    <div class="flex items-center justify-between gap-1.5 min-w-0">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span class="p-1 rounded shrink-0 border ${item.badgeColor}">
                                ${iconSvg}
                            </span>
                            <span class="font-medium text-xs text-white truncate">
                                ${highlightedTitle}
                            </span>
                        </div>
                        <span class="text-[9px] px-1 py-0.2 rounded uppercase font-semibold shrink-0 border ${item.badgeColor}">
                            ${item.typeLabel}
                        </span>
                    </div>
                    ${
                        highlightedDesc
                            ? `<p class="text-[10px] text-zinc-400 truncate mt-1 leading-tight">${highlightedDesc}</p>`
                            : ''
                    }
                </div>
            `
        })
        .join('')

    resultsContainer.querySelectorAll('.drawer-search-result-item').forEach(el => {
        const index = Number(el.dataset.index)
        el.addEventListener('click', () => {
            const chosen = results[index]
            if (chosen) {
                executeQuickSearchAction(chosen, ctx, { switchDrawerTab: false })
            }
        })
    })
}

/**
 * Initializes the Search tab controls in the Left Drawer.
 *
 * @param {object} ctx Application context
 */
export function setupDrawerSearch(ctx) {
    const input = document.getElementById('drawer-search-input')
    const clearBtn = document.getElementById('btn-drawer-search-clear')

    if (input) {
        input.addEventListener('input', () => {
            currentDrawerQuery = input.value
            renderDrawerSearchResults(ctx, currentDrawerQuery)
        })

        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                input.value = ''
                currentDrawerQuery = ''
                renderDrawerSearchResults(ctx, '')
            }
        })
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (input) {
                input.value = ''
                input.focus()
            }
            currentDrawerQuery = ''
            renderDrawerSearchResults(ctx, '')
        })
    }

    renderDrawerCategoryFilters(ctx)
}

/**
 * Sets up live search input listeners across all individual sections in the Left Drawer:
 * - Paragraphs search (#paragraph-search-input)
 * - Tags search (#tag-search-input)
 * - Scenes search (#scene-search-input)
 * - Connections search (#connection-search-input)
 * - Characters search (#character-search-input)
 * - Locations search (#location-search-input)
 * - Traits search (#trait-search-input)
 *
 * @param {object} ctx Application context
 */
export function setupSectionSearchInputs(ctx) {
    if (!ctx || !ctx.vm) return
    const filter = ctx?.vm?.filter

    // 1. Tags search
    const tagSearch = document.getElementById('tag-search-input')
    if (tagSearch) {
        tagSearch.addEventListener('input', () => {
            filter?.setTagSearchQuery(tagSearch.value)
            renderTagsList(ctx)
        })
    }

    // 2. Scenes search
    const sceneSearch = document.getElementById('scene-search-input')
    if (sceneSearch) {
        sceneSearch.addEventListener('input', () => {
            filter?.setSceneSearchQuery(sceneSearch.value)
            renderScenesList(ctx)
        })
    }

    // 3. Connections search
    const connSearch = document.getElementById('connection-search-input')
    if (connSearch) {
        connSearch.addEventListener('input', () => {
            filter?.setConnectionSearchQuery(connSearch.value)
            renderConnectionsList(ctx)
        })
    }

    // 4. Characters search
    const charSearch = document.getElementById('character-search-input')
    if (charSearch) {
        charSearch.addEventListener('input', () => {
            filter?.setCharacterSearchQuery(charSearch.value)
            renderCharactersList(ctx)
        })
    }

    // 5. Locations search
    const locSearch = document.getElementById('location-search-input')
    if (locSearch) {
        locSearch.addEventListener('input', () => {
            filter?.setLocationSearchQuery(locSearch.value)
            renderLocationsList(ctx)
        })
    }

    // 6. Traits search (Stats, Skills, Parameters, Features)
    const traitSearch = document.getElementById('trait-search-input')
    if (traitSearch) {
        traitSearch.addEventListener('input', () => {
            const query = traitSearch.value
            filter?.setStatSearchQuery(query)
            filter?.setSkillSearchQuery(query)
            filter?.setParameterSearchQuery(query)
            filter?.setFeatureSearchQuery(query)
            renderTraitsList(ctx)
        })
    }

    // 7. Items search
    const itemSearch = document.getElementById('item-search-input')
    if (itemSearch) {
        itemSearch.addEventListener('input', () => {
            if (typeof filter?.setItemSearchQuery === 'function') {
                filter.setItemSearchQuery(itemSearch.value)
            }
            if (typeof ctx.renderItemsList === 'function') {
                ctx.renderItemsList()
            } else {
                renderItemsList(ctx)
            }
        })
    }
}
