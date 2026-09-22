/**
 * NPC Creation Floating Window Controller
 * Handles opening, closing, dragging interactions, avatar selection,
 * name input, and expandable narrative description drawer.
 */

import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { FANTASY_AVATARS, getAvatarById } from './npcAvatars.js'

let activeModal = null
let activeCtx = null
let hasBeenPositioned = false
let currentAvatarId = 'warrior'
let isDrawerOpen = false
let globalKeydownHandler = null
let globalOutsideClickHandler = null

/**
 * Clamps floating window position within the current viewport boundaries.
 *
 * @param {HTMLElement} modal
 */
function clampModalPosition(modal) {
    if (!modal) return
    const currentLeft = parseInt(modal.style.left, 10) || modal.offsetLeft || 0
    const currentTop = parseInt(modal.style.top, 10) || modal.offsetTop || 0

    const minLeft = 10
    const maxLeft = Math.max(minLeft, window.innerWidth - modal.offsetWidth - 10)
    const minTop = 10
    const maxTop = Math.max(minTop, window.innerHeight - modal.offsetHeight - 10)

    const clampedLeft = Math.min(Math.max(currentLeft, minLeft), maxLeft)
    const clampedTop = Math.min(Math.max(currentTop, minTop), maxTop)

    modal.style.left = `${clampedLeft}px`
    modal.style.top = `${clampedTop}px`
    modal.style.right = 'auto'
    modal.style.bottom = 'auto'
}

/**
 * Initializes draggable behavior on the floating window title bar.
 *
 * @param {HTMLElement} modal The floating window element
 * @param {HTMLElement} header The draggable header element
 */
function initDraggable(modal, header) {
    if (!modal || !header) return

    let isDragging = false
    let startX = 0
    let startY = 0
    let initialLeft = 0
    let initialTop = 0

    header.addEventListener('mousedown', e => {
        // Ignore right clicks or clicks on interactive child buttons (e.g. close button)
        if (e.button !== 0 || e.target.closest('#btn-close-npc-modal')) return

        isDragging = true
        startX = e.clientX
        startY = e.clientY

        const rect = modal.getBoundingClientRect()
        initialLeft = rect.left
        initialTop = rect.top

        document.body.style.userSelect = 'none'
        header.classList.add('cursor-grabbing')

        function onMouseMove(moveEvent) {
            if (!isDragging) return
            moveEvent.preventDefault()

            const deltaX = moveEvent.clientX - startX
            const deltaY = moveEvent.clientY - startY

            let newLeft = initialLeft + deltaX
            let newTop = initialTop + deltaY

            // Constrain within viewport boundaries
            const minLeft = 10
            const maxLeft = Math.max(minLeft, window.innerWidth - modal.offsetWidth - 10)
            const minTop = 10
            const maxTop = Math.max(minTop, window.innerHeight - modal.offsetHeight - 10)

            newLeft = Math.min(Math.max(newLeft, minLeft), maxLeft)
            newTop = Math.min(Math.max(newTop, minTop), maxTop)

            modal.style.left = `${newLeft}px`
            modal.style.top = `${newTop}px`
            modal.style.right = 'auto'
            modal.style.bottom = 'auto'
        }

        function onMouseUp() {
            isDragging = false
            document.body.style.userSelect = ''
            header.classList.remove('cursor-grabbing')
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    })
}

/**
 * Updates the preview trigger icon with the given avatar.
 *
 * @param {string} avatarId
 */
export function updateSelectedAvatarPreview(avatarId) {
    const avatar = getAvatarById(avatarId)
    currentAvatarId = avatar.id

    const previewContainer = document.getElementById('npc-selected-avatar-preview')
    const triggerBtn = document.getElementById('btn-npc-avatar-trigger')

    if (previewContainer) {
        previewContainer.innerHTML = avatar.svg
        previewContainer.style.color = avatar.color
    }

    if (triggerBtn) {
        triggerBtn.style.backgroundColor = avatar.bgColor
        triggerBtn.style.borderColor = avatar.borderColor
        triggerBtn.setAttribute('title', `${avatar.name} (${avatar.category})`)
    }

    // Update active highlight in avatar picker grid if rendered
    const grid = document.getElementById('npc-avatar-grid')
    if (grid) {
        grid.querySelectorAll('[data-avatar-id]').forEach(card => {
            const isSelected = card.dataset.avatarId === avatar.id
            card.classList.toggle('ring-2', isSelected)
            card.classList.toggle('ring-blue-400', isSelected)
            card.classList.toggle('bg-[#27272a]', isSelected)
        })
    }
}

/**
 * Populates the avatar selection grid with fantasy class archetypes.
 */
function initAvatarGrid() {
    const grid = document.getElementById('npc-avatar-grid')
    const popover = document.getElementById('npc-avatar-picker-popover')
    const triggerBtn = document.getElementById('btn-npc-avatar-trigger')

    if (!grid) return

    grid.innerHTML = FANTASY_AVATARS.map(
        avatar => `
        <button
            type="button"
            data-avatar-id="${avatar.id}"
            title="${avatar.name}"
            class="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[#2d2d32] hover:border-blue-500/60 bg-[#1f1f23] hover:bg-[#27272a] transition-all cursor-pointer group select-none text-center"
        >
            <div class="w-8 h-8 rounded-md p-1.5 flex items-center justify-center transition-transform group-hover:scale-110" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border: 1px solid ${avatar.borderColor}">
                ${avatar.svg}
            </div>
            <span class="text-[10px] font-medium text-gray-300 group-hover:text-white truncate max-w-full">
                ${avatar.name}
            </span>
        </button>
    `
    ).join('')

    grid.querySelectorAll('[data-avatar-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const avatarId = btn.dataset.avatarId
            if (avatarId) {
                updateSelectedAvatarPreview(avatarId)
            }
            if (popover) {
                popover.classList.add('hidden')
            }
        })
    })

    if (triggerBtn && popover) {
        triggerBtn.addEventListener('click', e => {
            e.stopPropagation()
            popover.classList.toggle('hidden')
        })
    }

    // Set initial preview
    updateSelectedAvatarPreview(currentAvatarId)
}

/**
 * Toggles or explicitly sets the expansion state of the narrative description side drawer.
 *
 * @param {boolean} [forceState]
 */
