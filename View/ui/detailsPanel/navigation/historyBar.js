/**
 * Details Panel Navigation - History Bar Module
 *
 * Renders the top horizontal history bar of recently visited entities in the right sidebar.
 * Supports accessible tabs (WAI-ARIA tablist), event delegation, scroll position preservation,
 * focus retention, mouse wheel horizontal scrolling, and keyboard navigation.
 */

import {
    renderCloseAllButtonHtml,
    renderEmptyHistoryHtml,
    renderHistoryTabHtml,
} from './historyBarTemplates.js'

// Re-export template functions for backward compatibility
export { renderCloseAllButtonHtml, renderEmptyHistoryHtml, renderHistoryTabHtml }

/**
 * Resolves the DOM container for the history tabs bar.
 *
 * @param {object} [ctx] Application UI Context
 * @param {HTMLElement} [overrideContainer]
 * @returns {HTMLElement|null}
 */
export function resolveHistoryContainer(ctx, overrideContainer) {
    if (overrideContainer && overrideContainer instanceof HTMLElement) {
        return overrideContainer
    }
    if (ctx?.historyTabsContainer instanceof HTMLElement) {
        return ctx.historyTabsContainer
    }
    return document.getElementById('history-tabs-container')
}

/**
 * Handles keyboard navigation within the history tabs bar.
 * Supports ArrowLeft, ArrowRight, Home, End, Enter, Space, and Delete.
 *
 * @param {KeyboardEvent} e
 * @param {HTMLElement} scrollWrapper
 * @param {object} selection
 * @param {Function} refresh
 */
function handleHistoryKeydown(e, scrollWrapper, selection, refresh) {
    const tabs = Array.from(scrollWrapper.querySelectorAll('.history-tab-btn'))
    const activeElement = document.activeElement
    const currentIndex = tabs.findIndex(tab => tab === activeElement || tab.contains(activeElement))

    if (currentIndex === -1) return

    const currentTab = tabs[currentIndex]
    const itemId = currentTab.dataset.historyId

    switch (e.key) {
        case 'ArrowRight': {
            e.preventDefault()
            const nextTab = tabs[(currentIndex + 1) % tabs.length]
            nextTab?.focus()
            break
        }
        case 'ArrowLeft': {
            e.preventDefault()
            const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length]
            prevTab?.focus()
            break
        }
        case 'Home': {
            e.preventDefault()
            tabs[0]?.focus()
            break
        }
        case 'End': {
            e.preventDefault()
            tabs[tabs.length - 1]?.focus()
            break
        }
        case 'Enter':
        case ' ': {
            // Activate tab if not focused on close button
            if (activeElement && !activeElement.classList.contains('btn-close-history-item')) {
                e.preventDefault()
                if (itemId) {
                    selection?.selectHistoryItem?.(itemId)
                    refresh()
                }
            }
            break
        }
        case 'Delete': {
            e.preventDefault()
            if (itemId) {
                // Determine next tab to focus before closing
                const nextToFocus = tabs[currentIndex + 1] || tabs[currentIndex - 1] || null
                const nextFocusId = nextToFocus?.dataset?.historyId

                selection?.closeHistoryItem?.(itemId)
                refresh({ focusItemId: nextFocusId })
            }
            break
        }
    }
}

/**
 * Renders the top history tabs bar in the right sidebar.
 *
 * @param {object} ctx Application UI Context
 * @param {Function|object} [onRefreshDetailsOrOptions] Optional callback to refresh details panel or options object
 */
