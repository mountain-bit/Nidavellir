import { describe, expect, it } from 'vitest'

import { Combat } from '../../Model/Combat'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Stat } from '../../Model/Stat'
import { CombatSyncService } from '../../Services/CombatSyncService'

describe('CombatSyncService', () => {
    it('resolves NPC trait values from various entity structures', () => {
        const npc = new NPC('npc1', 'Bandyta')
        const statHp = new Stat('hp', 'Zdrowie')
        statHp.setValue('25')
        npc.addStat(statHp)

        expect(CombatSyncService.resolveNpcTraitValue(npc, 'hp')).toBe('25')
        expect(CombatSyncService.resolveNpcTraitValue(npc, 'other_id', { name: 'Zdrowie' })).toBe(
            '25'
        )
        expect(CombatSyncService.resolveNpcTraitValue(npc, 'non_existent')).toBe('')

        // Plain object fallback
        const plainNpc = {
            stats: [{ id: 'mana', value: 40 }],
            parameters: [{ name: 'morale', value: 'high' }],
        }
        expect(CombatSyncService.resolveNpcTraitValue(plainNpc, 'mana')).toBe(40)
        expect(CombatSyncService.resolveNpcTraitValue(plainNpc, 'morale')).toBe('high')
    })

    it('creates, updates and removes choices associated with combat outcomes', () => {
        const p1 = new Paragraph('p1', 'Sala Tronowa')
        const pTarget = new Paragraph('p2', 'Korytarz Ucieczki')

        // 1. Create outcome choice
        const choiceId = CombatSyncService.createOutcomeChoice(
            p1,
            pTarget,
            'out_escape',
            'Ucieczka',
            'p2'
        )
        expect(choiceId).toBe('out_escape')
        expect(p1.getChoices().length).toBe(1)
        expect(p1.getChoices()[0].getName()).toBe('Ucieczka')
        expect(p1.getChoices()[0].getToParagraphId()).toBe('p2')

        // 2. Update name
        CombatSyncService.updateOutcomeChoiceName(p1, 'out_escape', 'Brawurowy odwrót')
        expect(p1.getChoices()[0].getName()).toBe('Brawurowy odwrót')

        // 3. Remove single choice
        CombatSyncService.removeOutcomeChoice(p1, 'out_escape')
        expect(p1.getChoices().length).toBe(0)
    })

    it('cleans up all combat choices when combat is disabled', () => {
        const p = new Paragraph('p1', 'Arena')
        const combat = new Combat('c1')
        combat.addOutcome({ id: 'out_1', name: 'Wygrana', targetParagraphId: 'p2' })
        combat.addOutcome({ id: 'out_2', name: 'Przegrana', targetParagraphId: 'p3' })

        CombatSyncService.createOutcomeChoice(p, undefined, 'out_1', 'Wygrana', 'p2')
        CombatSyncService.createOutcomeChoice(p, undefined, 'out_2', 'Przegrana', 'p3')
        expect(p.getChoices().length).toBe(2)

        CombatSyncService.cleanupCombatChoices(p, combat)
        expect(p.getChoices().length).toBe(0)
    })
})
