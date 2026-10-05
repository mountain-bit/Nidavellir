import {
    CustomFontsService,
    CustomStylesService,
    EntitySyncService,
    MarkdownEditor,
} from '../../dist/Modules/Editor/index.js'
import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { escapeHtml } from './htmlTemplates.js'

/**
 * Sets up drag-to-resize splitters for left drawer and right sidebar.
 *
 * @param {HTMLElement} leftDrawer
 * @param {HTMLElement} rightSidebar
 * @param {object} vm
 */
export function setupResizers(leftDrawer, rightSidebar, vm) {
    const leftResizer = document.getElementById('left-resizer')
    const rightResizer = document.getElementById('right-resizer')

    if (leftResizer && leftDrawer) {
        let isDraggingLeft = false
        let startX = 0
        let startWidth = 0
        let rafId = null

        leftResizer.addEventListener('mousedown', e => {
            e.preventDefault()
            isDraggingLeft = true
            startX = e.clientX
            startWidth = leftDrawer.getBoundingClientRect().width
            leftResizer.classList.add('resizing')
            document.body.classList.add('is-resizing')
        })

        window.addEventListener('mousemove', e => {
            if (!isDraggingLeft) return
            const clientX = e.clientX
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (!isDraggingLeft) return
                const delta = clientX - startX
                const newWidth = Math.max(180, Math.min(600, Math.round(startWidth + delta)))
                leftDrawer.style.width = `${newWidth}px`
                leftDrawer.style.setProperty('--left-drawer-width', `${newWidth}px`)
                vm.setLeftDrawerWidth(newWidth)
                window.dispatchEvent(new Event('resize'))
            })
        })

        window.addEventListener('mouseup', () => {
            if (isDraggingLeft) {
                isDraggingLeft = false
                if (rafId) {
                    cancelAnimationFrame(rafId)
                    rafId = null
                }
                leftResizer.classList.remove('resizing')
                document.body.classList.remove('is-resizing')
                window.dispatchEvent(new Event('resize'))
            }
        })
    }

    if (rightResizer && rightSidebar) {
        let isDraggingRight = false
        let startX = 0
        let startWidth = 0
        let rafId = null

        rightResizer.addEventListener('mousedown', e => {
            e.preventDefault()
            isDraggingRight = true
            startX = e.clientX
            startWidth = rightSidebar.getBoundingClientRect().width
            rightResizer.classList.add('resizing')
            document.body.classList.add('is-resizing')
        })

        window.addEventListener('mousemove', e => {
            if (!isDraggingRight) return
            const clientX = e.clientX
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (!isDraggingRight) return
                const delta = startX - clientX
                const newWidth = Math.max(220, Math.min(700, Math.round(startWidth + delta)))
                rightSidebar.style.width = `${newWidth}px`
                rightSidebar.style.setProperty('--right-sidebar-width', `${newWidth}px`)
                vm.setRightSidebarWidth(newWidth)
                window.dispatchEvent(new Event('resize'))
            })
        })

        window.addEventListener('mouseup', () => {
            if (isDraggingRight) {
                isDraggingRight = false
                if (rafId) {
                    cancelAnimationFrame(rafId)
                    rafId = null
                }
                rightResizer.classList.remove('resizing')
                document.body.classList.remove('is-resizing')
                window.dispatchEvent(new Event('resize'))
            }
        })
    }

    if (leftDrawer) {
        leftDrawer.addEventListener('transitionend', e => {
            if (e.target === leftDrawer && e.propertyName === 'width') {
                window.dispatchEvent(new Event('resize'))
            }
        })
    }
    if (rightSidebar) {
        rightSidebar.addEventListener('transitionend', e => {
            if (e.target === rightSidebar && e.propertyName === 'width') {
                window.dispatchEvent(new Event('resize'))
            }
        })
    }
}

/**
 * Updates Right Sidebar collapsed / expanded UI classes and toggle button states.
 *
 * @param {object} vm
 * @param {HTMLElement} rightSidebar
 * @param {HTMLElement} toggleRightSidebarBtn
 * @param {HTMLElement} reopenRightSidebarBtn
 */
export function updateRightSidebarUI(
    vm,
    rightSidebar,
    toggleRightSidebarBtn,
    reopenRightSidebarBtn
) {
    const isCollapsed = vm.isRightSidebarCollapsed()
    const rightResizer = document.getElementById('right-resizer')
    if (isCollapsed) {
        if (rightSidebar) rightSidebar.classList.add('collapsed')
        if (rightResizer) rightResizer.classList.add('collapsed')
        if (toggleRightSidebarBtn) toggleRightSidebarBtn.textContent = '‹'
        if (reopenRightSidebarBtn) reopenRightSidebarBtn.classList.remove('hidden')
    } else {
        if (rightSidebar) rightSidebar.classList.remove('collapsed')
        if (rightResizer) rightResizer.classList.remove('collapsed')
        if (toggleRightSidebarBtn) toggleRightSidebarBtn.textContent = '›'
        if (reopenRightSidebarBtn) reopenRightSidebarBtn.classList.add('hidden')
    }
}

