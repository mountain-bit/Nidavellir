/**
 * Playtest & Gamebook Narrative Simulator Engine.
 *
 * Provides an interactive playthrough window for testing gamebooks:
 * - Displays active paragraph narrative & formatted text in editor theme
 * - Dynamic choice actions with keyboard shortcuts (1-9)
 * - Step-by-step history stack with undo / step back (Backspace)
 * - Interactive breadcrumbs navigation trail
 * - Teleportation system to any Scene, Graph or specific Paragraph
 * - Author is always in god-mode (full preview & branch exploration)
 * - Quick jump to editor / graph centering
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import {
    CombatSyncService,
    DescriptionTransclusionService,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeIconSvg } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { PlaytestEngine } from './playtestEngine.js'
import { formatInlineMarkdown, formatMarkdown } from './playtestMarkdown.js'

export { formatInlineMarkdown, formatMarkdown, PlaytestEngine }

/** Active global instance of PlaytestEngine */
let playtestEngineInstance = null
let keydownListenerAttached = false

/**
 * Opens and renders Playtest Simulator modal.
 *
 * @param {object} ctx Application context
 * @param {string} [startParagraphId] Optional paragraph ID to begin with
 */
export function openPlaytestSimulator(ctx, startParagraphId = '') {
    const modal = document.getElementById('modal-playtest')
    if (!modal) {
        toast.error('Błąd: Nie znaleziono okna playtestu w widoku.', 'Playtest')
        return
    }

    if (ctx?.vm && typeof ctx.vm?.selection?.ensureParagraphNumbers === 'function') {
        ctx.vm.selection.ensureParagraphNumbers(ctx.projectParagraphs)
    }

    playtestEngineInstance = new PlaytestEngine(ctx)
    const initialP = playtestEngineInstance.start(startParagraphId)

    if (!initialP) {
        toast.warning(
            'Brak paragrafów w projekcie do przetestowania. Utwórz pierwszy paragraf.',
            'Playtest'
        )
        return
    }

    initPlaytestUI(ctx)
    renderPlaytestView()

    modal.classList.remove('hidden')
}

/**
 * Closes the Playtest modal.
 */
export function closePlaytestSimulator() {
    const modal = document.getElementById('modal-playtest')
    if (modal) modal.classList.add('hidden')
}

/**
 * Sets up event listeners and UI controls for the Playtest modal.
 *
 * @param {object} ctx
 */
function initPlaytestUI(ctx) {
    const modal = document.getElementById('modal-playtest')
    if (!modal) return

    // Close buttons
    const btnClose = document.getElementById('btn-close-playtest-modal')
    if (btnClose) btnClose.onclick = () => closePlaytestSimulator()

    // Restart button
    const btnRestart = document.getElementById('btn-playtest-restart')
    if (btnRestart) {
        btnRestart.onclick = () => {
            if (!playtestEngineInstance) return
            playtestEngineInstance.start()
            renderPlaytestView()
            toast.info('Zrestartowano rozgrywkę od początku.', 'Playtest')
        }
    }

    // Step Back (Cofnij) button
    const btnBack = document.getElementById('btn-playtest-back')
    if (btnBack) {
        btnBack.onclick = () => {
            if (!playtestEngineInstance || !playtestEngineInstance.canStepBack()) return
            playtestEngineInstance.stepBack()
            renderPlaytestView()
        }
    }

    // Edit current node in Editor/Graph
    const btnEditNode = document.getElementById('btn-playtest-edit-node')
    if (btnEditNode) {
        btnEditNode.onclick = () => {
            if (!playtestEngineInstance) return
            const currentP = playtestEngineInstance.getCurrentParagraph()
            if (!currentP) return
            const pId = typeof currentP.getId === 'function' ? currentP.getId() : currentP.id

            closePlaytestSimulator()
            if (ctx.vm) {
                ctx.vm.layout?.setActiveMainView?.('graph')
                if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
                if (
                    ctx.vm.layout?.isRightSidebarCollapsed &&
                    ctx.vm.layout.isRightSidebarCollapsed()
                ) {
                    ctx.vm.layout.setRightSidebarCollapsed(false)
                }
                const scene = playtestEngineInstance.findSceneForParagraph(pId)
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(currentP, 'paragraph', scene)
                }
                const graph =
                    ctx.storyGraphInstance ||
                    (typeof window !== 'undefined' ? window.storyGraphInstance : null)
                if (graph && typeof graph.focusOnElement === 'function') {
                    graph.focusOnElement(pId, true)
                }
                const pTitle =
                    typeof currentP.getTitle === 'function'
                        ? currentP.getTitle()
                        : currentP.title || pId
                toast.info(`Wybrano paragraf „${pTitle}” w edytorze.`, 'Edytor')
            }
        }
    }

    // Teleport toggle button
    const btnTeleportToggle = document.getElementById('btn-playtest-teleport-toggle')
    const teleportPanel = document.getElementById('playtest-teleport-panel')
    if (btnTeleportToggle && teleportPanel) {
        btnTeleportToggle.onclick = () => {
            const isHidden = teleportPanel.classList.contains('hidden')
            if (isHidden) {
                openTeleportPanel()
            } else {
                teleportPanel.classList.add('hidden')
                btnTeleportToggle.classList.remove('active')
            }
        }
    }

    // Teleport Cancel button
    const btnTeleportCancel = document.getElementById('btn-playtest-teleport-cancel')
    if (btnTeleportCancel && teleportPanel) {
        btnTeleportCancel.onclick = () => {
            teleportPanel.classList.add('hidden')
            if (btnTeleportToggle) btnTeleportToggle.classList.remove('active')
        }
    }

    // Teleport Submit button
    const btnTeleportSubmit = document.getElementById('btn-playtest-teleport-submit')
    if (btnTeleportSubmit) {
        btnTeleportSubmit.onclick = () => {
            if (!playtestEngineInstance) return
            const sceneSelect = document.getElementById('playtest-teleport-scene-select')
            const pSelect = document.getElementById('playtest-teleport-paragraph-select')
            const sceneId = sceneSelect ? sceneSelect.value : ''
            const paragraphId = pSelect ? pSelect.value : ''

            if (!paragraphId && !sceneId) {
                toast.warning('Wybierz scenę lub paragraf docelowy.', 'Teleportacja')
                return
            }

            const targetP = playtestEngineInstance.teleportTo(sceneId, paragraphId)
            if (targetP) {
                if (teleportPanel) teleportPanel.classList.add('hidden')
                if (btnTeleportToggle) btnTeleportToggle.classList.remove('active')
                renderPlaytestView()
                toast.success('Przeteleportowano do wybranego węzła!', 'Teleportacja')
            } else {
                toast.error('Nie znaleziono węzła docelowego.', 'Teleportacja')
            }
        }
    }

    // Scene select changes list of paragraphs in Teleport panel
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    if (sceneSelect) {
        sceneSelect.onchange = () => updateTeleportParagraphOptions()
    }

    // Search filter input in Teleport panel
    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (searchInput) {
        searchInput.oninput = () => updateTeleportParagraphOptions()
    }

    // Keyboard shortcuts (1-9, Backspace, T, R, Esc)
    if (!keydownListenerAttached) {
        window.addEventListener('keydown', handlePlaytestKeydown)
        keydownListenerAttached = true
    }
}

