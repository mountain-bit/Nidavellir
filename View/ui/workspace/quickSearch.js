import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { executeQuickSearchAction } from './quickSearchActions.js'
import { searchProjectObjects } from './quickSearchEngine.js'
import { highlightMatch } from './quickSearchIndexer.js'

export { executeQuickSearchAction } from './quickSearchActions.js'
export { scoreCandidate, searchProjectObjects } from './quickSearchEngine.js'
export { getAllProjectObjects, getEntityText, highlightMatch } from './quickSearchIndexer.js'

let activeContext = null
let currentQuery = ''
let activeCategoryFilter = 'all'
let currentResults = []
let activeSelectedIndex = 0

/**
 * Renders category filter buttons inside quick search modal.
 */
function renderCategoryFilters() {
    const container = document.getElementById('quick-search-category-filters')
    if (!container) return

    const categories = [
        { id: 'all', label: 'Wszystkie' },
        { id: 'paragraphs', label: 'Paragrafy' },
        { id: 'scenes', label: 'Sceny' },
        { id: 'characters', label: 'Postacie' },
        { id: 'locations', label: 'Lokacje' },
        { id: 'items', label: 'Przedmioty' },
        { id: 'rules', label: 'Cechy i Zasady' },
    ]

    container.innerHTML = categories
        .map(cat => {
            const isActive = activeCategoryFilter === cat.id
            return `
                <button
                    type="button"
                    class="quick-search-filter-btn px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer font-medium ${
                        isActive
                            ? 'bg-[#3d4e61] text-white border border-[#4a5e74] shadow-sm'
                            : 'bg-[#1e1f24] text-zinc-400 hover:text-zinc-200 hover:bg-[#25272e] border border-[#2e3037]'
                    }"
                    data-filter="${cat.id}"
                >${cat.label}</button>
            `
        })
        .join('')

    container.querySelectorAll('.quick-search-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategoryFilter = btn.dataset.filter || 'all'
            renderCategoryFilters()
            renderQuickSearchResults(activeContext, currentQuery)
        })
    })
}

/**
 * Updates CSS classes on items to reflect current keyboard active selection without re-rendering entire list.
 *
 * @param {HTMLElement} container
 */
function updateActiveItemHighlight(container) {
    if (!container) return
    const items = container.querySelectorAll('.quick-search-item')
    items.forEach((el, idx) => {
        const actionBadge = el.querySelector('span:last-child')
        if (idx === activeSelectedIndex) {
            el.className =
                'quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none bg-blue-600/20 border border-blue-500/40 text-white ring-1 ring-blue-500/30'
            if (actionBadge) {
                actionBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded transition-opacity opacity-100 text-blue-300 bg-blue-500/20 border border-blue-500/30'
            }
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        } else {
            el.className =
                'quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none bg-[#18181b]/80 border border-[#27272a] hover:bg-[#202025] hover:border-zinc-700 text-zinc-200'
            if (actionBadge) {
                actionBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded transition-opacity opacity-0 group-hover:opacity-100 text-zinc-400 bg-zinc-800 border border-zinc-700'
            }
        }
    })
}

/**
 * Renders the search results inside the modal list container.
 *
 * @param {object} ctx
 * @param {string} query
 */
