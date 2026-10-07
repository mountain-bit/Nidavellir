/**
 * Details Panel Controller (Facade)
 * Orchestrates right-sidebar history bar and entity property inspection panels,
 * delegating sub-responsibilities to specialized modules.
 */

import { getIconSvg } from '../../dist/Utils/icons.js'
import { t } from '../../dist/Utils/translate.js'
import { Choice } from '../../dist/ViewModel/MainWindowViewModel.js'
import { renderChoiceDetails } from './detailsPanel/choiceDetails.js'
import { renderExitsModule } from './detailsPanel/exitsModule.js'
import { renderHistoryBar as renderHistoryBarModule } from './detailsPanel/historyBar.js'
import {
    renderCharactersModule,
    renderFeaturesModule,
    renderLocationsModule,
    renderParametersModule,
    renderSkillsModule,
    renderTagsModule,
    renderTraitsModule,
} from './detailsPanel/modules/associationModules.js'
import { renderCustomAttributesModule } from './detailsPanel/modules/customAttributesModule.js'
import {
    renderAvatarModule,
    renderColorModule,
    renderEntityHeaderModule,
    renderFilesModule,
    renderNameModule,
    renderParagraphNumberModule,
    renderSummaryModule,
} from './detailsPanel/modules/entityConfigModules.js'
import {
    renderParameterConfigModule,
    renderSkillConfigModule,
    renderStatValueModule,
} from './detailsPanel/modules/rpgConfigModules.js'
import { renderNpcReadOnlyDetails } from './detailsPanel/npcReadOnlyDetails.js'
import { renderQuickActionsModule } from './detailsPanel/quickActionsModule.js'
import { escapeHtml, renderEmptyPlaceholderHtml } from './htmlTemplates.js'

// Re-export submodules for full backward compatibility
export {
    renderAvatarModule,
    renderCharactersModule,
    renderChoiceDetails,
    renderColorModule,
    renderCustomAttributesModule,
    renderEntityHeaderModule,
    renderExitsModule,
    renderFeaturesModule,
    renderFilesModule,
    renderLocationsModule,
    renderNameModule,
    renderNpcReadOnlyDetails,
    renderParagraphNumberModule,
    renderParameterConfigModule,
    renderQuickActionsModule,
    renderSkillConfigModule,
    renderSkillsModule,
    renderStatValueModule,
    renderSummaryModule,
    renderTagsModule,
    renderTraitsModule,
}

/**
 * Renders the top history tabs bar in the right sidebar.
 *
 * @param {object} ctx Application UI Context
 */
export function renderHistoryBar(ctx) {
    return renderHistoryBarModule(ctx, () => renderDetailsPanel(ctx))
}

/**
 * Resolves the scope array of entities based on type for validation and uniqueness checks.
 *
 * @param {string} type
 * @param {object} ctx
 * @returns {Array<object>}
 */
function resolveEntityScope(type, ctx) {
    if (type === 'paragraph') return ctx.projectParagraphs || []
    if (type === 'scene') return ctx.projectScenes || []
    if (type === 'character') return ctx.projectCharacters || []
    if (type === 'template') return ctx.projectTemplates || []
    if (type === 'location') return ctx.projectLocations || []
    if (type === 'stat' || type === 'trait') return ctx.projectStats || []
    if (type === 'parameter') return ctx.projectParameters || []
    if (type === 'skill') return ctx.projectSkills || []
    if (type === 'feature') return ctx.projectFeatures || []
    if (type === 'tag') return ctx.projectTags || []
    return []
}

/**
 * Renders the Right Details Panel for the currently selected entity or connection.
 *
 * @param {object} ctx Application UI Context
 */
