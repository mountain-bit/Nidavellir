import { describe, expect, it } from 'vitest'

import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import {
    calculateCurvedEdgeControlPointDistance,
    calculateEdgeSourceOffsets,
    getStoryGraphStylesheet,
    GRAPH_THEME,
    preventChoiceLineCrossings,
    reorderChoicesToPreventCrossings,
} from '../../Modules/Graph/StoryGraphStyles'

describe('StoryGraphStyles and GRAPH_THEME', () => {
    it('should define consistent theme tokens for colors and dimensions', () => {
        expect(GRAPH_THEME.colors.defaultScene).toBe('#4a5b6d')
        expect(GRAPH_THEME.colors.edgeLine).toBe('#505c6c')
        expect(GRAPH_THEME.colors.edgeArrow).toBe('#505c6c')
        expect(GRAPH_THEME.colors.edgeConditionLine).toBe('#78664b')
        expect(GRAPH_THEME.colors.edgeConditionArrow).toBe('#78664b')
        expect(GRAPH_THEME.colors.edgeSelected).toBe('#8fa8c2')
        expect(GRAPH_THEME.colors.edgeLabel).toBe('#dcdde0')
        expect(GRAPH_THEME.colors.edgeLabelBg).toBe('#141517')
        expect(GRAPH_THEME.colors.nodeBg).toBe('#141517')

        expect(GRAPH_THEME.dimensions.nodeWidth).toBe(220)
        expect(GRAPH_THEME.dimensions.nodeHeight).toBe(80)
        expect(GRAPH_THEME.dimensions.edgeWidth).toBe(2)
        expect(GRAPH_THEME.dimensions.edgeSelectedWidth).toBe(3.5)
        expect(GRAPH_THEME.dimensions.edgeSourceSpacing).toBe(14)
        expect(GRAPH_THEME.dimensions.gridBaseSize).toBe(40)

        expect(GRAPH_THEME.layout.initialOffsetX).toBe(180)
        expect(GRAPH_THEME.layout.initialOffsetY).toBe(140)
        expect(GRAPH_THEME.layout.gridColSpacing).toBe(280)
        expect(GRAPH_THEME.layout.gridRowSpacing).toBe(190)
        expect(GRAPH_THEME.layout.columnsCount).toBe(3)
        expect(GRAPH_THEME.layout.newConnectedNodeOffsetX).toBe(270)
        expect(GRAPH_THEME.layout.newConnectedNodeOffsetY).toBe(40)

        expect(GRAPH_THEME.zoom.min).toBe(0.05)
        expect(GRAPH_THEME.zoom.max).toBe(4.0)
        expect(GRAPH_THEME.zoom.wheelSensitivity).toBe(0.2)
    })

    describe('calculateEdgeSourceOffsets', () => {
        it('should return empty array for 0 choices', () => {
            expect(calculateEdgeSourceOffsets(0)).toEqual([])
        })

        it('should return single centered offset [0] for 1 choice', () => {
            expect(calculateEdgeSourceOffsets(1)).toEqual([0])
        })

        it('should calculate vertically symmetrical offsets for multiple choices', () => {
            // 2 choices: y0 = -7, y1 = 7 (avg = 0)
            const twoOffsets = calculateEdgeSourceOffsets(2, 14)
            expect(twoOffsets).toEqual([-7, 7])

            // 3 choices: y0 = -14, y1 = 0, y2 = 14 (avg = 0)
            const threeOffsets = calculateEdgeSourceOffsets(3, 14)
            expect(threeOffsets).toEqual([-14, 0, 14])

            // 4 choices: y0 = -21, y1 = -7, y2 = 7, y3 = 21 (avg = 0)
            const fourOffsets = calculateEdgeSourceOffsets(4, 14)
            expect(fourOffsets).toEqual([-21, -7, 7, 21])
        })
    })

    describe('calculateCurvedEdgeControlPointDistance', () => {
        it('should calculate 0 distance for horizontally aligned single choice', () => {
            const src = { x: 180, y: 180 }
            const tgt = { x: 480, y: 180 }
            const dist = calculateCurvedEdgeControlPointDistance(src, tgt, 0, 1)
            expect(dist).toBe(0)
        })

        it('should calculate smooth subtle arc height for forward edges with vertical delta', () => {
            const src = { x: 180, y: 180 }
            const tgt = { x: 480, y: 90 }
            const dist = calculateCurvedEdgeControlPointDistance(src, tgt, 0, 1)
            expect(Math.abs(dist)).toBeGreaterThanOrEqual(6)
            expect(Math.abs(dist)).toBeLessThanOrEqual(18)
        })

        it('should create separate control point distances for multiple choices', () => {
            const src = { x: 180, y: 180 }
            const tgt = { x: 480, y: 180 }
            const dist0 = calculateCurvedEdgeControlPointDistance(src, tgt, 0, 2)
            const dist1 = calculateCurvedEdgeControlPointDistance(src, tgt, 1, 2)
            expect(dist0).not.toEqual(dist1)
            expect(dist0).toBe(-5)
            expect(dist1).toBe(5)
        })

        it('should calculate clean loop height for backward edges', () => {
            const src = { x: 480, y: 180 }
            const tgt = { x: 180, y: 180 }
            const dist = calculateCurvedEdgeControlPointDistance(src, tgt, 0, 1)
            expect(Math.abs(dist)).toBeGreaterThanOrEqual(30)
            expect(Math.abs(dist)).toBeLessThanOrEqual(50)
        })
    })

    describe('getStoryGraphStylesheet', () => {
        it('should generate curved (unbundled-bezier) Cytoscape stylesheet by default', () => {
            const rules = getStoryGraphStylesheet('curved')
            expect(rules.length).toBeGreaterThanOrEqual(4)

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
                'line-style': 'solid',
                'target-arrow-color': GRAPH_THEME.colors.edgeArrow,
                'target-arrow-shape': 'triangle',
                'curve-style': 'unbundled-bezier',
                'control-point-distances': 'data(ctrlDist)',
                'control-point-weights': '0.5',
                label: 'data(label)',
                color: GRAPH_THEME.colors.edgeLabel,
                'font-size': '10px',
                'text-background-color': GRAPH_THEME.colors.edgeLabelBg,
                'text-background-opacity': 0.9,
            })

            const condRule = rules.find(r => r.selector === 'edge.has-condition')
            expect(condRule).toBeDefined()
            expect(condRule?.style).toMatchObject({
                'line-color': GRAPH_THEME.colors.edgeConditionLine,
                'target-arrow-color': GRAPH_THEME.colors.edgeConditionArrow,
                'line-style': 'solid',
            })
        })
    })

    describe('reorderChoicesToPreventCrossings and preventChoiceLineCrossings', () => {
        it('should return false when parent has 0 or 1 choices', () => {
            const p1 = new Paragraph('p1', 'Parent')
            expect(reorderChoicesToPreventCrossings(p1, [p1])).toBe(false)

            const c1 = new Choice('c1', 'To P2', 'p1', 'p2')
            p1.addChoice(c1)
            const p2 = new Paragraph('p2', 'Child')
            p2.setPosition({ x: 300, y: 100 })
            expect(reorderChoicesToPreventCrossings(p1, [p1, p2])).toBe(false)
        })

        it('should keep order when choices are already top-to-bottom', () => {
            const pParent = new Paragraph('parent', 'Parent')
            pParent.setPosition({ x: 100, y: 200 })

            const pTop = new Paragraph('top', 'Top Child')
            pTop.setPosition({ x: 400, y: 100 })

            const pBottom = new Paragraph('bottom', 'Bottom Child')
            pBottom.setPosition({ x: 400, y: 300 })

            const cTop = new Choice('c_top', 'Go Top', 'parent', 'top')
            const cBottom = new Choice('c_bottom', 'Go Bottom', 'parent', 'bottom')
            pParent.setChoices([cTop, cBottom])

            const paragraphs = [pParent, pTop, pBottom]
            const changed = reorderChoicesToPreventCrossings(pParent, paragraphs)

            expect(changed).toBe(false)
            expect(pParent.getChoices()).toEqual([cTop, cBottom])
        })

        it('should swap choices when target nodes are inverted to prevent line crossing', () => {
            const pParent = new Paragraph('parent', 'Parent')
            pParent.setPosition({ x: 100, y: 200 })

            const pTop = new Paragraph('top', 'Top Child')
            pTop.setPosition({ x: 400, y: 100 })

            const pBottom = new Paragraph('bottom', 'Bottom Child')
            pBottom.setPosition({ x: 400, y: 300 })

            // Initially pointing bottom first, then top (which would cause lines to cross!)
            const cBottom = new Choice('c_bottom', 'Go Bottom', 'parent', 'bottom')
            const cTop = new Choice('c_top', 'Go Top', 'parent', 'top')
            pParent.setChoices([cBottom, cTop])

            const paragraphs = [pParent, pTop, pBottom]
            const changed = reorderChoicesToPreventCrossings(pParent, paragraphs)

            expect(changed).toBe(true)
            // Now cTop should be first (index 0) and cBottom second (index 1)
            expect(pParent.getChoices()[0].getId()).toBe('c_top')
            expect(pParent.getChoices()[1].getId()).toBe('c_bottom')
        })

        it('should sort multiple (3+) choices in vertical order of targets', () => {
            const pParent = new Paragraph('parent', 'Parent')
            const pA = new Paragraph('pA', 'A') // y: 300
            pA.setPosition({ x: 400, y: 300 })
            const pB = new Paragraph('pB', 'B') // y: 100
            pB.setPosition({ x: 400, y: 100 })
            const pC = new Paragraph('pC', 'C') // y: 200
            pC.setPosition({ x: 400, y: 200 })

            const cA = new Choice('cA', 'To A', 'parent', 'pA')
            const cB = new Choice('cB', 'To B', 'parent', 'pB')
            const cC = new Choice('cC', 'To C', 'parent', 'pC')

            pParent.setChoices([cA, cB, cC])
            const paragraphs = [pParent, pA, pB, pC]

            const changed = reorderChoicesToPreventCrossings(pParent, paragraphs)
            expect(changed).toBe(true)
            expect(pParent.getChoices().map(c => c.getToParagraphId())).toEqual(['pB', 'pC', 'pA'])
        })

        it('preventChoiceLineCrossings should update parents when a child node moves', () => {
            const pParent = new Paragraph('parent', 'Parent')
            const p1 = new Paragraph('p1', 'Child 1')
            const p2 = new Paragraph('p2', 'Child 2')

            pParent.setPosition({ x: 100, y: 200 })
            p1.setPosition({ x: 400, y: 100 })
            p2.setPosition({ x: 400, y: 200 })

            const c1 = new Choice('c1', 'To 1', 'parent', 'p1')
            const c2 = new Choice('c2', 'To 2', 'parent', 'p2')
            pParent.setChoices([c1, c2])

            const paragraphs = [pParent, p1, p2]

            // User moves p1 down below p2 (e.g. from y:100 to y:300)
            p1.setPosition({ x: 400, y: 300 })

            const changed = preventChoiceLineCrossings(paragraphs, 'p1')
            expect(changed).toBe(true)
            expect(pParent.getChoices().map(c => c.getToParagraphId())).toEqual(['p2', 'p1'])
        })
    })
})
