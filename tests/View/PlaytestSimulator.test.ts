import { beforeEach, describe, expect, it } from 'vitest'

import { formatMarkdown, PlaytestEngine } from '../../View/ui/playtestModal.js'

describe('Playtest & Narrative Simulator Engine (View/ui/playtestModal.js)', () => {
    let mockContext: any
    let mockP1: any
    let mockP2: any
    let mockP3: any
    let mockScene1: any
    let mockScene2: any

    beforeEach(() => {
        mockP1 = {
            getId: () => 'p1',
            getNumber: () => 1,
            getTitle: () => 'Brama do Zamku',
            getIsStart: () => true,
            getIsEnd: () => false,
            getContent: () => ({
                getText: () =>
                    'Stoisz przed potężną bramą zamkową. Drewniane wierzeje są zamknięte na głucho.',
                getSummary: () => 'Początek wyprawy',
            }),
            getChoices: () => [
                {
                    getId: () => 'c1',
                    getName: () => 'Zapukaj do bramy',
                    getTargetParagraphId: () => 'p2',
                },
                {
                    getId: () => 'c2',
                    getName: () => 'Obejdź mury w lewo',
                    getTargetParagraphId: () => 'p3',
                },
            ],
            getTags: () => [{ getName: () => 'zamek' }],
            getLocations: () => [{ getName: () => 'Brama Główna' }],
            getCharacters: () => [],
            getHasCombat: () => false,
        }

        mockP2 = {
            getId: () => 'p2',
            getNumber: () => 2,
            getTitle: () => 'Dziedziniec Zamkowy',
            getIsStart: () => false,
            getIsEnd: () => false,
            getContent: () => ({
                getText: () => 'Strażnik uchyla kratę i wpuszcza cię na brukowany dziedziniec.',
            }),
            getChoices: () => [
                {
                    getId: () => 'c3',
                    getName: () => 'Wejdź do sali tronowej',
                    getTargetParagraphId: () => 'p3',
                },
            ],
            getTags: () => [],
            getLocations: () => [{ getName: () => 'Dziedziniec' }],
            getCharacters: () => [{ getName: () => 'Strażnik Jan' }],
            getHasCombat: () => false,
        }

        mockP3 = {
            getId: () => 'p3',
            getNumber: () => 3,
            getTitle: () => 'Sala Tronowa - Zakończenie',
            getIsStart: () => false,
            getIsEnd: () => true,
            getContent: () => ({
                getText: () => 'Król wita cię z honorami. Misja zakończona sukcesem!',
            }),
            getChoices: () => [],
            getTags: () => [{ getName: () => 'finał' }],
            getLocations: () => [{ getName: () => 'Sala Tronowa' }],
            getCharacters: () => [{ getName: () => 'Król Aldor' }],
            getHasCombat: () => false,
        }

        mockScene1 = {
            getId: () => 'scene1',
            getName: () => 'Przedzamcze',
            getInitialParagraphId: () => 'p1',
            getParagraphs: () => [mockP1, mockP2],
        }

        mockScene2 = {
            getId: () => 'scene2',
            getName: () => 'Wnętrze Zamku',
            getInitialParagraphId: () => 'p3',
            getParagraphs: () => [mockP3],
        }

        mockContext = {
            projectData: {
                projectParagraphs: [mockP1, mockP2, mockP3],
                projectScenes: [mockScene1, mockScene2],
            },
            vm: {
                getSelectedItem: () => null,
            },
        }
    })

    describe('PlaytestEngine Core Logic', () => {
        it('starts session at start paragraph and sets up initial history', () => {
            const engine = new PlaytestEngine(mockContext)
            const initialP = engine.start()

            expect(initialP).toBe(mockP1)
            expect(engine.getStepCount()).toBe(1)
            expect(engine.getVisitedCount()).toBe(1)
            expect(engine.canStepBack()).toBe(false)

            const trail = engine.getHistoryTrail()
            expect(trail.length).toBe(1)
            expect(trail[0].paragraphId).toBe('p1')
            expect(trail[0].paragraphNumber).toBe(1)
            expect(trail[0].paragraphTitle).toBe('Brama do Zamku')
            expect(trail[0].sceneName).toBe('Przedzamcze')
            expect(trail[0].isTeleport).toBe(false)
        })

        it('supports starting at a custom paragraph ID (e.g. from context menu)', () => {
            const engine = new PlaytestEngine(mockContext)
            const initialP = engine.start('p2')

            expect(initialP).toBe(mockP2)
            expect(engine.getStepCount()).toBe(1)
            expect(engine.getCurrentParagraph()).toBe(mockP2)
        })

        it('transitions forward when choices are selected', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()

            const nextP = engine.goTo('p2', 'Zapukaj do bramy')
            expect(nextP).toBe(mockP2)
            expect(engine.getStepCount()).toBe(2)
            expect(engine.getVisitedCount()).toBe(2)
            expect(engine.canStepBack()).toBe(true)

            const trail = engine.getHistoryTrail()
            expect(trail.length).toBe(2)
            expect(trail[1].paragraphId).toBe('p2')
            expect(trail[1].choiceTakenTitle).toBe('Zapukaj do bramy')
        })

        it('handles stepBack (undo) properly', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()
            engine.goTo('p2', 'Zapukaj')
            engine.goTo('p3', 'Wejdź')

            expect(engine.getStepCount()).toBe(3)
            expect(engine.getCurrentParagraph()).toBe(mockP3)

            const steppedBack = engine.stepBack()
            expect(steppedBack).toBe(mockP2)
            expect(engine.getStepCount()).toBe(2)
            expect(engine.canStepBack()).toBe(true)

            const step1 = engine.stepBack()
            expect(step1).toBe(mockP1)
            expect(engine.getStepCount()).toBe(1)
            expect(engine.canStepBack()).toBe(false)

            // Cannot step back past initial step
            expect(engine.stepBack()).toBeNull()
            expect(engine.getStepCount()).toBe(1)
        })

        it('allows direct jump to any previous breadcrumbs index', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()
            engine.goTo('p2', 'Krok 1')
            engine.goTo('p3', 'Krok 2')

            // Jump back to index 0 (p1)
            const jumped = engine.stepToIndex(0)
            expect(jumped).toBe(mockP1)
            expect(engine.getStepCount()).toBe(1)
            expect(engine.canStepBack()).toBe(false)
        })

        it('truncates forward history when branching from an undone state', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()
            engine.goTo('p2', 'Wybór A')
            engine.stepBack() // back to p1

            // Take alternative path to p3 directly
            engine.goTo('p3', 'Wybór B')
            expect(engine.getStepCount()).toBe(2)
            const trail = engine.getHistoryTrail()
            expect(trail.map(t => t.paragraphId)).toEqual(['p1', 'p3'])
        })

        it('handles teleportation to a specific scene and its start node', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()

            // Teleport to scene2 (initial paragraph is p3)
            const teleported = engine.teleportTo('scene2')
            expect(teleported).toBe(mockP3)
            expect(engine.getStepCount()).toBe(2)

            const current = engine.getCurrentEntry()
            expect(current?.isTeleport).toBe(true)
            expect(current?.choiceTakenTitle).toContain('Teleportacja')
            expect(current?.sceneName).toBe('Wnętrze Zamku')

            // Can undo a teleport!
            const undoTeleport = engine.stepBack()
            expect(undoTeleport).toBe(mockP1)
        })

        it('handles teleportation to a specific paragraph directly', () => {
            const engine = new PlaytestEngine(mockContext)
            engine.start()

            const teleported = engine.teleportTo(undefined, 'p2')
            expect(teleported).toBe(mockP2)
            expect(engine.getCurrentParagraph()).toBe(mockP2)
        })

        it('has godMode enabled by default for author in editor', () => {
            const engine = new PlaytestEngine(mockContext)
            expect(engine.godMode).toBe(true)
        })
    })

    describe('formatMarkdown Helper', () => {
        it('formats headers, bold, italics, blockquotes and prevents HTML injection', () => {
            const raw = '# Tytuł\n**Ważne** i *kursywa*\n> Mówi narrator\n<script>alert(1)</script>'
            const html = formatMarkdown(raw)

            expect(html).toContain('<h2')
            expect(html).toContain('Tytuł</h2>')
            expect(html).toContain('<strong')
            expect(html).toContain('Ważne</strong>')
            expect(html).toContain('<em')
            expect(html).toContain('kursywa</em>')
            expect(html).toContain('Mówi narrator')
            // Script tag must be escaped
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;')
        })
    })
})
