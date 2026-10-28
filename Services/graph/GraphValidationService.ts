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

import { t, TranslationKey } from '../../Utils/translate'
import { EntityAccessor } from '../helpers/EntityAccessor'

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
    paragraphs?: unknown[]
    scenes?: unknown[]
    items?: unknown[]
    stats?: unknown[]
    skills?: unknown[]
    characters?: unknown[]
}

export interface IGraphTransitionLike {
    getId?: () => string
    id?: string
    getName?: () => string
    name?: string
    getTitle?: () => string
    title?: string
    getToParagraphId?: () => string
    toParagraphId?: string
    getTargetParagraphId?: () => string
    targetParagraphId?: string
    getTargetId?: () => string
    targetId?: string
    isCombatOutcome?: boolean
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

/**
 * Computes a canonical rotation signature for a cycle so the same cycle is only reported once.
 */
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

export class GraphValidationService {
    /**
     * Extracts an array of paragraphs from various context or payload structures.
     */
    public static extractParagraphs(input: unknown): unknown[] {
        if (!input) return []
        if (Array.isArray(input)) return input
        return EntityAccessor.normalizeScope(input).paragraphs
    }

    /**
     * Extracts scenes from various context or payload structures.
     */
    public static extractScenes(input: unknown): unknown[] {
        if (!input || Array.isArray(input)) return []
        return EntityAccessor.normalizeScope(input).scenes
    }

    /**
     * Resolves the string identifier for a paragraph or entity.
     */
    public static resolveId(item: unknown): string {
        return EntityAccessor.getId(item)
    }

    /**
     * Resolves human-readable title or name of a paragraph.
     */
    public static resolveTitle(item: unknown, fallbackId: string = ''): string {
        return EntityAccessor.getTitleOrName(item, fallbackId)
    }

    /**
     * Resolves whether a paragraph is marked as a starting node.
     */
    public static isStartNode(item: unknown): boolean {
        if (!item || typeof item !== 'object') return false
        const rec = item as Record<string, unknown>
        if (typeof rec.getIsStart === 'function') {
            return Boolean((rec.getIsStart as () => unknown)())
        }
        return Boolean(rec.isStart)
    }

    /**
     * Resolves whether a paragraph is marked as an ending node.
     */
    public static isEndNode(item: unknown): boolean {
        if (!item || typeof item !== 'object') return false
        const rec = item as Record<string, unknown>
        if (typeof rec.getIsEnd === 'function') {
            return Boolean((rec.getIsEnd as () => unknown)())
        }
        return Boolean(rec.isEnd)
    }

    /**
     * Resolves whether a paragraph has combat enabled.
     */
    private static hasCombatEnabled(item: unknown): boolean {
        if (!item || typeof item !== 'object') return false
        const rec = item as Record<string, unknown>
        if (typeof rec.getHasCombat === 'function') {
            return Boolean((rec.getHasCombat as () => unknown)())
        }
        return Boolean(rec.hasCombat)
    }

