import {
    availableLanguages,
    type SupportedLanguage,
    t,
    type TranslationKey,
} from '../../../Utils/translate'
import { IFontCatalogItem } from '../types'

export interface IFontDefinition {
    name: string
    category?: string
    categoryKey?: string
    isCustom?: boolean
    googleFont?: boolean
}

/**
 * Zwraca zlokalizowaną nazwę kategorii dla wybranego kroju na podstawie aktywnego języka.
 * Korzysta bezpośrednio z centralnego systemu tłumaczeń t(). Dzięki temu po dodaniu
 * dowolnego nowego języka w Locales (np. fr, es, it) kategorie działają od razu bez modyfikacji kodu.
 */
export function getCuratedFontCategory(fontKey: string, fallback = ''): string {
    const key = fontKey.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const translationKey = `editor.styles.font_cat_${key}` as TranslationKey
    try {
        const translated = t(translationKey)
        if (translated && translated !== (translationKey as string)) {
            return translated
        }
    } catch {
        // Fallback w środowiskach bez i18n
    }
    return fallback
}

/**
 * Słownik kanonizacji tagów czcionek. Mapuje warianty językowe (pl, de, en) oraz
 * synonimy na znormalizowany klucz kanoniczny w języku angielskim.
 * Zapewnia pełną uniwersalność — dodanie dowolnego języka w translation.json nie wymaga
 * zmian w kodzie TypeScript.
 */
