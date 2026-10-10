/**
 * Graph Validation Engine for SilnikGierParagrafowych.
 *
 * Checks gamebook structural integrity:
 * 1. Missing or multiple start paragraphs
 * 2. Orphaned paragraphs (no incoming jumps)
 * 3. Dead-ends (no outgoing choices/jumps)
 * 4. Broken target references (jumps pointing to non-existent paragraph IDs)
 * 5. Self-loops (jumps pointing to the same paragraph)
 */

/**
 * @typedef {object} ValidationIssue
 * @property {'error' | 'warning'} type
 * @property {string} title
 * @property {string} description
 * @property {string} [paragraphId]
 * @property {string} [targetId]
 */

/**
 * @typedef {object} ValidationReport
 * @property {boolean} isValid
 * @property {number} issuesCount
 * @property {number} errorCount
 * @property {number} warningCount
 * @property {ValidationIssue[]} issues
 */

/**
 * Validates the project story graph structure.
 *
 * @param {object} ctx Application Context
 * @returns {ValidationReport}
 */
export function validateStoryGraph(ctx) {
    const paragraphs = ctx?.projectData?.projectParagraphs || []
    const paragraphMap = new Map()

    paragraphs.forEach(p => {
        if (p && typeof p.getId === 'function') {
            paragraphMap.set(p.getId(), p)
        }
    })

    const issues = []

    if (paragraphs.length === 0) {
        return {
            isValid: false,
            issuesCount: 1,
            errorCount: 1,
            warningCount: 0,
            issues: [
                {
                    type: 'error',
                    title: 'Brak paragrafów w projekcie',
                    description:
                        'Projekt nie posiada jeszcze żadnych paragrafów. Utwórz pierwszy paragraf, aby zbudować fabułę.',
                },
            ],
        }
    }

    // 1. Sprawdź węzeł początkowy (start paragraph)
    const startParagraphs = paragraphs.filter(
        p => (typeof p.getIsStart === 'function' && p.getIsStart()) || p.isStart === true
    )

    if (startParagraphs.length === 0) {
        issues.push({
            type: 'warning',
            title: 'Brak wyznaczonego paragrafu startowego',
            description:
                'Żaden paragraf nie jest oznaczony flagą początkową. Gra rozpocznie się od pierwszego paragrafu na liście.',
            paragraphId: paragraphs[0]?.getId(),
        })
    } else if (startParagraphs.length > 1) {
        issues.push({
            type: 'warning',
            title: 'Wielokrotny paragraf startowy',
            description: `Wykryto ${startParagraphs.length} paragrafów oznaczonych jako startowe. Zalecany jest dokładnie jeden punkt wejścia.`,
            paragraphId: startParagraphs[0]?.getId(),
        })
    }

    // Zbuduj licznik krawędzi wchodzących (in-degree)
    const incomingCount = new Map()
    paragraphs.forEach(p => incomingCount.set(p.getId(), 0))

    // 2. Sprawdź przeskoki, błędy celów i martwe zakończenia
    paragraphs.forEach(p => {
        const pId = p.getId()
        const pTitle = p.getTitle ? p.getTitle() : p.getName ? p.getName() : pId
        const choices = (p.getChoices ? p.getChoices() : []) || []

        if (choices.length === 0) {
            issues.push({
                type: 'warning',
                title: `Martwy zaułek: „${pTitle}”`,
                description: `Paragraf nie posiada żadnych wyborów/przeskoków. Jeśli nie jest to finał gry, dodaj przeskoki.`,
                paragraphId: pId,
            })
        }

        choices.forEach(ch => {
            const targetId = ch.getTargetParagraphId ? ch.getTargetParagraphId() : ''
            const chTitle = ch.getTitle ? ch.getTitle() : 'Przeskok'

            if (!targetId || !paragraphMap.has(targetId)) {
                issues.push({
                    type: 'error',
                    title: `Błędny cel przeskoku w: „${pTitle}”`,
                    description: `Wybór „${chTitle}” prowadzi do nieistniejącego paragrafu (ID: ${targetId || 'puste'}).`,
                    paragraphId: pId,
                    targetId,
                })
            } else {
                incomingCount.set(targetId, (incomingCount.get(targetId) || 0) + 1)

                if (targetId === pId) {
                    issues.push({
                        type: 'warning',
                        title: `Pętla do samego siebie: „${pTitle}”`,
                        description: `Wybór „${chTitle}” prowadzi do tego samego paragrafu, z którego wychodzi.`,
                        paragraphId: pId,
                    })
                }
            }
        })
    })

    // 3. Osierocone paragrafy (brak wejść)
    const primaryStartId = startParagraphs[0]?.getId() || paragraphs[0]?.getId()
    paragraphs.forEach(p => {
        const pId = p.getId()
        if (pId !== primaryStartId && (incomingCount.get(pId) || 0) === 0) {
            const pTitle = p.getTitle ? p.getTitle() : p.getName ? p.getName() : pId
            issues.push({
                type: 'warning',
                title: `Osierocony paragraf: „${pTitle}”`,
                description: `Do tego paragrafu nie prowadzi żaden wybór z innych węzłów. Gracz nie będzie w stanie do niego dotrzeć.`,
                paragraphId: pId,
            })
        }
    })

    const errorCount = issues.filter(i => i.type === 'error').length
    const warningCount = issues.filter(i => i.type === 'warning').length

    return {
        isValid: errorCount === 0,
        issuesCount: issues.length,
        errorCount,
        warningCount,
        issues,
    }
}
