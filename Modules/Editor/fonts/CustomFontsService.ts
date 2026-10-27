import { t } from '../../../Utils/translate'
import { IFetchFontsResult, IFontCatalogItem } from '../types'
import {
    DEFAULT_FONT_FETCH_TIMEOUT_MS,
    FANTASY_CATEGORY_TAGS,
    FONTSOURCE_API_URL,
    GOOGLE_FONTS_BASE_URL,
} from './constants'
import {
    CURATED_FONTS,
    fontSupportsLanguage,
    getCanonicalFontTag,
    getFontSupportedLanguages,
    getLocalizedFontTag,
    IFontDefinition,
    OFFLINE_FONTS_CATALOG,
    TAG_CANONICAL_MAP,
} from './fontCatalog'

export {
    CURATED_FONTS,
    fontSupportsLanguage,
    getCanonicalFontTag,
    getFontSupportedLanguages,
    getLocalizedFontTag,
    IFontDefinition,
    OFFLINE_FONTS_CATALOG,
    TAG_CANONICAL_MAP,
}

/**
 * Zwraca zlokalizowaną nazwę kategorii dla własnych czcionek użytkownika w bieżącym języku.
 */
export function getCustomFontCategory(): string {
    try {
        const val = t('editor.styles.font_custom_category')
        if (val && val !== 'editor.styles.font_custom_category') {
            return val
        }
    } catch {
        // Fallback w środowiskach bez i18n
    }
    return 'Własne'
}

/**
 * Struktura danych projektu przechowująca konfigurację własnych czcionek użytkownika.
 */
export interface IProjectFontsData {
    customFonts?: Array<string | IFontDefinition>
}

interface IFontsourceRawItem {
    id?: string
    family?: string
    category?: string
    subsets?: string[]
}

/**
 * Serwis zarządzania czcionkami w edytorze tekstu.
 * Obsługuje pobieranie katalogu z Fontsource API, tryb offline, dynamiczne doładowywanie Google Fonts oraz
 * synchronizację krojów z modelem projektu.
 */
export class CustomFontsService {
    private static loadedFonts = new Set<string>()
    private static cachedCatalog: IFontCatalogItem[] | null = null

    /**
     * Czyści zapamiętany w pamięci podręcznej internetowy katalog czcionek.
     */
    public static clearCache(): void {
        this.cachedCatalog = null
    }

    /**
     * Czyści zbiór załadowanych czcionek w bieżącej sesji (przydatne m.in. w testach).
     */
    public static clearLoadedFonts(): void {
        this.loadedFonts.clear()
    }

    /**
     * Zwraca zlokalizowaną nazwę tagu czcionki na podstawie bieżącego języka.
     */
    public static getLocalizedTag(tag: string): string {
        return getLocalizedFontTag(tag)
    }

    /**
     * Zwraca kopię wbudowanego katalogu czcionek offline.
     */
    public static getOfflineCatalog(): IFontCatalogItem[] {
        return [...OFFLINE_FONTS_CATALOG]
    }

