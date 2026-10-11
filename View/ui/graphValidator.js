/**
 * Graph Validation Engine for SilnikGierParagrafowych.
 *
 * Checks gamebook structural integrity:
 * 1. Missing or multiple start paragraphs
 * 2. End paragraphs (isEnd) and dead-ends without exit
 * 3. General cycles and loops in the story graph (self-loops, multi-node loops)
 * 4. Orphaned / unreachable paragraphs
 * 5. Broken target references (jumps pointing to non-existent paragraph IDs)
 */

/**
 * @typedef {object} ValidationIssue
 * @property {'error' | 'warning' | 'info'} type
 * @property {string} title
 * @property {string} description
 * @property {string} [paragraphId]
 * @property {string} [targetId]
 * @property {string[]} [cycleIds]
 */

/**
 * @typedef {object} ValidationReport
 * @property {boolean} isValid
 * @property {number} issuesCount
 * @property {number} errorCount
 * @property {number} warningCount
 * @property {number} infoCount
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
            infoCount: 0,
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

    // 2. Sprawdź węzły końcowe (isEnd)
    const endParagraphs = paragraphs.filter(
        p => (typeof p.getIsEnd === 'function' && p.getIsEnd()) || p.isEnd === true
    )

    if (paragraphs.length > 1 && endParagraphs.length === 0) {
        issues.push({
            type: 'info',
            title: 'Brak zdefiniowanego zakończenia',
            description:
                'Projekt nie posiada żadnego paragrafu oznaczonego jako koniec opowieści. Możesz oznaczyć paragraf finałowy w panelu właściwości.',
        })
    }

    // Zbuduj licznik krawędzi wchodzących (in-degree) oraz listę sąsiedztwa (adjacency list)
    const incomingCount = new Map()
    const adj = new Map()
    paragraphs.forEach(p => {
        incomingCount.set(p.getId(), 0)
        adj.set(p.getId(), [])
    })

    // 3. Sprawdź przeskoki, błędy celów i martwe zakończenia / ślepe zaułki
    paragraphs.forEach(p => {
        const pId = p.getId()
        const pTitle = p.getTitle ? p.getTitle() : p.getName ? p.getName() : pId
        const choices = (p.getChoices ? p.getChoices() : []) || []
        const isEnd = (typeof p.getIsEnd === 'function' && p.getIsEnd()) || p.isEnd === true

        if (choices.length === 0) {
            if (!isEnd) {
                issues.push({
                    type: 'warning',
                    title: `Martwy zaułek (ślepy zaułek): „${pTitle}”`,
                    description: `Paragraf nie posiada żadnych wyborów/przeskoków i nie jest oznaczony jako zakończenie gry (finał). Jeśli jest to koniec historii, oznacz go flagą końca.`,
                    paragraphId: pId,
                })
            }
        } else if (isEnd) {
            issues.push({
                type: 'info',
                title: `Zakończenie z wyborami: „${pTitle}”`,
                description: `Paragraf „${pTitle}” jest oznaczony jako koniec opowieści, ale posiada zdefiniowane wybory wychodzące.`,
                paragraphId: pId,
            })
        }

        choices.forEach(ch => {
            const targetId =
                (typeof ch.getToParagraphId === 'function' && ch.getToParagraphId()) ||
                (typeof ch.getTargetParagraphId === 'function' && ch.getTargetParagraphId()) ||
                (typeof ch.getTargetId === 'function' && ch.getTargetId()) ||
                ch.toParagraphId ||
                ch.targetParagraphId ||
                ch.targetId ||
                ''
            const chTitle =
                (typeof ch.getName === 'function' && ch.getName()) ||
                (typeof ch.getTitle === 'function' && ch.getTitle()) ||
                ch.name ||
                ch.title ||
                'Przeskok'

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
                adj.get(pId).push(targetId)

                if (targetId === pId) {
                    issues.push({
                        type: 'warning',
                        title: `Pętla do samego siebie: „${pTitle}”`,
                        description: `Wybór „${chTitle}” prowadzi do tego samego paragrafu, z którego wychodzi.`,
                        paragraphId: pId,
                        cycleIds: [pId, pId],
                    })
                }
            }
        })
    })

    // 4. Osierocone paragrafy (brak wejść)
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

    // 5. Wykrywanie pętli i cykli w grafie (DFS cycle detection)
    const visited = new Set()
    const onStack = new Set()
    const stack = []
    const detectedCycleSignatures = new Set()

    function getCanonicalCycleKey(cycleNodes) {
        if (cycleNodes.length === 0) return ''
        let minIdx = 0
        for (let i = 1; i < cycleNodes.length; i++) {
            if (cycleNodes[i] < cycleNodes[minIdx]) {
                minIdx = i
            }
        }
        const rotated = [...cycleNodes.slice(minIdx), ...cycleNodes.slice(0, minIdx)]
        return rotated.join('->')
    }

    function detectCycles(nodeId) {
        visited.add(nodeId)
        onStack.add(nodeId)
        stack.push(nodeId)

        const targets = adj.get(nodeId) || []
        for (const targetId of targets) {
            if (targetId === nodeId) {
                // Self-loop is already handled above
                continue
            }
            if (onStack.has(targetId)) {
                // Detected multi-node cycle!
                const cycleStartIdx = stack.indexOf(targetId)
                if (cycleStartIdx !== -1) {
                    const cycleNodes = stack.slice(cycleStartIdx)
                    const sig = getCanonicalCycleKey(cycleNodes)
                    if (!detectedCycleSignatures.has(sig)) {
                        detectedCycleSignatures.add(sig)

                        const fullCyclePath = [...cycleNodes, targetId]
                        const cycleTitles = fullCyclePath.map(id => {
                            const node = paragraphMap.get(id)
                            return node
                                ? (node.getTitle
                                      ? node.getTitle()
                                      : node.getName
                                        ? node.getName()
                                        : id) || id
                                : id
                        })

                        // Sprawdź czy cykl posiada wyjście na zewnątrz
                        const cycleNodeSet = new Set(cycleNodes)
                        let hasExit = false
                        for (const cId of cycleNodeSet) {
                            const outTargets = adj.get(cId) || []
                            if (outTargets.some(t => !cycleNodeSet.has(t))) {
                                hasExit = true
                                break
                            }
                        }

                        issues.push({
                            type: hasExit ? 'info' : 'warning',
                            title: `Wykryto pętlę w grafie: ${cycleTitles.join(' → ')}`,
                            description: hasExit
                                ? `Wykryto obieg fabularny pomiędzy paragrafami: ${cycleTitles.join(' → ')}. Gracze mogą powrócić do wcześniejszego węzła (pętla posiada wyjście).`
                                : `Wykryto zapętlenie bez wyjścia pomiędzy paragrafami: ${cycleTitles.join(' → ')}. Gracze nie będą mogli opuścić tego cyklu.`,
                            paragraphId: cycleNodes[0],
                            cycleIds: fullCyclePath,
                        })
                    }
                }
            } else if (!visited.has(targetId)) {
                detectCycles(targetId)
            }
        }

        stack.pop()
        onStack.delete(nodeId)
    }

    paragraphs.forEach(p => {
        const id = p.getId()
        if (!visited.has(id)) {
            detectCycles(id)
        }
    })

    const errorCount = issues.filter(i => i.type === 'error').length
    const warningCount = issues.filter(i => i.type === 'warning').length
    const infoCount = issues.filter(i => i.type === 'info').length

    return {
        isValid: errorCount === 0,
        issuesCount: issues.length,
        errorCount,
        warningCount,
        infoCount,
        issues,
    }
}
