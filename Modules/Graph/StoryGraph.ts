import './ParagraphNode'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ParagraphNode } from './ParagraphNode'
import { getStoryGraphStylesheet, GRAPH_THEME } from './StoryGraphStyles'
import { IStoryGraphOptions } from './types'

export interface ICytoscapeInstance {
    pan: () => { x: number; y: number }
    zoom: () => number
    resize: () => void
    destroy: () => void
    on: (events: string, handler: unknown) => void
    removeListener: (events: string, handler: unknown) => void
    getElementById: (id: string) =>
        | {
              position: (pos?: { x: number; y: number }) => { x: number; y: number }
          }
        | undefined
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

    constructor(options: IStoryGraphOptions) {
        this.canvasContainer = options.canvasContainer
        this.nodesLayer = options.nodesLayer
        this.options = options
        this.boundSyncTransform = this.syncTransform.bind(this)
    }

    public getCyInstance(): ICytoscapeInstance | null {
        return this.cy
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

        // (Connections/edges logic removed for now - will be implemented later)

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
            style: getStoryGraphStylesheet(this.options.customStyles),
            layout: { name: 'preset' },
            minZoom: GRAPH_THEME.zoom.min,
            maxZoom: GRAPH_THEME.zoom.max,
            wheelSensitivity: GRAPH_THEME.zoom.wheelSensitivity,
        })

        window.cyInstance = this.cy

        this.cy.on('pan zoom', this.boundSyncTransform)

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

            // Socket click event
            nodeEl.addEventListener('node-socket-click', () => {
                this.options.onToast('info', this.options.t('graph.socket_tooltip'), 'Informacja')
            })

            // Add paragraph event
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
    }
}
