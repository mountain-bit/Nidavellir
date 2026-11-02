import { describe, expect, it } from 'vitest'

import {
    isSafeStyleId,
    sanitizeColor,
    sanitizeCustomStyle,
    sanitizeCustomStyles,
    sanitizeFontFamily,
    sanitizeStyleName,
} from '../../Modules/Editor/styles/styleSanitizer'
import { ICustomTextStyle } from '../../Modules/Editor/types'

describe('styleSanitizer', () => {
    describe('isSafeStyleId', () => {
        it('accepts safe alphanumeric ids with hyphens and underscores', () => {
            expect(isSafeStyleId('style-1')).toBe(true)
            expect(isSafeStyleId('custom_whisper_42')).toBe(true)
            expect(isSafeStyleId('HeadingStyle')).toBe(true)
        })

        it('rejects empty, invalid, or injected ids', () => {
            expect(isSafeStyleId('')).toBe(false)
            expect(isSafeStyleId(null)).toBe(false)
            expect(isSafeStyleId(undefined)).toBe(false)
            expect(isSafeStyleId('style; background: red')).toBe(false)
            expect(isSafeStyleId('style<script>')).toBe(false)
            expect(isSafeStyleId('style.class')).toBe(false)
            expect(isSafeStyleId('a'.repeat(65))).toBe(false)
        })
    })

    describe('sanitizeColor', () => {
        it('accepts valid 3, 4, 6, 8 hex color strings', () => {
            expect(sanitizeColor('#fff')).toBe('#fff')
            expect(sanitizeColor('#1a2b3c')).toBe('#1a2b3c')
            expect(sanitizeColor('#1a2b3cff')).toBe('#1a2b3cff')
            expect(sanitizeColor('  #3b82f6  ')).toBe('#3b82f6')
        })

        it('accepts valid rgb and rgba color strings', () => {
            expect(sanitizeColor('rgb(255, 0, 128)')).toBe('rgb(255, 0, 128)')
            expect(sanitizeColor('rgba(59, 130, 246, 0.5)')).toBe('rgba(59, 130, 246, 0.5)')
            expect(sanitizeColor('rgba(0, 0, 0, 1)')).toBe('rgba(0, 0, 0, 1)')
            expect(sanitizeColor('rgb(255 0 128 / 0.5)')).toBe('rgb(255 0 128 / 0.5)')
        })

        it('accepts valid hsl and hsla color strings', () => {
            expect(sanitizeColor('hsl(210, 50%, 40%)')).toBe('hsl(210, 50%, 40%)')
            expect(sanitizeColor('hsla(210, 50%, 40%, 0.8)')).toBe('hsla(210, 50%, 40%, 0.8)')
            expect(sanitizeColor('hsl(180deg, 60%, 50%)')).toBe('hsl(180deg, 60%, 50%)')
            expect(sanitizeColor('hsl(200 40% 60% / 80%)')).toBe('hsl(200 40% 60% / 80%)')
        })

        it('accepts transparent keyword', () => {
            expect(sanitizeColor('transparent')).toBe('transparent')
            expect(sanitizeColor('  TRANSPARENT  ')).toBe('transparent')
        })

        it('rejects malicious or invalid colors', () => {
            expect(sanitizeColor('red; display: none')).toBeUndefined()
            expect(sanitizeColor('javascript:alert(1)')).toBeUndefined()
            expect(sanitizeColor('url("evil.com")')).toBeUndefined()
            expect(sanitizeColor('hsl(0, 0%, 0%); background: red')).toBeUndefined()
            expect(sanitizeColor('#xyz')).toBeUndefined()
            expect(sanitizeColor(12345)).toBeUndefined()
            expect(sanitizeColor(null)).toBeUndefined()
        })
    })

    describe('sanitizeFontFamily', () => {
        it('accepts safe font family names with letters, digits, spaces, and hyphens', () => {
            expect(sanitizeFontFamily('Cinzel Decorative')).toBe('Cinzel Decorative')
            expect(sanitizeFontFamily('IM Fell English')).toBe('IM Fell English')
            expect(sanitizeFontFamily('sans-serif')).toBe('sans-serif')
            expect(sanitizeFontFamily('Zażółć Gęślą')).toBe('Zażółć Gęślą')
        })

        it('strips surrounding quotes and apostrophes safely', () => {
            expect(sanitizeFontFamily("'Cinzel Decorative'")).toBe('Cinzel Decorative')
            expect(sanitizeFontFamily('"MedievalSharp"')).toBe('MedievalSharp')
            expect(sanitizeFontFamily("  'Cinzel'  ")).toBe('Cinzel')
        })

        it('rejects malicious font family strings', () => {
            expect(sanitizeFontFamily('Arial"; } body { background: red; } /*')).toBeUndefined()
            expect(sanitizeFontFamily('<script>alert(1)</script>')).toBeUndefined()
            expect(sanitizeFontFamily('Arial" bold')).toBeUndefined()
            expect(sanitizeFontFamily('')).toBeUndefined()
            expect(sanitizeFontFamily(null)).toBeUndefined()
        })
    })

    describe('sanitizeStyleName', () => {
        it('cleans whitespace and strips control characters', () => {
            expect(sanitizeStyleName('  Zwykły styl  ')).toBe('Zwykły styl')
            expect(sanitizeStyleName('Styl\u0000 z ukrytymi\u001f znakami')).toBe(
                'Styl z ukrytymi znakami'
            )
        })

        it('limits length to 100 characters', () => {
            const longName = 'A'.repeat(150)
            expect(sanitizeStyleName(longName).length).toBe(100)
        })

        it('handles non-string inputs safely', () => {
            expect(sanitizeStyleName(null)).toBe('')
            expect(sanitizeStyleName(undefined)).toBe('')
            expect(sanitizeStyleName(123)).toBe('')
        })
    })

    describe('sanitizeCustomStyle', () => {
        it('returns null if style has an unsafe id', () => {
            const badStyle = { id: 'bad; injection', name: 'Bad' } as ICustomTextStyle
            expect(sanitizeCustomStyle(badStyle)).toBeNull()
        })

        it('strips invalid colors and fonts while preserving valid properties', () => {
            const mixedStyle: ICustomTextStyle = {
                id: 'safe_style',
                name: 'Safe Name',
                color: '#ef4444',
                backgroundColor: 'invalid; color()',
                fontFamily: 'bad"font',
                bold: true,
                italic: false,
            }

            const clean = sanitizeCustomStyle(mixedStyle)
            expect(clean).not.toBeNull()
            expect(clean?.id).toBe('safe_style')
            expect(clean?.color).toBe('#ef4444')
            expect(clean?.backgroundColor).toBeUndefined()
            expect(clean?.fontFamily).toBeUndefined()
            expect(clean?.bold).toBe(true)
            expect(clean?.italic).toBe(false)
        })

        it('strictly allowlists properties and ignores unknown injected keys', () => {
            const injectedStyle = {
                id: 'style_custom',
                name: 'Styl z dodatkami',
                color: '#10b981',
                extraProperty: 'should_not_leak',
                __evil: true,
            } as unknown as ICustomTextStyle

            const clean = sanitizeCustomStyle(injectedStyle)
            expect(clean).not.toBeNull()
            expect((clean as unknown as Record<string, unknown>).extraProperty).toBeUndefined()
            expect((clean as unknown as Record<string, unknown>).__evil).toBeUndefined()
        })

        it('validates docxStyleName', () => {
            const styleWithDocx: ICustomTextStyle = {
                id: 'style_hint',
                name: 'Wskazówka',
                docxStyleName: 'Style_Hint',
            }
            expect(sanitizeCustomStyle(styleWithDocx)?.docxStyleName).toBe('Style_Hint')

            const styleWithBadDocx: ICustomTextStyle = {
                id: 'style_hint',
                name: 'Wskazówka',
                docxStyleName: 'bad; injection',
            }
            expect(sanitizeCustomStyle(styleWithBadDocx)?.docxStyleName).toBeUndefined()
        })
    })

    describe('sanitizeCustomStyles', () => {
        it('filters and sanitizes an array of styles, omitting invalid ones', () => {
            const styles = [
                { id: 'style_1', name: 'Styl 1', color: '#ff0000' },
                { id: 'bad; style', name: 'Zły styl' },
                null,
                { id: 'style_2', name: 'Styl 2', backgroundColor: 'transparent' },
            ]

            const sanitized = sanitizeCustomStyles(styles)
            expect(sanitized.length).toBe(2)
            expect(sanitized[0].id).toBe('style_1')
            expect(sanitized[1].id).toBe('style_2')
            expect(sanitized[1].backgroundColor).toBe('transparent')
        })

        it('returns empty array when input is not an array', () => {
            expect(sanitizeCustomStyles(null)).toEqual([])
            expect(sanitizeCustomStyles(undefined)).toEqual([])
            expect(sanitizeCustomStyles('invalid')).toEqual([])
        })
    })
})
