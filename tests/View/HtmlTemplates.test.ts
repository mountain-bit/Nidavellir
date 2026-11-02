// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import {
    escapeHtml,
    getTypeBadgeColor,
    getTypeIconSvg,
    PRESET_COLORS,
    renderColorPresetButtonsHtml,
    renderEmptyPlaceholderHtml,
} from '../../View/ui/common/htmlTemplates.js'

describe('htmlTemplates', () => {
    describe('escapeHtml', () => {
        it('returns empty string for null and undefined', () => {
            expect(escapeHtml(null)).toBe('')
            expect(escapeHtml(undefined)).toBe('')
        })

        it('converts numbers to string without escaping', () => {
            expect(escapeHtml(12345)).toBe('12345')
            expect(escapeHtml(0)).toBe('0')
        })

        it('escapes &, <, >, ", and single quotes', () => {
            expect(escapeHtml('&')).toBe('&amp;')
            expect(escapeHtml('<')).toBe('&lt;')
            expect(escapeHtml('>')).toBe('&gt;')
            expect(escapeHtml('"')).toBe('&quot;')
            expect(escapeHtml("'")).toBe('&#039;')
        })

        it('neutralizes malicious XSS payload', () => {
            const raw = '<script>alert("attack & steal")</script>'
            const escaped = escapeHtml(raw)
            expect(escaped).toBe(
                '&lt;script&gt;alert(&quot;attack &amp; steal&quot;)&lt;/script&gt;'
            )
            expect(escaped).not.toContain('<script>')
        })
    })

    describe('getTypeIconSvg', () => {
        it('returns an SVG string for supported entity types', () => {
            const svg = getTypeIconSvg('character')
            expect(typeof svg).toBe('string')
            expect(svg).toContain('<svg')
        })

        it('applies custom extra classes', () => {
            const svg = getTypeIconSvg('scene', 'custom-class-123')
            expect(svg).toContain('custom-class-123')
        })
    })

    describe('PRESET_COLORS', () => {
        it('is an immutable frozen array with 12 hex colors', () => {
            expect(Object.isFrozen(PRESET_COLORS)).toBe(true)
            expect(PRESET_COLORS).toHaveLength(12)
            for (const color of PRESET_COLORS) {
                expect(color).toMatch(/^#[0-9a-f]{6}$/i)
            }
        })
    })

    describe('getTypeBadgeColor', () => {
        it('returns correct Tailwind classes for major node and entity types', () => {
            expect(getTypeBadgeColor('start')).toContain('bg-emerald-950')
            expect(getTypeBadgeColor('start_node')).toContain('bg-emerald-950')
            expect(getTypeBadgeColor('paragraph')).toContain('bg-emerald-900')
            expect(getTypeBadgeColor('scene')).toContain('bg-blue-900')
            expect(getTypeBadgeColor('character')).toContain('bg-purple-900')
            expect(getTypeBadgeColor('player_character')).toContain('bg-amber-900')
            expect(getTypeBadgeColor('playerCharacter')).toContain('bg-amber-900')
            expect(getTypeBadgeColor('main-character')).toContain('bg-amber-900')
            expect(getTypeBadgeColor('item')).toContain('bg-yellow-900')
            expect(getTypeBadgeColor('choice')).toContain('bg-teal-900')
            expect(getTypeBadgeColor('connection')).toContain('bg-teal-900')
            expect(getTypeBadgeColor('tag')).toContain('bg-pink-900')
            expect(getTypeBadgeColor('parameter')).toContain('bg-rose-950')
            expect(getTypeBadgeColor('skill')).toContain('bg-blue-950')
            expect(getTypeBadgeColor('trait')).toContain('bg-amber-950')
            expect(getTypeBadgeColor('stat')).toContain('bg-amber-950')
            expect(getTypeBadgeColor('template')).toContain('bg-purple-950')
            expect(getTypeBadgeColor('location')).toContain('bg-amber-900')
        })

        it('is case-insensitive', () => {
            expect(getTypeBadgeColor('SCENE')).toBe(getTypeBadgeColor('scene'))
            expect(getTypeBadgeColor('Paragraph')).toBe(getTypeBadgeColor('paragraph'))
            expect(getTypeBadgeColor('PlayerCharacter')).toBe(getTypeBadgeColor('player_character'))
        })

        it('falls back to zinc badge for unknown types or empty input', () => {
            const fallback = 'bg-zinc-800 text-zinc-300 border-zinc-700'
            expect(getTypeBadgeColor('unknown_type_xyz')).toBe(fallback)
            expect(getTypeBadgeColor('')).toBe(fallback)
            expect(getTypeBadgeColor(null as unknown as string)).toBe(fallback)
            expect(getTypeBadgeColor(undefined as unknown as string)).toBe(fallback)
        })
    })

    describe('renderEmptyPlaceholderHtml', () => {
        it('renders icon and message with HTML escaping', () => {
            const html = renderEmptyPlaceholderHtml('ℹ', 'No "items" <found>')
            expect(html).toContain('ℹ')
            expect(html).toContain('No &quot;items&quot; &lt;found&gt;')
            expect(html).toContain('flex flex-col items-center justify-center')
        })

        it('handles omitted parameters gracefully', () => {
            const html = renderEmptyPlaceholderHtml()
            expect(typeof html).toBe('string')
            expect(html).toContain('h-64')
        })
    })

    describe('renderColorPresetButtonsHtml', () => {
        it('renders buttons for specified colors', () => {
            const colors = ['#112233', '#445566']
            const html = renderColorPresetButtonsHtml(colors, '#112233')

            expect(html).toContain('details-color-preset-btn')
            expect(html).toContain('data-color="#112233"')
            expect(html).toContain('data-color="#445566"')
            // Selected color has highlight ring
            expect(html).toContain('ring-2 ring-white/50')
        })

        it('matches current color case-insensitively', () => {
            const colors = ['#AABBCC', '#DDEEFF']
            const html = renderColorPresetButtonsHtml(colors, '#aabbcc')
            expect(html).toContain('ring-2 ring-white/50')
        })

        it('defaults to PRESET_COLORS when presetColors is omitted or invalid', () => {
            const html = renderColorPresetButtonsHtml()
            expect(html).toContain(PRESET_COLORS[0])
            expect(html).toContain(PRESET_COLORS[PRESET_COLORS.length - 1])

            const fallbackHtml = renderColorPresetButtonsHtml(null as unknown as string[])
            expect(fallbackHtml).toContain(PRESET_COLORS[0])
        })
    })
})
