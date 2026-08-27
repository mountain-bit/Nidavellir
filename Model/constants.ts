export const DEFAULT_TAG_COLOR = '#3b82f6'

export const ENTITY_CATEGORIES = {
    NPC: 'NPC',
    PARAGRAFY: 'Paragrafy',
    PRZEDMIOTY: 'Przedmioty',
    LOKACJE: 'Lokacje',
    TEMPLATES: 'Templates',
    KLASY_POSTACI: 'KlasyPostaci',
    ZASADY: 'Zasady',
    POSTAC_GRACZA: 'PostacGracza',
} as const

export type EntityCategoryKey = keyof typeof ENTITY_CATEGORIES
export type EntityCategoryName = (typeof ENTITY_CATEGORIES)[EntityCategoryKey]
