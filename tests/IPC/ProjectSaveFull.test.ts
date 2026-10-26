import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ProjectManager } from '../../Services/ProjectManager'
import { extractProjectData } from '../../View/mockData.js'

const require = createRequire(import.meta.url)
const ProjectService = require('../../main/services/ProjectService.js')

describe('ProjectService.saveFullProject Integration Tests', () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'silnik-save-full-test-'))
        await ProjectService.createProject({
            id: 'save_test_project',
            name: 'Projekt Zapis Test',
            author: 'Autor Test',
            projectPath: tempDir,
        })
    })

    afterEach(() => {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        } catch {
            // ignore cleanup errors
        }
    })

    it('zapisuje pełny stan projektu (paragrafy, sceny, encje, pliki markdown i manifest)', async () => {
        const payload = {
            project: {
                id: 'save_test_project',
                name: 'Zaktualizowana Nazwa',
                author: 'Nowy Autor',
                version: '1.2.0',
                graph: {
                    scenes: [
                        {
                            id: 'scene_act1',
                            name: 'Akt Pierwszy',
                            color: '#10b981',
                            position: { x: 50, y: 100 },
                            paragraphs: ['p_start', 'p_forest'],
                        },
                    ],
                },
            },
            paragraphs: [
                {
                    id: 'p_start',
                    title: 'Węzeł Początkowy',
                    isStart: true,
                    sceneId: 'scene_act1',
                    position: { x: 120, y: 240 },
                    description: '# Witaj w karczmie\n\nSiedzisz przy stole.',
                    choices: [
                        {
                            id: 'c_to_forest',
                            name: 'Idź do lasu',
                            targetId: 'p_forest',
                            condition: 'Siła > 10',
                        },
                    ],
                    tags: ['tag_start'],
                    characters: ['npc_innkeeper'],
                    locations: ['loc_inn'],
                },
                {
                    id: 'p_forest',
                    title: 'Mroczny Las',
                    isStart: false,
                    sceneId: 'scene_act1',
                    position: { x: 450, y: 240 },
                    description: 'Otaczają cię ponure drzewa.',
                    choices: [],
                },
            ],
            scenes: [
                {
                    id: 'scene_act1',
                    name: 'Akt Pierwszy',
                    color: '#10b981',
                    position: { x: 50, y: 100 },
                    paragraphs: ['p_start', 'p_forest'],
                },
            ],
            entities: {
                NPC: [
                    {
                        id: 'npc_innkeeper',
                        name: 'Karczmarz Barnaba',
                        type: 'NPC',
                        description: 'Wąsaty i jowialny właściciel oberży.',
                        stats: [{ name: 'Zdrowie', value: 20 }],
                    },
                ],
                Locations: [
                    {
                        id: 'loc_inn',
                        name: 'Pod Złotym Kurem',
                        type: 'Location',
                        description: 'Ciepła i zadymiona gospoda.',
                    },
                ],
                Items: [
                    {
                        id: 'item_sword',
                        name: 'Żelazny Miecz',
                        type: 'Item',
                        description: 'Dobrze wyważony oręż.',
                    },
                ],
                Rules: [
                    {
                        id: 'stat_str',
                        name: 'Siła',
                        type: 'Stat',
                    },
                ],
            },
            files: {
                'Notatki.md': '# Notatki fabularne\n\nPlanowane questy...',
            },
        }

        const saveRes = await ProjectService.saveFullProject(tempDir, payload)
        expect(saveRes.success).toBe(true)

        // 1. Sprawdzenie plików paragrafów na dysku
        const startParaFolder = path.join(tempDir, 'Paragraphs', 'p_start')
        expect(fs.existsSync(startParaFolder)).toBe(true)
        const startElementJson = JSON.parse(
            fs.readFileSync(path.join(startParaFolder, 'element.json'), 'utf8')
        )
        expect(startElementJson.id).toBe('p_start')
        expect(startElementJson.title).toBe('Węzeł Początkowy')
        expect(startElementJson.isStart).toBe(true)
        expect(startElementJson.sceneId).toBe('scene_act1')
        expect(startElementJson.position).toEqual({ x: 120, y: 240 })
        expect(startElementJson.choices).toHaveLength(1)
        expect(startElementJson.choices[0].name).toBe('Idź do lasu')
        expect(startElementJson.choices[0].targetId).toBe('p_forest')

        // Description file
        const descFiles = fs.readdirSync(startParaFolder).filter(f => f.endsWith('.md'))
        expect(descFiles.length).toBeGreaterThan(0)
        const descContent = fs.readFileSync(path.join(startParaFolder, descFiles[0]), 'utf8')
        expect(descContent).toContain('Witaj w karczmie')

        // Paragraphs meta.json
        const paraMetaPath = path.join(tempDir, 'Paragraphs', 'meta.json')
        expect(fs.existsSync(paraMetaPath)).toBe(true)
        const paraMeta = JSON.parse(fs.readFileSync(paraMetaPath, 'utf8'))
        expect(paraMeta.elements).toEqual(['./p_start/element.json', './p_forest/element.json'])

        // 2. Sprawdzenie encji NPC
        const npcFolder = path.join(tempDir, 'NPC', 'npc_innkeeper')
        expect(fs.existsSync(npcFolder)).toBe(true)
        const npcData = JSON.parse(fs.readFileSync(path.join(npcFolder, 'element.json'), 'utf8'))
        expect(npcData.name).toBe('Karczmarz Barnaba')

        // 3. Sprawdzenie pliku markdown
        const notesFile = path.join(tempDir, 'Notatki.md')
        expect(fs.existsSync(notesFile)).toBe(true)
        expect(fs.readFileSync(notesFile, 'utf8')).toContain('Planowane questy')

        // 4. Sprawdzenie zaktualizowanego project.json
        const projectJson = JSON.parse(fs.readFileSync(path.join(tempDir, 'project.json'), 'utf8'))
        expect(projectJson.name).toBe('Zaktualizowana Nazwa')
        expect(projectJson.author).toBe('Nowy Autor')
        expect(projectJson.version).toBe('1.2.0')
        expect(projectJson.graph.scenes).toHaveLength(1)
        expect(projectJson.graph.scenes[0].name).toBe('Akt Pierwszy')

        // 5. Pełny round-trip: otwarcie przez ProjectService.openProject -> ProjectManager.load -> extractProjectData
        const openRes = await ProjectService.openProject(tempDir)
        expect(openRes.success).toBe(true)
        expect(openRes.project.name).toBe('Zaktualizowana Nazwa')
        expect(openRes.entities.NPC).toHaveLength(1)
        expect(openRes.entities.NPC[0].name).toBe('Karczmarz Barnaba')
        expect(openRes.entities.Paragraphs).toHaveLength(2)

        const projectInstance = ProjectManager.getInstance().load(
            openRes.project,
            openRes.entities,
            tempDir
        )
        expect(projectInstance.getName()).toBe('Zaktualizowana Nazwa')

        const extracted = extractProjectData(projectInstance, openRes.files)
        expect(extracted.projectParagraphs.length).toBeGreaterThanOrEqual(2)
        const loadedStart = extracted.projectParagraphs.find(
            (p: any) => p.getId && p.getId() === 'p_start'
        )
        expect(loadedStart).toBeDefined()
        expect(loadedStart.getTitle()).toBe('Węzeł Początkowy')
        expect(loadedStart.getPosition()).toEqual({ x: 120, y: 240 })
        expect(loadedStart.getChoices()).toHaveLength(1)
        expect(loadedStart.getChoices()[0].getName()).toBe('Idź do lasu')
        expect(loadedStart.getChoices()[0].getTargetId()).toBe('p_forest')
    })

    it('zwraca błąd dla nieistniejącej ścieżki projektu', async () => {
        const nonExistent = path.join(tempDir, 'non_existent_folder_abc')
        const res = await ProjectService.saveFullProject(nonExistent, {
            project: { name: 'Test' },
        })
        expect(res.success).toBe(false)
        expect(res.error).toBeDefined()
    })

    it('zwraca błąd przy niepoprawnym payloadzie', async () => {
        const res = await ProjectService.saveFullProject(tempDir, null)
        expect(res.success).toBe(false)
        expect(res.error).toContain('payload')
    })

    it('zapisuje i poprawnie odczytuje bohatera gracza (PlayerCharacter)', async () => {
        const payload = {
            project: {
                id: 'save_test_project',
                name: 'Projekt z Bohaterem',
            },
            entities: {
                PlayerCharacter: [
                    {
                        id: 'hero_geralt',
                        name: 'Geralt z Rivii',
                        type: 'PlayerCharacter',
                        description: { text: 'Wiedźmin z Cechu Wilka', summary: 'Biały Wilk' },
                        avatar: 'avatar_wolf',
                        stats: [{ name: 'Zręczność', value: 16 }],
                        skills: [{ name: 'Szermierka', value: '+3', statName: 'Zręczność' }],
                        parameters: [{ name: 'Żywotność', value: 100, mode: 'direct' }],
                        tags: [{ name: 'Wiedźmin', color: '#ff0000' }],
                    },
                ],
            },
        }

        const saveRes = await ProjectService.saveFullProject(tempDir, payload)
        expect(saveRes.success).toBe(true)

        // Sprawdzenie na dysku
        const heroFolder = path.join(tempDir, 'PlayerCharacter', 'hero_geralt')
        expect(fs.existsSync(heroFolder)).toBe(true)
        const heroFile = path.join(heroFolder, 'element.json')
        expect(fs.existsSync(heroFile)).toBe(true)
        const heroJson = JSON.parse(fs.readFileSync(heroFile, 'utf8'))
        expect(heroJson.name).toBe('Geralt z Rivii')
        expect(heroJson.avatar).toBe('avatar_wolf')

        // Sprawdzenie w openProject
        const openRes = await ProjectService.openProject(tempDir)
        expect(openRes.success).toBe(true)
        expect(openRes.entities.PlayerCharacter).toBeDefined()
        expect(openRes.entities.PlayerCharacter).toHaveLength(1)
        expect(openRes.entities.PlayerCharacter[0].name).toBe('Geralt z Rivii')

        // Sprawdzenie po załadowaniu do instancji Projektu
        const projectInstance = ProjectManager.getInstance().load(
            openRes.project,
            openRes.entities,
            tempDir
        )
        const loadedHero = projectInstance.getPlayerCharacter()
        expect(loadedHero).toBeDefined()
        expect(loadedHero.getName()).toBe('Geralt z Rivii')
        expect(loadedHero.getAvatar()).toBe('avatar_wolf')
        expect(loadedHero.getDescription().getText()).toBe('Wiedźmin z Cechu Wilka')

        // Sprawdzenie extractProjectData
        const extracted = extractProjectData(projectInstance, openRes.files)
        expect(extracted.playerCharacter).toBeDefined()
        expect(extracted.playerCharacter.getName()).toBe('Geralt z Rivii')
        expect(extracted.playerCharacters).toHaveLength(1)
    })

    it('zapisuje szablony (Templates) w folderze o nazwie ID a nie nazwy i usuwa stary zdublowany katalog po nazwie', async () => {
        // Symulacja: istniał stary folder po nazwie 'bandyta' z tym samym ID szablonu
        const oldLegacyFolder = path.join(tempDir, 'Templates', 'bandyta')
        fs.mkdirSync(oldLegacyFolder, { recursive: true })
        fs.writeFileSync(
            path.join(oldLegacyFolder, 'element.json'),
            JSON.stringify({
                id: 'template_bandit_1',
                name: 'Bandyta',
                description: {
                    filePath: './Templates/bandyta/Description_Templates_Bandyta.md',
                    text: 'Stary opis',
                },
            }),
            'utf8'
        )

        const metaPath = path.join(tempDir, 'Templates', 'meta.json')
        fs.writeFileSync(
            metaPath,
            JSON.stringify({
                description: 'Folder for Templates',
                path: './Templates',
                descriptionPaths: [],
                imagePaths: [],
                elements: ['./bandyta/element.json'],
            }),
            'utf8'
        )

        // Zapis pełnego projektu z encją o id 'template_bandit_1'
        const payload = {
            project: {
                id: 'save_test_project',
                name: 'Projekt Test',
                author: 'Autor',
                version: '1.0.0',
            },
            paragraphs: [],
            scenes: [],
            entities: {
                Templates: [
                    {
                        id: 'template_bandit_1',
                        name: 'Bandyta',
                        description: {
                            filePath: './Templates/bandyta/Description_Templates_Bandyta.md',
                            text: 'Nowy opis bandyty',
                        },
                    },
                ],
            },
        }

        const saveRes = await ProjectService.saveFullProject(tempDir, payload)
        expect(saveRes.success).toBe(true)

        // Sprawdzenie: nowy folder po ID istnieje
        const idFolder = path.join(tempDir, 'Templates', 'template_bandit_1')
        expect(fs.existsSync(idFolder)).toBe(true)
        expect(fs.existsSync(path.join(idFolder, 'element.json'))).toBe(true)

        // Sprawdzenie: stary folder po nazwie został usunięty (brak duplikatów / klonów na dysku)
        expect(fs.existsSync(oldLegacyFolder)).toBe(false)

        // Sprawdzenie meta.json: zawiera tylko ścieżkę po ID
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        expect(meta.elements).toEqual(['./template_bandit_1/element.json'])

        // Sprawdzenie openProject: wczytuje dokładnie 1 szablon bez klonów
        const openRes = await ProjectService.openProject(tempDir)
        expect(openRes.entities.Templates).toHaveLength(1)
        expect(openRes.entities.Templates[0].id).toBe('template_bandit_1')
    })
})
