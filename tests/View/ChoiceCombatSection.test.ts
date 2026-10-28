// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice } from '../../Model/Choice'
import { Combat } from '../../Model/Combat'
import { Paragraph } from '../../Model/Paragraph'
import {
    createChoiceCombatSection,
    handleGoToCombat,
    renderCombatOpponentsListHtml,
    resolveChoiceCombatData,
} from '../../View/ui/detailsPanel/choice/choiceCombatSection.js'

interface IMockChoiceCombatCtx {
    projectParagraphs: Paragraph[]
    selectEntity: ReturnType<typeof vi.fn>
}

describe('choiceCombatSection', () => {
    let sourceParagraph: Paragraph
    let targetParagraph: Paragraph
    let combat: Combat
    let combatChoice: Choice
    let normalChoice: Choice
    let ctx: IMockChoiceCombatCtx

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''

        sourceParagraph = new Paragraph('p_source', 'Sala Tronowa')
        targetParagraph = new Paragraph('p_target', 'Skarbiec')

        combat = new Combat('combat_1', 'Starcie z Goblinem')
        combat.setCombatOpponents([
            {
                id: 'opp_1',
                npcId: 'npc_goblin',
                name: 'Goblin Szaman',
                avatar: 'mage',
                overriddenStats: {},
            },
        ])
        sourceParagraph.setHasCombat(true)
        sourceParagraph.setCombat(combat)

        combatChoice = new Choice('choice_combat', 'Zwycięstwo', 'p_source', 'p_target')
        combatChoice.setIsCombatOutcome(true)

        normalChoice = new Choice('choice_normal', 'Zwykła ścieżka', 'p_source', 'p_target')
        normalChoice.setIsCombatOutcome(false)

        ctx = {
            projectParagraphs: [sourceParagraph, targetParagraph],
            selectEntity: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('resolveChoiceCombatData', () => {
        it('returns null if choice or ctx is null or undefined', () => {
            expect(resolveChoiceCombatData(null, ctx)).toBeNull()
            expect(resolveChoiceCombatData(combatChoice, null)).toBeNull()
            expect(resolveChoiceCombatData(undefined, undefined)).toBeNull()
        })

        it('returns null if choice is not marked as combat outcome', () => {
            expect(resolveChoiceCombatData(normalChoice, ctx)).toBeNull()
        })

        it('returns null if choice has no fromParagraphId or source paragraph is missing', () => {
            const orphanChoice = new Choice('c_orphan', 'Orphan', '', 'p_target')
            orphanChoice.setIsCombatOutcome(true)
            expect(resolveChoiceCombatData(orphanChoice, ctx)).toBeNull()

            const missingSourceChoice = new Choice('c_miss', 'Miss', 'non_existing_p', 'p_target')
            missingSourceChoice.setIsCombatOutcome(true)
            expect(resolveChoiceCombatData(missingSourceChoice, ctx)).toBeNull()
        })

        it('returns null if source paragraph does not have combat enabled or combat instance is missing', () => {
            sourceParagraph.setHasCombat(false)
            expect(resolveChoiceCombatData(combatChoice, ctx)).toBeNull()

            sourceParagraph.setHasCombat(true)
            sourceParagraph.setCombat(null as unknown as Combat)
            expect(resolveChoiceCombatData(combatChoice, ctx)).toBeNull()
        })

        it('resolves full combat data for valid combat choice', () => {
            const data = resolveChoiceCombatData(combatChoice, ctx)
            expect(data).not.toBeNull()
            expect(data?.fromP).toBe(sourceParagraph)
            expect(data?.combat).toBe(combat)
            expect(data?.combatName).toBe('Starcie z Goblinem')
            expect(data?.pTitle).toBe('Sala Tronowa')
            expect(data?.opponents.length).toBe(1)
            expect((data?.opponents[0] as { name: string }).name).toBe('Goblin Szaman')
        })

        it('supports plain object representations of choice, paragraph, and combat', () => {
            const plainChoice = {
                isCombatOutcome: true,
                fromParagraphId: 'plain_source',
            }
            const plainParagraph = {
                id: 'plain_source',
                hasCombat: true,
                title: 'Jaskinia',
                combat: {
                    name: 'Walka ze smokiem',
                    combatOpponents: [{ name: 'Smok', avatar: 'dragon' }],
                },
            }
            const plainCtx = {
                projectParagraphs: [plainParagraph as unknown as Paragraph],
                selectEntity: vi.fn(),
            }

            const data = resolveChoiceCombatData(plainChoice as unknown as Choice, plainCtx)
            expect(data).not.toBeNull()
            expect(data?.combatName).toBe('Walka ze smokiem')
            expect(data?.pTitle).toBe('Jaskinia')
            expect(data?.opponents.length).toBe(1)
        })
    })

    describe('renderCombatOpponentsListHtml', () => {
        it('renders empty message when opponents list is empty or not an array', () => {
            const emptyHtml = renderCombatOpponentsListHtml([])
            expect(emptyHtml).toContain('Brak zdefiniowanych przeciwników')

            const nullHtml = renderCombatOpponentsListHtml(null as unknown as [])
            expect(nullHtml).toContain('Brak zdefiniowanych przeciwników')
        })

        it('renders opponent card with avatar SVG and escaped name', () => {
            const opponents = [
                { name: 'Ogr Wojownik', avatar: 'warrior' },
                { name: 'Elf Łucznik', avatar: 'archer' },
            ]

            const html = renderCombatOpponentsListHtml(opponents)
            expect(html).toContain('Ogr Wojownik')
            expect(html).toContain('Elf Łucznik')
            expect(html).toContain('<svg')
        })

        it('escapes opponent names to prevent HTML injection', () => {
            const maliciousOpponents = [
                { name: '<script>alert("hack")</script>', avatar: 'warrior' },
            ]

            const html = renderCombatOpponentsListHtml(maliciousOpponents)
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;')
        })

        it('falls back to default avatar and placeholder name when properties are missing', () => {
            const incompleteOpponents = [{}]
            const html = renderCombatOpponentsListHtml(incompleteOpponents)
            expect(html).toContain('Przeciwnik')
            expect(html).toContain('<svg')
        })
    })

    describe('handleGoToCombat', () => {
        it('calls ctx.selectEntity with source paragraph and paragraph type', () => {
            handleGoToCombat(sourceParagraph, ctx)
            expect(ctx.selectEntity).toHaveBeenCalledWith(sourceParagraph, 'paragraph')
        })

        it('safely handles missing arguments without throwing', () => {
            expect(() => handleGoToCombat(null, ctx)).not.toThrow()
            expect(() => handleGoToCombat(sourceParagraph, null)).not.toThrow()
            expect(() =>
                handleGoToCombat(sourceParagraph, {} as unknown as IMockChoiceCombatCtx)
            ).not.toThrow()
        })
    })

    describe('createChoiceCombatSection UI component', () => {
        it('returns null for choices that are not combat outcomes', () => {
            const section = createChoiceCombatSection(normalChoice, ctx)
            expect(section).toBeNull()
        })

        it('renders combat details section with titles, badges, and opponent cards', () => {
            const section = createChoiceCombatSection(combatChoice, ctx)
            expect(section).not.toBeNull()
            if (!section) return

            expect(section.tagName.toLowerCase()).toBe('section')
            expect(section.textContent).toContain('Szczegóły walki')
            expect(section.textContent).toContain('Po walce')
            expect(section.textContent).toContain('§ Sala Tronowa')
            expect(section.textContent).toContain('Starcie: Starcie z Goblinem')
            expect(section.textContent).toContain('Przeciwnicy w tym starciu (1)')
            expect(section.textContent).toContain('Goblin Szaman')

            const goToBtn = section.querySelector('#btn-choice-go-to-combat') as HTMLButtonElement
            expect(goToBtn).not.toBeNull()
            expect(goToBtn.textContent).toContain('Konfiguruj walkę w § Sala Tronowa')
            expect(goToBtn.getAttribute('aria-label')).toBe('Konfiguruj walkę w § Sala Tronowa')
        })

        it('invokes ctx.selectEntity on clicking configure combat button', () => {
            const section = createChoiceCombatSection(combatChoice, ctx)
            expect(section).not.toBeNull()
            if (!section) return

            const goToBtn = section.querySelector('#btn-choice-go-to-combat') as HTMLButtonElement
            goToBtn.click()

            expect(ctx.selectEntity).toHaveBeenCalledWith(sourceParagraph, 'paragraph')
        })

        it('adapts all labels when switching language to English', async () => {
            await initTranslationsWithLocale('en')
            const section = createChoiceCombatSection(combatChoice, ctx)
            expect(section).not.toBeNull()
            if (!section) return

            expect(section.textContent).toContain('Combat Details')
            expect(section.textContent).toContain('After combat')
            expect(section.textContent).toContain('Source combat paragraph:')
            expect(section.textContent).toContain('Encounter: Starcie z Goblinem')
            expect(section.textContent).toContain('Opponents in this encounter (1)')

            const goToBtn = section.querySelector('#btn-choice-go-to-combat') as HTMLButtonElement
            expect(goToBtn).not.toBeNull()
            expect(goToBtn.textContent).toContain('Configure combat in § Sala Tronowa')
            expect(goToBtn.getAttribute('aria-label')).toBe('Configure combat in § Sala Tronowa')

            const unnamedOppHtml = renderCombatOpponentsListHtml([{}])
            expect(unnamedOppHtml).toContain('Opponent')

            const emptyOppHtml = renderCombatOpponentsListHtml([])
            expect(emptyOppHtml).toContain('No opponents defined')
        })
    })
})
