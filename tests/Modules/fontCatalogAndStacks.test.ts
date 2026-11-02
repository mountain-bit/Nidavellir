import { afterEach, describe, expect, it } from 'vitest'

import {
    CustomFontsService,
    getCustomFontCategory,
} from '../../Modules/Editor/fonts/CustomFontsService'
import {
    CURATED_FONTS,
    fontSupportsLanguage,
    getCanonicalFontTag,
    getCuratedFontCategory,
    getFontSupportedLanguages,
    getLocalizedFontTag,
    LANGUAGE_CHARSET_RULES,
    OFFLINE_FONTS_CATALOG,
    TAG_CANONICAL_MAP,
} from '../../Modules/Editor/fonts/fontCatalog'
import {
    FONT_STACK_MONO,
    FONT_STACK_SANS,
    FONT_STACK_SERIF,
    getFontFamilyCss,
} from '../../Modules/Editor/fonts/fontStacks'
import { availableLanguages, setLanguage } from '../../Utils/i18n/translate'

describe('fontStacks', () => {
    it('returns inherit when family is empty or inherit', () => {
        expect(getFontFamilyCss()).toBe('inherit')
        expect(getFontFamilyCss('')).toBe('inherit')
        expect(getFontFamilyCss('inherit')).toBe('inherit')
    })

    it('returns system sans stack for sans or sans-serif', () => {
        expect(getFontFamilyCss('sans')).toBe(FONT_STACK_SANS)
        expect(getFontFamilyCss('sans-serif')).toBe(FONT_STACK_SANS)
    })

    it('returns system serif stack for serif', () => {
        expect(getFontFamilyCss('serif')).toBe(FONT_STACK_SERIF)
        expect(getFontFamilyCss('  SERIF  ')).toBe(FONT_STACK_SERIF)
    })

    it('returns system monospace stack for mono or monospace', () => {
        expect(getFontFamilyCss('mono')).toBe(FONT_STACK_MONO)
        expect(getFontFamilyCss('monospace')).toBe(FONT_STACK_MONO)
    })

    it('wraps custom font family in quotes with serif fallback', () => {
        expect(getFontFamilyCss('Cinzel Decorative')).toBe('"Cinzel Decorative", ui-serif, serif')
    })
})

