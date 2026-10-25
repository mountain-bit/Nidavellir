import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the dropdown selector to add conditions, loss/gain modifiers, or dice rolls to the choice.
 *
 * @param {(action: string) => void} onSelectFeature
 * @returns {HTMLElement}
 */
export function createChoiceAddDropdown(onSelectFeature) {
    const section = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400">${getIconSvg('filter', 'w-3.5 h-3.5')}</span>
                ${t('details.condition_title', 'Warunek przeskoku')}
            </span>
        </div>
        <select id="choice-add-feature-select" class="w-full bg-[#18181b] hover:bg-[#222226] border border-[#3f3f46] hover:border-blue-500 text-blue-400 font-medium text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors">
            <option value="" selected disabled>${t('details.add_condition', 'Dodaj warunek')}</option>
            <optgroup label="${t('details.condition_title', 'Warunek przeskoku')}">
                <option value="cond-item">${t('details.condition_type_item', 'Wymagany przedmiot')}</option>
                <option value="cond-stat">${t('details.condition_type_stat', 'Wymagana cecha / parametr')}</option>
                <option value="cond-tag">${t('details.condition_type_tag', 'Wymagany tag / flaga')}</option>
                <option value="cond-text">${t('condition.type_text', 'Pisemny warunek autora')}</option>
            </optgroup>
            <optgroup label="${t('details.gain_loss_group', 'Zysk / Strata')}">
                <option value="loss">${t('details.add_loss_option', 'Strata (co się straci) – przedmiot lub parametr')}</option>
                <option value="gain">${t('details.add_gain_option', 'Zysk (co się zyska) – przedmiot lub parametr')}</option>
            </optgroup>
            <optgroup label="${t('details.dice_group', 'Rzut kością')}">
                <option value="dice">${t('details.add_dice_option', 'Rzut – test rzutu kością')}</option>
            </optgroup>
        </select>
    `
    )

    const selectEl = section.querySelector('#choice-add-feature-select')
    selectEl.addEventListener('change', () => {
        const val = selectEl.value
        selectEl.value = ''
        if (val && typeof onSelectFeature === 'function') {
            onSelectFeature(val)
        }
    })

    return section
}
