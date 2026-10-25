import './ParagraphNode'
import './SceneNode'

import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ParagraphNode } from './ParagraphNode'
import { SceneNode } from './SceneNode'
import {
    calculateCurvedEdgeControlPointDistance,
    calculateEdgeSourceOffsets,
    ConnectionLineStyle,
    getStoryGraphStylesheet,
    GRAPH_THEME,
    preventChoiceLineCrossings,
} from './StoryGraphStyles'
import { IStoryGraphOptions } from './types'

export interface ICytoscapeInstance {
    pan: (pos?: { x: number; y: number }) => { x: number; y: number }
    zoom: (level?: number) => number
    center: (eles?: unknown) => void
    fit: (eles?: unknown, padding?: number) => void
    animate: (options: unknown, params?: unknown) => void
    stop?: (clearQueue?: boolean, jumpToEnd?: boolean) => void
    resize: () => void
    destroy: () => void
    nodes?: (selector?: string) => any
    elements?: (selector?: string) => any
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
    private dragLineSvg: SVGSVGElement | null = null

    constructor(options: IStoryGraphOptions) {
        this.canvasContainer = options.canvasContainer
        this.nodesLayer = options.nodesLayer
        this.options = options
        this.boundSyncTransform = this.syncTransform.bind(this)
        this.boundNodesLayerWheel = this.handleNodesLayerWheel.bind(this)
        if (this.nodesLayer) {
            this.nodesLayer.addEventListener('wheel', this.boundNodesLayerWheel, {
                passive: false,
            })
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

        if (this.cy) {
            this.cy.destroy()
            this.cy = null
        }

        this.cy = window.cytoscape({
            container: this.canvasContainer,
            elements,
            style: getStoryGraphStylesheet(lineStyle, this.options.customStyles),
            layout: { name: 'preset' },
            minZoom: GRAPH_THEME.zoom.min,
            maxZoom: GRAPH_THEME.zoom.max,
            wheelSensitivity: this.options.wheelSensitivity ?? GRAPH_THEME.zoom.wheelSensitivity,
        })

        window.cyInstance = this.cy

        this.cy.on('pan zoom', this.boundSyncTransform)

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
                    const outcomeObj = evt.target.data('outcomeObj') as any
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
    }

    /**
     * Resolves all outgoing transitions for a paragraph, including choices and combat outcomes.
     */
    private getTransitionsForParagraph(sourceP: Paragraph): Array<{
        id: string
        targetId: string
        label: string
        choiceObj?: Choice
        outcomeObj?: any
        isCombatOutcome: boolean
        hasCondition: boolean
    }> {
        const choices = sourceP.getChoices ? sourceP.getChoices() : []
        const hasCombat = Boolean(sourceP.getHasCombat && sourceP.getHasCombat())
        const combat = sourceP.getCombat ? sourceP.getCombat() : null
        const combatOutcomes =
            hasCombat && combat && typeof combat.getOutcomes === 'function'
                ? combat.getOutcomes()
                : []

        const transitions: Array<{
            id: string
            targetId: string
            label: string
            choiceObj?: Choice
            outcomeObj?: any
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
                    : Boolean((choice as any).isCombatOutcome)
            const matchingOutcome =
                hasCombat &&
                combatOutcomes.find(
                    (o: any) =>
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
                outcomeObj: matchingOutcome,
                isCombatOutcome: isCombat,
                hasCondition: Boolean(choice.getCondition()),
            })
        })

