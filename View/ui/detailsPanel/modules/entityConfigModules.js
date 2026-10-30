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
 * @param {object} item
 * @returns {string} HTML string
 */
export function renderEntityHeaderModuleHtml(item) {
    const typeKey = `details.type_${item?.type || ''}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : (item?.type || '').toUpperCase()
    const badgeColor = getTypeBadgeColor(item?.type || '')
    const safeTypeLabel = escapeHtml(typeLabel)
    const safeId = escapeHtml(String(item?.id ?? ''))

    return `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${escapeHtml(t('details.type'))}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${badgeColor} font-medium">${safeTypeLabel}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${safeId}</div>
    `
}

/**
 * Renders the top header module showing entity type badge and ID in details panel.
 *
 * @param {HTMLElement | null} container
 * @param {object} item
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderEntityHeaderModule(container, item) {
    if (!container || !item) return null

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderEntityHeaderModuleHtml(item)
    )
    container.appendChild(headerMod)
    return headerMod
}

/**
 * Renders the avatar preview box HTML.
 *
 * @param {object} avatar
 * @returns {string} HTML string
 */
export function renderAvatarPreviewHtml(avatar) {
    const dropTitle = escapeHtml(t('npc.drop_avatar_here'))
    const bgColor = escapeHtml(avatar?.bgColor || '#18181b')
    const color = escapeHtml(avatar?.color || '#ffffff')
    const borderColor = escapeHtml(avatar?.borderColor || '#27272a')
    const svgContent = avatar?.svg || ''

    return `
        <div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border cursor-pointer hover:border-blue-400 transition-all" style="background-color: ${bgColor}; color: ${color}; border-color: ${borderColor}" title="${dropTitle}">
            ${svgContent}
        </div>`
}

/**
 * Renders a single avatar button in the avatar grid.
 *
 * @param {object} av
 * @param {string} [currentAvatarId='']
 * @returns {string} HTML string
 */
export function renderAvatarGridItemHtml(av, currentAvatarId = '') {
    const isSelected = av?.id === currentAvatarId
    const borderClasses = isSelected
        ? 'border-blue-500 ring-1 ring-blue-500'
        : 'border-[#27272a] hover:border-[#3f3f46]'
    const safeName = escapeHtml(av?.name || '')
    const safeBg = escapeHtml(av?.bgColor || '#18181b')
    const safeColor = escapeHtml(av?.color || '#ffffff')

    return `
        <button type="button" data-avatar-id="${escapeHtml(av?.id || '')}" class="details-avatar-btn group p-1.5 rounded flex flex-col items-center gap-1 bg-[#18181b] border ${borderClasses} cursor-pointer transition-all">
            <div class="w-6 h-6 rounded flex items-center justify-center p-0.5" style="background-color: ${safeBg}; color: ${safeColor}">
                ${av?.svg || ''}
            </div>
            <span class="text-[9px] text-[#a1a1aa] group-hover:text-white truncate max-w-full">${safeName}</span>
        </button>`
}

/**
 * Renders the full avatar grid HTML.
 *
 * @param {Array<object>} [avatars=FANTASY_AVATARS]
 * @param {string} [currentAvatarId='']
 * @returns {string} HTML string
 */
export function renderAvatarGridHtml(avatars = FANTASY_AVATARS, currentAvatarId = '') {
    const list = Array.isArray(avatars) ? avatars : []
    return list.map(av => renderAvatarGridItemHtml(av, currentAvatarId)).join('')
}

/**
 * Renders the full inner HTML for the avatar module.
 *
 * @param {object} avatar
 * @param {string} avatarId
 * @param {Array<object>} [avatars=FANTASY_AVATARS]
 * @returns {string} HTML string
 */
export function renderAvatarModuleHtml(avatar, avatarId, avatars = FANTASY_AVATARS) {
    const avatarTitle = escapeHtml(t('details.avatar'))
    const category = escapeHtml(avatar?.category || '')
    const avatarName = escapeHtml(avatar?.name || '')
    const changeAvatarLabel = escapeHtml(t('details.change_avatar'))
    const uploadTitle = escapeHtml(t('npc.upload_custom_avatar'))
    const uploadLabel = escapeHtml(t('npc.upload_avatar_short'))

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${avatarTitle}</span>
            <span class="text-[10px] text-gray-400 capitalize">${category}</span>
        </div>
        <div class="flex items-center gap-3">
            ${renderAvatarPreviewHtml(avatar)}
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${avatarName}</div>
                <div class="flex items-center gap-2 mt-1">
                    <button type="button" id="btn-details-toggle-avatar-grid" class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium transition-colors">
                        <span>${changeAvatarLabel}</span>
                        ${getIconSvg('chevron-down', 'w-3 h-3')}
                    </button>
                    <span class="text-zinc-600 text-[10px]">·</span>
                    <button type="button" id="btn-details-upload-avatar" class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium transition-colors" title="${uploadTitle}">
                        ${getIconSvg('upload', 'w-3 h-3')}
                        <span>${uploadLabel}</span>
                    </button>
                </div>
            </div>
        </div>
        <div id="details-avatar-grid" class="hidden grid grid-cols-4 gap-1.5 pt-2 border-t border-[#2d2d32]">
            ${renderAvatarGridHtml(avatars, avatarId)}
        </div>
    `
}

