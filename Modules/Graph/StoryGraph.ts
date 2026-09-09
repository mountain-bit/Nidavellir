import './ParagraphNode'

import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ParagraphNode } from './ParagraphNode'
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
    resize: () => void
    destroy: () => void
    on: (events: string, selectorOrHandler: unknown, handler?: unknown) => void
    removeListener: (events: string, handler: unknown) => void
    getElementById: (id: string) =>
        | {
              position: (pos?: { x: number; y: number }) => { x: number; y: number }
              data: (key?: string, val?: unknown) => unknown
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
    private dragLineSvg: SVGSVGElement | null = null

    constructor(options: IStoryGraphOptions) {
        this.canvasContainer = options.canvasContainer
        this.nodesLayer = options.nodesLayer
        this.options = options
        this.boundSyncTransform = this.syncTransform.bind(this)
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

        // Build edges for choices with multi-output vertical offsets and curved control points
        paragraphs.forEach(sourceP => {
            const choices = sourceP.getChoices ? sourceP.getChoices() : []
            if (choices.length === 0) return

            const offsets = calculateEdgeSourceOffsets(choices.length)
            const sourcePos = sourceP.getPosition() || { x: 0, y: 0 }

            choices.forEach((choice, i) => {
                const targetId = choice.getToParagraphId()
                if (!targetId) return

                const targetP = paragraphs.find(p => p.getId() === targetId)
                if (!targetP) return

                const targetPos = targetP.getPosition() || { x: 0, y: 0 }
                const offsetY = offsets[i] !== undefined ? offsets[i] : 0
                const hasCondition = Boolean(choice.getCondition())
                const label = choice.getName() || ''
                const ctrlDist = calculateCurvedEdgeControlPointDistance(
                    sourcePos,
                    targetPos,
                    i,
                    choices.length
                )

                elements.push({
                    data: {
                        id: choice.getId() || `edge_${sourceP.getId()}_${targetId}_${i}`,
                        source: sourceP.getId(),
                        target: targetId,
                        label,
                        choiceObj: choice,
                        sourceEndpoint: `${GRAPH_THEME.dimensions.nodeWidth / 2}px ${offsetY}px`,
                        targetEndpoint: `-${GRAPH_THEME.dimensions.nodeWidth / 2}px 0px`,
                        ctrlDist,
                    },
                    classes: hasCondition ? 'has-condition' : '',
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
            if (choiceObj && this.options.onSelectChoice) {
                const sourceP = paragraphs.find(p => p.getId() === sourceId)
                const targetP = paragraphs.find(p => p.getId() === targetId)
                this.options.onSelectChoice(choiceObj, sourceP, targetP)
            }
        })

        this.renderCustomNodes(paragraphs, scenes)
        this.syncTransform()
    }

    public renderCustomNodes(paragraphs: Paragraph[], scenes: Scene[]): void {
        if (!this.nodesLayer) return
        this.nodesLayer.innerHTML = ''

        paragraphs.forEach((p, index) => {
            let pos = p.getPosition()
            if (!pos) {
                pos = this.calculateDefaultPosition(index)
                p.setPosition(pos)
            }

            const parentScene = scenes.find(s => s.hasParagraph && s.hasParagraph(p.getId()))
            const sceneColor = GRAPH_THEME.colors.defaultScene

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
                    preventChoiceLineCrossings(paras, p.getId())
                    this.updateEdgeGeometry(paras)
                }
            }

            nodeEl.addEventListener('pointerdown', onPointerDown as EventListener)

            // Selection / Details event (triggered on double click)
            const openDetails = (): void => {
                this.options.onSelectParagraph(p, parentScene)
                this.nodesLayer.querySelectorAll('.paragraph-node').forEach(n => {
                    n.classList.toggle('is-selected', n === nodeEl.querySelector('.paragraph-node'))
                })
            }
            nodeEl.addEventListener('node-open-details', openDetails)
            nodeEl.addEventListener('node-select', openDetails)

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

        // Create or get floating SVG container
        let svg = document.getElementById('story-graph-drag-svg') as SVGSVGElement | null
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.id = 'story-graph-drag-svg'
            svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none z-40')
            this.canvasContainer.appendChild(svg)
        }
        svg.innerHTML = `
            <defs>
                <marker id="drag-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="${GRAPH_THEME.colors.edgeSelected}" />
                </marker>
            </defs>
            <path id="drag-preview-path" fill="none" stroke="${GRAPH_THEME.colors.edgeSelected}" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#drag-arrow)" />
        `

        const pathEl = svg.querySelector('#drag-preview-path') as SVGPathElement | null

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

            if (svg) {
                svg.innerHTML = ''
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
            const choices = sourceP.getChoices ? sourceP.getChoices() : []
            if (choices.length === 0) return

            const offsets = calculateEdgeSourceOffsets(choices.length)
            const sourcePos = sourceP.getPosition() || { x: 0, y: 0 }

            choices.forEach((choice, i) => {
                const targetId = choice.getToParagraphId()
                if (!targetId) return

                const targetP = paras.find(p => p.getId() === targetId)
                if (!targetP) return

                const targetPos = targetP.getPosition() || { x: 0, y: 0 }
                const offsetY = offsets[i] !== undefined ? offsets[i] : 0
                const ctrlDist = calculateCurvedEdgeControlPointDistance(
                    sourcePos,
                    targetPos,
                    i,
                    choices.length
                )

                const edgeId = choice.getId() || `edge_${sourceP.getId()}_${targetId}_${i}`
                const cyEdge = this.cy?.getElementById(edgeId)
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

        const cyEle = this.cy.getElementById(elementId)
        if (cyEle) {
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
                for (const srcP of paragraphs) {
                    if (srcP.hasChoice && srcP.hasChoice(elementId)) {
                        const cySrcEle = this.cy.getElementById(srcP.getId())
                        if (cySrcEle) {
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
            }
        }

        // Highlight selected node visually in custom nodes layer
        if (this.nodesLayer) {
            this.nodesLayer.querySelectorAll('.paragraph-node').forEach(nodeEl => {
                const parent = nodeEl.closest('paragraph-node') as HTMLElement
                const isSelected = parent && parent.dataset.nodeId === elementId
                nodeEl.classList.toggle('is-selected', Boolean(isSelected))
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

    public resize(): void {
        if (this.cy) {
            this.cy.resize()
            this.syncTransform()
        }
    }

    public destroy(): void {
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
}