        // Also include any combat outcomes not yet present in choices
        if (hasCombat) {
            combatOutcomes.forEach((outcome: any, i: number) => {
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
                window.removeEventListener('pointermove', onScenePointerMove)
                window.removeEventListener('pointerup', onScenePointerUp)

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

            // Drag handling
            let isDragging = false
            let startX = 0
            let startY = 0
            let nodeStartX = pos.x
            let nodeStartY = pos.y
            let hasMoved = false

            const onPointerDown = (e: PointerEvent | MouseEvent): void => {
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

                isDragging = true
                hasMoved = false
                startX = e.clientX
                startY = e.clientY
                const currentPos = p.getPosition() || pos
                nodeStartX = currentPos.x
                nodeStartY = currentPos.y

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
                    const newX = Math.round(nodeStartX + dx)
                    const newY = Math.round(nodeStartY + dy)
                    nodeEl.setPosition(newX, newY)

                    if (this.cy) {
                        const cyNode = this.cy.getElementById(p.getId())
                        if (cyNode) {
                            cyNode.position({ x: newX, y: newY })
                        }
                    }
                    p.setPosition({ x: newX, y: newY })
                    const paras = this.options.getParagraphs()
                    preventChoiceLineCrossings(paras, p.getId())
                    this.updateEdgeGeometry(paras)
                }
            }

            const onPointerUp = (e: PointerEvent | MouseEvent): void => {
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

                    const zoom = this.cy ? this.cy.zoom() : 1
                    const dx = (e.clientX - startX) / zoom
                    const dy = (e.clientY - startY) / zoom
                    const finalPos = {
                        x: Math.round(nodeStartX + dx),
                        y: Math.round(nodeStartY + dy),
                    }
                    p.setPosition(finalPos)

                    if (this.cy) {
                        const cyNode = this.cy.getElementById(p.getId())
                        if (cyNode) {
                            cyNode.position(finalPos)
                        }
                    }

                    const paras = this.options.getParagraphs()
                    const allScenes = this.options.getScenes()
                    this.syncParagraphSceneAssignments(paras, allScenes)
                    this.updateParagraphNodeColors(paras, allScenes)
                    this.updateSceneNodeBadges(allScenes)

                    preventChoiceLineCrossings(paras, p.getId())
                    this.updateEdgeGeometry(paras)

                    if (this.options.onSceneAssignmentChange) {
                        const containingScenes = allScenes.filter(s => s.hasParagraph(p.getId()))
                        containingScenes.forEach(s => {
                            if (this.options.onSceneAssignmentChange) {
                                this.options.onSceneAssignmentChange(s, s.getParagraphs())
                            }
                        })
                    }
                    this.options.onGraphModified?.()
                }
            }

            nodeEl.addEventListener('pointerdown', onPointerDown as EventListener)

            // Selection / Details event (triggered on double click)
            const openDetails = (): void => {
                const containingScenes = scenes.filter(s => s.hasParagraph(p.getId()))
                containingScenes.sort((a, b) => a.getArea() - b.getArea())
                const currentPScene = containingScenes[0]
                this.options.onSelectParagraph(p, currentPScene)
                this.nodesLayer.querySelectorAll('.paragraph-node').forEach(n => {
                    n.classList.toggle('is-selected', n === nodeEl.querySelector('.paragraph-node'))
                })
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
                : typeof (cyEle as any).empty === 'function'
                  ? !(cyEle as any).empty()
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
                                : typeof (cySrcEle as any).empty === 'function'
                                  ? !(cySrcEle as any).empty()
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
            typeof this.cy.nodes === 'function' && this.cy.nodes().length > 0
                ? this.cy.nodes()
                : typeof this.cy.elements === 'function'
                  ? this.cy.elements()
                  : null

        const hasNodes = Boolean(
            nodes &&
            (typeof nodes.nonempty === 'function'
                ? nodes.nonempty()
                : (nodes as any).length === undefined || (nodes as any).length > 0)
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

    public handleNodesLayerWheel(e: WheelEvent): void {
        if (!this.cy || !this.canvasContainer) return
        e.preventDefault()
        e.stopPropagation()

        // 1. Forward the exact WheelEvent to Cytoscape's canvas container so Cytoscape's internal
        // wheel listener handles the event natively with 100% identical math, speed and sensitivity.
        const clonedEvent = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
        })

        const initialZoom = typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1
        this.canvasContainer.dispatchEvent(clonedEvent)

        // 2. Fallback in case Cytoscape DOM listener is not triggered (e.g. In unit test mocks):
        // use Cytoscape's exact official formula: diff = (delta / -250) * sensitivity, newZoom = zoom * 10^diff
        const afterZoom = typeof this.cy.zoom === 'function' ? this.cy.zoom() : 1
        if (afterZoom === initialZoom && typeof this.cy.zoom === 'function') {
            const containerRect = this.canvasContainer.getBoundingClientRect()
            const renderedPosition = {
                x: containerRect ? e.clientX - containerRect.left : e.clientX,
                y: containerRect ? e.clientY - containerRect.top : e.clientY,
            }
            const sensitivity = this.getWheelSensitivity()
            let diff = (e.deltaY / -250) * sensitivity
            if (e.deltaMode === 1) {
                diff *= 33
            }
            const newZoom = Math.max(
                GRAPH_THEME.zoom.min,
                Math.min(GRAPH_THEME.zoom.max, initialZoom * Math.pow(10, diff))
            )

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(this.cy as any).zoom({
                    level: newZoom,
                    renderedPosition,
                })
            } catch {
                this.cy.zoom(newZoom)
            }
            this.syncTransform()
        }
    }

    public destroy(): void {
        if (this.nodesLayer && this.boundNodesLayerWheel) {
            this.nodesLayer.removeEventListener('wheel', this.boundNodesLayerWheel)
        }
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