export function toggleDescriptionDrawer(forceState) {
    const modal = activeModal || document.getElementById('npc-create-modal')
    const drawer = document.getElementById('npc-description-drawer')
    const arrow = document.getElementById('npc-desc-toggle-arrow')
    const btnToggle = document.getElementById('btn-toggle-npc-description')

    if (!drawer) return

    if (typeof forceState === 'boolean') {
        isDrawerOpen = forceState
    } else {
        isDrawerOpen = drawer.classList.contains('hidden')
    }

    if (isDrawerOpen) {
        drawer.classList.remove('hidden')
        if (arrow) arrow.textContent = '‹'
        if (btnToggle) {
            btnToggle.setAttribute('title', 'Zwiń panel opisu narracyjnego')
        }
        // Auto clamp position so expanding drawer doesn't push window off-screen
        if (modal) {
            clampModalPosition(modal)
        }
    } else {
        drawer.classList.add('hidden')
        if (arrow) arrow.textContent = '›'
        if (btnToggle) {
            btnToggle.setAttribute('title', 'Rozwiń panel opisu narracyjnego')
        }
    }
}

/**
 * Opens the NPC creation floating window.
 */
export function openNpcModal() {
    const modal = activeModal || document.getElementById('npc-create-modal')
    if (!modal) return

    modal.classList.remove('hidden')

    // Initial position on first open (centered within viewport)
    if (!hasBeenPositioned) {
        const modalWidth = modal.offsetWidth || 520
        const modalHeight = modal.offsetHeight || 380
        const defaultLeft = Math.max(20, Math.floor((window.innerWidth - modalWidth) / 2))
        const defaultTop = Math.max(60, Math.floor((window.innerHeight - modalHeight) / 3))

        modal.style.left = `${defaultLeft}px`
        modal.style.top = `${defaultTop}px`
        modal.style.right = 'auto'
        modal.style.bottom = 'auto'
        hasBeenPositioned = true
    } else {
        clampModalPosition(modal)
    }

    // Set focus on name input or first interactive element
    const nameInput = document.getElementById('npc-name-input')
    if (nameInput && typeof nameInput.focus === 'function') {
        nameInput.focus()
    }
}

/**
 * Closes the NPC creation floating window.
 */
export function closeNpcModal() {
    const modal = activeModal || document.getElementById('npc-create-modal')
    if (!modal) return

    // Also close avatar popover if open
    const popover = document.getElementById('npc-avatar-picker-popover')
    if (popover) {
        popover.classList.add('hidden')
    }

    modal.classList.add('hidden')
}

/**
 * Returns current selected avatar ID.
 *
 * @returns {string}
 */
export function getSelectedAvatarId() {
    return currentAvatarId
}

/**
 * Sets avatar by ID and refreshes preview.
 *
 * @param {string} id
 */
export function setSelectedAvatarId(id) {
    updateSelectedAvatarPreview(id)
}

/**
 * Returns NPC name from the input field.
 *
 * @returns {string}
 */
export function getNpcName() {
    const input = document.getElementById('npc-name-input')
    return input ? input.value.trim() : ''
}

/**
 * Sets NPC name in the input field.
 *
 * @param {string} name
 */
export function setNpcName(name) {
    const input = document.getElementById('npc-name-input')
    if (input) {
        input.value = name || ''
    }
}

/**
 * Returns narrative description text.
 *
 * @returns {string}
 */
export function getNpcDescription() {
    const textarea = document.getElementById('npc-description-textarea')
    return textarea ? textarea.value : ''
}

/**
 * Sets narrative description text.
 *
 * @param {string} text
 */
export function setNpcDescription(text) {
    const textarea = document.getElementById('npc-description-textarea')
    if (textarea) {
        textarea.value = text || ''
    }
}

/**
 * Checks whether the description drawer is currently open.
 *
 * @returns {boolean}
 */
export function isDescriptionDrawerOpen() {
    const drawer = document.getElementById('npc-description-drawer')
    return drawer ? !drawer.classList.contains('hidden') : false
}

/**
 * Returns NPC short summary text.
 *
 * @returns {string}
 */
export function getNpcSummary() {
    const textarea = document.getElementById('npc-summary-input')
    return textarea ? textarea.value.trim() : ''
}

/**
 * Sets NPC short summary text.
 *
 * @param {string} summary
 */
export function setNpcSummary(summary) {
    const textarea = document.getElementById('npc-summary-input')
    if (textarea) {
        textarea.value = summary || ''
    }
}

let customAttributes = []