export function renderQuickSearchResults(ctx, query) {
    const resultsContainer = document.getElementById('quick-search-results')
    const statsEl = document.getElementById('quick-search-stats')
    const clearBtn = document.getElementById('btn-quick-search-clear')

    if (!resultsContainer) return

    if (clearBtn) {
        if (query && query.trim()) {
            clearBtn.classList.remove('hidden')
        } else {
            clearBtn.classList.add('hidden')
        }
    }

    currentQuery = query || ''
    const results = searchProjectObjects(ctx, currentQuery, activeCategoryFilter)
    currentResults = results

    if (statsEl) {
        if (currentQuery.trim()) {
            statsEl.textContent = `Wyniki: ${results.length}`
        } else {
            statsEl.textContent = `Dostępne obiekty: ${results.length}`
        }
    }

    if (results.length === 0) {
        activeSelectedIndex = -1
        resultsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center text-zinc-400 gap-2">
                <span class="opacity-50">${getIconSvg('search', 'w-8 h-8')}</span>
                <p class="text-xs font-medium text-zinc-300">Brak wyników dla frazy "${escapeHtml(currentQuery)}"</p>
                <p class="text-[11px] text-zinc-500">Spróbuj wpisać inną nazwę lub zmień filtr kategorii.</p>
            </div>
        `
        return
    }

    if (activeSelectedIndex >= results.length || activeSelectedIndex < 0) {
        activeSelectedIndex = 0
    }

    resultsContainer.innerHTML = results
        .map((item, idx) => {
            const isSelected = idx === activeSelectedIndex
            const highlightedTitle = highlightMatch(item.title, currentQuery)
            const highlightedDesc = highlightMatch(
                item.description ? item.description.slice(0, 90) : '',
                currentQuery
            )
            const iconSvg = getIconSvg(item.icon, 'w-4 h-4')

            return `
                <div
                    class="quick-search-item group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer select-none ${
                        isSelected
                            ? 'bg-[#3d4e61]/35 border border-[#4a5e74] text-white ring-1 ring-[#5b738e]/40'
                            : 'bg-[#1e1f24] border border-[#2e3037] hover:bg-[#25272e] hover:border-[#4a5e74]/50 text-zinc-200'
                    }"
                    data-index="${idx}"
                    data-item-id="${escapeHtml(item.id)}"
                    data-item-type="${escapeHtml(item.type)}"
                >
                    <div class="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${item.badgeColor}">
                            ${iconSvg}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-zinc-100'}">
                                    ${highlightedTitle}
                                </span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider shrink-0 ${item.badgeColor}">
                                    ${item.typeLabel}
                                </span>
                            </div>
                            ${
                                highlightedDesc
                                    ? `<p class="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight">${highlightedDesc}</p>`
                                    : ''
                            }
                        </div>
                    </div>
                    <div class="shrink-0 flex items-center gap-2">
                        <span class="text-[10px] font-medium px-2 py-0.5 rounded transition-opacity ${
                            isSelected
                                ? 'opacity-100 text-blue-300 bg-blue-500/20 border border-blue-500/30'
                                : 'opacity-0 group-hover:opacity-100 text-zinc-400 bg-zinc-800 border border-zinc-700'
                        }">
                            ↵ ${item.actionText}
                        </span>
                    </div>
                </div>
            `
        })
        .join('')

    // Attach click and mouseover listeners
    resultsContainer.querySelectorAll('.quick-search-item').forEach(el => {
        const index = Number(el.dataset.index)

        el.addEventListener('click', () => {
            const chosen = results[index]
            if (chosen) {
                closeQuickSearch()
                executeQuickSearchAction(chosen, ctx)
            }
        })

        el.addEventListener('mouseenter', () => {
            activeSelectedIndex = index
            updateActiveItemHighlight(resultsContainer)
        })
    })
}

/**
 * Opens the Quick Search spotlight modal.
 *
 * @param {object} ctx - Application Context
 */
export function openQuickSearch(ctx) {
    activeContext = ctx
    const modal = document.getElementById('modal-quick-search')
    if (modal) {
        modal.classList.remove('hidden')
        activeCategoryFilter = 'all'
        activeSelectedIndex = 0
        renderCategoryFilters()

        const input = document.getElementById('quick-search-input')
        if (input) {
            input.value = ''
            renderQuickSearchResults(ctx, '')
            setTimeout(() => {
                input.focus()
            }, 30)
        }
        return
    }

    // Graceful fallback if modal is not in DOM (e.g. legacy test environment)
    const searchInput = document.getElementById('search-input')
    if (searchInput) {
        if (
            ctx?.vm &&
            typeof ctx.vm?.layout?.isLeftDrawerOpen === 'function' &&
            !ctx.vm.layout.isLeftDrawerOpen()
        ) {
            ctx.vm.layout.toggleLeftTab('paragraphs')
            if (typeof ctx.updateLeftDrawerUI === 'function') ctx.updateLeftDrawerUI()
        }
        searchInput.focus()
    } else {
        toast.info(t('topbar.buttons.search') || 'Szukaj')
    }
}

/**
 * Closes the Quick Search spotlight modal.
 */
export function closeQuickSearch() {
    const modal = document.getElementById('modal-quick-search')
    if (modal) {
        modal.classList.add('hidden')
    }
}

/**
 * Initializes Quick Search controller listeners and DOM bindings.
 *
 * @param {object} ctx - Application context
 */
export function initQuickSearch(ctx) {
    activeContext = ctx
    const modal = document.getElementById('modal-quick-search')
    const input = document.getElementById('quick-search-input')
    const clearBtn = document.getElementById('btn-quick-search-clear')

    if (input) {
        input.addEventListener('input', () => {
            activeSelectedIndex = 0
            renderQuickSearchResults(activeContext, input.value)
        })

        input.addEventListener('keydown', e => {
            const resultsContainer = document.getElementById('quick-search-results')
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (currentResults.length > 0) {
                    activeSelectedIndex = (activeSelectedIndex + 1) % currentResults.length
                    updateActiveItemHighlight(resultsContainer)
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (currentResults.length > 0) {
                    activeSelectedIndex =
                        (activeSelectedIndex - 1 + currentResults.length) % currentResults.length
                    updateActiveItemHighlight(resultsContainer)
                }
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (currentResults.length > 0 && activeSelectedIndex >= 0) {
                    const chosen = currentResults[activeSelectedIndex]
                    if (chosen) {
                        closeQuickSearch()
                        executeQuickSearchAction(chosen, activeContext)
                    }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault()
                closeQuickSearch()
            }
        })
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (input) {
                input.value = ''
                input.focus()
                activeSelectedIndex = 0
                renderQuickSearchResults(activeContext, '')
            }
        })
    }

    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                closeQuickSearch()
            }
        })
    }

    // Connect topbar quick-search buttons
    document.querySelectorAll('[data-action="quick-search"]').forEach(btn => {
        btn.onclick = e => {
            e.preventDefault()
            openQuickSearch(ctx)
        }
    })
}
