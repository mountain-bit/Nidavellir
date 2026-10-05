import { IFetchFontsResult, IFontCatalogItem } from './types'

export interface IFontDefinition {
    name: string
    category?: string
    isCustom?: boolean
    googleFont?: boolean
}

export const CURATED_FONTS: IFontDefinition[] = [
    { name: 'Cinzel', category: 'Inskrypcje / Antyk', googleFont: true },
    { name: 'MedievalSharp', category: 'Średniowieczny / Fantasy', googleFont: true },
    { name: 'Playfair Display', category: 'Elegancki / Powieść', googleFont: true },
    { name: 'Almendra', category: 'Gotyk / Baśń', googleFont: true },
    { name: 'Caveat', category: 'Odręczny / Listy', googleFont: true },
    { name: 'Courier Prime', category: 'Maszynopis / Raporty', googleFont: true },
    { name: 'EB Garamond', category: 'Klasyczny druk książkowy', googleFont: true },
]

export const OFFLINE_FONTS_CATALOG: IFontCatalogItem[] = [
    {
        id: 'medievalsharp',
        family: 'MedievalSharp',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['fantasy', 'średniowieczny', 'rycerski', 'klimatyczny', 'miecz'],
    },
    {
        id: 'cinzel',
        family: 'Cinzel',
        category: 'serif',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['antyk', 'inskrypcje', 'kamień', 'monumentalny', 'rzymski'],
    },
    {
        id: 'cinzel-decorative',
        family: 'Cinzel Decorative',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['antyk', 'ozdobny', 'nagłówek', 'magia'],
    },
    {
        id: 'playfair-display',
        family: 'Playfair Display',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['elegancki', 'powieść', 'książkowy', 'literacki'],
    },
    {
        id: 'almendra',
        family: 'Almendra',
        category: 'serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gotyk', 'baśń', 'czary', 'średniowieczny'],
    },
    {
        id: 'almendra-display',
        family: 'Almendra Display',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gotyk', 'ozdobny', 'nagłówek'],
    },
    {
        id: 'caveat',
        family: 'Caveat',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['odręczny', 'listy', 'notatki', 'dziennik'],
    },
    {
        id: 'courier-prime',
        family: 'Courier Prime',
        category: 'monospace',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['maszynopis', 'raporty', 'stara maszyna', 'akta'],
    },
    {
        id: 'eb-garamond',
        family: 'EB Garamond',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['klasyczny', 'druk', 'powieść', 'książka'],
    },
    {
        id: 'grenze-gotisch',
        family: 'Grenze Gotisch',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['gotyk', 'kronika', 'mroczny', 'średniowieczny', 'niemiecki'],
    },
    {
        id: 'pirata-one',
        family: 'Pirata One',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['piracki', 'przygoda', 'stare mapy', 'morze'],
    },
    {
        id: 'marcellus',
        family: 'Marcellus',
        category: 'serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['rzymski', 'klasyczny', 'podniosły', 'elegancja'],
    },
    {
        id: 'lora',
        family: 'Lora',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['literacki', 'narracja', 'czytelny', 'książka'],
    },
    {
        id: 'merriweather',
        family: 'Merriweather',
        category: 'serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['powieściowy', 'czytelny', 'książka', 'długie teksty'],
    },
    {
        id: 'fondamento',
        family: 'Fondamento',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['kaligrafia', 'kronika', 'skrypt', 'zwoje'],
    },
    {
        id: 'metamorphous',
        family: 'Metamorphous',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['magia', 'baśń', 'tajemnica', 'fantastyka'],
    },
    {
        id: 'eagle-lake',
        family: 'Eagle Lake',
        category: 'handwriting',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['średniowieczny', 'skrypt', 'pergamin', 'rękopis'],
    },
    {
        id: 'uncial-antiqua',
        family: 'Uncial Antiqua',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['celtycki', 'prastary', 'runy', 'druidzi'],
    },
    {
        id: 'jim-nightshade',
        family: 'Jim Nightshade',
        category: 'handwriting',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['mroczny', 'horror', 'obłęd', 'krew'],
    },
    {
        id: 'nosifer',
        family: 'Nosifer',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['horror', 'krew', 'koszmar', 'kapie'],
    },
    {
        id: 'creepster',
        family: 'Creepster',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['groza', 'potwory', 'upiór', 'halloween'],
    },
    {
        id: 'special-elite',
        family: 'Special Elite',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['maszynopis', 'akta', 'śledztwo', 'tajne'],
    },
    {
        id: 'vt323',
        family: 'VT323',
        category: 'monospace',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['retro', 'komputer', 'terminal', 'sci-fi', 'piksele'],
    },
    {
        id: 'syne',
        family: 'Syne',
        category: 'sans-serif',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['nowoczesny', 'cyberpunk', 'futurystyczny'],
    },
    {
        id: 'berkshire-swash',
        family: 'Berkshire Swash',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['karczma', 'baśń', 'ozdobny', 'nagłówek'],
    },
    {
        id: 'macondo',
        family: 'Macondo',
        category: 'display',
        subsets: ['latin', 'latin-ext'],
        supportsPolish: true,
        tags: ['egzotyczny', 'szamański', 'baśń', 'magiczny'],
    },
    {
        id: 'caesar-dressing',
        family: 'Caesar Dressing',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['antyk', 'grecki', 'rzymski', 'mitologia'],
    },
    {
        id: 'mystery-quest',
        family: 'Mystery Quest',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['tajemnica', 'zagadka', 'labirynt', 'quest'],
    },
    {
        id: 'unifrakturmaguntia',
        family: 'UnifrakturMaguntia',
        category: 'display',
        subsets: ['latin'],
        supportsPolish: false,
        tags: ['fraktura', 'stary niemiecki', 'gotyk'],
    },
    {
        id: 'inter',
        family: 'Inter',
        category: 'sans-serif',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        supportsPolish: true,
        tags: ['uniwersalny', 'czytelny', 'nowoczesny', 'interfejs'],
    },
]

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
        timeoutMs = 6000,
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

            const res = await fetch('https://api.fontsource.org/v1/fonts', fetchOptions)
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
                                [
                                    'fantasy',
                                    'gotyk',
                                    'średniowieczny',
                                    'baśń',
                                    'czary',
                                    'magia',
                                    'antyk',
                                    'piracki',
                                    'runy',
                                    'skrypt',
                                ].includes(t)
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
            link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,700;1,400;1,700&display=swap`
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
