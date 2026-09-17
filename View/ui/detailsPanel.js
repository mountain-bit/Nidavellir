import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import {
    Choice,
    DEFAULT_SCENE_COLOR,
    DEFAULT_TAG_COLOR,
    Paragraph,
    TextCondition,
} from '../../dist/ViewModel/MainWindowViewModel.js'
import {
    escapeHtml,
    getTypeBadgeColor,
    getTypeIconSvg,
    PRESET_COLORS,
    renderColorPresetButtonsHtml,
    renderEmptyPlaceholderHtml,
} from './htmlTemplates.js'

/**
 * Renders the top history tabs bar in the right sidebar.
 *
 * @param {object} ctx Application UI Context
 */
export function renderHistoryBar(ctx) {
    const container = document.getElementById('history-tabs-container')
    if (!container) return
    container.innerHTML = ''

    const history = ctx.vm.getHistory()
    const selected = ctx.vm.getSelectedItem()

    if (history.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-gray-500 italic px-1 select-none">${t('details.history')}: brak</span>`
        return
    }

    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'

    history.forEach(item => {
        const isActive = selected && selected.id === item.id && selected.type === item.type
        const tab = document.createElement('button')
        tab.type = 'button'
        tab.className = `group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            isActive
                ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
                : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'
        }`

        const icon = document.createElement('span')
        icon.className = 'text-[10px] opacity-80 shrink-0 inline-flex items-center'
        icon.innerHTML = getTypeIconSvg(item.type, 'w-3 h-3')

        const nameSpan = document.createElement('span')
        nameSpan.className = 'truncate max-w-[100px]'
        nameSpan.textContent = item.name

        const closeBtn = document.createElement('span')
        closeBtn.className =
            'ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5 inline-flex items-center'
        closeBtn.innerHTML = getIconSvg('close', 'w-3 h-3')
        closeBtn.title = t('buttons.close')
        closeBtn.addEventListener('click', e => {
            e.stopPropagation()
            ctx.vm.closeHistoryItem(item.id)
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
        })

        tab.appendChild(icon)
        tab.appendChild(nameSpan)
        tab.appendChild(closeBtn)

        tab.addEventListener('click', () => {
            ctx.vm.selectHistoryItem(item.id)
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
        })

        scrollWrapper.appendChild(tab)
    })

    const closeAllBtn = document.createElement('button')
    closeAllBtn.type = 'button'
    closeAllBtn.className =
        'shrink-0 ml-auto px-1.5 py-0.5 text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]'
    closeAllBtn.title = t('details.close_all')
    closeAllBtn.innerHTML = getIconSvg('close-all', 'w-3.5 h-3.5')
    closeAllBtn.addEventListener('click', () => {
        ctx.vm.closeAllHistory()
        renderHistoryBar(ctx)
        renderDetailsPanel(ctx)
    })

    container.appendChild(scrollWrapper)
    container.appendChild(closeAllBtn)
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
        renderChoiceDetails(container, entity, item, ctx)
        return
    }

    let entityScope = []
    if (type === 'paragraph') entityScope = ctx.projectParagraphs
    else if (type === 'scene') entityScope = ctx.projectScenes
    else if (type === 'character') entityScope = ctx.projectCharacters
    else if (type === 'location') entityScope = ctx.projectLocations
    else if (type === 'stat' || type === 'trait') entityScope = ctx.projectStats
    else if (type === 'tag') entityScope = ctx.projectTags

    renderEntityHeaderModule(container, item)
    renderNameModule(container, item, entityScope, ctx)
    renderColorModule(container, entity, type, ctx)
    renderParagraphNumberModule(container, entity, type, ctx)
    renderSummaryModule(container, entity, ctx)
    renderFilesModule(container, entity, ctx)
    renderLocationsModule(container, entity, type, ctx)
    renderCharactersModule(container, entity, type, ctx)
    renderTagsModule(container, entity, type, ctx)
    renderTraitsModule(container, entity, type, ctx)
    renderExitsModule(container, entity, type, ctx)
    renderQuickActionsModule(container, item, type, ctx)
}

