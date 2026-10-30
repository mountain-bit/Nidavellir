/**
 * Combat Module Controller for Paragraph Details Panel.
 *
 * Orchestrates:
 * - Toggle combat encounter for the active paragraph.
 * - Opponents traits and parameters visibility.
 * - Adding, configuring, and removing opponents (NPCs).
 * - Defining custom dynamic combat outcomes synced with story graph choices.
 * - Generating and synchronizing Markdown representation with paragraph description.
 */

import { formatDescriptionFileName } from '../../../../dist/Utils/pathSanitizer.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    Combat,
    CombatMarkdownService,
    CombatSyncService,
    Paragraph,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { getMainEditorInstance } from '../../editor/index.js'
import { createSection } from '../common/domHelpers.js'
import { renderCombatHeader } from './combatHeader.js'
import { renderCombatOpponentsSection } from './combatOpponentsSection.js'
import { renderCombatOutcomesSection } from './combatOutcomesSection.js'
import { renderCombatTraitsSection } from './combatTraitsSection.js'

/**
 * Generates formatted Markdown block for combat encounter.
 *
 * @param {object} entity Paragraph entity
 * @param {object} ctx Application UI context
 * @returns {string}
 */
export function generateCombatMarkdown(entity, ctx) {
    return CombatMarkdownService.generateMarkdown(entity, ctx)
}

/**
 * Synchronizes combat configuration with the paragraph's Markdown description.
 * Injects, updates, or removes the <!-- COMBAT_START --> ... <!-- COMBAT_END --> block.
 *
 * @param {object} entity Paragraph entity
 * @param {object} ctx Application UI context
 */
export function syncCombatToParagraphDescription(entity, ctx) {
    if (!entity) return

    const desc = entity.getContent
        ? entity.getContent()
        : entity.getDescription
          ? entity.getDescription()
          : null
    if (!desc) return

    let rawPath = desc.getFilePath ? desc.getFilePath() : ''
    let baseFileName = ''
    if (rawPath) {
        const parts = rawPath.replace(/\\/g, '/').split('/')
        baseFileName = parts[parts.length - 1]
    }
    if (!baseFileName) {
        const title = (entity.getTitle && entity.getTitle()) || entity.getId() || 'element'
        baseFileName = formatDescriptionFileName('paragraph', title)
        rawPath = baseFileName
        if (desc.setFilePath) {
            desc.setFilePath(baseFileName)
        }
    }

    let currentText = ''
    // 1. If editor is active for this file, read latest text from editor
    const files = ctx?.vm?.files
    const activeFile =
        files && typeof files.getActiveFile === 'function' ? files.getActiveFile() : null
    const isEditorActiveForThisFile =
        Boolean(activeFile) && (activeFile === baseFileName || activeFile === rawPath)

    if (isEditorActiveForThisFile) {
        const mainEditor =
            typeof getMainEditorInstance === 'function' ? getMainEditorInstance() : null
        if (mainEditor && typeof mainEditor.getMarkdown === 'function') {
            currentText = mainEditor.getMarkdown()
        } else if (typeof document !== 'undefined') {
            const fileEditor = document.getElementById('file-editor')
            if (fileEditor && typeof fileEditor.value === 'string') {
                currentText = fileEditor.value
            }
        }
    }

    // 2. Check ctx.files
    if (!currentText && ctx?.files) {
        if (typeof ctx.files[baseFileName] === 'string') {
            currentText = ctx.files[baseFileName]
        } else if (typeof ctx.files[rawPath] === 'string') {
            currentText = ctx.files[rawPath]
        }
    }

    // 3. Fallback to model
    if (!currentText && desc.getText) {
        currentText = desc.getText() || ''
    }

    const hasCombat = Boolean(entity.getHasCombat && entity.getHasCombat())
    const combatMd = hasCombat ? CombatMarkdownService.generateMarkdown(entity, ctx) : ''
    const pTitle = (entity.getTitle && entity.getTitle()) || ''
    const updatedText = CombatMarkdownService.updateContentWithCombat(
        currentText,
        combatMd,
        hasCombat,
        pTitle
    )

    if (updatedText !== currentText || !desc.getText()) {
        if (desc.setText) {
            desc.setText(updatedText)
        }
        if (ctx?.files) {
            ctx.files[baseFileName] = updatedText
            if (rawPath && rawPath !== baseFileName) {
                ctx.files[rawPath] = updatedText
            }
        }

        // Update open editor if active
        if (isEditorActiveForThisFile && typeof document !== 'undefined') {
            const fileEditor = document.getElementById('file-editor')
            if (fileEditor && fileEditor.value !== updatedText) {
                fileEditor.value = updatedText
            }
            const mainEditor =
                typeof getMainEditorInstance === 'function' ? getMainEditorInstance() : null
            if (mainEditor && typeof mainEditor.setMarkdown === 'function') {
                const curMd =
                    typeof mainEditor.getMarkdown === 'function' ? mainEditor.getMarkdown() : ''
                if (curMd !== updatedText) {
                    mainEditor.setMarkdown(updatedText)
                }
            }
        }

        // Auto-save to disk if Electron API is available and project path exists
        const currentPath =
            typeof window !== 'undefined' && window.currentProjectPath
                ? window.currentProjectPath
                : ''
        if (
            typeof window !== 'undefined' &&
            window.electronAPI &&
            typeof window.electronAPI.saveMarkdownFile === 'function' &&
            currentPath
        ) {
            const targetSaveFile = baseFileName || rawPath
            window.electronAPI
                .saveMarkdownFile(currentPath, targetSaveFile, updatedText)
                .catch(err => {
                    console.warn('Auto-save combat markdown to disk failed:', err)
                })
        }
    }
}