export const TAG_CANONICAL_MAP: Record<string, string> = {
    // Polski -> Kanoniczny
    fantasy: 'fantasy',
    fantastyka: 'fantasy',
    średniowieczny: 'medieval',
    średniowiecze: 'medieval',
    rycerski: 'knight',
    klimatyczny: 'atmospheric',
    miecz: 'sword',
    antyk: 'ancient',
    starożytny: 'ancient',
    prastary: 'archaic',
    inskrypcje: 'inscriptions',
    kamień: 'stone',
    monumentalny: 'monumental',
    rzymski: 'roman',
    ozdobny: 'decorative',
    nagłówek: 'heading',
    magia: 'magic',
    magiczny: 'magical',
    elegancki: 'elegant',
    elegancja: 'elegance',
    powieść: 'novel',
    powieściowy: 'novel',
    książka: 'book',
    książkowy: 'book',
    literacki: 'literary',
    gotyk: 'gothic',
    gotycki: 'gothic',
    baśń: 'fairytale',
    bajka: 'fairytale',
    czary: 'spells',
    zaklęcia: 'spells',
    odręczny: 'handwriting',
    pismo: 'handwriting',
    listy: 'letters',
    notatki: 'notes',
    dziennik: 'journal',
    maszynopis: 'typewriter',
    maszyna: 'typewriter',
    raporty: 'reports',
    'stara maszyna': 'vintage_typewriter',
    akta: 'records',
    dokumenty: 'records',
    klasyczny: 'classic',
    druk: 'print',
    kronika: 'chronicle',
    mroczny: 'dark',
    niemiecki: 'german',
    'stary niemiecki': 'german',
    piracki: 'pirate',
    piraci: 'pirate',
    przygoda: 'adventure',
    'stare mapy': 'old_maps',
    morze: 'sea',
    podniosły: 'solemn',
    narracja: 'narrative',
    czytelny: 'readable',
    'długie teksty': 'long_texts',
    kaligrafia: 'calligraphy',
    skrypt: 'script',
    zwoje: 'scrolls',
    tajemnica: 'mystery',
    tajemniczy: 'mystery',
    pergamin: 'parchment',
    rękopis: 'manuscript',
    celtycki: 'celtic',
    runy: 'runes',
    druidzi: 'druids',
    horror: 'horror',
    groza: 'horror',
    obłęd: 'madness',
    krew: 'blood',
    krwawy: 'blood',
    koszmar: 'nightmare',
    kapie: 'dripping',
    potwory: 'monsters',
    upiór: 'ghost',
    duch: 'ghost',
    halloween: 'halloween',
    śledztwo: 'investigation',
    tajne: 'secret',
    retro: 'retro',
    komputer: 'computer',
    terminal: 'terminal',
    'sci-fi': 'scifi',
    scifi: 'scifi',
    piksele: 'pixels',
    nowoczesny: 'modern',
    cyberpunk: 'cyberpunk',
    futurystyczny: 'futuristic',
    karczma: 'tavern',
    egzotyczny: 'exotic',
    szamański: 'shamanic',
    grecki: 'greek',
    mitologia: 'mythology',
    zagadka: 'riddle',
    labirynt: 'labyrinth',
    quest: 'quest',
    fraktura: 'fraktur',
    uniwersalny: 'universal',
    interfejs: 'interface',

    // Deutsch -> Kanoniczny
    mittelalterlich: 'medieval',
    ritter: 'knight',
    atmosphärisch: 'atmospheric',
    schwert: 'sword',
    antik: 'ancient',
    inschriften: 'inscriptions',
    stein: 'stone',
    römisch: 'roman',
    dekorativ: 'decorative',
    überschrift: 'heading',
    magie: 'magic',
    magisch: 'magical',
    buch: 'book',
    literarisch: 'literary',
    gotik: 'gothic',
    märchen: 'fairytale',
    zauber: 'spells',
    handschrift: 'handwriting',
    briefe: 'letters',
    notizen: 'notes',
    tagebuch: 'journal',
    schreibmaschine: 'typewriter',
    berichte: 'reports',
    'alte schreibmaschine': 'vintage_typewriter',
    akten: 'records',
    klassisch: 'classic',
    druck: 'print',
    chronik: 'chronicle',
    düster: 'dark',
    deutsch: 'german',
    piraten: 'pirate',
    abenteuer: 'adventure',
    'alte karten': 'old_maps',
    meer: 'sea',
    feierlich: 'solemn',
    eleganz: 'elegance',
    erzählung: 'narrative',
    lesbar: 'readable',
    'lange texte': 'long_texts',
    kalligraphie: 'calligraphy',
    schriftrollen: 'scrolls',
    geheimnis: 'mystery',
    pergament: 'parchment',
    manuskript: 'manuscript',
    keltisch: 'celtic',
    uralt: 'archaic',
    runen: 'runes',
    druiden: 'druids',
    wahnsinn: 'madness',
    blut: 'blood',
    albtraum: 'nightmare',
    tropfend: 'dripping',
    monster: 'monsters',
    geist: 'ghost',
    ermittlung: 'investigation',
    geheim: 'secret',
    pixel: 'pixels',
    taverne: 'tavern',
    schamanisch: 'shamanic',
    griechisch: 'greek',
    mythologie: 'mythology',
    rätsel: 'riddle',
    fraktur: 'fraktur',
    universell: 'universal',

    // English / Kanoniczny
    medieval: 'medieval',
    knight: 'knight',
    atmospheric: 'atmospheric',
    sword: 'sword',
    ancient: 'ancient',
    antique: 'ancient',
    inscriptions: 'inscriptions',
    stone: 'stone',
    monumental: 'monumental',
    roman: 'roman',
    decorative: 'decorative',
    heading: 'heading',
    magic: 'magic',
    magical: 'magical',
    elegant: 'elegant',
    novel: 'novel',
    book: 'book',
    literary: 'literary',
    gothic: 'gothic',
    blackletter: 'gothic',
    fairytale: 'fairytale',
    'fairy tale': 'fairytale',
    spells: 'spells',
    handwriting: 'handwriting',
    letters: 'letters',
    notes: 'notes',
    journal: 'journal',
    typewriter: 'typewriter',
    reports: 'reports',
    vintage_typewriter: 'vintage_typewriter',
    'vintage typewriter': 'vintage_typewriter',
    records: 'records',
    classic: 'classic',
    print: 'print',
    chronicle: 'chronicle',
    dark: 'dark',
    german: 'german',
    pirate: 'pirate',
    adventure: 'adventure',
    old_maps: 'old_maps',
    'old maps': 'old_maps',
    sea: 'sea',
    solemn: 'solemn',
    narrative: 'narrative',
    readable: 'readable',
    long_texts: 'long_texts',
    'long texts': 'long_texts',
    calligraphy: 'calligraphy',
    script: 'script',
    scrolls: 'scrolls',
    mystery: 'mystery',
    parchment: 'parchment',
    manuscript: 'manuscript',
    celtic: 'celtic',
    archaic: 'archaic',
    runes: 'runes',
    druids: 'druids',
    madness: 'madness',
    blood: 'blood',
    nightmare: 'nightmare',
    dripping: 'dripping',
    monsters: 'monsters',
    ghost: 'ghost',
    investigation: 'investigation',
    secret: 'secret',
    computer: 'computer',
    pixels: 'pixels',
    modern: 'modern',
    futuristic: 'futuristic',
    tavern: 'tavern',
    exotic: 'exotic',
    shamanic: 'shamanic',
    greek: 'greek',
    mythology: 'mythology',
    riddle: 'riddle',
    labyrinth: 'labyrinth',
    interface: 'interface',
}