/**
 * Renders the avatar selection module with toggleable avatar grid.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderAvatarModule(container, entity, type, ctx = {}, onRefreshDetails = null) {
    if (!container || !entity) return null
    if ((type !== 'character' && type !== 'template') || typeof entity.getAvatar !== 'function') {
        return null
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const avatarId = entity.getAvatar() || 'warrior'
    const avatar = getAvatarById(avatarId)

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderAvatarModuleHtml(avatar, avatarId, FANTASY_AVATARS)
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
                const selectedAvatarId = btn.getAttribute('data-avatar-id')
                if (selectedAvatarId && typeof entity.setAvatar === 'function') {
                    entity.setAvatar(selectedAvatarId)
                    refreshDetails()
                    ctx?.refreshActiveSection?.(type)
                }
            })
        })
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            try {
                const res = await pickProjectImage(ctx, 'npc')
                if (res && res.relativePath && typeof entity.setAvatar === 'function') {
                    entity.setAvatar(res.relativePath)
                    refreshDetails()
                    ctx?.refreshActiveSection?.(type)
                    toast.success(t('npc.avatar_updated'))
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
                if (imported && imported.relativePath && typeof entity.setAvatar === 'function') {
                    entity.setAvatar(imported.relativePath)
                    refreshDetails()
                    ctx?.refreshActiveSection?.(type)
                    toast.success(t('npc.avatar_updated'))
                }
            },
        })
    }

    container.appendChild(avatarMod)
    return avatarMod
}

/**
 * Renders the name module HTML.
 *
 * @param {string} [name='']
 * @param {string} [error='']
 * @param {boolean} [hasError=false]
 * @returns {string} HTML string
 */
