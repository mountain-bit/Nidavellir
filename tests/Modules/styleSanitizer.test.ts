import { describe, expect, it } from 'vitest'

import {
    isSafeStyleId,
    sanitizeColor,
    sanitizeCustomStyle,
    sanitizeFontFamily,
} from '../../Modules/Editor/styleSanitizer'
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
        })

        it('rejects malicious or invalid colors', () => {
            expect(sanitizeColor('red; display: none')).toBeUndefined()
            expect(sanitizeColor('javascript:alert(1)')).toBeUndefined()
            expect(sanitizeColor('url("evil.com")')).toBeUndefined()
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

        it('rejects malicious font family strings', () => {
            expect(sanitizeFontFamily('Arial"; } body { background: red; } /*')).toBeUndefined()
            expect(sanitizeFontFamily('<script>alert(1)</script>')).toBeUndefined()
            expect(sanitizeFontFamily('')).toBeUndefined()
            expect(sanitizeFontFamily(null)).toBeUndefined()
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
    })
})
