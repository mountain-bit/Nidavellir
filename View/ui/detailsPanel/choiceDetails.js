import {
    ItemCondition,
    StatCondition,
    TextCondition,
} from '../../../dist/ViewModel/MainWindowViewModel.js'
import { createChoiceActionsSection } from './choice/choiceActionsSection.js'
import { createChoiceAddDropdown } from './choice/choiceAddDropdown.js'
import { createChoiceConditionSection } from './choice/choiceConditionSection.js'
import { createChoiceCostsSection } from './choice/choiceCostsSection.js'
import { ensureChoiceDatalists } from './choice/choiceDatalists.js'
import { createChoiceDiceSection } from './choice/choiceDiceSection.js'
import { createChoiceHeader } from './choice/choiceHeader.js'
import { createChoiceRewardsSection } from './choice/choiceRewardsSection.js'

/**
 * Renders details and editing controls for a selected Choice (connection).
 *
 * @param {HTMLElement} container
 * @param {object} choice
 * @param {object} item
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderChoiceDetails(container, choice, item, ctx, onRefreshDetails) {
    // 1. Nagłówek, edycja nazwy i węzły połączenia
    const { headerMod, nameMod, nodesMod, getNameInput } = createChoiceHeader(
        choice,
        item,
        ctx,
        onRefreshDetails
    )
    container.appendChild(headerMod)
    container.appendChild(nameMod)
    container.appendChild(nodesMod)

    // 2. Datalisty do podpowiedzi (przedmioty, cechy)
    ensureChoiceDatalists(container, ctx)

    // Deklaracje sekcji przed definicją saveAllChoiceData
    let conditionSection
    let costsSection
    let rewardsSection
    let diceSection

    const saveAllChoiceData = () => {
        const nameInput = getNameInput()
        const nameVal = (nameInput ? nameInput.value.trim() : '') || choice.getName()
        const conditionObj = conditionSection ? conditionSection.buildConditionObject() : null

        ctx.vm.updateChoiceDetails(
            choice,
            nameVal,
            conditionObj,
            choice.getCosts(),
            choice.getRewards(),
            choice.getDiceCheck()
        )
        ctx.renderConnectionsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
    }

    const updateVisibility = () => {
        if (!conditionSection) return

        // Widoczność warunku
        if (conditionSection.getConditionType() === 'none') {
            conditionSection.sectionEl.classList.add('hidden')
        } else {
            conditionSection.sectionEl.classList.remove('hidden')
        }

        // Widoczność kosztów (straty)
        const costs = choice.getCosts() || []
        if (costs.length === 0) {
            costsSection.sectionEl.classList.add('hidden')
        } else {
            costsSection.sectionEl.classList.remove('hidden')
        }

        // Widoczność nagród (zysku)
        const rewards = choice.getRewards() || []
        if (rewards.length === 0) {
            rewardsSection.sectionEl.classList.add('hidden')
        } else {
            rewardsSection.sectionEl.classList.remove('hidden')
        }

        // Widoczność testu rzutu kością
        if (!choice.getDiceCheck()) {
            diceSection.sectionEl.classList.add('hidden')
        } else {
            diceSection.sectionEl.classList.remove('hidden')
        }
    }

    // 3. Sekcja warunku
    conditionSection = createChoiceConditionSection({
        choice,
        onSave: () => {
            saveAllChoiceData()
            updateVisibility()
        },
        onRemove: () => {
            choice.setCondition(null)
            saveAllChoiceData()
            updateVisibility()
        },
    })

    // 4. Sekcja kosztów (co się straci)
    costsSection = createChoiceCostsSection({
        choice,
        onSave: () => {
            saveAllChoiceData()
            updateVisibility()
        },
        onRemoveAll: () => {
            choice.setCosts([])
            saveAllChoiceData()
            updateVisibility()
        },
    })

    // 5. Sekcja nagród (co się zyska)
    rewardsSection = createChoiceRewardsSection({
        choice,
        onSave: () => {
            saveAllChoiceData()
            updateVisibility()
        },
        onRemoveAll: () => {
            choice.setRewards([])
            saveAllChoiceData()
            updateVisibility()
        },
    })

    // 6. Sekcja testu rzutu kością
    diceSection = createChoiceDiceSection({
        choice,
        ctx,
        onSave: () => {
            saveAllChoiceData()
            updateVisibility()
        },
        onRemove: () => {
            choice.setDiceCheck(null)
            saveAllChoiceData()
            updateVisibility()
        },
    })

    // 7. Rozwijana lista "Dodaj warunek"
    const addDropdownMod = createChoiceAddDropdown(val => {
        if (val === 'cond-item') {
            conditionSection.setConditionType('item')
            const existingCond = choice.getCondition()
            choice.setCondition(
                new ItemCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Wymagany przedmiot',
                    existingCond instanceof ItemCondition ? existingCond.getItemName() : '',
                    existingCond instanceof ItemCondition ? existingCond.getQuantity() : 1
                )
            )
            conditionSection.renderCondBody()
            saveAllChoiceData()
            updateVisibility()
            conditionSection.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            conditionSection.sectionEl.querySelector('#choice-cond-item-name')?.focus()
        } else if (val === 'cond-stat') {
            conditionSection.setConditionType('stat')
            const existingCond = choice.getCondition()
            choice.setCondition(
                new StatCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Wymagana cecha',
                    existingCond instanceof StatCondition ? existingCond.getStatName() : '',
                    existingCond instanceof StatCondition ? existingCond.getOperator() : '>=',
                    existingCond instanceof StatCondition ? existingCond.getValue() : 10
                )
            )
            conditionSection.renderCondBody()
            saveAllChoiceData()
            updateVisibility()
            conditionSection.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            conditionSection.sectionEl.querySelector('#choice-cond-stat-name')?.focus()
        } else if (val === 'cond-text') {
            conditionSection.setConditionType('text')
            const existingCond = choice.getCondition()
            choice.setCondition(
                new TextCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Warunek',
                    existingCond instanceof TextCondition ? existingCond.getText() : ''
                )
            )
            conditionSection.renderCondBody()
            saveAllChoiceData()
            updateVisibility()
            conditionSection.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            conditionSection.sectionEl.querySelector('#details-condition-text')?.focus()
        } else if (val === 'loss') {
            costsSection.promptAddCost()
        } else if (val === 'gain') {
            rewardsSection.promptAddReward()
        } else if (val === 'dice') {
            if (!choice.getDiceCheck()) {
                choice.setDiceCheck({
                    dice: '1k6',
                    description: 'Test rzutu',
                    branches: [
                        {
                            min: 1,
                            max: 3,
                            targetParagraphId: choice.getToParagraphId(),
                            description: 'Porażka',
                        },
                        {
                            min: 4,
                            max: 6,
                            targetParagraphId: choice.getToParagraphId(),
                            description: 'Sukces',
                        },
                    ],
                })
            }
            diceSection.syncDiceInputs()
            diceSection.renderBranches()
            saveAllChoiceData()
            updateVisibility()
            diceSection.sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    })

    container.appendChild(addDropdownMod)
    container.appendChild(conditionSection.sectionEl)
    container.appendChild(costsSection.sectionEl)
    container.appendChild(rewardsSection.sectionEl)
    container.appendChild(diceSection.sectionEl)

    // 8. Szybkie akcje (Pokaż w grafie, Usuń)
    const actionsMod = createChoiceActionsSection({
        choice,
        ctx,
        onRefreshDetails,
    })
    container.appendChild(actionsMod)

    // Inicjalizacja stanu
    conditionSection.renderCondBody()
    costsSection.renderCosts()
    rewardsSection.renderRewards()
    diceSection.syncDiceInputs()
    diceSection.renderBranches()
    updateVisibility()
}
