import { describe, expect, it } from 'vitest'

import { getIconSvg, ICON_REGISTRY, IconName } from '../../Utils/icons'

describe('SVG Icon System (Utils/icons.ts)', () => {
    it('should have all key icon definitions registered', () => {
        const requiredIcons: IconName[] = [
            'paragraph',
            'scene',
            'choice',
            'character',
            'location',
            'trait',
            'tag',
            'item',
            'class',
            'check',
            'close',
            'markdown',
            'graph',
            'save',
            'new-file',
            'open',
            'plus',
            'trash',
            'edit',
        ]

        for (const icon of requiredIcons) {
            expect(ICON_REGISTRY[icon]).toBeDefined()
            expect(ICON_REGISTRY[icon].path).toContain('<')
        }
    })

    it('should render valid SVG markup with provided classes', () => {
        const svg = getIconSvg('save', 'w-5 h-5 text-blue-500')
        expect(svg).toContain('<svg class="w-5 h-5 text-blue-500"')
        expect(svg).toContain('viewBox="0 0 24 24"')
        expect(svg).toContain('</svg>')
    })

    it('should fallback to paragraph icon when unknown icon name is requested', () => {
        const fallbackSvg = getIconSvg('unknown-icon-test' as unknown as IconName, 'w-4 h-4')
        const paragraphSvg = getIconSvg('paragraph', 'w-4 h-4')
        expect(fallbackSvg).toBe(paragraphSvg)
    })
})
