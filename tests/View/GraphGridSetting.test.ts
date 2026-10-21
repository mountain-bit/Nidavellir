// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

describe('Graph Grid Setting (settings-show-grid toggle)', () => {
    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = `
            <div id="story-graph-wrapper">
                <svg id="graph-grid-svg" class="absolute inset-0 w-full h-full pointer-events-none"></svg>
            </div>
            <input type="checkbox" id="settings-show-grid" checked />
        `
    })

    function initGridSetting(): void {
        const showGridCheckbox = document.getElementById(
            'settings-show-grid'
        ) as HTMLInputElement | null
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
    }

    it('domyślnie siatka jest włączona i widoczna', () => {
        initGridSetting()
        const checkbox = document.getElementById('settings-show-grid') as HTMLInputElement
        const gridSvg = document.getElementById('graph-grid-svg')!

        expect(checkbox.checked).toBe(true)
        expect(gridSvg.classList.contains('hidden')).toBe(false)
    })

    it('odznaczenie checkboxa ukrywa siatkę i zapisuje false w localStorage', () => {
        initGridSetting()
        const checkbox = document.getElementById('settings-show-grid') as HTMLInputElement
        const gridSvg = document.getElementById('graph-grid-svg')!

        checkbox.checked = false
        checkbox.dispatchEvent(new Event('change'))

        expect(gridSvg.classList.contains('hidden')).toBe(true)
        expect(localStorage.getItem('gamebook_setting_show_grid')).toBe('false')
    })

    it('ponowne zaznaczenie checkboxa przywraca siatkę i zapisuje true w localStorage', () => {
        initGridSetting()
        const checkbox = document.getElementById('settings-show-grid') as HTMLInputElement
        const gridSvg = document.getElementById('graph-grid-svg')!

        checkbox.checked = false
        checkbox.dispatchEvent(new Event('change'))
        expect(gridSvg.classList.contains('hidden')).toBe(true)

        checkbox.checked = true
        checkbox.dispatchEvent(new Event('change'))
        expect(gridSvg.classList.contains('hidden')).toBe(false)
        expect(localStorage.getItem('gamebook_setting_show_grid')).toBe('true')
    })

    it('inicjalizacja odczytuje zapisaną wartość false z localStorage', () => {
        localStorage.setItem('gamebook_setting_show_grid', 'false')
        initGridSetting()

        const checkbox = document.getElementById('settings-show-grid') as HTMLInputElement
        const gridSvg = document.getElementById('graph-grid-svg')!

        expect(checkbox.checked).toBe(false)
        expect(gridSvg.classList.contains('hidden')).toBe(true)
    })
})
