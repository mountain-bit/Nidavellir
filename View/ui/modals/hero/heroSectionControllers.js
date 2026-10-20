/**
 * Hero Modal Section Controllers
 * Coordinates avatar selection, identity attributes,
 * base stats, vitals formulas, skills, and tags for the Player Character folio.
 */

import { isCustomAvatarPath, toAssetUrl } from '../../../../dist/Utils/assetUtils.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { pickProjectImage } from '../../assets/assetPicker.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { evaluateFormula, parseStatValueAsNumber } from '../npc/formulaEvaluator.js'
import * as state from './heroState.js'

let tagPopoverOutsideBound = false

/**
 * Initializes avatar triggers for custom photo upload and removal.
 */
export function initHeroAvatarGrid() {
    const triggerBtn = document.getElementById('btn-hero-avatar-trigger')
    const removeBtn = document.getElementById('btn-hero-avatar-remove')

    if (triggerBtn) {
        triggerBtn.onclick = async e => {
            e.preventDefault()
            e.stopPropagation()
            try {
                const res = await pickProjectImage(null, 'hero')
                if (res && res.relativePath) {
                    updateHeroSelectedAvatarPreview(res.relativePath)
                    toast.success(
                        t('hero.avatar_updated') ||
                            t('npc.avatar_updated') ||
                            'Portret został zaktualizowany'
                    )
                }
            } catch (err) {
                console.error('Failed to import avatar:', err)
            }
        }
    }

    if (removeBtn) {
        removeBtn.onclick = e => {
            e.preventDefault()
            e.stopPropagation()
            updateHeroSelectedAvatarPreview('')
        }
    }
}

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

export function updateHeroSelectedAvatarPreview(avatarId = '') {
    const rawId = (avatarId || '').trim()
    state.setCurrentAvatarId(rawId)

    const previewContainer = document.getElementById('hero-selected-avatar-preview')
    const removeBtn = document.getElementById('btn-hero-avatar-remove')
    const labelSpan = document.getElementById('hero-avatar-action-label')

    if (!rawId) {
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center text-zinc-600 gap-1 select-none pointer-events-none">
                    <app-icon name="character" class="w-7 h-7 text-zinc-600"></app-icon>
                    <span class="text-[9px] text-zinc-500 font-medium">${escapeHtml(tr('hero.no_photo', 'Brak zdjęcia'))}</span>
                </div>
            `
        }
        if (removeBtn) removeBtn.classList.add('hidden')
        if (labelSpan) labelSpan.textContent = tr('hero.add_photo', 'Dodaj zdjęcie')
        return
    }

    if (removeBtn) removeBtn.classList.remove('hidden')
    if (labelSpan) labelSpan.textContent = tr('hero.change_photo', 'Zmień zdjęcie')

    if (previewContainer) {
        if (
            isCustomAvatarPath(rawId) ||
            rawId.startsWith('data:') ||
            rawId.startsWith('http') ||
            rawId.startsWith('blob:')
        ) {
            const assetUrl = toAssetUrl(rawId)
            previewContainer.innerHTML = `<img src="${assetUrl}" alt="Portret bohatera" class="w-full h-full object-cover rounded-lg" />`
        } else {
            previewContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center text-zinc-600 gap-1 select-none pointer-events-none">
                    <app-icon name="character" class="w-7 h-7 text-zinc-600"></app-icon>
                    <span class="text-[9px] text-zinc-500 font-medium">${escapeHtml(tr('hero.no_photo', 'Brak zdjęcia'))}</span>
                </div>
            `
            if (removeBtn) removeBtn.classList.add('hidden')
            if (labelSpan) labelSpan.textContent = tr('hero.add_photo', 'Dodaj zdjęcie')
        }
    }
}

// Deprecated no-op export for backward compatibility
export function closeHeroAvatarPopover() {}

// -------------------------------------------------------------
// Identity / Custom Attributes
// -------------------------------------------------------------

