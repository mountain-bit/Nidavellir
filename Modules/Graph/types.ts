import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ICytoscapeStyleRule } from './StoryGraphStyles'

export interface IStoryGraphOptions {
    canvasContainer: HTMLElement
    nodesLayer: HTMLElement
    getParagraphs: () => Paragraph[]
    getScenes: () => Scene[]
    onSelectParagraph: (p: Paragraph, scene?: Scene) => void
    onCreateParagraph: (title: string, parentParagraph: Paragraph) => Paragraph
    onToast: (
        type: 'success' | 'info' | 'error' | 'warning',
        message: string,
        title?: string
    ) => void
    t: (key: string, options?: Record<string, unknown>) => string
    customStyles?: ICytoscapeStyleRule[]
}

export interface INodeDragState {
    isDragging: boolean
    hasMoved: boolean
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
}