/**
 * Zwraca kanoniczny (angielski) identyfikator tagu.
 */
export function getCanonicalFontTag(tag: string): string {
    if (!tag) return ''
    const normalized = tag.toLowerCase().trim()
    return TAG_CANONICAL_MAP[normalized] || normalized
}

/**
 * Zwraca zlokalizowaną nazwę tagu czcionki na podstawie bieżącego języka (i18n).
 */
export function getLocalizedFontTag(tag: string, fallback?: string): string {
    if (!tag) return ''
    const canonical = getCanonicalFontTag(tag)
    const key = canonical.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const translationKey = `editor.font_tags.${key}` as TranslationKey
    try {
        const translated = t(translationKey)
        if (translated && translated !== (translationKey as string)) {
            return translated
        }
    } catch {
        // Fallback w środowiskach bez i18n
    }
    return fallback ?? tag
}

/**
 * Podstawowa lista wyselekcjonowanych krojów pism z dynamicznymi kategoriami wielojęzycznymi.
 */
export const CURATED_FONTS: IFontDefinition[] = [
    {
        name: 'Cinzel',
        categoryKey: 'editor.styles.font_cat_cinzel',
        get category(): string {
            return getCuratedFontCategory('cinzel', 'Inscriptions / Antique')
        },
        googleFont: true,
    },
    {
        name: 'MedievalSharp',
        categoryKey: 'editor.styles.font_cat_medievalsharp',
        get category(): string {
            return getCuratedFontCategory('medievalsharp', 'Medieval / Fantasy')
        },
        googleFont: true,
    },
    {
        name: 'Playfair Display',
        categoryKey: 'editor.styles.font_cat_playfair_display',
        get category(): string {
            return getCuratedFontCategory('playfair_display', 'Elegant / Novel')
        },
        googleFont: true,
    },
    {
        name: 'Almendra',
        categoryKey: 'editor.styles.font_cat_almendra',
        get category(): string {
            return getCuratedFontCategory('almendra', 'Gothic / Fairy Tale')
        },
        googleFont: true,
    },
    {
        name: 'Caveat',
        categoryKey: 'editor.styles.font_cat_caveat',
        get category(): string {
            return getCuratedFontCategory('caveat', 'Handwritten / Letters')
        },
        googleFont: true,
    },
    {
        name: 'Courier Prime',
        categoryKey: 'editor.styles.font_cat_courier_prime',
        get category(): string {
            return getCuratedFontCategory('courier_prime', 'Typewriter / Reports')
        },
        googleFont: true,
    },
    {
        name: 'EB Garamond',
        categoryKey: 'editor.styles.font_cat_eb_garamond',
        get category(): string {
            return getCuratedFontCategory('eb_garamond', 'Classic Book Print')
        },
        googleFont: true,
    },
]

