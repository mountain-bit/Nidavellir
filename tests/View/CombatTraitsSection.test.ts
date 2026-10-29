// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Combat } from '../../Model/Combat.js'
import { Description } from '../../Model/Description.js'
import { NPC } from '../../Model/NPC.js'
import { Parameter } from '../../Model/Parameter.js'
import {
    renderCombatTraitsSection,
    renderEmptyTraitsHtml,
    renderTraitChipHtml,
    renderTraitsChipsListHtml,
    renderTraitsHeaderHtml,
    syncOpponentsBaseValuesForTrait,
} from '../../View/ui/detailsPanel/combat/combatTraitsSection.js'

describe('combatTraitsSection Component', () => {
    let container: HTMLElement
    let combat: Combat
    let npc1: NPC
    let traits: Array<{ id: string; name: string; type: string }>
    let onChange: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = '<div id="container"></div>'
        container = document.getElementById('container')!

        combat = new Combat('c_1', 'Walka z wilkami')
        npc1 = new NPC('npc_1', 'Wilk')
        npc1.addParameter(new Parameter('stat_hp', 'Zdrowie', new Description(), 'direct', 50))

        traits = [
            { id: 'stat_hp', name: 'Punkty Życia', type: 'parameter' },
            { id: 'stat_atk', name: 'Siła Ataku', type: 'stat' },
        ]

        onChange = vi.fn()
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderTraitsHeaderHtml', () => {
        it('renders section title and counts', () => {
            const html = renderTraitsHeaderHtml(1, 2)
            expect(html).toContain('Widoczne cechy i parametry')
            expect(html).toContain('1 / 2')
        })
    })

    describe('renderEmptyTraitsHtml', () => {
        it('renders empty traits placeholder message', () => {
            const html = renderEmptyTraitsHtml()
            expect(html).toContain('Brak zdefiniowanych cech lub parametrów w projekcie')
        })
    })

    describe('renderTraitChipHtml', () => {
        it('renders chip with active styles when isChecked is true', () => {
            const html = renderTraitChipHtml(traits[0], true)
            expect(html).toContain('data-trait-id="stat_hp"')
            expect(html).toContain('aria-pressed="true"')
            expect(html).toContain('Punkty Życia')
            expect(html).toContain('bg-amber-950/70')
        })

        it('renders chip with inactive styles when isChecked is false', () => {
            const html = renderTraitChipHtml(traits[0], false)
            expect(html).toContain('data-trait-id="stat_hp"')
            expect(html).toContain('aria-pressed="false"')
            expect(html).toContain('bg-[#27272a]')
        })
    })

    describe('renderTraitsChipsListHtml', () => {
        it('renders empty markup when traits list is empty', () => {
            const html = renderTraitsChipsListHtml([], [])
            expect(html).toContain('Brak zdefiniowanych cech lub parametrów w projekcie')
        })

        it('renders chips container when traits are provided', () => {
            const html = renderTraitsChipsListHtml(traits, ['stat_hp'])
            expect(html).toContain('id="combat-traits-chips-list"')
            expect(html).toContain('Punkty Życia')
            expect(html).toContain('Siła Ataku')
        })
    })

    describe('syncOpponentsBaseValuesForTrait', () => {
        it('resolves and sets base NPC value in opponent overriddenStats if empty', () => {
            combat.addCombatOpponent({
                id: 'opp_1',
                npcId: 'npc_1',
                name: 'Wilk',
                avatar: 'wolf',
                overriddenStats: {},
            })

            syncOpponentsBaseValuesForTrait(
                'stat_hp',
                traits[0],
                combat.getCombatOpponents(),
                [npc1],
                combat
            )

            const opp = combat.getCombatOpponents()[0]
            expect(opp.overriddenStats.stat_hp).toBe(50)
        })

        it('preserves existing override value if already defined', () => {
            combat.addCombatOpponent({
                id: 'opp_1',
                npcId: 'npc_1',
                name: 'Wilk',
                avatar: 'wolf',
                overriddenStats: { stat_hp: 99 },
            })

            syncOpponentsBaseValuesForTrait(
                'stat_hp',
                traits[0],
                combat.getCombatOpponents(),
                [npc1],
                combat
            )

            const opp = combat.getCombatOpponents()[0]
            expect(opp.overriddenStats.stat_hp).toBe(99)
        })
    })

    describe('renderCombatTraitsSection', () => {
        it('returns null on invalid container or missing combat', () => {
            expect(renderCombatTraitsSection(null as unknown as HTMLElement, combat)).toBeNull()
            expect(renderCombatTraitsSection(container, null as unknown as Combat)).toBeNull()
        })

        it('renders empty state when availableTraits is empty', () => {
            const section = renderCombatTraitsSection(container, combat, [], [npc1], onChange)
            expect(section).not.toBeNull()
            expect(container.textContent).toContain(
                'Brak zdefiniowanych cech lub parametrów w projekcie'
            )
            expect(container.textContent).toContain('0 / 0')
        })

        it('renders chips and toggles visibility on click', () => {
            combat.addCombatOpponent({
                id: 'opp_1',
                npcId: 'npc_1',
                name: 'Wilk',
                avatar: 'wolf',
                overriddenStats: {},
            })

            renderCombatTraitsSection(container, combat, traits, [npc1], onChange)

            const chipHp = container.querySelector('[data-trait-id="stat_hp"]') as HTMLButtonElement
            expect(chipHp).not.toBeNull()
            expect(combat.getVisibleStatIds().includes('stat_hp')).toBe(false)

            chipHp.click()

            expect(combat.getVisibleStatIds().includes('stat_hp')).toBe(true)
            expect(onChange).toHaveBeenCalledTimes(1)

            // Verify base value was synced
            const opp = combat.getCombatOpponents()[0]
            expect(opp.overriddenStats.stat_hp).toBe(50)
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = renderCombatTraitsSection(container, combat, traits, [npc1])
            expect(sectionEn?.textContent).toContain('Visible Traits & Parameters')

            await initTranslationsWithLocale('de')
            container.innerHTML = ''
            const sectionDe = renderCombatTraitsSection(container, combat, traits, [npc1])
            expect(sectionDe?.textContent).toContain('Sichtbare Merkmale & Parameter')
        })
    })
})