export function renderHeroCustomAttributes() {
    const list = document.getElementById('hero-custom-attributes-list')
    const empty = document.getElementById('hero-custom-attributes-empty')
    const attrs = state.getCustomAttributes()

    if (!list) return

    if (attrs.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')

    list.innerHTML = attrs
        .map((attr, index) => {
            return `
            <div class="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800" data-attr-index="${index}">
                <input
                    type="text"
                    value="${escapeHtml(attr.name || '')}"
                    placeholder="${escapeHtml(t('npc.attr_name_placeholder') || 'Atrybut')}"
                    class="hero-attr-name w-1/3 bg-zinc-950 border border-zinc-700/60 focus:border-amber-500 rounded px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500"
                />
                <input
                    type="text"
                    value="${escapeHtml(attr.value || '')}"
                    placeholder="${escapeHtml(t('npc.attr_value_placeholder') || 'Wartość')}"
                    class="hero-attr-value flex-1 bg-zinc-950 border border-zinc-700/60 focus:border-amber-500 rounded px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500"
                />
                <button
                    type="button"
                    class="btn-remove-hero-attr p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                    title="${escapeHtml(t('buttons.delete') || 'Usuń')}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `
        })
        .join('')

    list.querySelectorAll('.hero-attr-name').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getCustomAttributes()
            if (current[idx]) {
                current[idx].name = inp.value
                state.setCustomAttributes(current)
            }
        }
    })

    list.querySelectorAll('.hero-attr-value').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getCustomAttributes()
            if (current[idx]) {
                current[idx].value = inp.value
                state.setCustomAttributes(current)
            }
        }
    })

    list.querySelectorAll('.btn-remove-hero-attr').forEach((btn, idx) => {
        btn.onclick = () => {
            const current = state.getCustomAttributes()
            current.splice(idx, 1)
            state.setCustomAttributes(current)
            renderHeroCustomAttributes()
        }
    })
}

export function addHeroCustomAttribute(name = '', value = '') {
    const current = state.getCustomAttributes()
    current.push({ name, value })
    state.setCustomAttributes(current)
    renderHeroCustomAttributes()
}

// -------------------------------------------------------------
// Tags Section
// -------------------------------------------------------------

export function renderHeroTags() {
    const list = document.getElementById('hero-tags-list')
    const empty = document.getElementById('hero-tags-empty')
    const tags = state.getHeroTags()

    if (!list) return

    if (tags.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')

    list.innerHTML = tags
        .map((tag, idx) => {
            const name = tag.getName ? tag.getName() : tag.name || ''
            const color = tag.getColor ? tag.getColor() : tag.color || '#3b82f6'
            return `
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm" style="background-color: ${escapeHtml(color)}">
                <span>${escapeHtml(name)}</span>
                <button
                    type="button"
                    data-tag-index="${idx}"
                    class="hover:opacity-75 cursor-pointer leading-none text-white/90"
                    title="${escapeHtml(t('buttons.delete') || 'Usuń')}"
                >×</button>
            </span>
        `
        })
        .join('')

    list.querySelectorAll('button[data-tag-index]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.tagIndex, 10)
            const current = state.getHeroTags()
            current.splice(idx, 1)
            state.setHeroTags(current)
            renderHeroTags()
        }
    })
}

export function addHeroTag(tagObj) {
    const current = state.getHeroTags()
    const tagName = tagObj.getName ? tagObj.getName() : tagObj.name || ''
    const exists = current.some(t => (t.getName ? t.getName() : t.name || '') === tagName)
    if (!exists) {
        current.push(tagObj)
        state.setHeroTags(current)
        renderHeroTags()
    }
}

