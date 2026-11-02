/**
 * Centralized SVG Icon System for SilnikGierParagrafowych.
 *
 * Provides a single source of truth for Lucide/Heroicon SVG icons used throughout
 * the UI, Graph visualization, context menus, and toolbars.
 */

export const PARAGRAPH_SYMBOL = '§'
export const DEFAULT_ICON_VIEWBOX = '0 0 24 24'

export type IconName =
    | 'paragraph'
    | 'scene'
    | 'choice'
    | 'connection'
    | 'character'
    | 'template'
    | 'location'
    | 'trait'
    | 'stat'
    | 'parameter'
    | 'skill'
    | 'feature'
    | 'tag'
    | 'item'
    | 'backpack'
    | 'class'
    | 'check'
    | 'close'
    | 'close-all'
    | 'markdown'
    | 'graph'
    | 'arrow-right'
    | 'arrow-left'
    | 'arrow-up'
    | 'arrow-down'
    | 'chevron-right'
    | 'chevron-down'
    | 'plus'
    | 'trash'
    | 'edit'
    | 'new-file'
    | 'open'
    | 'save'
    | 'close-app'
    | 'settings'
    | 'search'
    | 'filter'
    | 'zoom-in'
    | 'zoom-out'
    | 'zoom-reset'
    | 'undo'
    | 'redo'
    | 'export'
    | 'import'
    | 'lock'
    | 'unlock'
    | 'sparkles'
    | 'font'
    | 'globe'
    | 'eraser'
    | 'alert-triangle'
    | 'link'
    | 'image'
    | 'upload'
    | 'crop'
    | 'rotate-cw'
    | 'rotate-ccw'
    | 'flip-h'
    | 'flip-v'
    | 'sliders'
    | 'play'
    | 'flag'
    | 'sidebar-left'
    | 'sidebar-right'
    | 'help'
    | 'swords'
    | 'combat'
    | 'dice'
    | 'book'
    | 'copy'
    | 'table'

export interface IIconConfig {
    viewBox?: string
    path: string
}

// Shared SVG paths for semantic icon aliases
const SWORDS_PATH =
    '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line><line x1="19" y1="21" x2="21" y2="19"></line><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"></polyline><line x1="5" y1="14" x2="9" y2="18"></line><line x1="7" y1="17" x2="4" y2="20"></line><line x1="3" y1="19" x2="5" y2="21"></line>'
const CHOICE_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>'
const TRAIT_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"></path>'
const ITEM_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 10a4 4 0 014-4h8a4 4 0 014 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 21v-5a2 2 0 012-2h4a2 2 0 012 2v5"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h8"></path>'
const EXPORT_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>'
const ARROW_RIGHT_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>'
const ARROW_DOWN_PATH =
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>'

