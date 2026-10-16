/**
 * Graph Validation Service.
 *
 * Domain service providing structural and semantic analysis of story graphs:
 * 1. Entry & termination verification (start and end nodes)
 * 2. Dead-end & broken target detection
 * 3. Self-loops & multi-node cycle analysis (distinguishing deadlocks from navigable loops)
 * 4. True reachability analysis (BFS from start node identifying both zero-indegree orphans and disconnected islands)
 * 5. Scene initial node & choice condition integrity
 * 6. Multilingual reporting with i18n support
 */

import { t, TranslationKey } from '../Utils/translate'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export type ValidationErrorCode =
    | 'NO_PARAGRAPHS'
    | 'NO_START'
    | 'MULTIPLE_STARTS'
    | 'NO_END'
    | 'END_HAS_CHOICES'
    | 'DEAD_END'
    | 'BROKEN_LINK'
    | 'SELF_LOOP'
    | 'ORPHAN_NODE'
    | 'UNREACHABLE_ISLAND'
    | 'CYCLE_DEADLOCK'
    | 'CYCLE_LOOP'
    | 'INVALID_CONDITION_ENTITY'
    | 'INVALID_SCENE_INITIAL'

export interface IGraphValidationIssue {
    code: ValidationErrorCode
    /** Severity level of the issue */
    severity: ValidationSeverity
    /** Backward-compatible alias for severity */
    type: ValidationSeverity
    title: string
    description: string
    paragraphId?: string
    targetId?: string
    cycleIds?: string[]
    sceneId?: string
    entityType?: string
    entityId?: string
}

export interface IGraphValidationReport {
    isValid: boolean
    issuesCount: number
    errorCount: number
    warningCount: number
    infoCount: number
    issues: IGraphValidationIssue[]
    nodeIssueMap: Map<string, ValidationSeverity[]>
}

export interface IGraphValidationInput {
    paragraphs?: any[]
    scenes?: any[]
    items?: any[]
    stats?: any[]
    skills?: any[]
    characters?: any[]
}

/**
 * Resolves a localized message, falling back to a Polish default string.
 */
