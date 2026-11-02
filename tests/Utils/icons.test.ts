import { describe, expect, it } from 'vitest'

import { getIconSvg, ICON_REGISTRY, IconName } from '../../Utils/ui/icons'

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

    it('should share identical SVG paths for semantic icon aliases', () => {
        expect(ICON_REGISTRY.swords.path).toBe(ICON_REGISTRY.combat.path)
        expect(ICON_REGISTRY.choice.path).toBe(ICON_REGISTRY.connection.path)
        expect(ICON_REGISTRY.trait.path).toBe(ICON_REGISTRY.stat.path)
        expect(ICON_REGISTRY.item.path).toBe(ICON_REGISTRY.backpack.path)
        expect(ICON_REGISTRY.export.path).toBe(ICON_REGISTRY.upload.path)
        expect(ICON_REGISTRY['arrow-right'].path).toBe(ICON_REGISTRY['chevron-right'].path)
        expect(ICON_REGISTRY['arrow-down'].path).toBe(ICON_REGISTRY['chevron-down'].path)
    })

    it('should render valid SVG markup with provided classes and extra attributes', () => {
        const svg = getIconSvg('save', 'w-5 h-5 text-blue-500', 'aria-hidden="true"')
        expect(svg).toContain('<svg class="w-5 h-5 text-blue-500"')
        expect(svg).toContain('viewBox="0 0 24 24"')
        expect(svg).toContain('aria-hidden="true"')
        expect(svg).toContain('</svg>')
    })

    it('should fallback to paragraph icon when unknown icon name is requested', () => {
        const fallbackSvg = getIconSvg('unknown-icon-test' as unknown as IconName, 'w-4 h-4')
        const paragraphSvg = getIconSvg('paragraph', 'w-4 h-4')
        expect(fallbackSvg).toBe(paragraphSvg)
    })
})
