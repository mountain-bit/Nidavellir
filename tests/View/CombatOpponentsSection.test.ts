// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from '../../dist/Utils/toast.js'
import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Combat } from '../../Model/Combat.js'
import { Description } from '../../Model/Description.js'
import { NPC } from '../../Model/NPC.js'
import { Parameter } from '../../Model/Parameter.js'
import { Stat } from '../../Model/Stat.js'
import {
    generateOpponentId,
    populateNpcSelect,
    renderCombatOpponentsSection,
    renderEmptyOpponentsListHtml,
    renderOpponentsHeaderHtml,
    resolveInitialOpponentStats,
} from '../../View/ui/detailsPanel/combat/combatOpponentsSection.js'

describe('combatOpponentsSection Component', () => {
    let container: HTMLElement
    let combat: Combat
    let npc1: NPC
    let npc2: NPC
    let availableTraits: Array<{ id: string; name: string; type: string }>
    let onModify: ReturnType<typeof vi.fn>
    let onFullRefresh: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = '<div id="container"></div>'
        container = document.getElementById('container')!

        combat = new Combat('c_1', 'Starcie w lesie')
        npc1 = new NPC('npc_1', 'Wilk')
        npc1.setAvatar('wolf')
        npc2 = new NPC('npc_2', 'Bandyta')
        npc2.setAvatar('rogue')

        availableTraits = [
            { id: 'stat_hp', name: 'Zdrowie', type: 'parameter' },
            { id: 'stat_atk', name: 'Atak', type: 'stat' },
        ]

        onModify = vi.fn()
        onFullRefresh = vi.fn()
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('generateOpponentId', () => {
        it('generates a valid unique string starting with opp_', () => {
            const id1 = generateOpponentId()
            const id2 = generateOpponentId()
            expect(id1).toMatch(/^opp_\d+_[a-z0-9]+$/)
            expect(id1).not.toBe(id2)
        })
    })

    describe('renderEmptyOpponentsListHtml', () => {
        it('renders empty message markup', () => {
            const html = renderEmptyOpponentsListHtml()
            expect(html).toContain('Brak dodanych przeciwników')
        })
    })

    describe('renderOpponentsHeaderHtml', () => {
        it('renders title, count badge, and add button', () => {
            const html = renderOpponentsHeaderHtml(3)
            const div = document.createElement('div')
            div.innerHTML = html

            expect(div.textContent).toContain('Przeciwnicy')
            expect(div.querySelector('.font-mono')?.textContent?.trim()).toBe('3')
            expect(div.textContent).toContain('Dodaj przeciwnika')
            expect(div.querySelector('[data-action="toggle-add-opponent"]')).not.toBeNull()
        })
    })

    describe('populateNpcSelect', () => {
        it('populates select options with placeholder and npc entries', () => {
            const select = document.createElement('select')
            populateNpcSelect(select, [npc1, npc2])

            expect(select.options.length).toBe(3)
            expect(select.options[0].value).toBe('')
            expect(select.options[1].value).toBe('npc_1')
            expect(select.options[1].textContent).toBe('Wilk')
            expect(select.options[2].value).toBe('npc_2')
            expect(select.options[2].textContent).toBe('Bandyta')
        })
    })

    describe('resolveInitialOpponentStats', () => {
        it('resolves initial stat values for an NPC', () => {
            npc1.addParameter(new Parameter('stat_hp', 'Zdrowie', new Description(), 'direct', 50))
            npc1.addStat(new Stat('stat_atk', 'Atak', new Description(), 12))

            const stats = resolveInitialOpponentStats(npc1, availableTraits)
            expect(stats.stat_hp).toBe(50)
            expect(stats.stat_atk).toBe(12)
        })
    })

    describe('renderCombatOpponentsSection', () => {
        it('returns null if container or combat is missing', () => {
            expect(renderCombatOpponentsSection(null as unknown as HTMLElement, combat)).toBeNull()
            expect(renderCombatOpponentsSection(container, null as unknown as Combat)).toBeNull()
        })

        it('renders empty state initially when no opponents exist', () => {
            const section = renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            expect(section).not.toBeNull()
            expect(container.textContent).toContain('Brak dodanych przeciwników')
            expect(
                container.querySelector('#combat-add-opponent-form')?.classList.contains('hidden')
            ).toBe(true)
        })

        it('toggles add opponent form visibility', () => {
            renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            const toggleBtn = container.querySelector(
                '#btn-toggle-add-opponent'
            ) as HTMLButtonElement
            const form = container.querySelector('#combat-add-opponent-form') as HTMLElement
            const cancelBtn = container.querySelector(
                '#btn-cancel-add-opponent'
            ) as HTMLButtonElement

            expect(form.classList.contains('hidden')).toBe(true)

            toggleBtn.click()
            expect(form.classList.contains('hidden')).toBe(false)

            cancelBtn.click()
            expect(form.classList.contains('hidden')).toBe(true)
        })

        it('shows error toast when submitting empty NPC select', () => {
            const toastSpy = vi.spyOn(toast, 'error').mockImplementation(() => '')

            renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            const submitBtn = container.querySelector(
                '#btn-submit-add-opponent'
            ) as HTMLButtonElement
            submitBtn.click()

            expect(toastSpy).toHaveBeenCalledWith('Wybierz postać!')
            expect(onFullRefresh).not.toHaveBeenCalled()
        })

        it('successfully adds opponent when NPC is selected', () => {
            const toastSpy = vi.spyOn(toast, 'success').mockImplementation(() => '')

            renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            const select = container.querySelector(
                '#combat-add-opponent-select'
            ) as HTMLSelectElement
            const nameInput = container.querySelector(
                '#combat-add-opponent-name'
            ) as HTMLInputElement
            const submitBtn = container.querySelector(
                '#btn-submit-add-opponent'
            ) as HTMLButtonElement

            select.value = 'npc_1'
            nameInput.value = 'Wilk Przywódca'
            submitBtn.click()

            const opponents = combat.getCombatOpponents()
            expect(opponents.length).toBe(1)
            expect(opponents[0].name).toBe('Wilk Przywódca')
            expect(opponents[0].npcId).toBe('npc_1')
            expect(onFullRefresh).toHaveBeenCalledTimes(1)
            expect(toastSpy).toHaveBeenCalled()
        })

        it('renders opponent card, edits name, duplicates and removes opponent', () => {
            combat.addCombatOpponent({
                id: 'opp_1',
                npcId: 'npc_1',
                name: 'Zdzisław',
                avatar: 'warrior',
                overriddenStats: {},
            })

            renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            const card = container.querySelector('[data-opponent-id="opp_1"]') as HTMLElement
            expect(card).not.toBeNull()

            // Name edit
            const nameInput = card.querySelector('.opp-name-input') as HTMLInputElement
            expect(nameInput.value).toBe('Zdzisław')
            nameInput.value = 'Zdzisław Zmodyfikowany'
            nameInput.dispatchEvent(new Event('change'))

            expect(combat.getCombatOpponents()[0].name).toBe('Zdzisław Zmodyfikowany')
            expect(onModify).toHaveBeenCalledTimes(1)

            // Clone
            const cloneBtn = card.querySelector('.btn-clone-opp') as HTMLButtonElement
            cloneBtn.click()

            expect(combat.getCombatOpponents().length).toBe(2)
            expect(combat.getCombatOpponents()[1].name).toBe('Zdzisław Zmodyfikowany (kopia)')
            expect(onFullRefresh).toHaveBeenCalledTimes(1)

            // Remove
            const removeBtn = card.querySelector('.btn-remove-opp') as HTMLButtonElement
            removeBtn.click()

            expect(combat.getCombatOpponents().length).toBe(1)
            expect(combat.getCombatOpponents().find(o => o.id === 'opp_1')).toBeUndefined()
            expect(onFullRefresh).toHaveBeenCalledTimes(2)
        })

        it('renders trait overrides and modifies overridden stat values', () => {
            combat.setVisibleStatIds(['stat_hp'])
            combat.addCombatOpponent({
                id: 'opp_1',
                npcId: 'npc_1',
                name: 'Wilk',
                avatar: 'warrior',
                overriddenStats: { stat_hp: '100' },
            })

            renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits,
                onModify,
                onFullRefresh
            )

            const statInput = container.querySelector('.opp-stat-input') as HTMLInputElement
            expect(statInput).not.toBeNull()
            expect(statInput.value).toBe('100')

            statInput.value = '150'
            statInput.dispatchEvent(new Event('change'))

            expect(combat.getCombatOpponents()[0].overriddenStats.stat_hp).toBe('150')
            expect(onModify).toHaveBeenCalledTimes(1)
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits
            )
            expect(sectionEn?.textContent).toContain('Opponents')
            expect(sectionEn?.textContent).toContain('Add opponent')

            await initTranslationsWithLocale('de')
            container.innerHTML = ''
            const sectionDe = renderCombatOpponentsSection(
                container,
                combat,
                [npc1],
                availableTraits
            )
            expect(sectionDe?.textContent).toContain('Gegner')
            expect(sectionDe?.textContent).toContain('Gegner hinzufügen')
        })
    })
})
