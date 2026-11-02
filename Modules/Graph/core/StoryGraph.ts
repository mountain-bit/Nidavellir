import '../nodes/ParagraphNode'
import '../nodes/SceneNode'

import { Choice } from '../../../Model/Choice'
import { ICombatOutcome } from '../../../Model/Combat'
import { Paragraph } from '../../../Model/Paragraph'
import { Scene } from '../../../Model/Scene'
import { ParagraphNode } from '../nodes/ParagraphNode'
import { SceneNode } from '../nodes/SceneNode'
import {
    calculateCurvedEdgeControlPointDistance,
    calculateEdgeSourceOffsets,
    ConnectionLineStyle,
    getStoryGraphStylesheet,
    GRAPH_THEME,
    preventChoiceLineCrossings,
} from '../styles/StoryGraphStyles'
import { IStoryGraphOptions } from '../types'

export interface ICytoscapeElementCollection {
    nonempty?: () => boolean
    empty?: () => boolean
    length?: number
    position?: (pos?: { x: number; y: number }) => { x: number; y: number }
    data?: (key?: string, val?: unknown) => unknown
    [key: string]: unknown
}

export interface ICytoscapeInstance {
    pan: (pos?: { x: number; y: number }) => { x: number; y: number }
    panBy?: (pos: { x: number; y: number }) => void
    zoom: (level?: number) => number
    center: (eles?: unknown) => void
    fit: (eles?: unknown, padding?: number) => void
    animate: (options: unknown, params?: unknown) => void
    stop?: (clearQueue?: boolean, jumpToEnd?: boolean) => void
    resize: () => void
    destroy: () => void
    nodes?: (selector?: string) => ICytoscapeElementCollection
    elements?: (selector?: string) => ICytoscapeElementCollection
    on: (events: string, selectorOrHandler: unknown, handler?: unknown) => void
    removeListener: (events: string, handler: unknown) => void
    getElementById: (id: string) =>
        | {
              position: (pos?: { x: number; y: number }) => { x: number; y: number }
              data: (key?: string, val?: unknown) => unknown
              length?: number
              nonempty?: () => boolean
              empty?: () => boolean
          }
        | undefined
    style: (newStyle?: unknown) => void
}

declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        cytoscape?: (options?: unknown) => ICytoscapeInstance
        cyInstance?: ICytoscapeInstance | null
    }
}

export class StoryGraph {
    private canvasContainer: HTMLElement
    private nodesLayer: HTMLElement
    private options: IStoryGraphOptions
    private cy: ICytoscapeInstance | null = null
    private boundSyncTransform: () => void
    private boundNodesLayerWheel: (e: WheelEvent) => void
    private boundCanvasContainerWheel: (e: WheelEvent) => void
    private boundGraphPointerDown: (e: PointerEvent | MouseEvent) => void
    private boundGraphPointerMove: (e: PointerEvent | MouseEvent) => void
    private boundGraphPointerUp: (e: PointerEvent | MouseEvent) => void
    private boundContextMenu: (e: MouseEvent) => void
    private isRmbPanning = false
    private rmbPanMoved = false
    private rmbPanStartX = 0
    private rmbPanStartY = 0
    private rmbPanLastX = 0
    private rmbPanLastY = 0
    private dragLineSvg: SVGSVGElement | null = null

    // Multi-selection & Marquee state
    private selectedParagraphIds: Set<string> = new Set()
    private isMarqueeCandidate = false
    private isMarqueeActive = false
    private marqueeStartX = 0
    private marqueeStartY = 0
    private marqueeShiftMode = false
    private boundCanvasPointerDown: (e: PointerEvent | MouseEvent) => void
    private boundWindowPointerMove: (e: PointerEvent | MouseEvent) => void
    private boundWindowPointerUp: (e: PointerEvent | MouseEvent) => void
    private boundWindowKeyDown: (e: KeyboardEvent) => void

