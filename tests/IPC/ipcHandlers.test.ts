import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { generateUniqueSlug, slugifyEntityName } from '../../Utils/pathSanitizer'

function resolveProjectDir(projectPath: string | null | undefined): string | null {
    if (!projectPath || typeof projectPath !== 'string') return null
    if (!fs.existsSync(projectPath)) return null
    try {
        const stat = fs.statSync(projectPath)
        return stat.isDirectory() ? projectPath : path.dirname(projectPath)
    } catch {
        return null
    }
}

function isPathInsideBase(basePath: string, targetPath: string): boolean {
    const resolvedBase = path.resolve(basePath)
    const resolvedTarget = path.resolve(targetPath)
    return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase
}

describe('IPC Handlers & File System Operations', () => {
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
    })

    describe('create-entity handler logic', () => {
        it('tworzy encję, strukturę katalogu i aktualizuje meta.json atomowo', () => {
            const category = 'NPC'
            const categoryDir = path.join(tempDir, category)
            fs.mkdirSync(categoryDir, { recursive: true })

            const metaPath = path.join(categoryDir, 'meta.json')
            fs.writeFileSync(
                metaPath,
                JSON.stringify({
                    opis: `Folder na ${category}`,
                    sciezka: `./${category}`,
                    sciezkiOpisow: [],
                    sciezkiZdjec: [],
                    elementy: [],
                })
            )

            const entityData = {
                id: 'npc_1',
                nazwa: 'Kupiec Jan',
                opis: { tekst: 'Bogaty kupiec' },
            }

            const rawSlug = slugifyEntityName(entityData.nazwa)
            const entityFolderSlug = generateUniqueSlug(rawSlug, candidate =>
                fs.existsSync(path.join(categoryDir, candidate))
            )
            const entityDir = path.join(categoryDir, entityFolderSlug)

            expect(isPathInsideBase(tempDir, entityDir)).toBe(true)
            fs.mkdirSync(entityDir, { recursive: true })

            const elementJsonPath = path.join(entityDir, 'element.json')
            expect(isPathInsideBase(tempDir, elementJsonPath)).toBe(true)

            // Atomic write
            const tempElementPath = `${elementJsonPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempElementPath, JSON.stringify(entityData, null, 2), 'utf8')
            fs.renameSync(tempElementPath, elementJsonPath)

            expect(fs.existsSync(elementJsonPath)).toBe(true)
            const savedEntity = JSON.parse(fs.readFileSync(elementJsonPath, 'utf8'))
            expect(savedEntity.nazwa).toBe('Kupiec Jan')

            // Update meta.json
            const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
            const relativeElementPath = `./${entityFolderSlug}/element.json`
            metaData.elementy.push(relativeElementPath)

            const tempMetaPath = `${metaPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempMetaPath, JSON.stringify(metaData, null, 2), 'utf8')
            fs.renameSync(tempMetaPath, metaPath)

            const updatedMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
            expect(updatedMeta.elementy).toContain('./kupiec_jan/element.json')
        })

        it('odrzuca niebezpieczne nazwy kategorii próbujące path traversal', () => {
            const maliciousCategory = '../../escaped_folder'
            const categoryDir = path.join(tempDir, maliciousCategory)
            expect(isPathInsideBase(tempDir, categoryDir)).toBe(false)
        })
    })

    describe('save-entity handler logic', () => {
        it('zapisuje encję atomowo i odrzuca path traversal', () => {
            const category = 'Lokacje'
            const entityFolder = 'karczma'
            const entityDir = path.join(tempDir, category, entityFolder)
            fs.mkdirSync(entityDir, { recursive: true })

            const entityJsonPath = path.join(tempDir, category, entityFolder, 'element.json')
            expect(isPathInsideBase(tempDir, entityJsonPath)).toBe(true)

            const entityData = { id: 'lok_1', nazwa: 'Karczma Pod Różą' }
            const tempPath = `${entityJsonPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempPath, JSON.stringify(entityData, null, 2), 'utf8')
            fs.renameSync(tempPath, entityJsonPath)

            expect(fs.existsSync(entityJsonPath)).toBe(true)
            expect(JSON.parse(fs.readFileSync(entityJsonPath, 'utf8')).nazwa).toBe(
                'Karczma Pod Różą'
            )

            // Malicious path test
            const maliciousEntityJsonPath = path.join(
                tempDir,
                '..',
                '..',
                'outside',
                'element.json'
            )
            expect(isPathInsideBase(tempDir, maliciousEntityJsonPath)).toBe(false)
        })
    })

    describe('read-markdown-file & save-markdown-file handler logic', () => {
        it('zwraca isVirtual: true gdy plik markdown jeszcze nie istnieje fizycznie na dysku', () => {
            const relativePath = './NPC/straznik/tekst.md'
            const fullPath = path.resolve(tempDir, relativePath)
            expect(isPathInsideBase(tempDir, fullPath)).toBe(true)
            expect(fs.existsSync(fullPath)).toBe(false)
        })

        it('automatycznie tworzy brakujące podkatalogi i zapisuje treść markdown atomowo', () => {
            const relativePath = './NPC/straznik/tekst.md'
            const fullPath = path.resolve(tempDir, relativePath)
            const parentDir = path.dirname(fullPath)

            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true })
            }

            const tempPath = `${fullPath}.${Date.now()}.tmp`
            const content = '# Strażnik miejski\nOpis postaci...'
            fs.writeFileSync(tempPath, content, 'utf8')
            fs.renameSync(tempPath, fullPath)

            expect(fs.existsSync(fullPath)).toBe(true)
            expect(fs.readFileSync(fullPath, 'utf8')).toBe(content)
        })

        it('odrzuca próby odczytu lub zapisu poza katalogiem projektu', () => {
            const maliciousRelativePath = '../../system_secret.md'
            const fullPath = path.resolve(tempDir, maliciousRelativePath)
            expect(isPathInsideBase(tempDir, fullPath)).toBe(false)
        })
    })
})