function escapeAttr(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/**
 * Renders the custom attributes list.
 */
export function renderCustomAttributes() {
    const listContainer = document.getElementById('npc-custom-attributes-list')
    const emptyNotice = document.getElementById('npc-custom-attributes-empty')

    if (!listContainer) return

    if (customAttributes.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    listContainer.innerHTML = customAttributes
        .map(
            attr => `
        <div class="npc-attribute-row flex items-center gap-2 group" data-attr-id="${attr.id}">
            <input
                type="text"
                data-attr-field="name"
                value="${escapeAttr(attr.name)}"
                placeholder="Nazwa (np. Rasa)"
                class="w-1/3 min-w-[90px] bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
                type="text"
                data-attr-field="value"
                value="${escapeAttr(attr.value)}"
                placeholder="Wartość (np. Elf)"
                class="flex-1 bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
                type="button"
                data-action="remove-attribute"
                data-attr-id="${attr.id}"
                class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Usuń atrybut"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
        )
        .join('')

    // Attach row input and delete listeners
    listContainer.querySelectorAll('.npc-attribute-row').forEach(row => {
        const attrId = row.dataset.attrId
        const nameInput = row.querySelector('[data-attr-field="name"]')
        const valInput = row.querySelector('[data-attr-field="value"]')
        const removeBtn = row.querySelector('[data-action="remove-attribute"]')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                const targetAttr = customAttributes.find(a => a.id === attrId)
                if (targetAttr) targetAttr.name = e.target.value
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                const targetAttr = customAttributes.find(a => a.id === attrId)
                if (targetAttr) targetAttr.value = e.target.value
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                removeCustomAttribute(attrId)
            })
        }
    })
}

/**
 * Adds a new custom attribute row.
 *
 * @param {string} [name='']
 * @param {string} [value='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string} ID of created attribute
 */
export function addCustomAttribute(name = '', value = '', shouldFocusValue = false) {
    const id = `attr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    customAttributes.push({ id, name, value })
    renderCustomAttributes()

    const newRow = document.querySelector(`.npc-attribute-row[data-attr-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const valInput = newRow.querySelector('[data-attr-field="value"]')
            if (valInput && typeof valInput.focus === 'function') valInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-attr-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes custom attribute by ID.
 *
 * @param {string} id
 */
export function removeCustomAttribute(id) {
    customAttributes = customAttributes.filter(a => a.id !== id)
    renderCustomAttributes()
}

/**
 * Returns list of custom attributes as name-value pairs.
 *
 * @returns {Array<{ name: string, value: string }>}
 */
export function getCustomAttributes() {
    return customAttributes.map(a => ({
        name: a.name.trim(),
        value: a.value.trim(),
    }))
}

/**
 * Sets custom attributes list.
 *
 * @param {Array<{ id?: string, name?: string, value?: string }>} attributes
 */
export function setCustomAttributes(attributes) {
    if (!Array.isArray(attributes)) {
        customAttributes = []
    } else {
        customAttributes = attributes.map((a, i) => ({
            id: a.id || `attr_${Date.now()}_${i}`,
            name: a.name || '',
            value: a.value || '',
        }))
    }
    renderCustomAttributes()
}

/**
 * Clears all custom attributes.
 */
export function clearCustomAttributes() {
    customAttributes = []
    renderCustomAttributes()
}

let npcStats = []
let npcSkills = []
let npcVitals = []

/**
 * Returns names of currently defined stats (from npcStats and optional ctx/projectStats).
 *
 * @returns {string[]}
 */
export function getAvailableStatNames() {
    const names = []
    npcStats.forEach(s => {
        const trimmed = (s.name || '').trim()
        if (trimmed && !names.includes(trimmed)) {
            names.push(trimmed)
        }
    })
    return names
}

/**
 * Updates `<select data-skill-field="statName">` in all skill rows without destroying DOM focus.
 */
export function updateSkillStatDropdowns() {
    const availableStats = getAvailableStatNames()
    document.querySelectorAll('.npc-skill-row').forEach(row => {
        const select = row.querySelector('[data-skill-field="statName"]')
        if (!select) return
        const currentSelected = select.value
        const skillId = row.dataset.skillId
        const targetSkill = npcSkills.find(s => s.id === skillId)
        const selectedValue = targetSkill ? targetSkill.statName : currentSelected

        const optionsHtml = ['<option value="">-- Wybierz cechę --</option>']
            .concat(
                availableStats.map(
                    statName =>
                        `<option value="${escapeAttr(statName)}" ${statName === selectedValue ? 'selected' : ''}>${escapeAttr(statName)}</option>`
                )
            )
            .join('')

        select.innerHTML = optionsHtml
        select.value = selectedValue
    })
}

/**
 * Renders the stats list.
 */
export function renderNpcStats() {
    const listContainer = document.getElementById('npc-stats-list')
    const emptyNotice = document.getElementById('npc-stats-empty')

    if (!listContainer) return

    if (npcStats.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    listContainer.innerHTML = npcStats
        .map(
            stat => `
        <div class="npc-stat-row flex items-center gap-2 group" data-stat-id="${stat.id}">
            <input
                type="text"
                data-stat-field="name"
                value="${escapeAttr(stat.name)}"
                placeholder="Nazwa cechy (np. Siła)"
                class="w-1/3 min-w-[90px] bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
                type="text"
                data-stat-field="value"
                value="${escapeAttr(stat.value)}"
                placeholder="Wartość / kość (np. 14, d6, 6d6)"
                class="flex-1 bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <button
                type="button"
                data-action="remove-stat"
                data-stat-id="${stat.id}"
                class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Usuń cechę"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
        )
        .join('')

    listContainer.querySelectorAll('.npc-stat-row').forEach(row => {
        const statId = row.dataset.statId
        const nameInput = row.querySelector('[data-stat-field="name"]')
        const valInput = row.querySelector('[data-stat-field="value"]')
        const removeBtn = row.querySelector('[data-action="remove-stat"]')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                const targetStat = npcStats.find(s => s.id === statId)
                if (targetStat) {
                    targetStat.name = e.target.value
                    updateSkillStatDropdowns()
                    updateVitalFormulasPreview()
                }
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                const targetStat = npcStats.find(s => s.id === statId)
                if (targetStat) {
                    targetStat.value = e.target.value
                    updateVitalFormulasPreview()
                }
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                removeNpcStat(statId)
            })
        }
    })
}

/**
 * Adds a new stat row.
 *
 * @param {string} [name='']
 * @param {string} [value='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string}
 */
export function addNpcStat(name = '', value = '', shouldFocusValue = false) {
    const id = `stat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcStats.push({ id, name, value })
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()

    const newRow = document.querySelector(`.npc-stat-row[data-stat-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const valInput = newRow.querySelector('[data-stat-field="value"]')
            if (valInput && typeof valInput.focus === 'function') valInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-stat-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes stat row by ID.
 *
 * @param {string} id
 */
export function removeNpcStat(id) {
    npcStats = npcStats.filter(s => s.id !== id)
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}

/**
 * Returns array of stats.
 *
 * @returns {Array<{ name: string, value: string }>}
 */
export function getNpcStats() {
    return npcStats.map(s => ({
        name: s.name.trim(),
        value: s.value.trim(),
    }))
}

/**
 * Sets stats array.
 *
 * @param {Array<{ id?: string, name?: string, value?: string }>} stats
 */
export function setNpcStats(stats) {
    if (!Array.isArray(stats)) {
        npcStats = []
    } else {
        npcStats = stats.map((s, i) => ({
            id: s.id || `stat_${Date.now()}_${i}`,
            name: s.name || '',
            value: s.value || '',
        }))
    }
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}

/**
 * Clears stats array.
 */
export function clearNpcStats() {
    npcStats = []
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}

/**
 * Renders the skills list.
 */
export function renderNpcSkills() {
    const listContainer = document.getElementById('npc-skills-list')
    const emptyNotice = document.getElementById('npc-skills-empty')

    if (!listContainer) return

    if (npcSkills.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    const availableStats = getAvailableStatNames()

    listContainer.innerHTML = npcSkills
        .map(skill => {
            const isStatMod = skill.mode === 'stat_mod'
            const optionsHtml = ['<option value="">-- Wybierz cechę --</option>']
                .concat(
                    availableStats.map(
                        statName =>
                            `<option value="${escapeAttr(statName)}" ${statName === skill.statName ? 'selected' : ''}>${escapeAttr(statName)}</option>`
                    )
                )
                .join('')

            return `
        <div class="npc-skill-row flex flex-col gap-2 p-2.5 rounded-lg bg-[#202023] border border-[#2d2d32]" data-skill-id="${skill.id}">
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    data-skill-field="name"
                    value="${escapeAttr(skill.name)}"
                    placeholder="Nazwa umiejętności (np. Skradanie)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <select
                    data-skill-field="mode"
                    class="bg-[#18181b] border border-[#3f3f46] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    <option value="direct" ${!isStatMod ? 'selected' : ''}>Wartość / Kość</option>
                    <option value="stat_mod" ${isStatMod ? 'selected' : ''}>Cecha + mod</option>
                </select>
                <button
                    type="button"
                    data-action="remove-skill"
                    data-skill-id="${skill.id}"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Usuń umiejętność"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Direct Value Mode -->
            <div class="skill-direct-mode-container flex items-center gap-2 ${isStatMod ? 'hidden' : ''}">
                <input
                    type="text"
                    data-skill-field="value"
                    value="${escapeAttr(skill.value)}"
                    placeholder="Wartość / kość (np. +2, d6, 2d6)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>

            <!-- Stat + Mod Mode -->
            <div class="skill-stat-mod-container flex items-center gap-2 ${!isStatMod ? 'hidden' : ''}">
                <select
                    data-skill-field="statName"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    ${optionsHtml}
                </select>
                <span class="text-xs text-gray-400 font-bold">+</span>
                <input
                    type="text"
                    data-skill-field="modifier"
                    value="${escapeAttr(skill.modifier)}"
                    placeholder="Mod (np. +2, +d6)"
                    class="w-28 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>
        </div>
        `
        })
        .join('')

    // Attach row input listeners
    listContainer.querySelectorAll('.npc-skill-row').forEach(row => {
        const skillId = row.dataset.skillId
        const targetSkill = npcSkills.find(s => s.id === skillId)
        if (!targetSkill) return

        const nameInput = row.querySelector('[data-skill-field="name"]')
        const modeSelect = row.querySelector('[data-skill-field="mode"]')
        const valInput = row.querySelector('[data-skill-field="value"]')
        const statSelect = row.querySelector('[data-skill-field="statName"]')
        const modInput = row.querySelector('[data-skill-field="modifier"]')
        const removeBtn = row.querySelector('[data-action="remove-skill"]')
        const directBox = row.querySelector('.skill-direct-mode-container')
        const statModBox = row.querySelector('.skill-stat-mod-container')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                targetSkill.name = e.target.value
            })
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', e => {
                targetSkill.mode = e.target.value
                const isMod = targetSkill.mode === 'stat_mod'
                if (directBox) directBox.classList.toggle('hidden', isMod)
                if (statModBox) statModBox.classList.toggle('hidden', !isMod)
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                targetSkill.value = e.target.value
            })
        }

        if (statSelect) {
            if (targetSkill.statName) {
                statSelect.value = targetSkill.statName
            }
            statSelect.addEventListener('change', e => {
                targetSkill.statName = e.target.value
            })
        }

        if (modInput) {
            modInput.addEventListener('input', e => {
                targetSkill.modifier = e.target.value
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                removeNpcSkill(skillId)
            })
        }
    })
}

