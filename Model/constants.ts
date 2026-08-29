export const DEFAULT_TAG_COLOR = '#3b82f6'

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
