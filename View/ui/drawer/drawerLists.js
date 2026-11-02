/**
 * Drawer Lists Facade Module
 *
 * Decomposed into modular domain components:
 * - drawerInteractions.js: Drag & drop, context menus, selection, color pickers.
 * - drawerStoryLists.js: Paragraphs, Scenes, Tags, Locations, Connections.
 * - drawerCharactersList.js: Characters, NPC Templates, Main Character protagonist.
 * - drawerItemsList.js: Items, category badges, modifiers.
 * - drawerTraitsList.js: Stats, Parameters, Skills, Features.
 *
 * Re-exports everything for 100% backward compatibility with existing callers and tests.
 */

export * from './drawerCharactersList.js'
export * from './drawerInteractions.js'
export * from './drawerItemsList.js'
export * from './drawerStoryLists.js'
export * from './drawerTraitsList.js'
