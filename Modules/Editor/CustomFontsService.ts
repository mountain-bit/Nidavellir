import {
    DEFAULT_FONT_FETCH_TIMEOUT_MS,
    FANTASY_CATEGORY_TAGS,
    FONTSOURCE_API_URL,
    GOOGLE_FONTS_BASE_URL,
} from './constants'
import { CURATED_FONTS, IFontDefinition, OFFLINE_FONTS_CATALOG } from './fontCatalog'
import { IFetchFontsResult, IFontCatalogItem } from './types'

export { CURATED_FONTS, IFontDefinition, OFFLINE_FONTS_CATALOG }

export interface IProjectFontsData {
    customFonts?: Array<string | IFontDefinition>
}

export class CustomFontsService {
    private static loadedFonts = new Set<string>()
    private static cachedCatalog: IFontCatalogItem[] | null = null

    public static clearCache(): void {
        this.cachedCatalog = null
    }

    public static getOfflineCatalog(): IFontCatalogItem[] {
        return [...OFFLINE_FONTS_CATALOG]
    }

    public static async fetchOnlineFonts(
        timeoutMs = DEFAULT_FONT_FETCH_TIMEOUT_MS,
        forceReload = false
    ): Promise<IFetchFontsResult> {
        if (forceReload) {
            this.cachedCatalog = null
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

        try {
            let controller: AbortController | null = null
            let timer: ReturnType<typeof setTimeout> | null = null

            if (typeof AbortController !== 'undefined') {
                controller = new AbortController()
                timer = setTimeout(() => controller?.abort(), timeoutMs)
            }

            const fetchOptions: RequestInit = {}
            if (controller) {
                fetchOptions.signal = controller.signal
            }

            const res = await fetch(FONTSOURCE_API_URL, fetchOptions)
            if (timer) clearTimeout(timer)

            if (!res.ok) {
                throw new Error(`Błąd serwera czcionek (HTTP ${res.status})`)
            }

            interface IFontsourceRawItem {
                id?: string
                family?: string
                category?: string
                subsets?: string[]
            }

            const data = await res.json()
            if (Array.isArray(data)) {
                // Enrich items
                const offlineMap = new Map<string, IFontCatalogItem>()
                OFFLINE_FONTS_CATALOG.forEach(f => offlineMap.set(f.family.toLowerCase(), f))

                this.cachedCatalog = (data as IFontsourceRawItem[]).map(item => {
                    const subsets = Array.isArray(item.subsets) ? item.subsets : []
                    const family = item.family || item.id || ''
                    const offlineMatch = offlineMap.get(family.toLowerCase())
                    return {
                        id: item.id || family.toLowerCase().replace(/\s+/g, '-'),
                        family,
                        category: item.category || offlineMatch?.category || 'sans-serif',
                        subsets,
                        supportsPolish: subsets.includes('latin-ext'),
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
        }
    }

    public static filterFonts(
        catalog: IFontCatalogItem[],
        query: string,
        category = 'all',
        onlyPolish = false
    ): IFontCatalogItem[] {
        const q = (query || '').trim().toLowerCase()
        const cat = (category || 'all').toLowerCase()

        return catalog.filter(font => {
            if (onlyPolish && !font.supportsPolish) {
                return false
            }

            if (cat !== 'all') {
                if (cat === 'fantasy') {
                    const isFantasy =
                        font.category === 'display' ||
                        (font.tags &&
                            font.tags.some(t =>
                                (FANTASY_CATEGORY_TAGS as readonly string[]).includes(t)
                            ))
                    if (!isFantasy) return false
                } else if (font.category.toLowerCase() !== cat) {
                    return false
                }
            }

            if (q) {
                const nameMatch = font.family.toLowerCase().includes(q)
                const categoryMatch = font.category.toLowerCase().includes(q)
                const tagMatch = font.tags && font.tags.some(t => t.toLowerCase().includes(q))
                return Boolean(nameMatch || categoryMatch || tagMatch)
            }

            return true
        })
    }

    public static loadFont(fontName: string): void {
        if (typeof document === 'undefined' || !fontName) return
        const normalized = fontName.trim()
        if (
            normalized === 'sans' ||
            normalized === 'serif' ||
            normalized === 'mono' ||
            normalized.toLowerCase() === 'inherit'
        ) {
            return
        }

        if (this.loadedFonts.has(normalized)) return
        this.loadedFonts.add(normalized)

        const linkId = `gfont-${normalized.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        if (document.getElementById(linkId)) return

        try {
            const link = document.createElement('link')
            link.id = linkId
            link.rel = 'stylesheet'
            const encoded = encodeURIComponent(normalized).replace(/%20/g, '+')
            link.href = `${GOOGLE_FONTS_BASE_URL}?family=${encoded}:ital,wght@0,400;0,700;1,400;1,700&display=swap`
            document.head.appendChild(link)
        } catch {
            // Ignore in environments without DOM
        }
    }

    public static getFonts(projectData?: IProjectFontsData | null): IFontDefinition[] {
        const customFonts = projectData?.customFonts || []
        const custom: IFontDefinition[] = customFonts.map(f =>
            typeof f === 'string'
                ? { name: f, isCustom: true, googleFont: true, category: 'Własne' }
                : { ...f, isCustom: true, googleFont: true, category: 'Własne' }
        )
        return [...CURATED_FONTS, ...custom]
    }

    public static addFont(
        projectData: IProjectFontsData | null | undefined,
        fontName: string
    ): IFontDefinition {
        const cleanName = fontName.trim()
        if (!cleanName) {
            throw new Error('Nazwa czcionki nie może być pusta')
        }

        if (projectData) {
            if (!Array.isArray(projectData.customFonts)) {
                projectData.customFonts = []
            }
            const exists = projectData.customFonts.some(
                f => (typeof f === 'string' ? f : f.name).toLowerCase() === cleanName.toLowerCase()
            )
            if (!exists) {
                projectData.customFonts.push({
                    name: cleanName,
                    isCustom: true,
                    googleFont: true,
                    category: 'Własne',
                })
            }
        }

        this.loadFont(cleanName)
        return { name: cleanName, isCustom: true, googleFont: true, category: 'Własne' }
    }

    public static deleteFont(
        projectData: IProjectFontsData | null | undefined,
        fontName: string
    ): void {
        if (!projectData || !Array.isArray(projectData.customFonts)) return
        projectData.customFonts = projectData.customFonts.filter(f => {
            const name = typeof f === 'string' ? f : f.name
            return name.toLowerCase() !== fontName.trim().toLowerCase()
        })
    }

    public static loadAllFonts(projectData?: IProjectFontsData | null): void {
        const fonts = this.getFonts(projectData)
        fonts.forEach(f => {
            if (f.googleFont) {
                this.loadFont(f.name)
            }
        })
    }
}
