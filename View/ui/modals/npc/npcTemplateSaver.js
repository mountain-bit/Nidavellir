/**
 * Handles validation, domain/ViewModel creation, and persistence of NPC templates.
 * Delegates to the unified entity saver engine.
 */

import { saveNpcEntity } from './npcEntitySaverCommon.js'

/**
 * Validates and saves the NPC template, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @param {object} [options] Callbacks and field getters
 * @param {() => string} options.getName
 * @param {() => string} options.getSummary
 * @param {() => string} options.getDescription
 * @param {() => void} options.closeModal
 * @param {() => void} options.resetForm
 * @returns {object|null} Created template object or null if validation failed
 */
export function saveNpcTemplate(ctx, options = {}) {
    return saveNpcEntity(
        {
            entityType: 'template',
            idPrefix: 'template_',
            validationRequiredMsgKey: 'npc.validation_template_name_required',
            defaultValidationMsg: 'Nazwa szablonu jest wymagana',
            updatedSuccessMsgKey: 'npc.template_updated_success_msg',
            updatedSuccessTitleKey: 'npc.template_updated_success_title',
            createdSuccessMsgKey: 'npc.template_created_success_msg',
            createdSuccessTitleKey: 'npc.template_created_success_title',
            defaultUpdatedMsg: name => `Pomyślnie zaktualizowano szablon ${name}`,
            defaultCreatedMsg: name => `Pomyślnie utworzono szablon ${name}`,
            defaultUpdatedTitle: 'Szablon zaktualizowany',
            defaultCreatedTitle: 'Szablon utworzony',
            createVmEntity: (vm, name) =>
                vm && typeof vm.createTemplate === 'function'
                    ? vm.createTemplate(name)
                    : vm && typeof vm.createCharacter === 'function'
                      ? vm.createCharacter(name)
                      : null,
            addToProject: (effectiveCtx, vm, entity) => {
                if (vm?.project && typeof vm.project.addTemplate === 'function') {
                    vm.project.addTemplate(entity)
                }
                if (Array.isArray(effectiveCtx.projectTemplates)) {
                    const exists = effectiveCtx.projectTemplates.some(
                        t =>
                            t === entity ||
                            (typeof t.getId === 'function' ? t.getId() : t.id) ===
                                (typeof entity.getId === 'function' ? entity.getId() : entity.id)
                    )
                    if (!exists) {
                        effectiveCtx.projectTemplates.push(entity)
                    }
                } else if (!vm?.project) {
                    effectiveCtx.projectTemplates = [entity]
                }
            },
            ipcCategory: 'Templates',
        },
        ctx,
        options
    )
}
