/**
 * PlaytestEngine - Core narrative simulation and history tracking engine.
 *
 * Provides headless simulation capabilities:
 * - Paragraph navigation and choice resolution
 * - Visited node tracking and history trail
 * - Scene and start-node resolution
 * - Rewind (undo/step-back) and direct teleportation
 */

/**
 * @typedef {object} PlaytestHistoryEntry
 * @property {string} paragraphId
 * @property {number} paragraphNumber
 * @property {string} paragraphTitle
 * @property {string} [sceneId]
 * @property {string} [sceneName]
 * @property {string} [choiceTakenTitle]
 * @property {boolean} isTeleport
 * @property {number} timestamp
 */

export class PlaytestEngine {
    /**
     * @param {object} ctx - Application context
     */
    constructor(ctx) {
        this.ctx = ctx
        /** @type {PlaytestHistoryEntry[]} */
        this.history = []
        this.currentIndex = -1
        this.godMode = true // In editor, author is always in god mode
        this.visitedParagraphIds = new Set()
    }

    getParagraphs() {
        return (
            this.ctx?.projectData?.projectParagraphs ||
            this.ctx?.projectParagraphs ||
            (this.ctx?.vm?.project?.getParagraphs ? this.ctx.vm.project.getParagraphs() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectParagraphs) ||
            []
        )
    }

    getScenes() {
        return (
            this.ctx?.projectData?.projectScenes ||
            this.ctx?.projectScenes ||
            (this.ctx?.vm?.project?.getScenes ? this.ctx.vm.project.getScenes() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectScenes) ||
            []
        )
    }

    getCharacters() {
        return (
            this.ctx?.projectCharacters ||
            this.ctx?.projectData?.projectCharacters ||
            (this.ctx?.vm?.project?.getCharacters ? this.ctx.vm.project.getCharacters() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectCharacters) ||
            []
        )
    }

    getTemplates() {
        return (
            this.ctx?.projectTemplates ||
            this.ctx?.projectData?.projectTemplates ||
            (this.ctx?.vm?.project?.getTemplates ? this.ctx.vm.project.getTemplates() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectTemplates) ||
            []
        )
    }

    getNpcs() {
        return [...this.getCharacters(), ...this.getTemplates()]
    }

    getStats() {
        return (
            this.ctx?.projectStats ||
            this.ctx?.projectData?.projectStats ||
            (this.ctx?.vm?.project?.getStats ? this.ctx.vm.project.getStats() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectStats) ||
            []
        )
    }

    getParameters() {
        return (
            this.ctx?.projectParameters ||
            this.ctx?.projectData?.projectParameters ||
            (this.ctx?.vm?.project?.getParameters ? this.ctx.vm.project.getParameters() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectParameters) ||
            []
        )
    }

    getTraits() {
        const stats = this.getStats()
        const parameters = this.getParameters()
        const traits = []
        stats.forEach(s => {
            const id =
                typeof s.getId === 'function' ? s.getId() : s.id || (s.getName ? s.getName() : '')
            const name = typeof s.getName === 'function' ? s.getName() : s.name || ''
            if (id || name) {
                traits.push({ id: id || name, name: name || id, kind: 'stat' })
            }
        })
        parameters.forEach(p => {
            const id =
                typeof p.getId === 'function' ? p.getId() : p.id || (p.getName ? p.getName() : '')
            const name = typeof p.getName === 'function' ? p.getName() : p.name || ''
            if (id || name) {
                traits.push({ id: id || name, name: name || id, kind: 'parameter' })
            }
        })
        return traits
    }

    findParagraph(paragraphId) {
        if (!paragraphId) return null
        return (
            this.getParagraphs().find(
                p => (typeof p.getId === 'function' ? p.getId() : p.id) === paragraphId
            ) || null
        )
    }

    findScene(sceneId) {
        if (!sceneId) return null
        return (
            this.getScenes().find(
                s => (typeof s.getId === 'function' ? s.getId() : s.id) === sceneId
            ) || null
        )
    }

    findSceneForParagraph(paragraphId) {
        if (!paragraphId) return null
        const scenes = this.getScenes()
        for (const scene of scenes) {
            const paragraphs =
                typeof scene.getParagraphs === 'function'
                    ? scene.getParagraphs()
                    : scene.paragraphs || []
            if (paragraphs.some(p => (p.getId ? p.getId() : p.id) === paragraphId)) {
                return scene
            }
        }
        return null
    }

    getInitialStartParagraph() {
        const paragraphs = this.getParagraphs()
        if (paragraphs.length === 0) return null

        // 1. Sprawdź czy zaznaczony jest paragraf w edytorze
        const selectedItem = this.ctx?.vm?.selection?.getSelectedItem
            ? this.ctx.vm.selection.getSelectedItem()
            : null
        if (selectedItem && selectedItem.type === 'paragraph' && selectedItem.id) {
            const p = this.findParagraph(selectedItem.id)
            if (p) return p
        }

        // 2. Szukaj węzła oznaczonego jako start
        const trueStartP = paragraphs.find(
            p => (typeof p.getIsStart === 'function' && p.getIsStart()) || p.isStart === true
        )
        if (trueStartP) return trueStartP

        // 3. Sprawdź pierwszą scenę i jej initialParagraphId
        const scenes = this.getScenes()
        if (scenes.length > 0) {
            const firstScene = scenes[0]
            const initialId =
                typeof firstScene.getInitialParagraphId === 'function'
                    ? firstScene.getInitialParagraphId()
                    : firstScene.initialParagraphId
            if (initialId) {
                const initP = this.findParagraph(initialId)
                if (initP) return initP
            }
        }

        return paragraphs[0] || null
    }