export function renderNameModuleHtml(name = '', error = '', hasError = false) {
    const labelText = escapeHtml(t('details.name'))
    const safeName = escapeHtml(name ?? '')
    const safeError = escapeHtml(error ?? '')
    const borderClass = hasError ? 'border-red-500' : 'border-[#3f3f46]'
    const errorHiddenClass = hasError ? '' : 'hidden'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${labelText}</label>
        <input id="details-name-input" type="text" value="${safeName}" aria-label="${labelText}"
            class="w-full bg-[#18181b] border ${borderClass} rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-name-error" class="${errorHiddenClass} text-[11px] text-red-400">${safeError}</div>
    `
}

/**
 * Renders the entity name module with validation and auto-save.
 *
 * @param {HTMLElement | null} container
 * @param {object} item
 * @param {Array<object>} [entityScope=[]]
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderNameModule(
    container,
    item,
    entityScope = [],
    ctx = {},
    onRefreshDetails = null
) {
    if (!container || !item) return null

    const initialName = item.name || ''
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderNameModuleHtml(initialName)
    )
    const nameInput = nameMod.querySelector('#details-name-input')
    const nameError = nameMod.querySelector('#details-name-error')

    const validateAndSaveName = () => {
        if (!nameInput) return false
        const val = nameInput.value.trim()
        const res = ctx?.vm?.validateName
            ? ctx.vm.validateName(val, item, entityScope)
            : { valid: Boolean(val), message: val ? '' : t('details.name_required') }

        if (!res.valid) {
            if (nameError) {
                nameError.textContent = res.message || t('details.name_required')
                nameError.classList.remove('hidden')
            }
            nameInput.classList.add('border-red-500')
            return false
        }
        if (nameError) nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        if (typeof ctx?.vm?.updateName === 'function') {
            ctx.vm.updateName(val, entityScope, ctx)
        } else if (item) {
            item.name = val
        }
        if (typeof renderHistoryBar === 'function') {
            renderHistoryBar(ctx, onRefreshDetails)
        }
        ctx?.refreshActiveSection?.(item.type)
        if (typeof markProjectDirty === 'function') {
            markProjectDirty()
        }
        return true
    }

    nameInput?.addEventListener('input', () => {
        const val = nameInput.value.trim()
        const res = ctx?.vm?.validateName
            ? ctx.vm.validateName(val, item, entityScope)
            : { valid: Boolean(val), message: val ? '' : t('details.name_required') }

        if (!res.valid) {
            if (nameError) {
                nameError.textContent = res.message || t('details.name_required')
                nameError.classList.remove('hidden')
            }
            nameInput.classList.add('border-red-500')
        } else {
            if (nameError) nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })

    nameInput?.addEventListener('blur', validateAndSaveName)
    nameInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (validateAndSaveName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)
    return nameMod
}

/**
 * Renders the color module HTML.
 *
 * @param {string} currentColor
 * @param {string} sectionTitle
 * @param {Array<string>} [presetColors=PRESET_COLORS]
 * @returns {string} HTML string
 */
export function renderColorModuleHtml(currentColor, sectionTitle, presetColors = PRESET_COLORS) {
    const safeTitle = escapeHtml(sectionTitle)
    const safeColor = escapeHtml(currentColor)
    const customColorLabel = escapeHtml(t('details.custom_color'))

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${safeTitle}</span>
            <div class="flex items-center gap-1.5">
                <span id="details-color-preview" class="w-3.5 h-3.5 rounded border border-white/20 shadow-sm shrink-0" style="background-color: ${safeColor}"></span>
                <span id="details-color-hex" class="text-[10px] font-mono text-gray-400 uppercase">${safeColor}</span>
            </div>
        </div>
        <div class="grid grid-cols-6 gap-1.5 pt-0.5">
            ${renderColorPresetButtonsHtml(presetColors, currentColor)}
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="text-[11px] text-gray-400 shrink-0">${customColorLabel}:</label>
            <input type="color" id="details-color-picker" value="${safeColor}" aria-label="${customColorLabel}" class="w-7 h-6 p-0 border border-[#3f3f46] rounded bg-transparent cursor-pointer shrink-0" />
            <input type="text" id="details-color-hex-input" value="${safeColor}" aria-label="${customColorLabel}" class="w-24 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-0.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-blue-500" />
        </div>
    `
}

