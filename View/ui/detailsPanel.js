/**
 * Details Panel Controller (Facade)
 * Orchestrates right-sidebar history bar and entity property inspection panels,
 * delegating sub-responsibilities to specialized modules.
 */

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
import { renderEmptyPlaceholderHtml } from './htmlTemplates.js'

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