function translateWithFallback(
    key: TranslationKey,
    options: Record<string, unknown> | undefined,
    fallbackText: string
): string {
    try {
        const translated = t(key, options)
        if (translated && translated !== key) {
            return translated
        }
    } catch {
        // Fall back gracefully in non-UI environments
    }

    let result = fallbackText
    if (options) {
        for (const [k, v] of Object.entries(options)) {
            result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
            result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
    }
    return result
}

export class GraphValidationService {
    /**
     * Extracts an array of paragraphs from various context or payload structures.
     */
    public static extractParagraphs(input: unknown): any[] {
        if (!input) return []
        if (Array.isArray(input)) return input

        const typed = input as Record<string, any>
        if (Array.isArray(typed.paragraphs)) return typed.paragraphs
        if (Array.isArray(typed.projectParagraphs)) return typed.projectParagraphs
        if (typed.projectData && Array.isArray(typed.projectData.projectParagraphs)) {
            return typed.projectData.projectParagraphs
        }
        if (typed.project && Array.isArray(typed.project.paragraphs)) {
            return typed.project.paragraphs
        }
        return []
    }

    /**
     * Extracts scenes from various context or payload structures.
     */
    public static extractScenes(input: unknown): any[] {
        if (!input) return []
        const typed = input as Record<string, any>
        if (Array.isArray(typed.scenes)) return typed.scenes
        if (Array.isArray(typed.projectScenes)) return typed.projectScenes
        if (typed.projectData && Array.isArray(typed.projectData.projectScenes)) {
            return typed.projectData.projectScenes
        }
        if (typed.project && Array.isArray(typed.project.scenes)) {
            return typed.project.scenes
        }
        return []
    }

    /**
     * Resolves the string identifier for a paragraph or entity.
     */
    public static resolveId(item: any): string {
        if (!item) return ''
        if (typeof item.getId === 'function') return item.getId() || ''
        if (typeof item.id === 'string') return item.id
        return ''
    }

    /**
     * Resolves human-readable title or name of a paragraph.
     */
    public static resolveTitle(item: any, fallbackId: string = ''): string {
        if (!item) return fallbackId
        if (typeof item.getTitle === 'function') return item.getTitle() || fallbackId
        if (typeof item.getName === 'function') return item.getName() || fallbackId
        if (typeof item.title === 'string' && item.title) return item.title
        if (typeof item.name === 'string' && item.name) return item.name
        return fallbackId
    }

    /**
     * Resolves whether a paragraph is marked as a starting node.
     */
    public static isStartNode(item: any): boolean {
        if (!item) return false
        if (typeof item.getIsStart === 'function') return Boolean(item.getIsStart())
        return Boolean(item.isStart)
    }

    /**
     * Resolves whether a paragraph is marked as an ending node.
     */
    public static isEndNode(item: any): boolean {
        if (!item) return false
        if (typeof item.getIsEnd === 'function') return Boolean(item.getIsEnd())
        return Boolean(item.isEnd)
    }

    /**
     * Resolves outgoing choices and combat outcome transitions for a paragraph.
     */
    public static resolveChoices(item: any): any[] {
        if (!item) return []
        let rawChoices: any[] = []
        if (typeof item.getChoices === 'function') {
            const res = item.getChoices()
            rawChoices = Array.isArray(res) ? [...res] : []
        } else if (Array.isArray(item.choices)) {
            rawChoices = [...item.choices]
        }

        // Include combat outcomes as transitions if combat is enabled
        const hasCombat =
            typeof item.getHasCombat === 'function' ? item.getHasCombat() : item.hasCombat
        if (hasCombat) {
            const combat = typeof item.getCombat === 'function' ? item.getCombat() : item.combat
            const outcomes =
                combat && typeof combat.getOutcomes === 'function'
                    ? combat.getOutcomes()
                    : combat?.outcomes
            if (Array.isArray(outcomes)) {
                outcomes.forEach((outcome: any) => {
                    if (!outcome) return
                    const outcomeId = outcome.id || ''
                    const outcomeName = outcome.name || 'Wynik walki'
                    const targetId =
                        outcome.targetParagraphId || outcome.targetId || outcome.toParagraphId || ''

                    // Check if a choice already exists with this exact outcome ID
                    const existingChoice = rawChoices.find((ch: any) => {
                        const chId = typeof ch.getId === 'function' ? ch.getId() : ch.id
                        return chId && outcomeId && chId === outcomeId
                    })

                    if (existingChoice) {
                        if (typeof existingChoice === 'object') {
                            existingChoice.isCombatOutcome = true
                        }
                    } else {
                        rawChoices.push({
                            id: outcomeId || `outcome_${outcomeName}_${targetId}`,
                            name: outcomeName,
                            title: outcomeName,
                            targetParagraphId: targetId,
                            toParagraphId: targetId,
                            targetId: targetId,
                            isCombatOutcome: true,
                        })
                    }
                })
            }
        }

        return rawChoices
    }

    /**
     * Resolves the target paragraph ID from a choice.
     */
    public static resolveChoiceTarget(choice: any): string {
        if (!choice) return ''
        if (typeof choice.getToParagraphId === 'function') {
            const id = choice.getToParagraphId()
            if (id) return id
        }
        if (typeof choice.getTargetParagraphId === 'function') {
            const id = choice.getTargetParagraphId()
            if (id) return id
        }
        if (typeof choice.getTargetId === 'function') {
            const id = choice.getTargetId()
            if (id) return id
        }
        if (typeof choice.toParagraphId === 'string') return choice.toParagraphId
        if (typeof choice.targetParagraphId === 'string') return choice.targetParagraphId
        if (typeof choice.targetId === 'string') return choice.targetId
        return ''
    }

    /**
     * Resolves choice title or label.
     */
    public static resolveChoiceTitle(choice: any): string {
        if (!choice) return 'Przeskok'
        if (typeof choice.getName === 'function') {
            const name = choice.getName()
            if (name) return name
        }
        if (typeof choice.getTitle === 'function') {
            const title = choice.getTitle()
            if (title) return title
        }
        if (typeof choice.name === 'string' && choice.name) return choice.name
        if (typeof choice.title === 'string' && choice.title) return choice.title
        return 'Przeskok'
    }

    /**
     * Validates the narrative story graph.
     *
     * @param {unknown} input Application Context, Project, or list of Paragraphs
     * @returns {IGraphValidationReport}
     */
    public static validateStoryGraph(input: unknown): IGraphValidationReport {
        const paragraphs = this.extractParagraphs(input)
        const scenes = this.extractScenes(input)

        const paragraphMap = new Map<string, any>()
        paragraphs.forEach(p => {
            const id = this.resolveId(p)
            if (id) {
                paragraphMap.set(id, p)
            }
        })

        const issues: IGraphValidationIssue[] = []

        // 1. Sprawdzenie pustego projektu
        if (paragraphs.length === 0) {
            const issue: IGraphValidationIssue = {
                code: 'NO_PARAGRAPHS',
                severity: 'error',
                type: 'error',
                title: translateWithFallback(
                    'validation.no_paragraphs_title' as TranslationKey,
                    undefined,
                    'Brak paragrafów w projekcie'
                ),
                description: translateWithFallback(
                    'validation.no_paragraphs_desc' as TranslationKey,
                    undefined,
                    'Projekt nie posiada jeszcze żadnych paragrafów. Utwórz pierwszy paragraf, aby zbudować fabułę.'
                ),
            }
            return {
                isValid: false,
                issuesCount: 1,
                errorCount: 1,
                warningCount: 0,
                infoCount: 0,
                issues: [issue],
                nodeIssueMap: new Map(),
            }
        }

        // 2. Paragraf początkowy (start)
        const startParagraphs = paragraphs.filter(p => this.isStartNode(p))
        if (startParagraphs.length === 0) {
            issues.push({
                code: 'NO_START',
                severity: 'warning',
                type: 'warning',
                title: translateWithFallback(
                    'validation.no_start_title' as TranslationKey,
                    undefined,
                    'Brak wyznaczonego paragrafu startowego'
                ),
                description: translateWithFallback(
                    'validation.no_start_desc' as TranslationKey,
                    undefined,
                    'Żaden paragraf nie jest oznaczony flagą początkową. Gra rozpocznie się od pierwszego paragrafu na liście.'
                ),
                paragraphId: this.resolveId(paragraphs[0]),
            })
        } else if (startParagraphs.length > 1) {
            issues.push({
                code: 'MULTIPLE_STARTS',
                severity: 'warning',
                type: 'warning',
                title: translateWithFallback(
                    'validation.multiple_starts_title' as TranslationKey,
                    undefined,
                    'Wielokrotny paragraf startowy'
                ),
                description: translateWithFallback(
                    'validation.multiple_starts_desc' as TranslationKey,
                    { count: startParagraphs.length },
                    `Wykryto ${startParagraphs.length} paragrafów oznaczonych jako startowe. Zalecany jest dokładnie jeden punkt wejścia.`
                ),
                paragraphId: this.resolveId(startParagraphs[0]),
            })
        }

        // 3. Paragrafy końcowe (isEnd)
        const endParagraphs = paragraphs.filter(p => this.isEndNode(p))
        if (paragraphs.length > 1 && endParagraphs.length === 0) {
            issues.push({
                code: 'NO_END',
                severity: 'info',
                type: 'info',
                title: translateWithFallback(
                    'validation.no_end_title' as TranslationKey,
                    undefined,
                    'Brak zdefiniowanego zakończenia'
                ),
                description: translateWithFallback(
                    'validation.no_end_desc' as TranslationKey,
                    undefined,
                    'Projekt nie posiada żadnego paragrafu oznaczonego jako koniec opowieści. Możesz oznaczyć paragraf finałowy w panelu właściwości.'
                ),
            })
        }

        // Przygotowanie struktur grafowych
        const incomingCount = new Map<string, number>()
        const adj = new Map<string, string[]>()
        paragraphs.forEach(p => {
            const pId = this.resolveId(p)
            incomingCount.set(pId, 0)
            adj.set(pId, [])
        })

        // 4. Przeskoki, błędne cele, ślepe zaułki i pętle własne
        paragraphs.forEach(p => {
            const pId = this.resolveId(p)
            const pTitle = this.resolveTitle(p, pId)
            const choices = this.resolveChoices(p)
            const isEnd = this.isEndNode(p)

            if (choices.length === 0) {
                if (!isEnd) {
                    const hasCombat =
                        typeof p.getHasCombat === 'function' ? p.getHasCombat() : p.hasCombat
                    issues.push({
                        code: 'DEAD_END',
                        severity: 'warning',
                        type: 'warning',
                        title: translateWithFallback(
                            'validation.dead_end_title' as TranslationKey,
                            { title: pTitle },
                            `Martwy zaułek (ślepy zaułek): „${pTitle}”`
                        ),
                        description: hasCombat
                            ? `Paragraf zawiera walkę, lecz nie zdefiniowano w niej żadnych wyników starcia ani przeskoków prowadzących dalej.`
                            : translateWithFallback(
                                  'validation.dead_end_desc' as TranslationKey,
                                  undefined,
                                  'Paragraf nie posiada żadnych wyborów/przeskoków i nie jest oznaczony jako zakończenie gry (finał). Jeśli jest to koniec historii, oznacz go flagą końca.'
                              ),
                        paragraphId: pId,
                    })
                }
            } else if (isEnd) {
                issues.push({
                    code: 'END_HAS_CHOICES',
                    severity: 'info',
                    type: 'info',
                    title: translateWithFallback(
                        'validation.end_has_choices_title' as TranslationKey,
                        { title: pTitle },
                        `Zakończenie z wyborami: „${pTitle}”`
                    ),
                    description: translateWithFallback(
                        'validation.end_has_choices_desc' as TranslationKey,
                        { title: pTitle },
                        `Paragraf „${pTitle}” jest oznaczony jako koniec opowieści, ale posiada zdefiniowane wybory wychodzące.`
                    ),
                    paragraphId: pId,
                })
            }

            choices.forEach(ch => {
                const targetId = this.resolveChoiceTarget(ch)
                const chTitle = this.resolveChoiceTitle(ch)
                const isCombatOutcome = Boolean(ch.isCombatOutcome)

                if (!targetId || !paragraphMap.has(targetId)) {
                    issues.push({
                        code: 'BROKEN_LINK',
                        severity: 'error',
                        type: 'error',
                        title: translateWithFallback(
                            'validation.broken_link_title' as TranslationKey,
                            { title: pTitle },
                            isCombatOutcome
                                ? `Błędny cel wyniku walki w: „${pTitle}”`
                                : `Błędny cel przeskoku w: „${pTitle}”`
                        ),
                        description: isCombatOutcome
                            ? `Wynik walki „${chTitle}” prowadzi do nieistniejącego paragrafu (ID: ${targetId || 'puste'}).`
                            : translateWithFallback(
                                  'validation.broken_link_desc' as TranslationKey,
                                  { choice: chTitle, targetId: targetId || 'puste' },
                                  `Wybór „${chTitle}” prowadzi do nieistniejącego paragrafu (ID: ${targetId || 'puste'}).`
                              ),
                        paragraphId: pId,
                        targetId,
                    })
                } else {
                    incomingCount.set(targetId, (incomingCount.get(targetId) || 0) + 1)
                    adj.get(pId)!.push(targetId)

                    if (targetId === pId) {
                        issues.push({
                            code: 'SELF_LOOP',
                            severity: 'warning',
                            type: 'warning',
                            title: translateWithFallback(
                                'validation.self_loop_title' as TranslationKey,
                                { title: pTitle },
                                `Pętla do samego siebie: „${pTitle}”`
                            ),
                            description: isCombatOutcome
                                ? `Wynik walki „${chTitle}” prowadzi do tego samego paragrafu, z którego wychodzi.`
                                : translateWithFallback(
                                      'validation.self_loop_desc' as TranslationKey,
                                      { choice: chTitle },
                                      `Wybór „${chTitle}” prowadzi do tego samego paragrafu, z którego wychodzi.`
                                  ),
                            paragraphId: pId,
                            cycleIds: [pId, pId],
                        })
                    }
                }
            })
        })

        // 5. Analiza osiągalności grafu (BFS Reachability Traversal from Start)
        const primaryStartId = this.resolveId(startParagraphs[0]) || this.resolveId(paragraphs[0])
        const reachable = new Set<string>()

        if (primaryStartId && paragraphMap.has(primaryStartId)) {
            const queue: string[] = [primaryStartId]
            reachable.add(primaryStartId)

            while (queue.length > 0) {
                const currentId = queue.shift()!
                const targets = adj.get(currentId) || []
                for (const targetId of targets) {
                    if (!reachable.has(targetId) && paragraphMap.has(targetId)) {
                        reachable.add(targetId)
                        queue.push(targetId)
                    }
                }
            }
        }

        // Klasyfikacja nieosiągalnych: osierocone (in-degree === 0) vs odcięte wyspy (in-degree > 0)
        paragraphs.forEach(p => {
            const pId = this.resolveId(p)
            if (pId !== primaryStartId && !reachable.has(pId)) {
                const pTitle = this.resolveTitle(p, pId)
                const inDegree = incomingCount.get(pId) || 0

                if (inDegree === 0) {
                    issues.push({
                        code: 'ORPHAN_NODE',
                        severity: 'warning',
                        type: 'warning',
                        title: translateWithFallback(
                            'validation.orphan_node_title' as TranslationKey,
                            { title: pTitle },
                            `Osierocony paragraf: „${pTitle}”`
                        ),
                        description: translateWithFallback(
                            'validation.orphan_node_desc' as TranslationKey,
                            undefined,
                            'Do tego paragrafu nie prowadzi żaden wybór z innych węzłów. Gracz nie będzie w stanie do niego dotrzeć.'
                        ),
                        paragraphId: pId,
                    })
                } else {
                    issues.push({
                        code: 'UNREACHABLE_ISLAND',
                        severity: 'warning',
                        type: 'warning',
                        title: translateWithFallback(
                            'validation.unreachable_island_title' as TranslationKey,
                            { title: pTitle },
                            `Odcięta wyspa (nieosiągalny podgraf): „${pTitle}”`
                        ),
                        description: translateWithFallback(
                            'validation.unreachable_island_desc' as TranslationKey,
                            undefined,
                            'Paragraf należy do grupy węzłów, do których nie ma żadnej ścieżki z paragrafu startowego.'
                        ),
                        paragraphId: pId,
                    })
                }
            }
        })

        // 6. Wykrywanie pętli i cykli w grafie (DFS cycle detection)
        const visited = new Set<string>()
        const onStack = new Set<string>()
        const stack: string[] = []
        const detectedCycleSignatures = new Set<string>()

        function getCanonicalCycleKey(cycleNodes: string[]): string {
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

        function detectCycles(nodeId: string): void {
            visited.add(nodeId)
            onStack.add(nodeId)
            stack.push(nodeId)

            const targets = adj.get(nodeId) || []
            for (const targetId of targets) {
                if (targetId === nodeId) {
                    // Pętla do samego siebie obsłużona wcześniej
                    continue
                }
                if (onStack.has(targetId)) {
                    const cycleStartIdx = stack.indexOf(targetId)
                    if (cycleStartIdx !== -1) {
                        const cycleNodes = stack.slice(cycleStartIdx)
                        const sig = getCanonicalCycleKey(cycleNodes)
                        if (!detectedCycleSignatures.has(sig)) {
                            detectedCycleSignatures.add(sig)

                            const fullCyclePath = [...cycleNodes, targetId]
                            const cycleTitles = fullCyclePath.map(id => {
                                const node = paragraphMap.get(id)
                                return GraphValidationService.resolveTitle(node, id)
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

                            const pathStr = cycleTitles.join(' → ')
                            if (hasExit) {
                                issues.push({
                                    code: 'CYCLE_LOOP',
                                    severity: 'info',
                                    type: 'info',
                                    title: translateWithFallback(
                                        'validation.cycle_loop_title' as TranslationKey,
                                        { path: pathStr },
                                        `Wykryto pętlę w grafie: ${pathStr}`
                                    ),
                                    description: translateWithFallback(
                                        'validation.cycle_loop_desc' as TranslationKey,
                                        { path: pathStr },
                                        `Wykryto obieg fabularny pomiędzy paragrafami: ${pathStr}. Gracze mogą powrócić do wcześniejszego węzła (pętla posiada wyjście).`
                                    ),
                                    paragraphId: cycleNodes[0],
                                    cycleIds: fullCyclePath,
                                })
                            } else {
                                issues.push({
                                    code: 'CYCLE_DEADLOCK',
                                    severity: 'warning',
                                    type: 'warning',
                                    title: translateWithFallback(
                                        'validation.cycle_deadlock_title' as TranslationKey,
                                        { path: pathStr },
                                        `Wykryto pętlę w grafie (brak wyjścia): ${pathStr}`
                                    ),
                                    description: translateWithFallback(
                                        'validation.cycle_deadlock_desc' as TranslationKey,
                                        { path: pathStr },
                                        `Wykryto zapętlenie bez wyjścia pomiędzy paragrafami: ${pathStr}. Gracze nie będą mogli opuścić tego cyklu.`
                                    ),
                                    paragraphId: cycleNodes[0],
                                    cycleIds: fullCyclePath,
                                })
                            }
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
            const id = this.resolveId(p)
            if (id && !visited.has(id)) {
                detectCycles(id)
            }
        })

        // 7. Spójność scen (Scene Integrity)
        if (scenes.length > 0) {
            scenes.forEach(scene => {
                const sId = this.resolveId(scene)
                const sName = this.resolveTitle(scene, sId || 'Scena')
                const initialPId =
                    (typeof scene.getInitialParagraphId === 'function' &&
                        scene.getInitialParagraphId()) ||
                    scene.initialParagraphId ||
                    ''

                if (initialPId && !paragraphMap.has(initialPId)) {
                    issues.push({
                        code: 'INVALID_SCENE_INITIAL',
                        severity: 'error',
                        type: 'error',
                        title: translateWithFallback(
                            'validation.invalid_scene_initial_title' as TranslationKey,
                            { scene: sName },
                            `Błędny start sceny: „${sName}”`
                        ),
                        description: translateWithFallback(
                            'validation.invalid_scene_initial_desc' as TranslationKey,
                            { targetId: initialPId },
                            `Scena wskazuje na nieistniejący paragraf początkowy (ID: ${initialPId}).`
                        ),
                        sceneId: sId,
                        targetId: initialPId,
                    })
                }
            })
        }

        // 8. Mapa problemów per węzeł (do wykorzystania w widoku StoryGraph / node styling)
        const nodeIssueMap = new Map<string, ValidationSeverity[]>()
        issues.forEach(issue => {
            if (issue.paragraphId) {
                const list = nodeIssueMap.get(issue.paragraphId) || []
                list.push(issue.severity)
                nodeIssueMap.set(issue.paragraphId, list)
            }
        })

        const errorCount = issues.filter(i => i.severity === 'error').length
        const warningCount = issues.filter(i => i.severity === 'warning').length
        const infoCount = issues.filter(i => i.severity === 'info').length

        return {
            isValid: errorCount === 0,
            issuesCount: issues.length,
            errorCount,
            warningCount,
            infoCount,
            issues,
            nodeIssueMap,
        }
    }
}
