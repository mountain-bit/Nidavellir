import { CustomFontsService } from '../../../dist/Modules/Editor/index.js'
import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../htmlTemplates.js'

/**
 * Sets up the Font Browser modal dialog.
 *
 * @param {object} ctx Application UI Context
 * @param {(fontFamily: string) => void} onSelectFont Callback when a font is chosen
 * @returns {{ open: () => void, close: () => void } | null}
 */
export function setupFontBrowserUI(ctx, onSelectFont) {
    const modal = document.getElementById('font-browser-modal')
    const closeBtn = document.getElementById('btn-close-font-browser')
    const offlineAlert = document.getElementById('font-browser-offline-alert')
    const offlineMessage = document.getElementById('font-browser-offline-message')
    const retryBtn = document.getElementById('btn-retry-fetch-fonts')
    const statusBadge = document.getElementById('font-browser-status-badge')
    const searchInput = document.getElementById('font-browser-search-input')
    const sampleInput = document.getElementById('font-browser-sample-input')
    const polishFilter = document.getElementById('font-browser-filter-polish')
    const countLabel = document.getElementById('font-browser-count')
    const categoryBtns = document.querySelectorAll('#font-browser-categories .font-cat-pill')
    const grid = document.getElementById('font-browser-grid')
    const loadMoreBtn = document.getElementById('btn-font-browser-load-more')

    if (!modal) return null

    let catalog = []
    let filtered = []
    let currentCategory = 'all'
    let currentPage = 1
    const PAGE_SIZE = 24
    let isLoading = false

    const renderCards = () => {
        if (!grid) return
        const sampleText = sampleInput?.value?.trim() || t('editor.font_browser.default_sample')
        const countToShow = currentPage * PAGE_SIZE
        const itemsToRender = filtered.slice(0, countToShow)

        if (countLabel) {
            countLabel.textContent = t('editor.font_browser.results_count', {
                count: filtered.length,
            })
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-center">
                    <span class="w-8 h-8 text-zinc-500">${getIconSvg('search', 'w-8 h-8')}</span>
                    <span class="font-medium text-zinc-300">${escapeHtml(t('editor.font_browser.empty_title'))}</span>
                    <span class="text-xs text-zinc-500">${escapeHtml(t('editor.font_browser.empty_hint'))}</span>
                </div>
            `
            if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
            return
        }

        grid.innerHTML = ''
        itemsToRender.forEach(font => {
            CustomFontsService.loadFont(font.family)

            const card = document.createElement('div')
            card.className =
                'border border-zinc-800 bg-zinc-900/70 hover:border-blue-500/60 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 group shadow-xs'

            // Top row
            const topRow = document.createElement('div')
            topRow.className = 'flex items-center justify-between gap-2'

            const titleWrap = document.createElement('div')
            titleWrap.className = 'flex items-center gap-2 min-w-0'

            const fontTitle = document.createElement('span')
            fontTitle.className =
                'font-semibold text-zinc-100 text-xs truncate group-hover:text-blue-300 transition-colors'
            fontTitle.textContent = font.family

            titleWrap.appendChild(fontTitle)

            const badges = document.createElement('div')
            badges.className = 'flex items-center gap-1.5 shrink-0'

            if (font.supportsPolish) {
                const plBadge = document.createElement('span')
                plBadge.className =
                    'text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium'
                plBadge.textContent = 'PL'
                plBadge.title = t('editor.font_browser.polish_badge_title')
                badges.appendChild(plBadge)
            }

            const catBadge = document.createElement('span')
            catBadge.className =
                'text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono capitalize'
            catBadge.textContent = font.category
            badges.appendChild(catBadge)

            topRow.appendChild(titleWrap)
            topRow.appendChild(badges)

            // Preview box
            const previewBox = document.createElement('div')
            previewBox.className =
                'p-3 rounded-lg bg-[#121215] border border-zinc-800/80 text-zinc-200 min-h-[56px] flex items-center overflow-hidden'

            const previewText = document.createElement('div')
            previewText.className = 'text-sm w-full truncate'
            previewText.style.fontFamily = `"${font.family}", serif`
            previewText.textContent = sampleText
            previewBox.appendChild(previewText)

            // Bottom action row
            const bottomRow = document.createElement('div')
            bottomRow.className =
                'flex items-center justify-between pt-1 border-t border-zinc-800/60'

            const tagsText = document.createElement('span')
            tagsText.className = 'text-[10px] text-zinc-500 truncate max-w-[180px]'
            tagsText.textContent =
                font.tags && font.tags.length ? font.tags.slice(0, 3).join(', ') : font.category

            const pickBtn = document.createElement('button')
            pickBtn.type = 'button'
            pickBtn.className =
                'px-3 py-1 rounded-lg bg-[#3d4e61] hover:bg-[#485c72] border border-[#4a5e74] text-white text-xs font-medium cursor-pointer transition-colors shadow-xs ml-auto'
            pickBtn.textContent = t('editor.font_browser.pick_btn')
            pickBtn.addEventListener('click', () => {
                if (typeof onSelectFont === 'function') {
                    onSelectFont(font.family)
                }
                closeModal()
            })

            bottomRow.appendChild(tagsText)
            bottomRow.appendChild(pickBtn)

            card.appendChild(topRow)
            card.appendChild(previewBox)
            card.appendChild(bottomRow)

            grid.appendChild(card)
        })

        if (loadMoreBtn) {
            if (filtered.length > countToShow) {
                loadMoreBtn.classList.remove('hidden')
                loadMoreBtn.textContent = t('editor.font_browser.load_more', {
                    count: filtered.length - countToShow,
                })
            } else {
                loadMoreBtn.classList.add('hidden')
            }
        }
    }

    const applyFilters = () => {
        const query = searchInput?.value || ''
        const onlyPolish = Boolean(polishFilter?.checked)
        filtered = CustomFontsService.filterFonts(catalog, query, currentCategory, onlyPolish)
        currentPage = 1
        renderCards()
    }

    const loadCatalog = async (force = false) => {
        if (isLoading) return
        isLoading = true

        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs font-medium">${escapeHtml(t('editor.font_browser.connecting'))}</span>
                </div>
            `
        }

        try {
            const result = await CustomFontsService.fetchOnlineFonts(5000, force)
            catalog = result.fonts || []

            if (!result.isOnline) {
                offlineAlert?.classList.remove('hidden')
                if (offlineMessage) {
                    offlineMessage.textContent =
                        result.error || t('editor.font_browser.offline_banner')
                }
                if (statusBadge) {
                    statusBadge.textContent = t('editor.font_browser.status_offline')
                    statusBadge.className =
                        'text-[10px] px-2 py-0.5 rounded-full font-normal bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }
                toast.warning(
                    result.error || t('editor.font_browser.offline_banner'),
                    t('editor.font_browser.title')
                )
            } else {
                offlineAlert?.classList.add('hidden')
                if (statusBadge) {
                    statusBadge.textContent = t('editor.font_browser.status_online', {
                        count: catalog.length,
                    })
                    statusBadge.className =
                        'text-[10px] px-2 py-0.5 rounded-full font-normal bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }
            }

            applyFilters()
        } catch {
            offlineAlert?.classList.remove('hidden')
            if (offlineMessage) {
                offlineMessage.textContent = t('editor.font_browser.offline_banner')
            }
            catalog = CustomFontsService.getOfflineCatalog()
            applyFilters()
        } finally {
            isLoading = false
        }
    }

    const openModal = () => {
        modal.classList.remove('hidden')
        if (catalog.length === 0) {
            loadCatalog()
        } else {
            applyFilters()
        }
        setTimeout(() => searchInput?.focus(), 50)
    }

    const closeModal = () => {
        modal.classList.add('hidden')
    }

    closeBtn?.addEventListener('click', closeModal)
    retryBtn?.addEventListener('click', () => loadCatalog(true))

    searchInput?.addEventListener('input', () => applyFilters())
    sampleInput?.addEventListener('input', () => renderCards())
    polishFilter?.addEventListener('change', () => applyFilters())

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.classList.remove('bg-[#3d4e61]', 'text-white', 'border-[#4a5e74]')
                b.classList.add('bg-[#1e1f24]', 'text-zinc-300', 'border-[#2e3037]')
            })
            btn.classList.remove('bg-[#1e1f24]', 'text-zinc-300', 'border-[#2e3037]')
            btn.classList.add('bg-[#3d4e61]', 'text-white', 'border-[#4a5e74]')

            currentCategory = btn.getAttribute('data-font-category') || 'all'
            applyFilters()
        })
    })

    loadMoreBtn?.addEventListener('click', () => {
        currentPage++
        renderCards()
    })

    return {
        open: openModal,
        close: closeModal,
    }
}