/**
 * Renders color picker module with presets and hex input.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderColorModule(container, entity, type, ctx = {}) {
    if (!container || !entity) return null
    if (typeof entity.getColor !== 'function' || typeof entity.setColor !== 'function') return null

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
        renderColorModuleHtml(currentColor, sectionTitle, PRESET_COLORS)
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
            const btnColor = btn.getAttribute('data-color') || ''
            const isMatching = btnColor.toLowerCase() === newColor.toLowerCase()
            btn.classList.toggle('border-white', isMatching)
            btn.classList.toggle('ring-2', isMatching)
            btn.classList.toggle('ring-white/50', isMatching)
            btn.classList.toggle('scale-105', isMatching)
            btn.classList.toggle('border-white/15', !isMatching)
        })

        if (type === 'scene') {
            if (typeof ctx?.renderScenesList === 'function') ctx.renderScenesList()
            if (ctx?.storyGraphInstance) {
                if (typeof ctx.storyGraphInstance.updateParagraphNodeColors === 'function') {
                    ctx.storyGraphInstance.updateParagraphNodeColors(
                        ctx.projectParagraphs,
                        ctx.projectScenes
                    )
                }
                if (typeof ctx.storyGraphInstance.updateSceneNodeBadges === 'function') {
                    ctx.storyGraphInstance.updateSceneNodeBadges(ctx.projectScenes)
                }
                const sceneEl = document.querySelector(
                    `scene-node[data-scene-id="${entity.getId ? entity.getId() : entity.id}"]`
                )
                if (sceneEl) {
                    sceneEl.themeColor = newColor
                }
            }
        } else {
            if (typeof ctx?.renderTagsList === 'function') ctx.renderTagsList()
            if (typeof ctx?.renderFilterTags === 'function') ctx.renderFilterTags()
            if (typeof ctx?.renderParagraphsList === 'function') ctx.renderParagraphsList()
            if (ctx?.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
                ctx.storyGraphInstance.render(true)
            }
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const btnColor = btn.getAttribute('data-color')
            if (btnColor) applyColor(btnColor)
        })
    })

    colorPicker?.addEventListener('input', e => applyColor(e?.target?.value))

    hexInput?.addEventListener('change', () => {
        let val = hexInput.value.trim()
        if (!val.startsWith('#')) val = '#' + val
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
            applyColor(val)
        } else {
            hexInput.value = (entity.getColor() || '').toUpperCase()
        }
    })

    container.appendChild(colorMod)
    return colorMod
}

/**
 * Renders the paragraph number module inner HTML.
 *
 * @param {boolean} [isLocked=false]
 * @param {number} [customNum=0]
 * @param {number} [activeDispNum=1]
 * @returns {string} HTML string
 */
export function renderParagraphNumberModuleHtml(
    isLocked = false,
    customNum = 0,
    activeDispNum = 1
) {
    const title = escapeHtml(t('details.paragraph_number'))
    const customNumLabel = escapeHtml(t('details.custom_number'))
    const autoNumLabel = escapeHtml(t('details.auto_number'))
    const lockLabel = escapeHtml(t('details.lock_number'))

    const badgeClass = isLocked
        ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
    const badgeText = isLocked
        ? `#${customNum || 1} (${customNumLabel})`
        : `#${activeDispNum} (${autoNumLabel})`

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${title}</span>
            <span id="details-number-mode-badge" class="text-[10px] font-medium px-2 py-0.5 rounded ${badgeClass}">
                ${badgeText}
            </span>
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="flex items-center gap-1.5 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-number-lock" ${isLocked ? 'checked' : ''} class="rounded accent-blue-500 cursor-pointer" />
                <span>${lockLabel}</span>
            </label>
            <input id="details-custom-number" type="number" min="1" value="${isLocked && customNum ? customNum : ''}" placeholder="${activeDispNum}"
                ${!isLocked ? 'disabled' : ''}
                class="w-28 bg-[#18181b] border border-[#3f3f46] disabled:opacity-30 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
        </div>
        <div id="details-number-error" class="hidden text-[11px] text-red-400 mt-1"></div>
    `
}

/**
 * Renders paragraph number locking and custom number editing.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderParagraphNumberModule(container, entity, type, ctx = {}) {
    if (
        !container ||
        type !== 'paragraph' ||
        !entity ||
        (typeof entity.getNumber !== 'function' && !(entity instanceof Paragraph))
    ) {
        return null
    }

    const isLocked = Boolean(entity.getIsNumberLocked && entity.getIsNumberLocked())
    const customNum = entity.getNumber ? entity.getNumber() : 0
    const activeDispNum = entity.getDisplayNumber ? entity.getDisplayNumber() : customNum || 1

    const numMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderParagraphNumberModuleHtml(isLocked, customNum, activeDispNum)
    )

    const lockCheckbox = numMod.querySelector('#details-number-lock')
    const customNumInput = numMod.querySelector('#details-custom-number')
    const modeBadge = numMod.querySelector('#details-number-mode-badge')
    const numberError = numMod.querySelector('#details-number-error')

    const validateNumber = val => {
        if (!lockCheckbox || !lockCheckbox.checked || !val) {
            if (numberError) numberError.classList.add('hidden')
            if (customNumInput) customNumInput.classList.remove('border-red-500')
            return true
        }
        const res = ctx?.vm?.validateParagraphNumber
            ? ctx.vm.validateParagraphNumber(val, entity.getId(), ctx?.projectParagraphs || [])
            : { valid: true }

        if (!res.valid) {
            if (numberError) {
                numberError.textContent = res.message || t('details.number_taken')
                numberError.classList.remove('hidden')
            }
            if (customNumInput) customNumInput.classList.add('border-red-500')
            return false
        }
        if (numberError) numberError.classList.add('hidden')
        if (customNumInput) customNumInput.classList.remove('border-red-500')
        return true
    }

    if (isLocked && customNum) {
        validateNumber(customNum)
    }

    lockCheckbox?.addEventListener('change', () => {
        const locked = lockCheckbox.checked
        if (customNumInput) customNumInput.disabled = !locked
        if (!locked) {
            if (typeof ctx?.vm?.toggleNumberLock === 'function') {
                ctx.vm.toggleNumberLock(false, ctx?.projectParagraphs || [])
            }
            if (typeof ctx?.vm?.updateCustomNumber === 'function') {
                ctx.vm.updateCustomNumber(0, ctx?.projectParagraphs || [])
            }
            if (customNumInput) customNumInput.value = ''
            validateNumber(0)
            const currentDisp = entity.getDisplayNumber ? entity.getDisplayNumber() : 1
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700'
                modeBadge.textContent = `#${currentDisp} (${t('details.auto_number')})`
            }
            if (customNumInput) customNumInput.placeholder = String(currentDisp)
        } else {
            const currentDisp = entity.getDisplayNumber ? entity.getDisplayNumber() : 1
            const parsed = parseInt(customNumInput?.value, 10) || currentDisp || 1
            if (typeof ctx?.vm?.toggleNumberLock === 'function') {
                ctx.vm.toggleNumberLock(true, ctx?.projectParagraphs || [])
            }
            if (typeof ctx?.vm?.updateCustomNumber === 'function') {
                ctx.vm.updateCustomNumber(parsed, ctx?.projectParagraphs || [])
            }
            if (customNumInput) customNumInput.value = String(parsed)
            validateNumber(parsed)
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50'
                modeBadge.textContent = `#${parsed} (${t('details.custom_number')})`
            }
        }
        if (typeof ctx?.renderParagraphsList === 'function') ctx.renderParagraphsList()
    })

    customNumInput?.addEventListener('input', () => {
        const val = parseInt(customNumInput.value, 10) || 0
        validateNumber(val)
        if (typeof ctx?.vm?.updateCustomNumber === 'function') {
            ctx.vm.updateCustomNumber(val, ctx?.projectParagraphs || [])
        }
        if (modeBadge && lockCheckbox?.checked) {
            modeBadge.textContent = `#${val || 1} (${t('details.custom_number')})`
        }
        if (typeof ctx?.renderParagraphsList === 'function') ctx.renderParagraphsList()
    })

    container.appendChild(numMod)
    return numMod
}

