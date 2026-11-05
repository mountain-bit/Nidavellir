/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type, no-console */
import { describe, expect, it } from 'vitest'

import { Choice } from '../../Model/Choice'
import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { GraphValidationService } from '../../Services/graph/GraphValidationService'
import { ParagraphNumberingService } from '../../Services/graph/ParagraphNumberingService'
import { EntityLinkUpdateService } from '../../Services/markdown/EntityLinkUpdateService'
import { searchProjectObjects } from '../../View/ui/workspace/quickSearchEngine.js'

/**
 * Generates a realistic, large-scale interactive fiction project.
 */
function createSyntheticProject(paragraphCount = 1000): Project {
    const project = new Project('stress_proj', 'Wielka Kampania Fantasy')

    // 1. Entities: 50 Locations, 100 NPCs, 100 Items, 20 Tags
    const tags: Tag[] = []
    for (let i = 1; i <= 20; i++) {
        const tag = new Tag(`tag_${i}`, `Kategoria ${i}`, '#3b82f6')
        tags.push(tag)
        project.addTag(tag)
    }

    const locations: Location[] = []
    for (let i = 1; i <= 50; i++) {
        locations.push(
            new Location(
                `loc_${i}`,
                `Lokacja ${i}`,
                new Description(`Opis lokacji ${i} z prastarymi ruinami.`)
            )
        )
    }
    project.setLocations(locations)

    const npcs: NPC[] = []
    for (let i = 1; i <= 100; i++) {
        const npc = new NPC(
            `npc_${i}`,
            `Postać ${i}`,
            new Description(`Opis postaci niezależnej numer ${i}.`)
        )
        npc.addStat(new Stat(`stat_hp_${i}`, 'Siła', new Description(), 10 + (i % 10)))
        npcs.push(npc)
    }
    project.setCharacters(npcs)

    const items: Item[] = []
    for (let i = 1; i <= 100; i++) {
        items.push(
            new Item(
                `item_${i}`,
                `Przedmiot ${i}`,
                new Description(`Przedmiot ekwipunku numer ${i}.`),
                [],
                [],
                { slotSize: 1, weight: 1 + (i % 5), category: i % 2 === 0 ? 'weapon' : 'misc' }
            )
        )
    }
    project.setItems(items)

    // 2. Paragraphs & Choices
    const paragraphs: Paragraph[] = []
    for (let i = 1; i <= paragraphCount; i++) {
        const isStart = i === 1
        const isEnd = i === paragraphCount
        const pId = isStart ? 'start' : `p_${i}`

        const choices: Choice[] = []
        if (!isEnd) {
            // First forward choice
            const targetA = i + 1 === paragraphCount ? `p_${paragraphCount}` : `p_${i + 1}`
            choices.push(new Choice(`ch_${i}_a`, `Idź do paragrafu ${i + 1}`, pId, targetA))

            // Second choice (branching forward)
            if (i + 2 <= paragraphCount) {
                const targetB = i + 2 === paragraphCount ? `p_${paragraphCount}` : `p_${i + 2}`
                choices.push(new Choice(`ch_${i}_b`, `Ścieżka alternatywna ${i + 2}`, pId, targetB))
            }
        }

        const descText = `Paragraf ${i}. Wkraczasz do komnaty, w której przebywa [Postać 1](entity://character/npc_1). Rozglądasz się uważnie po [Lokacja 1](entity://location/loc_1).`
        const p = new Paragraph(
            pId,
            `Paragraf ${i}`,
            new Description(descText),
            choices,
            false,
            undefined,
            [tags[i % tags.length]],
            [npcs[i % npcs.length]],
            [locations[i % locations.length]]
        )

        if (isStart) p.setIsStart(true)
        if (isEnd) p.setIsEnd(true)

        paragraphs.push(p)
    }
    project.setParagraphs(paragraphs)

    // 3. Scenes (grouping paragraphs proportionally)
    const sceneCount = Math.min(100, Math.max(1, Math.floor(paragraphCount / 20)))
    const paragraphsPerScene = Math.max(1, Math.floor(paragraphCount / sceneCount))
    const scenes: Scene[] = []
    for (let s = 1; s <= sceneCount; s++) {
        const startIdx = (s - 1) * paragraphsPerScene
        const sceneParagraphs = paragraphs.slice(startIdx, startIdx + paragraphsPerScene)
        const scene = new Scene(
            `scene_${s}`,
            `Akt ${s}: Rozdział`,
            undefined,
            sceneParagraphs,
            [npcs[s % npcs.length]],
            locations[s % locations.length],
            [tags[s % tags.length]],
            sceneParagraphs[0]?.getId() || '',
            { x: (s % 5) * 450, y: Math.floor(s / 5) * 350 },
            400,
            300
        )
        scenes.push(scene)
    }
    project.setScenes(scenes)

    return project
}

