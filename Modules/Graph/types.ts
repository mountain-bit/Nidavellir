import { Choice } from '../../Model/Choice'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { Tag } from '../../Model/Tag'
import { ConnectionLineStyle, ICytoscapeStyleRule } from './StoryGraphStyles'

export interface IStoryGraphOptions {
    canvasContainer: HTMLElement
    nodesLayer: HTMLElement
    getParagraphs: () => Paragraph[]
    getScenes: () => Scene[]
    getTags?: () => Tag[]
    getCharacters?: () => NPC[]
    getLocations?: () => Location[]
    lineStyle?: ConnectionLineStyle
    onSelectParagraph: (p: Paragraph, scene?: Scene) => void
    onSelectScene?: (scene: Scene) => void
    onSceneAssignmentChange?: (scene: Scene, paragraphs: Paragraph[]) => void
    onItemAssigned?: (
        target: Paragraph | Scene,
        item: Tag | NPC | Location,
        type: 'tag' | 'character' | 'location'
    ) => void
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
    ctrlWheelMultiplier?: number
    onZoomChange?: (zoomLevel: number) => void
    onGraphModified?: () => void
}

export interface INodeDragState {
    isDragging: boolean
    hasMoved: boolean
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
}