/**
 * Adds a new skill row.
 *
 * @param {string} [name='']
 * @param {'direct'|'stat_mod'} [mode='direct']
 * @param {string} [value='']
 * @param {string} [statName='']
 * @param {string} [modifier='']
 * @returns {string}
 */
export function addNpcSkill(name = '', mode = 'direct', value = '', statName = '', modifier = '') {
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcSkills.push({ id, name, mode, value, statName, modifier })
    renderNpcSkills()

    const newRow = document.querySelector(`.npc-skill-row[data-skill-id="${id}"]`)
    if (newRow) {
        const nameInput = newRow.querySelector('[data-skill-field="name"]')
        if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
    }

    return id
}

/**
 * Removes skill row by ID.
 *
 * @param {string} id
 */
export function removeNpcSkill(id) {
    npcSkills = npcSkills.filter(s => s.id !== id)
    renderNpcSkills()
}

/**
 * Returns array of skills.
 *
 * @returns {Array<{ name: string, mode: string, value: string, statName: string, modifier: string }>}
 */
export function getNpcSkills() {
    return npcSkills.map(s => ({
        name: s.name.trim(),
        mode: s.mode,
        value: (s.value || '').trim(),
        statName: (s.statName || '').trim(),
        modifier: (s.modifier || '').trim(),
    }))
}

/**
 * Sets skills array.
 *
 * @param {Array<any>} skills
 */
export function setNpcSkills(skills) {
    if (!Array.isArray(skills)) {
        npcSkills = []
    } else {
        npcSkills = skills.map((s, i) => ({
            id: s.id || `skill_${Date.now()}_${i}`,
            name: s.name || '',
            mode: s.mode || 'direct',
            value: s.value || '',
            statName: s.statName || '',
            modifier: s.modifier || '',
        }))
    }
    renderNpcSkills()
}

/**
 * Clears skills array.
 */
export function clearNpcSkills() {
    npcSkills = []
    renderNpcSkills()
}

/**
 * Safely parses a stat value string into a numerical value.
 * Supports numbers ("15", "12.5"), dice notation ("d6", "2d6", "1d20+2"), or extracts leading digits.
 *
 * @param {any} val
 * @returns {number|null}
 */
export function parseStatValueAsNumber(val) {
    if (val === undefined || val === null) return null
    const str = String(val).trim()
    if (!str) return null

    // Pure number
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str)
    }

    // Dice notation: e.g. "d6", "2d6", "1d20+5", "3d8-2"
    const diceMatch = str.match(/^(\d+)?d(\d+)([+-]\d+)?$/i)
    if (diceMatch) {
        const count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1
        const sides = parseInt(diceMatch[2], 10)
        const bonus = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0
        const avgPerDie = (sides + 1) / 2
        return count * avgPerDie + bonus
    }

    // Leading number
    const leadMatch = str.match(/^-?\d+(\.\d+)?/)
    if (leadMatch) {
        return parseFloat(leadMatch[0])
    }

    return null
}

/**
 * Safely tokenizes and evaluates an arithmetic expression with stat variables.
 * Uses the Shunting-yard algorithm and RPN evaluator (safe arithmetic only, zero eval).
 *
 * @param {string} formula e.g. "Siła * 4 + 10", "(Kondycja + 5) * 2"
 * @param {Record<string, any>} [statsMap={}] Map of stat names to values
 * @returns {{ result: number|null, error?: string }}
 */
