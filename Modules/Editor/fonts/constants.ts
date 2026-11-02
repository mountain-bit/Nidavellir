export const FONTSOURCE_API_URL = 'https://api.fontsource.org/v1/fonts'
export const GOOGLE_FONTS_BASE_URL = 'https://fonts.googleapis.com/css2'
export const DEFAULT_FONT_FETCH_TIMEOUT_MS = 6000

/**
 * Zestaw kanonicznych identyfikatorów tagów kwalifikujących krój do kategorii Fantasy / Klimatyczne.
 * Zgodny z uniwersalną nomenklaturą tagów w TAG_CANONICAL_MAP oraz kluczami w translation.json (editor.font_tags.*).
 */
export const FANTASY_CATEGORY_TAGS = [
    'fantasy',
    'medieval',
    'gothic',
    'blackletter',
    'fairytale',
    'magic',
    'spells',
    'ancient',
    'antique',
    'pirate',
    'runes',
    'script',
    'knight',
    'atmospheric',
    'decorative',
    'celtic',
    'vintage',
    'display',
] as const