// ---------------------------------------------------------------------------
// SUB-RENDERERS FOR DETAILS PANEL
// ---------------------------------------------------------------------------

function renderChoiceDetails(container, choice, item, ctx) {
    const fromId = choice.getFromParagraphId()
    const toId = choice.getToParagraphId()
    const fromP = ctx.projectParagraphs.find(p => p.getId() === fromId)
    const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
    const fromTitle = fromP ? fromP.getTitle() || fromP.getId() : fromId || '?'
    const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
    const cond = choice.getCondition()
    const condText = cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

    // Typ & ID
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor('choice')} font-medium">${t('details.type_choice')}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)

    // Nazwa / Etykieta przeskoku
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.choice_name')}</label>
        <input id="details-choice-name-input" type="text" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-choice-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    const nameInput = nameMod.querySelector('#details-choice-name-input')
    const nameError = nameMod.querySelector('#details-choice-name-error')

    const saveChoiceName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }
        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        const currentCondEl = container.querySelector('#details-condition-text')
        const currentCondText = currentCondEl ? currentCondEl.value : condText
        ctx.vm.updateChoiceDetails(choice, val, currentCondText)
        renderHistoryBar(ctx)
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        return true
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })
    nameInput.addEventListener('blur', saveChoiceName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (saveChoiceName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)

    // Węzły źródłowy i docelowy
    const nodesMod = document.createElement('section')
    nodesMod.className = 'border-b border-[#333338] p-3 space-y-2'
    nodesMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.nodes_section')}</div>
        <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-node-source" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-emerald-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${fromP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.source_node')}</span>
                    <span class="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-emerald-400 font-medium truncate mt-1 w-full" title="${escapeHtml(fromTitle)}">§ ${escapeHtml(fromTitle)}</div>
            </button>
            <button type="button" id="btn-node-target" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-blue-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${toP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.target_node')}</span>
                    <span class="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-blue-400 font-medium truncate mt-1 w-full" title="${escapeHtml(toTitle)}">§ ${escapeHtml(toTitle)}</div>
            </button>
        </div>
    `

    const sourceBtn = nodesMod.querySelector('#btn-node-source')
    const targetBtn = nodesMod.querySelector('#btn-node-target')
    if (sourceBtn) {
        sourceBtn.addEventListener('click', () => {
            if (fromP) ctx.selectEntity(fromP, 'paragraph')
        })
    }
    if (targetBtn) {
        targetBtn.addEventListener('click', () => {
            if (toP) ctx.selectEntity(toP, 'paragraph')
        })
    }
    container.appendChild(nodesMod)

    // Warunek Polimorficzny
    const condMod = document.createElement('section')
    condMod.className = 'border-b border-[#333338] p-3 space-y-2'
    condMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.condition_title')}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-amber-700/40 font-medium">${t('condition.type_text')}</span>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.condition_help')}</p>
        <textarea id="details-condition-text" rows="3" placeholder="${t('details.condition_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(condText)}</textarea>
    `
    const condInput = condMod.querySelector('#details-condition-text')
    condInput.addEventListener('input', () => {
        ctx.vm.updateChoiceDetails(choice, choice.getName(), condInput.value)
        ctx.renderConnectionsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
    })
    container.appendChild(condMod)

    // Szybkie akcje / Usuń
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        <button id="btn-details-delete-choice" class="w-full py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs text-left text-red-300 flex items-center justify-between cursor-pointer" type="button">
            <span>${t('details.delete_connection')}</span>
            <span class="text-red-400 shrink-0">${getIconSvg('close', 'w-3.5 h-3.5')}</span>
        </button>
    `
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = choice.getFromParagraphId() || choice.getId()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
    })
    actionsMod.querySelector('#btn-details-delete-choice').addEventListener('click', () => {
        if (confirm(t('context_menu.confirm_delete', { name: choice.getName() }))) {
            ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
            ctx.renderConnectionsList()
            ctx.renderParagraphsList()
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            toast.success(t('toast.connection_deleted'))
        }
    })
    container.appendChild(actionsMod)
}

function renderEntityHeaderModule(container, item) {
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(item.type)} font-medium">${escapeHtml(item.type.toUpperCase())}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)
}

function renderNameModule(container, item, entityScope, ctx) {
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <input id="details-name-input" type="text" value="${escapeHtml(item.name)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    const nameInput = nameMod.querySelector('#details-name-input')
    const nameError = nameMod.querySelector('#details-name-error')

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        const res = ctx.vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }
        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        ctx.vm.updateName(val, entityScope)
        renderHistoryBar(ctx)
        ctx.refreshActiveSection(item.type)
        return true
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        const res = ctx.vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })

    nameInput.addEventListener('blur', validateAndSaveName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (validateAndSaveName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)
}

function renderColorModule(container, entity, type, ctx) {
    if (typeof entity.getColor !== 'function' || typeof entity.setColor !== 'function') return

    const colorMod = document.createElement('section')
    colorMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentColor =
        entity.getColor() || (type === 'scene' ? DEFAULT_SCENE_COLOR : DEFAULT_TAG_COLOR)

    const sectionTitle =
        type === 'scene'
            ? t('details.scene_color')
            : type === 'tag'
              ? t('details.tag_color')
              : t('details.color')

    colorMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(sectionTitle)}</span>
            <div class="flex items-center gap-1.5">
                <span id="details-color-preview" class="w-3.5 h-3.5 rounded border border-white/20 shadow-sm shrink-0" style="background-color: ${escapeHtml(currentColor)}"></span>
                <span id="details-color-hex" class="text-[10px] font-mono text-gray-400 uppercase">${escapeHtml(currentColor)}</span>
            </div>
        </div>
        <div class="grid grid-cols-6 gap-1.5 pt-0.5">
            ${renderColorPresetButtonsHtml(PRESET_COLORS, currentColor)}
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="text-[11px] text-gray-400 shrink-0">${t('details.custom_color')}:</label>
            <input type="color" id="details-color-picker" value="${escapeHtml(currentColor)}" class="w-7 h-6 p-0 border border-[#3f3f46] rounded bg-transparent cursor-pointer shrink-0" />
            <input type="text" id="details-color-hex-input" value="${escapeHtml(currentColor)}" class="w-24 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-0.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-blue-500" />
        </div>
    `

    const previewEl = colorMod.querySelector('#details-color-preview')
    const hexLabel = colorMod.querySelector('#details-color-hex')
    const colorPicker = colorMod.querySelector('#details-color-picker')
    const hexInput = colorMod.querySelector('#details-color-hex-input')
    const presetBtns = colorMod.querySelectorAll('.details-color-preset-btn')

    const applyColor = newColor => {
        entity.setColor(newColor)
        if (previewEl) previewEl.style.backgroundColor = newColor
        if (hexLabel) hexLabel.textContent = newColor.toUpperCase()
        if (colorPicker) colorPicker.value = newColor
        if (hexInput) hexInput.value = newColor.toUpperCase()

        presetBtns.forEach(btn => {
            const isMatching = btn.dataset.color.toLowerCase() === newColor.toLowerCase()
            btn.classList.toggle('border-white', isMatching)
            btn.classList.toggle('ring-2', isMatching)
            btn.classList.toggle('ring-white/50', isMatching)
            btn.classList.toggle('scale-105', isMatching)
            btn.classList.toggle('border-white/15', !isMatching)
        })

        if (type === 'scene') {
            ctx.renderScenesList()
            if (ctx.storyGraphInstance) {
                ctx.storyGraphInstance.updateParagraphNodeColors(
                    ctx.projectParagraphs,
                    ctx.projectScenes
                )
                ctx.storyGraphInstance.updateSceneNodeBadges(ctx.projectScenes)
                const sceneEl = document.querySelector(
                    `scene-node[data-scene-id="${entity.getId()}"]`
                )
                if (sceneEl) {
                    sceneEl.themeColor = newColor
                }
            }
        } else {
            ctx.renderTagsList()
            if (ctx.renderFilterTags) ctx.renderFilterTags()
            ctx.renderParagraphsList()
            if (ctx.storyGraphInstance) {
                ctx.storyGraphInstance.render(true)
            }
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => applyColor(btn.dataset.color))
    })

    colorPicker.addEventListener('input', e => applyColor(e.target.value))

    hexInput.addEventListener('change', () => {
        let val = hexInput.value.trim()
        if (!val.startsWith('#')) val = '#' + val
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
            applyColor(val)
        } else {
            hexInput.value = (entity.getColor() || '').toUpperCase()
        }
    })

    container.appendChild(colorMod)
}

