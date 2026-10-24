/**
 * Dedicated Details & Inspector Panel for an Item entity.
 * Provides deep editing of item properties: name, category, slot sizes, weight,
 * starting inventory correlation with PlayerCharacter, tags, RPG modifiers,
 * narrative description, and paragraph usage references.
 */

import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { Description, ItemExportService } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { createSection } from './common/domHelpers.js'

/**
 * Helper to safely resolve translation or fallback.
 *
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Triggers refresh of details panel and other active workspace views.
 *
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
function refreshDetails(ctx, onRefreshDetails) {
    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
    if (typeof ctx.refreshActiveSection === 'function') {
        ctx.refreshActiveSection('item')
    }
}

/**
 * Synchronizes item in/out of the player's starting inventory.
 *
 * @param {object} itemEntity
 * @param {boolean} inStarting
 * @param {string} targetInvId
 * @param {object} ctx
 */
function syncPlayerCharacterStartingInventory(itemEntity, inStarting, targetInvId, ctx) {
    const hero = ctx.projectPlayerCharacter || ctx.playerCharacter
    if (!hero || typeof hero.hasItem !== 'function') return

    const itemId = typeof itemEntity.getId === 'function' ? itemEntity.getId() : itemEntity.id
    if (!itemId) return

    if (inStarting) {
        // If not already in player's inventory, add it
        if (!hero.hasItem(itemId)) {
            if (typeof hero.addItem === 'function') {
                hero.addItem(itemEntity, targetInvId)
            }
        }
    } else {
        // Remove from hero's starting items
        if (hero.hasItem(itemId) && typeof hero.removeItem === 'function') {
            hero.removeItem(itemId)
        }
    }

    if (typeof ctx.markDirty === 'function') ctx.markDirty()
}

/**
 * Renders the dedicated Item details inspector.
 *
 * @param {HTMLElement} container
 * @param {object} entity The Item model instance
 * @param {object} item The history item wrapper { id, name, type, entity }
 * @param {object} ctx Application UI Context
 * @param {Function} [onRefreshDetails]
 */
