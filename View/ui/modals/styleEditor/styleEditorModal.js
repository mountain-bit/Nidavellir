/**
 * Style Editor Modal Controller
 * Dedicated window for managing, customizing, and live-previewing book export styles.
 */

import {
    deleteCustomStyle,
    getAllStyles,
    getStyleById,
    saveCustomStyle,
} from '../export/exportStyleService.js'

let activeStyle = null
let onStyleSavedCallback = null

/**
 * Opens the Style Editor Modal.
 *
 * @param {string} [initialStyleId]
 * @param {Function} [onSaved] Callback invoked with the newly saved style
 */
export function openStyleEditorModal(initialStyleId = 'classic-fantasy', onSaved = null) {
    onStyleSavedCallback = onSaved
    const modal = document.getElementById('modal-style-editor')
    if (!modal) return

    activeStyle = { ...getStyleById(initialStyleId) }

    renderStylesList()
    populateFormWithStyle(activeStyle)
    updateLivePreview()
    bindEventsOnce()

    modal.classList.remove('hidden')
}

/**
 * Closes the Style Editor Modal.
 */
export function closeStyleEditorModal() {
    const modal = document.getElementById('modal-style-editor')
    if (modal) {
        modal.classList.add('hidden')
    }
}

let eventsBound = false
function bindEventsOnce() {
    if (eventsBound) return
    eventsBound = true

    const modal = document.getElementById('modal-style-editor')
    if (!modal) return

    // Close buttons
    const btnClose = document.getElementById('btn-close-style-editor')
    const btnCancel = document.getElementById('btn-cancel-style-editor')
    if (btnClose) btnClose.onclick = closeStyleEditorModal
    if (btnCancel) btnCancel.onclick = closeStyleEditorModal

    // New style button
    const btnNew = document.getElementById('btn-new-style')
    if (btnNew) {
        btnNew.onclick = () => {
            const base = activeStyle || getStyleById('classic-fantasy')
            activeStyle = {
                ...base,
                id: '',
                name: `${base.name} (Kopia)`,
                isBuiltIn: false,
            }
            populateFormWithStyle(activeStyle)
            updateLivePreview()
        }
    }

    // Delete style button
    const btnDelete = document.getElementById('btn-delete-style')
    if (btnDelete) {
        btnDelete.onclick = () => {
            if (!activeStyle || activeStyle.isBuiltIn) {
                alert('Nie można usunąć wbudowanego stylu domyślnego.')
                return
            }
            if (confirm(`Czy na pewno chcesz usunąć styl "${activeStyle.name}"?`)) {
                deleteCustomStyle(activeStyle.id)
                activeStyle = { ...getStyleById('classic-fantasy') }
                renderStylesList()
                populateFormWithStyle(activeStyle)
                updateLivePreview()
                if (onStyleSavedCallback) onStyleSavedCallback(activeStyle)
            }
        }
    }

    // Save style button
    const btnSave = document.getElementById('btn-save-style')
    if (btnSave) {
        btnSave.onclick = () => {
            const updated = readFormStyle()
            const saved = saveCustomStyle(updated)
            activeStyle = saved
            renderStylesList()
            populateFormWithStyle(saved)
            updateLivePreview()

            if (onStyleSavedCallback) {
                onStyleSavedCallback(saved)
            }
            closeStyleEditorModal()
        }
    }

    // Real-time form change listeners for Live Preview
    const formInputs = modal.querySelectorAll('.style-prop-input')
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            updateLivePreview()
        })
        input.addEventListener('change', () => {
            updateLivePreview()
        })
    })
}