export function renderHistoryBar(ctx, onRefreshDetailsOrOptions) {
    const onRefreshDetails =
        typeof onRefreshDetailsOrOptions === 'function'
            ? onRefreshDetailsOrOptions
            : onRefreshDetailsOrOptions?.onRefreshDetails

    const targetContainer = onRefreshDetailsOrOptions?.container || resolveHistoryContainer(ctx)

    if (!targetContainer) return

    // Preserve previous horizontal scroll offset if tabs were already rendered
    const previousScrollWrapper = targetContainer.querySelector('.history-tabs-scroll-wrapper')
    const previousScrollLeft = previousScrollWrapper ? previousScrollWrapper.scrollLeft : 0

    // Check if an existing tab was focused to retain keyboard focus after re-render
    const activeElement = document.activeElement
    const focusedTabId =
        onRefreshDetailsOrOptions?.focusItemId ||
        (activeElement?.classList?.contains('history-tab-btn')
            ? activeElement.dataset.historyId
            : activeElement?.closest('.history-tab-btn')?.dataset.historyId)

    targetContainer.innerHTML = ''

    const selection = ctx?.vm?.selection
    const history = selection?.getHistory ? selection.getHistory() : []
    const selected = selection?.getSelectedItem ? selection.getSelectedItem() : null

    if (!history || history.length === 0) {
        targetContainer.innerHTML = renderEmptyHistoryHtml()
        return
    }

    const refresh = extraOptions => {
        const mergedOptions =
            typeof onRefreshDetailsOrOptions === 'function'
                ? { onRefreshDetails, ...extraOptions }
                : { ...onRefreshDetailsOrOptions, ...extraOptions }

        renderHistoryBar(ctx, mergedOptions)

        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    // Create tabs scroll container with WAI-ARIA tablist semantics
    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'history-tabs-scroll-wrapper flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'
    scrollWrapper.setAttribute('role', 'tablist')
    scrollWrapper.setAttribute('aria-orientation', 'horizontal')

    // Generate tabs HTML in bulk
    const tabsHtml = history
        .map(item => {
            const isActive =
                Boolean(selected) && selected.id === item.id && selected.type === item.type
            return renderHistoryTabHtml({ item, isActive })
        })
        .join('')

    scrollWrapper.innerHTML = tabsHtml

    // Delegated click handler on the scroll container (efficient, prevents memory leaks)
    scrollWrapper.addEventListener('click', e => {
        const target = e.target

        // 1. Check if clicked on or within a tab close button
        const closeBtn = target.closest('.btn-close-history-item')
        if (closeBtn) {
            e.stopPropagation()
            const closeId =
                closeBtn.dataset.closeId || closeBtn.closest('.history-tab-btn')?.dataset.historyId
            if (closeId) {
                selection?.closeHistoryItem?.(closeId)
                refresh()
            }
            return
        }

        // 2. Check if clicked on or within a tab button
        const tabBtn = target.closest('.history-tab-btn')
        if (tabBtn) {
            const historyId = tabBtn.dataset.historyId
            if (historyId) {
                selection?.selectHistoryItem?.(historyId)
                refresh()
            }
        }
    })

    // Keyboard navigation support
    scrollWrapper.addEventListener('keydown', e => {
        handleHistoryKeydown(e, scrollWrapper, selection, refresh)
    })

    // Horizontal mouse wheel scrolling support
    scrollWrapper.addEventListener(
        'wheel',
        e => {
            if (e.deltaY !== 0 && scrollWrapper.scrollWidth > scrollWrapper.clientWidth) {
                e.preventDefault()
                scrollWrapper.scrollLeft += e.deltaY
            }
        },
        { passive: false }
    )

    // Close all button
    const closeAllWrapper = document.createElement('div')
    closeAllWrapper.innerHTML = renderCloseAllButtonHtml()
    const closeAllBtn = closeAllWrapper.firstElementChild

    if (closeAllBtn) {
        closeAllBtn.addEventListener('click', () => {
            selection?.closeAllHistory?.()
            refresh()
        })
    }

    targetContainer.appendChild(scrollWrapper)
    if (closeAllBtn) {
        targetContainer.appendChild(closeAllBtn)
    }

    // Restore scroll position after DOM nodes are attached
    if (previousScrollLeft > 0) {
        scrollWrapper.scrollLeft = previousScrollLeft
    }

    // Retain keyboard focus after re-render if active element was a tab
    if (focusedTabId) {
        const tabToFocus = scrollWrapper.querySelector(`[data-history-id="${focusedTabId}"]`)
        tabToFocus?.focus()
    }
}
