import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    DEFAULT_SCENE_COLOR,
    DEFAULT_TAG_COLOR,
    Paragraph,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import {
    importDroppedImage,
    pickProjectImage,
    setupElementDropZone,
} from '../../assets/assetPicker.js'
import {
    escapeHtml,
    getTypeBadgeColor,
    PRESET_COLORS,
    renderColorPresetButtonsHtml,
} from '../../common/htmlTemplates.js'
import { FANTASY_AVATARS, getAvatarById } from '../../common/npcAvatars.js'
import { markProjectDirty } from '../../project/projectStateTracker.js'
import { syncCombatToParagraphDescription } from '../combatModule.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Renders the top header module showing entity type badge and ID.
 *
 * @param {HTMLElement} container
 * @param {object} item
 */
export function renderEntityHeaderModule(container, item) {
    const typeKey = `details.type_${item.type}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : item.type.toUpperCase()

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(item.type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    )
    container.appendChild(headerMod)
}

/**
 * Renders the avatar selection module with toggleable avatar grid.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderAvatarModule(container, entity, type, ctx, onRefreshDetails) {
    if ((type !== 'character' && type !== 'template') || typeof entity.getAvatar !== 'function') {
        return
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const avatarId = entity.getAvatar() || 'warrior'
    const avatar = getAvatarById(avatarId)

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.avatar')}</span>
            <span class="text-[10px] text-gray-400 capitalize">${escapeHtml(avatar.category || '')}</span>
        </div>
        <div class="flex items-center gap-3">
            <div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border cursor-pointer hover:border-blue-400 transition-all" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border-color: ${avatar.borderColor}" title="${t('npc.drop_avatar_here') || 'Upuść grafikę, aby zmienić portret'}">
                ${avatar.svg}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(avatar.name)}</div>
                <div class="flex items-center gap-2 mt-1">
                    <button type="button" id="btn-details-toggle-avatar-grid" class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium transition-colors">
                        <span>${t('details.change_avatar')}</span>
                        ${getIconSvg('chevron-down', 'w-3 h-3')}
                    </button>
                    <span class="text-zinc-600 text-[10px]">·</span>
                    <button type="button" id="btn-details-upload-avatar" class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium transition-colors" title="${t('npc.upload_custom_avatar') || 'Wgraj własną grafikę'}">
                        ${getIconSvg('upload', 'w-3 h-3')}
                        <span>${t('npc.upload_avatar_short') || 'Wgraj'}</span>
                    </button>
                </div>
            </div>
        </div>
        <div id="details-avatar-grid" class="hidden grid grid-cols-4 gap-1.5 pt-2 border-t border-[#2d2d32]">
            ${FANTASY_AVATARS.map(
                av => `
                <button type="button" data-avatar-id="${av.id}" class="details-avatar-btn group p-1.5 rounded flex flex-col items-center gap-1 bg-[#18181b] border ${av.id === avatarId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-[#27272a] hover:border-[#3f3f46]'} cursor-pointer transition-all">
                    <div class="w-6 h-6 rounded flex items-center justify-center p-0.5" style="background-color: ${av.bgColor}; color: ${av.color}">
                        ${av.svg}
                    </div>
                    <span class="text-[9px] text-[#a1a1aa] group-hover:text-white truncate max-w-full">${escapeHtml(av.name)}</span>
                </button>
            `
            ).join('')}
        </div>
    `
    )

    const toggleBtn = avatarMod.querySelector('#btn-details-toggle-avatar-grid')
    const grid = avatarMod.querySelector('#details-avatar-grid')
    const uploadBtn = avatarMod.querySelector('#btn-details-upload-avatar')
    const avatarPreviewEl = avatarMod.querySelector('#details-avatar-preview')

    if (toggleBtn && grid) {
        toggleBtn.addEventListener('click', () => {
            grid.classList.toggle('hidden')
        })

        grid.querySelectorAll('.details-avatar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedAvatarId = btn.dataset.avatarId
                if (selectedAvatarId && entity.setAvatar) {
                    entity.setAvatar(selectedAvatarId)
                    refreshDetails()
                    ctx.refreshActiveSection(type)
                }
            })
        })
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            try {
                const res = await pickProjectImage(ctx, 'npc')
                if (res && res.relativePath && entity.setAvatar) {
                    entity.setAvatar(res.relativePath)
                    refreshDetails()
                    ctx.refreshActiveSection(type)
                    toast.success(t('npc.avatar_updated') || 'Portret został zaktualizowany')
                }
            } catch (err) {
                console.error('Error importing custom avatar in details panel:', err)
                toast.error(t('asset.error.import_failed'), t('asset.error.title'))
            }
        })
    }

    // Drag-and-drop image directly onto the details avatar preview frame
    if (avatarPreviewEl) {
        setupElementDropZone(avatarPreviewEl, {
            highlightClass: 'ring-2 ring-blue-400 bg-blue-500/20 scale-105',
            onFileDrop: async file => {
                const imported = await importDroppedImage(file, ctx, 'npc')
                if (imported && imported.relativePath && entity.setAvatar) {
                    entity.setAvatar(imported.relativePath)
                    refreshDetails()
                    ctx.refreshActiveSection(type)
                    toast.success(t('npc.avatar_updated') || 'Portret został zaktualizowany')
                }
            },
        })
    }

    container.appendChild(avatarMod)
}

