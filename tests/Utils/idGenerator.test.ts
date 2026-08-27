import { describe, expect, it } from 'vitest'

import { defaultIdGenerator, generateId } from '../../Utils/idGenerator'

describe('ID Generator Utility', () => {
    it('generuje identyfikator z domyślnym formatem i timestampem', () => {
        const id = defaultIdGenerator()
        expect(id).toMatch(/^\d+_[a-z0-9]+$/)
    })

    it('dołącza podany prefiks do generowanego identyfikatora', () => {
        const idNpc = defaultIdGenerator('npc')
        expect(idNpc).toMatch(/^npc_\d+_[a-z0-9]+$/)

        const idParagraf = defaultIdGenerator('paragraf')
        expect(idParagraf).toMatch(/^paragraf_\d+_[a-z0-9]+$/)

        const idLokacja = defaultIdGenerator('lokacja')
        expect(idLokacja).toMatch(/^lokacja_\d+_[a-z0-9]+$/)
    })

    it('generateId jest aliasem do defaultIdGenerator', () => {
        const id = generateId('tag')
        expect(id).toMatch(/^tag_\d+_[a-z0-9]+$/)
    })

    it('generuje unikalne identyfikatory przy kolejnych wywołaniach', () => {
        const ids = new Set<string>()
        for (let i = 0; i < 100; i++) {
            ids.add(defaultIdGenerator('test'))
        }
        expect(ids.size).toBe(100)
    })
})
