// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { NPC_Template } from '../../Model/NPC_Template'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import {
    applyTemplate,
    closeTemplateDropdown,
    getAppliedTemplates,
    getCustomAttributes,
    getModalMode,
    getNpcSkills,
    getNpcStats,
    getNpcTags,
    getNpcVitals,
    isTemplateDropdownOpen,
    openNpcModal,
    openNpcTemplateModal,
    openTemplateDropdown,
    removeAppliedTemplate,
    renderTemplateDropdownList,
    resetNpcModalForm,
    setupNpcModal,
    toggleTemplateDropdown,
} from '../../View/ui/modals/npc/npcModal.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('Template Usage & Multi-Template Composition Integration Tests', () => {
    let vm: MainWindowViewModel
    let ctx: any
    let tplWarrior: NPC_Template
    let tplMage: NPC_Template

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="npc-create-modal" class="hidden">
                <div id="npc-create-modal-header">
                    <div class="rounded-lg"></div>
                    <h2 id="npc-create-modal-title">
                        <span>Karta Postaci NPC</span>
                        <span>Folio</span>
                    </h2>
                    <p>Opis</p>
                    <button id="btn-close-npc-modal">Zamknij</button>
                </div>
                <div id="npc-window-content-row">
                    <div id="npc-form-column">
                        <div id="npc-create-modal-body">
                            <form id="npc-create-modal-form">
                                <button id="btn-npc-avatar-trigger" type="button">
                                    <div id="npc-selected-avatar-preview"></div>
                                </button>
                                <div id="npc-avatar-picker-popover" class="hidden">
                                    <div id="npc-avatar-grid"></div>
                                </div>

                                <input type="text" id="npc-name-input" />

                                <!-- Applied Templates Section -->
                                <div id="npc-applied-templates-section">
                                    <h4 id="npc-applied-templates-title">Zastosowane szablony</h4>
                                    <span id="npc-applied-templates-count">0</span>

                                    <!-- Dropdown Container -->
                                    <div id="npc-template-dropdown-container">
                                        <button id="btn-template-dropdown" type="button" aria-haspopup="true" aria-expanded="false">
                                            <span>+</span>
                                            <span>Zastosuj szablon</span>
                                            <span id="npc-template-dropdown-arrow">▼</span>
                                        </button>
                                        <div id="npc-template-dropdown-menu" class="hidden">
                                            <input type="text" id="npc-template-dropdown-search" placeholder="Szukaj..." />
                                            <div id="npc-template-dropdown-items"></div>
                                            <div id="npc-template-dropdown-empty" class="hidden">Brak dostępnych szablonów w projekcie.</div>
                                        </div>
                                    </div>

                                    <div id="npc-applied-templates-list"></div>
                                </div>

                                <div id="npc-custom-attributes-section">
                                    <button id="btn-add-custom-attribute" type="button">Dodaj</button>
                                    <div id="npc-custom-attributes-list"></div>
                                    <div id="npc-custom-attributes-empty" class="hidden"></div>
                                </div>

                                <textarea id="npc-summary-input"></textarea>

                                <div id="npc-tags-section">
                                    <button id="btn-add-npc-tag" type="button">Dodaj</button>
                                    <div id="npc-tags-list"></div>
                                    <div id="npc-tag-picker-popover" class="hidden">
                                        <div id="npc-available-tags-list"></div>
                                    </div>
                                </div>

                                <div id="npc-stats-section">
                                    <button id="btn-add-npc-stat" type="button">Dodaj</button>
                                    <div id="npc-stats-list"></div>
                                    <div id="npc-stats-empty" class="hidden"></div>
                                </div>

                                <div id="npc-skills-section">
                                    <button id="btn-add-npc-skill" type="button">Dodaj</button>
                                    <div id="npc-skills-list"></div>
                                    <div id="npc-skills-empty" class="hidden"></div>
                                </div>

                                <div id="npc-vitals-section">
                                    <button id="btn-add-npc-vital" type="button">Dodaj</button>
                                    <div id="npc-vitals-list"></div>
                                    <div id="npc-vitals-empty" class="hidden"></div>
                                </div>

                                <div id="npc-create-error-message" class="hidden">
                                    <span></span>
                                </div>

                                <div id="npc-traits-counter-badge">
                                    <span id="npc-traits-total-count">0</span>
                                </div>

                                <div id="npc-create-modal-footer">
                                    <button type="button" id="btn-cancel-npc-modal">Anuluj</button>
                                    <button type="submit" id="btn-save-npc-modal">
                                        <span>Zapisz postać</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div id="custom-context-menu" class="hidden">
                <button id="ctx-edit-title">Edytuj nazwę</button>
                <button id="ctx-create-character-from-template" class="hidden">Utwórz postać z tego szablonu</button>
                <button id="ctx-delete">Usuń element</button>
            </div>
        `

        vm = new MainWindowViewModel()

        // Create Warrior template
        tplWarrior = new NPC_Template('tpl-warrior', 'Wojownik')
        tplWarrior.setAvatar('warrior')
        tplWarrior.getDescription().setSummary('Dzielny wojownik walczący w zwarciu')
        const strStatWarrior = new Stat('stat-str', 'Siła')
        strStatWarrior.setValue('14')
        tplWarrior.addStat(strStatWarrior)
        const endStatWarrior = new Stat('stat-end', 'Wytrzymałość')
        endStatWarrior.setValue('12')
        tplWarrior.addStat(endStatWarrior)
        const swordSkillWarrior = new Skill('skill-sword', 'Szermierka')
        swordSkillWarrior.setValue('10')
        tplWarrior.addSkill(swordSkillWarrior)
        tplWarrior.addParameter(
            new Parameter('param-hp', 'Punkty Życia', new Description(), 'formula', 0, 'Siła * 2')
        )
        tplWarrior.addTag(new Tag('tag-combat', 'Bojowy', '#ef4444'))
        ;(tplWarrior as any).customAttributes = [{ name: 'Klasa pancerza', value: 'Ciężki' }]

        // Create Mage template
        tplMage = new NPC_Template('tpl-mage', 'Mag')
        tplMage.setAvatar('mage')
        tplMage.getDescription().setSummary('Mędrzec władający arkanami magii')
        const intStatMage = new Stat('stat-int', 'Inteligencja')
        intStatMage.setValue('16')
        tplMage.addStat(intStatMage)
        // Colliding stat "Siła" with different value (should be skipped when stacking!)
        const strStatMage = new Stat('stat-str-mage', 'Siła')
        strStatMage.setValue('8')
        tplMage.addStat(strStatMage)
        // Colliding skill "Szermierka" (should be skipped when stacking!)
        const swordSkillMage = new Skill('skill-sword-mage', 'Szermierka')
        swordSkillMage.setValue('5')
        tplMage.addSkill(swordSkillMage)
        const spellSkillMage = new Skill('skill-spells', 'Rzucanie czarów')
        spellSkillMage.setValue('14')
        tplMage.addSkill(spellSkillMage)
        // Colliding vital "Punkty Życia" (should be skipped!)
        tplMage.addParameter(
            new Parameter('param-hp-mage', 'Punkty Życia', new Description(), 'direct', 50)
        )
        tplMage.addParameter(
            new Parameter('param-mana', 'Mana', new Description(), 'formula', 0, 'Inteligencja * 3')
        )
        // Colliding tag "Bojowy" (should be skipped!)
        tplMage.addTag(new Tag('tag-combat-mage', 'Bojowy', '#ef4444'))
        tplMage.addTag(new Tag('tag-magic', 'Magiczny', '#8b5cf6'))
        ;(tplMage as any).customAttributes = [
            { name: 'Klasa pancerza', value: 'Szata' }, // Colliding attribute (should be skipped!)
            { name: 'Szkoła magii', value: 'Ogień' }, // Unique attribute (should be added!)
        ]

        ctx = {
            vm,
            projectTemplates: [tplWarrior, tplMage],
            projectCharacters: [],
            openNpcModal: vi.fn(opts => openNpcModal(opts)),
        }

        setupNpcModal(ctx)
        resetNpcModalForm()
    })

    it('otwiera i zamyka rozwijane menu szablonów (dropdown)', () => {
        expect(isTemplateDropdownOpen()).toBe(false)

        openTemplateDropdown(ctx)
        expect(isTemplateDropdownOpen()).toBe(true)

        const itemsContainer = document.getElementById('npc-template-dropdown-items')!
        expect(itemsContainer.children.length).toBe(2)
        expect(itemsContainer.textContent).toContain('Wojownik')
        expect(itemsContainer.textContent).toContain('Mag')

        closeTemplateDropdown()
        expect(isTemplateDropdownOpen()).toBe(false)

        toggleTemplateDropdown(ctx)
        expect(isTemplateDropdownOpen()).toBe(true)
    })

    it('filtruje listę szablonów po wyszukiwaniu', () => {
        openTemplateDropdown(ctx)
        renderTemplateDropdownList(ctx, 'mag')

        const itemsContainer = document.getElementById('npc-template-dropdown-items')!
        expect(itemsContainer.children.length).toBe(1)
        expect(itemsContainer.textContent).toContain('Mag')
        expect(itemsContainer.textContent).not.toContain('Wojownik')

        // Search with no results
        renderTemplateDropdownList(ctx, 'nieznany-szablon-xyz')
        const emptyNotice = document.getElementById('npc-template-dropdown-empty')!
        expect(emptyNotice.classList.contains('hidden')).toBe(false)
    })

    it('zastosowuje pojedynczy szablon do postaci: wypełnia cechy, umiejętności, parametry, atrybuty, tagi oraz portret', () => {
        const report = applyTemplate(tplWarrior, ctx)
        expect(report).not.toBeNull()
        expect(report.totalAdded).toBe(6) // 2 stats + 1 skill + 1 vital + 1 tag + 1 attribute
        expect(report.totalSkipped).toBe(0)

        // Verify state
        const stats = getNpcStats()
        expect(stats).toHaveLength(2)
        expect(stats.map(s => s.name)).toEqual(['Siła', 'Wytrzymałość'])

        const skills = getNpcSkills()
        expect(skills).toHaveLength(1)
        expect(skills[0].name).toBe('Szermierka')

        const vitals = getNpcVitals()
        expect(vitals).toHaveLength(1)
        expect(vitals[0].name).toBe('Punkty Życia')

        const tags = getNpcTags()
        expect(tags).toHaveLength(1)
        expect(tags[0].name).toBe('Bojowy')

        const attrs = getCustomAttributes()
        expect(attrs).toHaveLength(1)
        expect(attrs[0].name).toBe('Klasa pancerza')
        expect(attrs[0].value).toBe('Ciężki')

        // Verify applied templates chip list & count
        const applied = getAppliedTemplates()
        expect(applied).toHaveLength(1)
        expect(applied[0].name).toBe('Wojownik')

        const countBadge = document.getElementById('npc-applied-templates-count')!
        expect(countBadge.textContent).toBe('1')

        const chipList = document.getElementById('npc-applied-templates-list')!
        expect(chipList.textContent).toContain('Wojownik')

        // Verify toast message interpolation
        const toastContainer = document.getElementById('toast-container')
        expect(toastContainer?.textContent).toContain('Zastosowano szablon "Wojownik"')
        expect(toastContainer?.textContent).not.toContain('{name}')
    })

    it('wspiera multi-template stacking z bezwzględnym pomijaniem duplikatów / kolizji', () => {
        // 1. Zastosuj pierwszy szablon (Wojownik)
        applyTemplate(tplWarrior, ctx)

        expect(getNpcStats()).toHaveLength(2) // Siła (14), Wytrzymałość (12)
        expect(getNpcStats().find(s => s.name === 'Siła')?.value).toBe('14')

        // 2. Zastosuj drugi szablon (Mag)
        const reportMage = applyTemplate(tplMage, ctx)
        expect(reportMage).not.toBeNull()

        // Mag posiada:
        // - "Siła" (kolizja z Wojownikiem -> POWINNA ZOSTAĆ POMINIĘTA!)
        // - "Inteligencja" (unikalna -> dodana)
        // - "Szermierka" (kolizja -> pominięta)
        // - "Rzucanie czarów" (unikalna -> dodana)
        // - "Punkty Życia" (kolizja -> pominięta)
        // - "Mana" (unikalna -> dodana)
        // - "Bojowy" (kolizja -> pominięty)
        // - "Magiczny" (unikalny -> dodany)
        // - "Klasa pancerza" (kolizja -> pominięta)
        // - "Szkoła magii" (unikalny -> dodany)

        expect(reportMage.skippedStats).toContain('Siła')
        expect(reportMage.addedStats).toContain('Inteligencja')

        expect(reportMage.skippedSkills).toContain('Szermierka')
        expect(reportMage.addedSkills).toContain('Rzucanie czarów')

        expect(reportMage.skippedVitals).toContain('Punkty Życia')
        expect(reportMage.addedVitals).toContain('Mana')

        expect(reportMage.skippedTags).toContain('Bojowy')
        expect(reportMage.addedTags).toContain('Magiczny')

        expect(reportMage.skippedAttributes).toContain('Klasa pancerza')
        expect(reportMage.addedAttributes).toContain('Szkoła magii')

        // Verify merged stats: Siła retains Wojownik's value (14), NOT Mag's value (8)
        const finalStats = getNpcStats()
        expect(finalStats).toHaveLength(3) // Siła, Wytrzymałość, Inteligencja
        const strStat = finalStats.find(s => s.name === 'Siła')
        expect(strStat?.value).toBe('14')

        // Verify merged skills
        const finalSkills = getNpcSkills()
        expect(finalSkills).toHaveLength(2) // Szermierka, Rzucanie czarów
        const swordSkill = finalSkills.find(s => s.name === 'Szermierka')
        expect(swordSkill?.value).toBe('10') // retains Wojownik's 10

        // Verify merged vitals
        const finalVitals = getNpcVitals()
        expect(finalVitals).toHaveLength(2) // Punkty Życia, Mana

        // Verify merged tags
        const finalTags = getNpcTags()
        expect(finalTags).toHaveLength(2) // Bojowy, Magiczny

        // Verify custom attributes
        const finalAttrs = getCustomAttributes()
        expect(finalAttrs).toHaveLength(2) // Klasa pancerza ('Ciężki'), Szkoła magii ('Ogień')
        expect(finalAttrs.find(a => a.name === 'Klasa pancerza')?.value).toBe('Ciężki')

        // Verify both templates are recorded in applied list
        const applied = getAppliedTemplates()
        expect(applied).toHaveLength(2)
        expect(applied.map(a => a.name)).toEqual(['Wojownik', 'Mag'])

        const countBadge = document.getElementById('npc-applied-templates-count')!
        expect(countBadge.textContent).toBe('2')
    })

    it('zapobiega ponownemu nałożeniu tego samego szablonu i zwraca ostrzeżenie', () => {
        applyTemplate(tplWarrior, ctx)
        expect(getAppliedTemplates()).toHaveLength(1)

        // Try applying again
        const reapplyResult = applyTemplate(tplWarrior, ctx)
        expect(reapplyResult).toBeNull()
        expect(getAppliedTemplates()).toHaveLength(1)
    })

    it('usuwa szablon z listy zastosowanych szablonów (removeAppliedTemplate)', () => {
        applyTemplate(tplWarrior, ctx)
        applyTemplate(tplMage, ctx)
        expect(getAppliedTemplates()).toHaveLength(2)

        removeAppliedTemplate('tpl-warrior', ctx)

        const applied = getAppliedTemplates()
        expect(applied).toHaveLength(1)
        expect(applied[0].name).toBe('Mag')

        const countBadge = document.getElementById('npc-applied-templates-count')!
        expect(countBadge.textContent).toBe('1')
    })

    it('działa bezbłędnie podczas tworzenia szablonu (kompozycja szablonu z innego szablonu)', () => {
        openNpcTemplateModal()
        expect(getModalMode()).toBe('template')

        // Apply Warrior archetype to the new template
        const report = applyTemplate(tplWarrior, ctx)
        expect(report).not.toBeNull()
        expect(getModalMode()).toBe('template') // stays in template mode

        const stats = getNpcStats()
        expect(stats).toHaveLength(2)
        expect(getAppliedTemplates()).toHaveLength(1)
        expect(getAppliedTemplates()[0].name).toBe('Wojownik')
    })

    it('obsługuje opcję applyTemplate bezpośrednio w openNpcModal (np. z menu kontekstowego lewego panelu)', () => {
        openNpcModal({ mode: 'character', applyTemplate: tplWarrior })

        expect(getModalMode()).toBe('character')
        const stats = getNpcStats()
        expect(stats).toHaveLength(2)
        expect(getAppliedTemplates()).toHaveLength(1)
        expect(getAppliedTemplates()[0].name).toBe('Wojownik')
    })
})