export function renderItemDetails(container, entity, item, ctx, onRefreshDetails) {
    if (!container || !entity) return

    const itemId = typeof entity.getId === 'function' ? entity.getId() : entity.id || item.id || ''
    const itemName =
        (typeof entity.getName === 'function' ? entity.getName() : entity.name || item.name) ||
        'Nowy przedmiot'

    // Get current inventory config
    const config =
        typeof entity.getInventoryConfig === 'function'
            ? entity.getInventoryConfig()
            : entity.inventoryConfig || {
                  category: 'misc',
                  slotSize: 1,
                  weight: 1,
                  isConsumable: false,
                  inStartingInventory: false,
                  targetInventoryId: '',
              }

    const currentTags = typeof entity.getTags === 'function' ? entity.getTags() : entity.tags || []
    const currentModifiers =
        typeof entity.getModifiers === 'function' ? entity.getModifiers() : entity.modifiers || []

    const descObj =
        typeof entity.getDescription === 'function'
            ? entity.getDescription()
            : entity.description || new Description()
    const summary =
        typeof descObj.getSummary === 'function'
            ? descObj.getSummary()
            : descObj.summary || descObj.text || ''

    // -------------------------------------------------------------
    // 1. Header & ID Module
    // -------------------------------------------------------------
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_inspector_title', 'Przedmiot')}</span>
            </span>
            <div class="flex items-center gap-1">
                <button id="btn-details-close-item" type="button" class="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer" title="${tr('buttons.close', 'Zamknij')}">
                    ${getIconSvg('close', 'w-3.5 h-3.5')}
                </button>
            </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-[#141416] px-2 py-1 rounded border border-zinc-800/80">
            <span class="truncate">ID: <span class="text-zinc-200 select-all">${escapeHtml(itemId)}</span></span>
            <button id="btn-copy-item-id" type="button" class="text-zinc-400 hover:text-amber-300 ml-1 cursor-pointer transition-colors" title="Kopiuj ID">
                ${getIconSvg('copy', 'w-3 h-3')}
            </button>
        </div>
    `
    )

    headerMod.querySelector('#btn-details-close-item').addEventListener('click', () => {
        if (ctx.vm && typeof ctx.vm.closeHistoryItem === 'function') {
            ctx.vm.closeHistoryItem(item.id)
            refreshDetails(ctx, onRefreshDetails)
        }
    })

    headerMod.querySelector('#btn-copy-item-id').addEventListener('click', () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(itemId)
        }
    })

    container.appendChild(headerMod)

    // -------------------------------------------------------------
    // 2. Name Module with Collision Validation
    // -------------------------------------------------------------
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label for="details-item-name-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.name', 'Nazwa')}</label>
        <input
            id="details-item-name-input"
            type="text"
            value="${escapeHtml(itemName)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            placeholder="${tr('details.item_name_placeholder', 'Wpisz nazwę przedmiotu...')}"
        />
        <div id="details-item-name-error" class="hidden text-[11px] text-red-400 pt-0.5"></div>
    `
    )

    const nameInput = nameMod.querySelector('#details-item-name-input')
    const nameError = nameMod.querySelector('#details-item-name-error')

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = 'Nazwa przedmiotu nie może być pusta'
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        // Collision check across other project items
        const allItems = ctx.projectItems || []
        const collision = allItems.some(
            it =>
                (typeof it.getId === 'function' ? it.getId() : it.id) !== itemId &&
                (typeof it.getName === 'function' ? it.getName() : it.name).toLowerCase() ===
                    val.toLowerCase()
        )

        if (collision) {
            nameError.textContent = `Przedmiot o nazwie "${val}" już istnieje w projekcie`
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }

        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')

        if (typeof entity.setName === 'function') {
            entity.setName(val)
        } else {
            entity.name = val
        }
        item.name = val

        if (typeof ctx.markDirty === 'function') ctx.markDirty()
        if (typeof ctx.refreshActiveSection === 'function') ctx.refreshActiveSection('item')
        return true
    }

    nameInput.addEventListener('input', validateAndSaveName)
    container.appendChild(nameMod)

    // -------------------------------------------------------------
    // 3. Category & Consumable Module
    // -------------------------------------------------------------
    const categories = [
        { id: 'weapon', label: 'Broń (weapon)' },
        { id: 'armor', label: 'Pancerz / Tarcza (armor)' },
        { id: 'consumable', label: 'Mikstura / Prowiant (consumable)' },
        { id: 'quest', label: 'Klucz / Fabularny (quest)' },
        { id: 'scroll', label: 'Zwój / Księga (scroll)' },
        { id: 'artifact', label: 'Artefakt / Magiczny (artifact)' },
        { id: 'misc', label: 'Inne / Drobiazg (misc)' },
    ]

    const categoryMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.item_type_category', 'Kategoria i Typ')}</div>
        <div class="flex flex-col gap-2">
            <div>
                <label for="details-item-category-select" class="block text-[11px] text-zinc-400 mb-1">Kategoria przedmiotu:</label>
                <select id="details-item-category-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500">
                    ${categories
                        .map(
                            cat =>
                                `<option value="${cat.id}" ${config.category === cat.id ? 'selected' : ''}>${escapeHtml(cat.label)}</option>`
                        )
                        .join('')}
                    ${!categories.some(c => c.id === config.category) ? `<option value="${escapeHtml(config.category)}" selected>${escapeHtml(config.category)} (własna)</option>` : ''}
                </select>
            </div>
            <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5 select-none">
                <input id="details-item-is-consumable" type="checkbox" ${config.isConsumable ? 'checked' : ''} class="rounded accent-amber-500 cursor-pointer" />
                <span>${tr('details.item_consumable_label', 'Przedmiot jednorazowy (zużywa się / znika po użyciu)')}</span>
            </label>
        </div>
    `
    )

    const selCategory = categoryMod.querySelector('#details-item-category-select')
    const chkConsumable = categoryMod.querySelector('#details-item-is-consumable')

    selCategory.addEventListener('change', () => {
        const newCat = selCategory.value
        if (typeof entity.setCategory === 'function') {
            entity.setCategory(newCat)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.category = newCat
        }
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
    })

    chkConsumable.addEventListener('change', () => {
        const val = chkConsumable.checked
        if (typeof entity.setIsConsumable === 'function') {
            entity.setIsConsumable(val)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.isConsumable = val
        }
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
    })

    container.appendChild(categoryMod)

    // -------------------------------------------------------------
    // 4. Inventory Correlation & Slots Module
    // -------------------------------------------------------------
    const hero = ctx.projectPlayerCharacter || ctx.playerCharacter
    const heroInventories =
        hero && typeof hero.getInventories === 'function' ? hero.getInventories() : []

    const invMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('backpack', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_inv_config', 'Zasady Ekwipunku')}</span>
            </span>
            <span class="text-[10px] text-zinc-400 font-mono" id="details-item-slot-summary">${config.slotSize} ${config.slotSize === 1 ? 'slot' : 'sloty'}</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
            <div>
                <label for="details-item-slot-size" class="block text-[11px] text-zinc-400 mb-1">Zajmowane sloty:</label>
                <input
                    id="details-item-slot-size"
                    type="number"
                    min="0"
                    max="99"
                    value="${config.slotSize ?? 1}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                />
                <span class="text-[9px] text-zinc-500 block mt-0.5 leading-tight">0 = drobiazg (nie zajmuje slotu)</span>
            </div>
            <div>
                <label for="details-item-weight" class="block text-[11px] text-zinc-400 mb-1">Waga (kg/jedn.):</label>
                <input
                    id="details-item-weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value="${config.weight ?? 1}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center"
                />
            </div>
        </div>

        <!-- Starting Inventory Sync -->
        <div class="pt-2 border-t border-zinc-800/80 space-y-2">
            <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                <input id="details-item-in-starting-inv" type="checkbox" ${config.inStartingInventory ? 'checked' : ''} class="rounded accent-amber-500 cursor-pointer" />
                <span class="font-medium text-amber-200">${tr('details.item_in_starting_inventory', 'W początkowym ekwipunku gracza')}</span>
            </label>

            <div id="details-item-target-inv-row" class="${config.inStartingInventory ? 'flex' : 'hidden'} flex-col gap-1 pl-5">
                <label for="details-item-target-inv-select" class="text-[11px] text-zinc-400">Docelowy ekwipunek bohatera:</label>
                <select id="details-item-target-inv-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500">
                    <option value="">-- Domyślny ekwipunek --</option>
                    ${heroInventories
                        .map(inv => {
                            const iId = typeof inv.getId === 'function' ? inv.getId() : inv.id
                            const iName =
                                typeof inv.getName === 'function' ? inv.getName() : inv.name
                            return `<option value="${escapeHtml(iId)}" ${config.targetInventoryId === iId ? 'selected' : ''}>${escapeHtml(iName)}</option>`
                        })
                        .join('')}
                </select>
            </div>
        </div>
    `
    )

    const inpSlotSize = invMod.querySelector('#details-item-slot-size')
    const inpWeight = invMod.querySelector('#details-item-weight')
    const slotSummary = invMod.querySelector('#details-item-slot-summary')
    const chkStartingInv = invMod.querySelector('#details-item-in-starting-inv')
    const targetInvRow = invMod.querySelector('#details-item-target-inv-row')
    const selTargetInv = invMod.querySelector('#details-item-target-inv-select')

    inpSlotSize.addEventListener('change', () => {
        const val = Math.max(0, parseInt(inpSlotSize.value, 10) || 0)
        inpSlotSize.value = String(val)
        if (typeof entity.setSlotSize === 'function') {
            entity.setSlotSize(val)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.slotSize = val
        }
        slotSummary.textContent = `${val} ${val === 1 ? 'slot' : 'sloty'}`
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
    })

    inpWeight.addEventListener('change', () => {
        const val = Math.max(0, parseFloat(inpWeight.value) || 0)
        inpWeight.value = String(val)
        if (typeof entity.setWeight === 'function') {
            entity.setWeight(val)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.weight = val
        }
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
    })

    chkStartingInv.addEventListener('change', () => {
        const checked = chkStartingInv.checked
        if (checked) {
            targetInvRow.classList.remove('hidden')
        } else {
            targetInvRow.classList.add('hidden')
        }
        if (typeof entity.setInStartingInventory === 'function') {
            entity.setInStartingInventory(checked)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.inStartingInventory = checked
        }
        syncPlayerCharacterStartingInventory(entity, checked, selTargetInv.value, ctx)
    })

    selTargetInv.addEventListener('change', () => {
        const newTarget = selTargetInv.value
        if (typeof entity.setTargetInventoryId === 'function') {
            entity.setTargetInventoryId(newTarget)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.targetInventoryId = newTarget
        }
        if (chkStartingInv.checked) {
            syncPlayerCharacterStartingInventory(entity, true, newTarget, ctx)
        }
    })

    container.appendChild(invMod)

    // -------------------------------------------------------------
    // 5. Tags Module
    // -------------------------------------------------------------
    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('tag', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.tags', 'Tagi')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentTags.length}</span>
        </div>
        <div id="details-item-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-item-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                <option value="">-- ${tr('details.select_tag', 'Wybierz tag z projektu...')} --</option>
            </select>
            <button id="btn-details-add-item-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm">
                + Tag
            </button>
        </div>
    `
    )

    const tagsListEl = tagsMod.querySelector('#details-item-tags-list')
    const selTag = tagsMod.querySelector('#details-add-item-tag-select')
    const btnAddTag = tagsMod.querySelector('#btn-details-add-item-tag')

    const renderTagsList = () => {
        tagsListEl.innerHTML = ''
        const tags = typeof entity.getTags === 'function' ? entity.getTags() : entity.tags || []
        if (tags.length === 0) {
            tagsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_tags', 'Brak przypisanych tagów')}</span>`
            return
        }

        tags.forEach(tObj => {
            const tId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id
            const tName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name
            const tColor =
                (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) || '#3b82f6'

            const chip = document.createElement('span')
            chip.className =
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm'
            chip.style.backgroundColor = tColor
            chip.innerHTML = `
                <span>#${escapeHtml(tName)}</span>
                <button type="button" class="btn-remove-tag hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="Usuń tag">
                    ${getIconSvg('close', 'w-2.5 h-2.5')}
                </button>
            `
            chip.querySelector('.btn-remove-tag').addEventListener('click', () => {
                if (typeof entity.removeTag === 'function') {
                    entity.removeTag(tId)
                } else if (Array.isArray(entity.tags)) {
                    entity.tags = entity.tags.filter(t => t.id !== tId && t.name !== tName)
                }
                if (typeof ctx.markDirty === 'function') ctx.markDirty()
                renderTagsList()
            })
            tagsListEl.appendChild(chip)
        })
    }

    // Populate project tags select
    const projectTags = ctx.projectTags || []
    projectTags.forEach(tObj => {
        const tId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id
        const tName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name
        const opt = document.createElement('option')
        opt.value = tId
        opt.textContent = `#${tName}`
        selTag.appendChild(opt)
    })

    btnAddTag.addEventListener('click', () => {
        const selectedId = selTag.value
        if (!selectedId) return
        const found = projectTags.find(
            t => (typeof t.getId === 'function' ? t.getId() : t.id) === selectedId
        )
        if (found) {
            if (typeof entity.addTag === 'function') {
                entity.addTag(found)
            } else if (Array.isArray(entity.tags)) {
                if (!entity.tags.some(t => t.id === selectedId)) entity.tags.push(found)
            }
            if (typeof ctx.markDirty === 'function') ctx.markDirty()
            selTag.value = ''
            renderTagsList()
        }
    })

    renderTagsList()
    container.appendChild(tagsMod)

    // -------------------------------------------------------------
    // 6. RPG Modifiers Module
    // -------------------------------------------------------------
    const modifiersMod = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400 shrink-0 inline-flex items-center">${getIconSvg('stats', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_modifiers', 'Modyfikatory RPG')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono" id="details-item-mod-count">${currentModifiers.length}</span>
        </div>

        <div id="details-item-modifiers-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>

        <!-- Add Modifier Form -->
        <div class="bg-[#141416] p-2.5 rounded border border-zinc-800/80 space-y-2">
            <div class="text-[11px] font-medium text-zinc-300">Dodaj nowy modyfikator:</div>
            <div class="grid grid-cols-2 gap-1.5">
                <div>
                    <label for="details-mod-type" class="block text-[10px] text-zinc-400 mb-0.5">Typ celu:</label>
                    <select id="details-mod-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                        <option value="stat">Statystyka (Cecha)</option>
                        <option value="parameter">Parametr (Witalność)</option>
                        <option value="skill">Umiejętność</option>
                        <option value="feature">Cecha specjalna</option>
                        <option value="custom">Własny atrybut</option>
                    </select>
                </div>
                <div>
                    <label for="details-mod-target" class="block text-[10px] text-zinc-400 mb-0.5">Nazwa celu:</label>
                    <input id="details-mod-target" type="text" placeholder="np. Siła, Zdrowie..." class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
                </div>
            </div>

            <div class="flex gap-1.5 items-end">
                <div class="w-20 shrink-0">
                    <label for="details-mod-operator" class="block text-[10px] text-zinc-400 mb-0.5">Operator:</label>
                    <select id="details-mod-operator" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-center">
                        <option value="+">+ (dodaj)</option>
                        <option value="-">- (odejmij)</option>
                        <option value="=">= (ustaw)</option>
                    </select>
                </div>
                <div class="flex-1 min-w-0">
                    <label for="details-mod-value" class="block text-[10px] text-zinc-400 mb-0.5">Wartość:</label>
                    <input id="details-mod-value" type="text" placeholder="np. 4 lub +10%" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono" />
                </div>
                <button id="btn-add-item-modifier" type="button" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm shrink-0">
                    + Dodaj
                </button>
            </div>
        </div>
    `
    )

    const modifiersListEl = modifiersMod.querySelector('#details-item-modifiers-list')
    const modCountEl = modifiersMod.querySelector('#details-item-mod-count')
    const selModType = modifiersMod.querySelector('#details-mod-type')
    const inpModTarget = modifiersMod.querySelector('#details-mod-target')
    const selModOp = modifiersMod.querySelector('#details-mod-operator')
    const inpModValue = modifiersMod.querySelector('#details-mod-value')
    const btnAddMod = modifiersMod.querySelector('#btn-add-item-modifier')

    const renderModifiersList = () => {
        modifiersListEl.innerHTML = ''
        const mods =
            typeof entity.getModifiers === 'function'
                ? entity.getModifiers()
                : entity.modifiers || []
        modCountEl.textContent = String(mods.length)

        if (mods.length === 0) {
            modifiersListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.no_modifiers', 'Brak modyfikatorów RPG')}</span>`
            return
        }

        mods.forEach(mod => {
            const card = document.createElement('div')
            card.className =
                'flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'

            const sign =
                mod.operator === '+' && typeof mod.value === 'number' && mod.value > 0
                    ? '+'
                    : mod.operator === '='
                      ? '='
                      : ''

            card.innerHTML = `
                <div class="flex items-center gap-1.5 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">${escapeHtml(mod.targetType || 'stat')}</span>
                    <span class="font-medium text-white truncate">${escapeHtml(mod.targetName)}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-700/50">${sign}${escapeHtml(String(mod.value))}</span>
                    <button type="button" class="btn-remove-mod text-zinc-400 hover:text-red-400 cursor-pointer transition-colors p-0.5" title="Usuń modyfikator">
                        ${getIconSvg('close', 'w-3 h-3')}
                    </button>
                </div>
            `

            card.querySelector('.btn-remove-mod').addEventListener('click', () => {
                if (typeof entity.removeModifier === 'function') {
                    entity.removeModifier(mod.id)
                } else if (Array.isArray(entity.modifiers)) {
                    entity.modifiers = entity.modifiers.filter(m => m.id !== mod.id)
                }
                if (typeof ctx.markDirty === 'function') ctx.markDirty()
                renderModifiersList()
            })

            modifiersListEl.appendChild(card)
        })
    }

    btnAddMod.addEventListener('click', () => {
        const targetName = inpModTarget.value.trim()
        const rawVal = inpModValue.value.trim()
        if (!targetName || !rawVal) return

        const numVal = Number(rawVal)
        const finalVal = isNaN(numVal) ? rawVal : numVal

        const newMod = {
            id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            targetType: selModType.value,
            targetName,
            operator: selModOp.value,
            value: finalVal,
        }

        if (typeof entity.addModifier === 'function') {
            entity.addModifier(newMod)
        } else if (Array.isArray(entity.modifiers)) {
            entity.modifiers.push(newMod)
        }

        inpModTarget.value = ''
        inpModValue.value = ''
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
        renderModifiersList()
    })

    renderModifiersList()
    container.appendChild(modifiersMod)

    // -------------------------------------------------------------
    // 7. Summary & Narrative File Module
    // -------------------------------------------------------------
    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <label for="details-item-summary-input" class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${tr('details.summary', 'Streszczenie fabularne')}</label>
        <textarea
            id="details-item-summary-input"
            rows="2"
            placeholder="${tr('details.item_summary_placeholder', 'Krótki opis przedmiotu widoczny dla gracza...')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-normal leading-relaxed"
        >${escapeHtml(summary)}</textarea>

        <div class="pt-1">
            <button id="btn-open-item-markdown" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] active:scale-[0.99] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer transition-colors">
                <span class="flex items-center gap-2">
                    <span class="text-amber-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${tr('details.open_description_file', 'Otwórz plik opisu (Markdown)')}</span>
                </span>
                <span class="text-zinc-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `
    )

    const summaryInput = descMod.querySelector('#details-item-summary-input')
    summaryInput.addEventListener('input', () => {
        if (typeof descObj.setSummary === 'function') {
            descObj.setSummary(summaryInput.value)
        } else {
            descObj.summary = summaryInput.value
        }
        if (typeof descObj.setText === 'function') {
            descObj.setText(summaryInput.value)
        }
        if (typeof ctx.markDirty === 'function') ctx.markDirty()
    })

    descMod.querySelector('#btn-open-item-markdown').addEventListener('click', () => {
        if (ctx.vm && typeof ctx.vm.openOrCreateDescriptionFile === 'function') {
            const res = ctx.vm.openOrCreateDescriptionFile()
            if (res && res.fileName && ctx.files) {
                ctx.files[res.fileName] = res.content
                if (typeof ctx.updateMainWorkspaceUI === 'function') {
                    ctx.updateMainWorkspaceUI()
                }
            }
        }
    })

    container.appendChild(descMod)

    // -------------------------------------------------------------
    // 8. Paragraph Usages Module (Where is it found/required?)
    // -------------------------------------------------------------
    const paragraphs = ctx.projectParagraphs || []
    const usages = []

    paragraphs.forEach(p => {
        const actions = typeof p.getItemActions === 'function' ? p.getItemActions() : p.itemActions
        if (Array.isArray(actions)) {
            actions.forEach(a => {
                if (a.itemId === itemId || a.itemName === itemName) {
                    usages.push({
                        paragraph: p,
                        action: a.action,
                        quantity: a.quantity || 1,
                    })
                }
            })
        }
    })

    const usagesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-indigo-400 shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                <span>Występowanie w paragrafach</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${usages.length}</span>
        </div>
        <div id="details-item-usages-list" class="flex flex-col gap-1 min-h-[20px]">
            ${
                usages.length === 0
                    ? `<span class="text-xs text-gray-500 italic py-0.5">Przedmiot nie jest jeszcze przypisany do żadnego paragrafu.</span>`
                    : ''
            }
        </div>
    `
    )

    const usagesListEl = usagesMod.querySelector('#details-item-usages-list')
    usages.forEach(u => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] text-xs hover:border-zinc-600 transition-colors cursor-pointer group'

        const pNum =
            typeof u.paragraph.getDisplayNumber === 'function'
                ? u.paragraph.getDisplayNumber()
                : u.paragraph.number || ''
        const pTitle =
            typeof u.paragraph.getName === 'function' ? u.paragraph.getName() : u.paragraph.name

        let badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50'
        let badgeLabel = 'Otrzymaj'
        if (u.action === 'require') {
            badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-600/50'
            badgeLabel = 'Wymagaj'
        } else if (u.action === 'remove') {
            badgeClass = 'bg-rose-950/70 text-rose-300 border-rose-600/50'
            badgeLabel = 'Utrata'
        }

        row.innerHTML = `
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="font-mono text-[10px] text-zinc-400 shrink-0">${pNum ? `#${pNum}` : '§'}</span>
                <span class="font-medium text-zinc-200 group-hover:text-white truncate">${escapeHtml(pTitle)}</span>
            </div>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold border ${badgeClass} shrink-0">
                ${badgeLabel} ${u.quantity > 1 ? `x${u.quantity}` : ''}
            </span>
        `

        row.addEventListener('click', () => {
            if (typeof ctx.selectEntity === 'function') {
                ctx.selectEntity(u.paragraph, 'paragraph')
            } else if (ctx.vm) {
                ctx.vm.selectElement(u.paragraph, 'paragraph')
                refreshDetails(ctx, onRefreshDetails)
            }
            if (
                ctx.storyGraphInstance &&
                typeof ctx.storyGraphInstance.focusOnElement === 'function'
            ) {
                ctx.storyGraphInstance.focusOnElement(
                    typeof u.paragraph.getId === 'function' ? u.paragraph.getId() : u.paragraph.id
                )
            }
        })

        usagesListEl.appendChild(row)
    })

    container.appendChild(usagesMod)

    // -------------------------------------------------------------
    // 9. Quick Export & Actions Module
    // -------------------------------------------------------------
    const exportMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">Eksport i Narzędzia</div>
        <div class="grid grid-cols-2 gap-1.5">
            <button id="btn-copy-item-json" type="button" class="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Kopiuj JSON tego przedmiotu do schowka">
                ${getIconSvg('copy', 'w-3 h-3')}
                <span>Kopiuj JSON</span>
            </button>
            <button id="btn-download-item-json" type="button" class="px-2 py-1.5 rounded bg-amber-600/30 hover:bg-amber-600/50 active:scale-[0.98] border border-amber-500/40 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Pobierz ten przedmiot jako plik JSON">
                ${getIconSvg('export', 'w-3 h-3')}
                <span>Zapisz JSON</span>
            </button>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-1">
            <button id="btn-export-all-csv" type="button" class="px-2 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-[0.98] border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Eksportuj wszystkie przedmioty projektu do pliku arkusza CSV">
                <span>📊</span>
                <span>Katalog (CSV)</span>
            </button>
            <button id="btn-export-all-md" type="button" class="px-2 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 active:scale-[0.98] border border-amber-700/60 text-xs text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors" title="Eksportuj katalog wszystkich przedmiotów do pliku Markdown">
                <span>📝</span>
                <span>Katalog (MD)</span>
            </button>
        </div>
    `
    )

    const getProjectName = () => {
        return (
            ctx.projectName ||
            (typeof ctx.getProjectName === 'function' ? ctx.getProjectName() : null) ||
            ctx.vm?.project?.getName?.() ||
            'projekt'
        )
    }

    // 1. Single Item JSON
    exportMod.querySelector('#btn-copy-item-json').addEventListener('click', () => {
        const jsonStr = ItemExportService
            ? ItemExportService.exportToJSON([entity], {
                  includeParagraphUsages: true,
                  paragraphs: ctx.projectParagraphs || [],
              })
            : JSON.stringify(
                  typeof entity.toJSON === 'function' ? entity.toJSON() : entity,
                  null,
                  2
              )
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonStr)
        }
    })

    exportMod.querySelector('#btn-download-item-json').addEventListener('click', () => {
        const jsonStr = ItemExportService
            ? ItemExportService.exportToJSON([entity], {
                  includeParagraphUsages: true,
                  paragraphs: ctx.projectParagraphs || [],
              })
            : JSON.stringify(
                  typeof entity.toJSON === 'function' ? entity.toJSON() : entity,
                  null,
                  2
              )
        const filename = `item_${(itemName || 'item').toLowerCase().replace(/\s+/g, '_')}.json`
        if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
            ItemExportService.downloadFile(jsonStr, filename, 'application/json')
        } else {
            const blob = new Blob([jsonStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    })

    // 2. All Items CSV Catalog
    exportMod.querySelector('#btn-export-all-csv').addEventListener('click', () => {
        const items = ctx.projectItems || []
        const csvStr = ItemExportService ? ItemExportService.exportToCSV(items) : ''
        const projName = getProjectName().toLowerCase().replace(/\s+/g, '_')
        if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
            ItemExportService.downloadFile(
                csvStr,
                `${projName}_przedmioty.csv`,
                'text/csv;charset=utf-8'
            )
        }
    })

    // 3. All Items Markdown Catalog
    exportMod.querySelector('#btn-export-all-md').addEventListener('click', () => {
        const items = ctx.projectItems || []
        const projName = getProjectName()
        const mdStr = ItemExportService
            ? ItemExportService.exportToMarkdown(items, {
                  projectTitle: `Katalog Przedmiotów — ${projName}`,
                  includeParagraphUsages: true,
                  paragraphs: ctx.projectParagraphs || [],
              })
            : ''
        if (ItemExportService && typeof ItemExportService.downloadFile === 'function') {
            ItemExportService.downloadFile(
                mdStr,
                `${projName.toLowerCase().replace(/\s+/g, '_')}_katalog_przedmiotow.md`,
                'text/markdown;charset=utf-8'
            )
        }
    })

    container.appendChild(exportMod)
}
