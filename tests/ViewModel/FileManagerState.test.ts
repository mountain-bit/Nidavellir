/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
import { beforeEach, describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'
import { ProjectManager } from '../../Services/project/ProjectManager'
import { FileManagerState } from '../../ViewModel/mainWindow/FileManagerState'
import type { IHistoryItem } from '../../ViewModel/mainWindow/types'
import { WorkspaceLayoutState } from '../../ViewModel/mainWindow/WorkspaceLayoutState'

describe('FileManagerState', () => {
    let layoutState: WorkspaceLayoutState
    let selectedItem: IHistoryItem | null
    let fileManagerState: FileManagerState

    beforeEach(() => {
        layoutState = new WorkspaceLayoutState()
        selectedItem = null
        fileManagerState = new FileManagerState(layoutState, () => selectedItem)
        ProjectManager.getInstance().clear()
    })

    describe('initial state and active file handling', () => {
        it('starts with no active or open files', () => {
            expect(fileManagerState.getActiveFile()).toBeNull()
            expect(fileManagerState.getOpenFiles()).toEqual([])
            expect(fileManagerState.getFileDisplayName(null)).toBe('')
        })

        it('sets active file, switches view to markdown and adds to open files', () => {
            fileManagerState.setActiveFile('test.md')
            expect(fileManagerState.getActiveFile()).toBe('test.md')
            expect(fileManagerState.getOpenFiles()).toEqual(['test.md'])
            expect(layoutState.getActiveMainView()).toBe('markdown')

            // Setting same file again doesn't duplicate in openFiles
            fileManagerState.setActiveFile('test.md')
            expect(fileManagerState.getOpenFiles()).toEqual(['test.md'])

            // Setting null does not switch view
            layoutState.setActiveMainView('graph')
            fileManagerState.setActiveFile(null)
            expect(fileManagerState.getActiveFile()).toBeNull()
            expect(layoutState.getActiveMainView()).toBe('graph')
        })

        it('closes files and updates active file accordingly', () => {
            fileManagerState.setActiveFile('file1.md')
            fileManagerState.setActiveFile('file2.md')
            fileManagerState.setActiveFile('file3.md')
            expect(fileManagerState.getOpenFiles()).toEqual(['file1.md', 'file2.md', 'file3.md'])
            expect(fileManagerState.getActiveFile()).toBe('file3.md')

            // Close non-active file
            fileManagerState.closeFile('file2.md')
            expect(fileManagerState.getOpenFiles()).toEqual(['file1.md', 'file3.md'])
            expect(fileManagerState.getActiveFile()).toBe('file3.md')

            // Close active file - activates the previous remaining file
            fileManagerState.closeFile('file3.md')
            expect(fileManagerState.getOpenFiles()).toEqual(['file1.md'])
            expect(fileManagerState.getActiveFile()).toBe('file1.md')

            // Close the last remaining file - activeFile becomes null
            fileManagerState.closeFile('file1.md')
            expect(fileManagerState.getOpenFiles()).toEqual([])
            expect(fileManagerState.getActiveFile()).toBeNull()
        })
    })

    describe('openOrCreateDescriptionFile', () => {
        it('returns empty result when no item or entity is selected', () => {
            selectedItem = null
            const res1 = fileManagerState.openOrCreateDescriptionFile()
            expect(res1).toEqual({ fileName: '', content: '' })

            selectedItem = { id: '1', type: 'character', name: 'Jan', entity: null as any }
            const res2 = fileManagerState.openOrCreateDescriptionFile()
            expect(res2).toEqual({ fileName: '', content: '' })
        })

        it('generates filename and default content when description is empty', () => {
            const desc = new Description()
            const npc = new NPC('npc_1', 'Karczmarz Jan', desc)

            selectedItem = {
                id: 'npc_1',
                type: 'character',
                name: 'Karczmarz Jan',
                entity: npc,
            }

            const res = fileManagerState.openOrCreateDescriptionFile()
            expect(res.fileName).toBe('Description_NPC_Karczmarz_Jan.md')
            expect(res.content).toContain('# Karczmarz Jan')
            expect(res.content).toContain('Narrative text for players.')
            expect(desc.getFilePath()).toBe('Description_NPC_Karczmarz_Jan.md')
            expect(fileManagerState.getActiveFile()).toBe('Description_NPC_Karczmarz_Jan.md')
            expect(fileManagerState.getFileDisplayName('Description_NPC_Karczmarz_Jan.md')).toBe(
                'Karczmarz Jan'
            )
        })

        it('uses existing description file path and preserves existing content', () => {
            const desc = new Description(
                'Istniejący opis lokacji.',
                '',
                'custom/dir\\Stara_Wiezowka.md'
            )
            const loc = new Location('loc_1', 'Wieża', desc)

            selectedItem = {
                id: 'loc_1',
                type: 'location',
                name: 'Wieża',
                entity: loc,
            }

            const res = fileManagerState.openOrCreateDescriptionFile()
            expect(res.fileName).toBe('Stara_Wiezowka.md')
            expect(res.content).toBe('Istniejący opis lokacji.')
            expect(fileManagerState.getActiveFile()).toBe('Stara_Wiezowka.md')
        })

        it('handles entities that use getDescription and entities without description getters', () => {
            const desc = new Description('Opis sceny')
            const mockSceneEntity = {
                getDescription: () => desc,
            }

            selectedItem = {
                id: 'sc_custom',
                type: 'scene',
                name: 'Scena Alternatywna',
                entity: mockSceneEntity as any,
            }

            const res1 = fileManagerState.openOrCreateDescriptionFile()
            expect(res1.fileName).toBe('Description_Scene_Scena_Alternatywna.md')

            // Entity without any description getter
            const bareEntity = {}
            selectedItem = {
                id: 'bare_1',
                type: 'item',
                name: 'Kamień',
                entity: bareEntity as any,
            }
            const res2 = fileManagerState.openOrCreateDescriptionFile()
            expect(res2.fileName).toBe('Description_Item_Kamien.md')
        })
    })

    describe('display name caching and renaming', () => {
        it('allows manual setFileDisplayName and updateFileDisplayNameForEntity', () => {
            fileManagerState.setFileDisplayName('doc_1.md', 'Dokument Początkowy')
            expect(fileManagerState.getFileDisplayName('doc_1.md')).toBe('Dokument Początkowy')

            fileManagerState.updateFileDisplayNameForEntity(
                'Dokument Początkowy',
                'Dokument Zaktualizowany'
            )
            expect(fileManagerState.getFileDisplayName('doc_1.md')).toBe('Dokument Zaktualizowany')

            // Update matching id in key
            fileManagerState.setFileDisplayName('file_item_99.md', 'Stary Miecz')
            fileManagerState.updateFileDisplayNameForEntity(
                'Inna Nazwa',
                'Legendarny Miecz',
                'item_99'
            )
            expect(fileManagerState.getFileDisplayName('file_item_99.md')).toBe('Legendarny Miecz')
        })

        it('retrieves name by basename or basename without extension from cache', () => {
            fileManagerState.setFileDisplayName('notatka', 'Ważna Notatka')
            expect(fileManagerState.getFileDisplayName('C:/Projekty/notatka.md')).toBe(
                'Ważna Notatka'
            )

            fileManagerState.setFileDisplayName('skarb.md', 'Skrzynia Złota')
            expect(fileManagerState.getFileDisplayName('C:\\Gry\\skarb.md')).toBe('Skrzynia Złota')
        })
    })

    describe('resolving display name from Project entities', () => {
        it('finds display name from project entities matching description file path', () => {
            const project = new Project('proj_1', 'Test Project')

            // Paragraph in scene
            const pDesc = new Description('Opis', '', 'Descriptions/p_start.md')
            const p1 = new Paragraph('p_1', 'Prolog', pDesc)
            const scene = new Scene('sc_1', 'Akt 1', new Description(), [p1])
            project.setScenes([scene])

            // Character
            const npcDesc = new Description('Opis', '', 'npc_smok.md')
            const npc = new NPC('npc_smok', 'Czerwony Smok', npcDesc)
            project.setCharacters([npc])

            // Location
            const locDesc = new Description('Opis', '', 'loc_zamek.md')
            const loc = new Location('loc_1', 'Zamek Królewski', locDesc)
            project.setLocations([loc])

            // Item
            const itemDesc = new Description('Opis', '', 'item_miecz.md')
            const item = new Item('item_1', 'Miecz Światła', itemDesc)
            project.setItems([item])

            // PlayerCharacter
            const heroDesc = new Description('Opis', '', 'hero_artur.md')
            const hero = new PlayerCharacter('hero_1', 'Król Artur', heroDesc)
            project.setPlayerCharacter(hero)

            // Inject project into ProjectManager
            ;(ProjectManager.getInstance() as any).currentProject = project

            expect(fileManagerState.getFileDisplayName('p_start.md')).toBe('Prolog')
            expect(fileManagerState.getFileDisplayName('Descriptions/p_start.md')).toBe('Prolog')
            expect(fileManagerState.getFileDisplayName('npc_smok.md')).toBe('Czerwony Smok')
            expect(fileManagerState.getFileDisplayName('loc_zamek.md')).toBe('Zamek Królewski')
            expect(fileManagerState.getFileDisplayName('item_miecz.md')).toBe('Miecz Światła')
            expect(fileManagerState.getFileDisplayName('hero_artur.md')).toBe('Król Artur')

            // Scene entity matching via getTitle and getFilePath
            const titleScene = new Scene(
                'sc_title',
                'Tytułowa Scena',
                new Description('', '', 'scene_title_desc.md')
            )
            const projWithTitle = new Project('proj_title', 'Titled')
            projWithTitle.setScenes([titleScene])
            ;(ProjectManager.getInstance() as any).currentProject = projWithTitle

            expect(fileManagerState.getFileDisplayName('scene_title_desc.md')).toBe(
                'Tytułowa Scena'
            )
        })

        it('falls back to regex parsing when file is not found in cache or project', () => {
            // Description_Category_Name format
            expect(fileManagerState.getFileDisplayName('Description_NPC_Stary_Pustelnik.md')).toBe(
                'Stary Pustelnik'
            )

            // Legacy format: <name>_text or <name>_author
            expect(fileManagerState.getFileDisplayName('rozdział_pierwszy_text.md')).toBe(
                'rozdział pierwszy'
            )
            expect(fileManagerState.getFileDisplayName('notatki_mistrza_author.md')).toBe(
                'notatki mistrza'
            )

            // General fallback: replace underscores with spaces
            expect(fileManagerState.getFileDisplayName('moja_wlasna_notatka.md')).toBe(
                'moja wlasna notatka'
            )
        })
    })
})
