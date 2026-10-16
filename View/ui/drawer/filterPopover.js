import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'

/**
 * Renders tag filter badges in the Paragraphs filter popover.
 *
 * @param {object} ctx Application UI Context
 */
export function renderFilterTags(ctx) {
    const filterTagsContainer = document.getElementById('filter-tags-list')
    if (!filterTagsContainer) return

    const selectedTag = ctx.vm.getSelectedFilterTag()

    if (ctx.projectTags.length === 0) {
        filterTagsContainer.innerHTML = `<span class="text-[10px] text-gray-500 italic" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</span>`
        return
    }

    filterTagsContainer.innerHTML = ctx.projectTags
        .map(tag => {
            const isSelected = selectedTag === tag.getId() || selectedTag === tag.getName()
            const borderClass = isSelected
                ? 'ring-2 ring-white font-bold scale-105 shadow-md'
                : 'opacity-85 hover:opacity-100 hover:scale-105'

            return `
            <button type="button" class="filter-tag-badge px-2 py-0.5 rounded text-[10px] text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 ${borderClass}" 
                style="background-color: ${escapeHtml(tag.getColor())}" 
                data-tag-id="${escapeHtml(tag.getId())}" 
                data-tag-name="${escapeHtml(tag.getName())}">
                ${isSelected ? getIconSvg('check', 'w-3 h-3 shrink-0') : ''}<span>${escapeHtml(tag.getName())}</span>
            </button>
        `
        })
        .join('')

    filterTagsContainer.querySelectorAll('.filter-tag-badge').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const tagId = btn.dataset.tagId
            const tagName = btn.dataset.tagName
            const currentSelected = ctx.vm.getSelectedFilterTag()
            if (currentSelected === tagId || currentSelected === tagName) {
                ctx.vm.setSelectedFilterTag(null)
            } else {
                ctx.vm.setSelectedFilterTag(tagName || tagId)
            }
            updateFilterBadgeState(ctx)
            renderFilterTags(ctx)
            ctx.renderParagraphsList()
        })
    })
}

/**
 * Populates character and scene filter selects in the Paragraphs filter popover.
 *
 * @param {object} ctx Application UI Context
 */
export function populateFilterSelects(ctx) {
    const charSelect = document.getElementById('filter-character-select')
    const sceneSelect = document.getElementById('filter-scene-select')

    if (charSelect) {
        const currentVal = ctx.vm.getSelectedFilterCharacter() || ''
        charSelect.innerHTML =
            `<option value="" data-i18n="left_panel.all_characters">${t('left_panel.all_characters')}</option>` +
            ctx.projectCharacters
                .map(
                    c =>
                        `<option value="${escapeHtml(c.getId())}" ${c.getId() === currentVal ? 'selected' : ''}>${escapeHtml(c.getName())}</option>`
                )
                .join('')
    }

    if (sceneSelect) {
        const currentVal = ctx.vm.getSelectedFilterScene() || ''
        sceneSelect.innerHTML =
            `<option value="" data-i18n="left_panel.all_scenes">${t('left_panel.all_scenes')}</option>` +
            ctx.projectScenes
                .map(
                    s =>
                        `<option value="${escapeHtml(s.getId())}" ${s.getId() === currentVal ? 'selected' : ''}>${escapeHtml(s.getName())}</option>`
                )
                .join('')
    }
}

/**
 * Updates the visibility badge for active paragraph filters.
 *
 * @param {object} ctx Application UI Context
 */
export function updateFilterBadgeState(ctx) {
    const badge = document.getElementById('active-filter-badge')
    if (!badge) return
    const hasActiveFilter = Boolean(
        ctx.vm.getSelectedFilterTag() ||
        ctx.vm.getSelectedFilterCharacter() ||
        ctx.vm.getSelectedFilterScene()
    )
    if (hasActiveFilter) {
        badge.classList.remove('hidden')
    } else {
        badge.classList.add('hidden')
    }
}

/**
 * Sets up paragraph search, filter popover toggles, and filter change listeners.
 *
 * @param {object} ctx Application UI Context
 */
export function setupParagraphSearchAndFilters(ctx) {
    const searchInput = document.getElementById('paragraph-search-input')
    const filterBtn = document.getElementById('paragraph-filter-btn')
    const filterPopover = document.getElementById('paragraph-filter-popover')
    const clearFiltersBtn = document.getElementById('btn-clear-paragraph-filters')
    const charSelect = document.getElementById('filter-character-select')
    const sceneSelect = document.getElementById('filter-scene-select')

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            ctx.vm.setParagraphSearchQuery(searchInput.value)
            ctx.renderParagraphsList()
        })
    }

    if (filterBtn && filterPopover) {
        filterBtn.addEventListener('click', e => {
            e.stopPropagation()
            const isHidden = filterPopover.classList.contains('hidden')
            filterPopover.classList.toggle('hidden')
            if (isHidden) {
                renderFilterTags(ctx)
                populateFilterSelects(ctx)
            }
        })

        document.addEventListener('click', e => {
            if (!filterPopover.contains(e.target) && !filterBtn.contains(e.target)) {
                filterPopover.classList.add('hidden')
            }
        })
    }

    if (charSelect) {
        charSelect.addEventListener('change', () => {
            ctx.vm.setSelectedFilterCharacter(charSelect.value || null)
            updateFilterBadgeState(ctx)
            ctx.renderParagraphsList()
        })
    }

    if (sceneSelect) {
        sceneSelect.addEventListener('change', () => {
            ctx.vm.setSelectedFilterScene(sceneSelect.value || null)
            updateFilterBadgeState(ctx)
            ctx.renderParagraphsList()
        })
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            ctx.vm.clearParagraphFilters()
            if (searchInput) searchInput.value = ''
            if (charSelect) charSelect.value = ''
            if (sceneSelect) sceneSelect.value = ''
            updateFilterBadgeState(ctx)
            renderFilterTags(ctx)
            ctx.renderParagraphsList()
            if (filterPopover) filterPopover.classList.add('hidden')
        })
    }

    renderFilterTags(ctx)
    populateFilterSelects(ctx)
    if (ctx.renderParagraphsList) ctx.renderParagraphsList()
    if (ctx.renderScenesList) ctx.renderScenesList()
}
