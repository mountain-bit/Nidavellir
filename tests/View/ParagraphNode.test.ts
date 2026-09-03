// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import { getContrastTextColor } from '../../Modules/Graph/ParagraphNode'

describe('getContrastTextColor utility', () => {
    it('should return dark text for light background colors', () => {
        expect(getContrastTextColor('#ffffff')).toBe('#18181b')
        expect(getContrastTextColor('#facc15')).toBe('#18181b') // bright yellow
        expect(getContrastTextColor('#e2e8f0')).toBe('#18181b') // light slate
        expect(getContrastTextColor('#a7f3d0')).toBe('#18181b') // light emerald
        expect(getContrastTextColor('#fff')).toBe('#18181b') // 3-digit hex
    })

    it('should return light text for dark background colors', () => {
        expect(getContrastTextColor('#18181b')).toBe('#ffffff') // dark background
        expect(getContrastTextColor('#000000')).toBe('#ffffff') // black
        expect(getContrastTextColor('#1e3a8a')).toBe('#ffffff') // dark blue
        expect(getContrastTextColor('#581c87')).toBe('#ffffff') // dark purple
        expect(getContrastTextColor('#7f1d1d')).toBe('#ffffff') // dark red
    })

    it('should handle invalid or missing colors gracefully', () => {
        expect(getContrastTextColor('')).toBe('#ffffff')
        expect(getContrastTextColor(null as unknown as string)).toBe('#ffffff')
        expect(getContrastTextColor('invalid')).toBe('#ffffff')
    })
})
