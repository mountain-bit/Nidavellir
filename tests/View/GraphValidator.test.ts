import { describe, expect, it } from 'vitest'

import { validateStoryGraph } from '../../View/ui/graphValidator.js'

describe('Graph Validation Engine (View/ui/graphValidator.js)', () => {
    it('reports error when project has no paragraphs', () => {
        const report = validateStoryGraph({ projectData: { projectParagraphs: [] } })
        expect(report.isValid).toBe(false)
        expect(report.errorCount).toBe(1)
        expect(report.issues[0].title).toContain('Brak paragrafów')
    })

    it('identifies dead ends, broken links and self loops', () => {
        const mockP1 = {
            getId: () => 'p1',
            getTitle: () => 'Wstęp',
            getIsStart: () => true,
            getChoices: () => [
                {
                    getId: () => 'c1',
                    getTitle: () => 'Do lasu',
                    getTargetParagraphId: () => 'p2',
                },
                {
                    getId: () => 'c2',
                    getTitle: () => 'Zepsuty link',
                    getTargetParagraphId: () => 'non_existing',
                },
                {
                    getId: () => 'c3',
                    getTitle: () => 'Wracaj do siebie',
                    getTargetParagraphId: () => 'p1',
                },
            ],
        }

        const mockP2 = {
            getId: () => 'p2',
            getTitle: () => 'Las',
            getIsStart: () => false,
            getChoices: () => [], // dead end
        }

        const mockP3Orphan = {
            getId: () => 'p3',
            getTitle: () => 'Sekretna jaskinia',
            getIsStart: () => false,
            getChoices: () => [
                {
                    getId: () => 'c4',
                    getTitle: () => 'Do lasu',
                    getTargetParagraphId: () => 'p2',
                },
            ],
        }

        const report = validateStoryGraph({
            projectData: {
                projectParagraphs: [mockP1, mockP2, mockP3Orphan],
            },
        })

        expect(report.isValid).toBe(false) // has broken link error
        expect(report.errorCount).toBe(1) // broken link
        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Błędny cel przeskoku'))
        ).toBe(true)
        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Martwy zaułek'))
        ).toBe(true)
        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Osierocony paragraf'))
        ).toBe(true)
        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Pętla do samego siebie'))
        ).toBe(true)
    })

    it('reports clean valid status when all links and paths are sound with valid ending', () => {
        const mockP1 = {
            getId: () => 'p1',
            getTitle: () => 'Start',
            getIsStart: () => true,
            getIsEnd: () => false,
            getChoices: () => [
                {
                    getId: () => 'c1',
                    getTitle: () => 'Dalej',
                    getTargetParagraphId: () => 'p2',
                },
            ],
        }

        const mockP2 = {
            getId: () => 'p2',
            getTitle: () => 'Finał',
            getIsStart: () => false,
            getIsEnd: () => true,
            getChoices: () => [],
        }

        const report = validateStoryGraph({
            projectData: {
                projectParagraphs: [mockP1, mockP2],
            },
        })

        expect(report.isValid).toBe(true)
        expect(report.errorCount).toBe(0)
        expect(report.warningCount).toBe(0)
        expect(report.issuesCount).toBe(0)
    })

    it('detects narrative loops between paragraphs and reports them for author awareness', () => {
        const mockP1 = {
            getId: () => 'p1',
            getTitle: () => 'Plac miejski',
            getIsStart: () => true,
            getChoices: () => [
                {
                    getId: () => 'c1',
                    getTitle: () => 'Idź do tawerny',
                    getTargetParagraphId: () => 'p2',
                },
            ],
        }

        const mockP2 = {
            getId: () => 'p2',
            getTitle: () => 'Tawerna',
            getIsStart: () => false,
            getChoices: () => [
                {
                    getId: () => 'c2',
                    getTitle: () => 'Wróć na plac',
                    getTargetParagraphId: () => 'p1',
                },
            ],
        }

        const report = validateStoryGraph({
            projectData: {
                projectParagraphs: [mockP1, mockP2],
            },
        })

        expect(report.isValid).toBe(true)
        expect(report.errorCount).toBe(0)
        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Wykryto pętlę w grafie'))
        ).toBe(true)
    })

    it('validates isEnd paragraphs: 0 choices is valid ending, choices present triggers info', () => {
        const mockEndWithChoices = {
            getId: () => 'end1',
            getTitle: () => 'Epilog Nowa Gra+',
            getIsStart: () => false,
            getIsEnd: () => true,
            getChoices: () => [
                {
                    getId: () => 'c_ng',
                    getTitle: () => 'Zacznij od nowa',
                    getTargetParagraphId: () => 'end1',
                },
            ],
        }

        const mockStart = {
            getId: () => 'start',
            getTitle: () => 'Start',
            getIsStart: () => true,
            getChoices: () => [
                {
                    getId: () => 'c_to_end',
                    getTitle: () => 'Do epilogu',
                    getTargetParagraphId: () => 'end1',
                },
            ],
        }

        const report = validateStoryGraph({
            projectData: {
                projectParagraphs: [mockStart, mockEndWithChoices],
            },
        })

        expect(
            report.issues.some((i: { title: string }) => i.title.includes('Zakończenie z wyborami'))
        ).toBe(true)
    })
})
