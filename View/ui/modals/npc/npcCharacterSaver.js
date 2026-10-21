/**
 * Handles validation, domain/ViewModel creation, and persistence of NPC characters.
 * Delegates to the unified entity saver engine.
 */

import { saveNpcEntity } from './npcEntitySaverCommon.js'

/**
 * Validates and saves the NPC character, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @param {object} [options] Callbacks and field getters
 * @param {() => string} options.getName
 * @param {() => string} options.getSummary
 * @param {() => string} options.getDescription
 * @param {() => void} options.closeModal
 * @param {() => void} options.resetForm
 * @returns {object|null} Created character object or null if validation failed
 */
export function saveNpcCharacter(ctx, options = {}) {
    return saveNpcEntity(
        {
            entityType: 'character',
            idPrefix: 'char_',
            validationRequiredMsgKey: 'npc.validation_name_required',
            defaultValidationMsg: 'Nazwa postaci jest wymagana',
            updatedSuccessMsgKey: 'npc.updated_success_msg',
            updatedSuccessTitleKey: 'npc.updated_success_title',
            createdSuccessMsgKey: 'npc.created_success_msg',
            createdSuccessTitleKey: 'npc.created_success_title',
            defaultUpdatedMsg: name => `Pomyślnie zaktualizowano postać ${name}`,
            defaultCreatedMsg: name => `Pomyślnie utworzono postać ${name}`,
            defaultUpdatedTitle: 'Postać zaktualizowana',
            defaultCreatedTitle: 'Postać utworzona',
            createVmEntity: (vm, name) =>
                vm && typeof vm.createCharacter === 'function' ? vm.createCharacter(name) : null,
            addToProject: (effectiveCtx, vm, entity) => {
                if (Array.isArray(effectiveCtx.projectCharacters)) {
                    effectiveCtx.projectCharacters.push(entity)
                }
                if (vm?.project && typeof vm.project.addCharacter === 'function') {
                    vm.project.addCharacter(entity)
                }
            },
        },
        ctx,
        options
    )
}