/**
 * Konfiguracja i znaki testowe dla obsługiwanych języków aplikacji.
 */
export interface ILanguageCharsetRule {
    code: SupportedLanguage
    name: string
    testChars: string
    requiredSubsets: string[]
}

export const LANGUAGE_CHARSET_RULES: Record<SupportedLanguage, ILanguageCharsetRule> = {
    pl: {
        code: 'pl',
        name: 'Polski',
        testChars: 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ',
        requiredSubsets: ['latin-ext'],
    },
    de: {
        code: 'de',
        name: 'Deutsch',
        testChars: 'äöüßÄÖÜẞ',
        requiredSubsets: ['latin', 'latin-ext'],
    },
    en: {
        code: 'en',
        name: 'English',
        testChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        requiredSubsets: ['latin'],
    },
}

/**
 * Sprawdza, czy dana czcionka obsługuje wskazany język.
 * Weryfikacja bazuje na wymaganych subsetach czcionki (np. 'latin-ext' dla języka polskiego).
 */
export function fontSupportsLanguage(
    font: Partial<IFontCatalogItem> & {
        subsets?: string[]
        supportsPolish?: boolean
    },
    langCode?: string
): boolean {
    if (!langCode || langCode === 'all') return true
    const target = langCode.toLowerCase().trim()

    // Język polski - wymaga znaków rozszerzonych latin-ext
    if (target === 'pl') {
        return Boolean(font.supportsPolish || font.subsets?.includes('latin-ext'))
    }

    // Język niemiecki - alfabet łaciński z umlautami (ä, ö, ü, ß)
    if (target === 'de') {
        if (font.subsets?.includes('latin-ext')) return true
        if (font.subsets?.includes('latin')) {
            const id = (font.id || font.family || '').toLowerCase().replace(/[^a-z0-9]/g, '')
            const asciiOnlyFonts = [
                'cinzel',
                'cinzeldecorative',
                'uncialantiqua',
                'jimnightshade',
                'creepster',
                'specialelite',
                'caesardressing',
                'mysteryquest',
            ]
            return !asciiOnlyFonts.includes(id)
        }
        return false
    }

    // Język angielski - standardowy alfabet łaciński
    if (target === 'en') {
        return Boolean(font.subsets?.includes('latin') || font.subsets?.includes('latin-ext'))
    }

    // Dla dowolnego innego języka dodanego w przyszłości:
    return Boolean(
        font.subsets?.includes(target) ||
        font.subsets?.includes('latin-ext') ||
        font.subsets?.includes('latin')
    )
}

/**
 * Zwraca listę obsługiwanych języków spośród dostępnych w projekcie (availableLanguages).
 * Jeśli aplikacja nie obsługuje danego języka, nie jest on zwracany.
 */
export function getFontSupportedLanguages(
    font: Partial<IFontCatalogItem> & {
        subsets?: string[]
        supportsPolish?: boolean
    }
): SupportedLanguage[] {
    return availableLanguages.filter(lang => fontSupportsLanguage(font, lang))
}

