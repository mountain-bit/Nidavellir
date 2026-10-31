/**
 * View/ui/editor Barrel Module
 *
 * Re-exports editor instances, toolbars, dialog modals, and utility helpers
 * from organized domain subdirectories.
 */

// Instances
export {
    destroyHeroEditor,
    getHeroEditorInstance,
    getOrCreateHeroEditor,
    updateHeroEditorStats,
} from './instances/heroEditor.js'
export {
    getMainEditorInstance,
    getOrCreateMainEditor,
    setEditorActiveState,
    syncEntitiesWithActiveObject,
    updateEditorStats,
} from './instances/mainEditor.js'
export {
    destroyNpcEditor,
    getNpcEditorInstance,
    getOrCreateNpcEditor,
    updateNpcEditorStats,
} from './instances/npcEditor.js'

// Toolbar & Context Menu
export { setupCustomStylesUI } from './toolbar/customStylesMenu.js'
export {
    attachEditorContextMenuListener,
    getActiveContextMenuData,
    hideEditorContextMenu,
    openEditorContextMenu,
    setupEditorContextMenu,
} from './toolbar/editorContextMenu.js'
export {
    getToolbarButtonMap,
    setupToolbarButtons,
    TOOLBAR_BUTTON_STATE_MAP,
    updateToolbarActiveStates,
} from './toolbar/editorToolbar.js'

// Modals
export { persistStylesAndFonts, setupCustomStyleModal } from './modals/customStyleModal.js'
export {
    closeDescriptionEmbedModal,
    extractEmbeddableEntities,
    openDescriptionEmbedModal,
    positionDescriptionEmbedPopover,
} from './modals/descriptionEmbedModal.js'
export {
    closeEntityLinkModal,
    extractAvailableProjectEntities,
    openEntityLinkModal,
    positionPopover,
} from './modals/entityLinkModal.js'
export { setupFontBrowserUI } from './modals/fontBrowserModal.js'

// Utils
export { extractEntityDescription, getProjectEntityList } from './utils/editorEntityHelpers.js'
export {
    setupEditorImageDoubleClickHandler,
    setupEditorImageDropZone,
} from './utils/editorImageHelpers.js'
export { positionFloatingPopover } from './utils/editorPopoverUtils.js'
