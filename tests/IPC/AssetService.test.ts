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

    it('saves edited image as a new copy with unique slug', async () => {
        const dummyDataUrl = 'data:image/png;base64,aGVsbG8gd29ybGQ='
        const res = await AssetService.saveEditedImage({
            projectPath: tempDir,
            dataUrl: dummyDataUrl,
            originalRelativePath: 'Assets/Images/hero.png',
            overwrite: false,
        })

        expect(res.success).toBe(true)
        expect(res.relativePath).toMatch(/^Assets\/Images\/edited_hero(?:_\d+)?\.png$/)
        expect(res.assetUrl).toBe(`asset://project/${res.relativePath}`)

        const savedPath = path.join(tempDir, res.relativePath)
        expect(fs.existsSync(savedPath)).toBe(true)
        expect(fs.readFileSync(savedPath, 'utf8')).toBe('hello world')
    })

    it('overwrites existing image file when overwrite is true', async () => {
        const imagesDir = path.join(tempDir, 'Assets', 'Images')
        fs.mkdirSync(imagesDir, { recursive: true })
        const targetFile = path.join(imagesDir, 'existing.png')
        fs.writeFileSync(targetFile, 'original content')

        const dummyDataUrl = 'data:image/png;base64,bmV3IGNvbnRlbnQ='
        const res = await AssetService.saveEditedImage({
            projectPath: tempDir,
            dataUrl: dummyDataUrl,
            originalRelativePath: 'Assets/Images/existing.png',
            overwrite: true,
        })

        expect(res.success).toBe(true)
        expect(res.fileName).toBe('existing.png')
        expect(res.relativePath).toBe('Assets/Images/existing.png')
        expect(fs.readFileSync(targetFile, 'utf8')).toBe('new content')
    })

    it('rejects invalid or malformed dataUrl', async () => {
        const res = await AssetService.saveEditedImage({
            projectPath: tempDir,
            dataUrl: 'not-a-valid-data-url',
        })

        expect(res.success).toBe(false)
        expect(res.errorCode).toBe(AssetService.ASSET_ERRORS.INVALID_DATA)
    })

    it('imports file from source path via importFileFromSource', async () => {
        const dummyImage = path.join(tempDir, 'dragged_photo.png')
        fs.writeFileSync(dummyImage, 'dragged image binary content')

        const result = await AssetService.importFileFromSource(tempDir, dummyImage, 'drag')

        expect(result.success).toBe(true)
        expect(result.relativePath).toMatch(/^Assets\/Images\/drag_dragged_photo(?:_\d+)?\.png$/)
        expect(result.assetUrl).toBe(`asset://project/${result.relativePath}`)

        const destination = path.join(tempDir, result.relativePath)
        expect(fs.existsSync(destination)).toBe(true)
        expect(fs.readFileSync(destination, 'utf8')).toBe('dragged image binary content')
    })

    it('getCurrentProjectDir provides a valid workspace directory when none was set', () => {
        const current = ProjectService.getCurrentProjectDir()
        expect(current).toBeTruthy()
        expect(typeof current).toBe('string')
        expect(fs.existsSync(current!)).toBe(true)
    })
})