    /**
     * Starts or restarts playtest session.
     *
     * @param {string} [startParagraphId]
     */
    start(startParagraphId) {
        if (this.ctx?.vm && typeof this.ctx.vm?.selection?.ensureParagraphNumbers === 'function') {
            this.ctx.vm.selection.ensureParagraphNumbers(this.getParagraphs())
        }

        this.history = []
        this.currentIndex = -1
        this.visitedParagraphIds.clear()

        const startP = startParagraphId
            ? this.findParagraph(startParagraphId)
            : this.getInitialStartParagraph()

        if (!startP) return null

        const entry = this.createHistoryEntry(startP, null, false)
        this.history.push(entry)
        this.currentIndex = 0
        this.visitedParagraphIds.add(entry.paragraphId)
        return startP
    }

    /**
     * Creates a history snapshot entry.
     *
     * @param {object} p
     * @param {string|null} [choiceTitle]
     * @param {boolean} [isTeleport=false]
     * @returns {PlaytestHistoryEntry}
     */
    createHistoryEntry(p, choiceTitle = null, isTeleport = false) {
        const id = typeof p.getId === 'function' ? p.getId() : p.id || ''
        const number =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function' && p.getNumber() > 0
                  ? p.getNumber()
                  : p.number || 1
        const title =
            typeof p.getTitle === 'function'
                ? p.getTitle()
                : typeof p.getName === 'function'
                  ? p.getName()
                  : `Paragraf ${number}`

        const scene = this.findSceneForParagraph(id)
        const sceneId = scene ? (typeof scene.getId === 'function' ? scene.getId() : scene.id) : ''
        const sceneName = scene
            ? typeof scene.getName === 'function'
                ? scene.getName()
                : scene.name
            : ''

        return {
            paragraphId: id,
            paragraphNumber: number,
            paragraphTitle: title,
            sceneId,
            sceneName,
            choiceTakenTitle: choiceTitle || (isTeleport ? '🚀 Teleportacja' : null),
            isTeleport,
            timestamp: Date.now(),
        }
    }

    /**
     * Transitions to next paragraph via choice.
     *
     * @param {string} targetParagraphId
     * @param {string} choiceTitle
     * @returns {object|null}
     */
    goTo(targetParagraphId, choiceTitle = '') {
        const targetP = this.findParagraph(targetParagraphId)
        if (!targetP) return null

        // Truncate forward history if stepped back previously
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1)
        }

        const entry = this.createHistoryEntry(targetP, choiceTitle, false)
        this.history.push(entry)
        this.currentIndex = this.history.length - 1
        this.visitedParagraphIds.add(entry.paragraphId)
        return targetP
    }

    /**
     * Teleports directly to a scene or specific paragraph.
     *
     * @param {string} [sceneId]
     * @param {string} [targetParagraphId]
     * @param {boolean} [resetHistory=false]
     * @returns {object|null}
     */
    teleportTo(sceneId, targetParagraphId, resetHistory = false) {
        let p = null

        if (targetParagraphId) {
            p = this.findParagraph(targetParagraphId)
        } else if (sceneId) {
            const scene = this.findScene(sceneId)
            if (scene) {
                const initId =
                    typeof scene.getInitialParagraphId === 'function'
                        ? scene.getInitialParagraphId()
                        : scene.initialParagraphId
                if (initId) p = this.findParagraph(initId)

                if (!p) {
                    const paragraphs =
                        typeof scene.getParagraphs === 'function'
                            ? scene.getParagraphs()
                            : scene.paragraphs || []
                    if (paragraphs.length > 0) p = paragraphs[0]
                }
            }
        }

        if (!p) return null

        if (resetHistory) {
            return this.start(typeof p.getId === 'function' ? p.getId() : p.id)
        }

        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1)
        }

        const entry = this.createHistoryEntry(p, '🚀 Teleportacja', true)
        this.history.push(entry)
        this.currentIndex = this.history.length - 1
        this.visitedParagraphIds.add(entry.paragraphId)
        return p
    }

    /**
     * Steps back one item in history.
     *
     * @returns {object|null}
     */
    stepBack() {
        if (!this.canStepBack()) return null
        this.currentIndex--
        const entry = this.history[this.currentIndex]
        return this.findParagraph(entry.paragraphId)
    }

    /**
     * Rewinds directly to a specific history index.
     *
     * @param {number} index
     * @returns {object|null}
     */
    stepToIndex(index) {
        if (index < 0 || index >= this.history.length) return null
        this.currentIndex = index
        const entry = this.history[this.currentIndex]
        return this.findParagraph(entry.paragraphId)
    }

    canStepBack() {
        return this.currentIndex > 0
    }

    getCurrentEntry() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex]
        }
        return null
    }

    getCurrentParagraph() {
        const entry = this.getCurrentEntry()
        return entry ? this.findParagraph(entry.paragraphId) : null
    }

    getHistoryTrail() {
        return this.history.slice(0, this.currentIndex + 1)
    }

    getVisitedCount() {
        return this.visitedParagraphIds.size
    }

    getStepCount() {
        return this.currentIndex + 1
    }

    toggleGodMode() {
        return true
    }
}
