import { describe, expect, it } from 'vitest'

import { Combat } from '../../Model/Combat'
import { Paragraph } from '../../Model/Paragraph'
import { CombatMarkdownService } from '../../Services/CombatMarkdownService'

describe('CombatMarkdownService', () => {
    it('generates combat markdown correctly with opponents table and outcomes', () => {
        const paragraph = new Paragraph('p1', 'Krypta Szkieletów')
        const combat = new Combat('c1', 'Starcie w krypcie')
        combat.setVisibleStatIds(['stat_hp', 'stat_str'])
        combat.addCombatOpponent({
            id: 'opp_1',
            npcId: 'npc_skel',
            name: 'Szkielet Wojownik',
            avatar: 'warrior',
            overriddenStats: { stat_hp: '20', stat_str: '6' },
        })
        combat.addOutcome({
            id: 'out_1',
            name: 'Zwycięstwo',
            targetParagraphId: 'p2',
            description: '',
        })
        paragraph.setCombat(combat)

        const targetP = new Paragraph('p2', 'Korytarz')
        targetP.setIsNumberLocked(true)
        targetP.setNumber(15)

        const ctx = {
            projectStats: [
                { getId: (): string => 'stat_hp', getName: (): string => 'Punkty Życia' },
                { getId: (): string => 'stat_str', getName: (): string => 'Siła' },
            ],
            projectParameters: [],
            projectParagraphs: [paragraph, targetP],
        }

        const md = CombatMarkdownService.generateMarkdown(paragraph, ctx)

        expect(md).toContain(CombatMarkdownService.COMBAT_START_TAG)
        expect(md).toContain(CombatMarkdownService.COMBAT_END_TAG)
        expect(md).toContain('### Starcie: Starcie w krypcie')
        expect(md).toContain('| Przeciwnik | Punkty Życia | Siła |')
        expect(md).toContain('| Szkielet Wojownik | 20 | 6 |')
        expect(md).toContain('- **Zwycięstwo** → [§ 15 Korytarz](entity://paragraph/p2)')
    })

    it('injects, updates, and removes combat markdown block in description content', () => {
        const initialText = '# Rozdział 1\n\nStoisz przed wejściem.'
        const combatMd = '<!-- COMBAT_START -->\n### ⚔️ Starcie\n<!-- COMBAT_END -->'

        // 1. Inject
        const injected = CombatMarkdownService.updateContentWithCombat(initialText, combatMd, true)
        expect(injected).toContain('# Rozdział 1')
        expect(injected).toContain('<!-- COMBAT_START -->')
        expect(injected).toContain('### ⚔️ Starcie')

        // 2. Update existing block
        const updatedCombatMd =
            '<!-- COMBAT_START -->\n### ⚔️ Zaktualizowane Starcie\n<!-- COMBAT_END -->'
        const replaced = CombatMarkdownService.updateContentWithCombat(
            injected,
            updatedCombatMd,
            true
        )
        expect(replaced).toContain('### ⚔️ Zaktualizowane Starcie')
        expect(replaced).not.toContain('### ⚔️ Starcie\n')

        // 3. Remove when combat disabled
        const removed = CombatMarkdownService.updateContentWithCombat(replaced, '', false)
        expect(removed).toContain('# Rozdział 1')
        expect(removed).toContain('Stoisz przed wejściem.')
        expect(removed).not.toContain('<!-- COMBAT_START -->')
        expect(removed).not.toContain('<!-- COMBAT_END -->')
    })

    it('removes combat block with flexible whitespace and TipTap markers {{combat:start}}', () => {
        const textWithEditorMarkers =
            '# Opis\n\nPrzygoda trwa.\n\n{{combat:start}}\n### ⚔️ Starcie: Bandyci\n- Wynik\n{{combat:end}}\n'
        const cleaned = CombatMarkdownService.updateContentWithCombat(
            textWithEditorMarkers,
            '',
            false
        )
        expect(cleaned).toContain('# Opis')
        expect(cleaned).toContain('Przygoda trwa.')
        expect(cleaned).not.toContain('{{combat:start}}')
        expect(cleaned).not.toContain('Bandyci')
    })

    it('removes legacy combat block even if comment tags were stripped', () => {
        const textWithoutComments =
            '# Jaskinia\n\nCiemno i głucho.\n\n---\n### ⚔️ Starcie: Smok\n| Przeciwnik | HP |\n| Smok | 100 |\n#### Możliwe wyniki starcia:\n- Wygrana → § 2\n'
        const cleaned = CombatMarkdownService.updateContentWithCombat(
            textWithoutComments,
            '',
            false
        )
        expect(cleaned).toContain('# Jaskinia')
        expect(cleaned).toContain('Ciemno i głucho.')
        expect(cleaned).not.toContain('### ⚔️ Starcie: Smok')
        expect(cleaned).not.toContain('#### Możliwe wyniki starcia:')
    })

    it('does not accumulate blank lines when updating combat repeatedly', () => {
        const initialText = '# Wstęp\n\nOpis lokacji.'
        const combatMd = '<!-- COMBAT_START -->\n---\n### Starcie: Wilki\n<!-- COMBAT_END -->'

        let current = CombatMarkdownService.updateContentWithCombat(initialText, combatMd, true)
        const initialLines = current.split('\n').length

        // Run 10 consecutive updates on the text
        for (let i = 0; i < 10; i++) {
            current = CombatMarkdownService.updateContentWithCombat(
                current,
                `<!-- COMBAT_START -->\n---\n### Starcie: Wilki (edycja ${i})\n<!-- COMBAT_END -->`,
                true
            )
        }

        const finalLines = current.split('\n').length
        expect(finalLines).toBe(initialLines)
        expect(current).not.toMatch(/\n{3,}/)
    })

    it('deduplicates traits by id and name in extractTraits', () => {
        const ctx = {
            projectStats: [
                { getId: () => 'stat_1', getName: () => 'Siła' },
                { getId: () => 'stat_1', getName: () => 'Siła' }, // duplicate id & name
                { getId: () => 'stat_2', getName: () => 'siła' }, // duplicate name (case-insensitive)
            ],
            projectParameters: [
                { getId: () => 'stat_1', getName: () => 'Siła' }, // duplicate id with stat
                { getId: () => 'param_1', getName: () => 'Mana' },
                { getId: () => 'param_1_1', getName: () => 'Mana' }, // duplicate name from disk duplicate
            ],
        }

        const traits = CombatMarkdownService.extractTraits(ctx)
        expect(traits).toHaveLength(2)
        expect(traits[0].name).toBe('Siła')
        expect(traits[1].name).toBe('Mana')
    })
})