/**
 * Handles global keydown shortcuts during playtest.
 *
 * @param {KeyboardEvent} e
 */
function handlePlaytestKeydown(e) {
    const modal = document.getElementById('modal-playtest')
    if (!modal || modal.classList.contains('hidden')) return
    if (!playtestEngineInstance) return

    // Don't intercept if user is typing in an input
    const targetTag = e.target?.tagName?.toLowerCase()
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        if (e.key === 'Escape') {
            const teleportPanel = document.getElementById('playtest-teleport-panel')
            if (teleportPanel && !teleportPanel.classList.contains('hidden')) {
                teleportPanel.classList.add('hidden')
                const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
                if (btnTeleport) btnTeleport.classList.remove('active')
                e.preventDefault()
            }
        }
        return
    }

    // Escape -> close modal
    if (e.key === 'Escape') {
        const teleportPanel = document.getElementById('playtest-teleport-panel')
        if (teleportPanel && !teleportPanel.classList.contains('hidden')) {
            teleportPanel.classList.add('hidden')
            const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
            if (btnTeleport) btnTeleport.classList.remove('active')
            e.preventDefault()
            return
        }
        closePlaytestSimulator()
        e.preventDefault()
        return
    }

    // Backspace or Alt+ArrowLeft -> Step Back
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
        if (playtestEngineInstance.canStepBack()) {
            e.preventDefault()
            playtestEngineInstance.stepBack()
            renderPlaytestView()
        }
        return
    }

    // T / t -> Toggle Teleport Panel
    if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        const teleportPanel = document.getElementById('playtest-teleport-panel')
        const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
        if (teleportPanel) {
            if (teleportPanel.classList.contains('hidden')) {
                openTeleportPanel()
            } else {
                teleportPanel.classList.add('hidden')
                if (btnTeleport) btnTeleport.classList.remove('active')
            }
        }
        return
    }

    // R / r -> Restart
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        playtestEngineInstance.start()
        renderPlaytestView()
        toast.info('Zrestartowano od początku.', 'Playtest')
        return
    }

    // Number keys 1-9 -> Select choice
    const num = parseInt(e.key, 10)
    if (!isNaN(num) && num >= 1 && num <= 9) {
        const choiceBtns = document.querySelectorAll(
            '#playtest-choices-container .btn-playtest-choice:not([disabled])'
        )
        if (choiceBtns.length >= num) {
            e.preventDefault()
            const chosenBtn = choiceBtns[num - 1]
            chosenBtn?.click()
        }
    }
}

/**
 * Opens and populates the Teleport drawer panel.
 */
