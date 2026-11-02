/**
 * Story Graph UI Controller.
 * Orchestrates Cytoscape story graph lifecycle, node/edge event callbacks,
 * entity inspection synchronization, and canvas presentation.
 */

import { StoryGraph } from '../../../dist/Modules/Graph/index.js'
import { updateZoomToolbarUI } from '../workspace/workspace.js'
import { setupGraphDropZone } from './graphDropZone.js'
import { createStoryGraphConfig, refreshEntityLists } from './graphEventHandlers.js'

let _storyGraphInstance = null

/**
 * Returns the currently active StoryGraph instance.
 *
 * @returns {StoryGraph|null}
 */
export function getStoryGraphInstance() {
    return _storyGraphInstance
}

/**
 * Sets the active StoryGraph instance.
 *
 * @param {StoryGraph|null} instance
 */
export function setStoryGraphInstance(instance) {
    _storyGraphInstance = instance
    if (typeof window !== 'undefined') {
        window.storyGraphInstance = instance
    }
}

/**
 * Destroys and cleans up the active StoryGraph instance.
 */
export function destroyStoryGraph() {
    if (_storyGraphInstance) {
        if (typeof _storyGraphInstance.destroy === 'function') {
            try {
                _storyGraphInstance.destroy()
            } catch {
                // Ignore teardown errors
            }
        }
        _storyGraphInstance = null
        if (typeof window !== 'undefined') {
            window.storyGraphInstance = null
        }
    }
}

/**
 * Centers and fits the graph view smoothly onto the canvas.
 *
 * @param {object} [ctx] Application context
 * @param {boolean} [animate=true] Whether to animate the camera movement
 */
export function centerStoryGraph(ctx, animate = true) {
    if (_storyGraphInstance) {
        _storyGraphInstance.center(animate)
        updateZoomToolbarUI(_storyGraphInstance)
    }
}

/**
 * Re-renders the active story graph.
 *
 * @param {boolean} [forceRebuild=true] Whether to fully recalculate layout
 */
export function renderStoryGraph(forceRebuild = true) {
    if (_storyGraphInstance) {
        _storyGraphInstance.render(forceRebuild)
    }
}

/**
 * Initializes or re-renders the Cytoscape story graph.
 *
 * @param {object} ctx Application context
 * @param {boolean} [forceRebuild=false] Whether to rebuild all nodes and layout from scratch
 */
export function showStoryGraph(ctx, forceRebuild = false) {
    const canvasContainer = document.getElementById('story-graph')
    const nodesLayer = document.getElementById('graph-nodes-layer')
    if (!canvasContainer || !nodesLayer) return

    const paragraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs || []
    const factory = ctx?.vm?.factory

    if (factory && typeof factory.ensureStartParagraph === 'function') {
        factory.ensureStartParagraph(paragraphs)
    }

    if (!_storyGraphInstance) {
        const config = createStoryGraphConfig(
            ctx,
            canvasContainer,
            nodesLayer,
            getStoryGraphInstance
        )
        _storyGraphInstance = new StoryGraph(config)
    }

    setupGraphDropZone(canvasContainer, ctx, getStoryGraphInstance)

    _storyGraphInstance.render(forceRebuild)
    if (typeof window !== 'undefined') {
        window.storyGraphInstance = _storyGraphInstance
    }
    updateZoomToolbarUI(_storyGraphInstance)
}

// Aliases and utility exports
export { centerStoryGraph as centerGraph, refreshEntityLists, showStoryGraph as showGraph }