/**
 * Renders paragraph narrative role toggle HTML.
 *
 * @param {boolean} [isEnd=false]
 * @returns {string} HTML string
 */
export function renderParagraphRoleModuleHtml(isEnd = false) {
    const title = escapeHtml(t('details.narrative_role'))
    const roleFinale = escapeHtml(t('details.role_finale'))
    const roleRegular = escapeHtml(t('details.role_regular'))
    const checkboxLabel = escapeHtml(t('details.end_paragraph_checkbox'))
    const hintText = escapeHtml(t('details.end_paragraph_hint'))

    const badgeClass = isEnd
        ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    const badgeText = isEnd ? roleFinale : roleRegular

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${title}</span>
            <span id="details-paragraph-role-badge" class="text-[10px] font-semibold px-2 py-0.5 rounded ${badgeClass}">
                ${badgeText}
            </span>
        </div>
        <div class="space-y-1.5 pt-0.5">
            <label class="flex items-center gap-2 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-paragraph-is-end" ${isEnd ? 'checked' : ''} class="rounded accent-rose-500 cursor-pointer w-4 h-4" />
                <span class="font-medium text-zinc-200">${checkboxLabel}</span>
            </label>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
                ${hintText}
            </p>
        </div>
    `
}

/**
 * Renders paragraph narrative role toggle (e.g. End / Finale node).
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefresh]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderParagraphRoleModule(container, entity, type, ctx = {}, onRefresh = null) {
    if (!container || type !== 'paragraph' || !entity) return null
    if (typeof entity.getIsEnd !== 'function' && !(entity instanceof Paragraph)) return null
    if (typeof entity.getIsStart === 'function' && entity.getIsStart()) return null

    const isEnd = Boolean(typeof entity.getIsEnd === 'function' ? entity.getIsEnd() : entity.isEnd)

    const roleMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderParagraphRoleModuleHtml(isEnd)
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
                roleBadge.textContent = checked
                    ? t('details.role_finale')
                    : t('details.role_regular')
            }

            if (typeof ctx?.renderParagraphsList === 'function') ctx.renderParagraphsList()
            if (ctx?.storyGraph && typeof ctx.storyGraph.renderGraph === 'function') {
                ctx.storyGraph.renderGraph()
            }
            if (typeof onRefresh === 'function') {
                onRefresh()
            }
        })
    }

    container.appendChild(roleMod)
    return roleMod
}

/**
 * Renders summary description editing textarea HTML.
 *
 * @param {string} [currentSummary='']
 * @returns {string} HTML string
 */
export function renderSummaryModuleHtml(currentSummary = '') {
    const label = escapeHtml(t('details.summary'))
    const placeholder = escapeHtml(t('details.summary_placeholder'))
    const safeSummary = escapeHtml(currentSummary ?? '')

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${label}</label>
        <textarea id="details-summary-input" rows="2" placeholder="${placeholder}" aria-label="${label}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${safeSummary}</textarea>
    `
}

