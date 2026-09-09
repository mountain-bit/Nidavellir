import { Paragraph } from '../../Model/Paragraph'

export type ConnectionLineStyle = 'curved'

export const GRAPH_THEME = {
    colors: {
        defaultScene: '#3b82f6',
        edgeLine: '#6366f1',
        edgeArrow: '#6366f1',
        edgeHover: '#a5b4fc',
        edgeSelected: '#38bdf8',
        edgeConditionLine: '#f59e0b',
        edgeConditionArrow: '#f59e0b',
        edgeLabel: '#e4e4e7',
        edgeLabelBg: '#18181b',
        nodeBg: '#18181b',
    },
    dimensions: {
        nodeWidth: 220,
        nodeHeight: 80,
        edgeWidth: 2,
        edgeSelectedWidth: 3.5,
        edgeSourceSpacing: 14,
        gridBaseSize: 40,
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

/**
 * Calculates vertical Y offsets on the right edge for K outgoing connections
 * such that they are stacked with minimal spacing and vertically centered on average.
 *
 * For k=1: [0]
 * For k=2: [-spacing/2, +spacing/2]
 * For k=3: [-spacing, 0, +spacing]
 */
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

/**
 * Calculates curved control point distance for an edge between source and target coordinates.
 * Generates smooth, aesthetic, aerodynamic curves (półkoliste) that bend naturally without excessive convexity/bulging.
 */
export function calculateCurvedEdgeControlPointDistance(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    choiceIndex: number = 0,
    totalChoices: number = 1
): number {
    const dx = targetPos.x - sourcePos.x
    const dy = targetPos.y - sourcePos.y

    // Multi-edge fanout offset so parallel/divergent choices do not overlap (subtle, clean separation)
    const fanout = (choiceIndex - (totalChoices - 1) / 2) * 10

    // If target is to the right (forward flow)
    if (dx >= 0) {
        // When horizontally aligned, keep flat/smooth without bulging domes
        if (Math.abs(dy) <= 10) {
            return fanout
        }
        // Subtle natural arc proportional to vertical separation (clamped between 6px and 18px)
        const arcHeight = Math.min(18, Math.max(6, Math.round(Math.abs(dy) * 0.08)))
        const dir = dy < 0 ? -1 : 1
        return arcHeight * dir + fanout
    } else {
        // Backwards jump: clean, sleek loop above nodes
        const loopHeight = Math.max(30, Math.min(50, Math.round(Math.abs(dy) * 0.12 + 32)))
        return -(loopHeight + Math.abs(fanout))
    }
}

/**
 * Returns Cytoscape.js stylesheet rules for rendering nodes and edges.
 * Uses smooth curved (unbundled-bezier) lines with multi-output offsets.
 */
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
                // Curved (unbundled-bezier) properties
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

/**
 * Reorders choices of a parent paragraph according to the vertical (Y) and horizontal (X)
 * positions of their target paragraphs. This ensures outgoing connection lines from stacked
 * source sockets exit in top-to-bottom order without crossing each other.
 *
 * @param parentParagraph The parent paragraph whose choices to inspect and reorder.
 * @param paragraphs Array of all paragraphs in the story graph to resolve target positions.
 * @returns boolean True if the choice order was changed, false otherwise.
 */
export function reorderChoicesToPreventCrossings(
    parentParagraph: Paragraph,
    paragraphs: Paragraph[]
): boolean {
    const choices = parentParagraph.getChoices ? parentParagraph.getChoices() : []
    if (!choices || choices.length <= 1) return false

    // Map each choice to its resolved target position and initial index
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

    // Sort ascending by target Y coordinate (higher on screen first), then target X, then originalIndex
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

/**
 * Checks all parent paragraphs (or specific parents connected to a moved paragraph)
 * and reorders their choices to prevent connection line crossings.
 *
 * @param paragraphs Array of all paragraphs in the story graph.
 * @param movedParagraphId Optional ID of the paragraph that was moved or created.
 * @returns boolean True if any paragraph had its choices reordered.
 */
export function preventChoiceLineCrossings(
    paragraphs: Paragraph[],
    movedParagraphId?: string
): boolean {
    if (!paragraphs || paragraphs.length === 0) return false
    let anyChanged = false

    if (movedParagraphId) {
        // Find parents that have an outgoing choice to movedParagraphId, plus movedParagraphId itself
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
        // Check every paragraph
        for (const p of paragraphs) {
            const changed = reorderChoicesToPreventCrossings(p, paragraphs)
            if (changed) anyChanged = true
        }
    }

    return anyChanged
}
