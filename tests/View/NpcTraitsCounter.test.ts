// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcVital,
    clearCustomAttributes,
    clearNpcSkills,
    clearNpcStats,
    clearNpcVitals,
    getTraitsCounts,
    renderDynamicSuggestions,
    setupNpcModal,
    updateTraitsCounterUI,
} from '../../View/ui/npcModal.js'

describe('NPC Traits Dynamic Module & Suggestions (Cechy i Atrybuty)', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="npc-create-modal" class="hidden">
                <form id="npc-create-modal-form">
                    <!-- Dynamic Trait Counter Module -->
                    <div id="npc-traits-counter-module">
                        <span id="npc-traits-total-badge">0</span>
                        <b id="npc-counter-stats-val">0</b>
                        <b id="npc-counter-vitals-val">0</b>
                        <b id="npc-counter-skills-val">0</b>
                        <b id="npc-counter-attributes-val">0</b>
                    </div>

                    <input type="text" id="npc-name-input" />
                    <textarea id="npc-summary-input"></textarea>

                    <!-- Attributes Section -->
                    <div id="npc-custom-attributes-section">
                        <div id="npc-suggested-attributes"></div>
                        <div id="npc-custom-attributes-list"></div>
                        <div id="npc-custom-attributes-empty">Brak</div>
                    </div>

                    <!-- Stats Section -->
                    <div id="npc-stats-section">
                        <div id="npc-suggested-stats"></div>
                        <div id="npc-stats-list"></div>
                        <div id="npc-stats-empty">Brak</div>
                    </div>

                    <!-- Vitals Section -->
                    <div id="npc-vitals-section">
                        <div id="npc-suggested-vitals"></div>
                        <div id="npc-vitals-list"></div>
                        <div id="npc-vitals-empty">Brak</div>
                    </div>

                    <!-- Skills Section -->
                    <div id="npc-skills-section">
                        <div id="npc-suggested-skills"></div>
                        <div id="npc-skills-list"></div>
                        <div id="npc-skills-empty">Brak</div>
                    </div>

                    <!-- Tags Section -->
                    <div id="npc-tags-section">
                        <div id="npc-suggested-tags"></div>
                        <div id="npc-tags-list"></div>
                        <div id="npc-tags-empty">Brak</div>
                    </div>
                </form>
            </div>
        `
        clearCustomAttributes()
        clearNpcStats()
        clearNpcSkills()
        clearNpcVitals()
    })

    describe('getTraitsCounts calculation', () => {
        it('zwraca zerowe wartości gdy projekt i karta postaci są puste', () => {
            const counts = getTraitsCounts({})

            expect(counts.project).toEqual({
                stats: 0,
                parameters: 0,
                skills: 0,
                features: 0,
                tags: 0,
                total: 0,
            })
            expect(counts.npc).toEqual({
                stats: 0,
                parameters: 0,
                skills: 0,
                features: 0,
                tags: 0,
                total: 0,
            })
        })

        it('oblicza precyzyjnie liczbę elementów zdefiniowanych w projekcie', () => {
            const ctx = {
                projectStats: [
                    new Stat('s1', 'Refleks', new Description(), '12'),
                    new Stat('s2', 'Charyzma', new Description(), '14'),
                ],
                projectParameters: [
                    new Parameter('p1', 'Energia', new Description(), 'direct', '100'),
                ],
                projectSkills: [
                    new Skill('sk1', 'Perswazja'),
                    new Skill('sk2', 'Informatyka'),
                    new Skill('sk3', 'Strzelectwo'),
                ],
                projectFeatures: [new Feature('f1', 'Gatunek'), new Feature('f2', 'Pochodzenie')],
                projectTags: [new Tag('t1', 'Buntownik')],
            }

            const counts = getTraitsCounts(ctx)

            expect(counts.project.stats).toBe(2)
            expect(counts.project.parameters).toBe(1)
            expect(counts.project.skills).toBe(3)
            expect(counts.project.features).toBe(2)
            expect(counts.project.tags).toBe(1)
            expect(counts.project.total).toBe(8)
        })

        it('oblicza aktualną liczbę elementów dodanych na karcie NPC', () => {
            addNpcStat('Refleks', '14')
            addNpcVital('Energia', 'direct', '100')
            addNpcSkill('Perswazja', 'direct', 'd8')
            addCustomAttribute('Gatunek', 'Cyborg')

            const counts = getTraitsCounts({})

            expect(counts.npc.stats).toBe(1)
            expect(counts.npc.parameters).toBe(1)
            expect(counts.npc.skills).toBe(1)
            expect(counts.npc.features).toBe(1)
            expect(counts.npc.total).toBe(4)
        })
    })

    describe('updateTraitsCounterUI DOM updates', () => {
        it('aktualizuje plakietki w module nagłówka oraz liczniki sekcji sugestii', () => {
            const ctx = {
                projectStats: [new Stat('s1', 'Siła'), new Stat('s2', 'Zręczność')],
                projectParameters: [new Parameter('p1', 'Mana')],
                projectSkills: [new Skill('sk1', 'Alchemia')],
                projectFeatures: [new Feature('f1', 'Rasa')],
            }

            updateTraitsCounterUI(ctx)

            const totalBadge = document.getElementById('npc-traits-total-badge')
            const statsVal = document.getElementById('npc-counter-stats-val')
            const vitalsVal = document.getElementById('npc-counter-vitals-val')
            const skillsVal = document.getElementById('npc-counter-skills-val')
            const attrsVal = document.getElementById('npc-counter-attributes-val')

            expect(totalBadge?.textContent).toBe('5')
            expect(statsVal?.textContent).toBe('2')
            expect(vitalsVal?.textContent).toBe('1')
            expect(skillsVal?.textContent).toBe('1')
            expect(attrsVal?.textContent).toBe('1')
        })

        it('dynamicznie odświeża licznik po dodaniu cechy na karcie NPC', () => {
            const ctx = {
                projectStats: [new Stat('s1', 'Kondycja')],
            }
            setupNpcModal(ctx)

            let counts = getTraitsCounts(ctx)
            expect(counts.npc.stats).toBe(0)

            addNpcStat('Kondycja', '16')

            counts = getTraitsCounts(ctx)
            expect(counts.npc.stats).toBe(1)
            expect(counts.npc.total).toBe(1)
        })
    })

    describe('renderDynamicSuggestions strict isolation to Cechy i atrybuty', () => {
        it('wyświetla TYLKO elementy zdefiniowane w projekcie, bez domyślnych/hardcodowanych cech', () => {
            const ctx = {
                // Only 1 custom stat defined in project
                projectStats: [new Stat('s1', 'Biotyka')],
                // 0 parameters
                projectParameters: [],
                // 1 skill
                projectSkills: [new Skill('sk1', 'Hakerstwo')],
                // 0 features
                projectFeatures: [],
            }

            renderDynamicSuggestions(ctx)

            const statsContainer = document.getElementById('npc-suggested-stats')!
            const vitalsContainer = document.getElementById('npc-suggested-vitals')!
            const skillsContainer = document.getElementById('npc-suggested-skills')!
            const attrsContainer = document.getElementById('npc-suggested-attributes')!

            // Stat chip contains Biotyka
            expect(statsContainer.textContent).toContain('Biotyka')
            // Crucial: Default hardcoded stats like Siła, Zręczność, etc. MUST NOT exist!
            expect(statsContainer.textContent).not.toContain('Siła')
            expect(statsContainer.textContent).not.toContain('Zręczność')
            expect(statsContainer.textContent).not.toContain('Inteligencja')

            // Vitals container is empty in project, so it shows the empty hint
            expect(vitalsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
            expect(vitalsContainer.textContent).not.toContain('Punkty Życia (HP)')
            expect(vitalsContainer.textContent).not.toContain('Mana')

            // Skill chip contains Hakerstwo, NOT default skills like Walka wręcz
            expect(skillsContainer.textContent).toContain('Hakerstwo')
            expect(skillsContainer.textContent).not.toContain('Walka wręcz')
            expect(skillsContainer.textContent).not.toContain('Skradanie')

            // Attributes container is empty in project, so it shows the empty hint
            expect(attrsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
            expect(attrsContainer.textContent).not.toContain('Rasa')
            expect(attrsContainer.textContent).not.toContain('Zawód')
        })

        it('kliknięcie chipu sugestii parametru pobiera skonfigurowaną w projekcie formułę', () => {
            const ctx = {
                projectParameters: [
                    new Parameter(
                        'p-mana',
                        'Moc Astralna',
                        new Description(),
                        'formula',
                        '',
                        'Inteligencja * 3 + 5'
                    ),
                ],
            }

            setupNpcModal(ctx)

            const chip = document.querySelector(
                '.npc-vital-preset-chip[data-preset-vital="Moc Astralna"]'
            ) as HTMLButtonElement
            expect(chip).not.toBeNull()

            chip.click()

            const list = document.getElementById('npc-vitals-list')!
            expect(list.children.length).toBe(1)

            const nameInput = list.querySelector('[data-vital-field="name"]') as HTMLInputElement
            const formulaInput = list.querySelector(
                '[data-vital-field="formula"]'
            ) as HTMLInputElement
            const modeSelect = list.querySelector('[data-vital-field="mode"]') as HTMLSelectElement

            expect(nameInput.value).toBe('Moc Astralna')
            expect(modeSelect.value).toBe('formula')
            expect(formulaInput.value).toBe('Inteligencja * 3 + 5')
        })

        it('gdy projekt nie zawiera żadnych cech, wszystkie sekcje pokazują informację o braku', () => {
            const ctx = {
                projectStats: [],
                projectParameters: [],
                projectSkills: [],
                projectFeatures: [],
            }

            renderDynamicSuggestions(ctx)

            const statsContainer = document.getElementById('npc-suggested-stats')!
            const vitalsContainer = document.getElementById('npc-suggested-vitals')!
            const skillsContainer = document.getElementById('npc-suggested-skills')!
            const attrsContainer = document.getElementById('npc-suggested-attributes')!

            expect(statsContainer.querySelectorAll('button').length).toBe(0)
            expect(vitalsContainer.querySelectorAll('button').length).toBe(0)
            expect(skillsContainer.querySelectorAll('button').length).toBe(0)
            expect(attrsContainer.querySelectorAll('button').length).toBe(0)

            expect(statsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
            expect(vitalsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
            expect(skillsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
            expect(attrsContainer.textContent).toContain('Brak w „Cechy i Atrybuty”')
        })
    })
})
