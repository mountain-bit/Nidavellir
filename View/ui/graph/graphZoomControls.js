/**
 * Graph Zoom & Viewport Controls Controller.
 * Binds zoom toolbar buttons (+, -, fit, 100%) and responsive canvas resize events.
 */

import { updateZoomToolbarUI } from '../workspace/workspace.js'

/**
 * Sets up event listeners for the story graph zoom toolbar buttons and window resize events.
 *
 * @param {object} ctx Application context
 * @param {() => object|null} getGraphInstance Function returning the active StoryGraph instance
 */
export function setupGraphZoomControls(ctx, getGraphInstance) {
    const btnGraphZoomOut = document.getElementById('btn-graph-zoom-out')
    if (btnGraphZoomOut && !btnGraphZoomOut.dataset.bound) {
        btnGraphZoomOut.dataset.bound = 'true'
        btnGraphZoomOut.addEventListener('click', () => {
            const instance = getGraphInstance()
            if (instance) {
                instance.zoomOut()
                updateZoomToolbarUI(instance)
            }
        })
    }

    const btnGraphZoomIn = document.getElementById('btn-graph-zoom-in')
    if (btnGraphZoomIn && !btnGraphZoomIn.dataset.bound) {
        btnGraphZoomIn.dataset.bound = 'true'
        btnGraphZoomIn.addEventListener('click', () => {
            const instance = getGraphInstance()
            if (instance) {
                instance.zoomIn()
                updateZoomToolbarUI(instance)
            }
        })
    }

    const btnGraphZoomReset = document.getElementById('btn-graph-zoom-reset')
    if (btnGraphZoomReset && !btnGraphZoomReset.dataset.bound) {
        btnGraphZoomReset.dataset.bound = 'true'
        btnGraphZoomReset.addEventListener('click', () => {
            const instance = getGraphInstance()
            if (instance) {
                instance.resetZoom()
                updateZoomToolbarUI(instance)
            }
        })
    }

    const btnGraphZoomFit = document.getElementById('btn-graph-zoom-fit')
    if (btnGraphZoomFit && !btnGraphZoomFit.dataset.bound) {
        btnGraphZoomFit.dataset.bound = 'true'
        btnGraphZoomFit.addEventListener('click', () => {
            const instance = getGraphInstance()
            if (instance) {
                instance.center()
                updateZoomToolbarUI(instance)
            }
        })
    }

    if (typeof window !== 'undefined' && !window._graphResizeBound) {
        window._graphResizeBound = true
        window.addEventListener('resize', () => {
            const instance = getGraphInstance()
            if (instance) {
                instance.resize()
            }
        })
    }
}
