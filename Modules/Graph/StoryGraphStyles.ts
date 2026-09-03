/**
 * StoryGraphStyles.ts
 *
 * Centralized theme tokens and Cytoscape.js stylesheet definition
 * for the story graph renderer.
 */

export const GRAPH_THEME = {
    colors: {
        defaultScene: '#3b82f6',
        edgeLine: '#4f46e5',
        edgeArrow: '#4f46e5',
        edgeLabel: '#a1a1aa',
        edgeLabelBg: '#18181b',
        nodeBg: '#18181b',
    },
    dimensions: {
        nodeWidth: 220,
        nodeHeight: 80,
        edgeWidth: 2.5,
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
        min: 0.2,
        max: 2.5,
        wheelSensitivity: 0.3,
    },
} as const

export interface ICytoscapeStyleRule {
    selector: string
    style: Record<string, string | number>
}

/**
 * Returns Cytoscape.js stylesheet rules for rendering nodes and edges.
 * Supports passing optional custom rule overrides.
 */
export function getStoryGraphStylesheet(
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
                'target-arrow-color': GRAPH_THEME.colors.edgeArrow,
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                label: 'data(label)',
                color: GRAPH_THEME.colors.edgeLabel,
                'font-size': '10px',
                'text-background-color': GRAPH_THEME.colors.edgeLabelBg,
                'text-background-opacity': 0.85,
                'text-background-padding': '2px 4px',
                'text-background-shape': 'roundrectangle',
            },
        },
    ]

    return [...defaultRules, ...customOverrides]
}
