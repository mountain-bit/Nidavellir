import {
    CustomFontsService,
    CustomStylesService,
    getFontFamilyCss,
} from '../../../dist/Modules/Editor/index.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { setupFontBrowserUI } from './fontBrowserModal.js'

/**
 * Persists custom styles and fonts to project.json via electronAPI.
 *
 * @param {object} ctx Application UI Context
 */
export async function persistStylesAndFonts(ctx) {
    const projectPath = window.currentProjectPath || ctx?.projectPath || ctx?.projectData?.path
    if (projectPath && window.electronAPI && typeof window.electronAPI.saveProject === 'function') {
        try {
            await window.electronAPI.saveProject(projectPath, {
                editor: {
                    customStyles: CustomStylesService.getStyles(ctx?.projectData),
                    customFonts: CustomFontsService.getFonts(ctx?.projectData),
                },
                customStyles: CustomStylesService.getStyles(ctx?.projectData),
                customFonts: CustomFontsService.getFonts(ctx?.projectData),
            })
        } catch (err) {
            console.warn('Failed to persist editor styles/fonts:', err)
        }
    }
}

/**
 * Sets up custom text style creation/editing modal dialog.
 *
 * @param {object} ctx Application UI Context
 * @param {{ onStyleSaved?: (style: object) => void, onStyleDeleted?: (id: string) => void }} callbacks
 * @returns {{ openModal: (styleToEdit?: object | null) => void, closeModal: () => void }}
 */