export const ICON_REGISTRY: Readonly<Record<IconName, IIconConfig>> = Object.freeze({
    book: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>',
    },
    dice: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><circle cx="8" cy="8" r="1.5" fill="currentColor"></circle><circle cx="16" cy="8" r="1.5" fill="currentColor"></circle><circle cx="8" cy="16" r="1.5" fill="currentColor"></circle><circle cx="16" cy="16" r="1.5" fill="currentColor"></circle><circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>',
    },
    swords: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: SWORDS_PATH,
    },
    combat: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: SWORDS_PATH,
    },
    paragraph: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>',
    },
    scene: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="2" y="2" width="20" height="20" rx="2.18" stroke-width="1.8"></rect><line x1="7" y1="2" x2="7" y2="22" stroke-width="1.8"></line><line x1="17" y1="2" x2="17" y2="22" stroke-width="1.8"></line><line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"></line><line x1="2" y1="7" x2="7" y2="7" stroke-width="1.8"></line><line x1="2" y1="17" x2="7" y2="17" stroke-width="1.8"></line><line x1="17" y1="17" x2="22" y2="17" stroke-width="1.8"></line><line x1="17" y1="7" x2="22" y2="7" stroke-width="1.8"></line>',
    },
    choice: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: CHOICE_PATH,
    },
    connection: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: CHOICE_PATH,
    },
    character: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4" stroke-width="1.8"></circle>',
    },
    template: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><line x1="3" y1="9" x2="21" y2="9" stroke-width="1.8"></line><line x1="9" y1="21" x2="9" y2="9" stroke-width="1.8"></line>',
    },
    location: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>',
    },
    trait: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: TRAIT_PATH,
    },
    stat: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: TRAIT_PATH,
    },
    parameter: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>',
    },
    skill: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></polygon>',
    },
    feature: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></polygon>',
    },
    tag: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>',
    },
    item: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ITEM_PATH,
    },
    backpack: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ITEM_PATH,
    },
    class: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    },
    check: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>',
    },
    close: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
    },
    'close-all': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 9l6 6m0-6l-6 6"></path>',
    },
    markdown: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
    },
    graph: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<circle cx="18" cy="18" r="3" stroke-width="1.8"></circle><circle cx="6" cy="6" r="3" stroke-width="1.8"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 6h3a2 2 0 012 2v7M6 9v12"></path>',
    },
    'arrow-right': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ARROW_RIGHT_PATH,
    },
    'arrow-left': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>',
    },
    'arrow-up': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>',
    },
    'arrow-down': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ARROW_DOWN_PATH,
    },
    'chevron-right': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ARROW_RIGHT_PATH,
    },
    'chevron-down': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: ARROW_DOWN_PATH,
    },
    plus: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 5v14m-7-7h14"></path>',
    },
    trash: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>',
    },
    edit: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>',
    },
    'new-file': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>',
    },
    open: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path>',
    },
    save: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 4v4H8V4m2 16v-6h4v6"></path>',
    },
    copy: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="1.8"></rect><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>',
    },
    table: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v18M3 9h18M3 15h18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"></path>',
    },
    'close-app': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12"></path>',
    },
    settings: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><circle cx="12" cy="12" r="3" stroke-width="1.8"></circle>',
    },
    search: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>',
    },
    filter: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>',
    },
    'zoom-in': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path>',
    },
    'zoom-out': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"></path>',
    },
    'zoom-reset': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>',
    },
    undo: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h10a5 5 0 015 5v2M3 10l6-6m-6 6l6 6"></path>',
    },
    redo: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 10H11a5 5 0 00-5 5v2m15-7l-6-6m6 6l-6 6"></path>',
    },
    export: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: EXPORT_PATH,
    },
    import: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>',
    },
    lock: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="1.8"></rect><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 11V7a5 5 0 0110 0v4"></path>',
    },
    unlock: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="1.8"></rect><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 11V7a5 5 0 019.9-1"></path>',
    },
    sparkles: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z"></path>',
    },
    font: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 20h3l2-6h6l2 6h3M14 10l-2-6-2 6M9 14h6"></path>',
    },
    globe: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<circle cx="12" cy="12" r="10" stroke-width="1.8"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>',
    },
    eraser: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 14l-7 7m0 0l-9-9 9-9 9 9-9 9zM6 15l3 3"></path>',
    },
    'alert-triangle': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"></path>',
    },
    link: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>',
    },
    image: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></polyline>',
    },
    upload: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: EXPORT_PATH,
    },
    crop: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6.13 1L6 16a2 2 0 002 2h15M1 6.13L16 6a2 2 0 012 2v15"></path>',
    },
    'rotate-cw': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8m0-5v5h-5"></path>',
    },
    'rotate-ccw': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12a9 9 0 109-9 8.96 8.96 0 00-6.57 2.57L3 8m0-5v5h5"></path>',
    },
    'flip-h': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2v20M4 6l6 6-6 6V6zm16 0l-6 6 6 6V6z"></path>',
    },
    'flip-v': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2 12h20M6 4l6 6 6-6H6zm0 16l6-6 6 6H6z"></path>',
    },
    sliders: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6"></path>',
    },
    play: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<polygon points="5 3 19 12 5 21 5 3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"></polygon>',
    },
    flag: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 0v7"></path>',
    },
    'sidebar-left': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><line x1="9" y1="3" x2="9" y2="21" stroke-width="1.8"></line>',
    },
    'sidebar-right': {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><line x1="15" y1="3" x2="15" y2="21" stroke-width="1.8"></line>',
    },
    help: {
        viewBox: DEFAULT_ICON_VIEWBOX,
        path: '<circle cx="12" cy="12" r="10" stroke-width="1.8"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"></path>',
    },
})

/**
 * Generates an inline SVG string for the given icon name.
 *
 * @param name The icon identifier (e.g. 'paragraph', 'save', 'choice').
 * @param extraClasses Tailwind / CSS classes to apply to the `<svg>` root element.
 * @param extraAttrs Additional HTML/SVG attributes (e.g., aria-hidden, data attributes).
 */
export function getIconSvg(
    name: IconName | string,
    extraClasses: string = 'w-4 h-4',
    extraAttrs: string = ''
): string {
    const icon = ICON_REGISTRY[name as IconName] || ICON_REGISTRY.paragraph
    const viewBox = icon.viewBox || DEFAULT_ICON_VIEWBOX
    const attrs = extraAttrs ? ` ${extraAttrs.trim()}` : ''
    return `<svg class="${extraClasses}" fill="none" stroke="currentColor" viewBox="${viewBox}"${attrs}>${icon.path}</svg>`
}

/**
 * Web Component <app-icon name="..."> to render declarative icons anywhere in HTML templates.
 */
export class AppIconElement extends (typeof HTMLElement !== 'undefined'
    ? HTMLElement
    : (class {} as typeof HTMLElement)) {
    static get observedAttributes(): string[] {
        return ['name', 'class']
    }

    connectedCallback(): void {
        this.render()
    }

    attributeChangedCallback(): void {
        this.render()
    }

    public render(): void {
        if (!this.getAttribute) return
        const name = this.getAttribute('name') || 'paragraph'
        const className = this.getAttribute('class') || 'w-4 h-4 inline-block'
        this.innerHTML = getIconSvg(name, className)
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('app-icon')) {
    customElements.define('app-icon', AppIconElement)
}
