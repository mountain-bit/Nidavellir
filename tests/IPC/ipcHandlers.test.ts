import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

const {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
    atomicWriteStringSync,
    atomicWriteJsonSync,
} = require('../../Utils/fsSecurity.js')

const ProjectService = require('../../main/services/ProjectService.js')
const EntityService = require('../../main/services/EntityService.js')
const MarkdownService = require('../../main/services/MarkdownService.js')
const RecentProjectsService = require('../../main/services/RecentProjectsService.js')

describe('Main Process Services & File System Operations', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'silnik-ipc-test-'))
    })

    afterEach(() => {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        } catch {
            // ignore cleanup error
        }
    })

    describe('fsSecurity utilities', () => {
        describe('resolveProjectDir', () => {
            it('zwraca ścieżkę katalogu dla istniejącego folderu', () => {
                expect(resolveProjectDir(tempDir)).toBe(tempDir)
            })

            it('zwraca katalog nadrzędny dla istniejącego pliku project.json', () => {
                const projectFile = path.join(tempDir, 'project.json')
                fs.writeFileSync(projectFile, '{}')
                expect(resolveProjectDir(projectFile)).toBe(tempDir)
            })

            it('zwraca null i nie rzuca błędu dla nieistniejącej ścieżki', () => {
                const nonExistent = path.join(tempDir, 'non_existent_folder_xyz')
                expect(resolveProjectDir(nonExistent)).toBeNull()
                expect(resolveProjectDir('')).toBeNull()
                expect(resolveProjectDir(null as unknown as string)).toBeNull()
            })
        })

        describe('isPathInsideBase (Path Traversal Protection)', () => {
            it('akceptuje ścieżki wewnątrz katalogu bazowego', () => {
                const subFile = path.join(tempDir, 'NPC', 'straznik', 'element.json')
                expect(isPathInsideBase(tempDir, subFile)).toBe(true)
            })

            it('odrzuca ścieżki wychodzące poza bazę (np. ../../etc/passwd)', () => {
                const maliciousPath = path.join(tempDir, '..', '..', 'windows', 'system32')
                expect(isPathInsideBase(tempDir, maliciousPath)).toBe(false)
            })

            it('odrzuca ścieżki o zbliżonej nazwie prefixu ale poza folderem (np. /temp-other)', () => {
                const similarPath = tempDir + '-other/file.json'
                expect(isPathInsideBase(tempDir, similarPath)).toBe(false)
            })

            it('zwraca false dla nieprawidłowych argumentów', () => {
                expect(isPathInsideBase('', tempDir)).toBe(false)
                expect(isPathInsideBase(tempDir, '')).toBe(false)
                expect(isPathInsideBase(null as any, tempDir)).toBe(false)
            })
        })

        describe('validateProjectData', () => {
            it('zwraca true dla poprawnego obiektu projektu', () => {
                const validData = {
                    nazwa: 'Test Game',
                    sciezkiOpisow: [],
                    sciezkiDanych: [],
                }
                expect(validateProjectData(validData)).toBe(true)
            })

            it('zwraca false dla brakujących lub błędnych pól', () => {
                expect(validateProjectData(null)).toBe(false)
                expect(validateProjectData({})).toBe(false)
                expect(
                    validateProjectData({
                        nazwa: 123,
                        sciezkiOpisow: [],
                        sciezkiDanych: [],
                    })
                ).toBe(false)
                expect(
                    validateProjectData({
                        nazwa: 'Test',
                        sciezkiOpisow: 'invalid',
                        sciezkiDanych: [],
                    })
                ).toBe(false)
            })
        })

        describe('atomic writes', () => {
            it('atomowo zapisuje string oraz tworzy katalogi nadrzędne', () => {
                const targetFile = path.join(tempDir, 'nested', 'deep', 'note.txt')
                atomicWriteStringSync(targetFile, 'Hello World')
                expect(fs.existsSync(targetFile)).toBe(true)
                expect(fs.readFileSync(targetFile, 'utf8')).toBe('Hello World')
            })

            it('atomowo zapisuje obiekt JSON', () => {
                const targetJson = path.join(tempDir, 'data.json')
                atomicWriteJsonSync(targetJson, { foo: 'bar' })
                expect(fs.existsSync(targetJson)).toBe(true)
                expect(JSON.parse(fs.readFileSync(targetJson, 'utf8'))).toEqual({ foo: 'bar' })
            })
        })
    })

    describe('ProjectService', () => {
        it('tworzy strukturę nowego projektu z folderami i meta.json', async () => {
            const result = await ProjectService.createProject({
                id: 'moj_projekt',
                nazwa: 'Moja Przygoda',
                autor: 'Jan Kowalski',
                projectPath: tempDir,
            })

            expect(result.success).toBe(true)
            expect(result.path).toBe(path.join(tempDir, 'project.json'))

            const projectJson = JSON.parse(fs.readFileSync(result.path!, 'utf8'))
            expect(projectJson.nazwa).toBe('Moja Przygoda')
            expect(projectJson.autor).toBe('Jan Kowalski')
            expect(projectJson.sciezkiDanych.length).toBeGreaterThan(0)

            // Verify NPC folder & meta.json
            const npcMetaPath = path.join(tempDir, 'NPC', 'meta.json')
            expect(fs.existsSync(npcMetaPath)).toBe(true)
            const npcMeta = JSON.parse(fs.readFileSync(npcMetaPath, 'utf8'))
            expect(npcMeta.sciezka).toBe('./NPC')
        })

        it('otwiera poprawny projekt i wczytuje encje', async () => {
            await ProjectService.createProject({
                nazwa: 'Gra Testowa',
                projectPath: tempDir,
            })

            // Add an entity
            await EntityService.createEntity({
                projectPath: tempDir,
                category: 'NPC',
                entityData: { id: 'npc_1', nazwa: 'Bohater' },
            })

            const openResult = await ProjectService.openProject(tempDir)
            expect(openResult.success).toBe(true)
            expect(openResult.project.nazwa).toBe('Gra Testowa')
            expect(openResult.entities.NPC).toBeDefined()
            expect(openResult.entities.NPC.length).toBe(1)
            expect(openResult.entities.NPC[0].nazwa).toBe('Bohater')
        })

        it('zwraca błąd dla nieistniejącej ścieżki projektu', async () => {
            const result = await ProjectService.openProject(
                path.join(tempDir, 'nieistniejacy_katalog')
            )
            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
            expect(result.error!.length).toBeGreaterThan(0)
        })
    })

    describe('EntityService', () => {
        it('tworzy encję, strukturę katalogu i aktualizuje meta.json atomowo', async () => {
            await ProjectService.createProject({ projectPath: tempDir })

            const entityData = {
                nazwa: 'Kupiec Jan',
                opis: { tekst: 'Bogaty kupiec' },
            }

            const result = await EntityService.createEntity({
                projectPath: tempDir,
                category: 'NPC',
                entityData,
            })

            expect(result.success).toBe(true)
            expect(result.entityPath).toBeDefined()
            expect(fs.existsSync(result.entityPath!)).toBe(true)

            const saved = JSON.parse(fs.readFileSync(result.entityPath!, 'utf8'))
            expect(saved.nazwa).toBe('Kupiec Jan')
            expect(saved.opis.sciezkaTekst).toBe('./NPC/kupiec_jan/tekst.md')

            const meta = JSON.parse(fs.readFileSync(path.join(tempDir, 'NPC', 'meta.json'), 'utf8'))
            expect(meta.elementy).toContain('./kupiec_jan/element.json')
        })

        it('zapisuje encję przez saveEntity i odrzuca path traversal', async () => {
            await ProjectService.createProject({ projectPath: tempDir })

            await EntityService.createEntity({
                projectPath: tempDir,
                category: 'Lokacje',
                entityData: { id: 'lok_1', nazwa: 'Karczma' },
                folderName: 'karczma',
            })

            const updateResult = await EntityService.saveEntity({
                projectPath: tempDir,
                category: 'Lokacje',
                entityFolder: 'karczma',
                entityData: { id: 'lok_1', nazwa: 'Karczma Pod Różą' },
            })

            expect(updateResult.success).toBe(true)
            const updated = JSON.parse(
                fs.readFileSync(path.join(tempDir, 'Lokacje', 'karczma', 'element.json'), 'utf8')
            )
            expect(updated.nazwa).toBe('Karczma Pod Różą')

            const maliciousResult = await EntityService.saveEntity({
                projectPath: tempDir,
                category: '../../outside',
                entityFolder: 'karczma',
                entityData: { id: 'bad' },
            })
            expect(maliciousResult.success).toBe(false)
        })
    })

    describe('MarkdownService', () => {
        it('zwraca isVirtual: true gdy plik markdown jeszcze nie istnieje fizycznie na dysku', async () => {
            const readResult = await MarkdownService.readMarkdownFile({
                projectPath: tempDir,
                relativePath: './NPC/straznik/tekst.md',
            })
            expect(readResult.success).toBe(true)
            expect(readResult.isVirtual).toBe(true)
            expect(readResult.content).toBe('')
        })

        it('automatycznie tworzy brakujące podkatalogi i zapisuje treść markdown atomowo', async () => {
            const relativePath = './NPC/straznik/tekst.md'
            const content = '# Strażnik miejski\nOpis postaci...'

            const saveResult = await MarkdownService.saveMarkdownFile({
                projectPath: tempDir,
                relativePath,
                content,
            })

            expect(saveResult.success).toBe(true)
            expect(saveResult.recreated).toBe(true)

            const readResult = await MarkdownService.readMarkdownFile({
                projectPath: tempDir,
                relativePath,
            })
            expect(readResult.success).toBe(true)
            expect(readResult.isVirtual).toBe(false)
            expect(readResult.content).toBe(content)
        })

        it('odrzuca próby odczytu lub zapisu poza katalogiem projektu', async () => {
            const maliciousRead = await MarkdownService.readMarkdownFile({
                projectPath: tempDir,
                relativePath: '../../secret.md',
            })
            expect(maliciousRead.success).toBe(false)

            const maliciousSave = await MarkdownService.saveMarkdownFile({
                projectPath: tempDir,
                relativePath: '../../secret.md',
                content: 'bad',
            })
            expect(maliciousSave.success).toBe(false)
        })
    })

    describe('RecentProjectsService', () => {
        it('zapisuje i odczytuje listę ostatnich projektów', () => {
            const projectPath = path.join(tempDir, 'project.json')
            RecentProjectsService.saveRecentProject(projectPath, 'Test Project')

            const recent = RecentProjectsService.getRecentProjects()
            expect(Array.isArray(recent)).toBe(true)
            const item = recent.find((p: any) => p.path === projectPath)
            expect(item).toBeDefined()
            expect(item.name).toBe('Test Project')
        })
    })
})
