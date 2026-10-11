import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'

export type ConnectionLineStyle = 'curved'

export const GRAPH_THEME = {
    colors: {
        defaultScene: '#4a5b6d',
        edgeLine: '#505c6c',
        edgeArrow: '#505c6c',
        edgeHover: '#7e93a8',
        edgeSelected: '#8fa8c2',
        edgeConditionLine: '#78664b',
        edgeConditionArrow: '#78664b',
        edgeLabel: '#dcdde0',
        edgeLabelBg: '#141517',
        nodeBg: '#141517',
        startNode: '#245842',
        startNodeBorder: '#357357',
    },
    dimensions: {
        nodeWidth: 220,
        nodeHeight: 80,
        edgeWidth: 2,
        edgeSelectedWidth: 3.5,
        edgeSourceSpacing: 14,
        gridBaseSize: 40,
        sceneDefaultWidth: 400,
        sceneDefaultHeight: 280,
        sceneMinWidth: 160,
        sceneMinHeight: 110,
    },
    layout: {
        initialOffsetX: 180,
        initialOffsetY: 140,
        gridColSpacing: 280,
        gridRowSpacing: 190,
        columnsCount: 3,
        newConnectedNodeOffsetX: 270,
        newConnectedNodeOffsetY: 40,
    },
    zoom: {
        min: 0.05,
        max: 4.0,
        wheelSensitivity: 0.2,
    },
} as const

export interface ICytoscapeStyleRule {
    selector: string
    style: Record<string, string | number>
}

export function isParagraphInScene(
    paragraph: Paragraph,
    scene: Scene,
    nodeWidth: number = GRAPH_THEME.dimensions.nodeWidth,
    nodeHeight: number = GRAPH_THEME.dimensions.nodeHeight
): boolean {
    if (!scene || !paragraph) return false
    return scene.intersectsParagraph(paragraph, nodeWidth, nodeHeight)
}

/**
 * Calculates accessible high-contrast text color (#ffffff or #18181b)
 * based on the background color luminance (YIQ formula).
 */
export function getContrastTextColor(hexColor: string): string {
    if (!hexColor || typeof hexColor !== 'string') return '#ffffff'
    let hex = hexColor.trim().replace('#', '')
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map(c => c + c)
            .join('')
    }
    if (hex.length !== 6) return '#ffffff'
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff'
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 145 ? '#18181b' : '#ffffff'
}

export function calculateEdgeSourceOffsets(
    count: number,
    spacing: number = GRAPH_THEME.dimensions.edgeSourceSpacing
): number[] {
    if (count <= 0) return []
    if (count === 1) return [0]
    const halfSpan = ((count - 1) * spacing) / 2
    const offsets: number[] = []
    for (let i = 0; i < count; i++) {
        offsets.push(Math.round(-halfSpan + i * spacing))
    }
    return offsets
}

export function calculateCurvedEdgeControlPointDistance(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    choiceIndex: number = 0,
    totalChoices: number = 1
): number {
    const dx = targetPos.x - sourcePos.x
    const dy = targetPos.y - sourcePos.y
    const fanout = (choiceIndex - (totalChoices - 1) / 2) * 10

    if (dx >= 0) {
        if (Math.abs(dy) <= 10) {
            return fanout
        }
        const arcHeight = Math.min(18, Math.max(6, Math.round(Math.abs(dy) * 0.08)))
        const dir = dy < 0 ? -1 : 1
        return arcHeight * dir + fanout
    } else {
        const loopHeight = Math.max(30, Math.min(50, Math.round(Math.abs(dy) * 0.12 + 32)))
        return -(loopHeight + Math.abs(fanout))
    }
}

