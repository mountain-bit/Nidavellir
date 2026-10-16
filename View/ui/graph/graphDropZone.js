/**
 * Story Graph Drag and Drop Zone Controller.
 * Handles dragover and drop events for dragging Scene cards from the drawer onto the Cytoscape graph canvas.
 */

import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { markProjectDirty } from '../project/projectStateTracker.js'

/**
 * Attaches dragover and drop event handlers to the story graph canvas container.
 *
 * @param {HTMLElement} canvasContainer
 * @param {object} ctx Application context
 * @param {() => object|null} getGraphInstance Function returning the active StoryGraph instance
 */
export function setupGraphDropZone(canvasContainer, ctx, getGraphInstance) {
    if (!canvasContainer || canvasContainer.dataset.dropBound) return
    canvasContainer.dataset.dropBound = 'true'

    canvasContainer.addEventListener('dragover', e => {
        e.preventDefault()
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy'
        }
    })

    canvasContainer.addEventListener('drop', e => {
        e.preventDefault()
        const sceneId =
            (e.dataTransfer && e.dataTransfer.getData('application/x-scene-id')) ||
            (e.dataTransfer && e.dataTransfer.getData('text/plain'))
        if (!sceneId) return

        const scenes = ctx.projectScenes || ctx.projectData?.projectScenes || []
        const scene = scenes.find(
            s => (typeof s.getId === 'function' ? s.getId() : s.id) === sceneId
        )
        if (!scene) return

        const rect = canvasContainer.getBoundingClientRect()
        const clientX = e.clientX - rect.left
        const clientY = e.clientY - rect.top

        const storyGraphInstance = getGraphInstance()
        if (storyGraphInstance) {
            const cy = storyGraphInstance.getCyInstance()
            let graphPos = { x: clientX, y: clientY }
            if (cy && typeof cy.pan === 'function' && typeof cy.zoom === 'function') {
                const pan = cy.pan()
                const zoom = cy.zoom() || 1
                graphPos = {
                    x: Math.round((clientX - pan.x) / zoom),
                    y: Math.round((clientY - pan.y) / zoom),
                }
            }
            storyGraphInstance.addSceneToGraph(scene, graphPos)
            markProjectDirty()
            toast.success(
                t('toast.scene_placed_on_graph', { name: scene.getName() }),
                t('toast.scene_placed_title')
            )
            if (typeof ctx.renderScenesList === 'function') ctx.renderScenesList()
            if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
            if (typeof ctx.populateFilterSelects === 'function') ctx.populateFilterSelects()
        }
    })
}