function renderParagraphNumberModule(container, entity, type, ctx) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const numMod = document.createElement('section')
    numMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const isLocked = Boolean(entity.getIsNumberLocked && entity.getIsNumberLocked())
    const customNum = entity.getCustomNumber ? entity.getCustomNumber() : 0

    numMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.paragraph_number')}</span>
            <span id="details-number-mode-badge" class="text-[10px] font-medium px-2 py-0.5 rounded ${
                isLocked
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }">
                ${isLocked ? `#${customNum || 1} (${t('details.custom_number')})` : t('details.auto_number')}
            </span>
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="flex items-center gap-1.5 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-number-lock" ${isLocked ? 'checked' : ''} class="rounded accent-blue-500 cursor-pointer" />
                <span>${t('details.lock_number')}</span>
            </label>
            <input id="details-custom-number" type="number" min="1" value="${isLocked && customNum ? customNum : ''}" placeholder="${t('details.custom_number_placeholder')}"
                ${!isLocked ? 'disabled' : ''}
                class="w-28 bg-[#18181b] border border-[#3f3f46] disabled:opacity-30 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
        </div>
        <div id="details-number-error" class="hidden text-[11px] text-red-400 mt-1"></div>
    `

    const lockCheckbox = numMod.querySelector('#details-number-lock')
    const customNumInput = numMod.querySelector('#details-custom-number')
    const modeBadge = numMod.querySelector('#details-number-mode-badge')
    const numberError = numMod.querySelector('#details-number-error')

    const validateNumber = val => {
        if (!lockCheckbox.checked || !val) {
            numberError.classList.add('hidden')
            customNumInput.classList.remove('border-red-500')
            return true
        }
        const res = ctx.vm.validateParagraphNumber(val, entity.getId(), ctx.projectParagraphs)
        if (!res.valid) {
            numberError.textContent = res.message || t('details.number_taken')
            numberError.classList.remove('hidden')
            customNumInput.classList.add('border-red-500')
            return false
        }
        numberError.classList.add('hidden')
        customNumInput.classList.remove('border-red-500')
        return true
    }

    if (isLocked && customNum) {
        validateNumber(customNum)
    }

    lockCheckbox.addEventListener('change', () => {
        const locked = lockCheckbox.checked
        ctx.vm.toggleNumberLock(locked)
        customNumInput.disabled = !locked
        if (!locked) {
            ctx.vm.updateCustomNumber(0)
            customNumInput.value = ''
            validateNumber(0)
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700'
                modeBadge.textContent = t('details.auto_number')
            }
        } else {
            const parsed = parseInt(customNumInput.value, 10) || 1
            ctx.vm.updateCustomNumber(parsed)
            customNumInput.value = String(parsed)
            validateNumber(parsed)
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50'
                modeBadge.textContent = `#${parsed} (${t('details.custom_number')})`
            }
        }
        ctx.renderParagraphsList()
    })

    customNumInput.addEventListener('input', () => {
        const val = parseInt(customNumInput.value, 10) || 0
        validateNumber(val)
        ctx.vm.updateCustomNumber(val)
        if (modeBadge && lockCheckbox.checked) {
            modeBadge.textContent = `#${val || 1} (${t('details.custom_number')})`
        }
        ctx.renderParagraphsList()
    })

    container.appendChild(numMod)
}