/**
 * Renders summary description editing textarea in details panel.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {object} [ctx={}]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderSummaryModule(container, entity, ctx = {}) {
    if (!container || !entity) return null
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : null
    if (!desc) return null

    const currentSummary =
        (typeof desc.getSummary === 'function' ? desc.getSummary() : '') ||
        (typeof desc.getText === 'function' ? desc.getText() : '') ||
        ''

    const summaryMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderSummaryModuleHtml(currentSummary)
    )

    const summaryInput = summaryMod.querySelector('#details-summary-input')
    summaryInput?.addEventListener('input', () => {
        const val = summaryInput.value
        if (typeof ctx?.vm?.updateSummary === 'function') {
            ctx.vm.updateSummary(val)
        }
        if (typeof desc.setSummary === 'function') {
            desc.setSummary(val)
        }
        if (typeof desc.setText === 'function') {
            desc.setText(val)
        }
        if (typeof markProjectDirty === 'function') {
            markProjectDirty()
        }
        const selectedType = ctx?.vm?.getSelectedItem?.()?.type
        if (selectedType && typeof ctx?.refreshActiveSection === 'function') {
            ctx.refreshActiveSection(selectedType)
        }
    })

    container.appendChild(summaryMod)
    return summaryMod
}

/**
 * Renders description narrative file button HTML.
 *
 * @returns {string} HTML string
 */
export function renderFilesModuleHtml() {
    const title = escapeHtml(t('details.description_file'))
    const buttonText = escapeHtml(t('details.open_description_file'))

    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${title}</div>
        <div class="flex flex-col gap-1.5">
            <button id="btn-open-player-text" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${buttonText}</span>
                </span>
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `
}

/**
 * Renders description narrative file button in details panel.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {object} [ctx={}]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderFilesModule(container, entity, ctx = {}) {
    if (!container || !entity) return null
    if (typeof entity.getContent !== 'function' && typeof entity.getDescription !== 'function') {
        return null
    }

    const filesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderFilesModuleHtml()
    )

    const btnOpen = filesMod.querySelector('#btn-open-player-text')
    btnOpen?.addEventListener('click', () => {
        if (entity && typeof entity.getHasCombat === 'function' && entity.getHasCombat()) {
            syncCombatToParagraphDescription(entity, ctx)
        }
        if (typeof ctx?.vm?.openOrCreateDescriptionFile === 'function') {
            const { fileName, content } = ctx.vm.openOrCreateDescriptionFile()
            if (fileName && ctx.files) {
                ctx.files[fileName] = content
                if (typeof ctx.updateMainWorkspaceUI === 'function') {
                    ctx.updateMainWorkspaceUI()
                }
                toast.success(`${t('details.open_description_file')}: ${t('details.file_created')}`)
            }
        }
    })

    container.appendChild(filesMod)
    return filesMod
}
