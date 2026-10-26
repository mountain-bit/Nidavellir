import { Choice } from '../../Model/Choice'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { Tag } from '../../Model/Tag'
import type { TranslationKey } from '../../Utils/translate'
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
    onCreateScene?: (
        name: string,
        position: { x: number; y: number },
        width: number,
        height: number,
        assignedParagraphs?: Paragraph[]
    ) => Scene | null
    onCreateConnection?: (
        sourceParagraph: Paragraph,
        targetParagraph: Paragraph,
        name?: string
    ) => Choice | null
    onSelectionChange?: (selectedParagraphIds: string[]) => void
    onToast: (
        type: 'success' | 'info' | 'error' | 'warning',
        message: string,
        title?: string
    ) => void
    t: (key: TranslationKey, options?: Record<string, unknown>) => string
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