export const OFFLINE_FONTS_CATALOG: IFontCatalogItem[] = [
    {
        id: 'medievalsharp',
        family: 'MedievalSharp',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['fantasy', 'medieval', 'knight', 'atmospheric', 'sword'],
    },
    {
        id: 'cinzel',
        family: 'Cinzel',
        category: 'serif',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['ancient', 'inscriptions', 'stone', 'monumental', 'roman'],
    },
    {
        id: 'cinzel-decorative',
        family: 'Cinzel Decorative',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['ancient', 'decorative', 'heading', 'magic'],
    },
    {
        id: 'playfair-display',
        family: 'Playfair Display',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['elegant', 'novel', 'book', 'literary'],
    },
    {
        id: 'almendra',
        family: 'Almendra',
        category: 'serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gothic', 'fairytale', 'spells', 'medieval'],
    },
    {
        id: 'almendra-display',
        family: 'Almendra Display',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gothic', 'decorative', 'heading'],
    },
    {
        id: 'caveat',
        family: 'Caveat',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['handwriting', 'letters', 'notes', 'journal'],
    },
    {
        id: 'courier-prime',
        family: 'Courier Prime',
        category: 'monospace',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['typewriter', 'reports', 'vintage_typewriter', 'records'],
    },
    {
        id: 'eb-garamond',
        family: 'EB Garamond',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['classic', 'print', 'novel', 'book'],
    },
    {
        id: 'grenze-gotisch',
        family: 'Grenze Gotisch',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gothic', 'chronicle', 'dark', 'medieval', 'german'],
    },
    {
        id: 'pirata-one',
        family: 'Pirata One',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['pirate', 'adventure', 'old_maps', 'sea'],
    },
    {
        id: 'marcellus',
        family: 'Marcellus',
        category: 'serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['roman', 'classic', 'solemn', 'elegance'],
    },
    {
        id: 'lora',
        family: 'Lora',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['literary', 'narrative', 'readable', 'book'],
    },
    {
        id: 'merriweather',
        family: 'Merriweather',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['novel', 'readable', 'book', 'long_texts'],
    },
    {
        id: 'fondamento',
        family: 'Fondamento',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['calligraphy', 'chronicle', 'script', 'scrolls'],
    },
    {
        id: 'metamorphous',
        family: 'Metamorphous',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['magic', 'fairytale', 'mystery', 'fantasy'],
    },
    {
        id: 'eagle-lake',
        family: 'Eagle Lake',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['medieval', 'script', 'parchment', 'manuscript'],
    },
    {
        id: 'uncial-antiqua',
        family: 'Uncial Antiqua',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['celtic', 'archaic', 'runes', 'druids'],
    },
    {
        id: 'jim-nightshade',
        family: 'Jim Nightshade',
        category: 'handwriting',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['dark', 'horror', 'madness', 'blood'],
    },
    {
        id: 'nosifer',
        family: 'Nosifer',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['horror', 'blood', 'nightmare', 'dripping'],
    },
    {
        id: 'creepster',
        family: 'Creepster',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['horror', 'monsters', 'ghost', 'halloween'],
    },
    {
        id: 'special-elite',
        family: 'Special Elite',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['typewriter', 'records', 'investigation', 'secret'],
    },
    {
        id: 'vt323',
        family: 'VT323',
        category: 'monospace',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['retro', 'computer', 'terminal', 'scifi', 'pixels'],
    },
    {
        id: 'syne',
        family: 'Syne',
        category: 'sans-serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['modern', 'cyberpunk', 'futuristic'],
    },
    {
        id: 'berkshire-swash',
        family: 'Berkshire Swash',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['tavern', 'fairytale', 'decorative', 'heading'],
    },
    {
        id: 'macondo',
        family: 'Macondo',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['exotic', 'shamanic', 'fairytale', 'magical'],
    },
    {
        id: 'caesar-dressing',
        family: 'Caesar Dressing',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['ancient', 'greek', 'roman', 'mythology'],
    },
    {
        id: 'mystery-quest',
        family: 'Mystery Quest',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['mystery', 'riddle', 'labyrinth', 'quest'],
    },
    {
        id: 'unifrakturmaguntia',
        family: 'UnifrakturMaguntia',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['fraktur', 'german', 'gothic'],
    },
    {
        id: 'inter',
        family: 'Inter',
        category: 'sans-serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['universal', 'readable', 'modern', 'interface'],
    },
]
