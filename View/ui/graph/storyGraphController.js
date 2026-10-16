/**
 * Story Graph UI Controller.
 * Orchestrates Cytoscape story graph lifecycle, node/edge event callbacks,
 * entity inspection synchronization, and canvas presentation.
 */

import { StoryGraph } from '../../../dist/Modules/Graph/index.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { markProjectDirty } from '../project/projectStateTracker.js'
import { updateZoomToolbarUI } from '../workspace/workspace.js'
import { setupGraphDropZone } from './graphDropZone.js'

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
 * Helper to ensure the right inspector sidebar is expanded when selecting nodes.
 *
 * @param {object} ctx Application context
 */
function openRightSidebarIfCollapsed(ctx) {
    if (
        ctx.vm &&
        typeof ctx.vm.isRightSidebarCollapsed === 'function' &&
        ctx.vm.isRightSidebarCollapsed()
    ) {
        ctx.vm.setRightSidebarCollapsed(false)
        if (typeof ctx.updateRightSidebarUI === 'function') {
            ctx.updateRightSidebarUI()
        }
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
    if (ctx.vm && typeof ctx.vm.ensureStartParagraph === 'function') {
        ctx.vm.ensureStartParagraph(paragraphs)
    }

    if (!_storyGraphInstance) {
        _storyGraphInstance = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle:
                typeof ctx.vm.getConnectionLineStyle === 'function'
                    ? ctx.vm.getConnectionLineStyle()
                    : 'curved',
            wheelSensitivity:
                typeof ctx.vm.getZoomSensitivity === 'function'
                    ? ctx.vm.getZoomSensitivity()
                    : 0.15,
            onZoomChange: lvl => updateZoomToolbarUI(_storyGraphInstance, lvl),
            getParagraphs: () => ctx.projectParagraphs || ctx.projectData?.projectParagraphs || [],
            getScenes: () => ctx.projectScenes || ctx.projectData?.projectScenes || [],
            getTags: () => ctx.projectTags || ctx.projectData?.projectTags || [],
            getCharacters: () => ctx.projectCharacters || ctx.projectData?.projectCharacters || [],
            getLocations: () => ctx.projectLocations || ctx.projectData?.projectLocations || [],
            onGraphModified: () => markProjectDirty(),
            onItemAssigned: () => {
                markProjectDirty()
                if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
                if (typeof ctx.renderScenesList === 'function') ctx.renderScenesList()
                if (typeof ctx.renderTagsList === 'function') ctx.renderTagsList()
                if (typeof ctx.renderCharactersList === 'function') ctx.renderCharactersList()
                if (typeof ctx.renderLocationsList === 'function') ctx.renderLocationsList()
                if (typeof ctx.renderDetailsPanel === 'function') ctx.renderDetailsPanel()
                if (_storyGraphInstance) _storyGraphInstance.render(true)
            },
            onSelectParagraph: (p, scene) => {
                openRightSidebarIfCollapsed(ctx)
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(p, 'paragraph', scene)
                }
            },
            onSelectScene: scene => {
                openRightSidebarIfCollapsed(ctx)
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(scene, 'scene')
                }
            },
            onSelectChoice: (choice, fromP) => {
                openRightSidebarIfCollapsed(ctx)
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(choice, 'choice', fromP)
                }
            },
            onSceneAssignmentChange: () => {
                markProjectDirty()
                if (typeof ctx.renderScenesList === 'function') ctx.renderScenesList()
                if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
                if (typeof ctx.populateFilterSelects === 'function') ctx.populateFilterSelects()
            },
            onCreateParagraph: title => {
                const newP = ctx.vm.createParagraph(title)
                const targetParagraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs
                if (Array.isArray(targetParagraphs)) {
                    targetParagraphs.push(newP)
                }
                markProjectDirty()
                if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
                return newP
            },
            onCreateConnection: (fromParagraph, toParagraph, choiceName) => {
                const choice = ctx.vm.createChoice(fromParagraph, toParagraph, choiceName)
                markProjectDirty()
                if (typeof ctx.renderConnectionsList === 'function') {
                    ctx.renderConnectionsList()
                }
                if (typeof ctx.renderParagraphsList === 'function') {
                    ctx.renderParagraphsList()
                }
                return choice
            },
            onToast: (type, msg, title) => {
                if (type === 'success') toast.success(msg, title)
                else if (type === 'error') toast.error(msg, title)
                else if (type === 'warning') toast.warning(msg, title)
                else toast.info(msg, title)
            },
            t,
        })
    }

    setupGraphDropZone(canvasContainer, ctx, getStoryGraphInstance)

    _storyGraphInstance.render(forceRebuild)
    if (typeof window !== 'undefined') {
        window.storyGraphInstance = _storyGraphInstance
    }
    updateZoomToolbarUI(_storyGraphInstance)
}

// Aliases for convenient usage
export { centerStoryGraph as centerGraph, showStoryGraph as showGraph }
