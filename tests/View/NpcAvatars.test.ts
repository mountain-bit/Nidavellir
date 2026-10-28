// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import {
    FANTASY_AVATARS,
    getAvatarById,
    getAvatarName,
    isCustomAvatarPath,
} from '../../View/ui/common/npcAvatars.js'

describe('NpcAvatars', () => {
    it('provides an immutable frozen list of fantasy avatars', () => {
        expect(Object.isFrozen(FANTASY_AVATARS)).toBe(true)
        expect(FANTASY_AVATARS.length).toBeGreaterThanOrEqual(10)
        expect(Object.isFrozen(FANTASY_AVATARS[0])).toBe(true)
    })

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

    it('escapes special characters in custom avatar image src to prevent HTML injection', () => {
        const maliciousPath = 'Assets/Images/photo"onload="alert(1).png'
        const avatar = getAvatarById(maliciousPath)
        expect(avatar.svg).toContain('&quot;')
        expect(avatar.svg).not.toContain('photo"onload')
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

    describe('getAvatarName', () => {
        it('returns empty string when avatar is null or undefined', () => {
            expect(getAvatarName(null as unknown as { id: string })).toBe('')
            expect(getAvatarName(undefined as unknown as { id: string })).toBe('')
        })

        it('returns translated name or id for preset avatar', () => {
            const warrior = FANTASY_AVATARS[0]
            const name = getAvatarName(warrior)
            expect(typeof name).toBe('string')
            expect(name.length).toBeGreaterThan(0)
        })

        it('falls back to avatar.id when nameKey is absent', () => {
            expect(getAvatarName({ id: 'custom_orc' })).toBe('custom_orc')
        })
    })
})