export function renderDetailsPanel(ctx) {
    const container = document.getElementById('details-content')
    if (!container) return
    container.innerHTML = ''

    const item = ctx.vm.getSelectedItem()
    if (!item) {
        container.innerHTML = renderEmptyPlaceholderHtml('§', t('details.no_selection'))
        return
    }

    const { entity, type } = item

    if (type === 'choice' && entity instanceof Choice) {
        renderChoiceDetails(container, entity, item, ctx, renderDetailsPanel)
        return
    }

    if (type === 'character' || type === 'template') {
        renderNpcReadOnlyDetails(container, entity, item, type, ctx)
        return
    }

    const isStartNode =
        type === 'paragraph' &&
        (Boolean(entity.getIsStart && entity.getIsStart()) || entity.isStart === true)

    if (isStartNode) {
        renderStartNodeDetails(container, entity, item, ctx, renderDetailsPanel)
        return
    }

    const entityScope = resolveEntityScope(type, ctx)

    renderEntityHeaderModule(container, item)
    renderAvatarModule(container, entity, type, ctx, renderDetailsPanel)
    renderNameModule(container, item, entityScope, ctx, renderDetailsPanel)
    renderColorModule(container, entity, type, ctx)
    renderParagraphNumberModule(container, entity, type, ctx)
    renderStatValueModule(container, entity, type, ctx, renderDetailsPanel)
    renderParameterConfigModule(container, entity, type, ctx, renderDetailsPanel)
    renderSkillConfigModule(container, entity, type, ctx, renderDetailsPanel)
    renderSummaryModule(container, entity, ctx)
    renderFilesModule(container, entity, ctx)
    renderLocationsModule(container, entity, type, ctx, renderDetailsPanel)
    renderCharactersModule(container, entity, type, ctx, renderDetailsPanel)
    renderTagsModule(container, entity, type, ctx, renderDetailsPanel)
    renderTraitsModule(container, entity, type, ctx, renderDetailsPanel)
    renderParametersModule(container, entity, type, ctx, renderDetailsPanel)
    renderSkillsModule(container, entity, type, ctx, renderDetailsPanel)
    renderFeaturesModule(container, entity, type, ctx, renderDetailsPanel)
    renderCustomAttributesModule(container, entity, type, ctx, renderDetailsPanel)
    renderExitsModule(container, entity, type, ctx, renderDetailsPanel)
    renderQuickActionsModule(container, item, type, ctx)
}

/**
 * Renders dedicated technical inspection panel for the START node.
 * Contains technical badge, instructional steps for the author,
 * outgoing exits, and graph focus action.
 * Omits markdown files, narrative summary, tags, locations, characters and stats.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {object} ctx
 * @param {Function} onRefresh
 */
export function renderStartNodeDetails(container, entity, item, ctx, onRefresh) {
    const card = document.createElement('div')
    card.className = 'p-3 space-y-3'

    const entryPointText = t('graph.start_node_entry_point') || 'Punkt startowy opowieści'
    const detailsTitle = t('graph.start_node_details_title') || 'Techniczny punkt startowy'
    const detailsDesc =
        t('graph.start_node_details_desc') ||
        'Ten węzeł nie posiada treści narracyjnej, plików Markdown, tagów ani lokacji. Służy wyłącznie jako techniczny punkt wyjścia dla pierwszej sceny lub pierwszego paragrafu.'
    const guideTitle = t('graph.start_node_guide_title') || 'Jak rozpocząć pracę:'
    const step1 =
        t('graph.start_node_guide_step1') ||
        'Przeciągnij połączenie z gniazda po prawej stronie węzła do pierwszego paragrafu.'
    const step2 =
        t('graph.start_node_guide_step2') ||
        'Możesz też użyć przycisku (+) przy węźle na grafie, aby od razu utworzyć powiązany paragraf.'

    card.innerHTML = `
        <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] flex items-start gap-2.5">
            <span class="p-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                ${getIconSvg('play', 'w-4 h-4')}
            </span>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-white tracking-wider">START</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 uppercase tracking-wide">
                        ENTRY POINT
                    </span>
                </div>
                <div class="text-[11px] text-emerald-300/80 mt-0.5 font-medium">
                    ${escapeHtml(entryPointText)}
                </div>
            </div>
        </div>

        <div class="p-3 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                <span>${getIconSvg('info', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(detailsTitle)}</span>
            </div>
            <p class="text-[11px] text-zinc-300 leading-relaxed">
                ${escapeHtml(detailsDesc)}
            </p>
            <div class="pt-1 border-t border-zinc-800 space-y-1.5">
                <div class="text-[11px] font-medium text-zinc-200">
                    ${escapeHtml(guideTitle)}
                </div>
                <div class="flex items-start gap-2 text-[11px] text-zinc-400">
                    <span class="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-emerald-700/50">1</span>
                    <span>${escapeHtml(step1)}</span>
                </div>
                <div class="flex items-start gap-2 text-[11px] text-zinc-400">
                    <span class="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-emerald-700/50">2</span>
                    <span>${escapeHtml(step2)}</span>
                </div>
            </div>
        </div>
    `

    container.appendChild(card)

    // Render outgoing exits from this start node
    renderExitsModule(container, entity, 'paragraph', ctx, onRefresh)

    // Quick actions (focus on graph canvas)
    renderQuickActionsModule(container, item, 'paragraph', ctx)
}