/**
 * Renders the entity name module with validation and auto-save.
 *
 * @param {HTMLElement} container
 * @param {object} item
 * @param {Array<object>} entityScope
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderNameModule(container, item, entityScope, ctx, onRefreshDetails) {
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <input id="details-name-input" type="text" value="${escapeHtml(item.name)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    )
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
        renderHistoryBar(ctx, onRefreshDetails)
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

/**
 * Renders color picker module with presets and hex input.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 */
export function renderColorModule(container, entity, type, ctx) {
    if (typeof entity.getColor !== 'function' || typeof entity.setColor !== 'function') return

    const currentColor =
        entity.getColor() || (type === 'scene' ? DEFAULT_SCENE_COLOR : DEFAULT_TAG_COLOR)

    const sectionTitle =
        type === 'scene'
            ? t('details.scene_color')
            : type === 'tag'
              ? t('details.tag_color')
              : t('details.color')

    const colorMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
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
    )

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

/**
 * Renders paragraph number locking and custom number editing.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 */
export function renderParagraphNumberModule(container, entity, type, ctx) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const isLocked = Boolean(entity.getIsNumberLocked && entity.getIsNumberLocked())
    const customNum = entity.getNumber ? entity.getNumber() : 0
    const activeDispNum = entity.getDisplayNumber ? entity.getDisplayNumber() : customNum || 1

    const numMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.paragraph_number')}</span>
            <div class="flex items-center gap-1.5">
                <span id="details-number-mode-badge" class="text-[10px] font-medium px-2 py-0.5 rounded ${
                    isLocked
                        ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }">
                    ${isLocked ? `#${customNum || 1} (${t('details.custom_number')})` : `#${activeDispNum} (${t('details.auto_number')})`}
                </span>
                <button
                    type="button"
                    id="btn-details-reroll-number"
                    class="${isLocked ? 'hidden' : 'flex'} items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#24262c] hover:bg-[#2e313a] text-zinc-300 border border-[#3e424c] transition-colors cursor-pointer"
                    title="Wylosuj inny unikalny numer dla tego paragrafu"
                >
                    <span>🎲</span>
                    <span>Losuj</span>
                </button>
            </div>
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="flex items-center gap-1.5 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-number-lock" ${isLocked ? 'checked' : ''} class="rounded accent-blue-500 cursor-pointer" />
                <span>${t('details.lock_number')}</span>
            </label>
            <input id="details-custom-number" type="number" min="1" value="${isLocked && customNum ? customNum : ''}" placeholder="${activeDispNum}"
                ${!isLocked ? 'disabled' : ''}
                class="w-28 bg-[#18181b] border border-[#3f3f46] disabled:opacity-30 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
        </div>
        <div id="details-number-error" class="hidden text-[11px] text-red-400 mt-1"></div>
    `
    )

    const lockCheckbox = numMod.querySelector('#details-number-lock')
    const customNumInput = numMod.querySelector('#details-custom-number')
    const modeBadge = numMod.querySelector('#details-number-mode-badge')
    const btnReroll = numMod.querySelector('#btn-details-reroll-number')
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

    if (btnReroll) {
        btnReroll.addEventListener('click', () => {
            const newNum = ctx.vm.rerollParagraphNumber(entity, ctx.projectParagraphs)
            if (modeBadge) {
                modeBadge.textContent = `#${newNum} (${t('details.auto_number')})`
            }
            if (customNumInput) {
                customNumInput.placeholder = String(newNum)
            }
            ctx.renderParagraphsList()
        })
    }

    lockCheckbox.addEventListener('change', () => {
        const locked = lockCheckbox.checked
        customNumInput.disabled = !locked
        if (!locked) {
            ctx.vm.toggleNumberLock(false, ctx.projectParagraphs)
            ctx.vm.updateCustomNumber(0, ctx.projectParagraphs)
            customNumInput.value = ''
            validateNumber(0)
            if (btnReroll) btnReroll.classList.remove('hidden')
            const currentDisp = entity.getDisplayNumber ? entity.getDisplayNumber() : 1
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700'
                modeBadge.textContent = `#${currentDisp} (${t('details.auto_number')})`
            }
            customNumInput.placeholder = String(currentDisp)
        } else {
            const currentDisp = entity.getDisplayNumber ? entity.getDisplayNumber() : 1
            const parsed = parseInt(customNumInput.value, 10) || currentDisp || 1
            ctx.vm.toggleNumberLock(true, ctx.projectParagraphs)
            ctx.vm.updateCustomNumber(parsed, ctx.projectParagraphs)
            customNumInput.value = String(parsed)
            validateNumber(parsed)
            if (btnReroll) btnReroll.classList.add('hidden')
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
        ctx.vm.updateCustomNumber(val, ctx.projectParagraphs)
        if (modeBadge && lockCheckbox.checked) {
            modeBadge.textContent = `#${val || 1} (${t('details.custom_number')})`
        }
        ctx.renderParagraphsList()
    })

    container.appendChild(numMod)
}