/**
 * Renders the combat module at the bottom of the paragraph inspection details panel.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderCombatModule(container, entity, type, ctx, onRefreshDetails) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const markDirty = () => {
        if (typeof ctx.markProjectDirty === 'function') {
            ctx.markProjectDirty()
        } else if (ctx.projectStateTracker?.markDirty) {
            ctx.projectStateTracker.markDirty()
        }
    }

    const notifyGraph = () => {
        if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
            ctx.storyGraphInstance.render(true)
        } else if (typeof ctx.showGraph === 'function') {
            ctx.showGraph(true)
        } else if (typeof window !== 'undefined' && window.storyGraphInstance?.render) {
            window.storyGraphInstance.render(true)
        }
        if (typeof ctx.renderConnectionsList === 'function') {
            ctx.renderConnectionsList()
        }
        if (typeof ctx.renderParagraphsList === 'function') {
            ctx.renderParagraphsList()
        }
        window.dispatchEvent(new CustomEvent('project-changed'))
    }

    const hasCombat = Boolean(entity.getHasCombat && entity.getHasCombat())
    let combat = entity.getCombat ? entity.getCombat() : null
    if (!combat) {
        combat = new Combat('combat_' + (entity.getId() || Date.now()), entity.getTitle() || '')
        entity.setCombat(combat)
    }

    if (hasCombat) {
        syncCombatToParagraphDescription(entity, ctx)
    }

    const combatSection = createSection(
        'border-b border-[#333338] p-3 space-y-3 combat-module-container'
    )

    // Data collections
    const availableTraits = CombatMarkdownService.extractTraits(ctx)
    const allNpcs = [
        ...(ctx.projectCharacters || ctx.projectData?.projectCharacters || []),
        ...(ctx.projectTemplates || ctx.projectData?.projectTemplates || []),
    ]
    const allParagraphs = (
        ctx.projectParagraphs ||
        ctx.projectData?.projectParagraphs ||
        []
    ).filter(p => (typeof p.getId === 'function' ? p.getId() : p.id) !== entity.getId())

    // Helper callbacks for child sections
    const onModify = () => {
        syncCombatToParagraphDescription(entity, ctx)
        markDirty()
        notifyGraph()
    }

    const onFullRefresh = () => {
        syncCombatToParagraphDescription(entity, ctx)
        markDirty()
        notifyGraph()
        refreshDetails()
    }

    // Header toggle callback
    const onToggleCombat = () => {
        if (!hasCombat) {
            entity.setHasCombat(true)
            syncCombatToParagraphDescription(entity, ctx)
            markDirty()
            notifyGraph()
            refreshDetails()
            toast.success(t('combat.enable') || 'Włączono walkę w paragrafie')
        } else {
            entity.setHasCombat(false)
            CombatSyncService.cleanupCombatChoices(
                entity,
                combat,
                ctx.projectParagraphs || [],
                ctx.vm
            )
            syncCombatToParagraphDescription(entity, ctx)
            markDirty()
            notifyGraph()
            refreshDetails()
            toast.info(t('combat.disable') || 'Wyłączono walkę w paragrafie')
        }
    }

    // Render Header
    renderCombatHeader(combatSection, hasCombat, onToggleCombat)

    if (!hasCombat) {
        const descP = document.createElement('p')
        descP.className = 'text-[11px] text-zinc-400 leading-relaxed'
        descP.textContent =
            t('combat.description') ||
            'Włącz ten moduł, aby skonfigurować walkę z przeciwnikami (NPC), ustalić widoczne cechy oraz zdefiniować możliwe wyniki starcia.'
        combatSection.appendChild(descP)
        container.appendChild(combatSection)
        return
    }

    // Render Sub-sections when combat is active
    renderCombatTraitsSection(combatSection, combat, availableTraits, allNpcs, onFullRefresh)
    renderCombatOpponentsSection(
        combatSection,
        combat,
        allNpcs,
        availableTraits,
        onModify,
        onFullRefresh
    )
    renderCombatOutcomesSection(
        combatSection,
        entity,
        combat,
        allParagraphs,
        ctx,
        onModify,
        onFullRefresh
    )

    container.appendChild(combatSection)
}