describe('fontCatalog', () => {
    afterEach(async () => {
        await setLanguage('pl')
    })

    it('exports curated fonts list with names and categories', () => {
        expect(CURATED_FONTS.length).toBeGreaterThanOrEqual(7)
        expect(CURATED_FONTS.some(f => f.name === 'Cinzel')).toBe(true)
        expect(CURATED_FONTS.some(f => f.name === 'MedievalSharp')).toBe(true)
        expect(CURATED_FONTS.every(f => Boolean(f.name))).toBe(true)
    })

    it('contains comprehensive offline catalog with valid categories and subsets', () => {
        expect(OFFLINE_FONTS_CATALOG.length).toBeGreaterThanOrEqual(25)
        OFFLINE_FONTS_CATALOG.forEach(item => {
            expect(item.id).toBeDefined()
            expect(item.family).toBeDefined()
            expect(['display', 'serif', 'sans-serif', 'handwriting', 'monospace']).toContain(
                item.category
            )
            expect(typeof item.supportsPolish).toBe('boolean')
        })
    })

    it('accurately tags fonts supporting Polish diacritics', () => {
        const polishFonts = OFFLINE_FONTS_CATALOG.filter(f => f.supportsPolish)
        expect(polishFonts.length).toBeGreaterThan(15)
        expect(polishFonts.some(f => f.family === 'MedievalSharp')).toBe(true)
        expect(polishFonts.some(f => f.family === 'Lora')).toBe(true)
    })

    it('defines charset rules strictly for supported languages in the project', () => {
        availableLanguages.forEach(lang => {
            const rule = LANGUAGE_CHARSET_RULES[lang]
            expect(rule).toBeDefined()
            expect(rule.code).toBe(lang)
            expect(rule.testChars.length).toBeGreaterThan(0)
            expect(rule.requiredSubsets.length).toBeGreaterThan(0)
        })
        expect(Object.keys(LANGUAGE_CHARSET_RULES).sort()).toEqual([...availableLanguages].sort())
    })

    it('checks font support for Polish correctly', () => {
        const medieval = OFFLINE_FONTS_CATALOG.find(f => f.id === 'medievalsharp')
        const cinzel = OFFLINE_FONTS_CATALOG.find(f => f.id === 'cinzel')
        const unifraktur = OFFLINE_FONTS_CATALOG.find(f => f.id === 'unifrakturmaguntia')

        expect(medieval).toBeDefined()
        expect(cinzel).toBeDefined()
        expect(unifraktur).toBeDefined()

        expect(fontSupportsLanguage(medieval!, 'pl')).toBe(true)
        expect(fontSupportsLanguage(cinzel!, 'pl')).toBe(false)
        expect(fontSupportsLanguage(unifraktur!, 'pl')).toBe(false)
    })

    it('checks font support for German correctly including Fraktur fonts', () => {
        const medieval = OFFLINE_FONTS_CATALOG.find(f => f.id === 'medievalsharp')
        const unifraktur = OFFLINE_FONTS_CATALOG.find(f => f.id === 'unifrakturmaguntia')
        const cinzel = OFFLINE_FONTS_CATALOG.find(f => f.id === 'cinzel')
        const creepster = OFFLINE_FONTS_CATALOG.find(f => f.id === 'creepster')

        expect(fontSupportsLanguage(medieval!, 'de')).toBe(true)
        expect(fontSupportsLanguage(unifraktur!, 'de')).toBe(true)
        expect(fontSupportsLanguage(cinzel!, 'de')).toBe(false)
        expect(fontSupportsLanguage(creepster!, 'de')).toBe(false)
    })

    it('returns true when language code is empty or all', () => {
        const cinzel = OFFLINE_FONTS_CATALOG.find(f => f.id === 'cinzel')
        expect(fontSupportsLanguage(cinzel!, '')).toBe(true)
        expect(fontSupportsLanguage(cinzel!, 'all')).toBe(true)
        expect(fontSupportsLanguage(cinzel!, undefined)).toBe(true)
    })

    it('returns only project-supported languages via getFontSupportedLanguages', () => {
        const medieval = OFFLINE_FONTS_CATALOG.find(f => f.id === 'medievalsharp')
        const cinzel = OFFLINE_FONTS_CATALOG.find(f => f.id === 'cinzel')
        const unifraktur = OFFLINE_FONTS_CATALOG.find(f => f.id === 'unifrakturmaguntia')

        const medievalLangs = getFontSupportedLanguages(medieval!)
        expect(medievalLangs).toContain('pl')
        expect(medievalLangs).toContain('de')
        expect(medievalLangs).toContain('en')
        expect(medievalLangs.every(l => availableLanguages.includes(l))).toBe(true)

        const unifrakturLangs = getFontSupportedLanguages(unifraktur!)
        expect(unifrakturLangs).toContain('de')
        expect(unifrakturLangs).toContain('en')
        expect(unifrakturLangs).not.toContain('pl')

        const cinzelLangs = getFontSupportedLanguages(cinzel!)
        expect(cinzelLangs).toContain('en')
        expect(cinzelLangs).not.toContain('pl')
        expect(cinzelLangs).not.toContain('de')
    })

    it('dynamically translates curated font categories based on active language', async () => {
        const cinzel = CURATED_FONTS.find(f => f.name === 'Cinzel')
        expect(cinzel).toBeDefined()

        await setLanguage('pl')
        expect(cinzel!.category).toBe('Inskrypcje / Antyk')
        expect(getCuratedFontCategory('cinzel')).toBe('Inskrypcje / Antyk')

        await setLanguage('en')
        expect(cinzel!.category).toBe('Inscriptions / Antique')
        expect(getCuratedFontCategory('cinzel')).toBe('Inscriptions / Antique')

        await setLanguage('de')
        expect(cinzel!.category).toBe('Inschriften / Antik')
        expect(getCuratedFontCategory('cinzel')).toBe('Inschriften / Antik')
    })

    it('supports language-based filtering in CustomFontsService', () => {
        const catalog = CustomFontsService.getOfflineCatalog()

        const polishOnly = CustomFontsService.filterFonts(catalog, '', 'all', 'pl')
        expect(polishOnly.every(f => fontSupportsLanguage(f, 'pl'))).toBe(true)
        expect(polishOnly.some(f => f.family === 'MedievalSharp')).toBe(true)
        expect(polishOnly.some(f => f.family === 'Cinzel')).toBe(false)

        const germanOnly = CustomFontsService.filterFonts(catalog, '', 'all', 'de')
        expect(germanOnly.every(f => fontSupportsLanguage(f, 'de'))).toBe(true)
        expect(germanOnly.some(f => f.family === 'UnifrakturMaguntia')).toBe(true)
        expect(germanOnly.some(f => f.family === 'Cinzel')).toBe(false)

        const booleanCompat = CustomFontsService.filterFonts(catalog, '', 'all', true)
        expect(booleanCompat.map(f => f.id)).toEqual(polishOnly.map(f => f.id))
    })

    it('maps legacy Polish and German font tags to canonical English tags', () => {
        expect(getCanonicalFontTag('gotyk')).toBe('gothic')
        expect(getCanonicalFontTag('średniowieczny')).toBe('medieval')
        expect(getCanonicalFontTag('ritter')).toBe('knight')
        expect(getCanonicalFontTag('Gothic')).toBe('gothic')
        expect(TAG_CANONICAL_MAP.miecz).toBe('sword')
        expect(TAG_CANONICAL_MAP.schwert).toBe('sword')
    })

    it('dynamically translates font tags based on active language', async () => {
        await setLanguage('pl')
        expect(getLocalizedFontTag('gothic')).toBe('gotyk')
        expect(getLocalizedFontTag('medieval')).toBe('średniowieczny')
        expect(getLocalizedFontTag('gotyk')).toBe('gotyk')

        await setLanguage('en')
        expect(getLocalizedFontTag('gothic')).toBe('gothic')
        expect(getLocalizedFontTag('medieval')).toBe('medieval')
        expect(getLocalizedFontTag('gotyk')).toBe('gothic')

        await setLanguage('de')
        expect(getLocalizedFontTag('gothic')).toBe('Gotik')
        expect(getLocalizedFontTag('medieval')).toBe('mittelalterlich')
        expect(getLocalizedFontTag('gotyk')).toBe('Gotik')
    })

    it('dynamically translates custom font category based on active language', async () => {
        await setLanguage('pl')
        expect(getCustomFontCategory()).toBe('Własne')

        const fontsPl = CustomFontsService.getFonts({ customFonts: ['MyFont'] })
        const customPl = fontsPl.find(f => f.name === 'MyFont')
        expect(customPl?.category).toBe('Własne')

        await setLanguage('en')
        expect(getCustomFontCategory()).toBe('Custom')
        expect(customPl?.category).toBe('Custom')

        await setLanguage('de')
        expect(getCustomFontCategory()).toBe('Eigene')
        expect(customPl?.category).toBe('Eigene')
    })

    it('filters fonts by tag seamlessly across all languages', async () => {
        const catalog = CustomFontsService.getOfflineCatalog()

        // Polish tag query
        await setLanguage('pl')
        const plResults = CustomFontsService.filterFonts(catalog, 'gotyk')
        expect(plResults.some(f => f.family === 'Almendra')).toBe(true)

        // English canonical tag query
        await setLanguage('en')
        const enResults = CustomFontsService.filterFonts(catalog, 'gothic')
        expect(enResults.some(f => f.family === 'Almendra')).toBe(true)

        // German tag query
        await setLanguage('de')
        const deResults = CustomFontsService.filterFonts(catalog, 'gotik')
        expect(deResults.some(f => f.family === 'Almendra')).toBe(true)
    })
})