/**
 * Renders paragraph narrative role toggle (e.g. End / Finale node).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefresh]
 */
export function renderParagraphRoleModule(container, entity, type, ctx, onRefresh) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return
    if (typeof entity.getIsStart === 'function' && entity.getIsStart()) return

    const isEnd = Boolean(typeof entity.getIsEnd === 'function' ? entity.getIsEnd() : entity.isEnd)

    const roleMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">Rola narracyjna</span>
            <span id="details-paragraph-role-badge" class="text-[10px] font-semibold px-2 py-0.5 rounded ${
                isEnd
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }">
                ${isEnd ? 'FINAŁ (KONIEC)' : 'Zwykły paragraf'}
            </span>
        </div>
        <div class="space-y-1.5 pt-0.5">
            <label class="flex items-center gap-2 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-paragraph-is-end" ${isEnd ? 'checked' : ''} class="rounded accent-rose-500 cursor-pointer w-4 h-4" />
                <span class="font-medium text-zinc-200">Paragraf końcowy (Finał historii)</span>
            </label>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
                Oznacza ten węzeł jako oficjalne zakończenie opowieści. Walidator grafu uznaje go za prawidłowy finał i nie zgłasza go jako ślepy zaułek.
            </p>
        </div>
    `
    )

    const checkbox = roleMod.querySelector('#details-paragraph-is-end')
    const roleBadge = roleMod.querySelector('#details-paragraph-role-badge')

    if (checkbox) {
        checkbox.addEventListener('change', () => {
            const checked = checkbox.checked
            if (typeof entity.setIsEnd === 'function') {
                entity.setIsEnd(checked)
            } else {
                entity.isEnd = checked
            }
            if (typeof markProjectDirty === 'function') {
                markProjectDirty()
            }
            if (roleBadge) {
                roleBadge.className = checked
                    ? 'text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-700/60'
                    : 'text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700'
                roleBadge.textContent = checked ? 'FINAŁ (KONIEC)' : 'Zwykły paragraf'
            }

            if (typeof ctx.renderParagraphsList === 'function') ctx.renderParagraphsList()
            if (ctx.storyGraph && typeof ctx.storyGraph.renderGraph === 'function') {
                ctx.storyGraph.renderGraph()
            }
            if (typeof onRefresh === 'function') {
                onRefresh()
            }
        })
    }

    container.appendChild(roleMod)
}

/**
 * Renders summary description editing textarea.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} ctx
 */
export function renderSummaryModule(container, entity, ctx) {
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : null
    if (!desc) return

    const currentSummary =
        (typeof desc.getSummary === 'function' ? desc.getSummary() : '') ||
        (typeof desc.getText === 'function' ? desc.getText() : '') ||
        ''

    const summaryMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.summary')}</label>
        <textarea id="details-summary-input" rows="2" placeholder="${t('details.summary_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(currentSummary)}</textarea>
    `
    )

    const summaryInput = summaryMod.querySelector('#details-summary-input')
    summaryInput.addEventListener('input', () => {
        if (typeof ctx.vm.updateSummary === 'function') {
            ctx.vm.updateSummary(summaryInput.value)
        }
        if (typeof desc.setSummary === 'function') {
            desc.setSummary(summaryInput.value)
        }
        if (typeof desc.setText === 'function') {
            desc.setText(summaryInput.value)
        }
        markProjectDirty()
        const selectedType = ctx.vm?.getSelectedItem?.()?.type
        if (selectedType && typeof ctx.refreshActiveSection === 'function') {
            ctx.refreshActiveSection(selectedType)
        }
    })

    container.appendChild(summaryMod)
}

/**
 * Renders description narrative file button.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} ctx
 */
export function renderFilesModule(container, entity, ctx) {
    if (!entity.getContent && !entity.getDescription) return

    const filesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.description_file')}</div>
        <div class="flex flex-col gap-1.5">
            <button id="btn-open-player-text" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${t('details.open_description_file')}</span>
                </span>
                <span class="text-blue-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `
    )

    filesMod.querySelector('#btn-open-player-text').addEventListener('click', () => {
        if (entity && typeof entity.getHasCombat === 'function' && entity.getHasCombat()) {
            syncCombatToParagraphDescription(entity, ctx)
        }
        const { fileName, content } = ctx.vm.openOrCreateDescriptionFile()
        if (fileName) {
            ctx.files[fileName] = content
            ctx.updateMainWorkspaceUI()
            toast.success(`${t('details.open_description_file')}: ${t('details.file_created')}`)
        }
    })

    container.appendChild(filesMod)
}
