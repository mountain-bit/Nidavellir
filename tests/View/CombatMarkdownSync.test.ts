import { describe, expect, it } from 'vitest'

import { Combat } from '../../Model/Combat'
import { Description } from '../../Model/Description'
import { Paragraph } from '../../Model/Paragraph'
import {
    generateCombatMarkdown,
    syncCombatToParagraphDescription,
} from '../../View/ui/detailsPanel/combatModule.js'

describe('CombatMarkdownSync', () => {
    it('generates markdown with opponents table and outcome links', () => {
        const paragraph = new Paragraph('p1', 'Mroczna Jaskinia')
        paragraph.setHasCombat(true)
        const combat = new Combat('c1', 'Starcie z Goblinami')
        combat.setVisibleStatIds(['stat_hp', 'stat_str'])
        combat.addCombatOpponent({
            id: 'opp_1',
            npcId: 'npc_goblin',
            name: 'Goblin Zwiadowca',
            avatar: 'warrior',
            overriddenStats: { stat_hp: '12', stat_str: '4' },
        })
        combat.addOutcome({
            id: 'out_1',
            name: 'Zwycięstwo',
            targetParagraphId: 'p2',
            description: '',
        })
        paragraph.setCombat(combat)

        const targetP = new Paragraph('p2', 'Skarbiec')
        targetP.setIsNumberLocked(true)
        targetP.setNumber(2)

        const ctx = {
            projectStats: [
                { getId: (): string => 'stat_hp', getName: (): string => 'Zdrowie' },
                { getId: (): string => 'stat_str', getName: (): string => 'Siła' },
            ],
            projectParameters: [],
            projectParagraphs: [paragraph, targetP],
        }

        const md = generateCombatMarkdown(paragraph, ctx)

        expect(md).toContain('<!-- COMBAT_START -->')
        expect(md).toContain('<!-- COMBAT_END -->')
        expect(md).toContain('### ⚔️ Starcie: Starcie z Goblinami')
        expect(md).toContain('| Przeciwnik | Zdrowie | Siła |')
        expect(md).toContain('| 👤 Goblin Zwiadowca | 12 | 4 |')
        expect(md).toContain('- **Zwycięstwo** → [§ 2 Skarbiec](entity://paragraph/p2)')
    })

    it('syncs combat markdown into paragraph description and cleans up when disabled', () => {
        const desc = new Description('# Początek\n\nOpis narracyjny.')
        const paragraph = new Paragraph('p1', 'Początek', desc)
        paragraph.setHasCombat(true)
        const combat = new Combat('c1', 'Walka')
        combat.addOutcome({
            id: 'out_win',
            name: 'Wygrana',
            targetParagraphId: 'p3',
            description: '',
        })
        paragraph.setCombat(combat)

        const targetP = new Paragraph('p3', 'Koniec')
        targetP.setIsNumberLocked(true)
        targetP.setNumber(3)

        const ctx: Record<string, unknown> = {
            files: {},
            projectStats: [],
            projectParameters: [],
            projectParagraphs: [paragraph, targetP],
            vm: {
                getActiveFile: (): string => '',
            },
        }

        syncCombatToParagraphDescription(paragraph, ctx)

        const text = desc.getText()
        expect(text).toContain('# Początek')
        expect(text).toContain('Opis narracyjny.')
        expect(text).toContain('<!-- COMBAT_START -->')
        expect(text).toContain('### ⚔️ Starcie: Walka')
        expect(text).toContain('- **Wygrana** → [§ 3 Koniec](entity://paragraph/p3)')

        // Turn combat OFF
        paragraph.setHasCombat(false)
        syncCombatToParagraphDescription(paragraph, ctx)

        const cleanedText = desc.getText()
        expect(cleanedText).toContain('# Początek')
        expect(cleanedText).toContain('Opis narracyjny.')
        expect(cleanedText).not.toContain('<!-- COMBAT_START -->')
        expect(cleanedText).not.toContain('### ⚔️ Starcie: Walka')
    })
})
