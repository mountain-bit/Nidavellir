import { describe, expect, it } from 'vitest'

import {
    getStoryGraphStylesheet,
    GRAPH_THEME,
    ICytoscapeStyleRule,
} from '../../Modules/Graph/StoryGraphStyles'

describe('StoryGraphStyles and GRAPH_THEME', () => {
    it('should define consistent theme tokens for colors and dimensions', () => {
        expect(GRAPH_THEME.colors.defaultScene).toBe('#3b82f6')
        expect(GRAPH_THEME.colors.edgeLine).toBe('#4f46e5')
        expect(GRAPH_THEME.colors.edgeArrow).toBe('#4f46e5')
        expect(GRAPH_THEME.colors.edgeLabel).toBe('#a1a1aa')
        expect(GRAPH_THEME.colors.edgeLabelBg).toBe('#18181b')
        expect(GRAPH_THEME.colors.nodeBg).toBe('#18181b')

        expect(GRAPH_THEME.dimensions.nodeWidth).toBe(220)
        expect(GRAPH_THEME.dimensions.nodeHeight).toBe(80)
        expect(GRAPH_THEME.dimensions.edgeWidth).toBe(2.5)
        expect(GRAPH_THEME.dimensions.gridBaseSize).toBe(40)

        expect(GRAPH_THEME.layout.initialOffsetX).toBe(180)
        expect(GRAPH_THEME.layout.initialOffsetY).toBe(140)
        expect(GRAPH_THEME.layout.gridColSpacing).toBe(280)
        expect(GRAPH_THEME.layout.gridRowSpacing).toBe(190)
        expect(GRAPH_THEME.layout.columnsCount).toBe(3)
        expect(GRAPH_THEME.layout.newConnectedNodeOffsetX).toBe(270)
        expect(GRAPH_THEME.layout.newConnectedNodeOffsetY).toBe(40)

        expect(GRAPH_THEME.zoom.min).toBe(0.2)
        expect(GRAPH_THEME.zoom.max).toBe(2.5)
        expect(GRAPH_THEME.zoom.wheelSensitivity).toBe(0.3)
    })

    it('should generate default Cytoscape stylesheet with node and edge rules', () => {
        const rules = getStoryGraphStylesheet()
        expect(rules).toHaveLength(2)

        const nodeRule = rules.find(r => r.selector === 'node')
        expect(nodeRule).toBeDefined()
        expect(nodeRule?.style).toMatchObject({
            shape: 'rectangle',
            'background-opacity': 0,
            'border-opacity': 0,
            width: GRAPH_THEME.dimensions.nodeWidth,
            height: GRAPH_THEME.dimensions.nodeHeight,
            label: '',
        })

        const edgeRule = rules.find(r => r.selector === 'edge')
        expect(edgeRule).toBeDefined()
        expect(edgeRule?.style).toMatchObject({
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
        })
    })

    it('should allow appending custom style rule overrides', () => {
        const customRule: ICytoscapeStyleRule = {
            selector: 'node:selected',
            style: {
                'border-width': 3,
                'border-color': '#ffffff',
            },
        }

        const rules = getStoryGraphStylesheet([customRule])
        expect(rules).toHaveLength(3)
        expect(rules[2]).toEqual(customRule)
    })
})
