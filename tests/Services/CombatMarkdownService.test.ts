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
        expect(md).toContain('### ⚔️ Starcie: Starcie w krypcie')
        expect(md).toContain('| Przeciwnik | Punkty Życia | Siła |')
        expect(md).toContain('| 👤 Szkielet Wojownik | 20 | 6 |')
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
})
