/**
 * Details Panel Controller (Facade)
 * Orchestrates right-sidebar history bar and entity property inspection panels,
 * delegating sub-responsibilities to specialized modules.
 */

import { t } from '../../../dist/Utils/translate.js'
import { Choice } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { renderEmptyPlaceholderHtml } from '../common/htmlTemplates.js'
import { renderChoiceDetails } from './choice/choiceDetails.js'
import { renderCombatModule } from './combat/combatModule.js'
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
    renderFeatureConfigModule,
    renderParameterConfigModule,
    renderSkillConfigModule,
    renderStatValueModule,
} from './modules/rpgConfigModules.js'
import { renderStartNodeDetails, renderStartNodeInfoHtml } from './modules/startNodeModule.js'
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
    renderStartNodeDetails,
    renderStartNodeInfoHtml,
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
 * @param {object} [ctx]
 * @returns {Array<object>}
 */
export function resolveEntityScope(type, ctx) {
    if (!ctx) return []

    const scopeMap = {
        paragraph: ctx.projectParagraphs,
        scene: ctx.projectScenes,
        character: ctx.projectCharacters,
        template: ctx.projectTemplates,
        location: ctx.projectLocations,
        item: ctx.projectItems,
        stat: ctx.projectStats,
        trait: ctx.projectStats,
        parameter: ctx.projectParameters,
        skill: ctx.projectSkills,
        feature: ctx.projectFeatures,
        tag: ctx.projectTags,
    }

    return Array.isArray(scopeMap[type]) ? scopeMap[type] : []
}

/**
 * Resolves the DOM container for the details panel.
 *
 * @param {object} [ctx]
 * @param {HTMLElement} [containerOverride]
 * @returns {HTMLElement|null}
 */
function resolveDetailsContainer(ctx, containerOverride) {
    if (containerOverride instanceof HTMLElement) {
        return containerOverride
    }
    if (ctx?.detailsContentContainer instanceof HTMLElement) {
        return ctx.detailsContentContainer
    }
    return document.getElementById('details-content')
}

/**
 * Renders standard inspection modules for an entity.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {string} type
 * @param {object} ctx
 * @param {Function} onRefresh
 */
function renderStandardEntityModules(container, entity, item, type, ctx, onRefresh) {
    const entityScope = resolveEntityScope(type, ctx)

    renderEntityHeaderModule(container, item)
    renderAvatarModule(container, entity, type, ctx, onRefresh)
    renderNameModule(container, item, entityScope, ctx, onRefresh)
    renderColorModule(container, entity, type, ctx)
    renderParagraphNumberModule(container, entity, type, ctx)
    renderStatValueModule(container, entity, type, ctx, onRefresh)
    renderParameterConfigModule(container, entity, type, ctx, onRefresh)
    renderSkillConfigModule(container, entity, type, ctx, onRefresh)
    renderFeatureConfigModule(container, entity, type, ctx, onRefresh)
    renderSummaryModule(container, entity, ctx)
    renderFilesModule(container, entity, ctx)
    renderLocationsModule(container, entity, type, ctx, onRefresh)
    renderCharactersModule(container, entity, type, ctx, onRefresh)
    renderTagsModule(container, entity, type, ctx, onRefresh)
    renderTraitsModule(container, entity, type, ctx, onRefresh)
    renderParametersModule(container, entity, type, ctx, onRefresh)
    renderSkillsModule(container, entity, type, ctx, onRefresh)
    renderFeaturesModule(container, entity, type, ctx, onRefresh)
    renderCustomAttributesModule(container, entity, type, ctx, onRefresh)
    if (type !== 'paragraph') {
        renderItemsModule(container, entity, type, ctx, onRefresh)
    }
    renderExitsModule(container, entity, type, ctx, onRefresh)
    renderCombatModule(container, entity, type, ctx, onRefresh)
    renderParagraphRoleModule(container, entity, type, ctx, onRefresh)
    renderQuickActionsModule(container, item, type, ctx)
}

/**
 * Renders the Right Details Panel for the currently selected entity or connection.
 *
 * @param {object} ctx Application UI Context
 * @param {HTMLElement} [containerOverride] Optional DOM container override
 */
export function renderDetailsPanel(ctx, containerOverride) {
    const container = resolveDetailsContainer(ctx, containerOverride)
    if (!container) return
    container.innerHTML = ''

    const selection = ctx?.vm?.selection
    const item = selection ? selection.getSelectedItem() : null
    if (!item) {
        container.innerHTML = renderEmptyPlaceholderHtml('§', t('details.no_selection'))
        return
    }

    const { entity, type } = item
    const onRefresh = () => renderDetailsPanel(ctx, container)

    if (type === 'choice' && entity instanceof Choice) {
        renderChoiceDetails(container, entity, item, ctx, onRefresh)
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
        renderItemDetails(container, entity, item, ctx, onRefresh)
        return
    }

    const isStartNode =
        type === 'paragraph' &&
        (Boolean(entity.getIsStart && entity.getIsStart()) || entity.isStart === true)

    if (isStartNode) {
        renderStartNodeDetails(container, entity, item, ctx, onRefresh)
        return
    }

    renderStandardEntityModules(container, entity, item, type, ctx, onRefresh)
}