export function evaluateFormula(formula, statsMap = {}) {
    if (!formula || typeof formula !== 'string' || !formula.trim()) {
        return { result: null }
    }

    // Normalize statsMap keys to lowercase trimmed
    const normalizedStats = {}
    if (statsMap && typeof statsMap === 'object') {
        Object.entries(statsMap).forEach(([k, v]) => {
            const key = k.trim().toLowerCase()
            const numVal = typeof v === 'number' ? v : parseStatValueAsNumber(v)
            if (numVal !== null && !isNaN(numVal)) {
                normalizedStats[key] = numVal
            }
        })
    }

    const str = formula.trim()
    const tokens = []
    let i = 0

    function canBeUnary() {
        if (tokens.length === 0) return true
        const last = tokens[tokens.length - 1]
        return last.type === 'OP' || last.type === 'LPAREN'
    }

    while (i < str.length) {
        const char = str[i]

        // Whitespace
        if (/\s/.test(char)) {
            i++
            continue
        }

        // Numbers (integers or decimals)
        if (/\d/.test(char) || (char === '.' && i + 1 < str.length && /\d/.test(str[i + 1]))) {
            let numStr = ''
            while (i < str.length && /[\d.]/.test(str[i])) {
                numStr += str[i]
                i++
            }
            const parsed = parseFloat(numStr)
            if (isNaN(parsed)) {
                return { result: null, error: `Niepoprawna liczba: ${numStr}` }
            }
            tokens.push({ type: 'NUM', value: parsed })
            continue
        }

        // Parentheses
        if (char === '(') {
            tokens.push({ type: 'LPAREN' })
            i++
            continue
        }
        if (char === ')') {
            tokens.push({ type: 'RPAREN' })
            i++
            continue
        }

        // Unary operators: - or +
        if ((char === '-' || char === '+') && canBeUnary()) {
            if (char === '-') {
                tokens.push({
                    type: 'OP',
                    value: 'u-',
                    precedence: 4,
                    rightAssoc: true,
                    isUnary: true,
                })
            }
            i++
            continue
        }

        // Binary operators: +, -, *, /, %
        if ('+-*/%'.includes(char)) {
            const precedence = char === '*' || char === '/' || char === '%' ? 3 : 2
            tokens.push({ type: 'OP', value: char, precedence, rightAssoc: false })
            i++
            continue
        }

        // Variable identifiers (support unicode for Polish characters)
        if (/[\p{L}_]/u.test(char)) {
            let ident = ''
            while (i < str.length && /[\p{L}\p{N}_]/u.test(str[i])) {
                ident += str[i]
                i++
            }
            const identLower = ident.toLowerCase()
            if (identLower in normalizedStats) {
                tokens.push({ type: 'NUM', value: normalizedStats[identLower] })
            } else {
                return { result: null, error: `Brak cechy: ${ident}` }
            }
            continue
        }

        // Disallowed character
        return { result: null, error: `Niedozwolony znak: '${char}'` }
    }

    if (tokens.length === 0) return { result: null }

    // Shunting-yard to RPN
    const outputQueue = []
    const opStack = []

    for (const token of tokens) {
        if (token.type === 'NUM') {
            outputQueue.push(token)
        } else if (token.type === 'OP') {
            while (opStack.length > 0) {
                const top = opStack[opStack.length - 1]
                if (top.type === 'OP') {
                    if (
                        (!token.rightAssoc && token.precedence <= top.precedence) ||
                        (token.rightAssoc && token.precedence < top.precedence)
                    ) {
                        outputQueue.push(opStack.pop())
                        continue
                    }
                }
                break
            }
            opStack.push(token)
        } else if (token.type === 'LPAREN') {
            opStack.push(token)
        } else if (token.type === 'RPAREN') {
            let foundLparen = false
            while (opStack.length > 0) {
                const top = opStack.pop()
                if (top.type === 'LPAREN') {
                    foundLparen = true
                    break
                }
                outputQueue.push(top)
            }
            if (!foundLparen) {
                return { result: null, error: 'Niezbalansowane nawiasy' }
            }
        }
    }

    while (opStack.length > 0) {
        const top = opStack.pop()
        if (top.type === 'LPAREN' || top.type === 'RPAREN') {
            return { result: null, error: 'Niezbalansowane nawiasy' }
        }
        outputQueue.push(top)
    }

    // Evaluate RPN
    const evalStack = []
    for (const token of outputQueue) {
        if (token.type === 'NUM') {
            evalStack.push(token.value)
        } else if (token.type === 'OP') {
            if (token.isUnary) {
                if (evalStack.length < 1) return { result: null, error: 'Błąd składni wzoru' }
                const a = evalStack.pop()
                evalStack.push(-a)
            } else {
                if (evalStack.length < 2) return { result: null, error: 'Błąd składni wzoru' }
                const b = evalStack.pop()
                const a = evalStack.pop()
                let res = 0
                switch (token.value) {
                    case '+':
                        res = a + b
                        break
                    case '-':
                        res = a - b
                        break
                    case '*':
                        res = a * b
                        break
                    case '/':
                        if (b === 0) return { result: null, error: 'Dzielenie przez zero' }
                        res = a / b
                        break
                    case '%':
                        if (b === 0) return { result: null, error: 'Dzielenie przez zero' }
                        res = a % b
                        break
                    default:
                        return { result: null, error: 'Nieznany operator' }
                }
                evalStack.push(res)
            }
        }
    }

    if (evalStack.length !== 1) {
        return { result: null, error: 'Błąd składni wzoru' }
    }

    const finalVal = evalStack[0]
    const rounded = Math.round(finalVal * 100) / 100
    return { result: rounded }
}

/**
 * Updates live preview badges for all vital rows in formula mode.
 */
export function updateVitalFormulasPreview() {
    const statsMap = {}
    npcStats.forEach(s => {
        const key = (s.name || '').trim()
        if (key) statsMap[key] = s.value
    })

    document.querySelectorAll('.npc-vital-row').forEach(row => {
        const vitalId = row.dataset.vitalId
        const targetVital = npcVitals.find(v => v.id === vitalId)
        if (!targetVital || targetVital.mode !== 'formula') return

        const previewSlot = row.querySelector('.vital-preview-slot')
        if (!previewSlot) return

        const formula = targetVital.formula || ''
        if (!formula.trim()) {
            previewSlot.innerHTML = `<span class="npc-vital-preview px-2 py-1 rounded bg-gray-800 text-gray-500 text-[11px] font-mono border border-gray-700 select-none">Wpisz wzór</span>`
            return
        }

        const calc = evaluateFormula(formula, statsMap)
        if (calc && calc.result !== null && !calc.error) {
            previewSlot.innerHTML = `<span class="npc-vital-preview px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-semibold border border-emerald-500/30 select-none" title="Obliczona wartość">= ${calc.result}</span>`
        } else {
            const err = calc?.error || 'Błąd wzoru'
            previewSlot.innerHTML = `<span class="npc-vital-preview px-2 py-1 rounded bg-amber-500/15 text-amber-400 text-[11px] font-mono border border-amber-500/30 select-none" title="${escapeAttr(err)}">${escapeAttr(err)}</span>`
        }
    })
}

/**
 * Renders the vitals list.
 */
