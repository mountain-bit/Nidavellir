import { isCustomAvatarPath, toAssetUrl } from '../../../dist/Utils/assetUtils.js'
import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { DEFAULT_TAG_COLOR } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeBadgeColor } from '../common/htmlTemplates.js'
import { getAvatarById } from '../common/npcAvatars.js'
import { openHeroModal } from '../modals/hero/heroModal.js'
import { evaluateFormula } from '../modals/npc/formulaEvaluator.js'
import { buildStatsMap, createSection } from './common/domHelpers.js'
import { renderFilesModule } from './modules/entityConfigModules.js'

/**
 * Renders the read-only details view for the Player Character (Bohater gracza).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {string} type
 * @param {object} ctx
 */
export function renderHeroReadOnlyDetails(container, entity, item, type, ctx) {
    const tr = (key, fallback) => {
        const val = t(key)
        return val && val !== key ? val : fallback
    }

    const openModalFn = options => {
        if (typeof ctx.openHeroModal === 'function') {
            ctx.openHeroModal(options)
        } else {
            openHeroModal(options)
        }
    }

    // 1. Header Module
    const typeKey = 'details.type_player_character'
    const typeLabel = tr(typeKey, 'BOHATER GRACZA')

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${tr('details.type', 'Typ')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id || 'hero_player')}</div>
    `
    )
    container.appendChild(headerMod)

    // 2. Action Module (Top Edit Button)
    const editBtnText = tr('hero.edit_hero', tr('hero.edit_hero_btn', 'Edytuj bohatera'))
    const editActionMod = createSection(
        'border-b border-[#333338] p-3',
        `
        <button id="btn-details-edit-hero" type="button" class="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
            <span class="shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-4 h-4')}</span>
            <span>${escapeHtml(editBtnText)}</span>
        </button>
    `
    )
    editActionMod.querySelector('#btn-details-edit-hero').addEventListener('click', () => {
        openModalFn({ ctx, editEntity: entity })
    })
    container.appendChild(editActionMod)

    // 3. Avatar Module (Read-only)
    const avatarVal =
        (typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar) || ''
    const isCustomAvatar =
        Boolean(avatarVal) &&
        (isCustomAvatarPath(avatarVal) ||
            avatarVal.startsWith('data:') ||
            avatarVal.startsWith('http') ||
            avatarVal.startsWith('blob:'))
    const avatarPreset = !isCustomAvatar && avatarVal ? getAvatarById(avatarVal) : null

    const avatarHtml = isCustomAvatar
        ? `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md border border-amber-500/40">
               <img src="${escapeHtml(toAssetUrl(avatarVal))}" alt="Hero Avatar" class="w-full h-full object-cover" />
           </div>`
        : avatarPreset?.svg
          ? `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border" style="background-color: ${avatarPreset.bgColor || '#27272a'}; color: ${avatarPreset.color || '#fbbf24'}; border-color: ${avatarPreset.borderColor || '#b45309'}">
                 ${avatarPreset.svg}
             </div>`
          : `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border border-zinc-800 bg-zinc-900 text-zinc-500">
                 ${getIconSvg('character', 'w-5 h-5')}
             </div>`

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.avatar', 'Awatar postaci')}</span>
            <span class="text-[10px] text-amber-400 capitalize">${isCustomAvatar ? tr('hero.avatar_custom', 'Własny') : escapeHtml(avatarPreset?.category || '')}</span>
        </div>
        <div class="flex items-center gap-3">
            ${avatarHtml}
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(isCustomAvatar ? tr('hero.custom_portrait', tr('avatars.custom', 'Własny portret')) : avatarPreset?.name || avatarVal)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${escapeHtml(isCustomAvatar ? 'custom' : avatarPreset?.id || '')}</div>
            </div>
        </div>
    `
    )
    container.appendChild(avatarMod)

    // 4. Name & Class Module
    const entityName = (typeof entity.getName === 'function' ? entity.getName() : item.name) || ''

    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div>
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1">${tr('details.name', 'Nazwa')}</label>
            <div id="details-name-display" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
                ${escapeHtml(entityName)}
            </div>
        </div>
    `
    )
    container.appendChild(nameMod)

    // 5. Summary & Narrative Module
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : entity.description
    const currentSummary =
        (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : desc?.summary) ||
        entity.summary ||
        ''
    const currentNarrative =
        (desc && typeof desc.getText === 'function' ? desc.getText() : desc?.text) || ''

    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="space-y-1">
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.summary', 'Streszczenie')}</label>
            ${
                currentSummary
                    ? `<div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentSummary)}</div>`
                    : `<div class="text-xs text-gray-500 italic py-1">${tr('details.no_summary', 'Brak streszczenia')}</div>`
            }
        </div>
        ${
            currentNarrative && currentNarrative !== currentSummary
                ? `
            <div class="space-y-1 pt-1">
                <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('hero.narrative_chronicle', tr('hero.chronicle', 'Kronika Narracyjna'))}</label>
                <div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap select-text max-h-48 overflow-y-auto">${escapeHtml(currentNarrative)}</div>
            </div>
            `
                : ''
        }
    `
    )
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module
    const currentTags =
        typeof entity.getTags === 'function' ? entity.getTags() || [] : entity.tags || []
    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.tags', 'Tagi')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${currentTags.length}</span>
        </div>
        <div id="details-hero-tags-list" class="flex flex-wrap gap-1 min-h-[20px]">
            ${
                currentTags.length === 0
                    ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_tags', tr('graph.node.no_tags', 'Brak tagów'))}</span>`
                    : ''
            }
        </div>
    `
    )
    const tagsListEl = tagsMod.querySelector('#details-hero-tags-list')
    currentTags.forEach(tObj => {
        const tagName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || tObj
        const tagColor =
            (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) ||
            DEFAULT_TAG_COLOR
        const chip = document.createElement('span')
        chip.className =
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm'
        chip.style.backgroundColor = tagColor
        chip.textContent = `#${tagName}`
        tagsListEl.appendChild(chip)
    })
    container.appendChild(tagsMod)

    // 7. Base Stats / Traits Module
    const statsList =
        typeof entity.getStats === 'function' ? entity.getStats() || [] : entity.stats || []
    const statsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${tr('hero.base_stats', tr('hero.stats_title', 'Cechy Główne'))}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsList.length}</span>
        </div>
        <div id="details-hero-stats-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_traits', 'Brak zdefiniowanych cech')}</span>` : ''}
        </div>
    `
    )
    const statsListEl = statsMod.querySelector('#details-hero-stats-list')
    statsList.forEach(st => {
        const stName = typeof st.getName === 'function' ? st.getName() : st.name || ''
        const stVal = typeof st.getValue === 'function' ? st.getValue() : (st.value ?? '')
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(stName)}</span>
            </span>
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-amber-300 shrink-0">
                ${escapeHtml(String(stVal))}
            </span>
        `
        statsListEl.appendChild(row)
    })
    container.appendChild(statsMod)

    // 8. Vital Parameters Module
    const paramsList =
        typeof entity.getParameters === 'function'
            ? entity.getParameters() || []
            : entity.parameters || []
    const charStatsMap = buildStatsMap(statsList)

    const paramsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span>${tr('hero.vitals', tr('hero.vitals_title', 'Parametry Życiowe'))}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${paramsList.length}</span>
        </div>
        <div id="details-hero-params-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${paramsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_parameters', 'Brak przypisanych parametrów')}</span>` : ''}
        </div>
    `
    )
    const paramsListEl = paramsMod.querySelector('#details-hero-params-list')
    paramsList.forEach(p => {
        const pName = typeof p.getName === 'function' ? p.getName() : p.name || ''
        const pMode = typeof p.getMode === 'function' ? p.getMode() : p.mode || 'direct'
        let valueDisplay = ''

        if (pMode === 'formula') {
            const formula = typeof p.getFormula === 'function' ? p.getFormula() : p.formula || ''
            const evalRes = evaluateFormula(formula, charStatsMap)
            const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
            valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate max-w-[150px]" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
        } else {
            const pVal = typeof p.getValue === 'function' ? p.getValue() : (p.value ?? '')
            valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-rose-300 shrink-0">${escapeHtml(String(pVal))}</span>`
        }

        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(pName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        `
        paramsListEl.appendChild(row)
    })
    container.appendChild(paramsMod)

    // 9. Skills Module
    const skillsList =
        typeof entity.getSkills === 'function' ? entity.getSkills() || [] : entity.skills || []
    const skillsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span>${tr('hero.skills', tr('hero.skills_title', 'Umiejętności'))}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${skillsList.length}</span>
        </div>
        <div id="details-hero-skills-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${skillsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_skills', 'Brak przypisanych umiejętności')}</span>` : ''}
        </div>
    `
    )
    const skillsListEl = skillsMod.querySelector('#details-hero-skills-list')
    skillsList.forEach(sk => {
        const skName = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
        const skMode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'
        let valueDisplay = ''

        if (skMode === 'stat_mod') {
            const statName =
                typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
            const mod =
                typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || '+0'
            valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate max-w-[140px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
        } else {
            const skVal = typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? '')
            valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-blue-300 shrink-0">${escapeHtml(String(skVal))}</span>`
        }

        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(skName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        `
        skillsListEl.appendChild(row)
    })
    container.appendChild(skillsMod)

    // 10. Inventories Module
    const inventories =
        typeof entity.getInventories === 'function'
            ? entity.getInventories() || []
            : entity.inventories || []
    const invCount = inventories.length
    const invMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('hero.inventories_title', 'Ekwipunki i Przedmioty')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${invCount}</span>
        </div>
        <div id="details-hero-inventories-list" class="flex flex-col gap-2 min-h-[20px]">
            ${invCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('hero.empty_inventories', 'Brak ekwipunków')}</span>` : ''}
        </div>
    `
    )
    const invListEl = invMod.querySelector('#details-hero-inventories-list')
    inventories.forEach(inv => {
        const invName = typeof inv.getName === 'function' ? inv.getName() : inv.name || 'Ekwipunek'
        const capacity =
            typeof inv.getCapacity === 'function' ? inv.getCapacity() : inv.capacity || 0
        const items = typeof inv.getItems === 'function' ? inv.getItems() : inv.items || []
        const capText = capacity > 0 ? `${items.length} / ${capacity}` : `${items.length} (∞)`

        const card = document.createElement('div')
        card.className =
            'bg-[#18181b] p-2 rounded border border-[#27272a] text-xs flex flex-col gap-1.5'
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-white font-semibold flex items-center gap-1.5 truncate">
                    <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3 h-3')}</span>
                    <span class="truncate">${escapeHtml(invName)}</span>
                </span>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 shrink-0">${escapeHtml(capText)}</span>
            </div>
            ${
                items.length > 0
                    ? `
                <div class="flex flex-wrap gap-1 pt-1 border-t border-zinc-800/80">
                    ${items
                        .map((it, idx) => {
                            const itName =
                                typeof it.getName === 'function'
                                    ? it.getName()
                                    : it.name || String(it)
                            const itSlots =
                                typeof it.getSlotSize === 'function'
                                    ? it.getSlotSize()
                                    : typeof it.slotSize === 'number'
                                      ? it.slotSize
                                      : 1
                            return `<button type="button" data-inv-item-idx="${idx}" class="btn-hero-inspect-item px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-200 font-medium cursor-pointer transition-colors flex items-center gap-1">
                                <span>${escapeHtml(itName)}</span>
                                ${itSlots > 1 ? `<span class="text-[9px] text-zinc-500 font-mono">(${itSlots})</span>` : ''}
                            </button>`
                        })
                        .join('')}
                </div>
            `
                    : `<div class="text-[10px] text-zinc-500 italic pt-0.5">${escapeHtml(tr('hero.empty_inv_items', 'Pusty ekwipunek'))}</div>`
            }
        `

        card.querySelectorAll('.btn-hero-inspect-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.invItemIdx, 10)
                const it = items[idx]
                if (!it) return
                const itId = typeof it.getId === 'function' ? it.getId() : it.id || it.name
                const projectItem =
                    (ctx.projectItems || []).find(
                        p =>
                            (typeof p.getId === 'function' ? p.getId() : p.id) === itId ||
                            (typeof p.getName === 'function' ? p.getName() : p.name) === itId
                    ) || it
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(projectItem, 'item')
                } else if (ctx.vm && typeof ctx.vm.selectElement === 'function') {
                    ctx.vm.selectElement(projectItem, 'item')
                }
            })
        })

        invListEl.appendChild(card)
    })
    container.appendChild(invMod)

    // 11. Custom Attributes Module
    const customAttrs =
        typeof entity.getCustomAttributes === 'function'
            ? entity.getCustomAttributes() || []
            : entity.customAttributes || []
    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('hero.identity_attributes', tr('hero.custom_attributes_title', 'Cechy Tożsamości'))}</span>
            <span class="text-[10px] text-gray-500 font-mono">${customAttrs.length}</span>
        </div>
        <div id="details-hero-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${customAttrs.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_custom_attributes', 'Brak atrybutów niestandardowych')}</span>` : ''}
        </div>
    `
    )
    const attrsListEl = customMod.querySelector('#details-hero-custom-attrs-list')
    customAttrs.forEach(attr => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="font-medium text-[#d4d4d8] truncate">${escapeHtml(attr.name)}</span>
            <span class="text-gray-500 font-mono">:</span>
            <span class="font-mono text-white text-right truncate">${escapeHtml(String(attr.value))}</span>
        `
        attrsListEl.appendChild(row)
    })
    container.appendChild(customMod)

    // 12. Quick Actions Module (Bottom)
    const actionsMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('right_panel.quick_actions', 'Szybkie akcje')}</div>
        <button id="btn-details-bottom-edit-hero" class="w-full py-2 px-3 rounded bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-xs text-left text-amber-200 flex items-center justify-between cursor-pointer transition-colors" type="button">
            <span>${escapeHtml(editBtnText)}</span>
            <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-3.5 h-3.5')}</span>
        </button>
    `
    )

    actionsMod.querySelector('#btn-details-bottom-edit-hero').addEventListener('click', () => {
        openModalFn({ ctx, editEntity: entity })
    })

    container.appendChild(actionsMod)
}
