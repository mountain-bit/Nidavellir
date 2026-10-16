// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import { getAvatarById, isCustomAvatarPath } from '../../View/ui/common/npcAvatars.js'

describe('NpcAvatars', () => {
    it('returns preset fantasy avatar by id', () => {
        const warrior = getAvatarById('warrior')
        expect(warrior.id).toBe('warrior')
        expect(warrior.svg).toContain('<svg')
        expect(warrior.isCustom).toBeUndefined()
    })

    it('returns custom avatar representation when given a relative image path', () => {
        const customPath = 'Assets/Images/npc_custom_123.png'
        const avatar = getAvatarById(customPath)

        expect(avatar.id).toBe(customPath)
        expect(avatar.isCustom).toBe(true)
        expect(avatar.category).toBe('custom')
        expect(avatar.svg).toContain('<img')
        expect(avatar.svg).toContain('asset://project/Assets/Images/npc_custom_123.png')
    })

    it('falls back to warrior preset for non-custom unknown identifier', () => {
        const fallback = getAvatarById('unknown_class')
        expect(fallback.id).toBe('warrior')
    })

    it('correctly identifies custom avatar paths', () => {
        expect(isCustomAvatarPath('Assets/Images/portret.jpg')).toBe(true)
        expect(isCustomAvatarPath('warrior')).toBe(false)
        expect(isCustomAvatarPath('mage')).toBe(false)
    })
})
