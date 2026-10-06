import { describe, expect, it } from 'vitest'

import { CURATED_FONTS, OFFLINE_FONTS_CATALOG } from '../../Modules/Editor/fontCatalog'
import {
    FONT_STACK_MONO,
    FONT_STACK_SANS,
    FONT_STACK_SERIF,
    getFontFamilyCss,
} from '../../Modules/Editor/fontStacks'

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
})