describe('Testy Obciążeniowe i Wydajnościowe (Stress & Performance)', () => {
    it('Benchmark: Serializacja i deserializacja projektu o skali 1000 paragrafów', () => {
        const project = createSyntheticProject(1000)
        expect(project.getParagraphs()).toHaveLength(1000)
        expect(project.getCharacters()).toHaveLength(100)
        expect(project.getItems()).toHaveLength(100)
        expect(project.getScenes()).toHaveLength(50)

        // 1. Zmierzenie czasu serializacji projektu i wszystkich jego encji
        const t0 = performance.now()
        const projectData = project.toJSON()
        const entitiesData = {
            Paragraphs: project.getParagraphs().map(p => p.toJSON()),
            NPC: project.getCharacters().map(c => c.toJSON()),
            Items: project.getItems().map(i => i.toJSON()),
            Locations: project.getLocations().map(l => l.toJSON()),
        }
        const scenesData = project.getScenes().map(s => s.toJSON())
        const tSerialization = performance.now() - t0

        console.log(
            `[STRESS] Serializacja projektu (1000 paragrafów, 100 NPC, 100 przedmiotów, 50 scen): ${tSerialization.toFixed(2)} ms`
        )
        expect(tSerialization).toBeLessThan(1000) // Bezpieczny próg wydajnościowy
        expect(entitiesData.Paragraphs).toHaveLength(1000)
        expect(entitiesData.NPC).toHaveLength(100)
        expect(entitiesData.Items).toHaveLength(100)
        expect(entitiesData.Locations).toHaveLength(50)
        expect(scenesData).toHaveLength(50)

        // 2. Zmierzenie czasu fromJSON()
        const t1 = performance.now()
        const restored = Project.fromJSON(
            {
                ...projectData,
                graph: { scenes: scenesData },
            } as any,
            entitiesData
        )
        const tDeserialization = performance.now() - t1

        console.log(
            `[STRESS] Project.fromJSON() dla 1000 paragrafów i encji: ${tDeserialization.toFixed(2)} ms`
        )
        expect(tDeserialization).toBeLessThan(1200)
        expect(restored.getParagraphs()).toHaveLength(1000)
        expect(restored.getCharacters()).toHaveLength(100)
        expect(restored.getItems()).toHaveLength(100)
        expect(restored.getLocations()).toHaveLength(50)
        expect(restored.getScenes()).toHaveLength(50)
        expect(restored.getParagraphs()[0].getIsStart()).toBe(true)
        expect(restored.getParagraphs()[999].getIsEnd()).toBe(true)
    })

    it('Benchmark: Ochrona przed przepełnieniem stosu (Call Stack) na 1000-węzłowym łańcuchu liniowym', () => {
        // Graf złożony z 1000 węzłów w pojedynczym długim ciągu 1 -> 2 -> ... -> 1000
        const paragraphs: Paragraph[] = []
        for (let i = 1; i <= 1000; i++) {
            const isStart = i === 1
            const isEnd = i === 1000
            const pId = isStart ? 'start' : `node_${i}`
            const nextId = isEnd ? '' : `node_${i + 1}`

            const choices = nextId ? [new Choice(`ch_${i}`, 'Dalej', pId, nextId)] : []
            const p = new Paragraph(pId, `Węzeł ${i}`, new Description(), choices)
            if (isStart) p.setIsStart(true)
            if (isEnd) p.setIsEnd(true)
            paragraphs.push(p)
        }

        const t0 = performance.now()
        // Walidacja nie może rzucić "Maximum call stack size exceeded"
        const report = GraphValidationService.validateStoryGraph(paragraphs)
        const tValidation = performance.now() - t0

        console.log(
            `[STRESS] Walidacja 1000-węzłowego łańcucha liniowego: ${tValidation.toFixed(2)} ms`
        )
        expect(tValidation).toBeLessThan(500)
        expect(report.isValid).toBe(true)
        expect(report.errorCount).toBe(0)
    })

    it('Benchmark: Walidacja gęstego, silnie połączonego grafu (500 węzłów, 1500 krawędzi, cykle)', () => {
        const paragraphs: Paragraph[] = []
        for (let i = 1; i <= 500; i++) {
            const isStart = i === 1
            const pId = isStart ? 'start' : `p_${i}`

            const choices: Choice[] = [
                new Choice(`ch_${i}_1`, 'Wybór 1', pId, `p_${(i % 500) + 1}`),
                new Choice(`ch_${i}_2`, 'Wybór 2', pId, `p_${((i + 5) % 500) + 1}`),
                new Choice(`ch_${i}_3`, 'Wybór 3', pId, `p_${((i + 25) % 500) + 1}`),
            ]

            const p = new Paragraph(pId, `Paragraf ${i}`, new Description(), choices)
            if (isStart) p.setIsStart(true)
            paragraphs.push(p)
        }

        const t0 = performance.now()
        const report = GraphValidationService.validateStoryGraph(paragraphs)
        const duration = performance.now() - t0

        console.log(
            `[STRESS] Walidacja gęstego grafu 500 węzłów / 1500 krawędzi: ${duration.toFixed(2)} ms (znaleziono problemów: ${report.issuesCount})`
        )
        expect(duration).toBeLessThan(800)
        expect(report.issuesCount).toBeGreaterThan(0) // Powinno wykryć pętle/brak węzła końcowego
    })

    it('Benchmark: Renumeracja i rozwiązywanie kolizji dla 1000 paragrafów ze 100 zablokowanymi numerami', () => {
        const paragraphs: Paragraph[] = []
        for (let i = 1; i <= 1000; i++) {
            const isStart = i === 1
            const p = new Paragraph(isStart ? 'start' : `p_${i}`, `P ${i}`)
            if (isStart) {
                p.setIsStart(true)
            }

            // Co 10-ty paragraf ma zablokowany przez autora numer (np. 10, 20, 30...)
            if (i % 10 === 0) {
                p.setNumber(i)
                p.setIsNumberLocked(true)
            } else {
                p.setRandomizedNumber(0) // Wymaga przydzielenia numeru
            }
            paragraphs.push(p)
        }

        // 1. ensureUniqueNumbers
        const t0 = performance.now()
        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)
        const tAssign = performance.now() - t0

        console.log(`[STRESS] ensureUniqueNumbers() dla 1000 paragrafów: ${tAssign.toFixed(2)} ms`)
        expect(tAssign).toBeLessThan(250)

        // Sprawdzenie unikalności numerów
        const numbers = new Set<number>()
        for (const p of paragraphs) {
            const num = p.getDisplayNumber()
            expect(num).toBeGreaterThan(0)
            expect(numbers.has(num)).toBe(false)
            numbers.add(num)
        }
        expect(numbers.size).toBe(1000)

        // Zablokowane numery muszą pozostać nienaruszone
        for (let i = 10; i <= 1000; i += 10) {
            const lockedP = paragraphs[i - 1]
            expect(lockedP.getDisplayNumber()).toBe(i)
            expect(lockedP.getIsNumberLocked()).toBe(true)
        }

        // 2. reshuffleAllNumbers
        const t1 = performance.now()
        ParagraphNumberingService.reshuffleAllNumbers(paragraphs)
        const tRandomize = performance.now() - t1

        console.log(
            `[STRESS] reshuffleAllNumbers() dla 1000 paragrafów: ${tRandomize.toFixed(2)} ms`
        )
        expect(tRandomize).toBeLessThan(250)

        const numbersAfterRandom = new Set<number>()
        for (const p of paragraphs) {
            const num = p.getDisplayNumber()
            expect(num).toBeGreaterThan(0)
            expect(numbersAfterRandom.has(num)).toBe(false)
            numbersAfterRandom.add(num)
        }
        expect(numbersAfterRandom.size).toBe(1000)
    })

    it('Benchmark: Masowa aktualizacja linków encji (EntityLinkUpdateService) w 300 paragrafach', () => {
        const paragraphs: Paragraph[] = []
        for (let i = 1; i <= 300; i++) {
            const md = `
# Spotkanie ${i}
Wkraczasz do mrocznej krypty. [Arcymag Gorath](entity://character/npc_gorath) wznosi swój kostur.
[Opis: Arcymag Gorath](embed://character/npc_gorath/summary)
            `.trim()
            const p = new Paragraph(`p_${i}`, `Paragraf ${i}`, new Description(md))
            paragraphs.push(p)
        }

        const projectScope = {
            paragraphs,
            characters: [new NPC('npc_gorath', 'Arcymag Gorath')],
            files: {},
        }

        const renameEvent = {
            id: 'npc_gorath',
            oldName: 'Arcymag Gorath',
            newName: 'Gorath Nieśmiertelny',
            type: 'character',
        }

        const t0 = performance.now()
        const result = EntityLinkUpdateService.updateEntityReferences(renameEvent, projectScope)
        const tRename = performance.now() - t0

        console.log(
            `[STRESS] Masowa aktualizacja linków w 300 paragrafach: ${tRename.toFixed(2)} ms (zaktualizowano dokumentów: ${result.updatedMarkdownCount})`
        )
        expect(tRename).toBeLessThan(350)
        expect(result.updatedMarkdownCount).toBe(300)

        // Weryfikacja pierwszego i ostatniego paragrafu
        expect(paragraphs[0].getContent().getText()).toContain(
            '[Gorath Nieśmiertelny](entity://character/npc_gorath)'
        )
        expect(paragraphs[0].getContent().getText()).toContain(
            '[Opis: Gorath Nieśmiertelny](embed://character/npc_gorath/summary)'
        )
        expect(paragraphs[299].getContent().getText()).toContain(
            '[Gorath Nieśmiertelny](entity://character/npc_gorath)'
        )
    })

    it('Benchmark: Szybkie wyszukiwanie (QuickSearchEngine) w projekcie o 1250 elementach', () => {
        const project = createSyntheticProject(1000)

        const mockContext = {
            projectParagraphs: project.getParagraphs(),
            projectScenes: project.getScenes(),
            projectCharacters: project.getCharacters(),
            projectLocations: project.getLocations(),
            projectItems: project.getItems(),
            projectTags: project.getAllTags(),
            openTabs: [],
        }

        const queries = [
            'Paragraf 4',
            'Postać 5',
            'Przedmiot 8',
            'Lokacja 2',
            'Akt 3',
            'nieistniejące',
            '100',
            'ruinami',
            'Kategoria',
            'Ścieżka',
        ]

        // Wykonaj 50 wyszukiwań
        const t0 = performance.now()
        let totalMatches = 0
        for (let cycle = 0; cycle < 5; cycle++) {
            for (const q of queries) {
                const results = searchProjectObjects(mockContext, q)
                totalMatches += results.length
            }
        }
        const totalDuration = performance.now() - t0
        const avgPerQuery = totalDuration / (queries.length * 5)

        console.log(
            `[STRESS] QuickSearch: 50 zapytań w bazie 1250 obiektów zajęło łącznie ${totalDuration.toFixed(2)} ms (średnio ${avgPerQuery.toFixed(2)} ms/zapytanie)`
        )
        expect(totalDuration).toBeLessThan(3500) // Łączny czas 50 zapytań w projekcie 1250 obiektów
        expect(avgPerQuery).toBeLessThan(70) // Średnio < 70 ms na zapytanie (UI responsiveness)
        expect(totalMatches).toBeGreaterThan(0)
    })

    describe('Ekstremalna Skala: 10 000 Paragrafów (Mega-Project Scale)', () => {
        it('Benchmark: Serializacja i deserializacja projektu o skali 10 000 paragrafów', () => {
            const project = createSyntheticProject(10000)
            expect(project.getParagraphs()).toHaveLength(10000)
            expect(project.getCharacters().length).toBeGreaterThanOrEqual(100)
            expect(project.getItems().length).toBeGreaterThanOrEqual(100)
            expect(project.getScenes().length).toBe(100)

            // 1. Zmierzenie czasu serializacji projektu i 10 000 paragrafów
            const t0 = performance.now()
            const projectData = project.toJSON()
            const entitiesData = {
                Paragraphs: project.getParagraphs().map(p => p.toJSON()),
                NPC: project.getCharacters().map(c => c.toJSON()),
                Items: project.getItems().map(i => i.toJSON()),
                Locations: project.getLocations().map(l => l.toJSON()),
            }
            const scenesData = project.getScenes().map(s => s.toJSON())
            const tSerialization = performance.now() - t0

            console.log(
                `[STRESS 10k] Serializacja projektu (10 000 paragrafów, ${entitiesData.NPC.length} NPC, ${entitiesData.Items.length} przedmiotów, ${scenesData.length} scen): ${tSerialization.toFixed(2)} ms`
            )
            expect(tSerialization).toBeLessThan(5000)
            expect(entitiesData.Paragraphs).toHaveLength(10000)

            // 2. Zmierzenie czasu fromJSON()
            const t1 = performance.now()
            const restored = Project.fromJSON(
                {
                    ...projectData,
                    graph: { scenes: scenesData },
                } as any,
                entitiesData
            )
            const tDeserialization = performance.now() - t1

            console.log(
                `[STRESS 10k] Project.fromJSON() dla 10 000 paragrafów i encji: ${tDeserialization.toFixed(2)} ms`
            )
            expect(tDeserialization).toBeLessThan(7000)
            expect(restored.getParagraphs()).toHaveLength(10000)
            expect(restored.getScenes()).toHaveLength(100)
            expect(restored.getParagraphs()[0].getIsStart()).toBe(true)
            expect(restored.getParagraphs()[9999].getIsEnd()).toBe(true)
        })

        it('Benchmark: Renumeracja i rozwiązywanie kolizji dla 10 000 paragrafów z 1000 zablokowanymi numerami', () => {
            const paragraphs: Paragraph[] = []
            for (let i = 1; i <= 10000; i++) {
                const isStart = i === 1
                const p = new Paragraph(isStart ? 'start' : `p_${i}`, `P ${i}`)
                if (isStart) {
                    p.setIsStart(true)
                }

                // Co 10-ty paragraf ma zablokowany numer (10, 20, ..., 10000)
                if (i % 10 === 0) {
                    p.setNumber(i)
                    p.setIsNumberLocked(true)
                } else {
                    p.setRandomizedNumber(0)
                }
                paragraphs.push(p)
            }

            // 1. ensureUniqueNumbers na 10k
            const t0 = performance.now()
            ParagraphNumberingService.ensureUniqueNumbers(paragraphs)
            const tAssign = performance.now() - t0

            console.log(
                `[STRESS 10k] ensureUniqueNumbers() dla 10 000 paragrafów: ${tAssign.toFixed(2)} ms`
            )
            expect(tAssign).toBeLessThan(1500)

            const numbers = new Set<number>()
            for (const p of paragraphs) {
                const num = p.getDisplayNumber()
                expect(num).toBeGreaterThan(0)
                expect(numbers.has(num)).toBe(false)
                numbers.add(num)
            }
            expect(numbers.size).toBe(10000)

            // Weryfikacja że zablokowane numery pozostały nienaruszone
            for (let i = 10; i <= 10000; i += 10) {
                const lockedP = paragraphs[i - 1]
                expect(lockedP.getDisplayNumber()).toBe(i)
                expect(lockedP.getIsNumberLocked()).toBe(true)
            }

            // 2. reshuffleAllNumbers na 10k
            const t1 = performance.now()
            ParagraphNumberingService.reshuffleAllNumbers(paragraphs)
            const tRandomize = performance.now() - t1

            console.log(
                `[STRESS 10k] reshuffleAllNumbers() dla 10 000 paragrafów: ${tRandomize.toFixed(2)} ms`
            )
            expect(tRandomize).toBeLessThan(1500)

            const numbersAfterRandom = new Set<number>()
            for (const p of paragraphs) {
                const num = p.getDisplayNumber()
                expect(num).toBeGreaterThan(0)
                expect(numbersAfterRandom.has(num)).toBe(false)
                numbersAfterRandom.add(num)
            }
            expect(numbersAfterRandom.size).toBe(10000)
        })

        it('Benchmark: Masowa aktualizacja linków encji (EntityLinkUpdateService) w 10 000 paragrafach', () => {
            const paragraphs: Paragraph[] = []
            for (let i = 1; i <= 10000; i++) {
                const md = `
# Spotkanie ${i}
Wkraczasz do sali numer ${i}. [Arcymag Gorath](entity://character/npc_gorath) rzuca zaklęcie.
[Opis: Arcymag Gorath](embed://character/npc_gorath/summary)
                `.trim()
                const p = new Paragraph(`p_${i}`, `Paragraf ${i}`, new Description(md))
                paragraphs.push(p)
            }

            const projectScope = {
                paragraphs,
                characters: [new NPC('npc_gorath', 'Arcymag Gorath')],
                files: {},
            }

            const renameEvent = {
                id: 'npc_gorath',
                oldName: 'Arcymag Gorath',
                newName: 'Gorath Nieśmiertelny',
                type: 'character',
            }

            const t0 = performance.now()
            const result = EntityLinkUpdateService.updateEntityReferences(renameEvent, projectScope)
            const tRename = performance.now() - t0

            console.log(
                `[STRESS 10k] Masowa aktualizacja linków w 10 000 paragrafach: ${tRename.toFixed(2)} ms (zaktualizowano dokumentów: ${result.updatedMarkdownCount})`
            )
            expect(tRename).toBeLessThan(3000)
            expect(result.updatedMarkdownCount).toBe(10000)

            expect(paragraphs[0].getContent().getText()).toContain(
                '[Gorath Nieśmiertelny](entity://character/npc_gorath)'
            )
            expect(paragraphs[0].getContent().getText()).toContain(
                '[Opis: Gorath Nieśmiertelny](embed://character/npc_gorath/summary)'
            )
            expect(paragraphs[5000].getContent().getText()).toContain(
                '[Gorath Nieśmiertelny](entity://character/npc_gorath)'
            )
            expect(paragraphs[9999].getContent().getText()).toContain(
                '[Gorath Nieśmiertelny](entity://character/npc_gorath)'
            )
        })

        it('Benchmark: Szybkie wyszukiwanie (QuickSearchEngine) w mega-projekcie (10 000 paragrafów)', () => {
            const project = createSyntheticProject(10000)

            const mockContext = {
                projectParagraphs: project.getParagraphs(),
                projectScenes: project.getScenes(),
                projectCharacters: project.getCharacters(),
                projectLocations: project.getLocations(),
                projectItems: project.getItems(),
                projectTags: project.getAllTags(),
                openTabs: [],
            }

            const queries = [
                'Paragraf 9999',
                'Postać 50',
                'Przedmiot 75',
                'Lokacja 10',
                'Akt 90',
                'nieistniejące',
            ]

            const t0 = performance.now()
            let totalMatches = 0
            for (const q of queries) {
                const results = searchProjectObjects(mockContext, q)
                totalMatches += results.length
            }
            const totalDuration = performance.now() - t0
            const avgPerQuery = totalDuration / queries.length

            console.log(
                `[STRESS 10k] QuickSearch: ${queries.length} zapytań w bazie 10 270 obiektów zajęło łącznie ${totalDuration.toFixed(2)} ms (średnio ${avgPerQuery.toFixed(2)} ms/zapytanie)`
            )
            expect(totalDuration).toBeLessThan(2500)
            expect(avgPerQuery).toBeLessThan(300) // Bezpieczny próg dla przeszukania ponad 10 tysięcy encji
            expect(totalMatches).toBeGreaterThan(0)
        })
    })
})