export function initHeroTagsController(ctx) {
    const btnAdd = document.getElementById('btn-add-hero-tag')
    const popover = document.getElementById('hero-tag-picker-popover')
    const searchInp = document.getElementById('hero-tag-search-input')
    const tagsList = document.getElementById('hero-available-tags-list')
    const createAction = document.getElementById('hero-create-tag-action')
    const btnCreateNew = document.getElementById('btn-create-new-hero-tag')
    const previewName = document.getElementById('hero-new-tag-preview-name')

    if (btnAdd && popover) {
        btnAdd.onclick = e => {
            e.stopPropagation()
            popover.classList.toggle('hidden')
            if (!popover.classList.contains('hidden')) {
                renderAvailableTagsList()
                if (searchInp) searchInp.focus()
            }
        }
    }

    if (!tagPopoverOutsideBound && typeof document !== 'undefined') {
        document.addEventListener('click', e => {
            const popEl = document.getElementById('hero-tag-picker-popover')
            const addEl = document.getElementById('btn-add-hero-tag')
            if (popEl && !popEl.classList.contains('hidden')) {
                if (!popEl.contains(e.target) && !addEl?.contains(e.target)) {
                    popEl.classList.add('hidden')
                }
            }
        })
        tagPopoverOutsideBound = true
    }

    function renderAvailableTagsList() {
        if (!tagsList) return
        const projectTags = ctx?.projectTags || ctx?.projectData?.projectTags || []
        const query = (searchInp?.value || '').trim().toLowerCase()

        const filtered = projectTags.filter(t => {
            const tName = (t.getName ? t.getName() : t.name || '').toLowerCase()
            return !query || tName.includes(query)
        })

        if (filtered.length === 0) {
            tagsList.innerHTML = `<span class="text-[11px] text-zinc-500 italic p-1">${escapeHtml(t('hero.no_existing_tags') || 'Brak istniejących tagów')}</span>`
        } else {
            tagsList.innerHTML = filtered
                .map(t => {
                    const name = t.getName ? t.getName() : t.name || ''
                    const color = t.getColor ? t.getColor() : t.color || '#3b82f6'
                    return `
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                        style="background-color: ${escapeHtml(color)}"
                    >${escapeHtml(name)}</button>
                `
                })
                .join('')

            tagsList.querySelectorAll('button').forEach((btn, idx) => {
                btn.onclick = () => {
                    addHeroTag(filtered[idx])
                    if (popover) popover.classList.add('hidden')
                }
            })
        }

        if (createAction && previewName) {
            if (
                query &&
                !projectTags.some(
                    t => (t.getName ? t.getName() : t.name || '').toLowerCase() === query
                )
            ) {
                createAction.classList.remove('hidden')
                previewName.textContent = searchInp.value.trim()
            } else {
                createAction.classList.add('hidden')
            }
        }
    }

    if (searchInp) {
        searchInp.oninput = () => renderAvailableTagsList()
    }

    if (btnCreateNew && searchInp) {
        btnCreateNew.onclick = () => {
            const rawName = searchInp.value.trim()
            if (!rawName) return
            const newTag = ctx?.vm?.createTag
                ? ctx.vm.createTag(rawName)
                : {
                      id: `tag_${Date.now()}`,
                      name: rawName,
                      color: '#3b82f6',
                      getName() {
                          return this.name
                      },
                      getColor() {
                          return this.color
                      },
                  }
            if (Array.isArray(ctx?.projectTags)) {
                ctx.projectTags.push(newTag)
            } else if (Array.isArray(ctx?.projectData?.projectTags)) {
                ctx.projectData.projectTags.push(newTag)
            }
            addHeroTag(newTag)
            searchInp.value = ''
            if (popover) popover.classList.add('hidden')
        }
    }
}

// -------------------------------------------------------------
// Base Stats Section
// -------------------------------------------------------------

export function renderHeroStats() {
    const list = document.getElementById('hero-stats-list')
    const empty = document.getElementById('hero-stats-empty')
    const stats = state.getHeroStats()

    if (!list) return

    if (stats.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')

    list.innerHTML = stats
        .map((s, idx) => {
            return `
            <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 shadow-sm" data-stat-index="${idx}">
                <div class="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    <input
                        type="text"
                        value="${escapeHtml(s.name || '')}"
                        placeholder="${escapeHtml(t('details.name_placeholder') || 'Nazwa cechy')}"
                        class="hero-stat-name bg-transparent border-0 font-medium text-xs text-zinc-200 focus:outline-none focus:text-white w-full truncate"
                    />
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <input
                        type="number"
                        value="${s.value ?? 10}"
                        class="hero-stat-val w-16 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded px-2 py-1 text-xs text-right font-mono font-bold text-amber-300 focus:outline-none"
                    />
                    <button
                        type="button"
                        class="btn-remove-hero-stat p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                        title="${escapeHtml(t('buttons.delete') || 'Usuń')}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `
        })
        .join('')

    list.querySelectorAll('.hero-stat-name').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroStats()
            if (current[idx]) {
                current[idx].name = inp.value
                state.setHeroStats(current)
                updateHeroVitalFormulasPreview()
                updateHeroSkillStatDropdowns()
            }
        }
    })

    list.querySelectorAll('.hero-stat-val').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroStats()
            if (current[idx]) {
                current[idx].value = parseStatValueAsNumber(inp.value, 10)
                state.setHeroStats(current)
                updateHeroVitalFormulasPreview()
            }
        }
    })

    list.querySelectorAll('.btn-remove-hero-stat').forEach((btn, idx) => {
        btn.onclick = () => {
            const current = state.getHeroStats()
            current.splice(idx, 1)
            state.setHeroStats(current)
            renderHeroStats()
            updateHeroVitalFormulasPreview()
            updateHeroSkillStatDropdowns()
        }
    })
}