export function getStoryGraphStylesheet(
    _lineStyle: ConnectionLineStyle = 'curved',
    customOverrides: ICytoscapeStyleRule[] = []
): ICytoscapeStyleRule[] {
    const defaultRules: ICytoscapeStyleRule[] = [
        {
            selector: 'node',
            style: {
                shape: 'rectangle',
                'background-opacity': 0,
                'border-opacity': 0,
                width: GRAPH_THEME.dimensions.nodeWidth,
                height: GRAPH_THEME.dimensions.nodeHeight,
                label: '',
            },
        },
        {
            selector: 'edge',
            style: {
                width: GRAPH_THEME.dimensions.edgeWidth,
                'line-color': GRAPH_THEME.colors.edgeLine,
                'line-style': 'solid',
                'target-arrow-color': GRAPH_THEME.colors.edgeArrow,
                'target-arrow-shape': 'triangle',
                'arrow-scale': 0.9,
                'curve-style': 'unbundled-bezier',
                'control-point-distances': 'data(ctrlDist)',
                'control-point-weights': '0.5',
                'source-endpoint': 'data(sourceEndpoint)',
                'target-endpoint': 'data(targetEndpoint)',
                label: 'data(label)',
                color: GRAPH_THEME.colors.edgeLabel,
                'font-size': '10px',
                'text-rotation': 'autorotate',
                'text-margin-y': -8,
                'text-background-color': GRAPH_THEME.colors.edgeLabelBg,
                'text-background-opacity': 0.9,
                'text-background-padding': '3px 6px',
                'text-background-shape': 'roundrectangle',
                'text-border-color': '#27272a',
                'text-border-width': 1,
                'text-border-opacity': 0.8,
            },
        },
        {
            selector: 'edge.has-condition',
            style: {
                'line-color': GRAPH_THEME.colors.edgeConditionLine,
                'target-arrow-color': GRAPH_THEME.colors.edgeConditionArrow,
                'line-style': 'solid',
            },
        },
        {
            selector: 'edge:selected, edge.is-selected',
            style: {
                width: GRAPH_THEME.dimensions.edgeSelectedWidth,
                'line-color': GRAPH_THEME.colors.edgeSelected,
                'target-arrow-color': GRAPH_THEME.colors.edgeSelected,
                'z-index': 999,
            },
        },
    ]

    return [...defaultRules, ...customOverrides]
}

export function reorderChoicesToPreventCrossings(
    parentParagraph: Paragraph,
    paragraphs: Paragraph[]
): boolean {
    const choices = parentParagraph.getChoices ? parentParagraph.getChoices() : []
    if (!choices || choices.length <= 1) return false

    const choiceWithTarget = choices.map((choice, originalIndex) => {
        const targetId = choice.getToParagraphId()
        const targetP = paragraphs.find(p => p.getId() === targetId)
        const pos = targetP?.getPosition ? targetP.getPosition() : null
        return {
            choice,
            originalIndex,
            targetId,
            y: pos ? pos.y : Number.MAX_SAFE_INTEGER,
            x: pos ? pos.x : Number.MAX_SAFE_INTEGER,
        }
    })

    const sorted = [...choiceWithTarget].sort((a, b) => {
        if (a.y !== b.y) {
            return a.y - b.y
        }
        if (a.x !== b.x) {
            return a.x - b.x
        }
        return a.originalIndex - b.originalIndex
    })

    const hasOrderChanged = sorted.some((item, idx) => item.originalIndex !== idx)
    if (hasOrderChanged) {
        parentParagraph.setChoices(sorted.map(item => item.choice))
        return true
    }

    return false
}

export function preventChoiceLineCrossings(
    paragraphs: Paragraph[],
    movedParagraphId?: string
): boolean {
    if (!paragraphs || paragraphs.length === 0) return false
    let anyChanged = false

    if (movedParagraphId) {
        const relevantParents = paragraphs.filter(p => {
            if (p.getId() === movedParagraphId) return true
            const choices = p.getChoices ? p.getChoices() : []
            return choices.some(c => c.getToParagraphId() === movedParagraphId)
        })

        for (const parent of relevantParents) {
            const changed = reorderChoicesToPreventCrossings(parent, paragraphs)
            if (changed) anyChanged = true
        }
    } else {
        for (const p of paragraphs) {
            const changed = reorderChoicesToPreventCrossings(p, paragraphs)
            if (changed) anyChanged = true
        }
    }

    return anyChanged
}
