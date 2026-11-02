import { describe, expect, it } from 'vitest'

import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { GraphValidationService } from '../../Services/graph/GraphValidationService'

describe('GraphValidationService (Services/GraphValidationService.ts)', () => {
    describe('Empty and Start/End Validation', () => {
        it('reports error when project has no paragraphs', () => {
            const report = GraphValidationService.validateStoryGraph([])
            expect(report.isValid).toBe(false)
            expect(report.errorCount).toBe(1)
            expect(report.issues[0].code).toBe('NO_PARAGRAPHS')
            expect(report.issues[0].title).toContain('Brak paragrafów')
        })

        it('reports warning when no start paragraph is designated', () => {
            const p1 = new Paragraph('p1', 'Rozdział 1')
            const p2 = new Paragraph('p2', 'Koniec')
            p2.setIsEnd(true)
            p1.setChoices([new Choice('c1', 'Dalej', 'p1', 'p2')])

            const report = GraphValidationService.validateStoryGraph([p1, p2])
            expect(report.warningCount).toBe(1)
            expect(report.issues.some(i => i.code === 'NO_START')).toBe(true)
        })

        it('reports warning when multiple start paragraphs exist', () => {
            const p1 = new Paragraph('p1', 'Start 1')
            p1.setIsStart(true)
            const p2 = new Paragraph('p2', 'Start 2')
            p2.setIsStart(true)
            p1.setChoices([new Choice('c1', 'Do p2', 'p1', 'p2')])

            const report = GraphValidationService.validateStoryGraph([p1, p2])
            expect(report.issues.some(i => i.code === 'MULTIPLE_STARTS')).toBe(true)
        })

        it('reports info when multi-paragraph project has no end node', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            const p2 = new Paragraph('p2', 'Środek')
            p1.setChoices([new Choice('c1', 'Dalej', 'p1', 'p2')])
            p2.setChoices([new Choice('c2', 'Wróć', 'p2', 'p1')])

            const report = GraphValidationService.validateStoryGraph([p1, p2])
            expect(report.issues.some(i => i.code === 'NO_END')).toBe(true)
        })

        it('reports info when an ending node has outgoing choices', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            const pEnd = new Paragraph('pEnd', 'Finał z New Game+')
            pEnd.setIsEnd(true)
            pEnd.setChoices([new Choice('c_restart', 'Od nowa', 'pEnd', 'p1')])
            p1.setChoices([new Choice('c1', 'Do końca', 'p1', 'pEnd')])

            const report = GraphValidationService.validateStoryGraph([p1, pEnd])
            expect(report.issues.some(i => i.code === 'END_HAS_CHOICES')).toBe(true)
        })
    })

    describe('Jumps, Dead Ends, Broken Links, and Self Loops', () => {
        it('identifies dead-ends (paragraphs with no choices not marked as isEnd)', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            const pDead = new Paragraph('pDead', 'Ślepy Zaułek')
            // pDead has no choices and isEnd is false
            p1.setChoices([new Choice('c1', 'W ślepy zaułek', 'p1', 'pDead')])

            const report = GraphValidationService.validateStoryGraph([p1, pDead])
            expect(report.issues.some(i => i.code === 'DEAD_END')).toBe(true)
        })

        it('identifies broken target links as errors', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            p1.setChoices([new Choice('c_broken', 'W nicość', 'p1', 'non_existing_target_999')])

            const report = GraphValidationService.validateStoryGraph([p1])
            expect(report.isValid).toBe(false)
            expect(report.errorCount).toBe(1)
            expect(report.issues.some(i => i.code === 'BROKEN_LINK')).toBe(true)
        })

        it('identifies self loops as warnings', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            p1.setChoices([new Choice('c_self', 'Pętla do siebie', 'p1', 'p1')])

            const report = GraphValidationService.validateStoryGraph([p1])
            expect(report.issues.some(i => i.code === 'SELF_LOOP')).toBe(true)
            expect(report.issues.find(i => i.code === 'SELF_LOOP')?.cycleIds).toEqual(['p1', 'p1'])
        })
    })

    describe('True Reachability: Orphans vs Disconnected Islands (BFS Analysis)', () => {
        it('detects a solitary orphan paragraph with in-degree 0', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            const pEnd = new Paragraph('pEnd', 'Koniec')
            pEnd.setIsEnd(true)
            p1.setChoices([new Choice('c1', 'Do końca', 'p1', 'pEnd')])

            const pOrphan = new Paragraph('pOrphan', 'Odcięty węzeł')
            pOrphan.setChoices([new Choice('c_out', 'Do końca', 'pOrphan', 'pEnd')])

            const report = GraphValidationService.validateStoryGraph([p1, pEnd, pOrphan])
            expect(report.issues.some(i => i.code === 'ORPHAN_NODE')).toBe(true)
            expect(report.issues.find(i => i.code === 'ORPHAN_NODE')?.paragraphId).toBe('pOrphan')
        })

        it('detects disconnected cycle/island where in-degree > 0 but completely unreachable from start', () => {
            // Main playable storyline
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            const p2 = new Paragraph('p2', 'Finał')
            p2.setIsEnd(true)
            p1.setChoices([new Choice('c1', 'Koniec', 'p1', 'p2')])

            // Disconnected island: pIslandA <-> pIslandB (both have in-degree 1 from each other)
            const pIslandA = new Paragraph('pIslandA', 'Wyspa A')
            const pIslandB = new Paragraph('pIslandB', 'Wyspa B')
            pIslandA.setChoices([new Choice('c_ab', 'Do B', 'pIslandA', 'pIslandB')])
            pIslandB.setChoices([new Choice('c_ba', 'Do A', 'pIslandB', 'pIslandA')])

            const report = GraphValidationService.validateStoryGraph([p1, p2, pIslandA, pIslandB])

            // Both nodes in the disconnected island must be flagged as UNREACHABLE_ISLAND
            const islandIssues = report.issues.filter(i => i.code === 'UNREACHABLE_ISLAND')
            expect(islandIssues.length).toBe(2)
            expect(islandIssues.map(i => i.paragraphId).sort()).toEqual(['pIslandA', 'pIslandB'])
        })
    })

    describe('Cycles and Loops Detection (DFS Analysis)', () => {
        it('detects multi-node narrative loops with exit as info', () => {
            const p1 = new Paragraph('p1', 'Rynek')
            p1.setIsStart(true)
            const p2 = new Paragraph('p2', 'Karczma')
            const p3 = new Paragraph('p3', 'Brama wyjściowa')
            p3.setIsEnd(true)

            // p1 -> p2 -> p1 (loop), but p2 also has exit to p3
            p1.setChoices([new Choice('c12', 'Do karczmy', 'p1', 'p2')])
            p2.setChoices([
                new Choice('c21', 'Powrót na rynek', 'p2', 'p1'),
                new Choice('c23', 'Do bramy', 'p2', 'p3'),
            ])

            const report = GraphValidationService.validateStoryGraph([p1, p2, p3])
            const loopIssue = report.issues.find(i => i.code === 'CYCLE_LOOP')
            expect(loopIssue).toBeDefined()
            expect(loopIssue?.severity).toBe('info')
            expect(loopIssue?.cycleIds).toContain('p1')
            expect(loopIssue?.cycleIds).toContain('p2')
        })

        it('detects deadlocked loops without exit as warning', () => {
            const p1 = new Paragraph('p1', 'Labirynt A')
            p1.setIsStart(true)
            const p2 = new Paragraph('p2', 'Labirynt B')

            // p1 <-> p2 with no exits anywhere
            p1.setChoices([new Choice('c12', 'Korytarz B', 'p1', 'p2')])
            p2.setChoices([new Choice('c21', 'Korytarz A', 'p2', 'p1')])

            const report = GraphValidationService.validateStoryGraph([p1, p2])
            const deadlockIssue = report.issues.find(i => i.code === 'CYCLE_DEADLOCK')
            expect(deadlockIssue).toBeDefined()
            expect(deadlockIssue?.severity).toBe('warning')
        })
    })

    describe('Scene Integrity and Node Issue Map', () => {
        it('reports error when scene initialParagraphId points to non-existent paragraph', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            p1.setIsEnd(true)

            const scene = new Scene(
                'scene1',
                'Zamek',
                undefined,
                [p1],
                undefined,
                undefined,
                undefined,
                'non_existent_paragraph_initial'
            )

            const report = GraphValidationService.validateStoryGraph({
                paragraphs: [p1],
                scenes: [scene],
            })

            expect(report.isValid).toBe(false)
            expect(report.issues.some(i => i.code === 'INVALID_SCENE_INITIAL')).toBe(true)
        })

        it('builds nodeIssueMap associating issue severities per paragraphId', () => {
            const p1 = new Paragraph('p1', 'Start')
            p1.setIsStart(true)
            p1.setChoices([
                new Choice('c_broken', 'Błąd', 'p1', 'missing_id'),
                new Choice('c_self', 'Pętla', 'p1', 'p1'),
            ])

            const report = GraphValidationService.validateStoryGraph([p1])
            expect(report.nodeIssueMap.has('p1')).toBe(true)
            const p1Severities = report.nodeIssueMap.get('p1')!
            expect(p1Severities).toContain('error')
            expect(p1Severities).toContain('warning')
        })
    })

    describe('Combat Outcomes Transitions & Validation', () => {
        it('recognizes combat outcomes as valid transitions preventing false DEAD_END', () => {
            const p1 = new Paragraph('p1', 'Arena')
            p1.setIsStart(true)
            p1.setHasCombat(true)

            const combat = p1.getCombat()
            combat.setOutcomes([
                { id: 'o_win', name: 'Zwycięstwo', targetParagraphId: 'pEnd' },
                { id: 'o_flee', name: 'Ucieczka', targetParagraphId: 'pEnd' },
            ])

            const pEnd = new Paragraph('pEnd', 'Finał')
            pEnd.setIsEnd(true)

            const report = GraphValidationService.validateStoryGraph([p1, pEnd])
            expect(report.issues.some(i => i.code === 'DEAD_END')).toBe(false)
            expect(
                report.issues.some(i => i.code === 'ORPHAN_NODE' && i.paragraphId === 'pEnd')
            ).toBe(false)
            expect(report.issues.some(i => i.code === 'UNREACHABLE_ISLAND')).toBe(false)
        })

        it('detects broken links in combat outcomes', () => {
            const p1 = new Paragraph('p1', 'Las')
            p1.setIsStart(true)
            p1.setHasCombat(true)

            const combat = p1.getCombat()
            combat.setOutcomes([
                { id: 'o_bad', name: 'Zwycięstwo', targetParagraphId: 'non_existent_target_404' },
            ])

            const report = GraphValidationService.validateStoryGraph([p1])
            expect(report.isValid).toBe(false)
            expect(report.errorCount).toBe(1)
            const brokenIssue = report.issues.find(i => i.code === 'BROKEN_LINK')
            expect(brokenIssue).toBeDefined()
            expect(brokenIssue?.title).toContain('Błędny cel')
            expect(brokenIssue?.description).toContain('Wynik walki')
        })

        it('detects self-loops in combat outcomes', () => {
            const p1 = new Paragraph('p1', 'Pułapka')
            p1.setIsStart(true)
            p1.setHasCombat(true)

            const combat = p1.getCombat()
            combat.setOutcomes([{ id: 'o_self', name: 'Ponowna próba', targetParagraphId: 'p1' }])

            const report = GraphValidationService.validateStoryGraph([p1])
            const loopIssue = report.issues.find(i => i.code === 'SELF_LOOP')
            expect(loopIssue).toBeDefined()
            expect(loopIssue?.description).toContain('Wynik walki')
        })

        it('correctly traverses combat outcomes in BFS reachability analysis', () => {
            const pStart = new Paragraph('pStart', 'Start')
            pStart.setIsStart(true)
            pStart.setHasCombat(true)
            pStart
                .getCombat()
                .setOutcomes([{ id: 'o_next', name: 'Zwycięstwo', targetParagraphId: 'pMid' }])

            const pMid = new Paragraph('pMid', 'Środek')
            pMid.setChoices([new Choice('c_end', 'Do końca', 'pMid', 'pEnd')])

            const pEnd = new Paragraph('pEnd', 'Koniec')
            pEnd.setIsEnd(true)

            const report = GraphValidationService.validateStoryGraph([pStart, pMid, pEnd])
            expect(report.issues.some(i => i.code === 'ORPHAN_NODE')).toBe(false)
            expect(report.issues.some(i => i.code === 'UNREACHABLE_ISLAND')).toBe(false)
        })

        it('warns about dead-end when combat has no outcomes and no choices', () => {
            const pCombat = new Paragraph('pCombat', 'Ślepa walka')
            pCombat.setIsStart(true)
            pCombat.setHasCombat(true)
            pCombat.getCombat().setOutcomes([])

            const report = GraphValidationService.validateStoryGraph([pCombat])
            const deadEnd = report.issues.find(i => i.code === 'DEAD_END')
            expect(deadEnd).toBeDefined()
            expect(deadEnd?.description).toContain('walkę')
        })
    })
})
