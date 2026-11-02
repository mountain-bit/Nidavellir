import { toast } from '../../../dist/Utils/toast.js'
import { applyTranslations, getLanguage, setLanguage, t } from '../../../dist/Utils/translate.js'
import { ProjectManager } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { isAutoSaveEnabled, setAutoSaveEnabled, startAutoSave } from '../project/autoSaveService.js'
import { updateProjectNameUI } from '../project/projectStateTracker.js'

/**
 * Initializes and binds interactive controls in the Settings drawer panel:
 * - Application language selector
 * - Zoom sensitivity slider
 * - Auto-save toggle
 * - Graph grid toggle
 *
 * @param {object} appContext - Shared application context
 */
export function setupMainWindowSettings(appContext) {
    const vm = appContext.vm

    // 1. Language selector
    const langSelect = document.getElementById('settings-language-select')
    if (langSelect) {
        langSelect.value = getLanguage()
        langSelect.addEventListener('change', async () => {
            const newLang = langSelect.value
            await setLanguage(newLang)
            applyTranslations()

            const currentProj =
                typeof ProjectManager !== 'undefined'
                    ? ProjectManager.getInstance().getProject()
                    : null
            if (currentProj && typeof currentProj.getName === 'function' && currentProj.getName()) {
                updateProjectNameUI(currentProj.getName())
            } else {
                const titleEl = document.getElementById('project-name-display')
                const currentTitle = titleEl?.textContent?.trim()
                if (
                    !titleEl ||
                    titleEl.hasAttribute('data-i18n') ||
                    !currentTitle ||
                    currentTitle === t('topbar.project_placeholder')
                ) {
                    updateProjectNameUI('')
                }
            }

            if (typeof appContext.updateLeftDrawerUI === 'function') {
                appContext.updateLeftDrawerUI()
            }
            if (typeof appContext.renderFilterTags === 'function') appContext.renderFilterTags()
            if (typeof appContext.populateFilterSelects === 'function')
                appContext.populateFilterSelects()
            if (typeof appContext.renderParagraphsList === 'function')
                appContext.renderParagraphsList()
            if (typeof appContext.renderScenesList === 'function') appContext.renderScenesList()
            if (typeof appContext.renderConnectionsList === 'function')
                appContext.renderConnectionsList()
            if (typeof appContext.renderTagsList === 'function') appContext.renderTagsList()
            if (typeof appContext.renderCharactersList === 'function')
                appContext.renderCharactersList()
            if (typeof appContext.renderMainCharacter === 'function')
                appContext.renderMainCharacter()
            if (typeof appContext.renderLocationsList === 'function')
                appContext.renderLocationsList()
            if (typeof appContext.renderTraitsList === 'function') appContext.renderTraitsList()
            if (typeof appContext.renderHistoryBar === 'function') appContext.renderHistoryBar()
            if (typeof appContext.renderDetailsPanel === 'function') appContext.renderDetailsPanel()
            if (typeof appContext.updateMainWorkspaceUI === 'function')
                appContext.updateMainWorkspaceUI()
        })
    }

    // 2. Zoom sensitivity slider
    const zoomSensSlider = document.getElementById('settings-zoom-sensitivity')
    const zoomSensValue = document.getElementById('settings-zoom-sensitivity-value')
    if (zoomSensSlider && vm?.layout) {
        const currentSens = vm.layout.getZoomSensitivity()
        zoomSensSlider.value = String(currentSens)
        if (zoomSensValue) {
            zoomSensValue.textContent = `${Math.round(currentSens * 100)}%`
        }
        zoomSensSlider.addEventListener('input', () => {
            const val = parseFloat(zoomSensSlider.value)
            vm.layout.setZoomSensitivity(val)
            const sg = appContext.storyGraphInstance
            if (sg && typeof sg.setWheelSensitivity === 'function') {
                sg.setWheelSensitivity(val)
            }
            if (zoomSensValue) {
                zoomSensValue.textContent = `${Math.round(val * 100)}%`
            }
        })
    }

    // 3. Auto-save toggle
    const autoSaveCheckbox = document.getElementById('settings-auto-save')
    if (autoSaveCheckbox) {
        autoSaveCheckbox.checked = isAutoSaveEnabled()
        autoSaveCheckbox.addEventListener('change', () => {
            const enabled = autoSaveCheckbox.checked
            setAutoSaveEnabled(enabled, appContext)
            const title =
                typeof t === 'function' && t('toast.auto_save_title') !== 'toast.auto_save_title'
                    ? t('toast.auto_save_title')
                    : 'Auto-zapis'
            const msg = enabled
                ? typeof t === 'function' &&
                  t('toast.auto_save_enabled') !== 'toast.auto_save_enabled'
                    ? t('toast.auto_save_enabled')
                    : 'Włączono automatyczny zapis w tle.'
                : typeof t === 'function' &&
                    t('toast.auto_save_disabled') !== 'toast.auto_save_disabled'
                  ? t('toast.auto_save_disabled')
                  : 'Wyłączono automatyczny zapis w tle.'
            toast.info(msg, title)
        })
    }

    // 4. Graph grid display toggle
    const showGridCheckbox = document.getElementById('settings-show-grid')
    const gridSvg = document.getElementById('graph-grid-svg')
    if (showGridCheckbox && gridSvg) {
        const savedGridPref = localStorage.getItem('gamebook_setting_show_grid')
        const isGridVisible = savedGridPref !== null ? savedGridPref === 'true' : true
        showGridCheckbox.checked = isGridVisible
        gridSvg.classList.toggle('hidden', !isGridVisible)

        showGridCheckbox.addEventListener('change', () => {
            const visible = showGridCheckbox.checked
            localStorage.setItem('gamebook_setting_show_grid', String(visible))
            gridSvg.classList.toggle('hidden', !visible)
        })
    }

    // 5. Start background auto-save loop if enabled
    if (isAutoSaveEnabled()) {
        startAutoSave(appContext)
    }
}