export function setupCustomStyleModal(ctx, { onStyleSaved, onStyleDeleted } = {}) {
    const modal = document.getElementById('custom-style-modal')
    const form = document.getElementById('custom-style-form')
    const closeBtn = document.getElementById('btn-close-custom-style-modal')
    const cancelBtn = document.getElementById('btn-cancel-custom-style-modal')
    const deleteBtn = document.getElementById('btn-delete-custom-style')
    const modalTitle = document.getElementById('custom-style-modal-title')

    const idInput = document.getElementById('custom-style-id')
    const nameInput = document.getElementById('custom-style-name')
    const colorPicker = document.getElementById('custom-style-color-picker')
    const bgEnabled = document.getElementById('custom-style-bg-enabled')
    const bgControls = document.getElementById('custom-style-bg-controls')
    const bgColorPicker = document.getElementById('custom-style-bg-color-picker')
    const italicCb = document.getElementById('custom-style-italic')
    const boldCb = document.getElementById('custom-style-bold')
    const underlineCb = document.getElementById('custom-style-underline')
    const borderCb = document.getElementById('custom-style-border')
    const fontFamilySelect = document.getElementById('custom-style-font-family')
    const toggleAddFontBtn = document.getElementById('btn-toggle-add-font-form')
    const addFontInlineForm = document.getElementById('add-font-inline-form')
    const closeAddFontBtn = document.getElementById('btn-close-add-font-form')
    const newFontInput = document.getElementById('new-font-name-input')
    const confirmAddFontBtn = document.getElementById('btn-confirm-add-font')
    const presetFontBtns = document.querySelectorAll('[data-preset-font]')
    const livePreview = document.getElementById('custom-style-live-preview')
    const quickColors = document.querySelectorAll('#custom-style-quick-colors button')
    const openFontBrowserBtn = document.getElementById('btn-open-font-browser')
    const quickBrowseBtn = document.getElementById('btn-trigger-font-browser-icon')

    const populateFontSelect = (selectedFont = 'sans') => {
        if (!fontFamilySelect) return
        fontFamilySelect.innerHTML = ''

        const standardGroup = document.createElement('optgroup')
        standardGroup.label = t('editor.styles.font_standard_group')

        const optSans = document.createElement('option')
        optSans.value = 'sans'
        optSans.textContent = t('editor.styles.font_default')
        standardGroup.appendChild(optSans)

        const optSerif = document.createElement('option')
        optSerif.value = 'serif'
        optSerif.textContent = t('editor.styles.font_serif')
        standardGroup.appendChild(optSerif)

        const optMono = document.createElement('option')
        optMono.value = 'mono'
        optMono.textContent = t('editor.styles.font_mono')
        standardGroup.appendChild(optMono)

        fontFamilySelect.appendChild(standardGroup)

        const fonts = CustomFontsService.getFonts(ctx?.projectData)
        CustomFontsService.loadAllFonts(ctx?.projectData)

        const customGroup = document.createElement('optgroup')
        customGroup.label = t('editor.styles.font_custom_group')

        fonts.forEach(f => {
            const opt = document.createElement('option')
            opt.value = f.name
            opt.textContent = f.category ? `${f.name} (${f.category})` : f.name
            customGroup.appendChild(opt)
        })

        fontFamilySelect.appendChild(customGroup)
        fontFamilySelect.value = selectedFont || 'sans'
    }

    const updatePreview = () => {
        if (!livePreview) return
        livePreview.style.color = colorPicker?.value || '#c084fc'
        if (bgEnabled?.checked && bgColorPicker?.value) {
            livePreview.style.backgroundColor = bgColorPicker.value
            livePreview.style.padding = '0.15em 0.5em'
            livePreview.style.borderRadius = '0.25rem'
        } else {
            livePreview.style.backgroundColor = 'transparent'
            livePreview.style.padding = '0'
        }
        livePreview.style.fontStyle = italicCb?.checked ? 'italic' : 'normal'
        livePreview.style.fontWeight = boldCb?.checked ? '700' : '400'
        livePreview.style.textDecoration = underlineCb?.checked ? 'underline' : 'none'
        if (borderCb?.checked) {
            livePreview.style.border = `1px solid ${colorPicker?.value || '#52525b'}`
            livePreview.style.borderRadius = '0.25rem'
            livePreview.style.padding = '0.1em 0.4em'
        } else if (!bgEnabled?.checked) {
            livePreview.style.border = 'none'
        }
        const font = fontFamilySelect?.value
        if (font && font !== 'sans' && font !== 'serif' && font !== 'mono') {
            CustomFontsService.loadFont(font)
        }
        livePreview.style.fontFamily = getFontFamilyCss(font)
    }

    const handleAddFont = fontName => {
        const clean = (fontName || '').trim()
        if (!clean) {
            toast.error(t('editor.styles.toast_error_font_name'), t('toast.error_title'))
            newFontInput?.focus()
            return
        }
        CustomFontsService.addFont(ctx?.projectData, clean)
        populateFontSelect(clean)
        addFontInlineForm?.classList.add('hidden')
        if (newFontInput) newFontInput.value = ''
        updatePreview()
        toast.success(
            t('editor.styles.toast_font_added', { name: clean }),
            t('editor.styles.font_label')
        )
        persistStylesAndFonts(ctx)
    }

    const fontBrowser = setupFontBrowserUI(ctx, fontName => {
        handleAddFont(fontName)
    })

    openFontBrowserBtn?.addEventListener('click', () => {
        fontBrowser?.open()
    })

    quickBrowseBtn?.addEventListener('click', () => {
        fontBrowser?.open()
    })

    toggleAddFontBtn?.addEventListener('click', () => {
        addFontInlineForm?.classList.toggle('hidden')
        if (!addFontInlineForm?.classList.contains('hidden')) {
            newFontInput?.focus()
        }
    })

    closeAddFontBtn?.addEventListener('click', () => {
        addFontInlineForm?.classList.add('hidden')
    })

    confirmAddFontBtn?.addEventListener('click', () => {
        handleAddFont(newFontInput?.value)
    })

    newFontInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddFont(newFontInput?.value)
        }
    })

    presetFontBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const font = btn.getAttribute('data-preset-font')
            if (font) {
                handleAddFont(font)
            }
        })
    })

    const openModal = styleToEdit => {
        if (!modal) return
        if (styleToEdit) {
            if (modalTitle) modalTitle.textContent = t('editor.styles.modal_title_edit')
            if (idInput) idInput.value = styleToEdit.id
            if (nameInput) nameInput.value = styleToEdit.name || ''
            if (colorPicker) colorPicker.value = styleToEdit.color || '#c084fc'
            if (bgEnabled) bgEnabled.checked = Boolean(styleToEdit.backgroundColor)
            if (bgControls) {
                if (styleToEdit.backgroundColor) {
                    bgControls.classList.remove('hidden')
                    if (bgColorPicker) bgColorPicker.value = styleToEdit.backgroundColor
                } else {
                    bgControls.classList.add('hidden')
                }
            }
            if (italicCb) italicCb.checked = Boolean(styleToEdit.italic)
            if (boldCb) boldCb.checked = Boolean(styleToEdit.bold)
            if (underlineCb) underlineCb.checked = Boolean(styleToEdit.underline)
            if (borderCb) borderCb.checked = Boolean(styleToEdit.border)
            populateFontSelect(styleToEdit.fontFamily || 'sans')
            if (deleteBtn) deleteBtn.classList.remove('hidden')
        } else {
            if (modalTitle) modalTitle.textContent = t('editor.styles.modal_title_new')
            if (idInput) idInput.value = ''
            if (nameInput) nameInput.value = ''
            if (colorPicker) colorPicker.value = '#c084fc'
            if (bgEnabled) bgEnabled.checked = false
            if (bgControls) bgControls.classList.add('hidden')
            if (italicCb) italicCb.checked = false
            if (boldCb) boldCb.checked = false
            if (underlineCb) underlineCb.checked = false
            if (borderCb) borderCb.checked = false
            populateFontSelect('sans')
            if (deleteBtn) deleteBtn.classList.add('hidden')
        }
        if (addFontInlineForm) addFontInlineForm.classList.add('hidden')
        modal.classList.remove('hidden')
        updatePreview()
        setTimeout(() => nameInput?.focus(), 50)
    }

    const closeModal = () => {
        if (modal) modal.classList.add('hidden')
    }

    // Modal input listeners
    ;[
        colorPicker,
        bgColorPicker,
        italicCb,
        boldCb,
        underlineCb,
        borderCb,
        fontFamilySelect,
    ].forEach(el => {
        el?.addEventListener('input', updatePreview)
        el?.addEventListener('change', updatePreview)
    })

    bgEnabled?.addEventListener('change', () => {
        if (bgEnabled.checked) {
            bgControls?.classList.remove('hidden')
        } else {
            bgControls?.classList.add('hidden')
        }
        updatePreview()
    })

    quickColors.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = btn.getAttribute('data-color')
            if (color && colorPicker) {
                colorPicker.value = color
                updatePreview()
            }
        })
    })

    closeBtn?.addEventListener('click', closeModal)
    cancelBtn?.addEventListener('click', closeModal)

    form?.addEventListener('submit', e => {
        e.preventDefault()
        const nameVal = nameInput?.value.trim()
        if (!nameVal) {
            toast.error(t('editor.styles.toast_error_name'), t('toast.error_title'))
            nameInput?.focus()
            return
        }

        const idVal =
            idInput?.value ||
            `style_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
        const styleObj = {
            id: idVal,
            name: nameVal,
            color: colorPicker?.value || '#c084fc',
            backgroundColor: bgEnabled?.checked ? bgColorPicker?.value : undefined,
            italic: Boolean(italicCb?.checked),
            bold: Boolean(boldCb?.checked),
            underline: Boolean(underlineCb?.checked),
            border: Boolean(borderCb?.checked),
            fontFamily: fontFamilySelect?.value || 'sans',
        }

        CustomStylesService.saveStyle(ctx?.projectData, styleObj)
        if (typeof onStyleSaved === 'function') {
            onStyleSaved(styleObj)
        }
        closeModal()
        toast.success(
            t('editor.styles.toast_saved', { name: styleObj.name }),
            t('editor.toolbar.styles_label')
        )
        persistStylesAndFonts(ctx)
    })

    deleteBtn?.addEventListener('click', () => {
        const idVal = idInput?.value
        if (!idVal) return
        CustomStylesService.deleteStyle(ctx?.projectData, idVal)
        if (typeof onStyleDeleted === 'function') {
            onStyleDeleted(idVal)
        }
        closeModal()
        toast.info(t('editor.styles.toast_deleted'), t('editor.toolbar.styles_label'))
        persistStylesAndFonts(ctx)
    })

    return {
        openModal,
        closeModal,
    }
}
