import fs from 'fs'
import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const AssetService = require('../../main/services/AssetService.js')
const ProjectService = require('../../main/services/ProjectService.js')

describe('AssetService', () => {
    let tempDir: string

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgp-asset-test-'))
        ProjectService.setCurrentProjectDir(tempDir)
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

    it('successfully imports image file into project Assets/Images directory', async () => {
        const dummyImage = path.join(tempDir, 'sample_photo.png')
        fs.writeFileSync(dummyImage, 'fake image data')

        const result = await AssetService.importFile(tempDir, dummyImage, 'test')

        expect(result.success).toBe(true)
        expect(result.relativePath).toMatch(/^Assets\/Images\/test_sample_photo(?:_\d+)?\.png$/)
        expect(result.assetUrl).toBe(`asset://project/${result.relativePath}`)

        const destination = path.join(tempDir, result.relativePath)
        expect(fs.existsSync(destination)).toBe(true)
        expect(fs.readFileSync(destination, 'utf8')).toBe('fake image data')
    })

    it('rejects unsupported file extensions', async () => {
        const dummyScript = path.join(tempDir, 'evil.exe')
        fs.writeFileSync(dummyScript, 'executable')

        const result = await AssetService.importFile(tempDir, dummyScript, 'test')
        expect(result.success).toBe(false)
        expect(result.errorCode).toBe(AssetService.ASSET_ERRORS.UNSUPPORTED_FORMAT)
    })

    it('rejects non-existent source file', async () => {
        const nonExistent = path.join(tempDir, 'ghost.png')
        const result = await AssetService.importFile(tempDir, nonExistent, 'test')
        expect(result.success).toBe(false)
        expect(result.errorCode).toBe(AssetService.ASSET_ERRORS.FILE_NOT_FOUND)
    })

    it('lists imported image assets from project', async () => {
        const imagesDir = path.join(tempDir, 'Assets', 'Images')
        fs.mkdirSync(imagesDir, { recursive: true })
        fs.writeFileSync(path.join(imagesDir, 'img1.png'), 'data1')
        fs.writeFileSync(path.join(imagesDir, 'img2.jpg'), 'data2')
        fs.writeFileSync(path.join(imagesDir, 'notes.txt'), 'text')

        const res = await AssetService.listProjectAssets({ projectPath: tempDir })
        expect(res.success).toBe(true)
        expect(res.assets.length).toBe(2)
        expect(res.assets.map((a: { fileName: string }) => a.fileName)).toEqual(
            expect.arrayContaining(['img1.png', 'img2.jpg'])
        )
    })
})
