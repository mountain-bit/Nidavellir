export const DEFAULT_TAG_COLOR = '#3b82f6'
export const DEFAULT_SCENE_COLOR = '#3b82f6'

export const PRESET_ENTITY_COLORS = [
    '#3b82f6', // Niebieski
    '#6366f1', // Indygo
    '#8b5cf6', // Fioletowy
    '#ec4899', // Różowy
    '#ef4444', // Czerwony
    '#f97316', // Pomarańczowy
    '#f59e0b', // Bursztynowy
    '#10b981', // Szmaragdowy
    '#14b8a6', // Morski
    '#06b6d4', // Cyjan
    '#64748b', // Łupkowy
    '#71717a', // Cynkowy
] as const

export const ENTITY_CATEGORIES = {
    NPC: 'NPC',
    PARAGRAPHS: 'Paragraphs',
    ITEMS: 'Items',
    LOCATIONS: 'Locations',
    TEMPLATES: 'Templates',
    CHARACTER_CLASSES: 'CharacterClasses',
    RULES: 'Rules',
    PLAYER_CHARACTER: 'PlayerCharacter',
} as const

export type EntityCategoryKey = keyof typeof ENTITY_CATEGORIES
export type EntityCategoryName = (typeof ENTITY_CATEGORIES)[EntityCategoryKey]