function renderSummaryModule(container, entity, ctx) {
    if (!entity.getContent || !entity.getContent()) return

    const summaryMod = document.createElement('section')
    summaryMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    const currentSummary = entity.getContent().getSummary() || ''

    summaryMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.summary')}</label>
        <textarea id="details-summary-input" rows="2" placeholder="${t('details.summary_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(currentSummary)}</textarea>
    `

    const summaryInput = summaryMod.querySelector('#details-summary-input')
    summaryInput.addEventListener('input', () => {
        ctx.vm.updateSummary(summaryInput.value)
    })

    container.appendChild(summaryMod)
}

function renderFilesModule(container, entity, ctx) {
    if (!entity.getContent) return

    const filesMod = document.createElement('section')
    filesMod.className = 'border-b border-[#333338] p-3 space-y-2'
    filesMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.description_files')}</div>
        <div class="flex flex-col gap-1.5">
            <button id="btn-open-player-text" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${t('details.open_player_text')}</span>
                </span>
                <span class="text-blue-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
            <button id="btn-open-author-notes" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-amber-400 shrink-0">${getIconSvg('markdown', 'w-3.5 h-3.5')}</span>
                    <span>${t('details.open_author_notes')}</span>
                </span>
                <span class="text-blue-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `

    filesMod.querySelector('#btn-open-player-text').addEventListener('click', () => {
        const { fileName, content } = ctx.vm.openOrCreateDescriptionFile('text')
        if (fileName) {
            ctx.files[fileName] = content
            ctx.updateMainWorkspaceUI()
            toast.success(`${t('details.open_player_text')}: ${t('details.file_created')}`)
        }
    })

    filesMod.querySelector('#btn-open-author-notes').addEventListener('click', () => {
        const { fileName, content } = ctx.vm.openOrCreateDescriptionFile('author')
        if (fileName) {
            ctx.files[fileName] = content
            ctx.updateMainWorkspaceUI()
            toast.success(`${t('details.open_author_notes')}: ${t('details.file_created')}`)
        }
    })

    container.appendChild(filesMod)
}