export function renderNpcVitals() {
    const listContainer = document.getElementById('npc-vitals-list')
    const emptyNotice = document.getElementById('npc-vitals-empty')

    if (!listContainer) return

    if (npcVitals.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    const statsMap = {}
    npcStats.forEach(s => {
        const key = (s.name || '').trim()
        if (key) statsMap[key] = s.value
    })

    listContainer.innerHTML = npcVitals
        .map(vital => {
            const isFormula = vital.mode === 'formula'
            const calc = isFormula ? evaluateFormula(vital.formula, statsMap) : null

            let badgeHtml = ''
            if (isFormula) {
                if (!vital.formula || !vital.formula.trim()) {
                    badgeHtml = `<span class="npc-vital-preview px-2 py-1 rounded bg-gray-800 text-gray-500 text-[11px] font-mono border border-gray-700 select-none">Wpisz wzór</span>`
                } else if (calc && calc.result !== null && !calc.error) {
                    badgeHtml = `<span class="npc-vital-preview px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-semibold border border-emerald-500/30 select-none" title="Obliczona wartość">= ${calc.result}</span>`
                } else {
                    const err = calc?.error || 'Błąd wzoru'
                    badgeHtml = `<span class="npc-vital-preview px-2 py-1 rounded bg-amber-500/15 text-amber-400 text-[11px] font-mono border border-amber-500/30 select-none" title="${escapeAttr(err)}">${escapeAttr(err)}</span>`
                }
            }

            return `
        <div class="npc-vital-row flex flex-col gap-2 p-2.5 rounded-lg bg-[#202023] border border-[#2d2d32]" data-vital-id="${vital.id}">
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    data-vital-field="name"
                    value="${escapeAttr(vital.name)}"
                    placeholder="Nazwa parametru (np. Punkty Życia)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <select
                    data-vital-field="mode"
                    class="bg-[#18181b] border border-[#3f3f46] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    <option value="direct" ${!isFormula ? 'selected' : ''}>Wartość / Kość</option>
                    <option value="formula" ${isFormula ? 'selected' : ''}>Wzór matematyczny</option>
                </select>
                <button
                    type="button"
                    data-action="remove-vital"
                    data-vital-id="${vital.id}"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Usuń parametr"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Direct Value Mode Container -->
            <div class="vital-direct-container flex items-center gap-2 ${isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="value"
                    value="${escapeAttr(vital.value)}"
                    placeholder="Wartość / kość (np. 100, 2d10)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>

            <!-- Formula Mode Container -->
            <div class="vital-formula-container flex items-center gap-2 ${!isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="formula"
                    value="${escapeAttr(vital.formula)}"
                    placeholder="Wzór (np. Siła * 4 + 10)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <div class="vital-preview-slot shrink-0">
                    ${badgeHtml}
                </div>
            </div>
        </div>
        `
        })
        .join('')

    // Attach listeners
    listContainer.querySelectorAll('.npc-vital-row').forEach(row => {
        const vitalId = row.dataset.vitalId
        const targetVital = npcVitals.find(v => v.id === vitalId)
        if (!targetVital) return

        const nameInput = row.querySelector('[data-vital-field="name"]')
        const modeSelect = row.querySelector('[data-vital-field="mode"]')
        const valInput = row.querySelector('[data-vital-field="value"]')
        const formulaInput = row.querySelector('[data-vital-field="formula"]')
        const removeBtn = row.querySelector('[data-action="remove-vital"]')
        const directBox = row.querySelector('.vital-direct-container')
        const formulaBox = row.querySelector('.vital-formula-container')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                targetVital.name = e.target.value
            })
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', e => {
                targetVital.mode = e.target.value
                const isForm = targetVital.mode === 'formula'
                if (directBox) directBox.classList.toggle('hidden', isForm)
                if (formulaBox) formulaBox.classList.toggle('hidden', !isForm)
                updateVitalFormulasPreview()
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                targetVital.value = e.target.value
            })
        }

        if (formulaInput) {
            formulaInput.addEventListener('input', e => {
                targetVital.formula = e.target.value
                updateVitalFormulasPreview()
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                removeNpcVital(vitalId)
            })
        }
    })
}

/**
 * Adds a new vital row.
 *
 * @param {string} [name='']
 * @param {'direct'|'formula'} [mode='direct']
 * @param {string} [value='']
 * @param {string} [formula='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string}
 */
