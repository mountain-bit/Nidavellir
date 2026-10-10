import { describe, expect, it } from 'vitest'

import { findAssetUsages, replaceAssetReferences } from '../../Utils/assetUsageTracker'

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
})