let mainEditorInstance = null
let toolbarInitialized = false

function updateEditorStats(editor) {
    const statsEl = document.getElementById('editor-stats')
    if (!statsEl || !editor) return
    const words = editor.getWordCount()
    const chars = editor.getCharacterCount()
    statsEl.textContent = `${words} słów · ${chars} znaków`
}

function syncEntitiesWithActiveObject(ctx, entities) {
    const selectedItem = ctx.vm && ctx.vm.getSelectedItem ? ctx.vm.getSelectedItem() : null
    if (!selectedItem || !selectedItem.entity) return

    const entityObj = selectedItem.entity
    let changed = false

    if (
        typeof entityObj.addLocation === 'function' &&
        typeof entityObj.addCharacter === 'function'
    ) {
        const syncRes = EntitySyncService.syncWithParagraph(entityObj, entities, ctx.projectData)
        if (syncRes.changed) {
            changed = true
            if (syncRes.addedLocations.length > 0) {
                toast.info(
                    `Powiązano lokację: ${syncRes.addedLocations.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
            if (syncRes.addedCharacters.length > 0) {
                toast.info(
                    `Powiązano postać: ${syncRes.addedCharacters.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    `Powiązano tag: ${syncRes.addedTags.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
        }
    } else if (typeof entityObj.addTag === 'function') {
        const syncRes = EntitySyncService.syncWithNPC(entityObj, entities, ctx.projectData)
        if (syncRes.changed) {
            changed = true
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    `Dodano cechę: ${syncRes.addedTags.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
        }
    }

    if (changed && typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
}

const TOOLBAR_BUTTON_STATE_MAP = [
    { id: 'btn-editor-p', key: 'paragraph' },
    { id: 'btn-editor-h1', key: 'h1' },
    { id: 'btn-editor-h2', key: 'h2' },
    { id: 'btn-editor-h3', key: 'h3' },
    { id: 'btn-editor-h4', key: 'h4' },
    { id: 'btn-editor-h5', key: 'h5' },
    { id: 'btn-editor-bold', key: 'bold' },
    { id: 'btn-editor-italic', key: 'italic' },
    { id: 'btn-editor-underline', key: 'underline' },
    { id: 'btn-editor-strike', key: 'strike' },
    { id: 'btn-editor-bullet-list', key: 'bulletList' },
    { id: 'btn-editor-ordered-list', key: 'orderedList' },
    { id: 'btn-editor-quote', key: 'blockquote' },
    { id: 'btn-editor-dialog', key: 'dialog' },
]

export function updateToolbarActiveStates(activeStates, ctx) {
    if (!activeStates) return
    TOOLBAR_BUTTON_STATE_MAP.forEach(({ id, key }) => {
        const btn = document.getElementById(id)
        if (!btn) return
        const isActive = Boolean(activeStates[key])
        if (isActive) {
            btn.classList.add('bg-blue-600/30', 'text-blue-300', 'ring-1', 'ring-blue-500/50')
            btn.classList.remove('text-zinc-300', 'text-zinc-400')
        } else {
            btn.classList.remove('bg-blue-600/30', 'text-blue-300', 'ring-1', 'ring-blue-500/50')
            if (id === 'btn-editor-h4' || id === 'btn-editor-h5') {
                btn.classList.add('text-zinc-400')
            } else {
                btn.classList.add('text-zinc-300')
            }
        }
    })

    const customStylesBtn = document.getElementById('btn-editor-custom-styles-dropdown')
    const activeLabel = document.getElementById('label-active-custom-style')
    if (customStylesBtn && activeLabel) {
        if (activeStates.customStyle && activeStates.activeCustomStyleId) {
            const styles = CustomStylesService.getStyles(ctx?.projectData)
            const matched = styles.find(s => s.id === activeStates.activeCustomStyleId)
            activeLabel.textContent = matched ? matched.name : 'Własny styl'
            customStylesBtn.classList.add(
                'bg-blue-600/30',
                'text-blue-300',
                'ring-1',
                'ring-blue-500/50'
            )
        } else {
            activeLabel.textContent = 'Style tekstu'
            customStylesBtn.classList.remove(
                'bg-blue-600/30',
                'text-blue-300',
                'ring-1',
                'ring-blue-500/50'
            )
        }
    }
}

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
        const sampleText =
            sampleInput?.value?.trim() || 'Zażółć gęślą jaźń — prastara pieczęć runiczna'
        const countToShow = currentPage * PAGE_SIZE
        const itemsToRender = filtered.slice(0, countToShow)

        if (countLabel) {
            countLabel.textContent = `Wyników: ${filtered.length}`
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-center">
                    <span class="text-3xl">🔍</span>
                    <span class="font-medium text-zinc-300">Nie znaleziono czcionek spełniających kryteria</span>
                    <span class="text-xs text-zinc-500">Spróbuj zmienić kategorię lub wyczyścić pole wyszukiwania</span>
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
                plBadge.title = 'Obsługuje polskie znaki diakrytyczne (ą, ę, ś, ć...)'
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
                'px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs ml-auto'
            pickBtn.textContent = 'Wybierz tę czcionkę'
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
                loadMoreBtn.textContent = `Pokaż więcej (${filtered.length - countToShow} pozostało)...`
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
                    <span class="text-xs font-medium">Łączenie z bazą czcionek...</span>
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
                        result.error ||
                        'Brak połączenia z internetem. Wyświetlamy podręczny katalog czcionek offline.'
                }
                if (statusBadge) {
                    statusBadge.textContent = 'Tryb offline'
                    statusBadge.className =
                        'text-[10px] px-2 py-0.5 rounded-full font-normal bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }
                toast.warning(
                    result.error ||
                        'Brak połączenia z internetem. Używam wbudowanego katalogu czcionek.',
                    'Katalog czcionek'
                )
            } else {
                offlineAlert?.classList.add('hidden')
                if (statusBadge) {
                    statusBadge.textContent = `Online (${catalog.length})`
                    statusBadge.className =
                        'text-[10px] px-2 py-0.5 rounded-full font-normal bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }
            }

            applyFilters()
        } catch (err) {
            offlineAlert?.classList.remove('hidden')
            if (offlineMessage) {
                offlineMessage.textContent = 'Nie udało się nawiązać połączenia z internetem.'
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
                b.classList.remove('bg-blue-600', 'text-white')
                b.classList.add('bg-zinc-800', 'text-zinc-300')
            })
            btn.classList.remove('bg-zinc-800', 'text-zinc-300')
            btn.classList.add('bg-blue-600', 'text-white')

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

function setupCustomStylesUI(editor, ctx) {
    const dropdownBtn = document.getElementById('btn-editor-custom-styles-dropdown')
    const dropdownMenu = document.getElementById('editor-custom-styles-dropdown-menu')
    const container = document.getElementById('custom-styles-list-container')
    const clearBtn = document.getElementById('btn-clear-custom-style')
    const openModalBtn = document.getElementById('btn-open-custom-style-modal')

    // Modal elements
    const modal = document.getElementById('custom-style-modal')
    const form = document.getElementById('custom-style-form')
    const closeBtn = document.getElementById('btn-close-custom-style-modal')
    const cancelBtn = document.getElementById('btn-cancel-custom-style-modal')
    const deleteBtn = document.getElementById('btn-delete-custom-style')
    const modalTitle = document.getElementById('custom-style-modal-title')

    const idInput = document.getElementById('custom-style-id')
    const nameInput = document.getElementById('custom-style-name')
    const colorPicker = document.getElementById('custom-style-color-picker')
    const bgEnabled = document.getElementById('custom-style-bg-enabled')
    const bgControls = document.getElementById('custom-style-bg-controls')
    const bgColorPicker = document.getElementById('custom-style-bg-color-picker')
    const italicCb = document.getElementById('custom-style-italic')
    const boldCb = document.getElementById('custom-style-bold')
    const underlineCb = document.getElementById('custom-style-underline')
    const borderCb = document.getElementById('custom-style-border')
    const fontFamilySelect = document.getElementById('custom-style-font-family')
    const toggleAddFontBtn = document.getElementById('btn-toggle-add-font-form')
    const addFontInlineForm = document.getElementById('add-font-inline-form')
    const closeAddFontBtn = document.getElementById('btn-close-add-font-form')
    const newFontInput = document.getElementById('new-font-name-input')
    const confirmAddFontBtn = document.getElementById('btn-confirm-add-font')
    const presetFontBtns = document.querySelectorAll('[data-preset-font]')
    const livePreview = document.getElementById('custom-style-live-preview')
    const quickColors = document.querySelectorAll('#custom-style-quick-colors button')

    const populateFontSelect = (selectedFont = 'sans') => {
        if (!fontFamilySelect) return
        fontFamilySelect.innerHTML = ''

        const standardGroup = document.createElement('optgroup')
        standardGroup.label = 'Standardowe'

        const optSans = document.createElement('option')
        optSans.value = 'sans'
        optSans.textContent = 'Domyślna (Bezszeryfowa / Sans)'
        standardGroup.appendChild(optSans)

        const optSerif = document.createElement('option')
        optSerif.value = 'serif'
        optSerif.textContent = 'Książkowa (Szeryfowa / Serif)'
        standardGroup.appendChild(optSerif)

        const optMono = document.createElement('option')
        optMono.value = 'mono'
        optMono.textContent = 'Maszynopis (Monospace)'
        standardGroup.appendChild(optMono)

        fontFamilySelect.appendChild(standardGroup)

        const fonts = CustomFontsService.getFonts(ctx?.projectData)
        CustomFontsService.loadAllFonts(ctx?.projectData)

        const customGroup = document.createElement('optgroup')
        customGroup.label = 'Klimatyczne & Własne czcionki'

        fonts.forEach(f => {
            const opt = document.createElement('option')
            opt.value = f.name
            opt.textContent = f.category ? `${f.name} (${f.category})` : f.name
            customGroup.appendChild(opt)
        })

        fontFamilySelect.appendChild(customGroup)
        fontFamilySelect.value = selectedFont || 'sans'
    }

    const updatePreview = () => {
        if (!livePreview) return
        livePreview.style.color = colorPicker?.value || '#c084fc'
        if (bgEnabled?.checked && bgColorPicker?.value) {
            livePreview.style.backgroundColor = bgColorPicker.value
            livePreview.style.padding = '0.15em 0.5em'
            livePreview.style.borderRadius = '0.25rem'
        } else {
            livePreview.style.backgroundColor = 'transparent'
            livePreview.style.padding = '0'
        }
        livePreview.style.fontStyle = italicCb?.checked ? 'italic' : 'normal'
        livePreview.style.fontWeight = boldCb?.checked ? '700' : '400'
        livePreview.style.textDecoration = underlineCb?.checked ? 'underline' : 'none'
        if (borderCb?.checked) {
            livePreview.style.border = `1px solid ${colorPicker?.value || '#52525b'}`
            livePreview.style.borderRadius = '0.25rem'
            livePreview.style.padding = '0.1em 0.4em'
        } else if (!bgEnabled?.checked) {
            livePreview.style.border = 'none'
        }
        const font = fontFamilySelect?.value
        if (font === 'serif') {
            livePreview.style.fontFamily = 'ui-serif, Georgia, Cambria, serif'
        } else if (font === 'mono') {
            livePreview.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace'
        } else if (font === 'sans') {
            livePreview.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif'
        } else if (font) {
            CustomFontsService.loadFont(font)
            livePreview.style.fontFamily = `"${font}", ui-serif, serif`
        } else {
            livePreview.style.fontFamily = 'inherit'
        }
    }

    const handleAddFont = fontName => {
        const clean = (fontName || '').trim()
        if (!clean) {
            toast.error('Wpisz nazwę czcionki', 'Błąd')
            newFontInput?.focus()
            return
        }
        CustomFontsService.addFont(ctx?.projectData, clean)
        populateFontSelect(clean)
        addFontInlineForm?.classList.add('hidden')
        if (newFontInput) newFontInput.value = ''
        updatePreview()
        toast.success(`Dodano czcionkę: ${clean}`, 'Czcionki')
    }

    const openFontBrowserBtn = document.getElementById('btn-open-font-browser')
    const quickBrowseBtn = document.getElementById('btn-trigger-font-browser-icon')

    const fontBrowser = setupFontBrowserUI(ctx, fontName => {
        handleAddFont(fontName)
    })

    openFontBrowserBtn?.addEventListener('click', () => {
        fontBrowser?.open()
    })

    quickBrowseBtn?.addEventListener('click', () => {
        fontBrowser?.open()
    })

    toggleAddFontBtn?.addEventListener('click', () => {
        addFontInlineForm?.classList.toggle('hidden')
        if (!addFontInlineForm?.classList.contains('hidden')) {
            newFontInput?.focus()
        }
    })

    closeAddFontBtn?.addEventListener('click', () => {
        addFontInlineForm?.classList.add('hidden')
    })

    confirmAddFontBtn?.addEventListener('click', () => {
        handleAddFont(newFontInput?.value)
    })

    newFontInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddFont(newFontInput?.value)
        }
    })

    presetFontBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const font = btn.getAttribute('data-preset-font')
            if (font) {
                handleAddFont(font)
            }
        })
    })

    const renderList = () => {
        if (!container) return
        const styles = CustomStylesService.getStyles(ctx?.projectData)
        CustomStylesService.injectStyleSheet(styles)
        const activeId = editor.getActiveCustomStyle ? editor.getActiveCustomStyle() : null

        container.innerHTML = ''
        styles.forEach(style => {
            const item = document.createElement('button')
            item.type = 'button'
            item.className =
                'w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-zinc-800 text-xs transition-colors cursor-pointer group'

            const left = document.createElement('div')
            left.className = 'flex items-center gap-2 overflow-hidden'

            const dot = document.createElement('span')
            dot.className = 'w-2.5 h-2.5 rounded-full shrink-0 shadow-xs'
            dot.style.backgroundColor = style.color || '#a1a1aa'

            const name = document.createElement('span')
            name.textContent = style.name
            name.className = 'truncate text-zinc-200 group-hover:text-white'
            if (style.italic) name.classList.add('italic')
            if (style.bold) name.classList.add('font-bold')

            left.appendChild(dot)
            left.appendChild(name)

            const right = document.createElement('div')
            right.className = 'flex items-center gap-1.5 shrink-0'

            if (activeId === style.id) {
                const check = document.createElement('span')
                check.className = 'text-blue-400 font-bold text-xs'
                check.textContent = '✓'
                right.appendChild(check)
            }

            const edit = document.createElement('span')
            edit.className =
                'text-zinc-500 hover:text-zinc-200 p-0.5 rounded cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity'
            edit.title = 'Edytuj styl'
            edit.innerHTML = '✏️'
            edit.addEventListener('click', e => {
                e.stopPropagation()
                if (dropdownMenu) dropdownMenu.classList.add('hidden')
                openModal(style)
            })
            right.appendChild(edit)

            item.appendChild(left)
            item.appendChild(right)

            item.addEventListener('click', e => {
                e.stopPropagation()
                if (dropdownMenu) dropdownMenu.classList.add('hidden')
                editor.focus()
                editor.toggleCustomStyle(style.id)
                if (typeof editor.getActiveFormatting === 'function') {
                    updateToolbarActiveStates(editor.getActiveFormatting(), ctx)
                }
            })

            container.appendChild(item)
        })
    }

    const openModal = styleToEdit => {
        if (!modal) return
        if (styleToEdit) {
            if (modalTitle) modalTitle.textContent = 'Edytuj styl tekstu'
            if (idInput) idInput.value = styleToEdit.id
            if (nameInput) nameInput.value = styleToEdit.name || ''
            if (colorPicker) colorPicker.value = styleToEdit.color || '#c084fc'
            if (bgEnabled) bgEnabled.checked = Boolean(styleToEdit.backgroundColor)
            if (bgControls) {
                if (styleToEdit.backgroundColor) {
                    bgControls.classList.remove('hidden')
                    if (bgColorPicker) bgColorPicker.value = styleToEdit.backgroundColor
                } else {
                    bgControls.classList.add('hidden')
                }
            }
            if (italicCb) italicCb.checked = Boolean(styleToEdit.italic)
            if (boldCb) boldCb.checked = Boolean(styleToEdit.bold)
            if (underlineCb) underlineCb.checked = Boolean(styleToEdit.underline)
            if (borderCb) borderCb.checked = Boolean(styleToEdit.border)
            populateFontSelect(styleToEdit.fontFamily || 'sans')
            if (deleteBtn) deleteBtn.classList.remove('hidden')
        } else {
            if (modalTitle) modalTitle.textContent = 'Nowy styl tekstu'
            if (idInput) idInput.value = ''
            if (nameInput) nameInput.value = ''
            if (colorPicker) colorPicker.value = '#c084fc'
            if (bgEnabled) bgEnabled.checked = false
            if (bgControls) bgControls.classList.add('hidden')
            if (italicCb) italicCb.checked = false
            if (boldCb) boldCb.checked = false
            if (underlineCb) underlineCb.checked = false
            if (borderCb) borderCb.checked = false
            populateFontSelect('sans')
            if (deleteBtn) deleteBtn.classList.add('hidden')
        }
        if (addFontInlineForm) addFontInlineForm.classList.add('hidden')
        modal.classList.remove('hidden')
        updatePreview()
        setTimeout(() => nameInput?.focus(), 50)
    }

    const closeModal = () => {
        if (modal) modal.classList.add('hidden')
    }

    // Modal listeners
    ;[
        colorPicker,
        bgColorPicker,
        italicCb,
        boldCb,
        underlineCb,
        borderCb,
        fontFamilySelect,
    ].forEach(el => {
        el?.addEventListener('input', updatePreview)
        el?.addEventListener('change', updatePreview)
    })

    bgEnabled?.addEventListener('change', () => {
        if (bgEnabled.checked) {
            bgControls?.classList.remove('hidden')
        } else {
            bgControls?.classList.add('hidden')
        }
        updatePreview()
    })

    quickColors.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-color')
            if (color && colorPicker) {
                colorPicker.value = color
                updatePreview()
            }
        })
    })

    closeBtn?.addEventListener('click', closeModal)
    cancelBtn?.addEventListener('click', closeModal)

    form?.addEventListener('submit', e => {
        e.preventDefault()
        const nameVal = nameInput?.value.trim()
        if (!nameVal) {
            toast.error('Wpisz nazwę stylu', 'Błąd')
            nameInput?.focus()
            return
        }

        const idVal =
            idInput?.value ||
            `style_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
        const styleObj = {
            id: idVal,
            name: nameVal,
            color: colorPicker?.value || '#c084fc',
            backgroundColor: bgEnabled?.checked ? bgColorPicker?.value : undefined,
            italic: Boolean(italicCb?.checked),
            bold: Boolean(boldCb?.checked),
            underline: Boolean(underlineCb?.checked),
            border: Boolean(borderCb?.checked),
            fontFamily: fontFamilySelect?.value || 'sans',
        }

        CustomStylesService.saveStyle(ctx?.projectData, styleObj)
        renderList()
        closeModal()
        toast.success(`Zapisano styl: ${styleObj.name}`, 'Style tekstu')
    })

    deleteBtn?.addEventListener('click', () => {
        const idVal = idInput?.value
        if (!idVal) return
        CustomStylesService.deleteStyle(ctx?.projectData, idVal)
        renderList()
        closeModal()
        toast.info('Usunięto styl', 'Style tekstu')
    })

    // Dropdown listeners
    dropdownBtn?.addEventListener('click', e => {
        e.stopPropagation()
        renderList()
        dropdownMenu?.classList.toggle('hidden')
    })

    document.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden')
    })

    clearBtn?.addEventListener('click', e => {
        e.stopPropagation()
        dropdownMenu?.classList.add('hidden')
        editor.focus()
        editor.unsetCustomStyle()
        if (typeof editor.getActiveFormatting === 'function') {
            updateToolbarActiveStates(editor.getActiveFormatting(), ctx)
        }
    })

    openModalBtn?.addEventListener('click', e => {
        e.stopPropagation()
        dropdownMenu?.classList.add('hidden')
        openModal(null)
    })
}

function setupToolbarButtons(editor, ctx) {
    if (toolbarInitialized || !editor) return
    toolbarInitialized = true

    const bindClick = (id, fn) => {
        const btn = document.getElementById(id)
        if (btn) {
            btn.addEventListener('click', e => {
                e.preventDefault()
                fn()
                if (typeof editor.getActiveFormatting === 'function') {
                    updateToolbarActiveStates(editor.getActiveFormatting(), ctx)
                }
            })
        }
    }

    bindClick('btn-editor-p', () => editor.setParagraph())
    bindClick('btn-editor-h1', () => editor.toggleHeading(1))
    bindClick('btn-editor-h2', () => editor.toggleHeading(2))
    bindClick('btn-editor-h3', () => editor.toggleHeading(3))
    bindClick('btn-editor-h4', () => editor.toggleHeading(4))
    bindClick('btn-editor-h5', () => editor.toggleHeading(5))
    bindClick('btn-editor-bold', () => editor.toggleBold())
    bindClick('btn-editor-italic', () => editor.toggleItalic())
    bindClick('btn-editor-underline', () => editor.toggleUnderline())
    bindClick('btn-editor-strike', () => editor.toggleStrike())
    bindClick('btn-editor-bullet-list', () => editor.toggleBulletList())
    bindClick('btn-editor-ordered-list', () => editor.toggleOrderedList())
    bindClick('btn-editor-quote', () => editor.toggleBlockquote())
    bindClick('btn-editor-dialog', () => editor.toggleDialog())

    setupCustomStylesUI(editor, ctx)

    const dropdownBtn = document.getElementById('btn-insert-entity-dropdown')
    const dropdownMenu = document.getElementById('editor-entity-dropdown-menu')

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', e => {
            e.stopPropagation()
            dropdownMenu.classList.toggle('hidden')
        })

        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden')
        })

        dropdownMenu.querySelectorAll('[data-entity-type]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation()
                dropdownMenu.classList.add('hidden')
                editor.focus()
                const rawEditor = editor.getRawEditor()
                if (rawEditor) {
                    rawEditor.chain().focus().insertContent('@').run()
                }
            })
        })
    }
}

export function getOrCreateMainEditor(ctx) {
    if (mainEditorInstance) return mainEditorInstance

    const mount = document.getElementById('rich-editor-mount')
    if (!mount) return null

    mainEditorInstance = new MarkdownEditor({
        element: mount,
        initialContent: '',
        getCustomStyles: () => CustomStylesService.getStyles(ctx?.projectData),
        getProjectEntities: () => {
            const entities = []
            const locations = ctx.projectData?.locations || ctx.projectLocations || []
            locations.forEach(loc => {
                const id = loc.getId ? loc.getId() : loc.id
                const name = loc.getName ? loc.getName() : loc.name
                if (id && name) entities.push({ id, name, type: 'location' })
            })
            const characters = ctx.projectData?.characters || ctx.projectCharacters || []
            characters.forEach(char => {
                const id = char.getId ? char.getId() : char.id
                const name = char.getName ? char.getName() : char.name
                if (id && name) entities.push({ id, name, type: 'character' })
            })
            const tags = ctx.projectData?.tags || ctx.projectTags || []
            tags.forEach(tag => {
                const id = tag.getId ? tag.getId() : tag.id
                const name = tag.getName ? tag.getName() : tag.name
                if (name) entities.push({ id: id || name, name, type: 'tag' })
            })
            return entities
        },
        onUpdate: (markdown, entities) => {
            const active = ctx.vm.getActiveFile()
            if (active) {
                ctx.files[active] = markdown
                const fileEditor = document.getElementById('file-editor')
                if (fileEditor) fileEditor.value = markdown

                const saveStatus = document.getElementById('save-status')
                if (saveStatus) {
                    saveStatus.textContent = `• ${t('editor.unsaved_changes')}`
                    saveStatus.className = 'text-[11px] text-amber-400 font-medium'
                }

                updateEditorStats(mainEditorInstance)
                syncEntitiesWithActiveObject(ctx, entities)
            }
        },
        onEntityClick: entity => {
            toast.info(`${entity.name} (${entity.type})`, 'Słowo kluczowe')
        },
        onSelectionUpdate: activeStates => {
            updateToolbarActiveStates(activeStates, ctx)
        },
    })

    setupToolbarButtons(mainEditorInstance, ctx)
    return mainEditorInstance
}

/**
 * Updates central workspace mode (Graph vs Markdown) and editor content.
 *
 * @param {object} ctx Application UI Context
 */
export function updateMainWorkspaceUI(ctx) {
    const mainView = ctx.vm.getActiveMainView()
    const modeTitle = document.getElementById('workspace-mode-title')
    const markdownContainer = document.getElementById('markdown-container')
    const graphContainer = document.getElementById('graph-container')
    const viewGraphBtn = document.getElementById('view-mode-graph-btn')
    const viewMarkdownBtn = document.getElementById('view-mode-markdown-btn')
    const fileEditor = document.getElementById('file-editor')
    const activeLabel = document.getElementById('active-file-label')

    if (mainView === 'graph') {
        if (markdownContainer) markdownContainer.classList.add('hidden')
        if (graphContainer) graphContainer.classList.remove('hidden')
        if (viewGraphBtn) {
            viewGraphBtn.classList.add('bg-[#2e2e33]', 'text-white')
            viewGraphBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        }
        if (viewMarkdownBtn) {
            viewMarkdownBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
            viewMarkdownBtn.classList.remove('bg-[#2e2e33]', 'text-white')
        }
        if (modeTitle) {
            modeTitle.innerHTML = `<span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span><span>${escapeHtml(t('graph.title'))}</span>`
        }
        if (ctx.showGraph) ctx.showGraph()
    } else {
        if (markdownContainer) markdownContainer.classList.remove('hidden')
        if (graphContainer) graphContainer.classList.add('hidden')
        if (viewMarkdownBtn) {
            viewMarkdownBtn.classList.add('bg-[#2e2e33]', 'text-white')
            viewMarkdownBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        }
        if (viewGraphBtn) {
            viewGraphBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
            viewGraphBtn.classList.remove('bg-[#2e2e33]', 'text-white')
        }
        if (modeTitle) {
            modeTitle.innerHTML = `<span class="text-blue-400 shrink-0">${getIconSvg('markdown', 'w-3.5 h-3.5')}</span><span>${escapeHtml(t('view_mode.text'))}</span>`
        }
    }

    const active = ctx.vm.getActiveFile()
    if (activeLabel) {
        activeLabel.textContent = active || t('editor.no_open_file')
    }
    const content = active ? ctx.files[active] || '' : ''
    if (fileEditor) {
        fileEditor.value = content
    }

    const editor = getOrCreateMainEditor(ctx)
    if (editor) {
        editor.setMarkdown(content)
        updateEditorStats(editor)
    }

    const saveStatus = document.getElementById('save-status')
    if (saveStatus) {
        saveStatus.textContent = ''
    }

    renderEditorTabs(ctx)
}

/**
 * Renders open file tabs in Markdown editor view.
 *
 * @param {object} ctx Application UI Context
 */
export function renderEditorTabs(ctx) {
    const editorTabsContainer = document.getElementById('editor-tabs')
    if (!editorTabsContainer) return

    const openFiles = ctx.vm.getOpenFiles()
    const activeFile = ctx.vm.getActiveFile()
    const closeFileTitle = t('editor.close_file')

    editorTabsContainer.innerHTML = openFiles
        .map(file => {
            const isActive = file === activeFile
            const activeClasses = isActive
                ? 'bg-[#18181b] text-white border-t-2 border-t-blue-500'
                : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'

            return `
            <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-t cursor-pointer border-r border-[#333338] ${activeClasses}"
                data-tab-file="${escapeHtml(file)}">
                <span class="flex items-center gap-1.5">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${escapeHtml(file)}</span>
                </span>
                <button class="close-tab-btn hover:text-red-400 p-0.5 rounded inline-flex items-center" data-close-file="${escapeHtml(file)}" title="${escapeHtml(closeFileTitle)}">${getIconSvg('close', 'w-3 h-3')}</button>
            </div>
        `
        })
        .join('')

    editorTabsContainer.querySelectorAll('[data-tab-file]').forEach(tab => {
        tab.addEventListener('click', e => {
            if (e.target.classList.contains('close-tab-btn')) return
            const file = tab.dataset.tabFile
            ctx.vm.setActiveFile(file)
            updateMainWorkspaceUI(ctx)
        })
    })

    editorTabsContainer.querySelectorAll('[data-close-file]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const file = btn.dataset.closeFile
            ctx.vm.closeFile(file)
            updateMainWorkspaceUI(ctx)
        })
    })
}

/**
 * Updates graph zoom percentage badge and toolbar button states.
 *
 * @param {object} storyGraphInstance
 * @param {number} [zoomLevel]
 */
export function updateZoomToolbarUI(storyGraphInstance, zoomLevel) {
    const badge = document.getElementById('graph-zoom-level-badge')
    const zoomOutBtn = document.getElementById('btn-graph-zoom-out')
    const zoomInBtn = document.getElementById('btn-graph-zoom-in')

    const currentZoom =
        zoomLevel !== undefined ? zoomLevel : storyGraphInstance ? storyGraphInstance.getZoom() : 1
    const percentage = Math.round(currentZoom * 100)

    if (badge) {
        badge.textContent = `${percentage}%`
    }
    if (zoomOutBtn) {
        const isMin = currentZoom <= 0.051
        zoomOutBtn.classList.toggle('opacity-40', isMin)
        zoomOutBtn.classList.toggle('pointer-events-none', isMin)
    }
    if (zoomInBtn) {
        const isMax = currentZoom >= 3.99
        zoomInBtn.classList.toggle('opacity-40', isMax)
        zoomInBtn.classList.toggle('pointer-events-none', isMax)
    }
}

/**
 * Saves current active file to memory and disk via IPC.
 *
 * @param {object} ctx Application UI Context
 */
export function saveActiveFile(ctx) {
    const active = ctx.vm.getActiveFile()
    if (!active) return

    const editor = getOrCreateMainEditor(ctx)
    const content =
        editor && typeof editor.getMarkdown === 'function'
            ? editor.getMarkdown()
            : document.getElementById('file-editor')?.value || ''

    ctx.files[active] = content

    const fileEditor = document.getElementById('file-editor')
    if (fileEditor) fileEditor.value = content

    const saveStatus = document.getElementById('save-status')
    if (saveStatus) {
        saveStatus.textContent = 'Zapisywanie...'
        saveStatus.className = 'text-[11px] text-zinc-400'
    }

    const currentPath = window.currentProjectPath || ''
    if (window.electronAPI && window.electronAPI.saveMarkdownFile && currentPath) {
        window.electronAPI
            .saveMarkdownFile(currentPath, active, content)
            .then(res => {
                if (res && res.success) {
                    if (saveStatus) {
                        saveStatus.textContent = '• Zapisano'
                        saveStatus.className = 'text-[11px] text-emerald-400 font-medium'
                        setTimeout(() => {
                            if (saveStatus.textContent === '• Zapisano') {
                                saveStatus.textContent = ''
                            }
                        }, 2500)
                    }
                    if (res.recreated || res.warning === 'recreated') {
                        toast.warning(t('toast.file_recreated_warning'), t('toast.warning_title'))
                    } else {
                        toast.success(t('toast.save_success'), t('toast.success_title'))
                    }
                } else if (res && !res.success) {
                    toast.error(t('toast.save_error', { error: res.error }), t('toast.error_title'))
                }
            })
            .catch(err => {
                console.error('Error saving file:', err)
                toast.error(t('toast.save_error', { error: err.message }), t('toast.error_title'))
            })
    } else {
        if (saveStatus) {
            saveStatus.textContent = '• Zapisano (pamięć)'
            saveStatus.className = 'text-[11px] text-emerald-400 font-medium'
            setTimeout(() => {
                if (saveStatus.textContent.includes('Zapisano')) {
                    saveStatus.textContent = ''
                }
            }, 2500)
        }
        toast.success(t('toast.save_success'), t('toast.success_title'))
    }
}
