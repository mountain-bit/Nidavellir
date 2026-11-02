/**
 * @fileoverview Feature addition dropdown component for Choice entities.
 * Allows authors to attach optional mechanics (Conditions, Costs, Rewards, Dice Checks)
 * with click-outside dismissal and accessible keyboard navigation.
 *
 * @module choiceAddDropdown
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Definition of available feature groups and their options for choice enhancement.
 */
export const CHOICE_FEATURE_OPTIONS = Object.freeze([
    Object.freeze({
        groupKey: 'details.condition_title',
        defaultGroupLabel: 'Warunek przeskoku',
        options: Object.freeze([
            Object.freeze({
                value: 'cond-item',
                labelKey: 'details.condition_type_item',
                defaultLabel: 'Wymagany przedmiot',
            }),
            Object.freeze({
                value: 'cond-stat',
                labelKey: 'details.condition_type_stat',
                defaultLabel: 'Wymagana cecha / parametr',
            }),
            Object.freeze({
                value: 'cond-tag',
                labelKey: 'details.condition_type_tag',
                defaultLabel: 'Wymagany tag / flaga',
            }),
            Object.freeze({
                value: 'cond-text',
                labelKey: 'condition.type_text',
                defaultLabel: 'Pisemny warunek autora',
            }),
        ]),
    }),
    Object.freeze({
        groupKey: 'details.gain_loss_group',
        defaultGroupLabel: 'Zysk / Strata',
        options: Object.freeze([
            Object.freeze({
                value: 'loss',
                labelKey: 'details.add_loss_option',
                defaultLabel: 'Strata (co się straci) – przedmiot lub parametr',
            }),
            Object.freeze({
                value: 'gain',
                labelKey: 'details.add_gain_option',
                defaultLabel: 'Zysk (co się zyska) – przedmiot lub parametr',
            }),
        ]),
    }),
    Object.freeze({
        groupKey: 'details.dice_group',
        defaultGroupLabel: 'Rzut kością',
        options: Object.freeze([
            Object.freeze({
                value: 'dice',
                labelKey: 'details.add_dice_option',
                defaultLabel: 'Rzut – test rzutu kością',
            }),
        ]),
    }),
])

/**
 * Generates HTML options and optgroups for the choice add-feature select element.
 *
 * @param {Array<object>} [groups=CHOICE_FEATURE_OPTIONS]
 * @returns {string}
 */
export function renderChoiceAddDropdownOptionsHtml(groups = CHOICE_FEATURE_OPTIONS) {
    const placeholderText = escapeHtml(t('details.add_condition', 'Dodaj warunek'))
    let html = `<option value="" selected disabled>${placeholderText}</option>`

    if (!Array.isArray(groups)) return html

    for (const group of groups) {
        const groupLabel = escapeHtml(t(group.groupKey, group.defaultGroupLabel))
        html += `<optgroup label="${groupLabel}">`

        if (Array.isArray(group.options)) {
            for (const opt of group.options) {
                const optVal = escapeHtml(opt.value)
                const optLabel = escapeHtml(t(opt.labelKey, opt.defaultLabel))
                html += `<option value="${optVal}">${optLabel}</option>`
            }
        }

        html += `</optgroup>`
    }

    return html
}

/**
 * Handles selection change in the feature select element and resets it.
 *
 * @param {HTMLSelectElement|null} selectEl
 * @param {(action: string) => void} [onSelectFeature]
 */
export function handleFeatureSelection(selectEl, onSelectFeature) {
    if (!selectEl) return
    const val = selectEl.value
    selectEl.value = ''
    if (val && typeof onSelectFeature === 'function') {
        onSelectFeature(val)
    }
}

/**
 * Creates the dropdown selector to add conditions, loss/gain modifiers, or dice rolls to the choice.
 *
 * @param {((action: string) => void)|{ onSelectFeature?: (action: string) => void }} [onSelectFeatureOrOptions]
 * @returns {HTMLElement}
 */
export function createChoiceAddDropdown(onSelectFeatureOrOptions) {
    const onSelectFeature =
        typeof onSelectFeatureOrOptions === 'function'
            ? onSelectFeatureOrOptions
            : onSelectFeatureOrOptions?.onSelectFeature

    const titleText = escapeHtml(t('details.condition_title', 'Warunek przeskoku'))
    const selectAriaLabel = escapeHtml(t('details.add_condition', 'Dodaj warunek'))
    const optionsHtml = renderChoiceAddDropdownOptionsHtml()

    const section = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400" aria-hidden="true">${getIconSvg('filter', 'w-3.5 h-3.5')}</span>
                ${titleText}
            </span>
        </div>
        <select id="choice-add-feature-select" class="w-full bg-[#18181b] hover:bg-[#222226] border border-[#3f3f46] hover:border-blue-500 text-blue-400 font-medium text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors" aria-label="${selectAriaLabel}">
            ${optionsHtml}
        </select>
    `
    )

    const selectEl = section.querySelector('#choice-add-feature-select')
    if (selectEl) {
        selectEl.addEventListener('change', () => {
            handleFeatureSelection(selectEl, onSelectFeature)
        })
    }

    return section
}