    /**
     * Pobiera pełny katalog czcionek z zewnętrznego API (Fontsource) z obsługą timeoutu,
     * cache'owania oraz bezpiecznym przełączeniem na katalog offline w przypadku błędu.
     */
    public static async fetchOnlineFonts(
        timeoutMs = DEFAULT_FONT_FETCH_TIMEOUT_MS,
        forceReload = false
    ): Promise<IFetchFontsResult> {
        if (forceReload) {
            this.clearCache()
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return {
                fonts: this.getOfflineCatalog(),
                isOnline: false,
                error: 'Brak aktywnego połączenia z internetem.',
            }
        }

        if (this.cachedCatalog && this.cachedCatalog.length > 0) {
            return {
                fonts: this.cachedCatalog,
                isOnline: true,
            }
        }

        let controller: AbortController | null = null
        let timer: ReturnType<typeof setTimeout> | null = null

        try {
            if (typeof AbortController !== 'undefined') {
                controller = new AbortController()
                timer = setTimeout(() => controller?.abort(), timeoutMs)
            }

            const fetchOptions: RequestInit = {}
            if (controller) {
                fetchOptions.signal = controller.signal
            }

            const res = await fetch(FONTSOURCE_API_URL, fetchOptions)

            if (!res.ok) {
                throw new Error(`Błąd serwera czcionek (HTTP ${res.status})`)
            }

            const data = await res.json()
            if (Array.isArray(data)) {
                const offlineMap = new Map<string, IFontCatalogItem>()
                OFFLINE_FONTS_CATALOG.forEach(f => offlineMap.set(f.family.toLowerCase(), f))

                this.cachedCatalog = (data as IFontsourceRawItem[])
                    .filter((item): item is IFontsourceRawItem =>
                        Boolean(item && typeof item === 'object')
                    )
                    .map(item => {
                        const subsets = Array.isArray(item.subsets) ? item.subsets : []
                        const family = item.family || item.id || ''
                        const offlineMatch = offlineMap.get(family.toLowerCase())
                        return {
                            id: item.id || family.toLowerCase().replace(/\s+/g, '-'),
                            family,
                            category: item.category || offlineMatch?.category || 'sans-serif',
                            subsets,
                            supportsPolish: subsets.includes('latin-ext'),
                            supportedLanguages: getFontSupportedLanguages({
                                id: item.id,
                                family,
                                subsets,
                            }),
                            tags: offlineMatch?.tags || [],
                        }
                    })

                return {
                    fonts: this.cachedCatalog,
                    isOnline: true,
                }
            }

            throw new Error('Nieprawidłowy format danych z katalogu czcionek')
        } catch (err: unknown) {
            const error = err as Error | undefined
            const isAbort = error?.name === 'AbortError'
            const errorMsg = isAbort
                ? 'Przekroczono czas oczekiwania na połączenie z katalogiem czcionek (timeout).'
                : `Nie udało się pobrać internetowego katalogu czcionek${error?.message ? `: ${error.message}` : ''}.`

            return {
                fonts: this.getOfflineCatalog(),
                isOnline: false,
                error: errorMsg,
            }
        } finally {
            if (timer) {
                clearTimeout(timer)
            }
        }
    }

    /**
     * Filtruje katalog czcionek według wyszukiwanej frazy, kategorii oraz obsługi wskazanego języka (np. 'pl', 'de', 'en', 'cyrillic').
     * Dla kompatybilności wstecznej parametr languageFilter akceptuje również boolean (true = tylko z polskimi znakami).
     */
    public static filterFonts(
        catalog: IFontCatalogItem[],
        query: string,
        category = 'all',
        languageFilter: boolean | string = false
    ): IFontCatalogItem[] {
        const q = (query || '').trim().toLowerCase()
        const cat = (category || 'all').toLowerCase()

        return catalog.filter(font => {
            if (languageFilter === true) {
                if (!fontSupportsLanguage(font, 'pl')) {
                    return false
                }
            } else if (
                typeof languageFilter === 'string' &&
                languageFilter !== '' &&
                languageFilter.toLowerCase() !== 'all'
            ) {
                if (!fontSupportsLanguage(font, languageFilter)) {
                    return false
                }
            }

            if (cat !== 'all') {
                if (cat === 'fantasy') {
                    const isFantasy =
                        font.category === 'display' ||
                        (font.tags &&
                            font.tags.some(t => {
                                const canonical = getCanonicalFontTag(t)
                                return (
                                    (FANTASY_CATEGORY_TAGS as readonly string[]).includes(
                                        t.toLowerCase()
                                    ) ||
                                    (FANTASY_CATEGORY_TAGS as readonly string[]).includes(canonical)
                                )
                            }))
                    if (!isFantasy) return false
                } else if (font.category.toLowerCase() !== cat) {
                    return false
                }
            }

            if (q) {
                const nameMatch = font.family.toLowerCase().includes(q)
                const categoryMatch = font.category.toLowerCase().includes(q)
                const tagMatch =
                    Boolean(font.tags) &&
                    font.tags!.some(t => {
                        const raw = t.toLowerCase()
                        if (raw.includes(q)) return true
                        const canonical = getCanonicalFontTag(t)
                        if (canonical.includes(q)) return true
                        const localized = getLocalizedFontTag(t).toLowerCase()
                        if (localized.includes(q)) return true
                        const queryCanonical = getCanonicalFontTag(q)
                        if (queryCanonical && queryCanonical === canonical) return true
                        return false
                    })
                return Boolean(nameMatch || categoryMatch || tagMatch)
            }

            return true
        })
    }