function renderStylesList() {
    const listContainer = document.getElementById('style-editor-list')
    if (!listContainer) return

    const allStyles = getAllStyles()
    listContainer.innerHTML = ''

    allStyles.forEach(s => {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = `w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
            activeStyle && activeStyle.id === s.id
                ? 'border-blue-500 bg-blue-950/30 text-white font-medium shadow-sm'
                : 'border-[#2e3037] bg-[#1a1b1f] hover:bg-[#23252a] text-zinc-300'
        }`

        const badge = s.isBuiltIn
            ? '<span class="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">Domyślny</span>'
            : '<span class="text-[10px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">Własny</span>'

        item.innerHTML = `
            <div class="truncate mr-2">
                <div class="font-semibold truncate">${escapeHtml(s.name)}</div>
                <div class="text-[10px] text-zinc-400 truncate">${escapeHtml(s.description || '')}</div>
            </div>
            ${badge}
        `

        item.onclick = () => {
            activeStyle = { ...s }
            renderStylesList()
            populateFormWithStyle(activeStyle)
            updateLivePreview()
        }

        listContainer.appendChild(item)
    })

    const btnDelete = document.getElementById('btn-delete-style')
    if (btnDelete) {
        if (activeStyle && activeStyle.isBuiltIn) {
            btnDelete.classList.add('opacity-40', 'cursor-not-allowed')
            btnDelete.disabled = true
        } else {
            btnDelete.classList.remove('opacity-40', 'cursor-not-allowed')
            btnDelete.disabled = false
        }
    }
}

function populateFormWithStyle(s) {
    if (!s) return
    setVal('style-input-name', s.name || 'Nowy Styl')
    setVal('style-input-format', s.pageFormat || 'A5')
    setVal('style-input-columns', s.columns || 1)
    setVal('style-input-font-family', s.fontFamily || 'Georgia, serif')
    setVal('style-input-font-size', s.fontSize || 10)
    setVal('style-input-line-height', s.lineHeight || 1.45)
    setVal('style-input-header-font', s.headerFontFamily || 'Cinzel, Georgia, serif')
    setVal('style-input-header-size', s.headerFontSize || 13)
    setVal('style-input-margin-top', s.margins?.top ?? 15)
    setVal('style-input-margin-bottom', s.margins?.bottom ?? 15)
    setVal('style-input-margin-left', s.margins?.left ?? 18)
    setVal('style-input-margin-right', s.margins?.right ?? 15)
    setVal('style-input-indent', s.paragraphIndent ?? 4)
    setVal('style-input-spacing', s.paragraphSpacing ?? 4)
    setVal('style-input-color-text', s.textColor || '#1a1a1a')
    setVal('style-input-color-accent', s.accentColor || '#8b1e1e')
    setVal('style-input-color-bg', s.backgroundColor || '#ffffff')
    setVal('style-input-separator-type', s.separatorType || 'ornament')
    setVal('style-input-custom-separator', s.customSeparator || '❖ ❖ ❖')
    setVal('style-input-choice-style', s.choiceStyle || 'italic')
    setVal('style-input-choice-prefix', s.choicePrefix || '→ ')
}

function readFormStyle() {
    return {
        id: activeStyle?.id || '',
        name: getVal('style-input-name') || 'Nienazwany Styl',
        isBuiltIn: false,
        pageFormat: getVal('style-input-format'),
        pageOrientation: 'portrait',
        columns: parseInt(getVal('style-input-columns'), 10) || 1,
        margins: {
            top: parseFloat(getVal('style-input-margin-top')) || 15,
            bottom: parseFloat(getVal('style-input-margin-bottom')) || 15,
            left: parseFloat(getVal('style-input-margin-left')) || 18,
            right: parseFloat(getVal('style-input-margin-right')) || 15,
        },
        fontFamily: getVal('style-input-font-family'),
        fontSize: parseFloat(getVal('style-input-font-size')) || 10,
        lineHeight: parseFloat(getVal('style-input-line-height')) || 1.45,
        paragraphIndent: parseFloat(getVal('style-input-indent')) || 4,
        paragraphSpacing: parseFloat(getVal('style-input-spacing')) || 4,
        textColor: getVal('style-input-color-text') || '#1a1a1a',
        accentColor: getVal('style-input-color-accent') || '#8b1e1e',
        backgroundColor: getVal('style-input-color-bg') || '#ffffff',
        headerFontFamily: getVal('style-input-header-font'),
        headerFontSize: parseFloat(getVal('style-input-header-size')) || 13,
        separatorType: getVal('style-input-separator-type'),
        customSeparator: getVal('style-input-custom-separator') || '❖ ❖ ❖',
        choiceStyle: getVal('style-input-choice-style'),
        choicePrefix: getVal('style-input-choice-prefix') || '→ ',
        grayscaleImages: false,
        showRunningHeader: true,
        showPageNumbers: true,
    }
}

