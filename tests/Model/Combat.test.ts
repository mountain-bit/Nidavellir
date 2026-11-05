import { describe, expect, it } from 'vitest'

import { Combat, CombatOpponent, CombatOutcome } from '../../Model/Combat'
import { Paragraph } from '../../Model/Paragraph'

describe('Combat Model', () => {
    it('initializes with default values', () => {
        const combat = new Combat('c1', 'Zasadzka')
        expect(combat.getId()).toBe('c1')
        expect(combat.getName()).toBe('Zasadzka')
        expect(combat.getCombatOpponents()).toEqual([])
        expect(combat.getOutcomes()).toEqual([])
        expect(combat.getVisibleStatIds()).toEqual([])
        expect(combat.hasId()).toBe(true)

        combat.setId('c1_changed')
        expect(combat.getId()).toBe('c1_changed')
        combat.setName('Nowa Walka')
        expect(combat.getName()).toBe('Nowa Walka')

        const emptyCombat = new Combat()
        expect(emptyCombat.hasId()).toBe(false)
    })

    it('manages visibleStatIds correctly', () => {
        const combat = new Combat('c1')
        combat.setVisibleStatIds(['hp', 'attack'])
        expect(combat.getVisibleStatIds()).toEqual(['hp', 'attack'])

        combat.toggleVisibleStatId('defense')
        expect(combat.getVisibleStatIds()).toEqual(['hp', 'attack', 'defense'])

        combat.toggleVisibleStatId('attack')
        expect(combat.getVisibleStatIds()).toEqual(['hp', 'defense'])
    })

    it('manages combat opponents and stat overrides', () => {
        const combat = new Combat('c1')
        const opp: CombatOpponent = {
            id: 'opp_1',
            npcId: 'npc_goblin',
            name: 'Ranny Goblin',
            avatar: 'warrior',
            overriddenStats: { hp: 5 },
        }

        combat.addCombatOpponent(opp)
        expect(combat.getCombatOpponents().length).toBe(1)
        expect(combat.getCombatOpponents()[0].name).toBe('Ranny Goblin')
        expect(combat.getCombatOpponents()[0].overriddenStats).toEqual({ hp: 5 })

        combat.updateCombatOpponent('opp_1', {
            name: 'Wyleczony Goblin',
            overriddenStats: { hp: 12, mana: 3 },
        })
        expect(combat.getCombatOpponents()[0].name).toBe('Wyleczony Goblin')
        expect(combat.getCombatOpponents()[0].overriddenStats).toEqual({ hp: 12, mana: 3 })

        combat.removeCombatOpponent('opp_1')
        expect(combat.getCombatOpponents().length).toBe(0)
    })

    it('manages custom dynamic combat outcomes', () => {
        const combat = new Combat('c1')
        const outcome1: CombatOutcome = {
            id: 'out_1',
            name: 'Zwycięstwo',
            targetParagraphId: 'p_victory',
        }
        const outcome2: CombatOutcome = {
            id: 'out_2',
            name: 'Ucieczka przez okno',
            targetParagraphId: 'p_escape',
        }

        combat.addOutcome(outcome1)
        combat.addOutcome(outcome2)
        expect(combat.getOutcomes().length).toBe(2)

        combat.updateOutcome('out_2', { name: 'Brawurowa ucieczka' })
        expect(combat.getOutcomes().find(o => o.id === 'out_2')?.name).toBe('Brawurowa ucieczka')

        combat.removeOutcome('out_1')
        expect(combat.getOutcomes().length).toBe(1)
        expect(combat.getOutcomes()[0].id).toBe('out_2')
    })

    it('serializes toJSON and deserializes fromJSON correctly preserving all data', () => {
        const combat = new Combat('c_test', 'Starcie w lochu')
        combat.setVisibleStatIds(['stat_hp', 'param_morale'])

        const opp: CombatOpponent = {
            id: 'opp_ork',
            npcId: 'npc_1',
            name: 'Wódz Orków',
            avatar: 'berserker',
            overriddenStats: { stat_hp: 45 },
        }
        combat.addCombatOpponent(opp)

        const outcome: CombatOutcome = {
            id: 'out_win',
            name: 'Pokonanie wodza',
            targetParagraphId: 'p_loot',
            description: 'Wódz padł, skrzynia jest twoja.',
        }
        combat.addOutcome(outcome)

        const json = combat.toJSON()
        expect(json.id).toBe('c_test')
        expect(json.name).toBe('Starcie w lochu')
        expect(json.visibleStatIds).toEqual(['stat_hp', 'param_morale'])
        expect(json.combatOpponents.length).toBe(1)
        expect(json.combatOpponents[0].name).toBe('Wódz Orków')
        expect(json.outcomes.length).toBe(1)
        expect(json.outcomes[0].name).toBe('Pokonanie wodza')

        const restored = Combat.fromJSON(json)
        expect(restored.getId()).toBe('c_test')
        expect(restored.getName()).toBe('Starcie w lochu')
        expect(restored.getVisibleStatIds()).toEqual(['stat_hp', 'param_morale'])
        expect(restored.getCombatOpponents().length).toBe(1)
        expect(restored.getCombatOpponents()[0].overriddenStats).toEqual({ stat_hp: 45 })
        expect(restored.getOutcomes().length).toBe(1)
        expect(restored.getOutcomes()[0].targetParagraphId).toBe('p_loot')
    })

    it('integrates seamlessly with Paragraph serialization', () => {
        const paragraph = new Paragraph('p_combat_node', 'Sala Tronowa')
        paragraph.setHasCombat(true)

        const combat = paragraph.getCombat()
        combat.setName('Walka z Królem')
        combat.addCombatOpponent({
            id: 'opp_king',
            npcId: 'npc_king',
            name: 'Król Cieni',
            avatar: 'mage',
            overriddenStats: { hp: 100 },
        })
        combat.addOutcome({
            id: 'out_victory',
            name: 'Koronacja bohatera',
            targetParagraphId: 'p_end',
        })

        const pJson = paragraph.toJSON()
        expect(pJson.hasCombat).toBe(true)
        expect(pJson.combat).toBeDefined()

        const restoredP = Paragraph.fromJSON(pJson)
        expect(restoredP.getHasCombat()).toBe(true)
        const restoredCombat = restoredP.getCombat()
        expect(restoredCombat.getCombatOpponents().length).toBe(1)
        expect(restoredCombat.getCombatOpponents()[0].name).toBe('Król Cieni')
        expect(restoredCombat.getOutcomes().length).toBe(1)
        expect(restoredCombat.getOutcomes()[0].name).toBe('Koronacja bohatera')
    })

    it('handles legacy opponents and descriptions', () => {
        const combat = new Combat('c_legacy')
        const npc1 = { id: 'npc_1', name: 'Bandyta' } as any
        const npc2 = { id: 'npc_2', name: 'Złodziej' } as any

        combat.addOpponent(npc1)
        combat.addOpponent(npc2)
        expect(combat.getOpponents()).toHaveLength(2)

        combat.removeOpponent(npc1)
        expect(combat.getOpponents()).toHaveLength(1)
        expect(combat.getOpponents()[0]).toBe(npc2)

        combat.setOpponents([npc1])
        expect(combat.getOpponents()).toEqual([npc1])

        const descV = { text: 'Wygrana' } as any
        const descD = { text: 'Przegrana' } as any
        const descDraw = { text: 'Remis' } as any

        combat.setVictoryDescription(descV)
        combat.setDefeatDescription(descD)
        combat.setDrawDescription(descDraw)

        expect(combat.getVictoryDescription()).toBe(descV)
        expect(combat.getDefeatDescription()).toBe(descD)
        expect(combat.getDrawDescription()).toBe(descDraw)
    })

    it('handles edge cases in fromJSON including null inputs and null overriddenStats', () => {
        const nullCombat = Combat.fromJSON(null)
        expect(nullCombat).toBeInstanceOf(Combat)
        expect(nullCombat.getId()).toBe('')

        const parsedWithNullOverrides = Combat.fromJSON({
            id: 'c_null_overrides',
            combatOpponents: [
                {
                    id: 'opp_null_stats',
                    name: 'Potwór',
                    overriddenStats: null,
                },
            ],
            outcomes: [
                { id: 'out_1', name: 'Wygrana', targetParagraphId: 'p1' },
                { id: 'out_1', name: 'Duplikat ID', targetParagraphId: 'p2' },
                { id: '', name: 'Ten sam cel', targetParagraphId: 'p3' },
                { id: '', name: 'Ten sam cel', targetParagraphId: 'p3' },
            ],
        })

        expect(parsedWithNullOverrides.getCombatOpponents()[0].overriddenStats).toEqual({})
        // Dedup outcomes
        expect(parsedWithNullOverrides.getOutcomes()).toHaveLength(2)
    })
})