    constructor(options: IStoryGraphOptions) {
        this.canvasContainer = options.canvasContainer
        this.nodesLayer = options.nodesLayer
        this.options = options
        this.boundSyncTransform = this.syncTransform.bind(this)
        this.boundNodesLayerWheel = this.handleNodesLayerWheel.bind(this)
        this.boundCanvasContainerWheel = this.handleCanvasContainerWheel.bind(this)
        this.boundGraphPointerDown = this.handleGraphPointerDown.bind(this)
        this.boundGraphPointerMove = this.handleGraphPointerMove.bind(this)
        this.boundGraphPointerUp = this.handleGraphPointerUp.bind(this)
        this.boundContextMenu = this.handleContextMenu.bind(this)
        this.boundCanvasPointerDown = this.handleCanvasPointerDown.bind(this)
        this.boundWindowPointerMove = this.handleWindowPointerMove.bind(this)
        this.boundWindowPointerUp = this.handleWindowPointerUp.bind(this)
        this.boundWindowKeyDown = this.handleWindowKeyDown.bind(this)

        if (this.nodesLayer) {
            this.nodesLayer.addEventListener('wheel', this.boundNodesLayerWheel, {
                passive: false,
            })
            this.nodesLayer.addEventListener(
                'pointerdown',
                this.boundGraphPointerDown as EventListener
            )
            this.nodesLayer.addEventListener(
                'mousedown',
                this.boundGraphPointerDown as EventListener
            )
            this.nodesLayer.addEventListener(
                'pointerdown',
                this.boundCanvasPointerDown as EventListener
            )
            this.nodesLayer.addEventListener(
                'mousedown',
                this.boundCanvasPointerDown as EventListener
            )
            this.nodesLayer.addEventListener('contextmenu', this.boundContextMenu)
        }
        if (this.canvasContainer) {
            this.canvasContainer.addEventListener('wheel', this.boundCanvasContainerWheel, {
                capture: true,
                passive: false,
            })
            this.canvasContainer.addEventListener(
                'pointerdown',
                this.boundGraphPointerDown as EventListener
            )
            this.canvasContainer.addEventListener(
                'mousedown',
                this.boundGraphPointerDown as EventListener
            )
            this.canvasContainer.addEventListener(
                'pointerdown',
                this.boundCanvasPointerDown as EventListener
            )
            this.canvasContainer.addEventListener(
                'mousedown',
                this.boundCanvasPointerDown as EventListener
            )
            this.canvasContainer.addEventListener('contextmenu', this.boundContextMenu)

            const wrapper = this.canvasContainer.parentElement
            if (wrapper && wrapper !== document.body) {
                wrapper.addEventListener('contextmenu', this.boundContextMenu)
            }
        }
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.boundWindowKeyDown)
        }
    }

    public getCyInstance(): ICytoscapeInstance | null {
        return this.cy
    }

    public setLineStyle(lineStyle: ConnectionLineStyle): void {
        this.options.lineStyle = lineStyle
        if (this.cy) {
            this.cy.style(getStoryGraphStylesheet(lineStyle, this.options.customStyles))
        }
    }

    public syncTransform(): void {
        if (!this.cy || !this.nodesLayer) return
        const pan = this.cy.pan()
        const zoom = this.cy.zoom()
        this.nodesLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`

        // Synchronize dashed grid pattern with Cytoscape pan and zoom
        const gridPattern = document.getElementById('graph-dashed-grid-pattern')
        if (gridPattern) {
            const baseSize = GRAPH_THEME.dimensions.gridBaseSize
            const scaledSize = baseSize * zoom
            const offsetX = ((pan.x % scaledSize) + scaledSize) % scaledSize
            const offsetY = ((pan.y % scaledSize) + scaledSize) % scaledSize

            gridPattern.setAttribute('x', String(offsetX))
            gridPattern.setAttribute('y', String(offsetY))
            gridPattern.setAttribute('width', String(scaledSize))
            gridPattern.setAttribute('height', String(scaledSize))

            const path = gridPattern.querySelector('path')
            if (path) {
                path.setAttribute('d', `M ${scaledSize} 0 L 0 0 0 ${scaledSize}`)
            }
        }

        if (this.options.onZoomChange) {
            this.options.onZoomChange(zoom)
        }
    }

    private calculateDefaultPosition(index: number): { x: number; y: number } {
        const { initialOffsetX, initialOffsetY, gridColSpacing, gridRowSpacing, columnsCount } =
            GRAPH_THEME.layout
        const col = index % columnsCount
        const row = Math.floor(index / columnsCount)
        return {
            x: initialOffsetX + col * gridColSpacing,
            y: initialOffsetY + row * gridRowSpacing,
        }
    }

    public render(forceRebuild = false): void {
        if (!this.canvasContainer || !this.nodesLayer) return
        if (typeof window === 'undefined' || !window.cytoscape) return

        const paragraphs = this.options.getParagraphs()
        const scenes = this.options.getScenes()

        // Safeguard: Ensure START node exists on the graph. If missing, automatically add it!
        if (Array.isArray(paragraphs)) {
            const hasStart = paragraphs.some(
                p =>
                    p &&
                    ((typeof p.getIsStart === 'function' && p.getIsStart()) ||
                        (typeof p.getId === 'function' && p.getId() === 'start') ||
                        (p as unknown as { isStart?: boolean }).isStart === true ||
                        (p as unknown as { id?: string }).id === 'start')
            )
            if (!hasStart) {
                const startP = new Paragraph('start', 'START')
                startP.setIsStart(true)
                startP.setPosition(this.calculateDefaultPosition(0))
                paragraphs.unshift(startP)
            }
        }

        // Reorder choices to prevent line crossings before building edges
        preventChoiceLineCrossings(paragraphs)

        // Prepare Cytoscape elements (nodes for bounding box + edges for choices)
        const elements: Array<Record<string, unknown>> = []

        paragraphs.forEach((p, index) => {
            let pos = p.getPosition()
            if (!pos) {
                pos = this.calculateDefaultPosition(index)
                p.setPosition(pos)
            }
            elements.push({
                data: { id: p.getId() },
                position: { x: pos.x, y: pos.y },
            })
        })

        // Build edges for choices and combat outcomes with multi-output vertical offsets and curved control points
        paragraphs.forEach(sourceP => {
            const transitions = this.getTransitionsForParagraph(sourceP)
            if (transitions.length === 0) return

            const offsets = calculateEdgeSourceOffsets(transitions.length)
            const sourcePos = sourceP.getPosition() || { x: 0, y: 0 }

            transitions.forEach((trans, i) => {
                const targetP = paragraphs.find(p => p.getId() === trans.targetId)
                if (!targetP) return

                const targetPos = targetP.getPosition() || { x: 0, y: 0 }
                const offsetY = offsets[i] !== undefined ? offsets[i] : 0
                const label = trans.isCombatOutcome ? `[Walka] ${trans.label}` : trans.label
                const ctrlDist = calculateCurvedEdgeControlPointDistance(
                    sourcePos,
                    targetPos,
                    i,
                    transitions.length
                )

                const edgeClasses: string[] = []
                if (trans.isCombatOutcome) edgeClasses.push('combat-outcome')
                if (trans.hasCondition) edgeClasses.push('has-condition')

                elements.push({
                    data: {
                        id: trans.id,
                        source: sourceP.getId(),
                        target: trans.targetId,
                        label,
                        choiceObj: trans.choiceObj,
                        outcomeObj: trans.outcomeObj,
                        isCombatOutcome: trans.isCombatOutcome,
                        sourceEndpoint: `${GRAPH_THEME.dimensions.nodeWidth / 2}px ${offsetY}px`,
                        targetEndpoint: `-${GRAPH_THEME.dimensions.nodeWidth / 2}px 0px`,
                        ctrlDist,
                    },
                    classes: edgeClasses.join(' '),
                })
            })
        })

        const lineStyle = this.options.lineStyle || 'curved'

        // If already initialized and not forced to rebuild
        if (this.cy && !forceRebuild) {
            this.cy.resize()
            this.syncTransform()
            this.renderCustomNodes(paragraphs, scenes)
            return
        }

        let previousPan: { x: number; y: number } | null = null
        let previousZoom: number | null = null

        if (this.cy) {
            try {
                if (typeof this.cy.pan === 'function') {
                    const currentPan = this.cy.pan()
                    if (
                        currentPan &&
                        typeof currentPan.x === 'number' &&
                        typeof currentPan.y === 'number'
                    ) {
                        previousPan = { x: currentPan.x, y: currentPan.y }
                    }
                }
                if (typeof this.cy.zoom === 'function') {
                    const currentZoom = this.cy.zoom()
                    if (typeof currentZoom === 'number' && !Number.isNaN(currentZoom)) {
                        previousZoom = currentZoom
                    }
                }
            } catch (_) {
                // Ignore if cy was in an invalid state
            }
            this.cy.destroy()
            this.cy = null
        }

        const cyOptions: Record<string, unknown> = {
            container: this.canvasContainer,
            elements,
            style: getStoryGraphStylesheet(lineStyle, this.options.customStyles),
            layout: { name: 'preset' },
            minZoom: GRAPH_THEME.zoom.min,
            maxZoom: GRAPH_THEME.zoom.max,
            wheelSensitivity: this.options.wheelSensitivity ?? GRAPH_THEME.zoom.wheelSensitivity,
            userPanningEnabled: false,
            boxSelectionEnabled: false,
        }

        if (previousPan) {
            cyOptions.pan = previousPan
        }
        if (typeof previousZoom === 'number') {
            cyOptions.zoom = previousZoom
        }

        this.cy = window.cytoscape(cyOptions)

        window.cyInstance = this.cy

        if (this.cy) {
            if (previousPan && typeof this.cy.pan === 'function') {
                this.cy.pan(previousPan)
            }
            if (typeof previousZoom === 'number' && typeof this.cy.zoom === 'function') {
                this.cy.zoom(previousZoom)
            }
            this.cy.on('pan zoom', this.boundSyncTransform)
        }

        // Edge click / select handler
        this.cy.on('tap', 'edge', (evt: { target: { data: (key?: string) => unknown } }) => {
            const choiceObj = evt.target.data('choiceObj') as Choice
            const sourceId = evt.target.data('source') as string
            const targetId = evt.target.data('target') as string
            if (this.options.onSelectChoice) {
                const sourceP = paragraphs.find(p => p.getId() === sourceId)
                const targetP = paragraphs.find(p => p.getId() === targetId)
                if (choiceObj) {
                    this.options.onSelectChoice(choiceObj, sourceP, targetP)
                } else {
                    const outcomeObj = evt.target.data('outcomeObj') as ICombatOutcome | undefined
                    if (outcomeObj) {
                        const fallbackChoice = new Choice(
                            outcomeObj.id,
                            outcomeObj.name,
                            sourceId,
                            targetId,
                            null,
                            undefined,
                            [],
                            [],
                            null,
                            true
                        )
                        this.options.onSelectChoice(fallbackChoice, sourceP, targetP)
                    }
                }
            }
        })

        this.renderCustomNodes(paragraphs, scenes)
        this.syncTransform()
        this.updateSelectionVisuals()
        this.updateSelectionToolbar()
    }

    /**
     * Resolves all outgoing transitions for a paragraph, including choices and combat outcomes.
     */
    private getTransitionsForParagraph(sourceP: Paragraph): Array<{
        id: string
        targetId: string
        label: string
        choiceObj?: Choice
        outcomeObj?: ICombatOutcome
        isCombatOutcome: boolean
        hasCondition: boolean
    }> {
        const choices = sourceP.getChoices ? sourceP.getChoices() : []
        const hasCombat = Boolean(sourceP.getHasCombat && sourceP.getHasCombat())
        const combat = sourceP.getCombat ? sourceP.getCombat() : null
        const combatOutcomes: ICombatOutcome[] =
            hasCombat && combat && typeof combat.getOutcomes === 'function'
                ? combat.getOutcomes()
                : []

        const transitions: Array<{
            id: string
            targetId: string
            label: string
            choiceObj?: Choice
            outcomeObj?: ICombatOutcome
            isCombatOutcome: boolean
            hasCondition: boolean
        }> = []

        choices.forEach((choice, i) => {
            const targetId = choice.getToParagraphId()
            if (!targetId) return
            const chId = choice.getId() || `edge_${sourceP.getId()}_${targetId}_${i}`
            const choiceIsCombat =
                typeof choice.getIsCombatOutcome === 'function'
                    ? choice.getIsCombatOutcome()
                    : Boolean((choice as unknown as { isCombatOutcome?: boolean }).isCombatOutcome)
            const matchingOutcome =
                hasCombat &&
                combatOutcomes.find(
                    (o: ICombatOutcome) =>
                        o.id === chId ||
                        (o.targetParagraphId === targetId && o.name === choice.getName()) ||
                        (o.targetParagraphId === targetId && choiceIsCombat)
                )
            const isCombat = Boolean(matchingOutcome) || choiceIsCombat

            transitions.push({
                id: chId,
                targetId,
                label: (matchingOutcome && matchingOutcome.name) || choice.getName() || '',
                choiceObj: choice,
                outcomeObj: matchingOutcome || undefined,
                isCombatOutcome: isCombat,
                hasCondition: Boolean(choice.getCondition()),
            })
        })

        // Also include any combat outcomes not yet present in choices
        if (hasCombat) {
            combatOutcomes.forEach((outcome: ICombatOutcome, i: number) => {
                const targetId = outcome.targetParagraphId
                if (!targetId) return
                const alreadyExists = transitions.some(
                    t =>
                        t.id === outcome.id ||
                        (t.targetId === targetId && (t.isCombatOutcome || t.label === outcome.name))
                )
                if (!alreadyExists) {
                    transitions.push({
                        id: outcome.id || `combat_edge_${sourceP.getId()}_${targetId}_${i}`,
                        targetId,
                        label: outcome.name || 'Wynik walki',
                        outcomeObj: outcome,
                        isCombatOutcome: true,
                        hasCondition: false,
                    })
                }
            })
        }

        return transitions
    }

    /**
     * Finds all child scenes recursively contained within the given parent scene.
     */
    public getNestedChildScenes(parentScene: Scene, allScenes: Scene[]): Scene[] {
        const activeScenes = allScenes.filter(
            s => s.getPosition() !== null && s.getId() !== parentScene.getId()
        )
        const result: Scene[] = []
        const visited = new Set<string>()

        const findChildren = (currentParent: Scene): void => {
            activeScenes.forEach(candidate => {
                if (!visited.has(candidate.getId()) && currentParent.containsScene(candidate)) {
                    visited.add(candidate.getId())
                    result.push(candidate)
                    findChildren(candidate)
                }
            })
        }

        findChildren(parentScene)
        return result
    }

    public syncParagraphSceneAssignments(
        paragraphs: Paragraph[],
        scenes: Scene[]
    ): { changed: boolean } {
        let changed = false
        const activeScenes = scenes.filter(s => s.getPosition() !== null)

        paragraphs.forEach(p => {
            const matchingScenes = activeScenes.filter(s => s.intersectsParagraph(p))

            scenes.forEach(s => {
                const shouldHave = matchingScenes.some(m => m.getId() === s.getId())
                const currentlyHas = s.hasParagraph(p.getId())

                if (shouldHave && !currentlyHas) {
                    s.addParagraph(p)
                    changed = true
                } else if (!shouldHave && currentlyHas) {
                    s.removeParagraph(p.getId())
                    changed = true
                }
            })
        })

        return { changed }
    }

    public updateParagraphNodeColors(paragraphs: Paragraph[], scenes: Scene[]): void {
        if (!this.nodesLayer) return
        const activeScenes = scenes.filter(s => s.getPosition() !== null)

        paragraphs.forEach(p => {
            const containingScenes = activeScenes.filter(s => s.hasParagraph(p.getId()))
            // Pick innermost (smallest area) scene color
            containingScenes.sort((a, b) => a.getArea() - b.getArea())
            const primaryScene = containingScenes[0]
            const color = primaryScene ? primaryScene.getColor() : GRAPH_THEME.colors.defaultScene

            const el = this.nodesLayer.querySelector(
                `paragraph-node[data-node-id="${p.getId()}"]`
            ) as ParagraphNode | null
            if (el) {
                el.themeColor = color
            }
        })
    }

    public updateSceneNodeBadges(scenes: Scene[]): void {
        if (!this.nodesLayer) return
        scenes.forEach(s => {
            const el = this.nodesLayer.querySelector(
                `scene-node[data-scene-id="${s.getId()}"]`
            ) as SceneNode | null
            if (el) {
                el.render()
            }
        })
    }

    public updateSceneZIndices(scenes: Scene[]): void {
        if (!this.nodesLayer) return
        const activeScenes = scenes.filter(s => s.getPosition() !== null)
        activeScenes.sort((a, b) => b.getArea() - a.getArea())
        activeScenes.forEach((scene, index) => {
            const el = this.nodesLayer.querySelector(
                `scene-node[data-scene-id="${scene.getId()}"]`
            ) as HTMLElement | null
            if (el) {
                el.style.zIndex = String(2 + index)
            }
        })
    }

    public addSceneToGraph(
        scene: Scene,
        position: { x: number; y: number },
        width: number = GRAPH_THEME.dimensions.sceneDefaultWidth,
        height: number = GRAPH_THEME.dimensions.sceneDefaultHeight
    ): void {
        scene.setPosition(position)
        scene.setWidth(width)
        scene.setHeight(height)
        const paras = this.options.getParagraphs()
        const scenes = this.options.getScenes()
        this.syncParagraphSceneAssignments(paras, scenes)
        this.render(true)
    }

    public renderCustomNodes(paragraphs: Paragraph[], scenes: Scene[]): void {
        if (!this.nodesLayer) return
        this.nodesLayer.innerHTML = ''

        // 1. Sync paragraph-scene assignments based on graph geometry
        this.syncParagraphSceneAssignments(paragraphs, scenes)

        // 2. Render active scenes sorted by area descending (largest outer scenes rendered first, sitting underneath child scenes)
        const activeScenes = scenes.filter(s => s.getPosition() !== null)
        activeScenes.sort((a, b) => b.getArea() - a.getArea())

        activeScenes.forEach((scene, index) => {
            const sPos = scene.getPosition() || { x: 0, y: 0 }
            const sceneNodeEl = document.createElement('scene-node') as SceneNode
            sceneNodeEl.scene = scene
            sceneNodeEl.themeColor = scene.getColor() || GRAPH_THEME.colors.defaultScene
            sceneNodeEl.setBounds(sPos.x, sPos.y, scene.getWidth(), scene.getHeight())
            sceneNodeEl.dataset.sceneId = scene.getId()
            sceneNodeEl.style.zIndex = String(2 + index)

            // Drag handling for Scene
            let isDragging = false
            let hasMoved = false
            let startX = 0
            let startY = 0
            let sceneStartX = sPos.x
            let sceneStartY = sPos.y
            const pStartPositions = new Map<string, { x: number; y: number }>()
            const childSceneStartPositions = new Map<string, { x: number; y: number }>()
            let activeChildScenes: Scene[] = []

            const onScenePointerDown = (e: PointerEvent | MouseEvent): void => {
                if (e.button !== 0) return
                const target = e.target as HTMLElement
                if (
                    target.closest('.scene-resize-handle') ||
                    target.closest('.scene-node-lock-btn') ||
                    target.closest('button') ||
                    target.closest('input')
                ) {
                    return
                }

                e.stopPropagation()

                // Ensure marquee selection never activates when interacting with scenes
                this.isMarqueeCandidate = false
                this.isMarqueeActive = false
                const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
                const marquee = wrapper?.querySelector(
                    '#graph-selection-marquee'
                ) as HTMLElement | null
                if (marquee) {
                    marquee.classList.add('hidden')
                    marquee.style.display = 'none'
                }

                isDragging = true
                hasMoved = false
                startX = e.clientX
                startY = e.clientY
                const currentScenePos = scene.getPosition() || sPos
                sceneStartX = currentScenePos.x
                sceneStartY = currentScenePos.y

                // Find all recursively contained child scenes
                const allScenes = this.options.getScenes()
                activeChildScenes = this.getNestedChildScenes(scene, allScenes)

                // Record start positions for all child scenes
                childSceneStartPositions.clear()
                activeChildScenes.forEach(cs => {
                    const cPos = cs.getPosition()
                    if (cPos) {
                        childSceneStartPositions.set(cs.getId(), { x: cPos.x, y: cPos.y })
                    }
                })

                // Record initial positions of paragraphs belonging to this scene AND child scenes
                pStartPositions.clear()
                const allContainedParagraphs = new Map<string, Paragraph>()
                scene.getParagraphs().forEach(p => allContainedParagraphs.set(p.getId(), p))
                activeChildScenes.forEach(cs => {
                    cs.getParagraphs().forEach(p => allContainedParagraphs.set(p.getId(), p))
                })

                allContainedParagraphs.forEach(p => {
                    const pPos = p.getPosition()
                    if (pPos) {
                        pStartPositions.set(p.getId(), { x: pPos.x, y: pPos.y })
                    }
                })

                window.addEventListener('pointermove', onScenePointerMove)
                window.addEventListener('pointerup', onScenePointerUp)
                window.addEventListener('mousemove', onScenePointerMove)
                window.addEventListener('mouseup', onScenePointerUp)
            }

            const onScenePointerMove = (e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                const zoom = this.cy ? this.cy.zoom() : 1
                const dx = (e.clientX - startX) / zoom
                const dy = (e.clientY - startY) / zoom

                if (!hasMoved && Math.hypot(dx, dy) > 3) {
                    hasMoved = true
                }

                if (hasMoved) {
                    const newSX = Math.round(sceneStartX + dx)
                    const newSY = Math.round(sceneStartY + dy)
                    scene.setPosition({ x: newSX, y: newSY })
                    sceneNodeEl.setPosition(newSX, newSY)

                    // If movement is locked (kłódka zamknięta), move child scenes and contained paragraphs together with scene
                    if (scene.getIsMovementLocked()) {
                        // Move child scenes
                        activeChildScenes.forEach(cs => {
                            const csStart = childSceneStartPositions.get(cs.getId())
                            if (csStart) {
                                const newCSX = Math.round(csStart.x + dx)
                                const newCSY = Math.round(csStart.y + dy)
                                cs.setPosition({ x: newCSX, y: newCSY })

                                const csEl = this.nodesLayer.querySelector(
                                    `scene-node[data-scene-id="${cs.getId()}"]`
                                ) as SceneNode | null
                                if (csEl) {
                                    csEl.setPosition(newCSX, newCSY)
                                }
                            }
                        })

                        // Move paragraphs
                        pStartPositions.forEach((pStart, pId) => {
                            const newPX = Math.round(pStart.x + dx)
                            const newPY = Math.round(pStart.y + dy)
                            const paras = this.options.getParagraphs()
                            const p = paras.find(x => x.getId() === pId)
                            if (p) {
                                p.setPosition({ x: newPX, y: newPY })
                            }

                            const pEl = this.nodesLayer.querySelector(
                                `paragraph-node[data-node-id="${pId}"]`
                            ) as ParagraphNode | null
                            if (pEl) {
                                pEl.setPosition(newPX, newPY)
                            }

                            if (this.cy) {
                                const cyNode = this.cy.getElementById(pId)
                                if (cyNode) {
                                    cyNode.position({ x: newPX, y: newPY })
                                }
                            }
                        })

                        const paras = this.options.getParagraphs()
                        preventChoiceLineCrossings(paras)
                        this.updateEdgeGeometry(paras)
                    }
                }
            }

            const onScenePointerUp = (e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                isDragging = false
                this.isMarqueeCandidate = false
                this.isMarqueeActive = false
                window.removeEventListener('pointermove', onScenePointerMove)
                window.removeEventListener('pointerup', onScenePointerUp)
                window.removeEventListener('mousemove', onScenePointerMove)
                window.removeEventListener('mouseup', onScenePointerUp)

                if (hasMoved) {
                    const zoom = this.cy ? this.cy.zoom() : 1
                    const dx = (e.clientX - startX) / zoom
                    const dy = (e.clientY - startY) / zoom
                    const finalSX = Math.round(sceneStartX + dx)
                    const finalSY = Math.round(sceneStartY + dy)
                    scene.setPosition({ x: finalSX, y: finalSY })

                    if (!scene.getIsMovementLocked()) {
                        // Kłódka otwarta: ruszano tylko ramką sceny, przelicz które sceny i paragrafy w niej są
                        const paras = this.options.getParagraphs()
                        const allScenes = this.options.getScenes()
                        this.syncParagraphSceneAssignments(paras, allScenes)
                        this.updateParagraphNodeColors(paras, allScenes)
                        this.updateSceneNodeBadges(allScenes)
                        this.updateSceneZIndices(allScenes)
                        if (this.options.onSceneAssignmentChange) {
                            this.options.onSceneAssignmentChange(scene, scene.getParagraphs())
                        }
                    } else {
                        // Kłódka zamknięta: sfinalizuj pozycje przesuniętych scen i paragrafów
                        activeChildScenes.forEach(cs => {
                            const csStart = childSceneStartPositions.get(cs.getId())
                            if (csStart) {
                                const finalCSX = Math.round(csStart.x + dx)
                                const finalCSY = Math.round(csStart.y + dy)
                                cs.setPosition({ x: finalCSX, y: finalCSY })
                            }
                        })

                        pStartPositions.forEach((pStart, pId) => {
                            const finalPX = Math.round(pStart.x + dx)
                            const finalPY = Math.round(pStart.y + dy)
                            const paras = this.options.getParagraphs()
                            const p = paras.find(x => x.getId() === pId)
                            if (p) {
                                p.setPosition({ x: finalPX, y: finalPY })
                            }
                            if (this.cy) {
                                const cyNode = this.cy.getElementById(pId)
                                if (cyNode) {
                                    cyNode.position({ x: finalPX, y: finalPY })
                                }
                            }
                        })

                        const paras = this.options.getParagraphs()
                        const allScenes = this.options.getScenes()
                        this.syncParagraphSceneAssignments(paras, allScenes)
                        this.updateParagraphNodeColors(paras, allScenes)
                        this.updateSceneNodeBadges(allScenes)
                        this.updateSceneZIndices(allScenes)
                        preventChoiceLineCrossings(paras)
                        this.updateEdgeGeometry(paras)
                        if (this.options.onSceneAssignmentChange) {
                            this.options.onSceneAssignmentChange(scene, scene.getParagraphs())
                        }
                    }
                    this.options.onGraphModified?.()
                }
            }

            sceneNodeEl.addEventListener('pointerdown', onScenePointerDown as EventListener)
            sceneNodeEl.addEventListener('mousedown', onScenePointerDown as EventListener)

            // Resize events from SceneNode handles
            const handleSceneResize = (): void => {
                const paras = this.options.getParagraphs()
                const allScenes = this.options.getScenes()
                this.syncParagraphSceneAssignments(paras, allScenes)
                this.updateParagraphNodeColors(paras, allScenes)
                this.updateSceneNodeBadges(allScenes)
                this.updateSceneZIndices(allScenes)
            }

            sceneNodeEl.addEventListener('scene-resize', handleSceneResize)
            sceneNodeEl.addEventListener('scene-resize-end', () => {
                handleSceneResize()
                if (this.options.onSceneAssignmentChange) {
                    this.options.onSceneAssignmentChange(scene, scene.getParagraphs())
                }
            })

            sceneNodeEl.addEventListener('scene-open-details', () => {
                if (this.options.onSelectScene) {
                    this.options.onSelectScene(scene)
                }
            })

            sceneNodeEl.addEventListener('scene-item-drop', (e: Event) => {
                const customEvent = e as CustomEvent<{
                    scene: Scene
                    entityType: 'tag' | 'character' | 'location'
                    entityId: string
                }>
                const { scene: targetScene, entityType, entityId } = customEvent.detail
                this.handleItemDropOnScene(targetScene, entityType, entityId)
            })

            this.nodesLayer.appendChild(sceneNodeEl)
        })

        // 3. Render paragraph nodes (rendered after scenes, z-index 10)
        paragraphs.forEach((p, index) => {
            let pos = p.getPosition()
            if (!pos) {
                pos = this.calculateDefaultPosition(index)
                p.setPosition(pos)
            }

            const containingScenes = scenes.filter(s => s.hasParagraph && s.hasParagraph(p.getId()))
            containingScenes.sort((a, b) => a.getArea() - b.getArea())
            const parentScene = containingScenes[0]
            const sceneColor = parentScene
                ? parentScene.getColor()
                : GRAPH_THEME.colors.defaultScene

            const nodeEl = document.createElement('paragraph-node') as ParagraphNode
            nodeEl.paragraph = p
            nodeEl.themeColor = sceneColor
            nodeEl.setPosition(pos.x, pos.y)
            nodeEl.dataset.nodeId = p.getId()

            if (this.selectedParagraphIds.has(p.getId())) {
                nodeEl.classList.add('is-selected')
                const inner = nodeEl.querySelector('.paragraph-node')
                if (inner) inner.classList.add('is-selected')
            }

            // Drag handling (supports multi-selection group dragging)
            let isDragging = false
            let startX = 0
            let startY = 0
            let hasMoved = false
            const groupStartPositions = new Map<string, { x: number; y: number }>()

            const onPointerDown = (e: PointerEvent | MouseEvent): void => {
                if (e.button !== 0) return
                const target = e.target as HTMLElement
                if (
                    target.closest('.paragraph-node-socket') ||
                    target.closest('.paragraph-node-add-container') ||
                    target.closest('input') ||
                    target.closest('button')
                ) {
                    return
                }

                e.stopPropagation()

                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    return
                }

                isDragging = true
                hasMoved = false
                startX = e.clientX
                startY = e.clientY

                if (!this.selectedParagraphIds.has(p.getId())) {
                    this.selectedParagraphIds.clear()
                    this.selectedParagraphIds.add(p.getId())
                    this.updateSelectionVisuals()
                    this.updateSelectionToolbar()
                }

                groupStartPositions.clear()
                const paras = this.options.getParagraphs()
                this.selectedParagraphIds.forEach(id => {
                    const targetP = paras.find(x => x.getId() === id)
                    if (targetP) {
                        const curPos = targetP.getPosition() || pos
                        groupStartPositions.set(id, { x: curPos.x, y: curPos.y })
                    }
                })

                window.addEventListener('pointermove', onPointerMove)
                window.addEventListener('pointerup', onPointerUp)
            }

            const onPointerMove = (e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                const zoom = this.cy ? this.cy.zoom() : 1
                const dx = (e.clientX - startX) / zoom
                const dy = (e.clientY - startY) / zoom

                if (!hasMoved && Math.hypot(dx, dy) > 3) {
                    hasMoved = true
                }

                if (hasMoved) {
                    const paras = this.options.getParagraphs()
                    groupStartPositions.forEach((startPPos, id) => {
                        const newX = Math.round(startPPos.x + dx)
                        const newY = Math.round(startPPos.y + dy)
                        const targetNodeEl = this.nodesLayer.querySelector(
                            `paragraph-node[data-node-id="${id}"]`
                        ) as ParagraphNode | null
                        if (targetNodeEl) {
                            targetNodeEl.setPosition(newX, newY)
                        }

                        if (this.cy) {
                            const cyNode = this.cy.getElementById(id)
                            if (cyNode) {
                                cyNode.position({ x: newX, y: newY })
                            }
                        }
                        const para = paras.find(x => x.getId() === id)
                        if (para) {
                            para.setPosition({ x: newX, y: newY })
                            preventChoiceLineCrossings(paras, id)
                        }
                    })
                    this.updateEdgeGeometry(paras)
                }
            }

            const onPointerUp = (_e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                isDragging = false
                window.removeEventListener('pointermove', onPointerMove)
                window.removeEventListener('pointerup', onPointerUp)

                if (hasMoved) {
                    // Suppress subsequent click events so details / expansion do not trigger on drag
                    nodeEl.preventNextClick = true
                    setTimeout(() => {
                        nodeEl.preventNextClick = false
                    }, 300)

                    const interceptClick = (ev: MouseEvent): void => {
                        ev.stopImmediatePropagation()
                        ev.preventDefault()
                    }
                    nodeEl.addEventListener('click', interceptClick, { capture: true, once: true })
                    setTimeout(() => {
                        nodeEl.removeEventListener('click', interceptClick, { capture: true })
                    }, 300)

                    const paras = this.options.getParagraphs()
                    const allScenes = this.options.getScenes()
                    this.syncParagraphSceneAssignments(paras, allScenes)
                    this.updateParagraphNodeColors(paras, allScenes)
                    this.updateSceneNodeBadges(allScenes)

                    groupStartPositions.forEach((_, id) => {
                        preventChoiceLineCrossings(paras, id)
                    })
                    this.updateEdgeGeometry(paras)

                    if (this.options.onSceneAssignmentChange) {
                        groupStartPositions.forEach((_, id) => {
                            const containingScenes = allScenes.filter(s => s.hasParagraph(id))
                            containingScenes.forEach(s => {
                                if (this.options.onSceneAssignmentChange) {
                                    this.options.onSceneAssignmentChange(s, s.getParagraphs())
                                }
                            })
                        })
                    }
                    this.options.onGraphModified?.()
                    this.updateSelectionToolbar()
                }
            }

            nodeEl.addEventListener('pointerdown', onPointerDown as EventListener)

            // Shift/Ctrl selection toggle event
            nodeEl.addEventListener('node-toggle-select', (e: Event) => {
                const customEvent = e as CustomEvent<{ paragraph: Paragraph }>
                const targetP = customEvent.detail?.paragraph || p
                this.toggleParagraphSelection(targetP.getId())
            })

            // Selection / Details event (triggered on double click)
            const openDetails = (): void => {
                const containingScenes = scenes.filter(s => s.hasParagraph(p.getId()))
                containingScenes.sort((a, b) => a.getArea() - b.getArea())
                const currentPScene = containingScenes[0]
                this.options.onSelectParagraph(p, currentPScene)
                this.selectedParagraphIds.clear()
                this.selectedParagraphIds.add(p.getId())
                this.updateSelectionVisuals()
                this.updateSelectionToolbar()
            }
            nodeEl.addEventListener('node-open-details', openDetails)
            nodeEl.addEventListener('node-select', openDetails)

            // Item drop handler (drag and drop tag/character/location onto node)
            nodeEl.addEventListener('node-item-drop', (e: Event) => {
                const customEvent = e as CustomEvent<{
                    paragraph: Paragraph
                    entityType: 'tag' | 'character' | 'location'
                    entityId: string
                }>
                const { paragraph: targetParagraph, entityType, entityId } = customEvent.detail
                this.handleItemDropOnParagraph(targetParagraph, entityType, entityId)
            })

            // Socket pointerdown -> start interactive drag-and-drop connection
            nodeEl.addEventListener('node-socket-pointerdown', (e: Event) => {
                const customEvent = e as CustomEvent<{
                    paragraph: Paragraph
                    socketElement: HTMLElement
                    originalEvent: PointerEvent | MouseEvent
                }>
                const { paragraph: srcParagraph, socketElement, originalEvent } = customEvent.detail
                if (originalEvent && originalEvent.button !== 0) return
                this.startConnectionDrag(srcParagraph, socketElement, originalEvent)
            })

            // Add paragraph event (creates connected paragraph + choice)
            nodeEl.addEventListener('node-add-paragraph', (e: Event) => {
                const customEvent = e as CustomEvent<{ sourceParagraph: Paragraph; title: string }>
                const { sourceParagraph, title } = customEvent.detail

                const newParagraph = this.options.onCreateParagraph(title, sourceParagraph)
                const parentPos = sourceParagraph.getPosition() || {
                    x: GRAPH_THEME.layout.initialOffsetX,
                    y: GRAPH_THEME.layout.initialOffsetY,
                }
                const newPos = {
                    x: parentPos.x + GRAPH_THEME.layout.newConnectedNodeOffsetX,
                    y: parentPos.y + GRAPH_THEME.layout.newConnectedNodeOffsetY,
                }
                newParagraph.setPosition(newPos)

                // Create connection from source to newly created paragraph
                if (this.options.onCreateConnection) {
                    this.options.onCreateConnection(sourceParagraph, newParagraph, title)
                }

                // Re-render
                this.render(true)
                this.options.onSelectParagraph(newParagraph, parentScene)

                this.options.onToast(
                    'success',
                    this.options.t('toast.element_created', { name: title }),
                    this.options.t('toast.element_created_title')
                )
            })

            this.nodesLayer.appendChild(nodeEl)
        })
    }

    private getOrCreateDragLineSvg(): { svg: SVGSVGElement; path: SVGPathElement } {
        let svg = document.getElementById('story-graph-drag-svg') as SVGSVGElement | null
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.id = 'story-graph-drag-svg'
            svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none z-40')

            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
            marker.id = 'drag-arrow'
            marker.setAttribute('markerWidth', '6')
            marker.setAttribute('markerHeight', '6')
            marker.setAttribute('refX', '5')
            marker.setAttribute('refY', '3')
            marker.setAttribute('orient', 'auto')

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
            polygon.setAttribute('points', '0 0, 6 3, 0 6')
            polygon.setAttribute('fill', GRAPH_THEME.colors.edgeSelected)
            marker.appendChild(polygon)
            defs.appendChild(marker)
            svg.appendChild(defs)

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            path.id = 'drag-preview-path'
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', GRAPH_THEME.colors.edgeSelected)
            path.setAttribute('stroke-width', '2.5')
            path.setAttribute('stroke-dasharray', '4 3')
            path.setAttribute('marker-end', 'url(#drag-arrow)')
            svg.appendChild(path)

            this.canvasContainer.appendChild(svg)
        }

        const pathEl = svg.querySelector('#drag-preview-path') as SVGPathElement
        return { svg, path: pathEl }
    }

    /**
     * Interactive Drag-to-Connect from Node Socket to another Paragraph Node.
     */
    private startConnectionDrag(
        sourceParagraph: Paragraph,
        socketEl: HTMLElement,
        startEvent: PointerEvent | MouseEvent
    ): void {
        if (!this.canvasContainer || !this.cy) return
        startEvent.preventDefault()
        startEvent.stopPropagation()

        const socketRect = socketEl.getBoundingClientRect()
        const containerRect = this.canvasContainer.getBoundingClientRect()

        const startScreenX = socketRect.left + socketRect.width / 2 - containerRect.left
        const startScreenY = socketRect.top + socketRect.height / 2 - containerRect.top

        const { path: pathEl } = this.getOrCreateDragLineSvg()

        let currentTargetNode: ParagraphNode | null = null

        const onMove = (e: MouseEvent | PointerEvent): void => {
            const currentX = e.clientX - containerRect.left
            const currentY = e.clientY - containerRect.top

            if (pathEl) {
                const dx = Math.max(40, Math.abs(currentX - startScreenX) * 0.5)
                const d = `M ${startScreenX} ${startScreenY} C ${startScreenX + dx} ${startScreenY}, ${currentX - dx} ${currentY}, ${currentX} ${currentY}`
                pathEl.setAttribute('d', d)
            }

            // Find target paragraph-node element under cursor
            const elUnderCursor = document.elementFromPoint(e.clientX, e.clientY)
            const targetNodeEl = elUnderCursor?.closest('paragraph-node') as ParagraphNode | null

            if (
                targetNodeEl &&
                targetNodeEl.paragraph &&
                targetNodeEl.paragraph.getId() !== sourceParagraph.getId()
            ) {
                if (currentTargetNode !== targetNodeEl) {
                    if (currentTargetNode) currentTargetNode.classList.remove('is-drag-target')
                    currentTargetNode = targetNodeEl
                    currentTargetNode.classList.add('is-drag-target')
                }
            } else {
                if (currentTargetNode) {
                    currentTargetNode.classList.remove('is-drag-target')
                    currentTargetNode = null
                }
            }
        }

        const onUp = (e: MouseEvent | PointerEvent): void => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)

            if (pathEl) {
                pathEl.removeAttribute('d')
            }
            if (currentTargetNode) {
                currentTargetNode.classList.remove('is-drag-target')
            }

            // Determine target node
            const elUnderCursor = document.elementFromPoint(e.clientX, e.clientY)
            const targetNodeEl =
                (elUnderCursor?.closest('paragraph-node') as ParagraphNode | null) ||
                currentTargetNode

            if (targetNodeEl && targetNodeEl.paragraph) {
                const targetParagraph = targetNodeEl.paragraph
                if (targetParagraph.getId() !== sourceParagraph.getId()) {
                    // Create connection
                    if (this.options.onCreateConnection) {
                        const newChoice = this.options.onCreateConnection(
                            sourceParagraph,
                            targetParagraph
                        )
                        if (newChoice) {
                            this.render(true)
                            const label =
                                targetParagraph.getTitle() ||
                                this.options.t('graph.node.default_title')
                            this.options.onToast(
                                'success',
                                this.options.t('toast.connection_created', {
                                    from: sourceParagraph.getTitle(),
                                    to: label,
                                }),
                                this.options.t('toast.success_title')
                            )
                        } else {
                            this.options.onToast(
                                'info',
                                this.options.t('toast.connection_exists'),
                                this.options.t('toast.info_title')
                            )
                        }
                    }
                }
            }
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
    }

    /**
     * Synchronizes Cytoscape edge geometry (source sockets and control point curves)
     * according to the current positions of paragraphs and their reordered choices.
     */
    public updateEdgeGeometry(paragraphs?: Paragraph[]): void {
        if (!this.cy) return
        const paras = paragraphs || this.options.getParagraphs()

        paras.forEach(sourceP => {
            const transitions = this.getTransitionsForParagraph(sourceP)
            if (transitions.length === 0) return

            const offsets = calculateEdgeSourceOffsets(transitions.length)
            const sourcePos = sourceP.getPosition() || { x: 0, y: 0 }

            transitions.forEach((trans, i) => {
                const targetP = paras.find(p => p.getId() === trans.targetId)
                if (!targetP) return

                const targetPos = targetP.getPosition() || { x: 0, y: 0 }
                const offsetY = offsets[i] !== undefined ? offsets[i] : 0
                const ctrlDist = calculateCurvedEdgeControlPointDistance(
                    sourcePos,
                    targetPos,
                    i,
                    transitions.length
                )

                const cyEdge = this.cy?.getElementById(trans.id)
                if (cyEdge && cyEdge.data) {
                    cyEdge.data(
                        'sourceEndpoint',
                        `${GRAPH_THEME.dimensions.nodeWidth / 2}px ${offsetY}px`
                    )
                    cyEdge.data('ctrlDist', ctrlDist)
                    cyEdge.data('targetEndpoint', `-${GRAPH_THEME.dimensions.nodeWidth / 2}px 0px`)
                }
            })
        })
    }

    /**
     * Centers and focuses the graph view on a specific element (paragraph, choice or scene).
     */
    public focusOnElement(elementId: string, animate: boolean = true): void {
        if (!elementId) return
        if (!this.cy) {
            this.render(false)
        }
        if (!this.cy) return

        this.cy.resize()
        if (typeof this.cy.stop === 'function') {
            this.cy.stop()
        }

        const cyEle = this.cy.getElementById(elementId)
        const isCyEleFound = Boolean(
            cyEle &&
            (typeof cyEle.nonempty === 'function'
                ? cyEle.nonempty()
                : typeof cyEle.empty === 'function'
                  ? !cyEle.empty()
                  : cyEle.length === undefined || cyEle.length > 0)
        )

        if (isCyEleFound && cyEle) {
            if (animate && typeof this.cy.animate === 'function') {
                this.cy.animate(
                    {
                        center: { eles: cyEle },
                    },
                    {
                        duration: 350,
                        easing: 'ease-out-cubic',
                        complete: () => {
                            this.syncTransform()
                        },
                    }
                )
            } else if (typeof this.cy.center === 'function') {
                this.cy.center(cyEle)
                this.syncTransform()
            }
        } else {
            // Check if elementId is a paragraph ID
            const paragraphs = this.options.getParagraphs()
            const p = paragraphs.find(x => x.getId() === elementId)
            if (p) {
                const pos = p.getPosition() || { x: 0, y: 0 }
                const zoom = (typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1) || 1
                const containerRect = this.canvasContainer?.getBoundingClientRect()
                const width = containerRect?.width || this.canvasContainer?.clientWidth || 800
                const height = containerRect?.height || this.canvasContainer?.clientHeight || 600
                const targetPan = {
                    x: Math.round(width / 2 - pos.x * zoom),
                    y: Math.round(height / 2 - pos.y * zoom),
                }
                if (animate && typeof this.cy.animate === 'function') {
                    this.cy.animate(
                        { pan: targetPan },
                        {
                            duration: 350,
                            easing: 'ease-out-cubic',
                            complete: () => this.syncTransform(),
                        }
                    )
                } else if (typeof this.cy.pan === 'function') {
                    this.cy.pan(targetPan)
                    this.syncTransform()
                }
            } else {
                // Check if elementId is a choice inside any paragraph
                let choiceFound = false
                for (const srcP of paragraphs) {
                    if (srcP.hasChoice && srcP.hasChoice(elementId)) {
                        choiceFound = true
                        const cySrcEle = this.cy.getElementById(srcP.getId())
                        const isSrcFound = Boolean(
                            cySrcEle &&
                            (typeof cySrcEle.nonempty === 'function'
                                ? cySrcEle.nonempty()
                                : typeof cySrcEle.empty === 'function'
                                  ? !cySrcEle.empty()
                                  : cySrcEle.length === undefined || cySrcEle.length > 0)
                        )
                        if (isSrcFound && cySrcEle) {
                            if (animate && typeof this.cy.animate === 'function') {
                                this.cy.animate(
                                    { center: { eles: cySrcEle } },
                                    {
                                        duration: 350,
                                        easing: 'ease-out-cubic',
                                        complete: () => this.syncTransform(),
                                    }
                                )
                            } else if (typeof this.cy.center === 'function') {
                                this.cy.center(cySrcEle)
                                this.syncTransform()
                            }
                        }
                        break
                    }
                }

                if (!choiceFound) {
                    // Check if elementId is a scene ID
                    const scenes = this.options.getScenes()
                    const s = scenes.find(x => x.getId() === elementId)
                    if (s) {
                        let sPos = s.getPosition()
                        if (!sPos) {
                            const activeCount = scenes.filter(x => x.getPosition() !== null).length
                            sPos = {
                                x: 50 + (activeCount % 5) * 60,
                                y: 50 + Math.floor(activeCount / 5) * 60,
                            }
                            s.setPosition(sPos)
                            this.render(true)
                        }
                        const centerX = sPos.x + s.getWidth() / 2
                        const centerY = sPos.y + s.getHeight() / 2
                        const zoom = (typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1) || 1
                        const containerRect = this.canvasContainer?.getBoundingClientRect()
                        const width =
                            containerRect?.width || this.canvasContainer?.clientWidth || 800
                        const height =
                            containerRect?.height || this.canvasContainer?.clientHeight || 600
                        const targetPan = {
                            x: Math.round(width / 2 - centerX * zoom),
                            y: Math.round(height / 2 - centerY * zoom),
                        }
                        if (animate && typeof this.cy.animate === 'function') {
                            this.cy.animate(
                                { pan: targetPan },
                                {
                                    duration: 350,
                                    easing: 'ease-out-cubic',
                                    complete: () => this.syncTransform(),
                                }
                            )
                        } else if (typeof this.cy.pan === 'function') {
                            this.cy.pan(targetPan)
                            this.syncTransform()
                        }
                    }
                }
            }
        }

        // Highlight selected node visually in custom nodes layer
        if (this.nodesLayer) {
            this.nodesLayer.querySelectorAll('.paragraph-node').forEach(nodeEl => {
                const parent = nodeEl.closest('paragraph-node') as HTMLElement
                const isSelected = parent && parent.dataset.nodeId === elementId
                nodeEl.classList.toggle('is-selected', Boolean(isSelected))
            })
            this.nodesLayer.querySelectorAll('.scene-node').forEach(sceneEl => {
                const isSelected = (sceneEl as HTMLElement).dataset.sceneId === elementId
                sceneEl.classList.toggle('is-selected', Boolean(isSelected))
            })
        }

        if (elementId) {
            const paragraphs = this.options.getParagraphs()
            const isParagraph = paragraphs.some(p => p.getId() === elementId)
            if (isParagraph) {
                this.selectedParagraphIds.clear()
                this.selectedParagraphIds.add(elementId)
                this.updateSelectionToolbar()
            }
        }

        this.syncTransform()
    }

    public getZoom(): number {
        if (!this.cy || typeof this.cy.zoom !== 'function') return 1
        return this.cy.zoom() || 1
    }

    public getZoomPercentage(): number {
        return Math.round(this.getZoom() * 100)
    }

    public setWheelSensitivity(sensitivity: number): void {
        this.options.wheelSensitivity = sensitivity
        if (this.cy) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cyAny = this.cy as any
            if (cyAny._private?.options) {
                cyAny._private.options.wheelSensitivity = sensitivity
            }
            if (cyAny._private?.renderer) {
                cyAny._private.renderer.wheelSensitivity = sensitivity
            }
        }
    }

    public getWheelSensitivity(): number {
        return this.options.wheelSensitivity ?? GRAPH_THEME.zoom.wheelSensitivity
    }

    public getCtrlWheelMultiplier(): number {
        return this.options.ctrlWheelMultiplier ?? GRAPH_THEME.zoom.ctrlWheelMultiplier ?? 2.5
    }

    public setCtrlWheelMultiplier(multiplier: number): void {
        this.options.ctrlWheelMultiplier = Math.max(1.0, multiplier)
    }

    public zoomTo(targetZoom: number, animate: boolean = true): void {
        if (!this.cy) return
        const clampedZoom = Math.max(
            GRAPH_THEME.zoom.min,
            Math.min(GRAPH_THEME.zoom.max, targetZoom)
        )
        const containerRect = this.canvasContainer?.getBoundingClientRect()
        const width = containerRect?.width || this.canvasContainer?.clientWidth || 800
        const height = containerRect?.height || this.canvasContainer?.clientHeight || 600
        const renderedPosition = {
            x: width / 2,
            y: height / 2,
        }

        if (animate && typeof this.cy.animate === 'function') {
            this.cy.animate(
                {
                    zoom: {
                        level: clampedZoom,
                        renderedPosition,
                    },
                },
                {
                    duration: 180,
                    easing: 'ease-out-cubic',
                    complete: () => this.syncTransform(),
                }
            )
        } else {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(this.cy as any).zoom({
                    level: clampedZoom,
                    renderedPosition,
                })
            } catch {
                if (typeof this.cy.zoom === 'function') {
                    this.cy.zoom(clampedZoom)
                }
            }
            this.syncTransform()
        }
    }

    public zoomIn(stepMultiplier: number = 1.25): void {
        const current = this.getZoom()
        this.zoomTo(current * stepMultiplier)
    }

    public zoomOut(stepMultiplier: number = 1.25): void {
        const current = this.getZoom()
        this.zoomTo(current / stepMultiplier)
    }

    public resetZoom(): void {
        this.zoomTo(1.0)
    }

    public fit(padding: number = 40): void {
        if (this.cy && typeof this.cy.fit === 'function') {
            this.cy.fit(undefined, padding)
            this.syncTransform()
        }
    }

    /**
     * Centers the graph viewport on all nodes/elements.
     *
     * @param {boolean} [animate=true] Whether to animate the pan to center
     */
    public center(animate: boolean = true): void {
        if (!this.cy) {
            this.render(false)
        }
        if (!this.cy) return

        this.cy.resize()

        const nodes =
            typeof this.cy.nodes === 'function' && (this.cy.nodes().length ?? 0) > 0
                ? this.cy.nodes()
                : typeof this.cy.elements === 'function'
                  ? this.cy.elements()
                  : null

        const hasNodes = Boolean(
            nodes &&
            (typeof nodes.nonempty === 'function'
                ? nodes.nonempty()
                : nodes.length === undefined || (nodes.length ?? 0) > 0)
        )

        if (hasNodes && nodes) {
            if (animate && typeof this.cy.animate === 'function') {
                this.cy.animate(
                    {
                        center: { eles: nodes },
                    },
                    {
                        duration: 350,
                        easing: 'ease-out-cubic',
                        complete: () => {
                            this.syncTransform()
                        },
                    }
                )
            } else if (typeof this.cy.center === 'function') {
                this.cy.center(nodes)
                this.syncTransform()
            }
        } else if (typeof this.cy.center === 'function') {
            this.cy.center()
            this.syncTransform()
        }
    }

    public resize(): void {
        if (this.cy) {
            this.cy.resize()
            this.syncTransform()
        }
    }

    private applyWheelZoom(e: WheelEvent): void {
        if (!this.cy || !this.canvasContainer) return
        if (this.isRmbPanning || this.isMarqueeActive) {
            e.preventDefault()
            return
        }

        e.preventDefault()

        const baseSensitivity = this.getWheelSensitivity()
        const isCtrl = e.ctrlKey || e.metaKey
        const multiplier = isCtrl ? this.getCtrlWheelMultiplier() : 1.0
        const sensitivity = baseSensitivity * multiplier

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cyAny = this.cy as any
        if (cyAny._private?.renderer) {
            cyAny._private.renderer.wheelSensitivity = sensitivity
        }

        const initialZoom = typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1
        const containerRect =
            typeof this.canvasContainer.getBoundingClientRect === 'function'
                ? this.canvasContainer.getBoundingClientRect()
                : null
        const renderedPosition = {
            x: containerRect ? e.clientX - containerRect.left : e.clientX,
            y: containerRect ? e.clientY - containerRect.top : e.clientY,
        }

        let diff = (e.deltaY / -250) * sensitivity
        if (e.deltaMode === 1) {
            diff *= 33
        }

        const newZoom = Math.max(
            GRAPH_THEME.zoom.min,
            Math.min(GRAPH_THEME.zoom.max, initialZoom * Math.pow(10, diff))
        )

        const prevZoom = typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.cy as any).zoom({
                level: newZoom,
                renderedPosition,
            })
        } catch {
            if (typeof this.cy.zoom === 'function') {
                this.cy.zoom(newZoom)
            }
        }
        if (
            typeof this.cy.zoom === 'function' &&
            this.cy.zoom() === prevZoom &&
            newZoom !== prevZoom
        ) {
            this.cy.zoom(newZoom)
        }
        this.syncTransform()
    }

    public handleCanvasContainerWheel(e: WheelEvent): void {
        this.applyWheelZoom(e)
    }

    public handleNodesLayerWheel(e: WheelEvent): void {
        e.stopPropagation()
        this.applyWheelZoom(e)
    }

    public isPanningWithRmb(): boolean {
        return this.isRmbPanning
    }

    public handleGraphPointerDown(e: PointerEvent | MouseEvent): void {
        if (e.button !== 2) return // Only right mouse button (RMB)
        if (this.isRmbPanning) return

        const target = e.target as HTMLElement | null
        if (target && target.closest('input, textarea, select')) return

        e.preventDefault()
        e.stopPropagation()

        this.isRmbPanning = true
        this.rmbPanMoved = false
        this.rmbPanStartX = e.clientX
        this.rmbPanStartY = e.clientY
        this.rmbPanLastX = e.clientX
        this.rmbPanLastY = e.clientY

        const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
        if (wrapper) {
            wrapper.classList.add('is-panning')
        }

        window.addEventListener('pointermove', this.boundGraphPointerMove as EventListener)
        window.addEventListener('pointerup', this.boundGraphPointerUp as EventListener)
        window.addEventListener('pointercancel', this.boundGraphPointerUp as EventListener)
        window.addEventListener('mousemove', this.boundGraphPointerMove as EventListener)
        window.addEventListener('mouseup', this.boundGraphPointerUp as EventListener)
    }

    public handleGraphPointerMove(e: PointerEvent | MouseEvent): void {
        if (!this.isRmbPanning || !this.cy) return
        e.preventDefault()

        const dx = e.clientX - this.rmbPanLastX
        const dy = e.clientY - this.rmbPanLastY

        if (
            !this.rmbPanMoved &&
            Math.hypot(e.clientX - this.rmbPanStartX, e.clientY - this.rmbPanStartY) > 2
        ) {
            this.rmbPanMoved = true
        }

        if (dx !== 0 || dy !== 0) {
            this.rmbPanLastX = e.clientX
            this.rmbPanLastY = e.clientY

            if (typeof this.cy.panBy === 'function') {
                this.cy.panBy({ x: dx, y: dy })
            } else if (typeof this.cy.pan === 'function') {
                const curPan = this.cy.pan() || { x: 0, y: 0 }
                this.cy.pan({ x: curPan.x + dx, y: curPan.y + dy })
            }
            this.syncTransform()
        }
    }

    public handleGraphPointerUp(e: PointerEvent | MouseEvent): void {
        if (e.type === 'pointercancel' || e.button === 2) {
            if (!this.isRmbPanning) return
            this.isRmbPanning = false

            const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
            if (wrapper) {
                wrapper.classList.remove('is-panning')
            }

            window.removeEventListener('pointermove', this.boundGraphPointerMove as EventListener)
            window.removeEventListener('pointerup', this.boundGraphPointerUp as EventListener)
            window.removeEventListener('pointercancel', this.boundGraphPointerUp as EventListener)
            window.removeEventListener('mousemove', this.boundGraphPointerMove as EventListener)
            window.removeEventListener('mouseup', this.boundGraphPointerUp as EventListener)
        }
    }

    public handleContextMenu(e: MouseEvent): void {
        const target = e.target as HTMLElement | null
        if (
            target &&
            typeof target.closest === 'function' &&
            target.closest('input, textarea, select')
        )
            return
        e.preventDefault()
        e.stopPropagation()
    }

    public getSelectedParagraphIds(): string[] {
        return Array.from(this.selectedParagraphIds)
    }

    public setSelectedParagraphIds(ids: string[]): void {
        this.selectedParagraphIds = new Set(ids)
        this.updateSelectionVisuals()
        this.updateSelectionToolbar()
    }

    public selectAllParagraphs(): void {
        const paragraphs = this.options.getParagraphs()
        this.selectedParagraphIds.clear()
        paragraphs.forEach(p => {
            if (p && p.getId()) {
                this.selectedParagraphIds.add(p.getId())
            }
        })
        this.updateSelectionVisuals()
        this.updateSelectionToolbar()
    }

    public clearSelection(): void {
        this.selectedParagraphIds.clear()
        this.updateSelectionVisuals()
        this.updateSelectionToolbar()
    }

    public toggleParagraphSelection(id: string): void {
        if (this.selectedParagraphIds.has(id)) {
            this.selectedParagraphIds.delete(id)
        } else {
            this.selectedParagraphIds.add(id)
        }
        this.updateSelectionVisuals()
        this.updateSelectionToolbar()
    }

    public updateSelectionVisuals(): void {
        if (!this.nodesLayer) return
        this.nodesLayer.querySelectorAll('paragraph-node').forEach(el => {
            const nodeEl = el as ParagraphNode
            const pId = nodeEl.dataset.nodeId
            const isSelected = Boolean(pId && this.selectedParagraphIds.has(pId))
            const innerNode = nodeEl.querySelector('.paragraph-node')
            if (innerNode) {
                innerNode.classList.toggle('is-selected', isSelected)
            }
            nodeEl.classList.toggle('is-selected', isSelected)
        })
        if (this.options.onSelectionChange) {
            this.options.onSelectionChange(Array.from(this.selectedParagraphIds))
        }
    }

    private getOrCreateMarqueeElement(): HTMLElement {
        const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
        let marquee = wrapper
            ? (wrapper.querySelector('#graph-selection-marquee') as HTMLElement | null)
            : null
        if (!marquee) {
            marquee = document.createElement('div')
            marquee.id = 'graph-selection-marquee'
            marquee.className =
                'hidden pointer-events-none absolute z-20 border border-dashed border-blue-400 bg-blue-500/15 rounded'
            if (wrapper) {
                wrapper.appendChild(marquee)
            }
        }
        return marquee
    }

    private getOrCreateSelectionToolbar(): HTMLElement | null {
        const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
        if (!wrapper) return null
        let toolbar = wrapper.querySelector('#graph-selection-toolbar') as HTMLElement | null
        if (!toolbar) {
            toolbar = document.createElement('div')
            toolbar.id = 'graph-selection-toolbar'
            toolbar.className =
                'hidden absolute top-4 left-1/2 -translate-x-1/2 z-30 items-center bg-[#202023]/95 backdrop-blur-md border border-blue-500/40 rounded-lg shadow-2xl p-1.5 px-3 gap-2.5 select-none'
            toolbar.setAttribute('role', 'toolbar')
            toolbar.setAttribute('aria-label', 'Pasek akcji zaznaczonych paragrafów')
            toolbar.innerHTML = `
                <div class="flex items-center gap-1.5 text-xs font-medium text-zinc-300 pr-2 border-r border-zinc-700">
                    <app-icon name="paragraph" class="w-3.5 h-3.5 text-blue-400"></app-icon>
                    <span id="graph-selection-count-text">Zaznaczono: 0</span>
                </div>
                <button
                    id="btn-selection-create-scene"
                    type="button"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer shadow-sm"
                    title="${this.options.t('graph.selection.create_scene_title') || 'Utwórz nową scenę obejmującą zaznaczone paragrafy (Ctrl+G)'}"
                >
                    <app-icon name="scene" class="w-3.5 h-3.5 text-white"></app-icon>
                    <span>${this.options.t('graph.selection.create_scene') || 'Utwórz scenę'}</span>
                    <span class="text-[10px] opacity-75 font-normal">(Ctrl+G)</span>
                </button>
                <button
                    id="btn-selection-clear"
                    type="button"
                    class="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                    title="${this.options.t('graph.selection.clear_selection_title') || 'Wyczyść zaznaczenie (Esc)'}"
                    aria-label="Wyczyść zaznaczenie"
                >
                    <app-icon name="close" class="w-3.5 h-3.5"></app-icon>
                </button>
            `
            wrapper.appendChild(toolbar)
        }

        const btnCreate = toolbar.querySelector(
            '#btn-selection-create-scene'
        ) as HTMLButtonElement | null
        if (btnCreate && !btnCreate.dataset.bound) {
            btnCreate.dataset.bound = 'true'
            btnCreate.addEventListener('click', e => {
                e.stopPropagation()
                this.createSceneFromSelection()
            })
        }
        const btnClear = toolbar.querySelector('#btn-selection-clear') as HTMLButtonElement | null
        if (btnClear && !btnClear.dataset.bound) {
            btnClear.dataset.bound = 'true'
            btnClear.addEventListener('click', e => {
                e.stopPropagation()
                this.clearSelection()
            })
        }

        return toolbar
    }

    public updateSelectionToolbar(): void {
        const toolbar = this.getOrCreateSelectionToolbar()
        if (!toolbar) return

        if (this.selectedParagraphIds.size >= 2) {
            const countTextEl = toolbar.querySelector('#graph-selection-count-text')
            if (countTextEl) {
                const countMsg = this.options.t
                    ? this.options.t('graph.selection.selected_count', {
                          count: this.selectedParagraphIds.size,
                      })
                    : `Zaznaczono: ${this.selectedParagraphIds.size}`
                countTextEl.textContent = countMsg
            }
            toolbar.classList.remove('hidden')
            toolbar.style.display = 'flex'
        } else {
            toolbar.classList.add('hidden')
            toolbar.style.display = 'none'
        }
    }

    public createSceneFromSelection(sceneName?: string): Scene | null {
        const paragraphs = this.options.getParagraphs()
        const selected = paragraphs.filter(p => this.selectedParagraphIds.has(p.getId()))
        if (selected.length === 0) return null

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        const nodeW = GRAPH_THEME.dimensions.nodeWidth
        const nodeH = GRAPH_THEME.dimensions.nodeHeight

        selected.forEach(p => {
            const pos = p.getPosition() || { x: 0, y: 0 }
            let w: number = nodeW
            let h: number = nodeH
            const el = this.nodesLayer?.querySelector(
                `paragraph-node[data-node-id="${p.getId()}"]`
            ) as HTMLElement | null
            if (el) {
                const rectW = el.offsetWidth || el.getBoundingClientRect?.().width
                const rectH = el.offsetHeight || el.getBoundingClientRect?.().height
                if (rectW && rectW > 0) w = rectW
                if (rectH && rectH > 0) h = rectH
            }
            const left = pos.x - w / 2
            const top = pos.y - h / 2
            const right = pos.x + w / 2
            const bottom = pos.y + h / 2

            minX = Math.min(minX, left)
            minY = Math.min(minY, top)
            maxX = Math.max(maxX, right)
            maxY = Math.max(maxY, bottom)
        })

        const paddingX = 40
        const paddingTop = 60
        const paddingBottom = 40

        const sX = Math.round(minX - paddingX)
        const sY = Math.round(minY - paddingTop)
        const sW = Math.max(
            GRAPH_THEME.dimensions.sceneMinWidth,
            Math.round(maxX - minX + paddingX * 2)
        )
        const sH = Math.max(
            GRAPH_THEME.dimensions.sceneMinHeight,
            Math.round(maxY - minY + paddingTop + paddingBottom)
        )

        const defaultName = this.options.t
            ? this.options.t('graph.selection.default_scene_name')
            : 'Nowa scena'
        const name = sceneName || defaultName

        let newScene: Scene
        if (this.options.onCreateScene) {
            const created = this.options.onCreateScene(name, { x: sX, y: sY }, sW, sH, selected)
            if (created) {
                newScene = created
            } else {
                newScene = new Scene(
                    '',
                    name,
                    undefined,
                    selected,
                    [],
                    null,
                    [],
                    '',
                    { x: sX, y: sY },
                    sW,
                    sH
                )
                this.options.getScenes().push(newScene)
            }
        } else {
            newScene = new Scene(
                '',
                name,
                undefined,
                selected,
                [],
                null,
                [],
                '',
                { x: sX, y: sY },
                sW,
                sH
            )
            this.options.getScenes().push(newScene)
        }

        const allScenes = this.options.getScenes()
        this.syncParagraphSceneAssignments(paragraphs, allScenes)
        this.options.onToast(
            'success',
            this.options.t('graph.selection.scene_created', {
                name: newScene.getName() || defaultName,
                count: selected.length,
            }),
            this.options.t('toast.element_created_title')
        )
        this.options.onGraphModified?.()
        this.clearSelection()
        this.render(true)
        return newScene
    }

    public handleCanvasPointerDown(e: PointerEvent | MouseEvent): void {
        if (e.button !== 0) return // Only primary button (LMB)
        if (this.isRmbPanning) return
        if (this.isMarqueeCandidate || this.isMarqueeActive) return

        const target = e.target as HTMLElement | null
        if (
            target &&
            typeof target.closest === 'function' &&
            (target.closest('paragraph-node') ||
                target.closest('.paragraph-node') ||
                target.closest('.paragraph-node-socket') ||
                target.closest('.paragraph-node-add-container') ||
                target.closest('scene-node') ||
                target.closest('.scene-node') ||
                target.closest('.scene-resize-handle') ||
                target.closest('.scene-node-lock-btn') ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('textarea') ||
                target.closest('select'))
        ) {
            return
        }

        this.isMarqueeCandidate = true
        this.isMarqueeActive = false
        this.marqueeStartX = e.clientX
        this.marqueeStartY = e.clientY
        this.marqueeShiftMode = Boolean(e.shiftKey || e.ctrlKey || e.metaKey)

        window.addEventListener('pointermove', this.boundWindowPointerMove as EventListener)
        window.addEventListener('pointerup', this.boundWindowPointerUp as EventListener)
        window.addEventListener('pointercancel', this.boundWindowPointerUp as EventListener)
        window.addEventListener('mousemove', this.boundWindowPointerMove as EventListener)
        window.addEventListener('mouseup', this.boundWindowPointerUp as EventListener)
    }

    public handleWindowPointerMove(e: PointerEvent | MouseEvent): void {
        if (!this.isMarqueeCandidate && !this.isMarqueeActive) return

        const dx = e.clientX - this.marqueeStartX
        const dy = e.clientY - this.marqueeStartY

        if (this.isMarqueeCandidate && Math.hypot(dx, dy) > 4) {
            this.isMarqueeCandidate = false
            this.isMarqueeActive = true
            if (!this.marqueeShiftMode) {
                this.selectedParagraphIds.clear()
            }
        }

        if (this.isMarqueeActive) {
            e.preventDefault()
            const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
            const wrapperRect = wrapper.getBoundingClientRect()

            const screenMinX = Math.min(this.marqueeStartX, e.clientX)
            const screenMaxX = Math.max(this.marqueeStartX, e.clientX)
            const screenMinY = Math.min(this.marqueeStartY, e.clientY)
            const screenMaxY = Math.max(this.marqueeStartY, e.clientY)

            const marqueeEl = this.getOrCreateMarqueeElement()
            marqueeEl.classList.remove('hidden')
            marqueeEl.style.display = 'block'
            marqueeEl.style.left = `${screenMinX - wrapperRect.left}px`
            marqueeEl.style.top = `${screenMinY - wrapperRect.top}px`
            marqueeEl.style.width = `${screenMaxX - screenMinX}px`
            marqueeEl.style.height = `${screenMaxY - screenMinY}px`

            // Convert screen rectangle to graph coordinates
            const pan = this.cy ? this.cy.pan() : { x: 0, y: 0 }
            const zoom = this.cy ? this.cy.zoom() : 1
            const graphMinX = (screenMinX - wrapperRect.left - pan.x) / zoom
            const graphMaxX = (screenMaxX - wrapperRect.left - pan.x) / zoom
            const graphMinY = (screenMinY - wrapperRect.top - pan.y) / zoom
            const graphMaxY = (screenMaxY - wrapperRect.top - pan.y) / zoom

            const nodeW = GRAPH_THEME.dimensions.nodeWidth
            const nodeH = GRAPH_THEME.dimensions.nodeHeight
            const paragraphs = this.options.getParagraphs()

            paragraphs.forEach(p => {
                const pos = p.getPosition()
                if (!pos) return
                const pLeft = pos.x - nodeW / 2
                const pRight = pos.x + nodeW / 2
                const pTop = pos.y - nodeH / 2
                const pBottom = pos.y + nodeH / 2
                const intersects = !(
                    pRight < graphMinX ||
                    pLeft > graphMaxX ||
                    pBottom < graphMinY ||
                    pTop > graphMaxY
                )
                if (intersects) {
                    this.selectedParagraphIds.add(p.getId())
                } else if (!this.marqueeShiftMode) {
                    this.selectedParagraphIds.delete(p.getId())
                }
            })
            this.updateSelectionVisuals()
        }
    }

    public handleWindowPointerUp(_e: PointerEvent | MouseEvent): void {
        if (this.isMarqueeActive) {
            this.isMarqueeActive = false
            const marqueeEl = this.getOrCreateMarqueeElement()
            marqueeEl.classList.add('hidden')
            marqueeEl.style.display = 'none'
            this.updateSelectionToolbar()
        } else if (this.isMarqueeCandidate) {
            this.isMarqueeCandidate = false
            this.clearSelection()
        }

        window.removeEventListener('pointermove', this.boundWindowPointerMove as EventListener)
        window.removeEventListener('pointerup', this.boundWindowPointerUp as EventListener)
        window.removeEventListener('pointercancel', this.boundWindowPointerUp as EventListener)
        window.removeEventListener('mousemove', this.boundWindowPointerMove as EventListener)
        window.removeEventListener('mouseup', this.boundWindowPointerUp as EventListener)
    }

    public handleWindowKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement | null
        if (
            target &&
            typeof target.closest === 'function' &&
            (target.closest('input') ||
                target.closest('textarea') ||
                target.closest('[contenteditable="true"]'))
        ) {
            return
        }

        if (e.key === 'Escape') {
            if (this.selectedParagraphIds.size > 0) {
                e.preventDefault()
                this.clearSelection()
            }
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault()
            this.selectAllParagraphs()
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G')) {
            if (this.selectedParagraphIds.size >= 2) {
                e.preventDefault()
                this.createSceneFromSelection()
            }
        }
    }

    public destroy(): void {
        if (this.boundWindowKeyDown) {
            window.removeEventListener('keydown', this.boundWindowKeyDown)
        }
        if (this.boundWindowPointerMove) {
            window.removeEventListener('pointermove', this.boundWindowPointerMove as EventListener)
            window.removeEventListener('mousemove', this.boundWindowPointerMove as EventListener)
        }
        if (this.boundWindowPointerUp) {
            window.removeEventListener('pointerup', this.boundWindowPointerUp as EventListener)
            window.removeEventListener('pointercancel', this.boundWindowPointerUp as EventListener)
            window.removeEventListener('mouseup', this.boundWindowPointerUp as EventListener)
        }
        if (this.nodesLayer) {
            if (this.boundNodesLayerWheel) {
                this.nodesLayer.removeEventListener('wheel', this.boundNodesLayerWheel)
            }
            if (this.boundGraphPointerDown) {
                this.nodesLayer.removeEventListener(
                    'pointerdown',
                    this.boundGraphPointerDown as EventListener
                )
                this.nodesLayer.removeEventListener(
                    'mousedown',
                    this.boundGraphPointerDown as EventListener
                )
            }
            if (this.boundCanvasPointerDown) {
                this.nodesLayer.removeEventListener(
                    'pointerdown',
                    this.boundCanvasPointerDown as EventListener
                )
                this.nodesLayer.removeEventListener(
                    'mousedown',
                    this.boundCanvasPointerDown as EventListener
                )
            }
            if (this.boundContextMenu) {
                this.nodesLayer.removeEventListener('contextmenu', this.boundContextMenu)
            }
        }
        if (this.canvasContainer) {
            if (this.boundCanvasContainerWheel) {
                this.canvasContainer.removeEventListener('wheel', this.boundCanvasContainerWheel, {
                    capture: true,
                })
            }
            if (this.boundGraphPointerDown) {
                this.canvasContainer.removeEventListener(
                    'pointerdown',
                    this.boundGraphPointerDown as EventListener
                )
                this.canvasContainer.removeEventListener(
                    'mousedown',
                    this.boundGraphPointerDown as EventListener
                )
            }
            if (this.boundCanvasPointerDown) {
                this.canvasContainer.removeEventListener(
                    'pointerdown',
                    this.boundCanvasPointerDown as EventListener
                )
                this.canvasContainer.removeEventListener(
                    'mousedown',
                    this.boundCanvasPointerDown as EventListener
                )
            }
            if (this.boundContextMenu) {
                this.canvasContainer.removeEventListener('contextmenu', this.boundContextMenu)
            }
            const wrapper = this.canvasContainer.parentElement
            if (wrapper && wrapper !== document.body && this.boundContextMenu) {
                wrapper.removeEventListener('contextmenu', this.boundContextMenu)
            }
        }
        if (this.boundGraphPointerMove) {
            window.removeEventListener('pointermove', this.boundGraphPointerMove as EventListener)
            window.removeEventListener('mousemove', this.boundGraphPointerMove as EventListener)
        }
        if (this.boundGraphPointerUp) {
            window.removeEventListener('pointerup', this.boundGraphPointerUp as EventListener)
            window.removeEventListener('pointercancel', this.boundGraphPointerUp as EventListener)
            window.removeEventListener('mouseup', this.boundGraphPointerUp as EventListener)
        }
        const wrapper = this.canvasContainer?.parentElement || this.canvasContainer
        if (wrapper) {
            wrapper.classList.remove('is-panning')
        }
        this.isRmbPanning = false
        this.selectedParagraphIds.clear()
        const marqueeEl = document.getElementById('graph-selection-marquee')
        if (marqueeEl) marqueeEl.remove()
        const toolbar = document.getElementById('graph-selection-toolbar')
        if (toolbar) toolbar.remove()
        if (this.cy) {
            this.cy.removeListener('pan zoom', this.boundSyncTransform)
            this.cy.destroy()
            this.cy = null
            window.cyInstance = null
        }
        if (this.nodesLayer) {
            this.nodesLayer.innerHTML = ''
        }
        const svg = document.getElementById('story-graph-drag-svg')
        if (svg) {
            svg.remove()
        }
    }

    public handleItemDropOnParagraph(
        targetParagraph: Paragraph,
        entityType: 'tag' | 'character' | 'location' | string,
        entityId: string
    ): void {
        if (targetParagraph.getIsStart && targetParagraph.getIsStart()) {
            return
        }
        const tags = this.options.getTags ? this.options.getTags() : []
        const characters = this.options.getCharacters ? this.options.getCharacters() : []
        const locations = this.options.getLocations ? this.options.getLocations() : []
        const t = this.options.t

        if (entityType === 'tag') {
            const tagObj = tags.find(x => x.getId() === entityId)
            if (tagObj) {
                targetParagraph.addTag(tagObj)
                const nodeEl = this.nodesLayer.querySelector(
                    `paragraph-node[data-node-id="${targetParagraph.getId()}"]`
                ) as ParagraphNode | null
                if (nodeEl) nodeEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetParagraph, tagObj, 'tag')
                }
                this.options.onToast(
                    'success',
                    t('toast.tag_assigned', {
                        tag: tagObj.getName(),
                        target: targetParagraph.getTitle() || targetParagraph.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        } else if (entityType === 'character') {
            const charObj = characters.find(x => x.getId() === entityId)
            if (charObj) {
                targetParagraph.addCharacter(charObj)
                const nodeEl = this.nodesLayer.querySelector(
                    `paragraph-node[data-node-id="${targetParagraph.getId()}"]`
                ) as ParagraphNode | null
                if (nodeEl) nodeEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetParagraph, charObj, 'character')
                }
                this.options.onToast(
                    'success',
                    t('toast.character_assigned', {
                        character: charObj.getName(),
                        target: targetParagraph.getTitle() || targetParagraph.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        } else if (entityType === 'location') {
            const locObj = locations.find(x => x.getId() === entityId)
            if (locObj) {
                targetParagraph.addLocation(locObj)
                const nodeEl = this.nodesLayer.querySelector(
                    `paragraph-node[data-node-id="${targetParagraph.getId()}"]`
                ) as ParagraphNode | null
                if (nodeEl) nodeEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetParagraph, locObj, 'location')
                }
                this.options.onToast(
                    'success',
                    t('toast.location_assigned', {
                        location: locObj.getName(),
                        target: targetParagraph.getTitle() || targetParagraph.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        }
    }

    public handleItemDropOnScene(
        targetScene: Scene,
        entityType: 'tag' | 'character' | 'location' | string,
        entityId: string
    ): void {
        const tags = this.options.getTags ? this.options.getTags() : []
        const characters = this.options.getCharacters ? this.options.getCharacters() : []
        const locations = this.options.getLocations ? this.options.getLocations() : []
        const t = this.options.t

        if (entityType === 'tag') {
            const tagObj = tags.find(x => x.getId() === entityId)
            if (tagObj) {
                targetScene.addTag(tagObj)
                const sceneEl = this.nodesLayer.querySelector(
                    `scene-node[data-scene-id="${targetScene.getId()}"]`
                ) as SceneNode | null
                if (sceneEl) sceneEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetScene, tagObj, 'tag')
                }
                this.options.onToast(
                    'success',
                    t('toast.tag_assigned', {
                        tag: tagObj.getName(),
                        target: targetScene.getName() || targetScene.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        } else if (entityType === 'character') {
            const charObj = characters.find(x => x.getId() === entityId)
            if (charObj) {
                targetScene.addCharacter(charObj)
                const sceneEl = this.nodesLayer.querySelector(
                    `scene-node[data-scene-id="${targetScene.getId()}"]`
                ) as SceneNode | null
                if (sceneEl) sceneEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetScene, charObj, 'character')
                }
                this.options.onToast(
                    'success',
                    t('toast.character_assigned', {
                        character: charObj.getName(),
                        target: targetScene.getName() || targetScene.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        } else if (entityType === 'location') {
            const locObj = locations.find(x => x.getId() === entityId)
            if (locObj) {
                targetScene.addLocation(locObj)
                const sceneEl = this.nodesLayer.querySelector(
                    `scene-node[data-scene-id="${targetScene.getId()}"]`
                ) as SceneNode | null
                if (sceneEl) sceneEl.render()
                if (this.options.onItemAssigned) {
                    this.options.onItemAssigned(targetScene, locObj, 'location')
                }
                this.options.onToast(
                    'success',
                    t('toast.location_assigned', {
                        location: locObj.getName(),
                        target: targetScene.getName() || targetScene.getId(),
                    }),
                    t('toast.element_created_title')
                )
            }
        }
    }
}