    /**
     * Resolves outgoing choices and combat outcome transitions for a paragraph
     * without mutating the underlying choice objects.
     */
    public static resolveChoices(item: unknown): IGraphTransitionLike[] {
        if (!item || typeof item !== 'object') return []
        const rec = item as Record<string, unknown>

        let rawChoices: IGraphTransitionLike[] = []
        if (typeof rec.getChoices === 'function') {
            const res = (rec.getChoices as () => unknown)()
            rawChoices = Array.isArray(res) ? [...(res as IGraphTransitionLike[])] : []
        } else if (Array.isArray(rec.choices)) {
            rawChoices = [...(rec.choices as IGraphTransitionLike[])]
        }

        if (this.hasCombatEnabled(item)) {
            const combat = (
                typeof rec.getCombat === 'function'
                    ? (rec.getCombat as () => unknown)()
                    : rec.combat
            ) as Record<string, unknown> | null | undefined

            const outcomes =
                combat && typeof combat.getOutcomes === 'function'
                    ? (combat.getOutcomes as () => unknown)()
                    : combat?.outcomes

            if (Array.isArray(outcomes)) {
                outcomes.forEach((rawOutcome: unknown) => {
                    if (!rawOutcome || typeof rawOutcome !== 'object') return
                    const outcome = rawOutcome as Record<string, unknown>
                    const outcomeId = typeof outcome.id === 'string' ? outcome.id : ''
                    const outcomeName =
                        typeof outcome.name === 'string' && outcome.name
                            ? outcome.name
                            : 'Wynik walki'
                    const targetId = String(
                        outcome.targetParagraphId || outcome.targetId || outcome.toParagraphId || ''
                    )

                    // Check if a choice already exists with this exact outcome ID
                    const existingIdx = rawChoices.findIndex(ch => {
                        const chId = EntityAccessor.getId(ch)
                        return Boolean(chId && outcomeId && chId === outcomeId)
                    })

                    if (existingIdx !== -1) {
                        const orig = rawChoices[existingIdx]
                        rawChoices[existingIdx] = {
                            getId: (): string => EntityAccessor.getId(orig),
                            getName: (): string => this.resolveChoiceTitle(orig),
                            getToParagraphId: (): string => this.resolveChoiceTarget(orig),
                            isCombatOutcome: true,
                        }
                    } else {
                        rawChoices.push({
                            id: outcomeId || `outcome_${outcomeName}_${targetId}`,
                            name: outcomeName,
                            title: outcomeName,
                            targetParagraphId: targetId,
                            toParagraphId: targetId,
                            targetId,
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
    public static resolveChoiceTarget(choice: unknown): string {
        if (!choice || typeof choice !== 'object') return ''
        const rec = choice as IGraphTransitionLike

        if (typeof rec.getToParagraphId === 'function') {
            const id = rec.getToParagraphId()
            if (id) return id
        }
        if (typeof rec.getTargetParagraphId === 'function') {
            const id = rec.getTargetParagraphId()
            if (id) return id
        }
        if (typeof rec.getTargetId === 'function') {
            const id = rec.getTargetId()
            if (id) return id
        }
        if (typeof rec.toParagraphId === 'string') return rec.toParagraphId
        if (typeof rec.targetParagraphId === 'string') return rec.targetParagraphId
        if (typeof rec.targetId === 'string') return rec.targetId
        return ''
    }

    /**
     * Resolves choice title or label.
     */
    public static resolveChoiceTitle(choice: unknown): string {
        if (!choice || typeof choice !== 'object') return 'Przeskok'
        return EntityAccessor.getTitleOrName(choice, 'Przeskok')
    }

    /**
     * Step 1: Validates entry (start) and termination (end) nodes.
     */
    private static validateStartAndEndNodes(
        paragraphs: unknown[],
        startParagraphs: unknown[],
        issues: IGraphValidationIssue[]
    ): void {
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
    }

    /**
     * Step 2: Builds adjacency lists, counts incoming edges, and checks dead-ends, broken links, and self-loops.
     */
    private static buildGraphAndValidateEdges(
        paragraphs: unknown[],
        paragraphMap: Map<string, unknown>,
        issues: IGraphValidationIssue[]
    ): { adj: Map<string, string[]>; incomingCount: Map<string, number> } {
        const incomingCount = new Map<string, number>()
        const adj = new Map<string, string[]>()

        paragraphs.forEach(p => {
            const pId = this.resolveId(p)
            incomingCount.set(pId, 0)
            adj.set(pId, [])
        })

        paragraphs.forEach(p => {
            const pId = this.resolveId(p)
            const pTitle = this.resolveTitle(p, pId)
            const choices = this.resolveChoices(p)
            const isEnd = this.isEndNode(p)

            if (choices.length === 0) {
                if (!isEnd) {
                    const hasCombat = this.hasCombatEnabled(p)
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

        return { adj, incomingCount }
    }

    /**
     * Step 3: Performs BFS reachability traversal from the primary start node
     * and classifies unreachable nodes into orphans (in-degree = 0) vs disconnected islands (in-degree > 0).
     */
    private static validateReachabilityBFS(
        paragraphs: unknown[],
        primaryStartId: string,
        paragraphMap: Map<string, unknown>,
        adj: Map<string, string[]>,
        incomingCount: Map<string, number>,
        issues: IGraphValidationIssue[]
    ): void {
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
    }

    /**
     * Step 4: Performs DFS cycle detection across the graph, distinguishing navigable loops from deadlocks.
     */
    private static validateCyclesDFS(
        paragraphs: unknown[],
        paragraphMap: Map<string, unknown>,
        adj: Map<string, string[]>,
        issues: IGraphValidationIssue[]
    ): void {
        const visited = new Set<string>()
        const onStack = new Set<string>()
        const stack: string[] = []
        const detectedCycleSignatures = new Set<string>()

        const detectCycles = (nodeId: string): void => {
            visited.add(nodeId)
            onStack.add(nodeId)
            stack.push(nodeId)

            const targets = adj.get(nodeId) || []
            for (const targetId of targets) {
                if (targetId === nodeId) {
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
                                return this.resolveTitle(node, id)
                            })

                            const cycleNodeSet = new Set(cycleNodes)
                            let hasExit = false
                            for (const cId of cycleNodeSet) {
                                const outTargets = adj.get(cId) || []
                                if (outTargets.some(target => !cycleNodeSet.has(target))) {
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
    }

    /**
     * Step 5: Verifies that scene initialParagraphId references point to existing paragraphs.
     */
    private static validateScenesIntegrity(
        scenes: unknown[],
        paragraphMap: Map<string, unknown>,
        issues: IGraphValidationIssue[]
    ): void {
        scenes.forEach(scene => {
            if (!scene || typeof scene !== 'object') return
            const rec = scene as Record<string, unknown>
            const sId = this.resolveId(scene)
            const sName = this.resolveTitle(scene, sId || 'Scena')
            const initialPId = String(
                (typeof rec.getInitialParagraphId === 'function' &&
                    (rec.getInitialParagraphId as () => unknown)()) ||
                    rec.initialParagraphId ||
                    ''
            )

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

    /**
     * Validates the narrative story graph.
     *
     * @param {unknown} input Application Context, Project, or list of Paragraphs
     * @returns {IGraphValidationReport}
     */
    public static validateStoryGraph(input: unknown): IGraphValidationReport {
        const paragraphs = this.extractParagraphs(input)
        const scenes = this.extractScenes(input)

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

        const paragraphMap = new Map<string, unknown>()
        paragraphs.forEach(p => {
            const id = this.resolveId(p)
            if (id) {
                paragraphMap.set(id, p)
            }
        })

        const issues: IGraphValidationIssue[] = []
        const startParagraphs = paragraphs.filter(p => this.isStartNode(p))

        // 1. Start & End nodes validation
        this.validateStartAndEndNodes(paragraphs, startParagraphs, issues)

        // 2. Build adjacency graph & validate jumps, dead-ends, broken links, self-loops
        const { adj, incomingCount } = this.buildGraphAndValidateEdges(
            paragraphs,
            paragraphMap,
            issues
        )

        // 3. BFS Reachability (Orphans & Disconnected Islands)
        const primaryStartId = this.resolveId(startParagraphs[0]) || this.resolveId(paragraphs[0])
        this.validateReachabilityBFS(
            paragraphs,
            primaryStartId,
            paragraphMap,
            adj,
            incomingCount,
            issues
        )

        // 4. DFS Cycle detection (Loops vs Deadlocks)
        this.validateCyclesDFS(paragraphs, paragraphMap, adj, issues)

        // 5. Scene Integrity
        if (scenes.length > 0) {
            this.validateScenesIntegrity(scenes, paragraphMap, issues)
        }

        // 6. Aggregate node issue map and counts
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
