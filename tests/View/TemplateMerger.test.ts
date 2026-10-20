// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC_Template } from '../../Model/NPC_Template'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import * as state from '../../View/ui/modals/npc/npcState.js'
import {
    extractTemplateAttributes,
    extractTemplateSkills,
    extractTemplateStats,
    extractTemplateTags,
    extractTemplateVitals,
    mergeTemplateIntoModalState,
} from '../../View/ui/modals/npc/templateMerger.js'

describe('TemplateMerger Engine', () => {
    beforeEach(() => {
        state.resetState()
    })

    it('poprawnie wyodrębnia statystyki, umiejętności, parametry, atrybuty i tagi z instancji NPC_Template', () => {
        const desc = new Description('Opis szablonu', 'Krótkie podsumowanie')
        const tpl = new NPC_Template(
            'tpl-1',
            'Strażnik',
            desc,
            [new Stat('st1', 'Siła', new Description(), 15)],
            [new Skill('sk1', 'Miecz jednoręczny', new Description(), 'direct', '+3')],
            [new Feature('f1', 'Rasa', new Description('Człowiek'))],
            [new Tag('t1', 'Miasto')],
            'guard',
            [new Parameter('p1', 'Punkty Życia', new Description(), 'formula', 'Siła * 4')],
            [{ name: 'Frakcja', value: 'Straż Miejska' }]
        )

        const stats = extractTemplateStats(tpl)
        expect(stats).toEqual([{ name: 'Siła', value: '15' }])

        const skills = extractTemplateSkills(tpl)
        expect(skills).toEqual([
            { name: 'Miecz jednoręczny', mode: 'direct', value: '+3', statName: '', modifier: '' },
        ])

        const vitals = extractTemplateVitals(tpl)
        expect(vitals).toEqual([
            { name: 'Punkty Życia', mode: 'formula', value: '', formula: 'Siła * 4' },
        ])

        const attrs = extractTemplateAttributes(tpl)
        expect(attrs).toEqual([
            { name: 'Frakcja', value: 'Straż Miejska' },
            { name: 'Rasa', value: 'Człowiek' },
        ])

        const tags = extractTemplateTags(tpl)
        expect(tags).toHaveLength(1)
        expect(tags[0].name).toBe('Miasto')
    })

    it('aplikuje pierwszy szablon do pustego stanu postaci/szablonu', () => {
        let summaryVal = ''
        let descVal = ''
        let avatarVal = ''

        const tpl = new NPC_Template(
            'tpl-warrior',
            'Wojownik',
            new Description('Doświadczony weteran pól bitewnych', 'Wojownik zahartowany w boju'),
            [new Stat('s1', 'Siła', new Description(), 16)],
            [new Skill('sk1', 'Zwarcie', new Description(), 'direct', '+2')],
            [new Feature('f1', 'Klasa', new Description('Wojownik'))],
            [new Tag('t1', 'Bojowy', '#ef4444')],
            'knight',
            [new Parameter('p1', 'Kondycja', new Description(), 'direct', 45)],
            [{ name: 'Poziom', value: 'Weteran' }]
        )

        const report = mergeTemplateIntoModalState(tpl, {
            getSummary: () => summaryVal,
            setSummary: (val: string) => {
                summaryVal = val
            },
            getDescription: () => descVal,
            setDescription: (val: string) => {
                descVal = val
            },
            setAvatar: (val: string) => {
                avatarVal = val
            },
        })

        expect(report.templateName).toBe('Wojownik')
        expect(report.addedStats).toEqual(['Siła'])
        expect(report.addedSkills).toEqual(['Zwarcie'])
        expect(report.addedVitals).toEqual(['Kondycja'])
        expect(report.addedAttributes).toContain('Poziom')
        expect(report.addedTags).toEqual(['Bojowy'])
        expect(report.skippedStats).toHaveLength(0)
        expect(report.skippedVitals).toHaveLength(0)
        expect(report.totalAdded).toBeGreaterThanOrEqual(5)
        expect(report.totalSkipped).toBe(0)

        // Awatar zaktualizowany z domyślnego
        expect(state.getCurrentAvatarId()).toBe('knight')
        expect(avatarVal).toBe('knight')
        expect(summaryVal).toBe('Wojownik zahartowany w boju')
        expect(descVal).toBe('Doświadczony weteran pól bitewnych')

        // Lista zaaplikowanych szablonów
        expect(state.getAppliedTemplates()).toHaveLength(1)
        expect(state.getAppliedTemplates()[0].name).toBe('Wojownik')
    })

    it('pomija powtórzone parametry i cechy przy dodawaniu drugiego szablonu (Deduplication Rule)', () => {
        // 1. Nakładamy pierwszy szablon: Krasnolud (ma Siła, Kondycja, Rasa)
        const tplDwarf = new NPC_Template(
            'tpl-dwarf',
            'Krasnolud',
            new Description('Krasnolud z gór', 'Górski krasnolud'),
            [new Stat('s1', 'Siła', new Description(), 14)],
            [new Skill('sk1', 'Odporność', new Description(), 'direct', '+4')],
            [],
            [new Tag('t1', 'Krasnolud')],
            'dwarf',
            [new Parameter('p1', 'Punkty Życia', new Description(), 'direct', 60)],
            [{ name: 'Rasa', value: 'Krasnolud' }]
        )

        let summary = ''
        mergeTemplateIntoModalState(tplDwarf, {
            getSummary: () => summary,
            setSummary: (s: string) => {
                summary = s
            },
        })

        expect(state.getNpcStatsArray()).toHaveLength(1)
        expect(state.getNpcVitalsArray()).toHaveLength(1)
        expect(state.getNpcStatsArray()[0].value).toBe('14')
        expect(state.getNpcVitalsArray()[0].value).toBe('60')

        // 2. Nakładamy drugi szablon: Berserker (również ma Siłę i Punkty Życia, ale inne wartości, oraz nową umiejętność Szał)
        const tplBerserker = new NPC_Template(
            'tpl-berserker',
            'Berserker',
            new Description('Szał bojowy', 'Wojownik szału'),
            [
                new Stat('s2', 'Siła', new Description(), 18), // DUPLIKAT NAZWY!
                new Stat('s3', 'Szybkość', new Description(), 12), // NOWA CECHA
            ],
            [
                new Skill('sk2', 'Szał bojowy', new Description(), 'direct', '+5'), // NOWA UMIEJĘTNOŚĆ
            ],
            [],
            [
                new Tag('t2', 'Bojowy'),
                new Tag('t3', 'Krasnolud'), // DUPLIKAT TAGA!
            ],
            'barbarian',
            [
                new Parameter('p2', 'Punkty Życia', new Description(), 'formula', 'Siła * 5'), // DUPLIKAT PARAMETRU!
                new Parameter('p3', 'Furia', new Description(), 'direct', 100), // NOWY PARAMETR
            ],
            [
                { name: 'Rasa', value: 'Człowiek' }, // DUPLIKAT ATRYBUTU!
                { name: 'Styl walki', value: 'Dwa topory' }, // NOWY ATRYBUT
            ]
        )

        const report2 = mergeTemplateIntoModalState(tplBerserker, {
            getSummary: () => summary,
            setSummary: (s: string) => {
                summary = s
            },
        })

        // Weryfikacja raportu scalania
        expect(report2.addedStats).toEqual(['Szybkość'])
        expect(report2.skippedStats).toEqual(['Siła'])

        expect(report2.addedSkills).toEqual(['Szał bojowy'])
        expect(report2.skippedSkills).toHaveLength(0)

        expect(report2.addedVitals).toEqual(['Furia'])
        expect(report2.skippedVitals).toEqual(['Punkty Życia'])

        expect(report2.addedAttributes).toEqual(['Styl walki'])
        expect(report2.skippedAttributes).toEqual(['Rasa'])

        expect(report2.addedTags).toEqual(['Bojowy'])
        expect(report2.skippedTags).toEqual(['Krasnolud'])

        expect(report2.totalSkipped).toBe(4) // Siła, Punkty Życia, Rasa, Krasnolud

        // Weryfikacja stanu: pierwotne wartości zostały nienaruszone
        const currentStats = state.getNpcStatsArray()
        expect(currentStats).toHaveLength(2) // Siła + Szybkość
        const silaStat = currentStats.find((s: any) => s.name === 'Siła')
        expect(silaStat?.value).toBe('14') // Zachowano pierwotną wartość 14, nie nadpisano 18!

        const currentVitals = state.getNpcVitalsArray()
        expect(currentVitals).toHaveLength(2) // Punkty Życia + Furia
        const hpParam = currentVitals.find((v: any) => v.name === 'Punkty Życia')
        expect(hpParam?.mode).toBe('direct')
        expect(hpParam?.value).toBe('60') // Zachowano pierwotną wartość 60, nie nadpisano formuły!

        // Lista zaaplikowanych szablonów zawiera oba szablony
        expect(state.getAppliedTemplates()).toHaveLength(2)
        expect(state.getAppliedTemplates().map((t: any) => t.name)).toEqual([
            'Krasnolud',
            'Berserker',
        ])
    })

    it('działa przy tworzeniu szablonu z innego szablonu (kompozycja archetypów)', () => {
        // Ustawiamy tryb na szablon
        state.setModalMode('template')

        const tplBase = new NPC_Template(
            'tpl-base-mage',
            'Mag Adept',
            new Description('', 'Bazowy adept magii'),
            [new Stat('s1', 'Intelekt', new Description(), 14)],
            [new Skill('sk1', 'Koncentracja', new Description(), 'direct', '+2')],
            [],
            [],
            'wizard',
            [new Parameter('p1', 'Mana', new Description(), 'direct', 50)]
        )

        const report = mergeTemplateIntoModalState(tplBase)
        expect(report.addedStats).toEqual(['Intelekt'])
        expect(report.addedSkills).toEqual(['Koncentracja'])
        expect(report.addedVitals).toEqual(['Mana'])

        expect(state.getModalMode()).toBe('template')
        expect(state.getAppliedTemplates()).toHaveLength(1)
        expect(state.getAppliedTemplates()[0].name).toBe('Mag Adept')
    })
})
