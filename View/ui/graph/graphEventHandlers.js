/**
 * Story Graph Event Handlers & Configuration Factory
 *
 * Provides callbacks for Cytoscape node/edge interactions, entity selections,
 * dynamic element creation, and synchronization with application state and UI drawers.
 */

import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { markProjectDirty } from '../project/projectStateTracker.js'
import { updateZoomToolbarUI } from '../workspace/workspace.js'

/**
 * Refreshes all entity lists in the left drawer and the right details panel.
 *
 * @param {object} ctx Application context
 */
export function refreshEntityLists(ctx) {
    if (typeof ctx?.renderParagraphsList === 'function') ctx.renderParagraphsList()
    if (typeof ctx?.renderScenesList === 'function') ctx.renderScenesList()
    if (typeof ctx?.renderTagsList === 'function') ctx.renderTagsList()
    if (typeof ctx?.renderCharactersList === 'function') ctx.renderCharactersList()
    if (typeof ctx?.renderLocationsList === 'function') ctx.renderLocationsList()
    if (typeof ctx?.renderConnectionsList === 'function') ctx.renderConnectionsList()
    if (typeof ctx?.populateFilterSelects === 'function') ctx.populateFilterSelects()
    if (typeof ctx?.renderDetailsPanel === 'function') ctx.renderDetailsPanel()
}

/**
 * Ensures the right inspector sidebar is expanded when an entity is selected.
 *
 * @param {object} ctx Application context
 */
export function openRightSidebarIfCollapsed(ctx) {
    const layout = ctx?.vm?.layout
    if (
        layout &&
        typeof layout.isRightSidebarCollapsed === 'function' &&
        layout.isRightSidebarCollapsed()
    ) {
        layout.setRightSidebarCollapsed(false)
        if (typeof ctx.updateRightSidebarUI === 'function') {
            ctx.updateRightSidebarUI()
        }
    }
}

/**
 * Creates configuration options for instantiating a StoryGraph.
 *
 * @param {object} ctx Application UI Context
 * @param {HTMLElement} canvasContainer Cytoscape container element
 * @param {HTMLElement} nodesLayer HTML DOM overlay layer
 * @param {() => object|null} getGraphInstance Callback returning the active StoryGraph instance
 * @returns {object} Options configuration object for StoryGraph constructor
 */
export function createStoryGraphConfig(ctx, canvasContainer, nodesLayer, getGraphInstance) {
    const factory = ctx?.vm?.factory
    const layout = ctx?.vm?.layout
    const graph = ctx?.vm?.graph

    return {
        canvasContainer,
        nodesLayer,
        lineStyle:
            typeof layout?.getConnectionLineStyle === 'function'
                ? layout.getConnectionLineStyle()
                : 'curved',
        wheelSensitivity:
            typeof layout?.getZoomSensitivity === 'function' ? layout.getZoomSensitivity() : 0.2,
        onZoomChange: lvl => updateZoomToolbarUI(getGraphInstance(), lvl),
        getParagraphs: () => ctx.projectParagraphs || ctx.projectData?.projectParagraphs || [],
        getScenes: () => ctx.projectScenes || ctx.projectData?.projectScenes || [],
        getTags: () => ctx.projectTags || ctx.projectData?.projectTags || [],
        getCharacters: () => ctx.projectCharacters || ctx.projectData?.projectCharacters || [],
        getLocations: () => ctx.projectLocations || ctx.projectData?.projectLocations || [],
        onGraphModified: () => markProjectDirty(),
        onItemAssigned: () => {
            markProjectDirty()
            refreshEntityLists(ctx)
            const instance = getGraphInstance()
            if (instance) instance.render(true)
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
            const newP = factory?.createParagraph ? factory.createParagraph(title) : null
            const targetParagraphs = ctx.projectParagraphs || ctx.projectData?.projectParagraphs
            if (Array.isArray(targetParagraphs) && newP) {
                targetParagraphs.push(newP)
            }
            markProjectDirty()
            if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
            return newP
        },
        onCreateScene: (name, position, width, height, assignedParagraphs) => {
            const newScene = factory?.createScene ? factory.createScene(name) : null
            if (!newScene) return null
            if (position) newScene.setPosition(position)
            if (width) newScene.setWidth(width)
            if (height) newScene.setHeight(height)
            if (Array.isArray(assignedParagraphs)) {
                assignedParagraphs.forEach(p => newScene.addParagraph(p))
            }
            const targetScenes = ctx.projectScenes || ctx.projectData?.projectScenes
            if (Array.isArray(targetScenes) && !targetScenes.includes(newScene)) {
                targetScenes.push(newScene)
            }
            markProjectDirty()
            if (typeof ctx.renderScenesList === 'function') ctx.renderScenesList()
            return newScene
        },
        onCreateConnection: (fromParagraph, toParagraph, choiceName) => {
            const existingChoices = fromParagraph.getChoices ? fromParagraph.getChoices() : []
            const toId = toParagraph.getId()
            const alreadyExists = existingChoices.some(
                c => c.getToParagraphId() === toId && (!choiceName || c.getName() === choiceName)
            )
            if (alreadyExists) {
                return null
            }
            const choice = graph?.createChoice
                ? graph.createChoice(fromParagraph, toParagraph, choiceName)
                : null
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
    }
}
