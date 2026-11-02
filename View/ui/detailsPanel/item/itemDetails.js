/**
 * Dedicated Details & Inspector Panel for an Item entity.
 * Orchestrates modular sections: Header, Name, Category, Inventory, Tags,
 * RPG Modifiers, Narrative Description, Usages in Paragraphs, and Quick Export.
 */

import { t } from '../../../../dist/Utils/translate.js'
import { Description } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { createItemCategorySection } from './itemCategorySection.js'
import { createItemDescriptionSection } from './itemDescriptionSection.js'
import { createItemExportSection } from './itemExportSection.js'
import { createItemHeaderSection } from './itemHeaderSection.js'
import {
    createItemInventorySection,
    syncPlayerCharacterStartingInventory,
} from './itemInventorySection.js'
import { createItemModifiersSection } from './itemModifiersSection.js'
import { createItemNameSection } from './itemNameSection.js'
import { createItemTagsSection } from './itemTagsSection.js'
import { createItemUsagesSection } from './itemUsagesSection.js'

export { syncPlayerCharacterStartingInventory }

/**
 * Triggers refresh of details panel and other active workspace views.
 *
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function refreshDetails(ctx, onRefreshDetails) {
    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx?.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
    if (typeof ctx?.refreshActiveSection === 'function') {
        ctx.refreshActiveSection('item')
    }
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

    const itemId = typeof entity.getId === 'function' ? entity.getId() : entity.id || item?.id || ''
    const itemName =
        (typeof entity.getName === 'function' ? entity.getName() : entity.name || item?.name) ||
        t('item.new') ||
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

    // 1. Header & ID Module
    container.appendChild(createItemHeaderSection(entity, itemId, item, ctx, onRefreshDetails))

    // 2. Name Module with Collision Validation
    container.appendChild(createItemNameSection(entity, itemId, itemName, item, ctx))

    // 3. Category & Consumable Module
    container.appendChild(createItemCategorySection(entity, config, ctx))

    // 4. Inventory Correlation & Slots Module
    container.appendChild(createItemInventorySection(entity, config, ctx))

    // 5. Tags Module
    container.appendChild(createItemTagsSection(entity, currentTags, ctx))

    // 6. RPG Modifiers Module
    container.appendChild(createItemModifiersSection(entity, currentModifiers, ctx))

    // 7. Summary & Narrative File Module
    container.appendChild(createItemDescriptionSection(descObj, summary, ctx))

    // 8. Paragraph Usages Module
    container.appendChild(createItemUsagesSection(entity, itemId, itemName, ctx, onRefreshDetails))

    // 9. Quick Export & Actions Module
    container.appendChild(createItemExportSection(entity, itemName, ctx))
}
