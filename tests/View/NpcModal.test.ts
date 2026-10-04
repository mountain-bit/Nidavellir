// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { applyTranslations, initTranslationsWithLocale, setLanguage } from '../../Utils/translate'
import {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcTag,
    addNpcVital,
    clearCustomAttributes,
    clearNpcSkills,
    clearNpcStats,
    clearNpcTags,
    clearNpcVitals,
    closeNpcModal,
    confirmCustomAttribute,
    confirmNpcSkill,
    confirmNpcStat,
    confirmNpcVital,
    editCustomAttribute,
    editNpcSkill,
    editNpcStat,
    editNpcVital,
    evaluateFormula,
    getAvailableStatNames,
    getCustomAttributes,
    getModalMode,
    getNpcDescription,
    getNpcName,
    getNpcSkills,
    getNpcStats,
    getNpcSummary,
    getNpcTags,
    getNpcVitals,
    getSelectedAvatarId,
    isDescriptionDrawerOpen,
    openNpcModal,
    openNpcTemplateModal,
    parseStatValueAsNumber,
    removeCustomAttribute,
    removeNpcSkill,
    removeNpcStat,
    removeNpcVital,
    renderDynamicSuggestions,
    resetNpcModalForm,
    saveNpcCharacter,
    saveNpcTemplate,
    setCustomAttributes,
    setModalMode,
    setNpcDescription,
    setNpcName,
    setNpcSkills,
    setNpcStats,
    setNpcSummary,
    setNpcVitals,
    setSelectedAvatarId,
    setupNpcModal,
    toggleDescriptionDrawer,
    updateSkillStatDropdowns,
    updateVitalFormulasPreview,
} from '../../View/ui/npcModal.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('NpcModal Floating Window Controller', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-add-character">
                <span>+</span>
                <span>Dodaj</span>
            </button>
            <button id="btn-add-template">
                <span>+ Szablon</span>
            </button>
            <button data-action="open-npc-modal">Otwórz modal</button>
            <button data-action="open-npc-template-modal">Otwórz szablon</button>

            <div id="npc-create-modal" class="hidden fixed" style="left: 100px; top: 100px; width: 520px; height: 380px;">
                <div id="npc-create-modal-header">
                    <h2 id="npc-create-modal-title">
                        <span>Karta Postaci NPC</span>
                        <span>Folio</span>
                    </h2>
                    <p>Tworzenie i personalizacja bohatera niezależnego</p>
                    <button id="btn-close-npc-modal">Zamknij</button>
                </div>
                <div id="npc-window-content-row">
                    <div id="npc-form-column">
                        <div id="npc-create-modal-body">
                            <form id="npc-create-modal-form">
                                <button id="btn-npc-avatar-trigger" type="button">
                                    <div id="npc-selected-avatar-preview"></div>
                                </button>
                                <input type="text" id="npc-name-input" />
                                <div id="npc-avatar-picker-popover" class="hidden">
                                    <div id="npc-avatar-grid"></div>
                                </div>
                                <textarea id="npc-summary-input"></textarea>

                                <div id="npc-custom-attributes-section">
                                    <button id="btn-add-custom-attribute" type="button">Dodaj pole</button>
                                    <div id="npc-suggested-attributes-container">
                                        <div id="npc-suggested-attributes"></div>
                                    </div>
                                    <div id="npc-custom-attributes-list"></div>
                                    <div id="npc-custom-attributes-empty">Brak atrybutów</div>
                                </div>

                                <div id="npc-tags-section">
                                    <button id="btn-add-npc-tag" type="button">Dodaj tag</button>
                                    <div id="npc-tag-picker-popover" class="hidden">
                                        <input type="text" id="npc-tag-search-input" />
                                        <div id="npc-available-tags-list"></div>
                                        <div id="npc-create-tag-action" class="hidden">
                                            <span id="npc-new-tag-preview-name"></span>
                                            <button type="button" id="btn-create-new-npc-tag">+ Utwórz</button>
                                        </div>
                                    </div>
                                    <div id="npc-suggested-tags-container">
                                        <div id="npc-suggested-tags"></div>
                                    </div>
                                    <div id="npc-tags-list"></div>
                                    <div id="npc-tags-empty">Brak przypisanych tagów.</div>
                                </div>

                                <div id="npc-stats-section">
                                    <button id="btn-add-npc-stat" type="button">Dodaj cechę</button>
                                    <div id="npc-suggested-stats-container">
                                        <div id="npc-suggested-stats"></div>
                                    </div>
                                    <div id="npc-stats-list"></div>
                                    <div id="npc-stats-empty">Brak cech</div>
                                </div>

                                <div id="npc-skills-section">
                                    <button id="btn-add-npc-skill" type="button">Dodaj umiejętność</button>
                                    <div id="npc-suggested-skills-container">
                                        <div id="npc-suggested-skills"></div>
                                    </div>
                                    <div id="npc-skills-list"></div>
                                    <div id="npc-skills-empty">Brak umiejętności</div>
                                </div>

                                <div id="npc-vitals-section">
                                    <button id="btn-add-npc-vital" type="button">Dodaj parametr</button>
                                    <div id="npc-suggested-vitals-container">
                                        <div id="npc-suggested-vitals"></div>
                                    </div>
                                    <div id="npc-vitals-list"></div>
                                    <div id="npc-vitals-empty">Brak parametrów</div>
                                </div>

                                <div id="npc-create-error-message" class="hidden">
                                    <span id="npc-create-error-text">Nazwa postaci jest wymagana</span>
                                </div>

                                <div id="npc-create-modal-footer">
                                    <button type="button" id="btn-cancel-npc-modal">Anuluj</button>
                                    <button type="submit" id="btn-save-npc-modal">
                                        <span id="npc-modal-submit-text">Utwórz postać</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <button id="btn-toggle-npc-description" type="button">
                        <span id="npc-desc-toggle-arrow">›</span>
                        <span>Opis</span>
                    </button>
                    <div id="npc-description-drawer" class="hidden" style="width: 380px;">
                        <div id="npc-description-editor-slot">
                            <textarea id="npc-description-textarea"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `
    })

    it('otwiera pływające okienko po kliknięciu w przycisk btn-add-character', () => {
        const modal = document.getElementById('npc-create-modal')!
        const btnAdd = document.getElementById('btn-add-character')!

        setupNpcModal()

        expect(modal.classList.contains('hidden')).toBe(true)

        btnAdd.click()
        expect(modal.classList.contains('hidden')).toBe(false)
    })

    it('otwiera okienko po kliknięciu przycisku z data-action="open-npc-modal"', () => {
        const modal = document.getElementById('npc-create-modal')!
        const actionBtn = document.querySelector(
            '[data-action="open-npc-modal"]'
        ) as HTMLButtonElement

        setupNpcModal()

        expect(modal.classList.contains('hidden')).toBe(true)

        actionBtn.click()
        expect(modal.classList.contains('hidden')).toBe(false)
    })

    it('zamyka okienko po kliknięciu w przycisk zamknięcia (btn-close-npc-modal)', () => {
        const modal = document.getElementById('npc-create-modal')!
        const btnClose = document.getElementById('btn-close-npc-modal')!

        setupNpcModal()
        openNpcModal()
        expect(modal.classList.contains('hidden')).toBe(false)

        btnClose.click()
        expect(modal.classList.contains('hidden')).toBe(true)
    })

    it('zamyka okienko po wciśnięciu klawisza Escape', () => {
        const modal = document.getElementById('npc-create-modal')!

        setupNpcModal()
        openNpcModal()
        expect(modal.classList.contains('hidden')).toBe(false)

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        expect(modal.classList.contains('hidden')).toBe(true)
    })

    it('otwiera i zamyka okienko poprawnie przez wywołanie openNpcModal i closeNpcModal', () => {
        const modal = document.getElementById('npc-create-modal')!
        setupNpcModal()

        expect(modal.classList.contains('hidden')).toBe(true)
        openNpcModal()
        expect(modal.classList.contains('hidden')).toBe(false)
        closeNpcModal()
        expect(modal.classList.contains('hidden')).toBe(true)
    })

    it('czyści i resetuje wszystkie pola i stan po zamknięciu i ponownym otwarciu okna', () => {
        setupNpcModal()

        openNpcModal()
        setNpcName('Tymczasowy Rycerz')
        setNpcSummary('Krótkie podsumowanie rycerza')
        setNpcDescription('Szczegółowy opis fabularny')
        addCustomAttribute('Gildia', 'Czarne Tarcze')
        addNpcStat('Siła', '18')
        addNpcSkill('Miecz', 'direct', '+5')
        addNpcVital('Zdrowie', 'direct', '100')
        addNpcTag('Rycerz')
        setSelectedAvatarId('paladin')

        expect(getNpcName()).toBe('Tymczasowy Rycerz')
        expect(getCustomAttributes()).toHaveLength(1)
        expect(getNpcStats()).toHaveLength(1)
        expect(getNpcSkills()).toHaveLength(1)
        expect(getNpcVitals()).toHaveLength(1)
        expect(getNpcTags()).toHaveLength(1)
        expect(getSelectedAvatarId()).toBe('paladin')

        // Zamknięcie okna (np. przycisk X lub Escape lub closeNpcModal)
        closeNpcModal()

        // Wszystkie pola powinny być wyczyszczone
        expect(getNpcName()).toBe('')
        expect(getNpcSummary()).toBe('')
        expect(getNpcDescription()).toBe('')
        expect(getCustomAttributes()).toHaveLength(0)
        expect(getNpcStats()).toHaveLength(0)
        expect(getNpcSkills()).toHaveLength(0)
        expect(getNpcVitals()).toHaveLength(0)
        expect(getNpcTags()).toHaveLength(0)
        expect(getSelectedAvatarId()).toBe('warrior')

        // Ponowne otwarcie okna - formularz jest w 100% czysty
        openNpcModal()
        expect(getNpcName()).toBe('')
        expect(getCustomAttributes()).toHaveLength(0)
        expect(getNpcStats()).toHaveLength(0)
    })

    it('Escape najpierw zamyka popover wyboru awatara, a dopiero potem całe okienko', () => {
        const modal = document.getElementById('npc-create-modal')!
        const popover = document.getElementById('npc-avatar-picker-popover')!
        const trigger = document.getElementById('btn-npc-avatar-trigger')!

        setupNpcModal()
        openNpcModal()

        trigger.click()
        expect(popover.classList.contains('hidden')).toBe(false)

        // First escape closes popover
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        expect(popover.classList.contains('hidden')).toBe(true)
        expect(modal.classList.contains('hidden')).toBe(false)

        // Second escape closes modal
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        expect(modal.classList.contains('hidden')).toBe(true)
    })

    it('umożliwia przesuwanie (drag & drop) okienka poprzez nagłówek', () => {
        const modal = document.getElementById('npc-create-modal')!
        const header = document.getElementById('npc-create-modal-header')!

        setupNpcModal()
        openNpcModal()

        modal.getBoundingClientRect = (): DOMRect =>
            ({
                left: 100,
                top: 100,
                width: 500,
                height: 300,
                right: 600,
                bottom: 400,
                x: 100,
                y: 100,
                toJSON: () => {},
            }) as DOMRect

        // Start drag on header
        header.dispatchEvent(
            new MouseEvent('mousedown', {
                bubbles: true,
                clientX: 120,
                clientY: 110,
                button: 0,
            })
        )

        // Move mouse
        document.dispatchEvent(
            new MouseEvent('mousemove', {
                clientX: 220, // +100px
                clientY: 180, // +70px
            })
        )

        expect(modal.style.left).toBe('200px')
        expect(modal.style.top).toBe('170px')

        // Release mouse
        document.dispatchEvent(new MouseEvent('mouseup'))

        // Further mousemove should not move the window
        document.dispatchEvent(
            new MouseEvent('mousemove', {
                clientX: 400,
                clientY: 400,
            })
        )
        expect(modal.style.left).toBe('200px')
        expect(modal.style.top).toBe('170px')
    })

    it('nie rozpoczyna przeciągania po kliknięciu w przycisk zamknięcia w nagłówku', () => {
        const modal = document.getElementById('npc-create-modal')!
        const btnClose = document.getElementById('btn-close-npc-modal')!

        setupNpcModal()
        openNpcModal()

        modal.style.left = '100px'
        modal.style.top = '100px'

        btnClose.dispatchEvent(
            new MouseEvent('mousedown', {
                bubbles: true,
                clientX: 120,
                clientY: 110,
                button: 0,
            })
        )

        document.dispatchEvent(
            new MouseEvent('mousemove', {
                clientX: 300,
                clientY: 300,
            })
        )

        expect(modal.style.left).toBe('100px')
        expect(modal.style.top).toBe('100px')
    })

    it('renderuje siatkę awatarów klas fantasy i umożliwia wybór klasy', () => {
        setupNpcModal()

        const grid = document.getElementById('npc-avatar-grid')!
        const preview = document.getElementById('npc-selected-avatar-preview')!
        const popover = document.getElementById('npc-avatar-picker-popover')!
        const trigger = document.getElementById('btn-npc-avatar-trigger')!

        // 10 archetype cards rendered
        const cards = grid.querySelectorAll<HTMLButtonElement>('[data-avatar-id]')
        expect(cards.length).toBe(10)

        // Default is warrior
        expect(getSelectedAvatarId()).toBe('warrior')
        expect(preview.innerHTML).toContain('<svg')

        // Open popover
        trigger.click()
        expect(popover.classList.contains('hidden')).toBe(false)

        // Select 'mage'
        const mageBtn = grid.querySelector<HTMLButtonElement>('[data-avatar-id="mage"]')!
        expect(mageBtn).not.toBeNull()
        mageBtn.click()

        expect(getSelectedAvatarId()).toBe('mage')
        expect(popover.classList.contains('hidden')).toBe(true)

        // Change programmatically to 'rogue'
        setSelectedAvatarId('rogue')
        expect(getSelectedAvatarId()).toBe('rogue')
    })

    it('obsługuje zwijanie i rozwijanie bocznego panelu opisu narracyjnego ze zmianą strzałki i poszerzaniem okna', () => {
        setupNpcModal()

        const modal = document.getElementById('npc-create-modal')!
        const drawer = document.getElementById('npc-description-drawer')!
        const arrow = document.getElementById('npc-desc-toggle-arrow')!
        const btnToggle = document.getElementById('btn-toggle-npc-description')!

        expect(isDescriptionDrawerOpen()).toBe(false)
        expect(drawer.classList.contains('hidden')).toBe(true)
        expect(arrow.textContent).toBe('›')
        expect(modal.style.width).toBe('520px')

        // Toggle open - expands window
        btnToggle.click()
        expect(isDescriptionDrawerOpen()).toBe(true)
        expect(drawer.classList.contains('hidden')).toBe(false)
        expect(arrow.textContent).toBe('‹')
        expect(modal.style.width).toBe('900px')

        // Toggle closed - restores window width
        btnToggle.click()
        expect(isDescriptionDrawerOpen()).toBe(false)
        expect(drawer.classList.contains('hidden')).toBe(true)
        expect(arrow.textContent).toBe('›')
        expect(modal.style.width).toBe('520px')

        // Force open via helper
        toggleDescriptionDrawer(true)
        expect(isDescriptionDrawerOpen()).toBe(true)
        expect(arrow.textContent).toBe('‹')
        expect(modal.style.width).toBe('900px')

        // Force closed via helper
        toggleDescriptionDrawer(false)
        expect(isDescriptionDrawerOpen()).toBe(false)
        expect(arrow.textContent).toBe('›')
        expect(modal.style.width).toBe('520px')
    })

    it('obsługuje pobieranie i ustawianie nazwy, streszczenia oraz opisu NPC', () => {
        setupNpcModal()

        expect(getNpcName()).toBe('')
        expect(getNpcSummary()).toBe('')
        expect(getNpcDescription()).toBe('')

        setNpcName('  Mistrz Elion  ')
        expect(getNpcName()).toBe('Mistrz Elion')

        setNpcSummary('Potężny mędrzec i doradca króla.')
        expect(getNpcSummary()).toBe('Potężny mędrzec i doradca króla.')

        setNpcDescription('# Arcymag wieży\nPotężny czarodziej.')
        expect(getNpcDescription()).toBe('# Arcymag wieży\nPotężny czarodziej.')

        resetNpcModalForm()
        expect(getNpcName()).toBe('')
        expect(getNpcSummary()).toBe('')
        expect(getNpcDescription()).toBe('')
        expect(getSelectedAvatarId()).toBe('warrior')
    })

    it('dodaje własny atrybut po kliknięciu przycisku btn-add-custom-attribute', () => {
        setupNpcModal()

        const btnAdd = document.getElementById('btn-add-custom-attribute')!
        const list = document.getElementById('npc-custom-attributes-list')!
        const emptyNotice = document.getElementById('npc-custom-attributes-empty')!

        expect(list.children.length).toBe(0)
        expect(emptyNotice.classList.contains('hidden')).toBe(false)

        btnAdd.click()

        expect(list.children.length).toBe(1)
        expect(emptyNotice.classList.contains('hidden')).toBe(true)
        expect(getCustomAttributes().length).toBe(1)
    })

    it('dodaje atrybut z predefiniowaną nazwą po kliknięciu chipu sugestii (np. Rasa, Zawód)', () => {
        setupNpcModal({
            projectFeatures: [new Feature('f-1', 'Rasa')],
        })

        const list = document.getElementById('npc-custom-attributes-list')!
        const raceChip = document.querySelector(
            '.npc-preset-chip[data-preset-name="Rasa"]'
        ) as HTMLButtonElement

        expect(raceChip).not.toBeNull()
        raceChip.click()

        expect(list.children.length).toBe(1)
        const nameInput = list.querySelector('[data-attr-field="name"]') as HTMLInputElement
        expect(nameInput.value).toBe('Rasa')
        expect(getCustomAttributes()[0].name).toBe('Rasa')
    })

    it('usuwa atrybut po kliknięciu przycisku usuwania oraz przez removeCustomAttribute', () => {
        setupNpcModal()

        const btnAdd = document.getElementById('btn-add-custom-attribute')!
        const list = document.getElementById('npc-custom-attributes-list')!
        const emptyNotice = document.getElementById('npc-custom-attributes-empty')!

        btnAdd.click()
        expect(list.children.length).toBe(1)

        const removeBtn = list.querySelector(
            '[data-action="remove-attribute"]'
        ) as HTMLButtonElement
        expect(removeBtn).not.toBeNull()
        removeBtn.click()

        expect(list.children.length).toBe(0)
        expect(emptyNotice.classList.contains('hidden')).toBe(false)
        expect(getCustomAttributes().length).toBe(0)

        // Programmatic removal
        const attrId = addCustomAttribute('TestAttr', 'TestVal')
        expect(getCustomAttributes().length).toBe(1)
        removeCustomAttribute(attrId)
        expect(getCustomAttributes().length).toBe(0)
    })

    it('aktualizuje stan getCustomAttributes po wpisaniu nazwy i wartości w polach formularza', () => {
        setupNpcModal()

        addCustomAttribute('Profesja', '')
        const list = document.getElementById('npc-custom-attributes-list')!

        const nameInput = list.querySelector('[data-attr-field="name"]') as HTMLInputElement
        const valInput = list.querySelector('[data-attr-field="value"]') as HTMLInputElement

        nameInput.value = 'Zawód'
        nameInput.dispatchEvent(new Event('input', { bubbles: true }))

        valInput.value = 'Kowal'
        valInput.dispatchEvent(new Event('input', { bubbles: true }))

        const attrs = getCustomAttributes()
        expect(attrs.length).toBe(1)
        expect(attrs[0]).toEqual({ name: 'Zawód', value: 'Kowal' })
    })

    it('setCustomAttributes oraz clearCustomAttributes poprawnie modyfikują listę', () => {
        setupNpcModal()

        setCustomAttributes([
            { name: 'Rasa', value: 'Elf' },
            { name: 'Rola', value: 'Przewodnik' },
        ])

        const list = document.getElementById('npc-custom-attributes-list')!
        expect(list.children.length).toBe(2)
        expect(getCustomAttributes()).toEqual([
            { name: 'Rasa', value: 'Elf' },
            { name: 'Rola', value: 'Przewodnik' },
        ])

        clearCustomAttributes()
        expect(list.children.length).toBe(0)
        expect(getCustomAttributes().length).toBe(0)
    })

    it('resetNpcModalForm czyści również dodane atrybuty, cechy i umiejętności', () => {
        setupNpcModal()

        addCustomAttribute('Frakcja', 'Zakon Cienia')
        addNpcStat('Siła', '14')
        addNpcSkill('Walka mieczem', 'direct', '+3')

        expect(getCustomAttributes().length).toBe(1)
        expect(getNpcStats().length).toBe(1)
        expect(getNpcSkills().length).toBe(1)

        resetNpcModalForm()

        expect(getCustomAttributes().length).toBe(0)
        expect(getNpcStats().length).toBe(0)
        expect(getNpcSkills().length).toBe(0)
    })

    it('dodaje cechę postaci z wartością liczbową lub kością (d6, 6d6) i usuwa cechę', () => {
        setupNpcModal()

        const btnAdd = document.getElementById('btn-add-npc-stat')!
        const list = document.getElementById('npc-stats-list')!
        const emptyNotice = document.getElementById('npc-stats-empty')!

        expect(list.children.length).toBe(0)
        expect(emptyNotice.classList.contains('hidden')).toBe(false)

        btnAdd.click()
        expect(list.children.length).toBe(1)
        expect(emptyNotice.classList.contains('hidden')).toBe(true)

        const nameInput = list.querySelector('[data-stat-field="name"]') as HTMLInputElement
        const valInput = list.querySelector('[data-stat-field="value"]') as HTMLInputElement

        nameInput.value = 'Wytrzymałość'
        nameInput.dispatchEvent(new Event('input', { bubbles: true }))

        valInput.value = '3d6'
        valInput.dispatchEvent(new Event('input', { bubbles: true }))

        expect(getNpcStats()).toEqual([{ name: 'Wytrzymałość', value: '3d6' }])

        // Programmatic removal
        const statId = addNpcStat('Zręczność', 'd6')
        expect(getNpcStats().length).toBe(2)
        removeNpcStat(statId)
        expect(getNpcStats().length).toBe(1)

        // Remove via button
        const removeBtn = list.querySelector('[data-action="remove-stat"]') as HTMLButtonElement
        expect(removeBtn).not.toBeNull()
        removeBtn.click()

        expect(list.children.length).toBe(0)
        expect(emptyNotice.classList.contains('hidden')).toBe(false)
        expect(getNpcStats().length).toBe(0)
    })

    it('obsługuje chipy sugestii cech (np. Siła)', () => {
        setupNpcModal({
            projectStats: [new Stat('s-1', 'Siła', new Description(), '10')],
        })

        const list = document.getElementById('npc-stats-list')!
        const strChip = document.querySelector(
            '.npc-stat-preset-chip[data-preset-stat="Siła"]'
        ) as HTMLButtonElement

        expect(strChip).not.toBeNull()
        strChip.click()

        expect(list.children.length).toBe(1)
        const nameInput = list.querySelector('[data-stat-field="name"]') as HTMLInputElement
        expect(nameInput.value).toBe('Siła')
        expect(getNpcStats()[0].name).toBe('Siła')
    })

    it('dodaje umiejętność w trybie bezpośrednim (np. d6) oraz obsługuje chipy sugestii', () => {
        setupNpcModal({
            projectSkills: [new Skill('sk-1', 'Walka wręcz')],
        })

        const list = document.getElementById('npc-skills-list')!
        const meleeChip = document.querySelector(
            '.npc-skill-preset-chip[data-preset-skill="Walka wręcz"]'
        ) as HTMLButtonElement

        expect(meleeChip).not.toBeNull()
        meleeChip.click()

        expect(list.children.length).toBe(1)
        const nameInput = list.querySelector('[data-skill-field="name"]') as HTMLInputElement
        expect(nameInput.value).toBe('Walka wręcz')

        const valInput = list.querySelector('[data-skill-field="value"]') as HTMLInputElement
        valInput.value = 'd6'
        valInput.dispatchEvent(new Event('input', { bubbles: true }))

        const skills = getNpcSkills()
        expect(skills.length).toBe(1)
        expect(skills[0].name).toBe('Walka wręcz')
        expect(skills[0].mode).toBe('direct')
        expect(skills[0].value).toBe('d6')
    })

    it('dodaje umiejętność w trybie cecha + mod i synchronizuje dostępne cechy z listy cech', () => {
        setupNpcModal()

        // Define stats first
        addNpcStat('Siła', '15')
        addNpcStat('Zręczność', 'd6')

        expect(getAvailableStatNames()).toEqual(['Siła', 'Zręczność'])

        // Add skill in stat_mod mode
        const skillId = addNpcSkill('Otwieranie zamków', 'stat_mod', '', 'Zręczność', '+2')
        expect(skillId).toBeDefined()

        const list = document.getElementById('npc-skills-list')!
        const row = list.querySelector(`.npc-skill-row[data-skill-id="${skillId}"]`)!

        const statSelect = row.querySelector('[data-skill-field="statName"]') as HTMLSelectElement
        expect(statSelect.value).toBe('Zręczność')

        // Add another stat and verify dropdown updates
        addNpcStat('Inteligencja', '12')
        updateSkillStatDropdowns()

        const options = Array.from(statSelect.options).map(o => o.value)
        expect(options).toContain('Inteligencja')
        expect(options).toContain('Siła')
        expect(options).toContain('Zręczność')

        const skills = getNpcSkills()
        expect(skills[0]).toEqual({
            name: 'Otwieranie zamków',
            mode: 'stat_mod',
            value: '',
            statName: 'Zręczność',
            modifier: '+2',
        })
    })

    it('przełącza tryb umiejętności między direct a stat_mod', () => {
        setupNpcModal()

        addNpcSkill('Skradanie', 'direct', '+1')
        const list = document.getElementById('npc-skills-list')!
        const row = list.querySelector('.npc-skill-row')!

        const modeSelect = row.querySelector('[data-skill-field="mode"]') as HTMLSelectElement
        const directBox = row.querySelector('.skill-direct-mode-container')!
        const statModBox = row.querySelector('.skill-stat-mod-container')!

        expect(directBox.classList.contains('hidden')).toBe(false)
        expect(statModBox.classList.contains('hidden')).toBe(true)

        // Switch to stat_mod
        modeSelect.value = 'stat_mod'
        modeSelect.dispatchEvent(new Event('change', { bubbles: true }))

        expect(directBox.classList.contains('hidden')).toBe(true)
        expect(statModBox.classList.contains('hidden')).toBe(false)
        expect(getNpcSkills()[0].mode).toBe('stat_mod')
    })

    it('setNpcStats, clearNpcStats oraz setNpcSkills, clearNpcSkills poprawnie zarządzają stanem', () => {
        setupNpcModal()

        setNpcStats([
            { name: 'Kondycja', value: '16' },
            { name: 'Mądrość', value: 'd20' },
        ])
        expect(getNpcStats().length).toBe(2)

        setNpcSkills([
            { name: 'Percepcja', mode: 'direct', value: 'd20' },
            { name: 'Zastraszanie', mode: 'stat_mod', statName: 'Siła', modifier: '+3' },
        ])
        const skillId = addNpcSkill('Tropienie', 'direct', 'd8')
        expect(getNpcSkills().length).toBe(3)
        removeNpcSkill(skillId)
        expect(getNpcSkills().length).toBe(2)

        clearNpcStats()
        expect(getNpcStats().length).toBe(0)

        clearNpcSkills()
        expect(getNpcSkills().length).toBe(0)
    })

    describe('Formula Engine & Vitals', () => {
        it('parseStatValueAsNumber poprawnie analizuje liczby oraz zapisy kości', () => {
            expect(parseStatValueAsNumber('15')).toBe(15)
            expect(parseStatValueAsNumber('-5')).toBe(-5)
            expect(parseStatValueAsNumber('12.5')).toBe(12.5)
            expect(parseStatValueAsNumber('d6')).toBe(3.5)
            expect(parseStatValueAsNumber('2d6')).toBe(7)
            expect(parseStatValueAsNumber('1d20+2')).toBe(12.5)
            expect(parseStatValueAsNumber('3d8-2')).toBe(11.5)
            expect(parseStatValueAsNumber('')).toBeNull()
            expect(parseStatValueAsNumber(null)).toBeNull()
        })

        it('evaluateFormula poprawnie wylicza wyrażenia arytmetyczne, nawiasy i zmienne', () => {
            expect(evaluateFormula('10 + 5 * 2').result).toBe(20)
            expect(evaluateFormula('(10 + 5) * 2').result).toBe(30)
            expect(evaluateFormula('10 / 2').result).toBe(5)
            expect(evaluateFormula('10 % 3').result).toBe(1)
            expect(evaluateFormula('-10 + 25').result).toBe(15)
            expect(evaluateFormula('5 * -2').result).toBe(-10)

            const stats = {
                Siła: 15,
                Kondycja: 10,
                Mądrość: 12,
                Zręczność: 14,
            }

            // Stat substitution
            expect(evaluateFormula('Siła * 4 + 10', stats).result).toBe(70)
            // Polish unicode characters in variable names
            expect(evaluateFormula('Mądrość * 2 + Zręczność', stats).result).toBe(38)
            // Case-insensitive variables
            expect(evaluateFormula('siła * 2 + kondycja', stats).result).toBe(40)
            // Dice in stat values
            expect(evaluateFormula('Kość * 2', { Kość: 'd6' }).result).toBe(7)
        })

        it('evaluateFormula bezpiecznie zwraca błędy dla nieznanych cech, dzielenia przez zero i błędów składni', () => {
            const resMissing = evaluateFormula('Nieznana * 2', { Siła: 10 })
            expect(resMissing.result).toBeNull()
            expect(resMissing.error).toContain('Nieznana')

            const resDivZero = evaluateFormula('10 / 0')
            expect(resDivZero.result).toBeNull()
            expect(resDivZero.error).toContain('Dzielenie przez zero')

            const resUnbalanced = evaluateFormula('(10 + 5')
            expect(resUnbalanced.result).toBeNull()
            expect(resUnbalanced.error).toContain('Niezbalansowane nawiasy')

            const resDisallowed = evaluateFormula('alert(1)')
            expect(resDisallowed.result).toBeNull()
        })

        it('dodaje parametr życiowy manualnie oraz z chipów presetów', () => {
            setupNpcModal({
                projectParameters: [
                    new Parameter(
                        'p-1',
                        'Punkty Życia (HP)',
                        new Description(),
                        'formula',
                        '',
                        'Siła * 4 + 10'
                    ),
                ],
            })

            // Manual add
            const vitalId = addNpcVital('Pancerz', 'direct', '5')
            expect(vitalId).toBeDefined()

            const list = document.getElementById('npc-vitals-list')!
            expect(list.children.length).toBe(1)

            const row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`)!
            const nameInput = row.querySelector('[data-vital-field="name"]') as HTMLInputElement
            const valInput = row.querySelector('[data-vital-field="value"]') as HTMLInputElement
            expect(nameInput.value).toBe('Pancerz')
            expect(valInput.value).toBe('5')

            // Preset HP
            const hpChip = document.querySelector(
                '[data-preset-vital="Punkty Życia (HP)"]'
            ) as HTMLButtonElement
            hpChip.click()

            const vitals = getNpcVitals()
            expect(vitals.length).toBe(2)
            expect(vitals[1].name).toBe('Punkty Życia (HP)')
            expect(vitals[1].mode).toBe('formula')
            expect(vitals[1].formula).toBe('Siła * 4 + 10')
        })

        it('przełącza tryb parametru między direct a formula oraz wyświetla podgląd na żywo', () => {
            setupNpcModal()
            addNpcStat('Siła', '15')

            const vitalId = addNpcVital('Życie', 'direct', '50')
            const list = document.getElementById('npc-vitals-list')!
            const row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`)!

            const directBox = row.querySelector('.vital-direct-container')!
            const formulaBox = row.querySelector('.vital-formula-container')!
            const modeSelect = row.querySelector('[data-vital-field="mode"]') as HTMLSelectElement
            const formulaInput = row.querySelector(
                '[data-vital-field="formula"]'
            ) as HTMLInputElement

            expect(directBox.classList.contains('hidden')).toBe(false)
            expect(formulaBox.classList.contains('hidden')).toBe(true)

            // Switch to formula
            modeSelect.value = 'formula'
            modeSelect.dispatchEvent(new Event('change'))

            expect(directBox.classList.contains('hidden')).toBe(true)
            expect(formulaBox.classList.contains('hidden')).toBe(false)

            // Type formula
            formulaInput.value = 'Siła * 4 + 10'
            formulaInput.dispatchEvent(new Event('input'))

            const previewBadge = row.querySelector('.npc-vital-preview')!
            expect(previewBadge.textContent).toContain('= 70')
        })

        it('reaktywnie przelicza wynik formuły po zmianie wartości cechy w sekcji cech', () => {
            setupNpcModal()
            const statId = addNpcStat('Siła', '15')
            const vitalId = addNpcVital('Życie', 'formula', '', 'Siła * 4 + 10')

            const vitalRow = document.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`)!
            let previewBadge = vitalRow.querySelector('.npc-vital-preview')!
            expect(previewBadge.textContent).toContain('= 70')

            // Change stat value from 15 to 20
            const statRow = document.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`)!
            const statValInput = statRow.querySelector(
                '[data-stat-field="value"]'
            ) as HTMLInputElement
            statValInput.value = '20'
            statValInput.dispatchEvent(new Event('input'))

            previewBadge = vitalRow.querySelector('.npc-vital-preview')!
            expect(previewBadge.textContent).toContain('= 90')

            // Test programmatic call
            updateVitalFormulasPreview()
            expect(previewBadge.textContent).toContain('= 90')
        })

        it('usuwa parametr życiowy przez przycisk i przez removeNpcVital', () => {
            setupNpcModal()
            const id1 = addNpcVital('Param1', 'direct', '10')
            const id2 = addNpcVital('Param2', 'direct', '20')
            expect(getNpcVitals().length).toBe(2)

            // Remove by function
            removeNpcVital(id1)
            expect(getNpcVitals().length).toBe(1)

            // Remove by click
            const list = document.getElementById('npc-vitals-list')!
            const row = list.querySelector(`.npc-vital-row[data-vital-id="${id2}"]`)!
            const removeBtn = row.querySelector('[data-action="remove-vital"]') as HTMLButtonElement
            removeBtn.click()

            expect(getNpcVitals().length).toBe(0)
            const emptyNotice = document.getElementById('npc-vitals-empty')!
            expect(emptyNotice.classList.contains('hidden')).toBe(false)
        })

        it('setNpcVitals, clearNpcVitals oraz resetNpcModalForm zarządzają parametrami', () => {
            setupNpcModal()
            setNpcVitals([
                { name: 'HP', mode: 'direct', value: '100' },
                { name: 'Mana', mode: 'formula', formula: 'Inteligencja * 2' },
            ])
            expect(getNpcVitals().length).toBe(2)

            clearNpcVitals()
            expect(getNpcVitals().length).toBe(0)

            addNpcVital('Kondycja', 'direct', '50')
            expect(getNpcVitals().length).toBe(1)

            resetNpcModalForm()
            expect(getNpcVitals().length).toBe(0)
        })
    })

    describe('Save, Cancel and Validation', () => {
        it('nie pozwala zapisać postaci z pustą nazwą i wyświetla błąd', () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()

            setNpcName('')
            const res = saveNpcCharacter(ctx)

            expect(res).toBeNull()
            expect(ctx.projectCharacters.length).toBe(0)

            const errorBox = document.getElementById('npc-create-error-message')!
            expect(errorBox.classList.contains('hidden')).toBe(false)

            const modal = document.getElementById('npc-create-modal')!
            expect(modal.classList.contains('hidden')).toBe(false)
        })

        it('ukrywa błąd po wpisaniu nazwy postaci', () => {
            setupNpcModal()
            openNpcModal()

            saveNpcCharacter()
            const errorBox = document.getElementById('npc-create-error-message')!
            expect(errorBox.classList.contains('hidden')).toBe(false)

            const nameInput = document.getElementById('npc-name-input') as HTMLInputElement
            nameInput.value = 'Kaelen'
            nameInput.dispatchEvent(new Event('input'))

            expect(errorBox.classList.contains('hidden')).toBe(true)
        })

        it('zapisuje postać ze wszystkimi danymi, dodaje do projectCharacters i zamyka okno', () => {
            let renderedListCalled = false
            const mockVm = {
                project: {
                    addCharacter: (_char: NPC): void => {},
                },
            }
            const ctx = {
                vm: mockVm,
                projectCharacters: [] as NPC[],
                renderCharactersList: (): void => {
                    renderedListCalled = true
                },
            }

            setupNpcModal(ctx)
            openNpcModal()

            setSelectedAvatarId('mage')
            setNpcName('Mistrz Elion')
            setNpcSummary('Potężny czarodziej ognia')
            setNpcDescription('Spędził 100 lat w cytadeli magów...')
            addCustomAttribute('Rasa', 'Elf')
            addNpcStat('Inteligencja', '18')
            addNpcSkill('Kula ognia', 'direct', '3d6')
            addNpcVital('Mana', 'formula', '', 'Inteligencja * 3')

            const modal = document.getElementById('npc-create-modal')!
            expect(modal.classList.contains('hidden')).toBe(false)

            const savedChar = saveNpcCharacter(ctx)

            expect(savedChar).not.toBeNull()
            expect(savedChar.getName()).toBe('Mistrz Elion')
            expect(savedChar.avatar).toBe('mage')
            expect(savedChar.getDescription().getSummary()).toBe('Potężny czarodziej ognia')
            expect(savedChar.getDescription().getText()).toBe('Spędził 100 lat w cytadeli magów...')

            expect(ctx.projectCharacters.length).toBe(1)
            expect(ctx.projectCharacters[0].getName()).toBe('Mistrz Elion')
            expect(renderedListCalled).toBe(true)

            // Modal is closed and form is reset
            expect(modal.classList.contains('hidden')).toBe(true)
            expect(getNpcName()).toBe('')
            expect(getCustomAttributes().length).toBe(0)
            expect(getNpcStats().length).toBe(0)
            expect(getNpcSkills().length).toBe(0)
            expect(getNpcVitals().length).toBe(0)
        })

        it('anuluje tworzenie postaci i resetuje formularz bez dodawania do listy', () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()

            setNpcName('Tymczasowy NPC')
            addCustomAttribute('Rola', 'Kupiec')

            const btnCancel = document.getElementById('btn-cancel-npc-modal') as HTMLButtonElement
            btnCancel.click()

            const modal = document.getElementById('npc-create-modal')!
            expect(modal.classList.contains('hidden')).toBe(true)
            expect(ctx.projectCharacters.length).toBe(0)
            expect(getNpcName()).toBe('')
            expect(getCustomAttributes().length).toBe(0)
        })

        it('kliknięcie btn-save-npc-modal oraz submit formularza wywołuje zapis', () => {
            const ctx = { projectCharacters: [] as NPC[] }
            setupNpcModal(ctx)
            openNpcModal()

            setNpcName('Bohater 1')
            const btnSave = document.getElementById('btn-save-npc-modal') as HTMLButtonElement
            btnSave.click()

            expect(ctx.projectCharacters.length).toBe(1)
            expect(ctx.projectCharacters[0].getName()).toBe('Bohater 1')

            // Test form submit
            openNpcModal()
            setNpcName('Bohater 2')
            const form = document.getElementById('npc-create-modal-form') as HTMLFormElement
            form.dispatchEvent(new Event('submit'))

            expect(ctx.projectCharacters.length).toBe(2)
            expect(ctx.projectCharacters[1].getName()).toBe('Bohater 2')
        })
    })

    it('rejestruje metody w przekazanym kontekście aplikacji oraz obiekcie window', () => {
        const ctx: Record<string, unknown> = {}

        setupNpcModal(ctx)

        expect(typeof ctx.openNpcModal).toBe('function')
        expect(typeof ctx.closeNpcModal).toBe('function')
        expect(typeof ctx.getSelectedAvatarId).toBe('function')
        expect(typeof ctx.setSelectedAvatarId).toBe('function')
        expect(typeof ctx.getNpcName).toBe('function')
        expect(typeof ctx.setNpcName).toBe('function')
        expect(typeof ctx.getNpcSummary).toBe('function')
        expect(typeof ctx.setNpcSummary).toBe('function')
        expect(typeof ctx.addCustomAttribute).toBe('function')
        expect(typeof ctx.removeCustomAttribute).toBe('function')
        expect(typeof ctx.getCustomAttributes).toBe('function')
        expect(typeof ctx.setCustomAttributes).toBe('function')
        expect(typeof ctx.clearCustomAttributes).toBe('function')
        expect(typeof ctx.addNpcStat).toBe('function')
        expect(typeof ctx.removeNpcStat).toBe('function')
        expect(typeof ctx.getNpcStats).toBe('function')
        expect(typeof ctx.setNpcStats).toBe('function')
        expect(typeof ctx.clearNpcStats).toBe('function')
        expect(typeof ctx.addNpcSkill).toBe('function')
        expect(typeof ctx.removeNpcSkill).toBe('function')
        expect(typeof ctx.getNpcSkills).toBe('function')
        expect(typeof ctx.setNpcSkills).toBe('function')
        expect(typeof ctx.clearNpcSkills).toBe('function')
        expect(typeof ctx.addNpcVital).toBe('function')
        expect(typeof ctx.removeNpcVital).toBe('function')
        expect(typeof ctx.getNpcVitals).toBe('function')
        expect(typeof ctx.setNpcVitals).toBe('function')
        expect(typeof ctx.clearNpcVitals).toBe('function')
        expect(typeof ctx.evaluateFormula).toBe('function')
        expect(typeof ctx.updateVitalFormulasPreview).toBe('function')
        expect(typeof ctx.saveNpcCharacter).toBe('function')
        expect(typeof ctx.getNpcDescription).toBe('function')
        expect(typeof ctx.setNpcDescription).toBe('function')
        expect(typeof ctx.toggleDescriptionDrawer).toBe('function')
        expect(typeof ctx.isDescriptionDrawerOpen).toBe('function')
        expect(typeof ctx.resetNpcModalForm).toBe('function')

        // @ts-expect-error window extension
        expect(typeof window.openNpcModal).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.toggleDescriptionDrawer).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.getCustomAttributes).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.getNpcStats).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.getNpcSkills).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.getNpcVitals).toBe('function')
        // @ts-expect-error window extension
        expect(typeof window.saveNpcCharacter).toBe('function')
    })

    it('renders dynamic rows with data-i18n attributes for placeholders and titles', () => {
        setupNpcModal()
        addCustomAttribute('Rasa', 'Elf')
        addNpcStat('Siła', '14')
        addNpcSkill('Skradanie', 'direct', '+2')
        addNpcVital('HP', 'direct', '100')

        const attrNameInput = document.querySelector('[data-attr-field="name"]') as HTMLInputElement
        const attrValInput = document.querySelector('[data-attr-field="value"]') as HTMLInputElement
        expect(attrNameInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.attr_name_placeholder'
        )
        expect(attrValInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.attr_value_placeholder'
        )

        const statNameInput = document.querySelector('[data-stat-field="name"]') as HTMLInputElement
        const statValInput = document.querySelector('[data-stat-field="value"]') as HTMLInputElement
        expect(statNameInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.stat_name_placeholder'
        )
        expect(statValInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.stat_value_placeholder'
        )

        const skillNameInput = document.querySelector(
            '[data-skill-field="name"]'
        ) as HTMLInputElement
        expect(skillNameInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.skill_name_placeholder'
        )

        const vitalNameInput = document.querySelector(
            '[data-vital-field="name"]'
        ) as HTMLInputElement
        expect(vitalNameInput.getAttribute('data-i18n-placeholder')).toBe(
            'npc.vital_name_placeholder'
        )
    })

    it('translates dynamic row placeholders and character change label when language changes', async () => {
        await initTranslationsWithLocale('pl')
        setupNpcModal()

        const changeLabel = document.createElement('span')
        changeLabel.setAttribute('data-i18n', 'npc.charakter_change')
        document.body.appendChild(changeLabel)

        addCustomAttribute('Rasa', 'Elf')
        addNpcStat('Siła', '14')

        applyTranslations()

        expect(changeLabel.textContent).toBe('Zmień awatar')
        const attrNameInput = document.querySelector('[data-attr-field="name"]') as HTMLInputElement
        expect(attrNameInput.placeholder).toBe('Atrybut (np. Rasa)')

        await setLanguage('en')
        applyTranslations()

        expect(changeLabel.textContent).toBe('Change avatar')
        expect(attrNameInput.placeholder).toBe('Attribute (e.g. Race)')

        await setLanguage('de')
        applyTranslations()

        expect(changeLabel.textContent).toBe('Avatar ändern')
        expect(attrNameInput.placeholder).toBe('Attribut (z.B. Volk)')
    })

    describe('Dual-State Data Entry Rows (Edit Mode & Read Mode)', () => {
        it('cechy (Stats) obsługują stan edycji z dwoma polami i zatwierdzanie do stanu odczytu', () => {
            setupNpcModal()
            const statId = addNpcStat('Siła', '16')
            const list = document.getElementById('npc-stats-list')!
            let row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement

            // Starts in Edit Mode
            expect(row.getAttribute('data-state')).toBe('edit')
            const nameInput = row.querySelector('[data-stat-field="name"]') as HTMLInputElement
            const valInput = row.querySelector('[data-stat-field="value"]') as HTMLInputElement
            const confirmBtn = row.querySelector(
                '[data-action="confirm-stat"]'
            ) as HTMLButtonElement
            expect(nameInput).not.toBeNull()
            expect(valInput).not.toBeNull()
            expect(confirmBtn).not.toBeNull()
            expect(nameInput.value).toBe('Siła')
            expect(valInput.value).toBe('16')

            // Click Confirm button
            confirmBtn.click()

            // Transitions to Read Mode
            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')
            expect(row.querySelector('[data-stat-field="name"]')).toBeNull()
            expect(row.textContent).toContain('Siła')
            expect(row.textContent).toContain('16')

            const editBtn = row.querySelector('[data-action="edit-stat"]') as HTMLButtonElement
            expect(editBtn).not.toBeNull()

            // Click Edit button to transition back to Edit Mode
            editBtn.click()

            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')
            const valInput2 = row.querySelector('[data-stat-field="value"]') as HTMLInputElement
            expect(valInput2).not.toBeNull()
            expect(valInput2.value).toBe('16')

            // Edit value and confirm with Enter key
            valInput2.value = '18'
            valInput2.dispatchEvent(new Event('input', { bubbles: true }))
            valInput2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')
            expect(row.textContent).toContain('18')

            // Clicking the row itself in read mode also switches back to edit mode
            row.click()
            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')

            // Programmatic confirm & edit helpers
            confirmNpcStat(statId)
            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')

            editNpcStat(statId)
            row = list.querySelector(`.npc-stat-row[data-stat-id="${statId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')
        })

        it('parametry (Vitals) obsługują dwustanowość z podglądem wzoru w stanie odczytu', () => {
            setupNpcModal()
            addNpcStat('Siła', '15')
            const vitalId = addNpcVital('Punkty Życia', 'formula', '', 'Siła * 4 + 10')
            const list = document.getElementById('npc-vitals-list')!
            let row = list.querySelector(
                `.npc-vital-row[data-vital-id="${vitalId}"]`
            ) as HTMLElement

            // Edit mode by default
            expect(row.getAttribute('data-state')).toBe('edit')
            const confirmBtn = row.querySelector(
                '[data-action="confirm-vital"]'
            ) as HTMLButtonElement
            expect(confirmBtn).not.toBeNull()

            // Confirm
            confirmBtn.click()

            // Read mode
            row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')
            expect(row.textContent).toContain('Punkty Życia')
            expect(row.textContent).toContain('Siła * 4 + 10')
            expect(row.textContent).toContain('= 70')

            // Edit button switches back to edit mode
            const editBtn = row.querySelector('[data-action="edit-vital"]') as HTMLButtonElement
            editBtn.click()

            row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')

            // Helper methods
            confirmNpcVital(vitalId)
            row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')

            editNpcVital(vitalId)
            row = list.querySelector(`.npc-vital-row[data-vital-id="${vitalId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')
        })

        it('umiejętności (Skills) obsługują dwustanowość w trybie stat_mod i direct', () => {
            setupNpcModal()
            addNpcStat('Zręczność', '14')
            const skillId = addNpcSkill('Skradanie', 'stat_mod', '', 'Zręczność', '+3')
            const list = document.getElementById('npc-skills-list')!
            let row = list.querySelector(
                `.npc-skill-row[data-skill-id="${skillId}"]`
            ) as HTMLElement

            expect(row.getAttribute('data-state')).toBe('edit')
            const confirmBtn = row.querySelector(
                '[data-action="confirm-skill"]'
            ) as HTMLButtonElement
            confirmBtn.click()

            row = list.querySelector(`.npc-skill-row[data-skill-id="${skillId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')
            expect(row.textContent).toContain('Skradanie')
            expect(row.textContent).toContain('Zręczność')
            expect(row.textContent).toContain('+3')

            // Click edit
            const editBtn = row.querySelector('[data-action="edit-skill"]') as HTMLButtonElement
            editBtn.click()

            row = list.querySelector(`.npc-skill-row[data-skill-id="${skillId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')

            // Helper methods
            confirmNpcSkill(skillId)
            row = list.querySelector(`.npc-skill-row[data-skill-id="${skillId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')

            editNpcSkill(skillId)
            row = list.querySelector(`.npc-skill-row[data-skill-id="${skillId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')
        })

        it('atrybuty tożsamości (Attributes) obsługują dwustanowość', () => {
            setupNpcModal()
            const attrId = addCustomAttribute('Rasa', 'Leśny Elf')
            const list = document.getElementById('npc-custom-attributes-list')!
            let row = list.querySelector(
                `.npc-attribute-row[data-attr-id="${attrId}"]`
            ) as HTMLElement

            expect(row.getAttribute('data-state')).toBe('edit')
            const confirmBtn = row.querySelector(
                '[data-action="confirm-attribute"]'
            ) as HTMLButtonElement
            confirmBtn.click()

            row = list.querySelector(`.npc-attribute-row[data-attr-id="${attrId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')
            expect(row.textContent).toContain('Rasa')
            expect(row.textContent).toContain('Leśny Elf')

            // Click edit
            const editBtn = row.querySelector('[data-action="edit-attribute"]') as HTMLButtonElement
            editBtn.click()

            row = list.querySelector(`.npc-attribute-row[data-attr-id="${attrId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')

            // Helper methods
            confirmCustomAttribute(attrId)
            row = list.querySelector(`.npc-attribute-row[data-attr-id="${attrId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('read')

            editCustomAttribute(attrId)
            row = list.querySelector(`.npc-attribute-row[data-attr-id="${attrId}"]`) as HTMLElement
            expect(row.getAttribute('data-state')).toBe('edit')
        })
    })

    describe('Etap 2: Tagi postaci, dynamiczne sugestie i globalna rejestracja obiektów', () => {
        it('obsługuje dodawanie, usuwanie i czyszczenie tagów w stanie i w UI', () => {
            setupNpcModal()
            expect(getNpcTags()).toEqual([])

            const tagId = addNpcTag('Sojusznik', '#10b981')
            expect(tagId).toBeTruthy()
            expect(getNpcTags()).toHaveLength(1)
            expect(getNpcTags()[0].name).toBe('Sojusznik')
            expect(getNpcTags()[0].color).toBe('#10b981')

            const list = document.getElementById('npc-tags-list')!
            expect(list.children.length).toBe(1)
            expect(list.textContent).toContain('Sojusznik')

            // Dodanie drugiego taga
            addNpcTag('Kupiec', '#f59e0b')
            expect(getNpcTags()).toHaveLength(2)

            // Usunięcie taga przez kliknięcie krzyżyka
            const removeBtn = list.querySelector(
                `[data-action="remove-npc-tag"][data-tag-id="${tagId}"]`
            ) as HTMLButtonElement
            expect(removeBtn).toBeTruthy()
            removeBtn.click()

            expect(getNpcTags()).toHaveLength(1)
            expect(getNpcTags()[0].name).toBe('Kupiec')

            // Czyszczenie tagów
            clearNpcTags()
            expect(getNpcTags()).toEqual([])
            expect(list.children.length).toBe(0)
            const emptyNotice = document.getElementById('npc-tags-empty')!
            expect(emptyNotice.classList.contains('hidden')).toBe(false)
        })

        it('obsługuje popover wyboru i tworzenia tagów w modalu NPC', () => {
            const mockProjectTags = [
                new Tag('tag-1', 'Wróg', '#ef4444'),
                new Tag('tag-2', 'Boss', '#8b5cf6'),
            ]
            const ctx = { projectTags: mockProjectTags }
            setupNpcModal(ctx)

            const btnAddTag = document.getElementById('btn-add-npc-tag')!
            const popover = document.getElementById('npc-tag-picker-popover')!
            expect(popover.classList.contains('hidden')).toBe(true)

            // Kliknięcie "Dodaj tag" otwiera popover
            btnAddTag.click()
            expect(popover.classList.contains('hidden')).toBe(false)

            const availableList = document.getElementById('npc-available-tags-list')!
            expect(availableList.textContent).toContain('Wróg')
            expect(availableList.textContent).toContain('Boss')

            // Wybór istniejącego taga z listy
            const enemyTagBtn = availableList.querySelector(
                '[data-action="select-available-tag"][data-tag-name="Wróg"]'
            ) as HTMLButtonElement
            expect(enemyTagBtn).toBeTruthy()
            enemyTagBtn.click()

            expect(getNpcTags().some(t => t.name === 'Wróg')).toBe(true)

            // Wpisanie nowej nazwy w wyszukiwarkę i utworzenie nowego taga
            const searchInput = document.getElementById('npc-tag-search-input') as HTMLInputElement
            searchInput.value = 'Strażnik'
            searchInput.dispatchEvent(new Event('input'))

            const createAction = document.getElementById('npc-create-tag-action')!
            expect(createAction.classList.contains('hidden')).toBe(false)

            const btnCreateNew = document.getElementById(
                'btn-create-new-npc-tag'
            ) as HTMLButtonElement
            btnCreateNew.click()

            expect(getNpcTags().some(t => t.name === 'Strażnik')).toBe(true)
            expect(popover.classList.contains('hidden')).toBe(true)
        })

        it('renderuje dynamiczne sugestie pobrane z ViewModel / aplikacji', () => {
            const mockVm = {
                getSuggestedStats: (): string[] => ['Siła', 'Mądrość', 'Zwrotność'],
                getSuggestedParameters: (): string[] => ['Punkty Życia (HP)', 'Tarcza Energii'],
                getSuggestedSkills: (): string[] => ['Alchemia', 'Strzelectwo'],
                getSuggestedFeatures: (): string[] => ['Frakcja', 'Archetyp'],
                getSuggestedTags: (): string[] => ['VIP', 'Kluczowy'],
            }
            const ctx = { vm: mockVm }

            renderDynamicSuggestions(ctx)

            const statsContainer = document.getElementById('npc-suggested-stats')!
            expect(statsContainer.textContent).toContain('Zwrotność')

            const vitalsContainer = document.getElementById('npc-suggested-vitals')!
            expect(vitalsContainer.textContent).toContain('Tarcza Energii')

            const skillsContainer = document.getElementById('npc-suggested-skills')!
            expect(skillsContainer.textContent).toContain('Alchemia')

            const attrsContainer = document.getElementById('npc-suggested-attributes')!
            expect(attrsContainer.textContent).toContain('Archetyp')

            const tagsContainer = document.getElementById('npc-suggested-tags')!
            expect(tagsContainer.textContent).toContain('VIP')

            // Kliknięcie w chip sugestii cechy
            const statChip = statsContainer.querySelector(
                '.npc-stat-preset-chip[data-preset-stat="Zwrotność"]'
            ) as HTMLButtonElement
            expect(statChip).toBeTruthy()
            statChip.click()
            expect(getNpcStats().some(s => s.name === 'Zwrotność')).toBe(true)

            // Kliknięcie w chip sugestii taga
            const tagChip = tagsContainer.querySelector(
                '.npc-tag-preset-chip[data-preset-tag="VIP"]'
            ) as HTMLButtonElement
            expect(tagChip).toBeTruthy()
            tagChip.click()
            expect(getNpcTags().some(t => t.name === 'VIP')).toBe(true)
        })

        it('saveNpcCharacter tworzy instancje domenowe oraz rejestruje unikalne cechy, parametry, umiejętności i tagi globalnie', () => {
            const addedCharacters: NPC[] = []
            const addedStats: Stat[] = []
            const addedParams: Parameter[] = []
            const addedSkills: Skill[] = []
            const addedTags: Tag[] = []

            const mockProject = {
                addCharacter: (c: NPC): void => {
                    addedCharacters.push(c)
                },
                addStat: (s: Stat): void => {
                    addedStats.push(s)
                },
                addGlobalParameter: (p: Parameter): void => {
                    addedParams.push(p)
                },
                addSkill: (sk: Skill): void => {
                    addedSkills.push(sk)
                },
                addTag: (t: Tag): void => {
                    addedTags.push(t)
                },
                getStats: (): Stat[] => [],
                getGlobalParameters: (): Parameter[] => [],
                getSkills: (): Skill[] => [],
                getTags: (): Tag[] => [],
                getCharacters: (): NPC[] => [],
            }

            const mockVm = {
                project: mockProject,
                createCharacter: (name: string): NPC => new NPC('npc-1', name),
                createStat: (name: string): Stat => new Stat('st-1', name),
                createParameter: (
                    name: string,
                    mode?: unknown,
                    val?: unknown,
                    formula?: unknown
                ): Parameter =>
                    new Parameter(
                        'param-1',
                        name,
                        undefined,
                        mode as never,
                        val as never,
                        formula as never
                    ),
                createSkill: (
                    name: string,
                    mode?: unknown,
                    val?: unknown,
                    statName?: unknown,
                    mod?: unknown
                ): Skill =>
                    new Skill(
                        'sk-1',
                        name,
                        undefined,
                        mode as never,
                        val as never,
                        statName as never,
                        mod as never
                    ),
                createFeature: (name: string, _desc?: string): Feature => new Feature('f-1', name),
                createTag: (name: string, color?: string): Tag => new Tag('t-1', name, color),
            }

            const projectStats: Stat[] = []
            const projectParameters: Parameter[] = []
            const projectSkills: Skill[] = []
            const projectTags: Tag[] = []
            const projectCharacters: NPC[] = []

            let refreshedCharacters = false
            let refreshedTraits = false

            const ctx = {
                vm: mockVm,
                projectStats,
                projectParameters,
                projectSkills,
                projectTags,
                projectCharacters,
                renderCharactersList: (): void => {
                    refreshedCharacters = true
                },
                renderTraitsList: (): void => {
                    refreshedTraits = true
                },
            }

            setupNpcModal(ctx)

            // Wypełniamy formularz
            const nameInput = document.getElementById('npc-name-input') as HTMLInputElement
            nameInput.value = 'Mistrz Varis'

            addNpcStat('Zręczność', '18')
            addNpcVital('Punkty Życia (HP)', 'formula', '', 'Siła * 4 + 10')
            addNpcSkill('Akrobatyka', 'stat_mod', '', 'Zręczność', '+4')
            addCustomAttribute('Tytuł', 'Arcymag')
            addNpcTag('Elitarny', '#ec4899')

            // Zapisujemy postać
            const character = saveNpcCharacter(ctx)

            expect(character).toBeTruthy()
            expect(character!.getName()).toBe('Mistrz Varis')

            // 1. Sprawdzenie instancji domenowych w postaci
            const stats = character!.getStats()
            expect(stats.length).toBe(1)
            expect(stats[0].getName()).toBe('Zręczność')
            expect(stats[0].getValue()).toBe('18')

            const params = character!.getParameters()
            expect(params.length).toBe(1)
            expect(params[0].getName()).toBe('Punkty Życia (HP)')
            expect(params[0].getFormula()).toBe('Siła * 4 + 10')

            const skills = character!.getSkills()
            expect(skills.length).toBe(1)
            expect(skills[0].getName()).toBe('Akrobatyka')

            const tags = character!.getTags()
            expect(tags.length).toBe(1)
            expect(tags[0].getName()).toBe('Elitarny')

            // 2. Sprawdzenie globalnej rejestracji w projekcie
            expect(projectStats.some(s => s.getName() === 'Zręczność')).toBe(true)
            expect(projectParameters.some(p => p.getName() === 'Punkty Życia (HP)')).toBe(true)
            expect(projectSkills.some(sk => sk.getName() === 'Akrobatyka')).toBe(true)
            expect(projectTags.some(t => t.getName() === 'Elitarny')).toBe(true)
            expect(projectCharacters).toHaveLength(1)

            expect(addedStats.some((s: Stat) => s.getName() === 'Zręczność')).toBe(true)
            expect(addedParams.some((p: Parameter) => p.getName() === 'Punkty Życia (HP)')).toBe(
                true
            )
            expect(addedSkills.some((sk: Skill) => sk.getName() === 'Akrobatyka')).toBe(true)
            expect(addedTags.some((t: Tag) => t.getName() === 'Elitarny')).toBe(true)

            // 3. Sprawdzenie odświeżenia UI
            expect(refreshedCharacters).toBe(true)
            expect(refreshedTraits).toBe(true)
        })
    })

    describe('Tryb szablonu (Template Mode)', () => {
        it('przełącza UI na tryb szablonu po wywołaniu openNpcTemplateModal()', () => {
            setupNpcModal()
            openNpcTemplateModal()
            expect(getModalMode()).toBe('template')

            const modal = document.getElementById('npc-create-modal')
            expect(modal?.classList.contains('hidden')).toBe(false)

            const title = document.getElementById('npc-create-modal-title')
            expect(title?.textContent?.toLowerCase()).toContain('szablon')

            const badge = document.querySelector('#npc-create-modal-title span:last-child')
            expect(badge?.textContent).toBe('Szablon')

            const nameInput = document.getElementById('npc-name-input') as HTMLInputElement
            expect(nameInput?.placeholder).toContain('Strażnik miejski')

            const saveBtn = document.getElementById('btn-save-npc-modal')
            expect(saveBtn?.textContent).toContain('szablon')
        })

        it('kliknięcie w przycisk #btn-add-template lub [data-action="open-npc-template-modal"] otwiera modal w trybie template', () => {
            setupNpcModal()

            // Domyślnie modal jest ukryty
            const modal = document.getElementById('npc-create-modal')
            modal?.classList.add('hidden')
            setModalMode('character')

            const btnAddTemplate = document.getElementById('btn-add-template')
            btnAddTemplate?.click()

            expect(getModalMode()).toBe('template')
            expect(modal?.classList.contains('hidden')).toBe(false)

            // Zamknięcie i test dla data-action="open-npc-template-modal"
            modal?.classList.add('hidden')
            setModalMode('character')

            const dataBtn = document.querySelector(
                '[data-action="open-npc-template-modal"]'
            ) as HTMLElement
            dataBtn?.click()

            expect(getModalMode()).toBe('template')
            expect(modal?.classList.contains('hidden')).toBe(false)
        })

        it('zapisuje NPC_Template przy saveNpcTemplate() i rejestruje w ctx.projectTemplates oraz globalnych cechach', () => {
            setupNpcModal()
            openNpcTemplateModal()

            const projectTemplates: any[] = []
            const projectStats: any[] = []
            const projectParameters: any[] = []
            const projectSkills: any[] = []
            const projectTags: any[] = []

            let refreshed = false
            const ctx = {
                projectTemplates,
                projectStats,
                projectParameters,
                projectSkills,
                projectTags,
                renderCharactersList: () => {
                    refreshed = true
                },
                renderTraitsList: () => {},
            }

            setNpcName('Szablon Rozbójnika')
            setNpcSummary('Archetyp leśnego zbójcy')
            setNpcDescription('Wywodzi się z głębokich borów...')
            setSelectedAvatarId('rogue')

            addNpcStat('Zręczność', '16')
            addNpcSkill('Kradzież', 'direct', '+3')
            addNpcVital('Energia', 'direct', '50')
            addNpcTag('Wróg')
            addCustomAttribute('Frakcja', 'Zbójnicy')

            const tpl = saveNpcTemplate(ctx)
            expect(tpl).toBeTruthy()
            expect(tpl.getName()).toBe('Szablon Rozbójnika')
            expect(tpl.getAvatar()).toBe('rogue')
            expect(tpl.getSummary()).toBe('Archetyp leśnego zbójcy')
            expect(tpl.getCustomAttributes()).toEqual([{ name: 'Frakcja', value: 'Zbójnicy' }])

            expect(projectTemplates).toHaveLength(1)
            expect(projectTemplates[0].getName()).toBe('Szablon Rozbójnika')
            expect(refreshed).toBe(true)
        })
    })

    describe('Modyfikacja NPC i szablonów - zapisywanie parametrów (vitals)', () => {
        it('podczas modyfikacji NPC zapisuje wartość nowo dodanego parametru w trybie bezpośrednim bez konieczności ręcznego potwierdzania wiersza', () => {
            setupNpcModal()
            const existingNpc = new NPC('npc-100', 'Wiedźmin Geralt')
            openNpcModal({ mode: 'character', editEntity: existingNpc })

            const btnAddVital = document.getElementById('btn-add-npc-vital')
            btnAddVital?.click()

            const vitalRow = document.querySelector('.npc-vital-row') as HTMLElement
            expect(vitalRow).toBeTruthy()

            const nameInput = vitalRow.querySelector(
                '[data-vital-field="name"]'
            ) as HTMLInputElement
            const valInput = vitalRow.querySelector(
                '[data-vital-field="value"]'
            ) as HTMLInputElement

            nameInput.value = 'Wytrzymałość'
            nameInput.dispatchEvent(new Event('input'))

            valInput.value = '120'
            valInput.dispatchEvent(new Event('input'))

            const btnSave = document.getElementById('btn-save-npc-modal')
            btnSave?.click()

            expect(existingNpc.getParameters()).toHaveLength(1)
            const param = existingNpc.getParameters()[0]
            expect(param.getName()).toBe('Wytrzymałość')
            expect(param.getValue()).toBe('120')
            expect(param.getMode()).toBe('direct')
        })

        it('podczas modyfikacji NPC z użyciem MainWindowViewModel.createParameter poprawnie zapisuje wartość i tryb parametru', () => {
            setupNpcModal()
            const vm = new MainWindowViewModel()
            const existingNpc = new NPC('npc-101', 'Yennefer z Vengerbergu')
            openNpcModal({ mode: 'character', editEntity: existingNpc })

            const ctx = {
                vm,
                projectParameters: [] as any[],
                projectStats: [] as any[],
                projectSkills: [] as any[],
                projectTags: [] as any[],
                renderCharactersList: () => {},
                renderTraitsList: () => {},
            }

            const btnAddVital = document.getElementById('btn-add-npc-vital')
            btnAddVital?.click()

            const vitalRow = document.querySelector('.npc-vital-row') as HTMLElement
            const nameInput = vitalRow.querySelector(
                '[data-vital-field="name"]'
            ) as HTMLInputElement
            const valInput = vitalRow.querySelector(
                '[data-vital-field="value"]'
            ) as HTMLInputElement

            nameInput.value = 'Mana'
            valInput.value = '250'

            const saved = saveNpcCharacter(ctx)
            expect(saved).toBe(existingNpc)

            expect(existingNpc.getParameters()).toHaveLength(1)
            const param = existingNpc.getParameters()[0]
            expect(param.getName()).toBe('Mana')
            expect(param.getValue()).toBe('250')
            expect(param.getMode()).toBe('direct')
        })

        it('podczas modyfikacji NPC poprawnie zapisuje parametr w trybie formuły', () => {
            setupNpcModal()
            const vm = new MainWindowViewModel()
            const existingNpc = new NPC('npc-102', 'Ciri')
            existingNpc.addStat(new Stat('stat-1', 'Zręczność', new Description(), '15'))
            openNpcModal({ mode: 'character', editEntity: existingNpc })

            const ctx = {
                vm,
                projectParameters: [] as any[],
                projectStats: [] as any[],
                projectSkills: [] as any[],
                projectTags: [] as any[],
                renderCharactersList: () => {},
                renderTraitsList: () => {},
            }

            const btnAddVital = document.getElementById('btn-add-npc-vital')
            btnAddVital?.click()

            const vitalRow = document.querySelector('.npc-vital-row') as HTMLElement
            const nameInput = vitalRow.querySelector(
                '[data-vital-field="name"]'
            ) as HTMLInputElement
            const modeSelect = vitalRow.querySelector(
                '[data-vital-field="mode"]'
            ) as HTMLSelectElement
            const formulaInput = vitalRow.querySelector(
                '[data-vital-field="formula"]'
            ) as HTMLInputElement

            nameInput.value = 'Szybkość'
            modeSelect.value = 'formula'
            modeSelect.dispatchEvent(new Event('change'))

            formulaInput.value = 'Zręczność * 2'
            formulaInput.dispatchEvent(new Event('input'))

            saveNpcCharacter(ctx)

            const param = existingNpc.getParameter('Szybkość')
            expect(param).toBeTruthy()
            expect(param?.getMode()).toBe('formula')
            expect(param?.getFormula()).toBe('Zręczność * 2')
        })

        it('podczas modyfikacji NPC_Template zapisuje wartość nowo dodanego parametru', () => {
            setupNpcModal()
            const vm = new MainWindowViewModel()
            const tpl = new NPC_Template('tpl-100', 'Szablon Maga')
            openNpcModal({ mode: 'template', editEntity: tpl })

            const ctx = {
                vm,
                projectTemplates: [tpl],
                projectParameters: [] as any[],
                projectStats: [] as any[],
                projectSkills: [] as any[],
                projectTags: [] as any[],
                renderCharactersList: () => {},
                renderTraitsList: () => {},
            }

            const btnAddVital = document.getElementById('btn-add-npc-vital')
            btnAddVital?.click()

            const vitalRow = document.querySelector('.npc-vital-row') as HTMLElement
            const nameInput = vitalRow.querySelector(
                '[data-vital-field="name"]'
            ) as HTMLInputElement
            const valInput = vitalRow.querySelector(
                '[data-vital-field="value"]'
            ) as HTMLInputElement

            nameInput.value = 'Moc Magiczna'
            valInput.value = '80'

            const saved = saveNpcTemplate(ctx)
            expect(saved).toBe(tpl)

            expect(tpl.getParameters()).toHaveLength(1)
            const param = tpl.getParameters()[0]
            expect(param.getName()).toBe('Moc Magiczna')
            expect(param.getValue()).toBe('80')
            expect(param.getMode()).toBe('direct')
        })
    })
})
