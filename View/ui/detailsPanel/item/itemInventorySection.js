import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Synchronizes item in/out of the player's starting inventory.
 *
 * @param {object} itemEntity
 * @param {boolean} inStarting
 * @param {string} targetInvId
 * @param {object} ctx
 */
export function syncPlayerCharacterStartingInventory(itemEntity, inStarting, targetInvId, ctx) {
    const hero = ctx?.projectPlayerCharacter || ctx?.playerCharacter
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

    if (typeof ctx?.markDirty === 'function') ctx.markDirty()
}

/**
 * Creates the Inventory Correlation & Slots Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {object} config Inventory configuration object
 * @param {object} ctx Application UI Context
 * @returns {HTMLElement}
 */
export function createItemInventorySection(entity, config, ctx) {
    const hero = ctx?.projectPlayerCharacter || ctx?.playerCharacter
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
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
    })

    inpWeight.addEventListener('change', () => {
        const val = Math.max(0, parseFloat(inpWeight.value) || 0)
        inpWeight.value = String(val)
        if (typeof entity.setWeight === 'function') {
            entity.setWeight(val)
        } else if (entity.inventoryConfig) {
            entity.inventoryConfig.weight = val
        }
        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
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

    return invMod
}
