import { describe, expect, it } from 'vitest'

import { findAssetUsages, replaceAssetReferences } from '../../Utils/assets/assetUsageTracker'

describe('assetUsageTracker', () => {
    it('detects usage in hero, npc, items, scenes, and files', () => {
        const mockHero = {
            id: 'hero_1',
            name: 'Artur',
            avatar: 'Assets/Images/artur_avatar.png',
            getDescription: (): { getText: () => string } => ({
                getText: (): string => 'Bohater z mieczem',
            }),
        }

        const mockNpc = {
            id: 'npc_1',
            name: 'Gerd',
            avatar: 'Assets/Images/artur_avatar.png',
            getDescription: (): { getText: () => string } => ({
                getText: (): string => 'Kupiec w karczmie',
            }),
        }

        const mockParagraph = {
            id: 'p_1',
            title: 'Wstęp do lasu',
            content: { text: 'Widzisz obrazek ![artur](Assets/Images/artur_avatar.png)' },
        }

        const mockCtx = {
            playerCharacter: mockHero,
            projectCharacters: [mockNpc],
            projectParagraphs: [mockParagraph],
            files: {
                'Paragraphs/p1.md': 'Tekst z asset://project/Assets/Images/artur_avatar.png',
            },
        }

        const usages = findAssetUsages(mockCtx, 'Assets/Images/artur_avatar.png')
        expect(usages.length).toBe(4)
        expect(usages.some(u => u.type === 'hero' && u.name === 'Artur')).toBe(true)
        expect(usages.some(u => u.type === 'npc' && u.name === 'Gerd')).toBe(true)
        expect(usages.some(u => u.type === 'scene' && u.name === 'Wstęp do lasu')).toBe(true)
        expect(usages.some(u => u.type === 'file')).toBe(true)
    })

    it('replaces asset references across project data', () => {
        let dirtyCalled = false
        const mockHero = {
            avatar: 'Assets/Images/old.png',
            setAvatar(v: string): void {
                this.avatar = v
            },
        }
        const mockNpc = {
            avatar: 'Assets/Images/old.png',
            setAvatar(v: string): void {
                this.avatar = v
            },
        }
        const mockParagraph = {
            content: { text: 'Foto: ![img](Assets/Images/old.png)' },
        }
        const mockCtx = {
            playerCharacter: mockHero,
            projectCharacters: [mockNpc],
            projectParagraphs: [mockParagraph],
            files: {
                'doc.md': 'link to asset://project/Assets/Images/old.png',
            },
            markProjectDirty: (): void => {
                dirtyCalled = true
            },
        }

        const count = replaceAssetReferences(
            mockCtx,
            'Assets/Images/old.png',
            'Assets/Images/new_name.png'
        )

        expect(count).toBeGreaterThanOrEqual(4)
        expect(mockHero.avatar).toBe('Assets/Images/new_name.png')
        expect(mockNpc.avatar).toBe('Assets/Images/new_name.png')
        expect(mockParagraph.content.text).toContain('Assets/Images/new_name.png')
        expect(mockCtx.files['doc.md']).toContain('Assets/Images/new_name.png')
        expect(dirtyCalled).toBe(true)
    })

    it('does not corrupt or duplicate substrings when new name contains old name', () => {
        const mockParagraph = {
            id: 'p_2',
            title: 'Las',
            content: {
                text: 'Spójrz na ![art](Assets/Images/cat.png) oraz ![standalone](cat.png). Nie dotykaj słowa scatter.png ani bobcat.png ani Assets/Images/bobcat.png!',
            },
        }

        const mockItem = {
            id: 'item_1',
            name: 'Koci amulet',
            description: {
                text: 'Amulet przedstawiający cat.png w złocie.',
            },
        }

        const mockLocation = {
            id: 'loc_1',
            name: 'Kocia grota',
            description: {
                text: 'Grota z malowidłem asset://project/Assets/Images/cat.png.',
            },
        }

        const mockCtx = {
            projectParagraphs: [mockParagraph],
            projectItems: [mockItem],
            projectLocations: [mockLocation],
            markProjectDirty: (): void => {},
        }

        // Test finding usages in item & location descriptions
        const usages = findAssetUsages(mockCtx, 'Assets/Images/cat.png')
        expect(usages.length).toBe(3)
        expect(usages.some(u => u.type === 'scene')).toBe(true)
        expect(usages.some(u => u.type === 'item')).toBe(true)
        expect(usages.some(u => u.type === 'location')).toBe(true)

        // Rename cat.png -> big_cat.png (which contains "cat.png"!)
        const count = replaceAssetReferences(
            mockCtx,
            'Assets/Images/cat.png',
            'Assets/Images/big_cat.png'
        )

        expect(count).toBe(4) // 2 in paragraph, 1 in item, 1 in location
        const text = mockParagraph.content.text
        expect(text).toContain('![art](Assets/Images/big_cat.png)')
        expect(text).toContain('![standalone](big_cat.png)')
        // CRITICAL: Ensure words containing "cat.png" were NOT corrupted into "big_cat.png"
        expect(text).toContain('scatter.png')
        expect(text).toContain('bobcat.png')
        expect(text).toContain('Assets/Images/bobcat.png')
        expect(text).not.toContain('sbig_cat.png')
        expect(text).not.toContain('bobbig_cat.png')
        // CRITICAL: Ensure no double-replacement occurred (e.g. big_big_cat.png)
        expect(text).not.toContain('big_big_cat.png')

        expect(mockItem.description.text).toBe('Amulet przedstawiający big_cat.png w złocie.')
        expect(mockLocation.description.text).toBe(
            'Grota z malowidłem asset://project/Assets/Images/big_cat.png.'
        )
    })
})