function openTeleportPanel() {
    const teleportPanel = document.getElementById('playtest-teleport-panel')
    const btnTeleportToggle = document.getElementById('btn-playtest-teleport-toggle')
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    if (!teleportPanel || !playtestEngineInstance) return

    teleportPanel.classList.remove('hidden')
    if (btnTeleportToggle) btnTeleportToggle.classList.add('active')

    // Populate Scenes
    if (sceneSelect) {
        const scenes = playtestEngineInstance.getScenes()
        const currentP = playtestEngineInstance.getCurrentParagraph()
        const currentPId = currentP ? (currentP.getId ? currentP.getId() : currentP.id) : ''
        const currentScene = playtestEngineInstance.findSceneForParagraph(currentPId)
        const currentSceneId = currentScene
            ? typeof currentScene.getId === 'function'
                ? currentScene.getId()
                : currentScene.id
            : ''

        let html = '<option value="">-- Wszystkie sceny / Cały projekt --</option>'
        scenes.forEach(s => {
            const sId = typeof s.getId === 'function' ? s.getId() : s.id || ''
            const sName = typeof s.getName === 'function' ? s.getName() : s.name || 'Scena'
            const pCount =
                typeof s.getParagraphs === 'function'
                    ? s.getParagraphs().length
                    : (s.paragraphs || []).length
            const isSelected = sId === currentSceneId ? 'selected' : ''
            html += `<option value="${escapeHtml(sId)}" ${isSelected}>${escapeHtml(sName)} (${pCount} paragrafów)</option>`
        })
        sceneSelect.innerHTML = html
    }

    updateTeleportParagraphOptions()

    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (searchInput) {
        searchInput.value = ''
        searchInput.focus()
    }
}

/**
 * Filters and populates paragraph dropdown inside Teleport panel.
 */
function updateTeleportParagraphOptions() {
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    const pSelect = document.getElementById('playtest-teleport-paragraph-select')
    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (!pSelect || !playtestEngineInstance) return

    const selectedSceneId = sceneSelect ? sceneSelect.value : ''
    const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase()

    let paragraphs = playtestEngineInstance.getParagraphs()

    if (selectedSceneId) {
        const scene = playtestEngineInstance.findScene(selectedSceneId)
        if (scene) {
            paragraphs =
                typeof scene.getParagraphs === 'function'
                    ? scene.getParagraphs()
                    : scene.paragraphs || []
        }
    }

    if (searchQuery) {
        paragraphs = paragraphs.filter(p => {
            const num = String(
                p.getDisplayNumber
                    ? p.getDisplayNumber()
                    : p.getNumber && p.getNumber() > 0
                      ? p.getNumber()
                      : p.number || ''
            )
            const title = (p.getTitle ? p.getTitle() : p.getName ? p.getName() : '').toLowerCase()
            return num.includes(searchQuery) || title.includes(searchQuery)
        })
    }

    if (paragraphs.length === 0) {
        pSelect.innerHTML = '<option value="">Brak pasujących paragrafów</option>'
        pSelect.disabled = true
        return
    }

    pSelect.disabled = false
    let html = ''
    paragraphs.forEach(p => {
        const pId = typeof p.getId === 'function' ? p.getId() : p.id || ''
        const pNum =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function' && p.getNumber() > 0
                  ? p.getNumber()
                  : p.number || 1
        const pTitle =
            typeof p.getTitle === 'function'
                ? p.getTitle()
                : typeof p.getName === 'function'
                  ? p.getName()
                  : `Paragraf ${pNum}`
        const isStart = (p.getIsStart ? p.getIsStart() : p.isStart) ? ' ★ [START]' : ''
        const isEnd = (p.getIsEnd ? p.getIsEnd() : p.isEnd) ? ' 🏁 [KONIEC]' : ''

        html += `<option value="${escapeHtml(pId)}">§ ${pNum}: ${escapeHtml(pTitle)}${isStart}${isEnd}</option>`
    })
    pSelect.innerHTML = html
}

/**
 * Renders complete view of current paragraph, choices, breadcrumbs, and stats.
 */
