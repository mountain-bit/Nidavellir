/**
 * Details Panel Controller (Facade)
 * Orchestrates right-sidebar history bar and entity property inspection panels,
 * delegating sub-responsibilities to specialized modules.
 */

import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { Choice } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, renderEmptyPlaceholderHtml } from '../common/htmlTemplates.js'
import { renderChoiceDetails } from './choice/choiceDetails.js'
import { renderCombatModule } from './combat/combatModule.js'
import { createSection } from './common/domHelpers.js'
import { renderItemDetails } from './item/itemDetails.js'
import {
    renderCharactersModule,
    renderFeaturesModule,
    renderLocationsModule,
    renderParametersModule,
    renderSkillsModule,
    renderTagsModule,
    renderTraitsModule,
} from './modules/associationModules.js'
import { renderCustomAttributesModule } from './modules/customAttributesModule.js'
import {
    renderAvatarModule,
    renderColorModule,
    renderEntityHeaderModule,
    renderFilesModule,
    renderNameModule,
    renderParagraphNumberModule,
    renderParagraphRoleModule,
    renderSummaryModule,
} from './modules/entityConfigModules.js'
import { renderExitsModule } from './modules/exitsModule.js'
import { renderItemsModule } from './modules/itemsModule.js'
import { renderQuickActionsModule } from './modules/quickActionsModule.js'
import {
    renderParameterConfigModule,
    renderSkillConfigModule,
    renderStatValueModule,
} from './modules/rpgConfigModules.js'
import { renderHistoryBar as renderHistoryBarModule } from './navigation/historyBar.js'
import { renderHeroReadOnlyDetails } from './readonly/heroReadOnlyDetails.js'
import { renderNpcReadOnlyDetails } from './readonly/npcReadOnlyDetails.js'

// Re-export submodules for full backward compatibility
export {
    renderAvatarModule,
    renderCharactersModule,
    renderChoiceDetails,
    renderColorModule,
    renderCombatModule,
    renderCustomAttributesModule,
    renderEntityHeaderModule,
    renderExitsModule,
    renderFeaturesModule,
    renderFilesModule,
    renderHeroReadOnlyDetails,
    renderItemDetails,
    renderItemsModule,
    renderLocationsModule,
    renderNameModule,
    renderNpcReadOnlyDetails,
    renderParagraphNumberModule,
    renderParagraphRoleModule,
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
    if (type === 'item') return ctx.projectItems || []
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

    if (type === 'player_character' || type === 'playerCharacter' || type === 'main-character') {
        renderHeroReadOnlyDetails(container, entity, item, type, ctx)
        return
    }

    if (type === 'item') {
        renderItemDetails(container, entity, item, ctx, renderDetailsPanel)
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
    renderParagraphRoleModule(container, entity, type, ctx, () => renderDetailsPanel(ctx))
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
    renderItemsModule(container, entity, type, ctx, renderDetailsPanel)
    renderExitsModule(container, entity, type, ctx, renderDetailsPanel)
    renderCombatModule(container, entity, type, ctx, renderDetailsPanel)
    renderQuickActionsModule(container, item, type, ctx)
}

/**
 * Pure HTML template for Start Node informational section.
 */
export function renderStartNodeInfoHtml() {
    const entryPointTitle = t('graph.start_node_entry_point') || 'Punkt startowy'
    const technicalHint =
        t('graph.start_node_technical_hint') ||
        'Punkt wyjścia historii. Połącz z pierwszym paragrafem.'
    return `
        <div class="flex items-center gap-2">
            <span class="text-emerald-400 shrink-0">${getIconSvg('play', 'w-3.5 h-3.5')}</span>
            <span class="text-xs font-semibold text-zinc-200">
                ${escapeHtml(entryPointTitle)}
            </span>
        </div>
        <p class="text-[11px] text-zinc-400 leading-relaxed">
            ${escapeHtml(technicalHint)}
        </p>
    `
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
    // 1. Standard entity header (type badge + ID)
    renderEntityHeaderModule(container, {
        type: 'start',
        id: entity.getId ? entity.getId() : item?.id || 'start',
    })

    // 2. Clean, elegant information section (consistent with details panel styling)
    const infoSection = createSection(
        'border-b border-[#333338] p-3 space-y-1',
        renderStartNodeInfoHtml()
    )
    container.appendChild(infoSection)

    // 3. Render outgoing exits from this start node
    renderExitsModule(container, entity, 'paragraph', ctx, onRefresh)

    // 4. Quick actions (focus on graph canvas)
    renderQuickActionsModule(container, item, 'paragraph', ctx)
}