export function addNpcVital(
    name = '',
    mode = 'direct',
    value = '',
    formula = '',
    shouldFocusValue = false
) {
    const id = `vital_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcVitals.push({ id, name, mode, value, formula })
    renderNpcVitals()

    const newRow = document.querySelector(`.npc-vital-row[data-vital-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const targetInput =
                mode === 'formula'
                    ? newRow.querySelector('[data-vital-field="formula"]')
                    : newRow.querySelector('[data-vital-field="value"]')
            if (targetInput && typeof targetInput.focus === 'function') targetInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-vital-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes vital row by ID.
 *
 * @param {string} id
 */
export function removeNpcVital(id) {
    npcVitals = npcVitals.filter(v => v.id !== id)
    renderNpcVitals()
}

/**
 * Returns array of vitals with live calculated values.
 *
 * @returns {Array<{ name: string, mode: string, value: string, formula: string, calculatedValue: number|null }>}
 */
export function getNpcVitals() {
    const statsMap = {}
    npcStats.forEach(s => {
        const key = (s.name || '').trim()
        if (key) statsMap[key] = s.value
    })

    return npcVitals.map(v => {
        const isFormula = v.mode === 'formula'
        const calc = isFormula ? evaluateFormula(v.formula, statsMap) : null
        return {
            name: v.name.trim(),
            mode: v.mode,
            value: (v.value || '').trim(),
            formula: (v.formula || '').trim(),
            calculatedValue: calc?.result ?? null,
        }
    })
}

/**
 * Sets vitals array.
 *
 * @param {Array<any>} vitals
 */
export function setNpcVitals(vitals) {
    if (!Array.isArray(vitals)) {
        npcVitals = []
    } else {
        npcVitals = vitals.map((v, i) => ({
            id: v.id || `vital_${Date.now()}_${i}`,
            name: v.name || '',
            mode: v.mode || 'direct',
            value: v.value || '',
            formula: v.formula || '',
        }))
    }
    renderNpcVitals()
}

/**
 * Clears vitals array.
 */
export function clearNpcVitals() {
    npcVitals = []
    renderNpcVitals()
}

/**
 * Validates and saves the NPC character, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @returns {object|null} Created character object or null if validation failed
 */
export function saveNpcCharacter(ctx) {
    const effectiveCtx = ctx || activeCtx || {}
    const name = getNpcName().trim()
    const errorBox = document.getElementById('npc-create-error-message')
    const nameInput = document.getElementById('npc-name-input')

    if (!name) {
        if (errorBox) errorBox.classList.remove('hidden')
        if (nameInput) {
            nameInput.classList.add('border-red-500', 'focus:border-red-500')
            if (typeof nameInput.focus === 'function') nameInput.focus()
        }
        return null
    }

    if (errorBox) errorBox.classList.add('hidden')
    if (nameInput) {
        nameInput.classList.remove('border-red-500', 'focus:border-red-500')
    }

    const summary = getNpcSummary()
    const descriptionText = getNpcDescription()
    const avatarId = getSelectedAvatarId()
    const customAttrs = getCustomAttributes()
    const stats = getNpcStats()
    const skills = getNpcSkills()
    const vitals = getNpcVitals()

    const charId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    let createdCharacter = null

    if (effectiveCtx.vm && typeof effectiveCtx.vm.createCharacter === 'function') {
        createdCharacter = effectiveCtx.vm.createCharacter(name)
        createdCharacter.avatar = avatarId
        if (createdCharacter.getDescription) {
            const desc = createdCharacter.getDescription()
            if (desc && typeof desc.setSummary === 'function') desc.setSummary(summary)
            if (desc && typeof desc.setText === 'function') desc.setText(descriptionText)
        }
        if (typeof createdCharacter.setStats === 'function') {
            stats.forEach(s => {
                if (effectiveCtx.vm.createStat) {
                    const statObj = effectiveCtx.vm.createStat(s.name)
                    if (statObj && statObj.setValue) statObj.setValue(s.value)
                    createdCharacter.addStat(statObj)
                }
            })
        }
        createdCharacter.customAttributes = customAttrs
        createdCharacter.vitals = vitals
        createdCharacter.skillsData = skills
    } else {
        createdCharacter = {
            id: charId,
            name,
            avatar: avatarId,
            description: {
                summary,
                text: descriptionText,
                getSummary() {
                    return this.summary
                },
                getText() {
                    return this.text
                },
            },
            stats: stats.map((s, i) => ({
                id: `stat_${Date.now()}_${i}`,
                name: s.name,
                value: s.value,
                getId() {
                    return this.id
                },
                getName() {
                    return this.name
                },
                getValue() {
                    return this.value
                },
            })),
            skills: skills.map((sk, i) => ({
                id: `skill_${Date.now()}_${i}`,
                name: sk.name,
                mode: sk.mode,
                value: sk.value,
                statName: sk.statName,
                modifier: sk.modifier,
                getId() {
                    return this.id
                },
                getName() {
                    return this.name
                },
            })),
            features: [
                ...customAttrs.map((attr, i) => ({
                    id: `attr_${Date.now()}_${i}`,
                    name: attr.name,
                    value: attr.value,
                    type: 'attribute',
                    getId() {
                        return this.id
                    },
                    getName() {
                        return this.name
                    },
                    getValue() {
                        return this.value
                    },
                })),
                ...vitals.map((vit, i) => ({
                    id: `vital_${Date.now()}_${i}`,
                    name: vit.name,
                    mode: vit.mode,
                    value: vit.value,
                    formula: vit.formula,
                    calculatedValue: vit.calculatedValue,
                    type: 'vital',
                    getId() {
                        return this.id
                    },
                    getName() {
                        return this.name
                    },
                    getValue() {
                        return vit.calculatedValue !== null ? vit.calculatedValue : vit.value
                    },
                })),
            ],
            tags: [],
            getId() {
                return this.id
            },
            getName() {
                return this.name
            },
            setName(n) {
                this.name = n
            },
            getDescription() {
                return this.description
            },
            getStats() {
                return this.stats
            },
            getSkills() {
                return this.skills
            },
            getFeatures() {
                return this.features
            },
            getTags() {
                return this.tags
            },
            toJSON() {
                return {
                    id: this.id,
                    name: this.name,
                    avatar: this.avatar,
                    description: {
                        summary: this.description.summary,
                        text: this.description.text,
                    },
                    stats: this.stats.map(s => ({ id: s.id, name: s.name, value: s.value })),
                    skills: this.skills,
                    features: this.features,
                    tags: this.tags,
                }
            },
        }
    }

    // Add to projectCharacters array
    if (Array.isArray(effectiveCtx.projectCharacters)) {
        effectiveCtx.projectCharacters.push(createdCharacter)
    }

    // Add to ViewModel project if available
    if (effectiveCtx.vm?.project && typeof effectiveCtx.vm.project.addCharacter === 'function') {
        effectiveCtx.vm.project.addCharacter(createdCharacter)
    }

    // Refresh drawer list
    if (typeof effectiveCtx.renderCharactersList === 'function') {
        effectiveCtx.renderCharactersList(effectiveCtx)
    }

    // Show success notification
    if (toast && typeof toast.success === 'function') {
        const successMsg =
            typeof t === 'function'
                ? t('npc.created_success_msg', { name })
                : `Pomyślnie utworzono postać ${name}`
        const successTitle =
            typeof t === 'function' ? t('npc.created_success_title') : 'Postać utworzona'
        toast.success(successMsg, successTitle)
    }

    closeNpcModal()
    resetNpcModalForm()

    return createdCharacter
}

/**
 * Resets modal form fields to clean initial state.
 */
export function resetNpcModalForm() {
    setSelectedAvatarId('warrior')
    setNpcName('')
    setNpcSummary('')
    setNpcDescription('')
    clearCustomAttributes()
    clearNpcStats()
    clearNpcSkills()
    clearNpcVitals()
    const errorBox = document.getElementById('npc-create-error-message')
    if (errorBox) errorBox.classList.add('hidden')
    const nameInput = document.getElementById('npc-name-input')
    if (nameInput) {
        nameInput.classList.remove('border-red-500', 'focus:border-red-500')
    }
    const popover = document.getElementById('npc-avatar-picker-popover')
    if (popover) popover.classList.add('hidden')
}

/**
 * Initializes listeners for the NPC creation floating window.
 *
 * @param {object} [ctx] Optional application UI context
 */
export function setupNpcModal(ctx) {
    const modal = document.getElementById('npc-create-modal')
    activeModal = modal

    if (!modal) return

    customAttributes = []
    npcStats = []
    npcSkills = []
    npcVitals = []
    currentAvatarId = 'warrior'
    isDrawerOpen = false

    const header = document.getElementById('npc-create-modal-header')
    const btnAddCharacter = document.getElementById('btn-add-character')
    const btnCloseModal = document.getElementById('btn-close-npc-modal')
    const btnToggleDesc = document.getElementById('btn-toggle-npc-description')

    // Initialize dragging mechanism
    initDraggable(modal, header)

    // Initialize fantasy avatar picker grid & preview
    initAvatarGrid()

    // Initialize side drawer toggle
    if (btnToggleDesc) {
        btnToggleDesc.addEventListener('click', e => {
            e.preventDefault()
            toggleDescriptionDrawer()
        })
    }

    // Open when clicking "Dodaj" / Add character button in left drawer
    if (btnAddCharacter) {
        btnAddCharacter.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            openNpcModal()
        })
    }

    // Open when clicking any trigger with data-action="open-npc-modal"
    document.querySelectorAll('[data-action="open-npc-modal"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            openNpcModal()
        })
    })

    // Close when clicking the close button
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', e => {
            e.preventDefault()
            closeNpcModal()
        })
    }

    // Safely attach single document click listener for outside popover clicks
    if (globalOutsideClickHandler) {
        document.removeEventListener('click', globalOutsideClickHandler)
    }
    globalOutsideClickHandler = e => {
        const popover = document.getElementById('npc-avatar-picker-popover')
        const triggerBtn = document.getElementById('btn-npc-avatar-trigger')
        if (popover && !popover.classList.contains('hidden')) {
            if (!popover.contains(e.target) && (!triggerBtn || !triggerBtn.contains(e.target))) {
                popover.classList.add('hidden')
            }
        }
    }
    document.addEventListener('click', globalOutsideClickHandler)

    // Safely attach single Escape key listener (first closes popover if open, then modal)
    if (globalKeydownHandler) {
        document.removeEventListener('keydown', globalKeydownHandler)
    }
    globalKeydownHandler = e => {
        if (e.key === 'Escape') {
            const popover = document.getElementById('npc-avatar-picker-popover')
            if (popover && !popover.classList.contains('hidden')) {
                popover.classList.add('hidden')
                return
            }
            if (modal && !modal.classList.contains('hidden')) {
                closeNpcModal()
            }
        }
    }
    document.addEventListener('keydown', globalKeydownHandler)

    // Custom attributes setup
    const btnAddAttr = document.getElementById('btn-add-custom-attribute')
    if (btnAddAttr) {
        btnAddAttr.addEventListener('click', e => {
            e.preventDefault()
            addCustomAttribute('', '')
        })
    }

    document.querySelectorAll('.npc-preset-chip').forEach(chip => {
        chip.addEventListener('click', e => {
            e.preventDefault()
            const presetName = chip.dataset.presetName
            if (presetName) {
                addCustomAttribute(presetName, '', true)
            }
        })
    })

    renderCustomAttributes()

    // Stats setup
    const btnAddStat = document.getElementById('btn-add-npc-stat')
    if (btnAddStat) {
        btnAddStat.addEventListener('click', e => {
            e.preventDefault()
            addNpcStat('', '')
        })
    }

    document.querySelectorAll('.npc-stat-preset-chip').forEach(chip => {
        chip.addEventListener('click', e => {
            e.preventDefault()
            const presetStat = chip.dataset.presetStat
            if (presetStat) {
                addNpcStat(presetStat, '', true)
            }
        })
    })

    renderNpcStats()

    // Skills setup
    const btnAddSkill = document.getElementById('btn-add-npc-skill')
    if (btnAddSkill) {
        btnAddSkill.addEventListener('click', e => {
            e.preventDefault()
            addNpcSkill('', 'direct', '')
        })
    }

    document.querySelectorAll('.npc-skill-preset-chip').forEach(chip => {
        chip.addEventListener('click', e => {
            e.preventDefault()
            const presetSkill = chip.dataset.presetSkill
            if (presetSkill) {
                addNpcSkill(presetSkill, 'direct', '')
            }
        })
    })

    renderNpcSkills()

    // Vitals setup
    const btnAddVital = document.getElementById('btn-add-npc-vital')
    if (btnAddVital) {
        btnAddVital.addEventListener('click', e => {
            e.preventDefault()
            addNpcVital('', 'direct', '')
        })
    }

    document.querySelectorAll('.npc-vital-preset-chip').forEach(chip => {
        chip.addEventListener('click', e => {
            e.preventDefault()
            const presetVital = chip.dataset.presetVital
            if (presetVital) {
                if (presetVital === 'Punkty Życia (HP)') {
                    addNpcVital(presetVital, 'formula', '', 'Siła * 4 + 10', true)
                } else if (presetVital === 'Mana') {
                    addNpcVital(presetVital, 'formula', '', 'Inteligencja * 3', true)
                } else {
                    addNpcVital(presetVital, 'direct', '10', '', true)
                }
            }
        })
    })

    renderNpcVitals()

    // Setup name input error clearing on user typing
    const nameInput = document.getElementById('npc-name-input')
    const errorBox = document.getElementById('npc-create-error-message')
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            if (errorBox) errorBox.classList.add('hidden')
            nameInput.classList.remove('border-red-500', 'focus:border-red-500')
        })
    }

    // Setup action buttons: Save & Cancel
    const btnCancel = document.getElementById('btn-cancel-npc-modal')
    if (btnCancel) {
        btnCancel.addEventListener('click', e => {
            e.preventDefault()
            closeNpcModal()
            resetNpcModalForm()
        })
    }

    const btnSave = document.getElementById('btn-save-npc-modal')
    const form = document.getElementById('npc-create-modal-form')
    if (btnSave) {
        btnSave.addEventListener('click', e => {
            e.preventDefault()
            saveNpcCharacter(ctx)
        })
    }
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault()
            saveNpcCharacter(ctx)
        })
    }

    activeCtx = ctx || null

    // Expose helpers on ctx and window for flexible access
    const methods = {
        open: openNpcModal,
        close: closeNpcModal,
        openNpcModal,
        closeNpcModal,
        getSelectedAvatarId,
        setSelectedAvatarId,
        getNpcName,
        setNpcName,
        getNpcSummary,
        setNpcSummary,
        getCustomAttributes,
        setCustomAttributes,
        addCustomAttribute,
        removeCustomAttribute,
        clearCustomAttributes,
        renderCustomAttributes,
        getNpcStats,
        setNpcStats,
        addNpcStat,
        removeNpcStat,
        clearNpcStats,
        renderNpcStats,
        getAvailableStatNames,
        updateSkillStatDropdowns,
        getNpcSkills,
        setNpcSkills,
        addNpcSkill,
        removeNpcSkill,
        clearNpcSkills,
        renderNpcSkills,
        getNpcVitals,
        setNpcVitals,
        addNpcVital,
        removeNpcVital,
        clearNpcVitals,
        renderNpcVitals,
        evaluateFormula,
        parseStatValueAsNumber,
        updateVitalFormulasPreview,
        saveNpcCharacter,
        getNpcDescription,
        setNpcDescription,
        isDescriptionDrawerOpen,
        toggleDescriptionDrawer,
        resetNpcModalForm,
    }

    if (ctx) {
        Object.assign(ctx, methods)
    }
    if (typeof window !== 'undefined') {
        Object.assign(window, methods)
    }

    return methods
}