export function renderPlaytestView() {
    if (!playtestEngineInstance) return

    const currentP = playtestEngineInstance.getCurrentParagraph()
    const contentEl = document.getElementById('playtest-content')
    const choicesEl = document.getElementById('playtest-choices-container')
    const badgeEl = document.getElementById('playtest-paragraph-badge')
    const sceneBadgeEl = document.getElementById('playtest-scene-badge')
    const stepCounterEl = document.getElementById('playtest-step-counter')
    const btnBack = document.getElementById('btn-playtest-back')
    const breadcrumbsContainer = document.getElementById('playtest-breadcrumbs-container')

    if (!contentEl || !choicesEl) return

    // Update Step back button disabled state
    if (btnBack) {
        btnBack.disabled = !playtestEngineInstance.canStepBack()
        if (playtestEngineInstance.canStepBack()) {
            btnBack.classList.remove('opacity-40', 'cursor-not-allowed')
        } else {
            btnBack.classList.add('opacity-40', 'cursor-not-allowed')
        }
    }

    // Update Counter
    if (stepCounterEl) {
        stepCounterEl.textContent = `Krok: ${playtestEngineInstance.getStepCount()} · Odwiedzono: ${playtestEngineInstance.getVisitedCount()}`
    }

    // Render Breadcrumbs
    if (breadcrumbsContainer) {
        const trail = playtestEngineInstance.getHistoryTrail()
        breadcrumbsContainer.innerHTML = trail
            .map((entry, idx) => {
                const isCurrent = idx === playtestEngineInstance.currentIndex
                const teleportPrefix = entry.isTeleport ? '🚀 ' : ''
                const badgeClass = isCurrent
                    ? 'bg-[#263545] text-[#b8d1ea] border-[#3d5269] font-semibold shadow-xs'
                    : 'bg-[#212226] hover:bg-[#282a30] text-zinc-300 border-[#2e3037] hover:border-[#3e424c] cursor-pointer'

                return `
                <div class="flex items-center shrink-0">
                    <button
                        type="button"
                        class="btn-playtest-breadcrumb px-2 py-0.5 rounded text-[11px] border transition-colors flex items-center gap-1 ${badgeClass}"
                        data-step-index="${idx}"
                        title="Kliknij, aby cofnąć się do tego kroku"
                    >
                        <span>${teleportPrefix}§${entry.paragraphNumber}: ${escapeHtml(entry.paragraphTitle.slice(0, 18))}</span>
                    </button>
                    ${idx < trail.length - 1 ? '<span class="text-zinc-600 mx-1 text-xs select-none">→</span>' : ''}
                </div>
            `
            })
            .join('')

        breadcrumbsContainer.querySelectorAll('.btn-playtest-breadcrumb').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.stepIndex, 10)
                if (!isNaN(idx)) {
                    playtestEngineInstance.stepToIndex(idx)
                    renderPlaytestView()
                }
            })
        })
    }

    if (!currentP) {
        contentEl.innerHTML = `
            <div class="p-8 text-center text-zinc-400">
                <p class="font-medium text-base text-zinc-300">Koniec opowieści lub brak węzła.</p>
                <p class="text-xs mt-1">Nie znaleziono danych dla tego paragrafu.</p>
            </div>
        `
        choicesEl.innerHTML = ''
        return
    }

    const pNum =
        typeof currentP.getDisplayNumber === 'function'
            ? currentP.getDisplayNumber()
            : typeof currentP.getNumber === 'function' && currentP.getNumber() > 0
              ? currentP.getNumber()
              : currentP.number || 1
    const pTitle =
        typeof currentP.getTitle === 'function'
            ? currentP.getTitle()
            : typeof currentP.getName === 'function'
              ? currentP.getName()
              : `Paragraf ${pNum}`

    const currentScene = playtestEngineInstance.findSceneForParagraph(
        currentP.getId ? currentP.getId() : currentP.id
    )

    // Badges in Header
    if (badgeEl) badgeEl.textContent = `§ ${pNum}: ${pTitle}`
    if (sceneBadgeEl) {
        if (currentScene) {
            const sName =
                typeof currentScene.getName === 'function'
                    ? currentScene.getName()
                    : currentScene.name || 'Scena'
            sceneBadgeEl.textContent = `Scena: ${sName}`
            sceneBadgeEl.classList.remove('hidden')
        } else {
            sceneBadgeEl.classList.add('hidden')
        }
    }

    // Story Text extraction
    let text = ''
    if (currentP.getContent && typeof currentP.getContent === 'function') {
        const desc = currentP.getContent()
        text =
            (desc && desc.getText && desc.getText()) ||
            (desc && desc.getSummary && desc.getSummary()) ||
            ''
    } else if (currentP.content) {
        text = currentP.content.text || currentP.content.summary || ''
    }

    if (!text) {
        text = `*Brak zapisanego tekstu w tym paragrafie.* Możesz uzupełnić treść w edytorze Markdown.`
    }

    let narrativeText = text

    // Resolve description transclusions if projectData is available
    const projectData =
        playtestEngineInstance?.ctx?.projectData ||
        (typeof window !== 'undefined' && window.projectData)
    if (projectData && typeof DescriptionTransclusionService?.resolve === 'function') {
        try {
            narrativeText = DescriptionTransclusionService.resolve(narrativeText, projectData, {
                fallbackOnMissing: 'empty',
            })
        } catch (_e) {
            // ignore transclusion errors
        }
    }

    // Remove technical combat markdown block from narrative view if present,
    // because Playtest displays a rich interactive combat card below.
    narrativeText = narrativeText
        .replace(
            /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\}|$)/gi,
            ''
        )
        .trim()

    // Paragraph Metadata (Tags, Location, Characters, Combat)
    const tags = (typeof currentP.getTags === 'function' ? currentP.getTags() : currentP.tags) || []
    const locations =
        (typeof currentP.getLocations === 'function'
            ? currentP.getLocations()
            : currentP.locations) || []
    const characters =
        (typeof currentP.getCharacters === 'function'
            ? currentP.getCharacters()
            : currentP.characters) || []
    const hasCombat =
        (typeof currentP.getHasCombat === 'function'
            ? currentP.getHasCombat()
            : currentP.hasCombat) || false
    const isStart =
        (typeof currentP.getIsStart === 'function' ? currentP.getIsStart() : currentP.isStart) ||
        false
    const isEnd =
        (typeof currentP.getIsEnd === 'function' ? currentP.getIsEnd() : currentP.isEnd) || false

    const metaBadgesHtml = []

    if (isStart) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#1c2921] border border-[#2b4c39] text-[#8ec8ad] text-[11px] font-semibold flex items-center gap-1">${getIconSvg('play', 'w-3 h-3')} Początek gry</span>`
        )
    }

    if (isEnd) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#282133] border border-[#4a365f] text-[#c4a8e6] text-[11px] font-semibold flex items-center gap-1">${getIconSvg('flag', 'w-3 h-3')} Zakończenie</span>`
        )
    }

    if (hasCombat) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[11px] font-semibold flex items-center gap-1">${getIconSvg('combat', 'w-3 h-3') || getIconSvg('swords', 'w-3 h-3')} Walka / Starcie</span>`
        )
    }

    if (locations.length > 0) {
        const locName =
            typeof locations[0].getName === 'function'
                ? locations[0].getName()
                : locations[0].name || 'Lokacja'
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#2e261a] border border-[#4f3d24] text-[#d6b07c] text-[11px] flex items-center gap-1">${getTypeIconSvg('location', 'w-3 h-3')} ${escapeHtml(locName)}</span>`
        )
    }

    if (characters.length > 0) {
        const charNames = characters
            .slice(0, 2)
            .map(c => (typeof c.getName === 'function' ? c.getName() : c.name || 'NPC'))
            .join(', ')
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#1a2930] border border-[#274754] text-[#7ec6db] text-[11px] flex items-center gap-1">${getTypeIconSvg('character', 'w-3 h-3')} ${escapeHtml(charNames)}</span>`
        )
    }

    tags.forEach(tag => {
        const tName = typeof tag.getName === 'function' ? tag.getName() : tag.name || ''
        if (tName) {
            metaBadgesHtml.push(
                `<span class="px-2 py-0.5 rounded bg-[#1e2025] text-zinc-400 border border-[#2e3037] text-[10px]">#${escapeHtml(tName)}</span>`
            )
        }
    })

    const metaSection =
        metaBadgesHtml.length > 0
            ? `<div class="flex items-center flex-wrap gap-1.5 pb-2 border-b border-[#2e3037] mb-3">${metaBadgesHtml.join('')}</div>`
            : ''

    let combatCardHtml = ''
    if (hasCombat) {
        const combat = currentP.getCombat ? currentP.getCombat() : currentP.combat
        const opponents = combat && combat.getCombatOpponents ? combat.getCombatOpponents() : []
        const visibleStatIds = combat && combat.getVisibleStatIds ? combat.getVisibleStatIds() : []
        const allNpcs = playtestEngineInstance.getNpcs
            ? playtestEngineInstance.getNpcs()
            : [
                  ...(playtestEngineInstance.ctx?.projectCharacters || []),
                  ...(playtestEngineInstance.ctx?.projectTemplates || []),
              ]
        const allTraits = playtestEngineInstance.getTraits
            ? playtestEngineInstance.getTraits()
            : [
                  ...(playtestEngineInstance.ctx?.projectStats || []),
                  ...(playtestEngineInstance.ctx?.projectParameters || []),
              ]

        if (opponents.length > 0) {
            const opponentCards = opponents
                .map(opp => {
                    const avatarObj = getAvatarById(opp.avatar || 'warrior')
                    const avatarSvg = avatarObj ? avatarObj.svg : getIconSvg('character', 'w-4 h-4')
                    const originalNpc = allNpcs.find(
                        n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId
                    )

                    const statsBadges = visibleStatIds
                        .map(traitId => {
                            const traitDef = allTraits.find(
                                t =>
                                    (typeof t.getId === 'function' ? t.getId() : t.id) ===
                                        traitId ||
                                    (typeof t.getName === 'function' ? t.getName() : t.name) ===
                                        traitId
                            )

                            let traitName = traitDef
                                ? typeof traitDef.getName === 'function'
                                    ? traitDef.getName()
                                    : traitDef.name
                                : ''

                            // Jeśli cecha nie została znaleziona w cechach projektu, sprawdź w oryginalnym NPC
                            if (!traitName && originalNpc) {
                                const npcStats =
                                    typeof originalNpc.getStats === 'function'
                                        ? originalNpc.getStats()
                                        : originalNpc.stats || []
                                const npcParams =
                                    typeof originalNpc.getParameters === 'function'
                                        ? originalNpc.getParameters()
                                        : originalNpc.parameters || []
                                const foundInNpc = [...npcStats, ...npcParams].find(item => {
                                    const sId =
                                        typeof item.getId === 'function' ? item.getId() : item.id
                                    const sName =
                                        typeof item.getName === 'function'
                                            ? item.getName()
                                            : item.name
                                    return sId === traitId || sName === traitId
                                })
                                if (foundInNpc) {
                                    traitName =
                                        typeof foundInNpc.getName === 'function'
                                            ? foundInNpc.getName()
                                            : foundInNpc.name
                                }
                            }

                            if (!traitName) {
                                traitName = traitId
                            }

                            let val = ''
                            if (opp.overriddenStats) {
                                if (
                                    opp.overriddenStats[traitId] !== undefined &&
                                    opp.overriddenStats[traitId] !== ''
                                ) {
                                    val = opp.overriddenStats[traitId]
                                } else if (
                                    traitDef &&
                                    traitDef.id &&
                                    opp.overriddenStats[traitDef.id] !== undefined &&
                                    opp.overriddenStats[traitDef.id] !== ''
                                ) {
                                    val = opp.overriddenStats[traitDef.id]
                                } else if (
                                    traitDef &&
                                    traitDef.name &&
                                    opp.overriddenStats[traitDef.name] !== undefined &&
                                    opp.overriddenStats[traitDef.name] !== ''
                                ) {
                                    val = opp.overriddenStats[traitDef.name]
                                }
                            }

                            if ((val === '' || val === undefined) && originalNpc) {
                                val = CombatSyncService.resolveNpcTraitValue(
                                    originalNpc,
                                    traitId,
                                    traitDef
                                )
                            }

                            return `
                            <div class="px-2 py-0.5 rounded bg-[#1e2025] border border-zinc-700/60 text-[11px] flex items-center gap-1.5 font-mono">
                                <span class="text-zinc-400 font-sans">${escapeHtml(traitName)}:</span>
                                <span class="text-amber-300 font-bold">${escapeHtml(String(val || '-'))}</span>
                            </div>
                        `
                        })
                        .join('')

                    return `
                    <div class="p-2.5 bg-[#1b1c20] border border-[#2e3037] rounded-lg flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-zinc-800 p-1 border border-zinc-700/60 shrink-0 text-amber-400 flex items-center justify-center">
                                ${avatarSvg}
                            </div>
                            <div>
                                <div class="text-xs font-bold text-zinc-100 truncate">${escapeHtml(opp.name)}</div>
                                <div class="text-[10px] text-zinc-400">Przeciwnik</div>
                            </div>
                        </div>
                        <div class="flex items-center flex-wrap gap-1.5 justify-end">
                            ${statsBadges}
                        </div>
                    </div>
                `
                })
                .join('')

            combatCardHtml = `
                <div class="my-4 p-3.5 rounded-xl bg-gradient-to-b from-[#241a1c]/80 to-[#18191d] border border-amber-600/40 shadow-sm space-y-2.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-amber-400">${getIconSvg('combat', 'w-4 h-4') || '⚔️'}</span>
                            <span class="text-xs font-bold text-amber-200 uppercase tracking-wider">Starcie z przeciwnikami</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/50 font-bold uppercase font-mono">
                            ${opponents.length} ${opponents.length === 1 ? 'Wróg' : 'Wrogów'}
                        </span>
                    </div>
                    <div class="space-y-1.5">
                        ${opponentCards}
                    </div>
                </div>
            `
        }
    }

    contentEl.innerHTML = `
        ${metaSection}
        <h2 class="text-base font-bold text-zinc-100 mb-3 tracking-wide">§ ${pNum}: ${escapeHtml(pTitle)}</h2>
        <div class="prose prose-invert max-w-none text-sm text-zinc-200">
            ${formatMarkdown(narrativeText)}
        </div>
        ${combatCardHtml}
    `

    // Attach click listeners to inline paragraph links [label](entity://paragraph/targetId)
    contentEl.querySelectorAll('.btn-playtest-inline-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.targetId
            if (!targetId) return
            const nextP = playtestEngineInstance.goTo(targetId, 'Odnośnik w narracji')
            if (nextP) {
                renderPlaytestView()
            } else {
                toast.error(`Nie znaleziono paragrafu o ID: ${targetId}`, 'Błąd nawigacji')
            }
        })
    })

    // Render Choices
    const choices =
        (typeof currentP.getChoices === 'function' ? currentP.getChoices() : currentP.choices) || []

    if (choices.length === 0 || isEnd) {
        choicesEl.innerHTML = `
            <div class="p-6 rounded-xl bg-[#1b1c20] border border-[#2e3037] text-center space-y-3">
                <div class="w-10 h-10 rounded-full bg-[#282133] border border-[#4a365f] flex items-center justify-center text-[#c4a8e6] mx-auto">
                    ${getIconSvg('flag', 'w-5 h-5')}
                </div>
                <h4 class="font-bold text-sm text-zinc-100">Koniec ścieżki fabularnej</h4>
                <p class="text-xs text-zinc-400 max-w-md mx-auto">
                    ${isEnd ? 'Ten paragraf został oznaczony jako oficjalne zakończenie gry.' : 'Ten paragraf nie posiada zdefiniowanych dalszych wyborów (ślepy zaułek lub finał).'}
                </p>
                <div class="flex items-center justify-center gap-2 pt-2">
                    <button
                        type="button"
                        id="btn-playtest-end-back"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#212226] hover:bg-[#2a2c33] border border-[#2e3037] text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        ${getIconSvg('arrow-left', 'w-3.5 h-3.5 text-zinc-400')}
                        <span>Cofnij o 1 krok</span>
                    </button>
                    <button
                        type="button"
                        id="btn-playtest-end-restart"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#245842] hover:bg-[#2e6d52] border border-[#357357] text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        ${getIconSvg('undo', 'w-3.5 h-3.5')}
                        <span>Zacznij od początku</span>
                    </button>
                </div>
            </div>
        `

        const btnEndBack = document.getElementById('btn-playtest-end-back')
        if (btnEndBack) {
            btnEndBack.onclick = () => {
                if (playtestEngineInstance.canStepBack()) {
                    playtestEngineInstance.stepBack()
                    renderPlaytestView()
                }
            }
        }

        const btnEndRestart = document.getElementById('btn-playtest-end-restart')
        if (btnEndRestart) {
            btnEndRestart.onclick = () => {
                playtestEngineInstance.start()
                renderPlaytestView()
            }
        }
    } else {
        choicesEl.innerHTML = choices
            .map((ch, idx) => {
                const targetId =
                    (typeof ch.getToParagraphId === 'function' && ch.getToParagraphId()) ||
                    (typeof ch.getTargetParagraphId === 'function' && ch.getTargetParagraphId()) ||
                    (typeof ch.getTargetId === 'function' && ch.getTargetId()) ||
                    ch.toParagraphId ||
                    ch.targetParagraphId ||
                    ch.targetId ||
                    ''

                const targetP = playtestEngineInstance.findParagraph(targetId)
                const targetNum = targetP
                    ? typeof targetP.getDisplayNumber === 'function'
                        ? targetP.getDisplayNumber()
                        : typeof targetP.getNumber === 'function' && targetP.getNumber() > 0
                          ? targetP.getNumber()
                          : targetP.number || ''
                    : ''
                const targetTitle = targetP
                    ? targetP.getTitle
                        ? targetP.getTitle()
                        : targetP.getName
                          ? targetP.getName()
                          : targetId
                    : `Paragraf ${targetId || '?'}`

                const chTitle =
                    (typeof ch.getName === 'function' && ch.getName()) ||
                    (typeof ch.getTitle === 'function' && ch.getTitle()) ||
                    ch.name ||
                    ch.title ||
                    `Przejdź do: ${targetTitle}`

                // Condition check (informational for author & playtester)
                const condition =
                    typeof ch.getCondition === 'function' ? ch.getCondition() : ch.condition
                const hasCondition = Boolean(condition)
                let conditionBadge = ''
                if (hasCondition) {
                    const condText =
                        (typeof condition.getSummary === 'function'
                            ? condition.getSummary()
                            : condition.name || condition.text) || 'Warunek'
                    conditionBadge = `
                    <span class="px-2 py-0.5 rounded text-[10px] bg-[#29241b] border border-[#4d3d25] text-[#d6b07c] flex items-center gap-1 font-mono">
                        ${getIconSvg('lock', 'w-3 h-3 text-[#d6b07c]')} ${escapeHtml(condText)}
                    </span>
                    `
                }

                // Costs and Rewards
                const costs = typeof ch.getCosts === 'function' ? ch.getCosts() : ch.costs || []
                let costsBadge = ''
                if (costs.length > 0) {
                    const costsStr = costs.map(c => `-${c.value || 1} ${c.name}`).join(', ')
                    costsBadge = `
                    <span class="px-2 py-0.5 rounded text-[10px] bg-red-950/70 border border-red-800/50 text-red-300 font-mono">
                        Koszt: ${escapeHtml(costsStr)}
                    </span>
                    `
                }

                const rewards =
                    typeof ch.getRewards === 'function' ? ch.getRewards() : ch.rewards || []
                let rewardsBadge = ''
                if (rewards.length > 0) {
                    const rewardsStr = rewards.map(r => `+${r.value || 1} ${r.name}`).join(', ')
                    rewardsBadge = `
                    <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-mono">
                        Zysk: ${escapeHtml(rewardsStr)}
                    </span>
                    `
                }

                // Dice check
                const diceCheck =
                    typeof ch.getDiceCheck === 'function' ? ch.getDiceCheck() : ch.diceCheck || null
                let diceBadge = ''
                if (diceCheck && diceCheck.branches && diceCheck.branches.length > 0) {
                    const statPart = diceCheck.stat ? ` + ${diceCheck.stat}` : ''
                    diceBadge = `
                    <span class="px-2 py-0.5 rounded text-[10px] bg-purple-950/70 border border-purple-800/50 text-purple-300 font-mono flex items-center gap-1">
                        ${getIconSvg('combat', 'w-3 h-3')} Rzut: ${escapeHtml(diceCheck.dice)}${escapeHtml(statPart)} (${diceCheck.branches.length} cele)
                    </span>
                    `
                }

                const combatObj = currentP.getCombat ? currentP.getCombat() : currentP.combat
                const outcomesList =
                    combatObj && combatObj.getOutcomes ? combatObj.getOutcomes() : []
                const chId = typeof ch.getId === 'function' ? ch.getId() : ch.id
                const isCombatOutcome = Boolean(
                    hasCombat && outcomesList.some(o => o.id === chId || o.name === chTitle)
                )

                let outcomeBadge = ''
                if (isCombatOutcome) {
                    outcomeBadge = `
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1 shrink-0">
                        ${getIconSvg('combat', 'w-2.5 h-2.5') || '⚔️'} WYNIK WALKI
                    </span>
                    `
                }

                const targetLabel = targetNum ? `§ ${targetNum}: ${targetTitle}` : targetTitle

                return `
                <button
                    type="button"
                    class="btn-playtest-choice w-full text-left p-3 rounded-lg bg-[#1b1c20] hover:bg-[#22242a] border transition-all flex items-center justify-between group cursor-pointer shadow-xs ${
                        isCombatOutcome
                            ? 'border-amber-600/40 hover:border-amber-500/70 bg-gradient-to-r from-amber-950/20 to-[#1b1c20]'
                            : 'border-[#2e3037] hover:border-[#4a5e74]'
                    }"
                    data-choice-idx="${idx}"
                    data-target-id="${escapeHtml(targetId)}"
                    data-choice-title="${escapeHtml(chTitle)}"
                >
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <span class="w-6 h-6 rounded-md bg-[#24262c] border border-[#343740] flex items-center justify-center text-xs font-mono font-semibold text-zinc-300 group-hover:text-[#9bb7d4] group-hover:border-[#4a5e74] shrink-0">
                            ${idx + 1}
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                                <span>${escapeHtml(chTitle)}</span>
                                ${outcomeBadge}
                            </div>
                            <div class="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                                <span>(cel: ${escapeHtml(targetLabel)})</span>
                                ${conditionBadge}
                                ${costsBadge}
                                ${rewardsBadge}
                                ${diceBadge}
                            </div>
                        </div>
                    </div>
                    <span class="text-zinc-500 group-hover:text-[#9bb7d4] text-sm transition-transform group-hover:translate-x-1 pl-2 shrink-0">
                        →
                    </span>
                </button>
            `
            })
            .join('')

        choicesEl.querySelectorAll('.btn-playtest-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                const choiceIdx = parseInt(btn.dataset.choiceIdx, 10)
                const ch = choices[choiceIdx]
                let targetId = btn.dataset.targetId
                const title = btn.dataset.choiceTitle

                // Check and execute diceCheck if present
                const dc =
                    ch && (typeof ch.getDiceCheck === 'function' ? ch.getDiceCheck() : ch.diceCheck)
                if (dc && Array.isArray(dc.branches) && dc.branches.length > 0) {
                    const formula = dc.dice || '1k6'
                    let roll = Math.floor(Math.random() * 6) + 1
                    if (formula === '2k6' || formula === '2d6') {
                        const d1 = Math.floor(Math.random() * 6) + 1
                        const d2 = Math.floor(Math.random() * 6) + 1
                        roll = d1 + d2
                    } else if (formula === '1k20' || formula === '1d20') {
                        roll = Math.floor(Math.random() * 20) + 1
                    } else if (formula === '1k100' || formula === '1d100') {
                        roll = Math.floor(Math.random() * 100) + 1
                    }

                    const activeHero = playtestEngineInstance.getActiveHero
                        ? playtestEngineInstance.getActiveHero()
                        : null
                    let bonus = 0
                    if (dc.stat && activeHero) {
                        const statVal =
                            typeof activeHero.getStat === 'function'
                                ? activeHero.getStat(dc.stat)
                                : activeHero[dc.stat]
                        if (typeof statVal === 'number') bonus = statVal
                    }
                    const totalScore = roll + bonus
                    const matchedBranch =
                        dc.branches.find(b => totalScore >= b.min && totalScore <= b.max) ||
                        dc.branches[dc.branches.length - 1]

                    if (matchedBranch && matchedBranch.targetParagraphId) {
                        targetId = matchedBranch.targetParagraphId
                        const statInfo = dc.stat ? ` (+${bonus} ${dc.stat})` : ''
                        const branchDesc = matchedBranch.description
                            ? ` [${matchedBranch.description}]`
                            : ''
                        toast.info(
                            `Rzut ${formula}: wyrzucono ${roll}${statInfo} = ${totalScore}${branchDesc}`,
                            'Wynik rzutu kością'
                        )
                    }
                }

                // Notify costs & rewards
                const chCosts =
                    ch && (typeof ch.getCosts === 'function' ? ch.getCosts() : ch.costs || [])
                if (chCosts && chCosts.length > 0) {
                    toast.warning(
                        `Utracono: ${chCosts.map(c => `${c.value || 1} ${c.name}`).join(', ')}`,
                        'Koszt wyboru'
                    )
                }

                const chRewards =
                    ch && (typeof ch.getRewards === 'function' ? ch.getRewards() : ch.rewards || [])
                if (chRewards && chRewards.length > 0) {
                    toast.success(
                        `Zyskano: ${chRewards.map(r => `${r.value || 1} ${r.name}`).join(', ')}`,
                        'Nagroda za wybór'
                    )
                }

                if (!targetId) {
                    toast.warning('Ten wybór nie ma przypisanego węzła docelowego.', 'Wybór')
                    return
                }
                const nextP = playtestEngineInstance.goTo(targetId, title)
                if (nextP) {
                    renderPlaytestView()
                } else {
                    toast.error(`Nie znaleziono paragrafu o ID: ${targetId}`, 'Błąd przejścia')
                }
            })
        })
    }
}