/**
 * Updates the preview box in the Style Editor modal based on current inputs.
 */
function updateLivePreview() {
    const previewContainer = document.getElementById('style-editor-preview-card')
    if (!previewContainer) return

    const s = readFormStyle()

    let sepSnippet = ''
    if (s.separatorType === 'ornament') {
        sepSnippet = `<div style="text-align:center; color:#777; margin: 10px 0; font-size:12px;">${escapeHtml(s.customSeparator)}</div>`
    } else if (s.separatorType === 'line') {
        sepSnippet = `<hr style="border:0; border-top: 1px solid #ddd; margin: 10px auto; width: 60%;" />`
    } else if (s.separatorType === 'page-break') {
        sepSnippet = `<div style="text-align:center; color:#999; margin: 8px 0; font-size:10px; border-bottom:1px dashed #ccc;">[ Podział strony ]</div>`
    } else {
        sepSnippet = `<div style="height: 14px;"></div>`
    }

    const choiceClass =
        s.choiceStyle === 'bold'
            ? 'font-bold'
            : s.choiceStyle === 'box'
              ? 'p-1.5 border border-zinc-300 rounded bg-zinc-50'
              : 'italic'

    previewContainer.style.backgroundColor = s.backgroundColor
    previewContainer.style.color = s.textColor
    previewContainer.style.fontFamily = s.fontFamily
    previewContainer.style.fontSize = `${s.fontSize * 1.25}px`
    previewContainer.style.lineHeight = s.lineHeight

    previewContainer.innerHTML = `
        <div style="font-family: ${s.headerFontFamily}; font-size: ${s.headerFontSize * 1.3}px; font-weight: bold; color: ${s.accentColor}; margin-bottom: 6px;">
            § 14
        </div>
        <p style="text-indent: ${s.paragraphIndent * 2}px; margin-bottom: ${s.paragraphSpacing * 1.5}px; text-align: justify;">
            Kroczysz kamiennym korytarzem starej twierdzy. Wilgotne powietrze niesie zapach dymu i stęchłej ziemi. W dali słychać cichy trzask gasnącej pochodni.
        </p>
        <div style="margin-top: 8px;">
            <div class="${choiceClass}" style="margin-bottom: 4px;">
                <span>${escapeHtml(s.choicePrefix)}</span>Jeśli zapalasz lampę oliwną, <strong style="color: ${s.accentColor};">idź do 32</strong>.
            </div>
            <div class="${choiceClass}">
                <span>${escapeHtml(s.choicePrefix)}</span>Jeśli skradasz się po ciemku, <strong style="color: ${s.accentColor};">idź do 5</strong>.
            </div>
        </div>
        ${sepSnippet}
        <div style="font-family: ${s.headerFontFamily}; font-size: ${s.headerFontSize * 1.3}px; font-weight: bold; color: ${s.accentColor}; margin-bottom: 6px;">
            § 15
        </div>
        <p style="text-indent: ${s.paragraphIndent * 2}px; margin-bottom: 4px; text-align: justify;">
            Otwierasz ciężkie okute wrota. Przed tobą rozpościera się widok na opuszczoną salę tronową...
        </p>
    `
}

function getVal(id) {
    const el = document.getElementById(id)
    return el ? el.value : ''
}

function setVal(id, val) {
    const el = document.getElementById(id)
    if (el) el.value = val
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