export function addHeroStat(name = '', value = 10) {
    const current = state.getHeroStats()
    current.push({ id: `stat_${Date.now()}`, name, value })
    state.setHeroStats(current)
    renderHeroStats()
    updateHeroVitalFormulasPreview()
    updateHeroSkillStatDropdowns()
}

// -------------------------------------------------------------
// Vitals Section (Parametry Życiowe)
// -------------------------------------------------------------

export function renderHeroVitals() {
    const list = document.getElementById('hero-vitals-list')
    const empty = document.getElementById('hero-vitals-empty')
    const vitals = state.getHeroVitals(evaluateFormula)

    if (!list) return

    if (vitals.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')

    list.innerHTML = vitals
        .map((v, idx) => {
            const isFormula = v.mode === 'formula'
            const calculatedVal = v.calculatedValue ?? v.value ?? 0
            return `
            <div class="flex flex-col gap-1.5 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800" data-vital-index="${idx}">
                <div class="flex items-center justify-between">
                    <input
                        type="text"
                        value="${escapeHtml(v.name || '')}"
                        placeholder="${escapeHtml(t('details.name_placeholder') || 'Parametr (np. Punkty Życia)')}"
                        class="hero-vital-name bg-transparent font-medium text-xs text-zinc-100 focus:outline-none w-1/2"
                    />
                    <div class="flex items-center gap-1.5">
                        <select class="hero-vital-mode bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none">
                            <option value="direct" ${!isFormula ? 'selected' : ''}>${escapeHtml(t('npc.mode_direct') || 'Wartość stała')}</option>
                            <option value="formula" ${isFormula ? 'selected' : ''}>${escapeHtml(t('npc.mode_formula') || 'Wzór kalkulacyjny')}</option>
                        </select>
                        <button
                            type="button"
                            class="btn-remove-hero-vital p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                            title="${escapeHtml(t('buttons.delete') || 'Usuń')}"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                    ${
                        isFormula
                            ? `
                        <input
                            type="text"
                            value="${escapeHtml(v.formula || '')}"
                            placeholder="Wzór np. Kondycja * 2 + 10"
                            class="hero-vital-formula flex-1 bg-zinc-950 border border-zinc-700/80 focus:border-amber-500 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
                        />
                        <div class="flex items-center gap-1 text-[11px] text-amber-300 font-mono bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded">
                            <span class="text-zinc-500 text-[10px]">=</span>
                            <span class="font-bold font-mono">${calculatedVal}</span>
                        </div>
                    `
                            : `
                        <input
                            type="number"
                            value="${v.value ?? 20}"
                            placeholder="Wartość"
                            class="hero-vital-value w-24 bg-zinc-950 border border-zinc-700/80 focus:border-amber-500 rounded px-2 py-1 text-xs text-zinc-200 font-mono"
                        />
                    `
                    }
                </div>
            </div>
        `
        })
        .join('')

    list.querySelectorAll('.hero-vital-name').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroVitals()
            if (current[idx]) {
                current[idx].name = inp.value
                state.setHeroVitals(current)
            }
        }
    })

    list.querySelectorAll('.hero-vital-mode').forEach((sel, idx) => {
        sel.onchange = () => {
            const current = state.getHeroVitals()
            if (current[idx]) {
                current[idx].mode = sel.value
                state.setHeroVitals(current)
                renderHeroVitals()
            }
        }
    })

    list.querySelectorAll('.hero-vital-formula').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroVitals()
            if (current[idx]) {
                current[idx].formula = inp.value
                state.setHeroVitals(current)
                updateHeroVitalFormulasPreview()
            }
        }
    })

    list.querySelectorAll('.hero-vital-value').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroVitals()
            if (current[idx]) {
                current[idx].value = parseStatValueAsNumber(inp.value, 0)
                state.setHeroVitals(current)
            }
        }
    })

    list.querySelectorAll('.btn-remove-hero-vital').forEach((btn, idx) => {
        btn.onclick = () => {
            const current = state.getHeroVitals()
            current.splice(idx, 1)
            state.setHeroVitals(current)
            renderHeroVitals()
        }
    })
}

