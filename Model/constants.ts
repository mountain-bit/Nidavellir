export const DEFAULT_TAG_COLOR = '#4a5b6d'
export const DEFAULT_SCENE_COLOR = '#4a5b6d'

export const PRESET_ENTITY_COLORS = [
    '#4a5b6d', // Stal grafitowa
    '#3f5263', // Ciemny łupek
    '#3e5445', // Szałwia leśna
    '#4c573f', // Ciemna oliwka
    '#69563c', // Zgaszona ochra
    '#69453b', // Zgaszona terakota
    '#643c42', // Stonowany burgund
    '#55425a', // Zgaszona śliwka
    '#41455a', // Grafit indygo
    '#4f545c', // Chłodny popiel
    '#57524c', // Kamienny taupe
    '#3b3d42', // Neutralny antracyt
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
