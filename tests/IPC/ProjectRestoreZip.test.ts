import AdmZip from 'adm-zip'
import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const ProjectService = require('../../main/services/ProjectService.js')

describe('ProjectService.restoreProjectFromZip Tests', () => {
    let tempDir: string
    let sourceProjectDir: string
    let zipFilePath: string
    let restoreDestinationDir: string

    beforeEach(async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgp-zip-test-'))
        sourceProjectDir = path.join(tempDir, 'sourceProject')
        restoreDestinationDir = path.join(tempDir, 'restoredWorkspace')
        zipFilePath = path.join(tempDir, 'backup.zip')

        fs.mkdirSync(sourceProjectDir, { recursive: true })
        fs.mkdirSync(restoreDestinationDir, { recursive: true })

        // Create standard project in sourceProjectDir
        await ProjectService.createProject({
            id: 'original_project',
            name: 'Oryginalna Przygoda',
            author: 'Mistrz Gry',
            projectPath: sourceProjectDir,
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

    it('zwraca błąd jeśli plik ZIP nie istnieje', async () => {
        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath: path.join(tempDir, 'non_existent.zip'),
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(false)
        expect(res.error).toBeDefined()
    })

    it('zwraca błąd jeśli archiwum ZIP jest puste', async () => {
        const emptyZip = new AdmZip()
        const emptyZipPath = path.join(tempDir, 'empty.zip')
        emptyZip.writeZip(emptyZipPath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath: emptyZipPath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(false)
        expect(res.error).toBeDefined()
    })

    it('zwraca błąd jeśli archiwum ZIP nie zawiera project.json', async () => {
        const invalidZip = new AdmZip()
        invalidZip.addFile('notes.txt', Buffer.from('hello world'))
        const invalidZipPath = path.join(tempDir, 'no_manifest.zip')
        invalidZip.writeZip(invalidZipPath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath: invalidZipPath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(false)
        expect(res.error).toContain('project.json')
    })

    it('blokuje próbę ataku Zip Slip (ścieżka wykraczająca poza katalog docelowy)', async () => {
        const maliciousZip = new AdmZip()
        maliciousZip.addFile(
            'project.json',
            Buffer.from(
                JSON.stringify({
                    name: 'Malicious Project',
                    descriptionPaths: [],
                    dataPaths: [],
                })
            )
        )
        maliciousZip.addFile('evil.txt', Buffer.from('malicious payload'))
        const evilEntry = maliciousZip.getEntries().find(e => e.entryName === 'evil.txt')
        if (evilEntry) {
            evilEntry.entryName = '../../evil.txt'
        }
        const maliciousZipPath = path.join(tempDir, 'malicious.zip')
        maliciousZip.writeZip(maliciousZipPath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath: maliciousZipPath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(false)
        expect(res.error).toContain('Zip Slip')
        expect(fs.existsSync(path.join(tempDir, 'evil.txt'))).toBe(false)
    })

    it('prawidłowo przywraca projekt z poprawnie sformatowanego archiwum ZIP', async () => {
        // Zip the sourceProjectDir
        const zip = new AdmZip()
        zip.addLocalFolder(sourceProjectDir)
        zip.writeZip(zipFilePath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(true)
        expect(res.project).toBeDefined()
        expect(res.project.name).toBe('Oryginalna Przygoda')
        expect(res.path).toBeDefined()
        expect(fs.existsSync(res.path)).toBe(true)
    })

    it('tworzy odrębny podfolder projektu jeśli katalog docelowy zawiera już inne pliki', async () => {
        // Create an existing file in restoreDestinationDir
        fs.writeFileSync(path.join(restoreDestinationDir, 'existing_file.txt'), 'already here')

        const zip = new AdmZip()
        zip.addLocalFolder(sourceProjectDir)
        zip.writeZip(zipFilePath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(true)
        // Check that existing file wasn't destroyed
        expect(fs.existsSync(path.join(restoreDestinationDir, 'existing_file.txt'))).toBe(true)
        // Check that project was extracted into a dedicated subfolder
        expect(path.dirname(res.path)).not.toBe(restoreDestinationDir)
        expect(path.dirname(res.path).startsWith(restoreDestinationDir)).toBe(true)
    })

    it('prawidłowo wykrywa projekt gdy archiwum ZIP zawiera katalog nadrzędny', async () => {
        const wrappedZip = new AdmZip()
        wrappedZip.addLocalFolder(sourceProjectDir, 'WrappedProjectFolder')
        const wrappedZipPath = path.join(tempDir, 'wrapped.zip')
        wrappedZip.writeZip(wrappedZipPath)

        const res = await ProjectService.restoreProjectFromZip({
            zipFilePath: wrappedZipPath,
            targetDestinationDir: restoreDestinationDir,
        })

        expect(res.success).toBe(true)
        expect(res.project.name).toBe('Oryginalna Przygoda')
    })
})