function renderLocationsModule(container, entity, type, ctx) {
    if (
        typeof entity.getLocations !== 'function' &&
        typeof entity.getLocation !== 'function' &&
        typeof entity.addLocation !== 'function'
    )
        return

    const locationMod = document.createElement('section')
    locationMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentLocs =
        typeof entity.getLocations === 'function'
            ? entity.getLocations()
            : entity.getLocation && entity.getLocation()
              ? [entity.getLocation()]
              : []

    locationMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                <span>${t('details.locations')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentLocs.length}</span>
        </div>
        <div id="details-locations-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-location-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_location')} --</option>
            </select>
            <button id="btn-details-add-location" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_location')}
            </button>
        </div>
    `

    const locsListEl = locationMod.querySelector('#details-locations-list')
    if (currentLocs.length === 0) {
        locsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_locations')}</span>`
    } else {
        currentLocs.forEach(l => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
            row.innerHTML = `
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                    <span class="truncate">${escapeHtml(l.getName())}</span>
                </span>
                <button class="text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            `
            row.querySelector('button').addEventListener('click', () => {
                ctx.vm.removeLocationFromSelected(l.getId())
                renderDetailsPanel(ctx)
                ctx.refreshActiveSection(type)
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })
            locsListEl.appendChild(row)
        })
    }

    const locSelect = locationMod.querySelector('#details-add-location-select')
    locSelect.innerHTML =
        `<option value="">-- ${t('details.select_location')} --</option>` +
        ctx.projectLocations
            .map(
                l => `<option value="${escapeHtml(l.getId())}">${escapeHtml(l.getName())}</option>`
            )
            .join('')

    locationMod.querySelector('#btn-details-add-location').addEventListener('click', () => {
        const selectedId = locSelect.value
        const locObj = ctx.projectLocations.find(l => l.getId() === selectedId)
        if (locObj) {
            ctx.vm.addLocationToSelected(locObj)
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(locationMod)
}

function renderCharactersModule(container, entity, type, ctx) {
    if (
        typeof entity.getCharacters !== 'function' ||
        typeof entity.addCharacter !== 'function' ||
        typeof entity.removeCharacter !== 'function'
    )
        return

    const charsMod = document.createElement('section')
    charsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentChars = entity.getCharacters() || []

    charsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                <span>${t('details.characters')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentChars.length}</span>
        </div>
        <div id="details-characters-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-char-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_character')} --</option>
            </select>
            <button id="btn-details-add-char" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_character')}
            </button>
        </div>
    `

    const charsListEl = charsMod.querySelector('#details-characters-list')
    if (currentChars.length === 0) {
        charsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_characters')}</span>`
    } else {
        currentChars.forEach(c => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
            row.innerHTML = `
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                    <span class="truncate">${escapeHtml(c.getName())}</span>
                </span>
                <button class="text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            `
            row.querySelector('button').addEventListener('click', () => {
                ctx.vm.removeCharacterFromSelected(c.getId())
                renderDetailsPanel(ctx)
                ctx.refreshActiveSection(type)
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })
            charsListEl.appendChild(row)
        })
    }

    const charSelect = charsMod.querySelector('#details-add-char-select')
    charSelect.innerHTML =
        `<option value="">-- ${t('details.select_character')} --</option>` +
        ctx.projectCharacters
            .map(
                c => `<option value="${escapeHtml(c.getId())}">${escapeHtml(c.getName())}</option>`
            )
            .join('')

    charsMod.querySelector('#btn-details-add-char').addEventListener('click', () => {
        const charId = charSelect.value
        const charObj = ctx.projectCharacters.find(c => c.getId() === charId)
        if (charObj) {
            ctx.vm.addCharacterToSelected(charObj)
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(charsMod)
}

function renderTagsModule(container, entity, type, ctx) {
    if (!entity.getTags || !entity.addTag || !entity.removeTag) return

    const tagsMod = document.createElement('section')
    tagsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentTags = entity.getTags() || []

    tagsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.tags')}</div>
        <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">${t('left_panel.no_tags')}</option>
            </select>
            <button id="btn-details-add-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_tag')}
            </button>
        </div>
    `

    const tagsListEl = tagsMod.querySelector('#details-tags-list')
    currentTags.forEach(tObj => {
        const chip = document.createElement('span')
        chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white'
        chip.style.backgroundColor = tObj.getColor() || DEFAULT_TAG_COLOR
        chip.innerHTML = `<span>#${escapeHtml(tObj.getName())}</span><button class="hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-2.5 h-2.5')}</button>`
        chip.querySelector('button').addEventListener('click', () => {
            ctx.vm.removeTagFromSelected(tObj.getId())
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        })
        tagsListEl.appendChild(chip)
    })

    const tagSelect = tagsMod.querySelector('#details-add-tag-select')
    tagSelect.innerHTML =
        `<option value="">-- ${t('details.tags')} --</option>` +
        ctx.projectTags
            .map(
                tObj =>
                    `<option value="${escapeHtml(tObj.getId())}">${escapeHtml(tObj.getName())}</option>`
            )
            .join('')

    tagsMod.querySelector('#btn-details-add-tag').addEventListener('click', () => {
        const selectedId = tagSelect.value
        const tagObj = ctx.projectTags.find(t => t.getId() === selectedId)
        if (tagObj) {
            ctx.vm.addTagToSelected(tagObj)
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(tagsMod)
}

function renderTraitsModule(container, entity, type, ctx) {
    if (!entity.getStats || !entity.addStat || !entity.removeStat) return

    const statsMod = document.createElement('section')
    statsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const statsList = entity.getStats() || []

    statsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.traits')}</div>
        <div id="details-stats-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-stat-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.traits')} --</option>
            </select>
            <button id="btn-details-add-stat" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_trait')}
            </button>
        </div>
    `

    const statsListEl = statsMod.querySelector('#details-stats-list')
    statsList.forEach(st => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0">${getIconSvg('trait', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(st.getName())}</span>
            </span>
            <button class="text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        `
        row.querySelector('button').addEventListener('click', () => {
            ctx.vm.removeStatFromSelected(st.getId())
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        })
        statsListEl.appendChild(row)
    })

    const statSelect = statsMod.querySelector('#details-add-stat-select')
    statSelect.innerHTML =
        `<option value="">-- ${t('details.traits')} --</option>` +
        ctx.projectStats
            .map(
                st =>
                    `<option value="${escapeHtml(st.getId())}">${escapeHtml(st.getName())}</option>`
            )
            .join('')

    statsMod.querySelector('#btn-details-add-stat').addEventListener('click', () => {
        const statId = statSelect.value
        const statObj = ctx.projectStats.find(s => s.getId() === statId)
        if (statObj) {
            ctx.vm.addStatToSelected(statObj)
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(statsMod)
}

function renderExitsModule(container, entity, type, ctx) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const exitsMod = document.createElement('section')
    exitsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const choices = entity.getChoices() || []

    exitsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide truncate">${t('details.paragraph_exits')}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${choices.length}</span>
            </div>
            <button id="btn-toggle-add-exit" type="button" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                <span>${t('details.add_exit')}</span>
            </button>
        </div>

        <div id="details-add-exit-form" class="hidden bg-[#18181b] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.target_node')}</label>
                <select id="details-add-exit-target" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                </select>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.choice_name')}</label>
                <input id="details-add-exit-name" type="text" placeholder="${t('details.choice_name_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.condition_text')} (${t('left_panel.condition_text_optional')})</label>
                <input id="details-add-exit-condition" type="text" placeholder="${t('details.condition_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-exit" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">${t('buttons.cancel')}</button>
                <button id="btn-submit-add-exit" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">${t('buttons.add')}</button>
            </div>
        </div>

        <div id="details-exits-list" class="space-y-2"></div>
    `

    const addExitForm = exitsMod.querySelector('#details-add-exit-form')
    const toggleAddBtn = exitsMod.querySelector('#btn-toggle-add-exit')
    const targetSelect = exitsMod.querySelector('#details-add-exit-target')
    const nameInput = exitsMod.querySelector('#details-add-exit-name')
    const condInput = exitsMod.querySelector('#details-add-exit-condition')
    const cancelBtn = exitsMod.querySelector('#btn-cancel-add-exit')
    const submitBtn = exitsMod.querySelector('#btn-submit-add-exit')

    const populateTargets = () => {
        const options = ctx.projectParagraphs
            .map(p => {
                const isSelf = p.getId() === entity.getId()
                const title = p.getTitle() || p.getId()
                return `<option value="${escapeHtml(p.getId())}">§ ${escapeHtml(title)}${isSelf ? ' (ten paragraf)' : ''}</option>`
            })
            .join('')
        targetSelect.innerHTML = options
        const otherP = ctx.projectParagraphs.find(p => p.getId() !== entity.getId())
        if (otherP) {
            targetSelect.value = otherP.getId()
        }
    }

    toggleAddBtn.addEventListener('click', () => {
        addExitForm.classList.toggle('hidden')
        if (!addExitForm.classList.contains('hidden')) {
            populateTargets()
            if (nameInput) {
                nameInput.value = ''
                nameInput.focus()
            }
            if (condInput) condInput.value = ''
        }
    })

    cancelBtn.addEventListener('click', () => {
        addExitForm.classList.add('hidden')
    })

    const handleAddExit = () => {
        const targetId = targetSelect.value
        if (!targetId) return
        const targetP = ctx.projectParagraphs.find(p => p.getId() === targetId)
        if (!targetP) return

        const choiceName = nameInput.value.trim() || t('details.default_jump_name')
        const condTextVal = condInput.value.trim()

        ctx.vm.createChoice(
            entity,
            targetP,
            choiceName,
            t('details.default_jump_name'),
            condTextVal
        )
        renderDetailsPanel(ctx)
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        toast.success(
            t('toast.connection_created', {
                from: entity.getTitle() || entity.getId(),
                to: targetP.getTitle() || targetP.getId(),
            }),
            t('toast.element_created_title')
        )
    }

    submitBtn.addEventListener('click', handleAddExit)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })
    condInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })

    const exitsListContainer = exitsMod.querySelector('#details-exits-list')

    if (choices.length === 0) {
        exitsListContainer.innerHTML = `
            <div class="text-xs text-gray-500 italic py-2 text-center bg-[#18181b]/50 rounded border border-[#27272a] border-dashed" data-i18n="details.no_exits">
                ${t('details.no_exits')}
            </div>
        `
    } else {
        choices.forEach(choice => {
            const toId = choice.getToParagraphId()
            const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
            const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
            const cond = choice.getCondition()
            const choiceCondText =
                cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

            const card = document.createElement('div')
            card.className =
                'bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded p-2.5 space-y-2 transition-colors'

            const targetOptionsHtml = ctx.projectParagraphs
                .map(p => {
                    const isSelected = p.getId() === toId
                    const title = p.getTitle() || p.getId()
                    return `<option value="${escapeHtml(p.getId())}" ${isSelected ? 'selected' : ''}>§ ${escapeHtml(title)}</option>`
                })
                .join('')

            card.innerHTML = `
                <div class="flex items-center justify-between gap-1">
                    <span class="text-xs text-emerald-400 font-medium truncate flex items-center gap-1 min-w-0" title="${escapeHtml(toTitle)}">
                        <span class="text-blue-400 shrink-0">→</span>
                        <span class="truncate">§ ${escapeHtml(toTitle)}</span>
                    </span>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" class="btn-inspect-exit p-1 text-gray-400 hover:text-blue-400 rounded cursor-pointer transition-colors" title="${t('details.open_choice_details')}">
                            ${getIconSvg('arrow-right', 'w-3 h-3')}
                        </button>
                        <button type="button" class="btn-delete-exit p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('buttons.delete')}">
                            ${getIconSvg('close', 'w-3 h-3')}
                        </button>
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.choice_name')}</label>
                    <input type="text" class="exit-name-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}" />
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.target_node')}</label>
                    <select class="exit-target-select w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                        ${targetOptionsHtml}
                    </select>
                </div>

                <div class="space-y-1">
                    <div class="flex items-center justify-between">
                        <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.condition_section')}</label>
                        <span class="text-[9px] text-amber-400 font-mono">${t('condition.type_text')}</span>
                    </div>
                    <input type="text" class="exit-condition-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choiceCondText)}" placeholder="${t('details.condition_placeholder')}" />
                </div>
            `

            const exitNameInput = card.querySelector('.exit-name-input')
            const exitTargetSelect = card.querySelector('.exit-target-select')
            const exitCondInput = card.querySelector('.exit-condition-input')
            const inspectBtn = card.querySelector('.btn-inspect-exit')
            const deleteBtn = card.querySelector('.btn-delete-exit')

            exitNameInput.addEventListener('input', () => {
                const newName = exitNameInput.value.trim()
                if (newName) {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })
            exitNameInput.addEventListener('blur', () => {
                const newName = exitNameInput.value.trim()
                if (!newName) {
                    exitNameInput.value = choice.getName()
                } else {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })

            exitTargetSelect.addEventListener('change', () => {
                const newTargetId = exitTargetSelect.value
                if (newTargetId && newTargetId !== choice.getToParagraphId()) {
                    choice.setToParagraphId(newTargetId)
                    renderDetailsPanel(ctx)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.target_updated'))
                }
            })

            exitCondInput.addEventListener('input', () => {
                ctx.vm.updateChoiceDetails(choice, choice.getName(), exitCondInput.value)
                ctx.renderConnectionsList()
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })

            inspectBtn.addEventListener('click', () => {
                ctx.selectEntity(choice, 'choice', entity)
            })

            deleteBtn.addEventListener('click', () => {
                if (
                    confirm(
                        t('context_menu.confirm_delete', {
                            name: choice.getName() || choice.getId(),
                        })
                    )
                ) {
                    ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
                    renderDetailsPanel(ctx)
                    ctx.renderConnectionsList()
                    ctx.renderParagraphsList()
                    renderHistoryBar(ctx)
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.connection_deleted'))
                }
            })

            exitsListContainer.appendChild(card)
        })
    }

    container.appendChild(exitsMod)
}

function renderQuickActionsModule(container, item, type, ctx) {
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
    `
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = item.id
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
        if (type === 'scene') {
            ctx.renderScenesList()
        }
    })
    container.appendChild(actionsMod)
}
