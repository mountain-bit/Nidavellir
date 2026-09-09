import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ConnectionLineStyle, ICytoscapeStyleRule } from './StoryGraphStyles'

export interface IStoryGraphOptions {
    canvasContainer: HTMLElement
    nodesLayer: HTMLElement
    getParagraphs: () => Paragraph[]
    getScenes: () => Scene[]
    lineStyle?: ConnectionLineStyle
    onSelectParagraph: (p: Paragraph, scene?: Scene) => void
    onSelectChoice?: (
        choice: Choice,
        sourceParagraph?: Paragraph,
        targetParagraph?: Paragraph
    ) => void
    onCreateParagraph: (title: string, parentParagraph: Paragraph) => Paragraph
    onCreateConnection?: (
        sourceParagraph: Paragraph,
        targetParagraph: Paragraph,
        name?: string
    ) => Choice | null
    onToast: (
        type: 'success' | 'info' | 'error' | 'warning',
        message: string,
        title?: string
    ) => void
    t: (key: string, options?: Record<string, unknown>) => string
    customStyles?: ICytoscapeStyleRule[]
    wheelSensitivity?: number
    onZoomChange?: (zoomLevel: number) => void
}

export interface INodeDragState {
    isDragging: boolean
    hasMoved: boolean
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
}