    /**
     * Dynamicznie wstrzykuje arkusz stylów Google Fonts do nagłówka dokumentu HTML (<head>),
     * zapobiegając duplikacji znaczników link.
     */
    public static loadFont(fontName: string): void {
        if (typeof document === 'undefined' || !fontName) return
        const normalized = fontName.replace(/^['"]+|['"]+$/g, '').trim()
        if (
            !normalized ||
            normalized === 'sans' ||
            normalized === 'serif' ||
            normalized === 'mono' ||
            normalized.toLowerCase() === 'inherit'
        ) {
            return
        }

        if (this.loadedFonts.has(normalized)) return

        const linkId = `gfont-${normalized.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        if (document.getElementById(linkId)) {
            this.loadedFonts.add(normalized)
            return
        }

        try {
            const link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            const encoded = encodeURIComponent(normalized).replace(/%20/g, '+')
            link.href = `${GOOGLE_FONTS_BASE_URL}?family=${encoded}:ital,wght@0,400;0,700;1,400;1,700&display=swap`
            document.head.appendChild(link)
            this.loadedFonts.add(normalized)
        } catch {
            // Ignorujemy błędy w środowiskach bez pełnego DOM
        }
    }

    /**
     * Zwraca połączoną listę wyselekcjonowanych czcionek podstawowych oraz krojów zdefiniowanych w projekcie.
     */
    public static getFonts(projectData?: IProjectFontsData | null): IFontDefinition[] {
        const customFonts = projectData?.customFonts || []
        const custom: IFontDefinition[] = customFonts
            .filter((f): f is string | IFontDefinition => Boolean(f))
            .map(f => {
                if (typeof f === 'string') {
                    const cleanName = f.replace(/^['"]+|['"]+$/g, '').trim()
                    return {
                        name: cleanName,
                        isCustom: true,
                        googleFont: true,
                        categoryKey: 'editor.styles.font_custom_category',
                        get category(): string {
                            return getCustomFontCategory()
                        },
                    }
                }
                const fObj = f as IFontDefinition
                const cleanName = (fObj.name || '').replace(/^['"]+|['"]+$/g, '').trim()
                return {
                    ...fObj,
                    name: cleanName,
                    isCustom: true,
                    googleFont: true,
                    categoryKey: 'editor.styles.font_custom_category',
                    get category(): string {
                        return getCustomFontCategory()
                    },
                }
            })
        return [...CURATED_FONTS, ...custom]
    }

    /**
     * Dodaje nową czcionkę do projektu (jeśli jeszcze nie istnieje), wstępnie ją ładuje i zwraca jej definicję.
     */
    public static addFont(
        projectData: IProjectFontsData | null | undefined,
        fontName: string
    ): IFontDefinition {
        const cleanName = (fontName || '').replace(/^['"]+|['"]+$/g, '').trim()
        if (!cleanName) {
            throw new Error('Nazwa czcionki nie może być pusta')
        }

        const definition: IFontDefinition = {
            name: cleanName,
            isCustom: true,
            googleFont: true,
            categoryKey: 'editor.styles.font_custom_category',
            get category(): string {
                return getCustomFontCategory()
            },
        }

        if (projectData) {
            if (!Array.isArray(projectData.customFonts)) {
                projectData.customFonts = []
            }
            const exists = projectData.customFonts.some(f => {
                const name = typeof f === 'string' ? f : f?.name || ''
                return name.toLowerCase() === cleanName.toLowerCase()
            })
            if (!exists) {
                projectData.customFonts.push(definition)
            }
        }

        this.loadFont(cleanName)
        return definition
    }

    /**
     * Usuwa wskazaną czcionkę z konfiguracji projektu.
     */
    public static deleteFont(
        projectData: IProjectFontsData | null | undefined,
        fontName: string
    ): void {
        if (!projectData || !Array.isArray(projectData.customFonts)) return
        const cleanTarget = (fontName || '')
            .replace(/^['"]+|['"]+$/g, '')
            .trim()
            .toLowerCase()
        projectData.customFonts = projectData.customFonts.filter(f => {
            const name = typeof f === 'string' ? f : f?.name || ''
            return name.toLowerCase() !== cleanTarget
        })
    }

    /**
     * Wstępnie ładuje do drzewa DOM wszystkie czcionki Google zdefiniowane w projekcie i podstawowym katalogu.
     */
    public static loadAllFonts(projectData?: IProjectFontsData | null): void {
        const fonts = this.getFonts(projectData)
        fonts.forEach(f => {
            if (f.googleFont) {
                this.loadFont(f.name)
            }
        })
    }
}