export function updateHeroVitalFormulasPreview() {
    const list = document.getElementById('hero-vitals-list')
    if (!list) return
    const vitals = state.getHeroVitals(evaluateFormula)
    list.querySelectorAll('[data-vital-index]').forEach(row => {
        const idx = parseInt(row.dataset.vitalIndex, 10)
        const v = vitals[idx]
        if (v && v.mode === 'formula') {
            const valSpan = row.querySelector('.hero-vital-formula + div span.font-bold')
            if (valSpan) {
                valSpan.textContent = v.calculatedValue ?? 0
            }
        }
    })
}

export function addHeroVital(name = '', mode = 'direct', value = 10, formula = '') {
    const current = state.getHeroVitals()
    current.push({
        id: `vital_${Date.now()}`,
        name,
        mode,
        value,
        formula,
    })
    state.setHeroVitals(current)
    renderHeroVitals()
}

// -------------------------------------------------------------
// Skills Section
// -------------------------------------------------------------

export function renderHeroSkills() {
    const list = document.getElementById('hero-skills-list')
    const empty = document.getElementById('hero-skills-empty')
    const skills = state.getHeroSkills()
    const stats = state.getHeroStats()

    if (!list) return

    if (skills.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')

    list.innerHTML = skills
        .map((sk, idx) => {
            return `
            <div class="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/90 border border-zinc-800" data-skill-index="${idx}">
                <input
                    type="text"
                    value="${escapeHtml(sk.name || '')}"
                    placeholder="${escapeHtml(t('details.name_placeholder') || 'Nazwa umiejętności')}"
                    class="hero-skill-name flex-1 bg-transparent font-medium text-xs text-zinc-200 focus:outline-none"
                />
                <select class="hero-skill-stat bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none">
                    <option value="">${escapeHtml(t('hero.no_stat_selected') || '(brak cechy)')}</option>
                    ${stats
                        .map(s => {
                            const isSel = s.name === sk.statName ? 'selected' : ''
                            return `<option value="${escapeHtml(s.name)}" ${isSel}>${escapeHtml(s.name)}</option>`
                        })
                        .join('')}
                </select>
                <input
                    type="text"
                    value="${escapeHtml(sk.value || '+1')}"
                    placeholder="+1"
                    class="hero-skill-val w-14 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded px-1.5 py-0.5 text-xs text-center font-mono text-amber-300 focus:outline-none"
                />
                <button
                    type="button"
                    class="btn-remove-hero-skill p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                    title="${escapeHtml(t('buttons.delete') || 'Usuń')}"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `
        })
        .join('')

    list.querySelectorAll('.hero-skill-name').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroSkills()
            if (current[idx]) {
                current[idx].name = inp.value
                state.setHeroSkills(current)
            }
        }
    })

    list.querySelectorAll('.hero-skill-stat').forEach((sel, idx) => {
        sel.onchange = () => {
            const current = state.getHeroSkills()
            if (current[idx]) {
                current[idx].statName = sel.value
                state.setHeroSkills(current)
            }
        }
    })

    list.querySelectorAll('.hero-skill-val').forEach((inp, idx) => {
        inp.oninput = () => {
            const current = state.getHeroSkills()
            if (current[idx]) {
                current[idx].value = inp.value
                state.setHeroSkills(current)
            }
        }
    })

    list.querySelectorAll('.btn-remove-hero-skill').forEach((btn, idx) => {
        btn.onclick = () => {
            const current = state.getHeroSkills()
            current.splice(idx, 1)
            state.setHeroSkills(current)
            renderHeroSkills()
        }
    })
}

export function updateHeroSkillStatDropdowns() {
    const list = document.getElementById('hero-skills-list')
    if (!list) return
    const stats = state.getHeroStats()
    const skills = state.getHeroSkills()

    list.querySelectorAll('.hero-skill-stat').forEach((sel, idx) => {
        const curStat = skills[idx]?.statName || ''
        sel.innerHTML = `
            <option value="">${escapeHtml(t('hero.no_stat_selected') || '(brak cechy)')}</option>
            ${stats
                .map(s => {
                    const isSel = s.name === curStat ? 'selected' : ''
                    return `<option value="${escapeHtml(s.name)}" ${isSel}>${escapeHtml(s.name)}</option>`
                })
                .join('')}
        `
    })
}

export function addHeroSkill(name = '', statName = '', value = '') {
    const current = state.getHeroSkills()
    current.push({
        id: `skill_${Date.now()}`,
        name,
        statName,
        value,
    })
    state.setHeroSkills(current)
    renderHeroSkills()
}
