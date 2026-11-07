/**
 * Drawer Interaction & Event Binding Utilities
 *
 * Handles drag-and-drop, double-click item selection, context menus,
 * and color picker popovers for items in the Left Drawer.
 */

import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { renderParagraphsList, renderScenesList } from './drawerStoryLists.js'

/**
 * Attaches drag & drop assignment listeners to items in Left Drawer.
 *
 * @param {HTMLElement} container
 * @param {string} targetType
 * @param {any[]} targetArray
 * @param {object} ctx
 */
export function attachDrawerDropListeners(container, targetType, targetArray, ctx) {
    container.querySelectorAll(`.drawer-item[data-item-type="${targetType}"]`).forEach(el => {
        el.addEventListener('dragover', e => {
            const id = el.dataset.itemId
            const target = targetArray.find(x => x.getId() === id)
            if (target && target.getIsStart && target.getIsStart()) {
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
                return
            }
            if (
                e.dataTransfer &&
                (e.dataTransfer.types.includes('application/x-entity-type') ||
                    e.dataTransfer.types.includes('application/x-tag-id') ||
                    e.dataTransfer.types.includes('application/x-character-id') ||
                    e.dataTransfer.types.includes('application/x-location-id'))
            ) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                el.classList.add('border-blue-500', 'ring-1', 'ring-blue-500/50')
            }
        })
        el.addEventListener('dragleave', () => {
            el.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500/50')
        })
        el.addEventListener('drop', e => {
            e.preventDefault()
            el.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500/50')
            const id = el.dataset.itemId
            const target = targetArray.find(x => x.getId() === id)
            if (!target || !e.dataTransfer) return
            if (target.getIsStart && target.getIsStart()) return

            let entityType = e.dataTransfer.getData('application/x-entity-type')
            let entityId = e.dataTransfer.getData('application/x-entity-id')

            if (!entityType) {
                if (e.dataTransfer.getData('application/x-tag-id')) {
                    entityType = 'tag'
                    entityId = e.dataTransfer.getData('application/x-tag-id')
                } else if (e.dataTransfer.getData('application/x-character-id')) {
                    entityType = 'character'
                    entityId = e.dataTransfer.getData('application/x-character-id')
                } else if (e.dataTransfer.getData('application/x-location-id')) {
                    entityType = 'location'
                    entityId = e.dataTransfer.getData('application/x-location-id')
                }
            }

            const targetName =
                typeof target.getName === 'function'
                    ? target.getName()
                    : typeof target.getTitle === 'function'
                      ? target.getTitle()
                      : id

            if (entityType === 'tag') {
                const tagObj = ctx.projectTags.find(tObj => tObj.getId() === entityId)
                if (tagObj) {
                    target.addTag(tagObj)
                    toast.success(
                        t('toast.tag_assigned', {
                            tag: tagObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            } else if (entityType === 'character') {
                const charObj = ctx.projectCharacters.find(c => c.getId() === entityId)
                if (charObj) {
                    target.addCharacter(charObj)
                    toast.success(
                        t('toast.character_assigned', {
                            character: charObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            } else if (entityType === 'location') {
                const locObj = ctx.projectLocations.find(l => l.getId() === entityId)
                if (locObj) {
                    if (typeof target.addLocation === 'function') {
                        target.addLocation(locObj)
                    } else if (typeof target.setLocation === 'function') {
                        target.setLocation(locObj)
                    }
                    toast.success(
                        t('toast.location_assigned', {
                            location: locObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            }

            if (typeof ctx.renderParagraphsList === 'function') {
                ctx.renderParagraphsList(ctx)
            } else {
                renderParagraphsList(ctx)
            }

            if (typeof ctx.renderScenesList === 'function') {
                ctx.renderScenesList(ctx)
            } else {
                renderScenesList(ctx)
            }

            if (ctx.renderDetailsPanel) ctx.renderDetailsPanel(ctx)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        })
    })
}

/**
 * Attaches drag-and-drop start listeners to drawer items in a container.
 *
 * @param {HTMLElement} container
 * @param {string} [itemType]
 */
export function attachDragStartListeners(container, itemType) {
    const selector = itemType ? `.drawer-item[data-item-type="${itemType}"]` : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('dragstart', e => {
            const id = el.dataset.itemId
            const type = itemType || el.dataset.itemType
            if (e.dataTransfer && id && type) {
                e.dataTransfer.setData('text/plain', id)
                e.dataTransfer.setData('application/x-entity-type', type)
                e.dataTransfer.setData('application/x-entity-id', id)
                e.dataTransfer.setData(`application/x-${type}-id`, id)
                e.dataTransfer.effectAllowed = 'copyMove'
            }
        })
    })
}

/**
 * Attaches double-click entity selection listeners to items in Left Drawer.
 *
 * @param {HTMLElement} container
 * @param {string} type
 * @param {any[]} sourceArray
 * @param {object} ctx
 */
export function attachItemSelectionListeners(container, type, sourceArray, ctx) {
    const selector =
        type === 'trait' || type === 'stat'
            ? '.drawer-item[data-item-type="trait"], .drawer-item[data-item-type="stat"]'
            : type
              ? `.drawer-item[data-item-type="${type}"]`
              : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        const handleSelect = e => {
            e.preventDefault()
            const id = el.dataset.itemId
            const item = sourceArray.find(
                x => (typeof x.getId === 'function' ? x.getId() : x.id) === id
            )
            if (item && ctx.selectEntity) {
                const entityType = el.dataset.itemType || (type === 'trait' ? 'stat' : type)
                ctx.selectEntity(item, entityType)
            }
        }
        el.addEventListener('click', handleSelect)
        el.addEventListener('dblclick', handleSelect)
    })
}

/**
 * Attaches right-click context menu listeners to drawer items.
 *
 * @param {HTMLElement} container
 * @param {string} type
 * @param {any[]} sourceArray
 * @param {object} ctx
 */
export function attachContextMenuListeners(container, type, sourceArray, ctx) {
    const selector =
        type === 'trait' || type === 'stat'
            ? '.drawer-item[data-item-type="trait"], .drawer-item[data-item-type="stat"]'
            : type
              ? `.drawer-item[data-item-type="${type}"]`
              : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('contextmenu', e => {
            e.preventDefault()
            e.stopPropagation()

            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.getId() === id)
            if (!item) return

            if (ctx.openContextMenu) {
                ctx.openContextMenu(e.clientX, e.clientY, {
                    type: el.dataset.itemType || type,
                    id,
                    name: typeof item.getName === 'function' ? item.getName() : id,
                    item,
                })
            }
        })
    })
}

/**
 * Attaches click listeners to color badges in the drawer to open color popover.
 *
 * @param {HTMLElement} container
 * @param {object} ctx
 */
export function attachColorPickerListeners(container, ctx) {
    container.querySelectorAll('.tag-color-badge, .scene-color-badge').forEach(badge => {
        badge.addEventListener('click', e => {
            e.stopPropagation()
            const parent = badge.closest('.drawer-item')
            if (!parent) return
            const itemType = parent.dataset.itemType
            const itemId = parent.dataset.itemId
            const entity =
                itemType === 'scene'
                    ? ctx.projectScenes.find(s => s.getId() === itemId)
                    : ctx.projectTags.find(tObj => tObj.getId() === itemId)

            if (ctx.openColorPicker && entity) {
                ctx.openColorPicker(badge, entity)
            }
        })
    })
}
